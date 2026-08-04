# Backend de EnglishLoop

Esta es la guía técnica del backend actual. El backend es un monolito modular
dentro de Next.js: el dominio y los casos de uso no dependen de Next, Prisma,
Better Auth ni de la forma concreta de transportar las peticiones.

Este documento es la fuente de verdad del backend de la release 1: explica cómo
está organizado, cómo se ejecuta y qué límites de despliegue siguen abiertos.

## Estado actual

Está terminado el backend funcional local: catálogo desde `DATASET/` o desde
el catálogo relacional publicado, sesiones, práctica, corrección determinista,
progreso, repaso, API, Server Actions, SQLite y la persistencia D1 por binding
o HTTP.

Siguen como preparación de producción la ejecución del runner PostgreSQL contra
una instancia aislada, la expiración E2E con reloj controlable y la integración
con un proveedor externo de observabilidad. El runner E2E autenticado cubre ya
el recorrido diario/focused y usa una SQLite aislada.

## Arquitectura

```text
app/                         adaptadores de entrada Next.js
  api/                       Route Handlers REST
  actions/                   Server Actions
core/                        dominio, casos de uso y puertos
adapters/                    adaptadores de contenido, REST y navegador
server/infrastructure/      Prisma, Better Auth, configuración y composición
prisma/                      esquema y migraciones
DATASET/                     fuente editorial del contenido
workers/d1-proxy.ts          proxy HTTP opcional hacia Cloudflare D1
```

El flujo normal es:

```text
Route Handler / Server Action
        ↓
caso de uso del core
        ↓
puertos de dominio
        ↓
adaptador elegido en CompositionRoot
        ↓
SQLite/PostgreSQL/MariaDB o catálogo D1 nativo
```

Las Route Handlers y las Server Actions comparten los mismos casos de uso.
No se hacen peticiones HTTP internas desde Server Components o Server
Actions.

### Frontera `server-only`

Los módulos que pueden entrar en el bundle de Next y contienen secretos,
Prisma, Better Auth o acceso a headers importan `server-only`. Los módulos
runtime-neutrales compartidos por el CLI de seed y por Workers (por ejemplo,
operaciones D1 y el núcleo del writer Prisma) no lo importan deliberadamente:
esa separación permite reutilizar la lógica sin hacer que un script o un
Worker dependa de la resolución de Next.

## Fuente de contenido y catálogo relacional

`DATASET/` es la fuente editorial. Puede leerse directamente con
`CONTENT_SOURCE=dataset` o importarse a un catálogo relacional con
`CONTENT_SOURCE=database`.

El catálogo relacional separa identidades estables de versiones inmutables:

- `CatalogRelease` registra una importación y su checksum.
- `CatalogPublication(id = "active")` apunta al release publicado.
- `Lesson` / `LessonVersion` representan lecciones versionadas.
- `LessonVersion.prerequisites` conserva los IDs de lecciones que deben estar
  completadas antes de que el planificador diario seleccione la lección.
- `Activity` / `ActivityVersion` representan actividades versionadas.
- `TaxonomyNode` / `TaxonomyNodeVersion` representan la taxonomía.
- Las relaciones, opciones, tokens, pares y respuestas esperadas están
  normalizadas.
- `ActivityAttempt` conserva el `activityVersionId` histórico.
- `PracticeRunItem` conserva la actividad original, su `activityVersionId`, sus
  repeticiones y un `activitySnapshot` materializado; la corrección y el
  feedback usan ese snapshot fijado sin exponer el DTO/evaluador al cliente.

Los identificadores editoriales (`lessonId`, `activityId` y
`taxonomyNodeId`) se mantienen como referencias estables del catálogo, no como
foreign keys obligatorias en los modelos de progreso. Esto permite usar
`CONTENT_SOURCE=dataset` sin exigir que el contenido haya sido importado a la
misma base; las relaciones internas y todas las relaciones de versiones sí
están protegidas por foreign keys.

Los lectores solo siguen el puntero `active` y aceptan releases con estado
`published`. Un release `preparing` o `failed` nunca se expone a la práctica.

## Configuración

La configuración se carga y valida en
[`server/infrastructure/config/config.ts`](../server/infrastructure/config/config.ts).
El fichero [.env.example](../.env.example) contiene una plantilla comentada.

### Variables principales

| Variable | Valores | Uso |
| --- | --- | --- |
| `CONTENT_SOURCE` | `dataset`, `database` | Fuente de lectura del catálogo. |
| `DATABASE_PROVIDER` | `sqlite`, `d1`, `postgresql`, `mariadb` | Motor elegido para el despliegue. |
| `DATABASE_URL` | URL del proveedor SQL | SQLite, PostgreSQL o MariaDB. No se usa para D1. |
| `NEXT_PUBLIC_DATA_SOURCE` | `rest`, `mock` | Selecciona contenido y aprendizaje. La autenticación siempre es real; `/demo` usa datos de demostración de solo lectura. |
| `D1_TRANSPORT` | `binding`, `http` | Solo aplica cuando `DATABASE_PROVIDER=d1`. |
| `D1_HTTP_URL` | URL HTTPS | Endpoint del Worker proxy para Node/Vercel. |
| `D1_HTTP_TOKEN` | secreto | Token compartido entre Vercel y el Worker. |
| `PRISMA_TRANSACTION_RETRY_MAX` | entero no negativo | Reintentos adicionales ante conflictos Prisma `P2034`; `0` desactiva. |
| `PUBLIC_PAGE_DEFAULT_LIMIT` | entero positivo | Tamaño por defecto de los listados públicos. |
| `PUBLIC_PAGE_MAX_LIMIT` | entero positivo | Límite máximo aceptado por petición. |
| `BETTER_AUTH_SECRET` | secreto | Firma y protección de sesiones. Obligatorio en producción. |
| `BETTER_AUTH_URL` | URL | URL pública de Better Auth. |

Las políticas operativas también son configurables:

```dotenv
AUTH_SESSION_EXPIRES_IN_SECONDS=604800
AUTH_SESSION_UPDATE_AGE_SECONDS=86400
AUTH_COOKIE_CACHE_MAX_AGE_SECONDS=300
ATTEMPT_RATE_LIMIT_WINDOW_MS=60000
ATTEMPT_RATE_LIMIT_MAX=30
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_RATE_LIMIT_MAX=10
PRISMA_TRANSACTION_RETRY_MAX=2
PUBLIC_PAGE_DEFAULT_LIMIT=25
PUBLIC_PAGE_MAX_LIMIT=100
HTTP_MAX_REQUEST_BODY_BYTES=1048576
HTTP_MAX_RESPONSE_BODY_BYTES=1048576
```

Se validan como enteros positivos, salvo `PRISMA_TRANSACTION_RETRY_MAX`, que
acepta cero para desactivar reintentos. Estas variables permiten ajustar una
instalación sin cambiar el código, pero no modifican las reglas pedagógicas.

`withErrorHandling` rechaza cuerpos de petición que superen el límite incluso
cuando llegan en streaming y verifica el tamaño de las respuestas antes de
entregarlas. Un request demasiado grande devuelve `413`; una respuesta interna
demasiado grande se registra como error de infraestructura sin exponer su
contenido.

## Cuenta y seguridad

La ruta `app/api/auth/[...all]` delega en Better Auth y mantiene sus tipos
aislados en infraestructura. La aplicación expone mediante `AuthPort` los
comandos que necesita la pantalla de ajustes:

- actualizar el nombre visible del perfil;
- cambiar la contraseña indicando la contraseña actual;
- revocar las demás sesiones al cambiarla.

La pantalla está en
[`ProfileSecurityForms.tsx`](../features/settings/ProfileSecurityForms.tsx) y
las mutaciones atraviesan Server Actions, no lógica de negocio duplicada en
un Client Component. Better Auth aplica la validación final de la contraseña y
guarda su hash en `Account`; la UI solo ofrece validación inmediata y nunca
registra contraseñas.

Todavía no se habilitan cambio de email, recuperación de contraseña por correo
ni borrado de cuenta. Esos flujos requieren verificación de email, un
transportador de correo y decidir qué hacer con intentos, progreso, sesiones y
datos editoriales asociados. Activar el borrado de Better Auth antes de esa
política podría dejar datos de aprendizaje huérfanos.

### Paginación de los listados públicos

`GET /api/v1/lessons` y `GET /api/v1/activities` devuelven un envelope estable:

```json
{
  "items": [],
  "nextCursor": "...",
  "hasMore": true
}
```

`limit` es opcional y queda limitado por `PUBLIC_PAGE_MAX_LIMIT`. Para obtener
la siguiente página se reenvía el `nextCursor` como parámetro `cursor`. El
cursor es opaco, versionado y se basa en el ID editorial estable; los
adaptadores filesystem, Prisma y D1 aplican la misma ordenación ascendente y
semántica keyset. Los planificadores internos siguen usando sus consultas
completas y no dependen de este envelope HTTP.

## Matriz de proveedores

| --- | --- | --- | --- |
| SQLite | `@prisma/adapter-better-sqlite3` | Desarrollo local y tests de integración | Disponible |
| PostgreSQL | `@prisma/adapter-pg` | Despliegues Node/Vercel convencionales | Adaptador disponible |
| MariaDB | `@prisma/adapter-mariadb` | Despliegues MariaDB | Adaptador disponible |
| D1 binding | `D1BindingClient` + `PersistenceBundle` | Worker de Cloudflare | Repositorios nativos y batch disponibles |
| D1 HTTP | `D1HttpClient` + Worker proxy + `PersistenceBundle` | Un proceso Node/Vercel que accede a D1 | Repositorios nativos y batch disponibles |

SQLite, PostgreSQL y MariaDB se seleccionan mediante la factoría
[`prisma-adapter-factory.ts`](../server/infrastructure/database/prisma-adapter-factory.ts).
D1 nunca se redirige silenciosamente a SQLite; si se intenta usar Prisma con
D1, el arranque falla explícitamente.

## D1 en Cloudflare y Vercel

### Cloudflare: binding nativo

El Worker [`workers/d1-proxy.ts`](../workers/d1-proxy.ts) recibe un binding
llamado `DB`. La configuración de ejemplo está en
[`wrangler.d1.example.jsonc`](../wrangler.d1.example.jsonc).

```dotenv
DATABASE_PROVIDER=d1
D1_TRANSPORT=binding
```

El token del proxy no se guarda en el fichero de Wrangler:

```bash
wrangler secret put D1_HTTP_TOKEN
```

### Vercel: HTTP autenticado

Vercel no tiene el binding de Cloudflare. Configura las variables en el
proyecto Vercel:

```dotenv
DATABASE_PROVIDER=d1
D1_TRANSPORT=http
D1_HTTP_URL=https://english-loop-d1-proxy.example.workers.dev
D1_HTTP_TOKEN=secreto-compartido
```

[`createD1Transport`](../server/infrastructure/persistence/d1/d1-runtime.ts)
selecciona `D1BindingClient` para `binding` y `D1HttpClient` para `http`.
`PersistenceBundle` inyecta ese transporte en repositorios separados por
contexto; la UoW D1 agrupa las escrituras del callback en un único
`D1.batch()` atómico.
El cliente HTTP envía operaciones tipadas con:

- token Bearer;
- timestamp con tolerancia limitada;
- nonce de un solo uso;
- comparación constante del token;
- batches acotados;
- ningún SQL enviado por el cliente.

El protocolo D1 actual permite operaciones explícitas de health, metadatos del
catálogo, lectura de actividad, consumo de verificaciones y protección contra
replay. Las sentencias SQL están en el adaptador del Worker y usan parámetros.

### Límites actuales de D1

La persistencia de las entidades del core, el rate limiting y el seed editorial
por chunks ya se seleccionan mediante `PersistenceBundle`; Better Auth dispone
de un adaptador D1 nativo. El endpoint de auth de una aplicación Cloudflare
debe construir `createAuth({ binding: { DB } })` en su entrypoint para inyectar
el binding; el `auth` singleton de Next sigue siendo la ruta Node/Vercel por
defecto. `getCatalogWritePort()` rechaza D1 solo si no existe transporte D1
configurado.

## Migraciones y seed

Las migraciones son progresivas. No se debe editar una migración ya aplicada
para introducir cambios históricos; se añade una nueva migración.

Comandos principales:

```bash
# Validar el esquema y sus variantes de proveedor
pnpm db:check-parity
pnpm db:render-schema postgresql prisma/generated/schema.postgresql.prisma

# Validar y simular el seed sin escribir
pnpm dataset:seed -- --dry-run

# Aplicar la historia SQLite/D1 en local
pnpm prisma migrate deploy

# PostgreSQL/MariaDB: generar y revisar una baseline específica del proveedor
# antes de aplicarla; no usar migrate deploy directamente sobre esos motores.
pnpm db:render-schema postgresql /tmp/english-loop.schema.postgresql.prisma
pnpm prisma migrate diff --from-empty --to-schema /tmp/english-loop.schema.postgresql.prisma --script

# Seed estándar de Prisma SQL: lee Markdown y JSON del DATASET
pnpm db:seed

# D1: copia la plantilla a una configuración local y usa Wrangler
cp wrangler.d1.example.jsonc wrangler.d1.jsonc
pnpm d1:migrate:local
pnpm d1:migrate:remote
pnpm d1:dev

# Seed directo para proveedores Prisma SQL o D1 HTTP
pnpm dataset:seed
```

`pnpm db:seed` delega en el mismo importador que `pnpm dataset:seed`, por lo
que ambos leen `DATASET/lessons/**/*.md` y `DATASET/activities/**/*.json`,
validan el dataset, calculan el checksum, crean un release y publican el
puntero solo después de completar la carga. Es idempotente para la misma
versión y checksum. `--dry-run` no abre ni modifica la base de datos. El seed
no crea usuarios ni credenciales: esas cuentas pertenecen a Better Auth.

Para D1, el script de Node/Vercel usa el writer HTTP autenticado. En un
Worker Cloudflare se puede usar directamente `D1CatalogWriteAdapter` con el
binding `DB`; el script CLI no intenta inventar un binding, por lo que exige
`D1_TRANSPORT=http` y las credenciales del proxy.
La guía paso a paso para bootstrap, backup, Vercel, Cloudflare y las
limitaciones actuales de PostgreSQL/MariaDB está en
[`BACKEND-DEPLOYMENT-NEXT-STEPS.md`](./BACKEND-DEPLOYMENT-NEXT-STEPS.md).
La configuración de Wrangler conserva `prisma/migrations` como directorio y
declara `migrations_pattern=prisma/migrations/*/migration.sql` para descubrir
la estructura anidada generada por Prisma; no se deben copiar ni editar esas
migraciones para crear una segunda historia de esquema.

## Intentos, puntuación y repaso

- Los intentos son inmutables y tienen una clave de idempotencia por usuario.
- El score se calcula sobre las actividades originales, no sobre las
  repeticiones.
- Un fallo puede crear una sola repetición al final de la sesión.
- La repetición recuperada se registra separadamente y no elimina por sí sola
  el repaso persistente.
- `SMART_REVIEW` progresa por etapas; los aciertos programan aproximadamente
  los siguientes repasos a 3 y 7 días y el tercero resuelve el pendiente.
- El planificador diario prioriza lecciones con errores pendientes antes de
  seleccionar contenido nuevo.

Estas reglas son parte del dominio y no deben trasladarse al `.env`.

## Qué va al `.env` y qué queda en código

Va al `.env` lo que depende del despliegue: proveedor, URL, secretos,
duraciones de sesión y límites operativos, incluidos los límites de paginación
HTTP.

Queda versionado como constante lo que define el contrato del producto o del
protocolo: tamaños de sesión `5/10/15/20`, estados de publicación, publicación
activa, versión del esquema, etapas de repaso, intervalos pedagógicos y
límites estructurales de D1.

Así un cambio de infraestructura no puede modificar accidentalmente la
semántica del aprendizaje ni relajar la seguridad del protocolo.

## Pruebas y verificación

```bash
pnpm typecheck
pnpm lint
pnpm arch:check
pnpm test:unit
pnpm test:integration:catalog
pnpm test:e2e
TEST_POSTGRES_DATABASE_URL=postgresql://... pnpm test:postgres
```

Las pruebas relevantes incluyen:

- contratos de adaptadores y mapeadores del catálogo;
- seed idempotente, publicación atómica y rollback;
- configuración de proveedores y rechazo del fallback D1 → SQLite;
- operaciones D1 binding/HTTP, batches, autenticación y anti-replay;
- reglas de repetición, score y repaso;
- límites HTTP y métricas agregadas de latencia/errores por endpoint;
- métricas pedagógicas acotadas de intentos, idempotencia, sesiones, runs por
  modo/nodo, scopes insuficientes y tamaño de cola de repaso;
- snapshot materializado de `PracticeRunItem` verificado en Prisma, D1 y E2E;
- registro, login, logout, actualización de perfil, cambio de contraseña y
  acceso autenticado contra una base E2E aislada;
- límites arquitectónicos con `dependency-cruiser`.

La configuración de Vitest excluye módulos declarativos `types/`, `type.ts` y
los contratos de puertos del cálculo ejecutable. Los umbrales globales son
`80%` para statements, lines y functions, y `90%` para branches. La última
ejecución global completa pasó con `95.97%` de statements, `90.52%` de
branches, `96.32%` de functions y `97.46%` de lines. La validación directa del
dataset pasa con `124` lecciones, `12.100` actividades, `164` nodos y cero
errores. El seed de `dev.db` se ejecutó dos veces: la primera publicó el release
y la segunda devolvió `unchanged`, sin duplicar versiones.

Para cambios de comportamiento es obligatorio añadir la prueba en el mismo
cambio. No se debe usar `skip` para ocultar una regresión.

## Archivos de referencia

- [`ARCHITECTURE.md`](./ARCHITECTURE.md): límites de módulos y puntos de
  composición.
- [`BACKEND-DEPLOYMENT-NEXT-STEPS.md`](./BACKEND-DEPLOYMENT-NEXT-STEPS.md):
  guía de deploy y validación para SQLite, PostgreSQL, MariaDB, D1, Vercel y
  Cloudflare.
- [`../.env.example`](../.env.example): configuración comentada.
- [`../prisma/schema.prisma`](../prisma/schema.prisma): modelo persistente.
- [`../server/infrastructure/composition/composition-root.ts`](../server/infrastructure/composition/composition-root.ts): composición de adaptadores.
- [`DATASET-CONTENT-WORKFLOWS.md`](./DATASET-CONTENT-WORKFLOWS.md): flujo editorial y de importación.
