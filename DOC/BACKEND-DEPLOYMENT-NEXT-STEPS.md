# Próximos pasos de despliegue del backend

Esta guía está escrita para poder seguirla sin conocer todavía la
arquitectura de EnglishLoop. Explica qué elegir, qué comando ejecutar, qué
resultado esperar y qué partes todavía no deben considerarse producción.

## 1. La idea general

EnglishLoop tiene tres piezas que se suelen confundir:

1. **Migración**: crea o modifica las tablas. Es el cambio de estructura.
2. **Seed**: carga el contenido editorial de DATASET/ (lecciones,
   actividades y taxonomía). Es el cambio de datos.
3. **Aplicación**: ejecuta Next.js y utiliza la base de datos que indiquen las
   variables de entorno.

El orden normal es:

~~~text
comprobar código → preparar base vacía → aplicar estructura → cargar dataset
→ arrancar aplicación → hacer smoke test → preparar backup y rollback
~~~

No hay que copiar dev.db a un servidor. dev.db sirve para desarrollo y
pruebas locales; cada proveedor remoto debe tener su propia base y su propio
backup.

## 2. Qué opción elegir

| Necesidad | Elección | Cómo llega la aplicación a la base |
| --- | --- | --- |
| Trabajar en el portátil | SQLite | Archivo dev.db |
| Next.js en Vercel con SQL tradicional | PostgreSQL o MariaDB | Conexión directa desde Node |
| D1 y aplicación Node/Vercel | D1 | HTTP autenticado hacia el Worker proxy |
| Worker de Cloudflare | D1 | Binding DB nativo |

Hay dos variables que deben quedar claras:

- DATABASE_PROVIDER dice qué motor se está usando: sqlite, postgresql,
  mariadb o d1.
- D1_TRANSPORT solo se usa con DATABASE_PROVIDER=d1: binding significa que
  el código corre dentro de Cloudflare y recibe env.DB; http significa que un
  proceso Node, por ejemplo Vercel, llama al Worker por HTTPS.

La aplicación no cambia silenciosamente D1 por SQLite. Si se configura D1 sin
el transporte correspondiente, el arranque falla para que no se escriba en la
base equivocada.

## 3. Antes de tocar una base remota

### Requisitos

- Node.js y pnpm instalados.
- Dependencias instaladas con pnpm install.
- Una cuenta y una base creada en el proveedor elegido.
- Un dominio HTTPS para la aplicación.
- Un lugar donde probar la restauración de un backup.

### Preparar las variables locales

Si todavía no existe un fichero local, copiar el ejemplo
[.env.example](../.env.example):

~~~bash
cp .env.example .env
~~~

.env es local y está excluido de Git. .env.example sí se versiona, pero nunca
debe contener contraseñas reales.

Para una base SQL se rellena DATABASE_URL. Para D1 no se usa DATABASE_URL: se
elige D1_TRANSPORT y, cuando sea HTTP, se rellenan D1_HTTP_URL y
D1_HTTP_TOKEN.

En producción hay que cambiar como mínimo:

~~~dotenv
CONTENT_SOURCE=database
BETTER_AUTH_SECRET=un-secreto-aleatorio-largo
BETTER_AUTH_URL=https://app.example.com
~~~

BETTER_AUTH_SECRET firma las sesiones. BETTER_AUTH_URL debe ser la URL pública
real, no localhost.

### Comprobación común antes de desplegar

Ejecutar desde el commit que contiene exactamente el dataset que se quiere
publicar:

~~~bash
pnpm prisma validate
pnpm db:check-parity
pnpm dataset:validate
pnpm dataset:seed -- --dry-run
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm test:integration
pnpm test:e2e
~~~

Qué comprueba cada orden:

- prisma validate: que el esquema de Prisma se pueda leer.
- db:check-parity: que los 36 modelos mantengan los mismos campos en SQLite,
  D1, PostgreSQL y MariaDB.
- dataset:validate: que no falten referencias en Markdown o JSON.
- --dry-run: construye el seed pero no escribe nada.
- typecheck y lint: errores de TypeScript y estilo.
- test:coverage: regresiones y cobertura global. El estado local actual
  supera 80% de statements y 90% de branches.
- test:integration y test:e2e: persistencia y recorrido completo con bases
  aisladas.

Si falla una orden, no se debe continuar con una base real. Primero se corrige
el error o se consulta el apartado de problemas frecuentes.

## 4. Desarrollo local con SQLite

Esta es la ruta ya cerrada y comprobada en el repositorio.

### Paso 1: seleccionar SQLite

En .env:

~~~dotenv
CONTENT_SOURCE=dataset
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
~~~

CONTENT_SOURCE=dataset sirve para leer el contenido editorial directamente de
los ficheros durante el desarrollo. El seed relacional se ejecuta aparte.

### Paso 2: aplicar la estructura sin borrar datos

~~~bash
pnpm prisma migrate status
pnpm prisma migrate deploy
~~~

migrate deploy aplica las migraciones que faltan. No es migrate reset: no
borra dev.db ni crea una base desde cero.

### Paso 3: cargar el dataset

~~~bash
pnpm db:seed
~~~

El comando lee los Markdown y JSON de DATASET/, valida las referencias y
publica el catálogo de forma idempotente. Si se repite con el mismo checksum,
no crea una release duplicada.

El estado local validado contiene 124 lecciones, 12.100 actividades y 164
nodos de taxonomía. Para simular sin escribir:

~~~bash
pnpm dataset:seed -- --dry-run
~~~

### Paso 4: arrancar y probar

~~~bash
pnpm dev
~~~

Comprobar en otra terminal:

~~~bash
curl -i http://localhost:3000/api/v1/health
curl -i http://localhost:3000/api/v1/ready
~~~

Después probar manualmente una página pública, registro/login y una acción
autenticada. El seed no crea usuarios: las cuentas las gestiona Better Auth.

## 5. PostgreSQL en Vercel u otro hosting Node

### Qué está preparado

El runtime de la aplicación tiene el adaptador @prisma/adapter-pg y la
factoría selecciona PostgreSQL cuando DATABASE_PROVIDER=postgresql.

### Importante sobre las migraciones actuales

No ejecutar a ciegas pnpm prisma migrate deploy contra PostgreSQL. La
historia versionada de prisma/migrations/ nació para SQLite/D1 y contiene
sentencias específicas de SQLite en algunas migraciones. El plan actual
genera una baseline PostgreSQL desde el esquema canónico; todavía falta
convertir ese bootstrap en una historia de migraciones PostgreSQL mantenida
automáticamente.

Por eso esta sección es un procedimiento de preparación controlada, no una
confirmación de que PostgreSQL ya esté certificado para producción.

### Paso 1: variables

En la máquina o job que va a ejecutar el bootstrap:

~~~dotenv
CONTENT_SOURCE=database
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST:5432/english_loop?sslmode=require
BETTER_AUTH_SECRET=un-secreto-aleatorio-largo
BETTER_AUTH_URL=https://app.example.com
~~~

La URL exacta depende del proveedor. No se debe pegar una contraseña real en
este Markdown ni en Git.

### Paso 2: generar el esquema PostgreSQL

La herramienta del proyecto cambia el provider del esquema canónico y genera
un fichero temporal:

~~~bash
pnpm db:render-schema postgresql /tmp/english-loop.schema.postgresql.prisma
pnpm prisma migrate diff \
  --from-empty \
  --to-schema /tmp/english-loop.schema.postgresql.prisma \
  --script > /tmp/english-loop.postgresql.sql
~~~

Revisar el SQL antes de aplicarlo. --from-empty significa “calcula todas las
tablas partiendo de una base vacía”; no compara ni borra la base existente.

### Paso 3: aplicar la baseline a una base vacía

Con el cliente psql instalado:

~~~bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f /tmp/english-loop.postgresql.sql
~~~

Para una base que ya contenga datos no se debe usar esta orden sin un plan de
migración y backup. Primero se compara el esquema y los contadores en una
copia aislada.

### Paso 4: cargar y probar

~~~bash
DATABASE_URL="$DATABASE_URL" pnpm db:seed
TEST_POSTGRES_DATABASE_URL="$DATABASE_URL" pnpm test:postgres
~~~

El segundo comando ejecuta los contratos de repositorio contra PostgreSQL.
Actualmente el runner está implementado, pero todavía necesita ejecutarse en
una instancia PostgreSQL real antes de marcar esta fase como terminada.

### Paso 5: conectar Vercel

En Vercel, crear las variables de Preview y Production por separado:

- CONTENT_SOURCE=database
- DATABASE_PROVIDER=postgresql
- DATABASE_URL
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL

El build puede ejecutar pnpm build, pero la migración y el seed no deben
ejecutarse automáticamente en cada build ni en cada instancia serverless.
Deben ser un job de release controlado, después de crear el backup y antes de
activar el nuevo código.

## 6. MariaDB en un hosting Node

La idea es igual que con PostgreSQL, pero Prisma usa el adaptador
@prisma/adapter-mariadb y el esquema generado usa el provider mysql.

### Variables

~~~dotenv
CONTENT_SOURCE=database
DATABASE_PROVIDER=mariadb
DATABASE_URL=mariadb://USUARIO:CONTRASEÑA@HOST:3306/english_loop
BETTER_AUTH_SECRET=un-secreto-aleatorio-largo
BETTER_AUTH_URL=https://app.example.com
~~~

### Generar y revisar la baseline

~~~bash
pnpm db:render-schema mariadb /tmp/english-loop.schema.mariadb.prisma
pnpm prisma migrate diff \
  --from-empty \
  --to-schema /tmp/english-loop.schema.mariadb.prisma \
  --script > /tmp/english-loop.mariadb.sql
~~~

Aplicar el SQL en una base MariaDB vacía usando la consola SQL del proveedor
o el cliente mariadb. Por ejemplo, el cliente pedirá la contraseña:

~~~bash
mariadb --host=HOST --port=3306 --user=USUARIO --password english_loop \
  < /tmp/english-loop.mariadb.sql
~~~

Después:

~~~bash
DATABASE_URL="$DATABASE_URL" pnpm db:seed
~~~

La paridad del esquema estático está comprobada, pero falta ejecutar los
contratos, migraciones, seed completo, TLS, pooling, límites de conexiones y
restauración contra una instancia MariaDB real. Hasta hacerlo, MariaDB no se
debe marcar como proveedor de producción certificado.

## 7. D1 en Cloudflare: binding nativo

D1 es SQLite administrado por Cloudflare. Un Worker puede recibir la base
directamente como env.DB; ese es el camino binding. El Worker preparado en este
repositorio es [workers/d1-proxy.ts](../workers/d1-proxy.ts). También puede
servir de proxy HTTP para Vercel.

### Paso 1: crear una base y una configuración local de Wrangler

Instalar/autenticar Wrangler mediante el proyecto:

~~~bash
pnpm dlx wrangler login
pnpm dlx wrangler d1 create english-loop-d1
~~~

El comando devuelve database_id. Copiar la plantilla y sustituir el nombre y
el ID:

~~~bash
cp wrangler.d1.example.jsonc wrangler.d1.jsonc
~~~

La plantilla [wrangler.d1.example.jsonc](../wrangler.d1.example.jsonc) ya
declara:

- binding DB, que será env.DB dentro del Worker;
- migrations_dir=prisma/migrations;
- migrations_pattern=prisma/migrations/*/migration.sql, necesario porque
  Prisma guarda cada SQL dentro de una carpeta de versión.

La documentación de Cloudflare explica este patrón anidado en [D1
migrations](https://developers.cloudflare.com/d1/reference/migrations/) y la
configuración de bindings en [Wrangler
configuration](https://developers.cloudflare.com/workers/wrangler/configuration/).

### Paso 2: aplicar migraciones D1

Usar el nombre de la base, no un nombre inventado para el binding, y mirar
primero qué falta:

~~~bash
pnpm dlx wrangler d1 migrations list english-loop-d1 \
  --config wrangler.d1.jsonc --remote
pnpm dlx wrangler d1 migrations apply english-loop-d1 \
  --config wrangler.d1.jsonc --remote
~~~

--remote significa que se modifica la base de Cloudflare. Sin esa opción se
trabaja con el almacenamiento local de Wrangler.

### Paso 3: proteger y desplegar el Worker

El proxy exige un token compartido. Guardarlo como secreto de Wrangler, nunca
en wrangler.d1.jsonc:

~~~bash
pnpm dlx wrangler secret put D1_HTTP_TOKEN \
  --config wrangler.d1.jsonc
pnpm dlx wrangler deploy --config wrangler.d1.jsonc
~~~

El endpoint /seed es una ruta operativa. Debe quedar autenticado, limitada en
permisos y fuera de una superficie pública sin protección.

### Paso 4: seed con binding

El seed desde Node no puede inventar env.DB. Si el seed se ejecuta dentro de
un Worker, el entrypoint debe construir el PersistenceBundle con el binding
DB y utilizar D1CatalogWriteAdapter.

Esta parte está preparada en infraestructura, pero el despliegue de una
aplicación Next completa dentro de Cloudflare todavía requiere validar su
adaptador de runtime. El Worker d1-proxy por sí solo no significa que toda la
aplicación Next ya esté desplegada en Cloudflare.

## 8. D1 usado desde Vercel

Vercel ejecuta Next.js como Node y no ofrece el binding DB de Cloudflare. Por
eso se usa el mismo Worker, pero por HTTP autenticado.

### Paso 1: variables en Vercel

~~~dotenv
CONTENT_SOURCE=database
DATABASE_PROVIDER=d1
D1_TRANSPORT=http
D1_HTTP_URL=https://english-loop-d1-proxy.example.workers.dev
D1_HTTP_TOKEN=el-mismo-secreto-configurado-en-wrangler
BETTER_AUTH_SECRET=un-secreto-aleatorio-largo
BETTER_AUTH_URL=https://app.example.com
~~~

D1_HTTP_TOKEN debe estar disponible solo en el servidor. No se debe usar una
variable NEXT_PUBLIC_ para este token.

### Paso 2: comprobar el seed por HTTP

Desde una máquina de confianza, con esas variables cargadas:

~~~bash
pnpm dataset:validate
pnpm dataset:seed -- --dry-run
pnpm dataset:seed
~~~

El CLI envía operaciones firmadas al Worker. El Worker valida el token, la
marca de tiempo y el nonce para evitar replay, y escribe en D1. Repetir el
mismo checksum es seguro porque el seed es idempotente.

### Paso 3: desplegar Vercel

Configurar las variables por entorno (Preview y Production), desplegar el
build y probar:

1. /api/v1/health;
2. /api/v1/ready;
3. registro, login y logout;
4. lectura de una lección;
5. una práctica autenticada y su persistencia.

No se debe guardar el token en el navegador ni exponer el endpoint /seed a
usuarios finales.

## 9. Cloudflare como hosting de la aplicación completa

Hay que distinguir dos despliegues:

- **Proxy D1**: es el Worker existente y puede desplegarse siguiendo la
  sección 7.
- **Aplicación Next completa**: necesita un adaptador de runtime de Next para
  Route Handlers, Server Actions, cookies y Better Auth. Esa integración aún
  no está validada en este repositorio.

Antes de afirmar que la aplicación está en Cloudflare hay que completar y
probar:

- elección del adaptador de runtime compatible;
- configuración de Env y generación de tipos de Wrangler;
- inyección del binding DB en el entrypoint de la aplicación;
- Better Auth usando ese mismo binding;
- migraciones D1 remotas y seed protegido;
- dominios, secretos, logs, límites y rollback;
- recorrido E2E contra el entorno remoto.

Hasta entonces, la combinación comprobable es Next/Vercel (o Node) más D1 por
HTTP, o el proxy D1 aislado en Cloudflare.

## 10. Checklist de cierre

No marcar un proveedor como terminado hasta poder responder “sí” a todo:

- [ ] El commit y la versión del dataset están identificados.
- [ ] Existe un backup y se ha restaurado en una base aislada.
- [ ] La estructura se ha aplicado con el procedimiento correcto del proveedor.
- [ ] El seed terminó y se guardaron versión, checksum, releaseId y contadores.
- [ ] CONTENT_SOURCE=database está activo en el entorno remoto.
- [ ] BETTER_AUTH_SECRET y URLs son secretos/configuración del entorno, no
  ficheros versionados.
- [ ] Health y readiness responden correctamente.
- [ ] Registro/login/logout y una operación autenticada funcionan.
- [ ] Se verificó que un usuario no puede leer ni modificar datos de otro.
- [ ] Se comprobó un plan de rollback de código y de esquema.
- [ ] Hay logs y alertas para errores de base, auth, seed y límites.

## 11. Problemas frecuentes

### “Prisma is unavailable with DATABASE_PROVIDER=d1”

Es intencionado. D1 no utiliza el adaptador Prisma SQL. Revisar que el proceso
que arranca la aplicación tenga D1_TRANSPORT=binding en Cloudflare o
D1_TRANSPORT=http con D1_HTTP_URL y D1_HTTP_TOKEN en Node/Vercel.

### “D1 seed from the CLI requires ...”

El comando pnpm dataset:seed se está ejecutando desde Node. Para D1 necesita
HTTP; el binding solo existe dentro de un Worker. Configurar las tres
variables HTTP o ejecutar la escritura desde un entrypoint Cloudflare
protegido.

### migrate deploy falla con PRAGMA, DATETIME u otra sintaxis

Se está intentando aplicar la historia SQLite/D1 a PostgreSQL o MariaDB.
Detenerse, restaurar si ya se escribió algo y seguir el procedimiento de
baseline de la sección 5 o 6. No editar las migraciones existentes para
“hacerlas funcionar” en otro proveedor sin una revisión de migración y
backup.

### El seed dice “Release unchanged”

Es correcto si la versión y el checksum son iguales. Significa que el seed
idempotente no ha duplicado el catálogo.

## Estado actual y criterio de finalización

El estado local está cerrado: dev.db tiene las migraciones aplicadas y el seed
validado con 124 lecciones, 12.100 actividades y 164 nodos. También están
implementados los caminos D1 binding y http, además de las factorías de
PostgreSQL y MariaDB.

Queda pendiente la validación externa de PostgreSQL, MariaDB y del runtime
completo de Next en Cloudflare, junto con backup/restauración, observabilidad,
secretos y rollback del proveedor elegido. Por tanto, la fase de producción
solo se puede marcar como cerrada después de ejecutar esta guía contra el
entorno real y conservar la evidencia de cada casilla.
