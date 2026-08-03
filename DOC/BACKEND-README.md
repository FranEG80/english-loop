# Backend de EnglishLoop

Esta es la guía técnica del backend actual. El backend es un monolito modular
dentro de Next.js: el dominio y los casos de uso no dependen de Next, Prisma,
Better Auth ni de la forma concreta de transportar las peticiones.

El plan de trabajo está en [`BACKEND-PLAN.md`](./BACKEND-PLAN.md). Este
documento explica cómo está organizado, cómo se ejecuta y qué partes están
listas o siguen en evolución.

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

## Fuente de contenido y catálogo relacional

`DATASET/` es la fuente editorial. Puede leerse directamente con
`CONTENT_SOURCE=dataset` o importarse a un catálogo relacional con
`CONTENT_SOURCE=database`.

El catálogo relacional separa identidades estables de versiones inmutables:

- `CatalogRelease` registra una importación y su checksum.
- `CatalogPublication(id = "active")` apunta al release publicado.
- `Lesson` / `LessonVersion` representan lecciones versionadas.
- `Activity` / `ActivityVersion` representan actividades versionadas.
- `TaxonomyNode` / `TaxonomyNodeVersion` representan la taxonomía.
- Las relaciones, opciones, tokens, pares y respuestas esperadas están
  normalizadas.
- `ActivityAttempt` conserva el `activityVersionId` histórico.
- `PracticeRunItem` conserva la actividad original y sus repeticiones.

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
| `D1_TRANSPORT` | `binding`, `http` | Solo aplica cuando `DATABASE_PROVIDER=d1`. |
| `D1_HTTP_URL` | URL HTTPS | Endpoint del Worker proxy para Node/Vercel. |
| `D1_HTTP_TOKEN` | secreto | Token compartido entre Vercel y el Worker. |
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
```

Se validan como enteros positivos. Estas variables permiten ajustar una
instalación sin cambiar el código, pero no modifican las reglas pedagógicas.

## Matriz de proveedores

| Proveedor | Adaptador actual | Uso recomendado | Estado |
| --- | --- | --- | --- |
| SQLite | `@prisma/adapter-better-sqlite3` | Desarrollo local y tests de integración | Disponible |
| PostgreSQL | `@prisma/adapter-pg` | Despliegues Node/Vercel convencionales | Adaptador disponible |
| MariaDB | `@prisma/adapter-mariadb` | Despliegues MariaDB | Adaptador disponible |
| D1 binding | `D1BindingClient` | Worker de Cloudflare | Transporte tipado disponible |
| D1 HTTP | `D1HttpClient` + Worker proxy | Un proceso Node/Vercel que accede a D1 | Transporte tipado disponible |

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

### Límite actual de D1

El transporte y el proxy están implementados y probados, pero la composición
completa de la aplicación todavía usa Prisma para los repositorios generales
y Better Auth. Por tanto, el soporte D1 end-to-end de usuarios, sesiones,
progreso, intentos y repasos requiere completar el `PersistenceBundle` nativo
de D1. No se debe declarar producción completa con `DATABASE_PROVIDER=d1`
hasta cerrar esa parte.

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

# Aplicar migraciones a la base configurada
pnpm prisma migrate deploy

# Seed real para proveedores Prisma SQL
pnpm dataset:seed
```

El seed actual valida el dataset, calcula checksum, crea un release y publica
el puntero solo después de completar la carga. Es idempotente para la misma
versión y checksum. `--dry-run` no abre ni modifica la base de datos.

El seed nativo para D1 local/remoto todavía forma parte del trabajo pendiente
del bundle D1; el script actual rechaza D1 antes de intentar usar SQLite.

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
duraciones de sesión y límites operativos.

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
```

Las pruebas relevantes incluyen:

- contratos de adaptadores y mapeadores del catálogo;
- seed idempotente, publicación atómica y rollback;
- configuración de proveedores y rechazo del fallback D1 → SQLite;
- operaciones D1 binding/HTTP, batches, autenticación y anti-replay;
- reglas de repetición, score y repaso;
- límites arquitectónicos con `dependency-cruiser`.

Para cambios de comportamiento es obligatorio añadir la prueba en el mismo
cambio. No se debe usar `skip` para ocultar una regresión.

## Archivos de referencia

- [`BACKEND-PLAN.md`](./BACKEND-PLAN.md): hoja de ruta y decisiones de trabajo.
- [`../.env.example`](../.env.example): configuración comentada.
- [`../prisma/schema.prisma`](../prisma/schema.prisma): modelo persistente.
- [`../server/infrastructure/composition/composition-root.ts`](../server/infrastructure/composition/composition-root.ts): composición de adaptadores.
- [`DATASET-CONTENT-WORKFLOWS.md`](./DATASET-CONTENT-WORKFLOWS.md): flujo editorial y de importación.
