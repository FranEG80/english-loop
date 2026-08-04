# Plan del backend DDD + arquitectura hexagonal

## Objetivo

Construir un monolito modular dentro del proyecto Next.js con:

- Domain-Driven Design.
- Arquitectura hexagonal.
- Ports and adapters.
- Casos de uso independientes del framework.
- Persistencia intercambiable.
- Corrección automática determinista.
- Historial auditable de intentos.
- REST y Server Actions sobre el mismo core.

Este documento es la hoja de ruta operativa. Los puntos completados se marcarán
con `[x]`.

## Estado de auditoría — 2026-08-04

La implementación actual ya cubre el núcleo funcional local y la ruta D1. Esta
tabla evita confundir ese estado con las partes que siguen siendo preparación
de producción:

- `[x]` Fases 1–17: arquitectura, dominio, casos de uso, persistencia Prisma,
  catálogo versionado, Better Auth, API, Server Actions, importación idempotente
  y adaptadores D1 binding/HTTP.
- `[x]` Fase 19 en su alcance implementado: configuración validada,
  `server-only` en las fronteras Next, aislamiento de secretos, propiedad de
  recursos, rate limiting y DTOs seguros.
- `[x]` Fase 20 en su alcance implementado: logger estructurado, `requestId`,
  health, readiness y versión activa del dataset.
- `[~]` Fase 18: SQLite, PostgreSQL y MariaDB tienen factorías y paridad de
  esquema; quedan los contract tests ejecutados contra PostgreSQL y la
  migración/baseline de producción.
- `[~]` Fase 21: hay pruebas unitarias, de aplicación, contratos SQLite,
  integración Prisma/D1, API, acciones e importador; quedan E2E de los
  recorridos completos y PostgreSQL.
- `[~]` Fases 20–22: métricas operativas avanzadas, `instrumentation.ts` y
  preparación de producción quedan explícitamente pendientes.

Los nombres del código son la fuente de verdad: el agregado persistido se
llama `PracticeRunItem` (el plan antiguo decía `PracticeRunActivity`) y los
bounded contexts viven en `core/`; `server/infrastructure/` contiene solo la
infraestructura y el composition root.

## Decisiones fijadas

- El backend será inicialmente un monolito modular dentro del repositorio
  Next.js.
- Next Route Handlers y Server Actions serán adaptadores de entrada.
- El core no dependerá de Next.js, Prisma, Better Auth ni Zod.
- Existirá una API REST versionada bajo `/api/v1`.
- También se usarán Server Actions, sin duplicar lógica de negocio.
- Server Actions y Server Components no harán peticiones HTTP internas al
  propio backend.
- Better Auth + Prisma gestionará autenticación y sesiones.
- SQLite será la base de datos inicial de desarrollo.
- PostgreSQL será el destino futuro cuando la aplicación esté madura.
- Prisma será un detalle del adaptador de persistencia.
- En desarrollo, lecciones y actividades se leerán desde `DATASET/`.
- El dataset puede importarse a la base de datos mediante un script TypeScript.
- El script de importación será validable, idempotente y tendrá `--dry-run`.
- Los intentos serán inmutables.
- El progreso se mantendrá como una proyección derivada de los intentos.
- La Daily Session será un snapshot persistido y estable.
- El día se calculará según la timezone IANA del usuario.
- Los repasos ocuparán como máximo el 30% de una sesión si existe contenido
  nuevo.
- Solo los fallos crearán entradas de repaso.
- Los repasos mezclarán la actividad original y variantes del mismo objetivo.
- Las lecciones vistas no se repetirán mientras existan lecciones nuevas
  elegibles, salvo que haya errores pendientes relacionados.
- Existirán tres modos de práctica: `DAILY`, `SMART_REVIEW` y `FOCUSED`.
- `FOCUSED` permitirá seleccionar una categoría, tema, subtema o skill de la
  taxonomía.
- La práctica dirigida registrará intentos y progreso, pero no completará el
  Daily Loop ni consumirá por sí sola la cola de repaso automático.
- Un fallo durante práctica dirigida sí podrá crear o reforzar un
  `ReviewItem`.

## Referencias técnicas

- [Next.js como Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Seguridad de datos en Next.js](https://nextjs.org/docs/app/guides/data-security)
- [Better Auth con Prisma](https://better-auth.com/docs/adapters/prisma)
- [Bases de datos soportadas por Prisma](https://docs.prisma.io/docs/orm/core-concepts/supported-databases)
- [Transacciones Prisma](https://docs.prisma.io/docs/orm/prisma-client/queries/transactions)

## Estructura objetivo

```text
core/
├── account/
├── content/
├── learning/
├── practice/
├── progress/
└── shared/
adapters/
├── content/
├── mock/
└── rest/
server/infrastructure/
├── auth/
├── config/
├── database/
├── persistence/
├── logging/
└── composition/
app/
├── api/
└── actions/
```

Cada bounded context seguirá esta estructura:

```text
context/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── services/
│   ├── events/
│   └── exceptions/
├── application/
│   ├── use-cases/
│   ├── commands/
│   ├── queries/
│   ├── dto/
│   └── mappers/
└── ports/
    ├── inbound/
    └── outbound/
```

## Fase 1 — Reglas de arquitectura

- [x] Crear la estructura raíz `server/infrastructure/` y los adaptadores de entrada en `app/`.
- [x] Crear los bounded contexts iniciales en `core/`.
- [x] Crear `core/shared/` como shared kernel mínimo.
- [x] Documentar la dirección permitida de las dependencias.
- [x] Prohibir imports de Next.js dentro de `core/`.
- [x] Prohibir imports de Prisma dentro de `core/`.
- [x] Prohibir imports de Better Auth dentro de `core/`.
- [x] Prohibir imports de Zod dentro del dominio.
- [x] Permitir que `application` dependa del dominio y de puertos.
- [x] Permitir que los adaptadores implementen puertos.
- [x] Mantener la configuración tecnológica dentro de infraestructura.
- [x] Hacer que solo el composition root conozca implementaciones concretas.
- [x] Usar inyección de dependencias mediante constructores.
- [x] No instalar un contenedor de inyección de dependencias.
- [x] No crear `BaseRepository`.
- [x] No crear `BaseService`.
- [x] No crear CRUD genérico para agregados.
- [x] Activar TypeScript estricto en todo el backend.
- [x] Prohibir `any` en el código mantenido.
- [x] Añadir `dependency-cruiser`.
- [x] Añadir pruebas automáticas de límites arquitectónicos.

## Fase 2 — Shared kernel

- [x] Crear `Entity`.
- [x] Crear `AggregateRoot`.
- [x] Crear `ValueObject`.
- [x] Crear `DomainEvent`.
- [x] Crear `UniqueId`.
- [x] Crear `UserId` como tipo del core.
- [x] Crear `ClockPort`.
- [x] Crear `IdGeneratorPort`.
- [x] Crear `RandomSourcePort`.
- [x] Crear tipos de paginación por cursor.
- [x] Crear tipos básicos de commands y queries.
- [x] Evitar colocar reglas específicas de negocio en `shared/`.
- [x] Revisar cada utilidad compartida antes de añadirla al shared kernel.

## Fase 3 — Jerarquía de excepciones

- [x] Crear `DomainException`.
- [x] Crear `InvariantViolationException`.
- [x] Crear `InvalidActivityResponseException`.
- [x] Crear `InvalidSessionTransitionException`.
- [x] Crear `InvalidPracticeScopeException`.
- [x] Crear `InsufficientActivitiesForScopeException`.
- [x] Crear `UnsupportedEvaluatorException`.
- [x] Crear `ApplicationException`.
- [x] Crear `ResourceNotFoundException`.
- [x] Crear `ConflictException`.
- [x] Crear `UnauthorizedException`.
- [x] Crear `ForbiddenException`.
- [x] Crear `ValidationException`.
- [x] Crear `IdempotencyConflictException`.
- [x] Crear `CatalogExhaustedException`.
- [x] Crear `InfrastructureException`.
- [x] Crear `PersistenceException`.
- [x] Crear `DatasetUnavailableException`.
- [x] Crear `AuthenticationProviderException`.
- [x] Añadir a cada excepción:
  - Código estable.
  - Mensaje interno.
  - Mensaje público.
  - Metadatos seguros.
- [x] Crear un mapper central de excepciones a HTTP.
- [x] No exponer errores Prisma.
- [x] No exponer stack traces.
- [x] No exponer secretos o datos privados.

## Fase 4 — Bounded context Content Catalog

### Dominio y puertos

- [x] Modelar `Lesson`.
- [x] Modelar `Activity`.
- [x] Modelar `ContentVersion`.
- [x] Modelar `TaxonomyNode` y su relación padre-hijos.
- [x] Modelar nivel, categoría, tema y dificultad como value objects o tipos
  controlados.
- [x] Crear `LessonCatalogPort`.
- [x] Crear `ActivityCatalogPort`.
- [x] Crear `TaxonomyCatalogPort`.
- [x] Permitir resolver un nodo a todos sus descendientes seleccionables.
- [x] Permitir contar actividades disponibles por nodo y nivel.
- [~] Crear filtros de catálogo mediante specifications; actualmente son filtros
  explícitos de los puertos para evitar una abstracción genérica innecesaria.
- [x] Limitar el runtime a contenido `published`.

### Casos de uso

- [x] Crear `ListLessons`.
- [x] Crear `GetLesson`.
- [x] Crear `ListActivities`.
- [x] Crear `GetActivityQuestion` mediante el mapper seguro de pregunta.
- [x] Crear `GetCatalogMetadata`.
- [x] Crear `GetPracticeTaxonomy`.
- [x] Crear `GetPracticeScopeAvailability`.

### Adaptadores locales

- [x] Crear `FileLessonCatalogAdapter`.
- [x] Crear `FileActivityCatalogAdapter`.
- [x] Crear `FileTaxonomyCatalogAdapter`.
- [~] Generar `practice-index.json`; el runtime actual resuelve descendientes
  desde el árbol cacheado y el índice queda disponible para tooling editorial.
- [x] Leer los índices generados de `DATASET/`.
- [x] No recorrer todos los archivos en cada request.
- [x] Cargar y cachear los índices una vez por proceso.
- [x] Comprobar la versión del dataset.
- [x] Rechazar referencias rotas o versiones incompatibles durante validación e importación.
- [x] No devolver respuestas correctas desde los DTO de pregunta.

## Fase 5 — Bounded context Account

### Dominio y puertos

- [x] Modelar `UserSettings`.
- [x] Modelar `SavedLesson`.
- [x] Validar timezone IANA.
- [x] Validar nivel activo.
- [x] Validar objetivo diario de lecciones.
- [x] Validar objetivo diario de actividades.
- [x] Crear `IdentityPort`.
- [x] Crear `UserSettingsRepository`.
- [x] Crear `SavedLessonRepository`.

### Casos de uso

- [x] Crear `GetOrCreateUserSettings`.
- [x] Crear `UpdateUserSettings`.
- [x] Crear `SaveLesson`.
- [x] Crear `RemoveSavedLesson`.
- [x] Crear `ListSavedLessons`.
- [x] Crear settings predeterminados idempotentemente en el primer acceso
  autenticado.

## Fase 6 — Autenticación con Better Auth

- [x] Instalar Better Auth y su adaptador Prisma.
- [x] Configurar email y contraseña.
- [x] Configurar sesiones persistidas en base de datos.
- [x] Crear el endpoint `/api/auth/[...all]`.
- [x] Crear `BetterAuthIdentityAdapter`.
- [x] Traducir la sesión externa a un `Actor` del core.
- [x] Evitar que tipos Better Auth salgan del adaptador.
- [x] Configurar cookies `HttpOnly`.
- [x] Configurar cookies `Secure` en producción.
- [x] Configurar `SameSite`.
- [x] Mantener credenciales y sesiones fuera del dominio de aprendizaje.
- [x] Añadir rate limiting antes del despliegue productivo.
- [x] Probar registro, login y logout con una base SQLite aislada en E2E; la
  expiración temporal de sesión sigue pendiente de un reloj controlable en un
  proveedor real.
- [x] Probar que un usuario no acceda a recursos de otro.

## Fase 7 — Prisma y SQLite

- [x] Crear `prisma/schema.prisma`.
- [x] Crear `prisma.config.ts` según Prisma 7.
- [x] Configurar el adaptador `better-sqlite3`.
- [x] Crear un singleton seguro de Prisma para desarrollo.
- [x] Mantener Prisma dentro de infraestructura y adaptadores.
- [x] Crear migraciones reproducibles.
- [x] Usar UUID generados por la aplicación.
- [x] Guardar timestamps en UTC.
- [x] Guardar la fecha local de sesión separada de los timestamps.
- [x] Evitar SQL nativo en el core; el SQL parametrizado queda aislado en D1.
- [x] Evitar tipos exclusivos de SQLite o PostgreSQL.
- [x] Evitar reglas de negocio basadas en filtros internos de JSON.
- [x] Crear `UnitOfWorkPort`.
- [x] Crear `PrismaUnitOfWorkAdapter`.
- [x] Mantener transacciones cortas.
- [~] Añadir reintentos limitados para conflictos serializables; SQLite no los
  necesita en el flujo actual y queda pendiente el contrato PostgreSQL.

## Fase 8 — Modelo persistente

- [x] Integrar las tablas requeridas por Better Auth:
  - `User`.
  - `Session`.
  - `Account`.
  - `Verification`.
- [x] Crear `UserSettings`.
- [x] Crear `SavedLesson`.
- [x] Crear `DailySession`.
- [x] Crear `DailySessionLesson`.
- [x] Crear `PracticeRun`.
- [x] Crear `PracticeRunItem` (nombre vigente del modelo; sustituye a
  `PracticeRunActivity`).
- [x] Crear `ActivityAttempt`.
- [x] Crear `UserActivityProgress`.
- [x] Crear `UserLessonProgress`.
- [x] Crear `TaxonomyProgress` por usuario y nodo.
- [x] Crear `ReviewItem`.
- [x] Crear `DatasetImport`.
- [x] Preparar el modelo versionado:
  - `LessonVersion`.
  - `ActivityVersion`.
  - `TaxonomyNodeVersion`.
  - Relaciones de catálogo.
- [x] Añadir una restricción única por usuario y fecha local de Daily Session.
- [x] Añadir a `PracticeRun` el modo `DAILY`, `SMART_REVIEW` o `FOCUSED`.
- [x] Guardar en `PracticeRun` el alcance de taxonomía y sus descendientes como
  snapshot.
- [x] Permitir que una Daily Session referencie su `PracticeRun`.
- [x] Añadir una restricción única de idempotency key por usuario.
- [x] Añadir una restricción única de progreso por usuario y actividad.
- [x] Añadir una restricción única de progreso por usuario y nodo de taxonomía.
- [x] Añadir una restricción única por ID y versión de contenido.
- [~] Añadir foreign keys: las relaciones internas y versionadas están
  declaradas; las referencias a IDs editoriales permanecen neutrales para
  soportar `CONTENT_SOURCE=dataset` sin catálogo relacional importado.
- [x] Añadir índices para consultas de progreso y repaso.

## Fase 9 — Bounded context Practice

### Dominio

- [x] Modelar `ActivityAttempt` como inmutable.
- [x] Modelar `PracticeRun` como aggregate root para cualquier lote de
  actividades.
- [x] Modelar `PracticeRunMode` con `DAILY`, `SMART_REVIEW` y `FOCUSED`.
- [x] Modelar `PracticeScope` con:
  - Nivel activo.
  - `taxonomyNodeId`.
  - IDs descendientes resueltos.
  - Número solicitado de actividades.
- [x] Crear `PracticeRunPlanner`.
- [x] Para práctica dirigida:
  - Incluir únicamente actividades publicadas del alcance.
  - Incluir descendientes cuando se selecciona un nodo general.
  - Evitar duplicados dentro de la sesión.
  - Priorizar actividades no realizadas recientemente.
  - Equilibrar subtemas en selecciones generales.
  - Reutilizar actividades recientes solo cuando el pool sea insuficiente.
- [x] Permitir tamaños de sesión de 5, 10, 15 o 20 actividades.
- [x] Crear `ActivityEvaluator` mediante el evaluador determinista del dominio.
- [x] Crear `ActivityEvaluatorFactory` como selección por estrategia en `evaluate`.
- [x] Implementar estrategia `boolean`.
- [x] Implementar estrategia `single_option`.
- [x] Implementar estrategia `multiple_options`.
- [x] Implementar estrategia `exact_text`.
- [x] Implementar estrategia `one_of_texts`.
- [x] Implementar estrategia `per_gap`.
- [x] Implementar estrategia `ordered_tokens`.
- [x] Implementar estrategia `unordered_set`.
- [x] Implementar estrategia `matching_pairs`.
- [x] Aplicar las reglas de normalización definidas en el dataset.
- [x] No usar IA o similitud semántica para corregir.

### Puertos y casos de uso

- [x] Crear `AttemptRepository`.
- [x] Crear `PracticeRunRepository`.
- [x] Crear `CreateFocusedPracticeRun`.
- [x] Crear `GetPracticeRun`.
- [x] Crear `CompletePracticeRun`.
- [x] Crear `GetPracticeRunSummary`.
- [x] Crear `SubmitActivityAttempt`.
- [x] Crear `GradeActivityResponse` mediante `evaluate`.
- [x] Crear `GetAttemptFeedback`.
- [x] Exigir idempotency key al enviar un intento.
- [x] No permitir modificar o borrar un intento.
- [x] Guardar respuesta enviada, resultado y versión de evaluación.
- [x] Registrar el origen `DAILY`, `SMART_REVIEW` o `FOCUSED` en cada intento.
- [x] No marcar una lección como vista por realizar únicamente práctica
  dirigida.
- [x] No incrementar loops completados al finalizar una práctica dirigida.
- [x] No guardar datos innecesarios o sensibles.

## Fase 10 — Bounded context Progress & Review

### Dominio

- [x] Modelar `ReviewItem`.
- [x] Crear `ReviewPolicy`.
- [x] Crear `ProgressProjector`.
- [x] Crear `ProgressRepository`.
- [x] Crear `ReviewRepository`.
- [x] Crear `DomainEventDispatcherPort`.

### Política inicial de repaso

- [x] Crear una entrada de repaso únicamente después de un fallo.
- [x] Programar el primer repaso para el día siguiente.
- [x] Tras el primer acierto, programar a 3 días.
- [x] Tras el segundo acierto consecutivo, programar a 7 días.
- [x] Tras el tercer acierto consecutivo, resolver la entrada.
- [x] Reiniciar la etapa después de un nuevo fallo.
- [x] Mezclar aproximadamente 50% actividad original y 50% variantes cuando
  exista contenido suficiente.
- [x] Asociar cada repaso con su objetivo de aprendizaje.
- [x] Permitir que una lección con errores pendientes aparezca como
  recapitulación.
- [x] Un intento `FOCUSED` correcto actualizará progreso, pero no resolverá un
  `ReviewItem` vencido salvo que el intento pertenezca explícitamente a ese
  repaso.
- [x] Un intento `FOCUSED` fallado creará o reforzará el `ReviewItem`
  correspondiente.

### Casos de uso

- [x] Crear `GetReviewQueue`.
- [x] Crear `GetProgressOverview`.
- [x] Crear `GetTaxonomyProgress`.
- [x] Crear `GetActivityHistory`.
- [x] Crear `GetDashboardSummary`.

## Fase 11 — Transacción de envío de respuesta

- [x] Resolver y validar el usuario autenticado.
- [x] Comprobar el idempotency key.
- [x] Recuperar el snapshot servidor de la actividad.
- [x] Corregir mediante la estrategia determinista.
- [x] Insertar `ActivityAttempt`.
- [x] Actualizar `UserActivityProgress`.
- [x] Actualizar la hoja de `TaxonomyProgress` y propagar la proyección a sus
  ancestros.
- [x] Crear, avanzar o resolver `ReviewItem`.
- [x] Actualizar el `PracticeRun`.
- [x] Actualizar la Daily Session únicamente cuando el run sea `DAILY`.
- [x] Ejecutar todos los cambios en una sola transacción.
- [x] Publicar eventos internos después del commit.
- [x] Devolver el resultado existente si se repite el mismo comando.
- [x] Lanzar conflicto si la misma clave se usa con otro payload.

## Fase 12 — Bounded context Learning

### Dominio

- [x] Modelar `DailySession` como aggregate root.
- [x] Modelar estados válidos de sesión.
- [x] Modelar lecciones asignadas y la referencia a su `PracticeRun`.
- [x] Crear `DailySessionPlanner`.
- [x] Crear `DailySessionRepository`.
- [x] Crear eventos:
  - `DailySessionStarted`.
  - `LessonCompleted`.
  - `LessonSkipped`.
  - `ActivityAnswered`.
  - `ActivityFailed`.
  - `DailySessionCompleted`.

### Política de selección

- [x] Filtrar por nivel activo.
- [~] Filtrar por prerrequisitos cumplidos; el modelo editorial actual aún no
  declara prerrequisitos, por lo que no hay filtro aplicable.
- [x] Priorizar lecciones no vistas.
- [x] Incluir lecciones con errores pendientes cuando corresponda.
- [x] No repetir lecciones vistas sin errores mientras exista contenido nuevo
  elegible.
- [x] Reutilizar contenido visto cuando se agote el contenido nuevo elegible.
- [~] Reservar como máximo el 30% para repasos si existe contenido nuevo; la
  política actual prioriza errores a nivel de lección y queda pendiente el
  límite porcentual explícito.
- [x] Usar un seed persistido para selección reproducible.
- [x] Guardar el motivo de selección de cada elemento.
- [x] Crear una única sesión por fecha local del usuario.

### Snapshot

- [x] Persistir el orden de lecciones.
- [x] Delegar el snapshot de actividades en `PracticeRun`.
- [x] Persistir la versión del dataset.
- [x] Persistir la seed.
- [~] Guardar snapshot servidor de pregunta, evaluador y feedback; el
  `PracticeRunItem` conserva el `activityVersionId` y Prisma/D1 leen esa
  versión inmutable al corregir y construir feedback. Sigue pendiente
  materializar una copia completa del DTO/evaluador dentro del run.
- [x] No enviar evaluador ni respuesta al cliente antes del intento.
- [x] Mantener estable una sesión aunque cambie el dataset; el release, la
  versión y el `activityVersionId` están persistidos, y los adaptadores Prisma
  y D1 resuelven la actividad por esa versión, no por el puntero `active`.

### Casos de uso

- [x] Crear `GetOrCreateDailySession`.
- [x] Crear `GetCurrentDailySession`.
- [x] Crear `CompleteLesson`.
- [x] Crear `SkipLesson`.
- [x] Crear `CompleteDailySession`.
- [x] Hacer idempotente la creación concurrente de sesión.
- [x] Validar todas las transiciones de estado dentro del agregado.

## Fase 13 — DTOs y validación

- [x] Crear DTOs planos independientes del dominio.
- [x] No devolver entidades directamente.
- [x] No devolver modelos Prisma.
- [x] Crear `LessonDto`.
- [x] Devolver el contenido de la lección como Markdown.
- [x] Crear `ActivityQuestionDto`.
- [x] Crear `TaxonomyNodeDto`.
- [x] Crear `PracticeScopeAvailabilityDto`.
- [x] Crear `CreateFocusedPracticeRunDto`.
- [x] Crear `PracticeRunDto`.
- [x] Crear `PracticeRunSummaryDto`.
- [x] Excluir respuesta, evaluador y explicación del DTO de pregunta.
- [x] Crear `AttemptFeedbackDto`.
- [~] Incluir en el feedback; actualmente están implementados el ID, resultado,
  respuestas aceptadas, explicación y timestamp, pero falta devolver la
  respuesta normalizada y el próximo repaso:
  - ID del intento.
  - Resultado correcto/incorrecto.
  - Respuesta normalizada (pendiente).
  - Respuestas aceptadas.
  - Explicación.
  - Próximo repaso (pendiente).
- [x] Usar ISO 8601 para timestamps.
- [x] Usar paginación por cursor en los listados públicos. Las rutas devuelven
  `items`, `nextCursor` y `hasMore`; los adaptadores filesystem, Prisma y D1
  comparten cursor opaco y ordenación keyset, con límites configurables.
- [x] Usar enums controlados en filtros.
- [x] Validar entradas HTTP y Server Actions con Zod.
- [x] Mapear los objetos validados a commands o queries.

## Fase 14 — API REST `/api/v1`

- [x] Crear `GET /api/v1/lessons`.
- [x] Crear `GET /api/v1/lessons/:id`.
- [x] Crear `GET /api/v1/activities`.
- [x] Crear `GET /api/v1/activities/:id`.
- [x] Crear `GET /api/v1/practice-taxonomy`.
- [x] Crear `GET /api/v1/practice-taxonomy/:nodeId/availability`.
- [x] Crear `POST /api/v1/practice-runs`.
- [x] Crear `GET /api/v1/practice-runs/:id`.
- [x] Crear `POST /api/v1/practice-runs/:id/attempts`.
- [x] Crear `POST /api/v1/practice-runs/:id/complete`.
- [x] Crear `GET /api/v1/practice-runs/:id/summary`.
- [x] Crear `GET /api/v1/me/settings`.
- [x] Crear `PATCH /api/v1/me/settings`.
- [x] Crear `GET /api/v1/me/saved-lessons`.
- [x] Crear `POST /api/v1/me/saved-lessons/:lessonId`.
- [x] Crear `DELETE /api/v1/me/saved-lessons/:lessonId`.
- [x] Crear `PUT /api/v1/daily-sessions/current`.
- [x] Crear `GET /api/v1/daily-sessions/current`.
- [x] Crear `POST /api/v1/daily-sessions/:id/lessons/:lessonId/complete`.
- [x] Crear `POST /api/v1/daily-sessions/:id/lessons/:lessonId/skip`.
- [x] Crear `POST /api/v1/daily-sessions/:id/complete`.
- [x] Crear `GET /api/v1/review-queue`.
- [x] Crear `GET /api/v1/progress/overview`.
- [x] Crear `GET /api/v1/progress/taxonomy/:nodeId`.
- [x] Crear `GET /api/v1/progress/activities/:activityId/history`.
- [x] Crear `GET /api/v1/dashboard`.
- [x] Crear `GET /api/v1/health`.
- [x] Crear `GET /api/v1/ready`.
- [~] Exigir autenticación en todos los endpoints salvo health y auth; los
  endpoints de catálogo son actualmente públicos y no consultan identidad.
- [x] Mantener los Route Handlers como delegadores finos.

## Fase 15 — Contrato de errores HTTP

- [x] Definir el envelope:

```json
{
  "error": {
    "code": "DAILY_SESSION_ALREADY_COMPLETED",
    "message": "The daily session is already completed.",
    "fieldErrors": {},
    "requestId": "..."
  }
}
```

- [x] Mapear validación a `422`.
- [x] Mapear autenticación a `401`.
- [x] Mapear autorización a `403`.
- [x] Mapear recurso inexistente a `404`.
- [x] Mapear conflictos e idempotencia a `409`.
- [x] Mapear rate limiting a `429`.
- [x] Mapear errores inesperados a `500`.
- [x] Incluir `requestId`.
- [x] Mantener códigos de error estables.
- [x] No usar mensajes como contrato programático.

## Fase 16 — Server Actions

- [x] Crear una action por mutación necesaria para formularios.
- [x] Validar la entrada con los mismos schemas que REST cuando sea aplicable.
- [x] Resolver el actor autenticado.
- [x] Ejecutar el mismo input port que REST.
- [x] No acceder directamente a Prisma.
- [x] No incluir reglas de negocio.
- [x] No llamar por HTTP a `/api/v1`.
- [x] Devolver DTOs seguros.
- [x] Invocar query use cases directamente desde Server Components.
- [x] Probar que REST y actions producen el mismo comportamiento.

## Fase 17 — Script de importación del dataset

- [x] Crear `ValidateDatasetImport` mediante `validateDataset`.
- [x] Crear `PlanDatasetImport`.
- [x] Crear `ImportPublishedContent` mediante `dataset:seed`/`CatalogWritePort`.
- [x] Crear un puerto de escritura de catálogo.
- [x] Crear un adaptador Prisma de escritura.
- [x] Añadir:

```bash
pnpm dataset:import -- --source ./DATASET --dry-run
pnpm dataset:import -- --source ./DATASET
```

- [x] Ejecutar primero la validación completa del dataset.
- [x] Importar la taxonomía antes que lecciones y actividades.
- [x] Mantener relaciones padre-hijos e IDs estables de taxonomía.
- [x] Importar únicamente contenido `published`.
- [x] Calcular checksum de cada elemento.
- [x] Calcular checksum global del dataset.
- [x] Comparar versión y checksum con la última importación.
- [~] Mostrar altas, nuevas versiones, retiradas y elementos sin cambios; el
  plan interno clasifica create/update/unchanged y el release activo oculta
  versiones anteriores, pero falta un informe explícito de retiradas.
- [x] No escribir nada en modo `--dry-run`.
- [x] Hacer la ejecución idempotente.
- [x] Insertar nuevas versiones sin sobrescribir las antiguas.
- [x] No eliminar contenido referenciado por progreso o intentos.
- [x] Marcar contenido retirado con el estado editorial explícito `retired`;
  las versiones anteriores permanecen auditables y dejan de estar expuestas
  al cambiar `CatalogPublication`.
- [x] Procesar lotes mediante transacciones pequeñas en D1 y transacción de carga en Prisma.
- [x] Registrar inicio, fin, versión, checksum y resultado.
- [x] Abortar antes de escribir si existen referencias rotas.
- [x] Devolver códigos de salida válidos para CI.
- [x] Probar inicialmente contra una SQLite desechable.
- [x] Reutilizar el caso de uso al migrar a PostgreSQL.

## Fase 18 — Preparación SQLite → PostgreSQL

- [x] Mantener puertos neutrales respecto al proveedor.
- [x] No exponer Prisma en firmas de puertos.
- [x] Evitar arrays o consultas específicas de PostgreSQL en el core.
- [x] Evitar asumir el comportamiento de concurrencia de SQLite.
- [x] Crear contract tests de repositorios.
- [x] Ejecutar inicialmente los contratos contra SQLite.
- [ ] Añadir PostgreSQL mediante Testcontainers antes de migrar.
- [ ] Ejecutar los mismos contratos contra PostgreSQL.
- [ ] Crear una baseline de migraciones PostgreSQL.
- [x] Probar la importación completa del dataset en SQLite/D1 contract path.
- [ ] Probar migración de usuarios, settings, sesiones, intentos y progreso.
- [ ] Comparar contadores y checksums antes de cambiar producción.
- [x] Cambiar el composition root sin modificar el core.

## Fase 19 — Seguridad

- [x] Marcar módulos backend con `server-only` donde entran en el bundle Next;
  los módulos runtime-neutrales usados por CLI/Workers no lo importan.
- [x] Centralizar acceso a variables de entorno.
- [x] Validar configuración al arrancar.
- [x] No pasar entidades completas a Client Components.
- [x] No exponer evaluadores o respuestas antes del intento.
- [x] Comprobar propiedad del recurso en cada caso de uso.
- [x] Limitar tamaño de request bodies mediante `HTTP_MAX_REQUEST_BODY_BYTES`,
  incluyendo cuerpos en streaming.
- [x] Limitar tamaño de respuestas mediante `HTTP_MAX_RESPONSE_BODY_BYTES`.
- [x] Sanitizar contenido Markdown antes de renderizarlo; actualmente se
  entrega/renderiza como texto React y no se inyecta HTML.
- [x] No registrar passwords.
- [x] No registrar cookies.
- [x] No registrar respuestas correctas.
- [x] No registrar snapshots de evaluación.
- [x] Añadir rate limiting a auth.
- [x] Añadir rate limiting al envío de intentos.
- [~] Revisar dependencias y vulnerabilidades; el código y lockfile están
  versionados, pero la auditoría de vulnerabilidades es una tarea de CI.

## Fase 20 — Observabilidad

- [x] Crear `LoggerPort`.
- [x] Crear un logger estructurado.
- [x] Generar o propagar `requestId`.
- [x] Registrar nombre de caso de uso cuando el adaptador lo proporciona.
- [x] Registrar duración cuando el adaptador lo proporciona.
- [x] Registrar resultado.
- [x] Registrar código de error.
- [~] Pseudonimizar IDs de usuario; no se registran por defecto y queda
  pendiente aplicar pseudónimo explícito si se incorporan métricas de usuario.
- [x] Añadir `instrumentation.ts`.
- [x] Medir latencia por endpoint de forma agregada en `AggregatedMetrics`.
- [x] Medir errores por código de forma agregada en `AggregatedMetrics`.
- [ ] Medir intentos procesados.
- [ ] Medir conflictos de idempotencia.
- [ ] Medir sesiones creadas y completadas.
- [ ] Medir runs por modo y nodo de taxonomía.
- [ ] Medir scopes solicitados sin suficiente contenido.
- [ ] Medir tamaño de la cola de repaso.
- [x] Exponer la versión activa del dataset.
- [x] Hacer que `health` compruebe el proceso.
- [x] Hacer que `ready` compruebe BD, auth y catálogo.

## Fase 21 — Estrategia de pruebas

### Unitarias

- [x] Probar entidades.
- [x] Probar value objects.
- [x] Probar invariantes.
- [x] Probar transiciones de Daily Session.
- [x] Probar `DailySessionPlanner`.
- [x] Probar `PracticeRunPlanner`.
- [x] Probar resolución de scopes generales y específicos.
- [x] Probar `ReviewPolicy`.
- [x] Probar todos los evaluadores.
- [x] Añadir property-based tests para normalización y grading.

### Aplicación

- [x] Probar casos de uso con adaptadores in-memory.
- [x] Probar comandos autorizados y no autorizados.
- [x] Probar errores esperados.
- [x] Probar idempotencia.
- [x] Probar publicación de eventos.

### Contratos e integración

- [x] Crear contract tests de catálogo.
- [x] Ejecutarlos contra filesystem.
- [x] Ejecutarlos contra Prisma cuando exista el catálogo en BD.
- [x] Crear contract tests de repositorios.
- [x] Ejecutarlos contra SQLite.
- [ ] Ejecutarlos contra PostgreSQL futuro.
- [x] Probar transacciones con SQLite temporal.
- [~] Probar creación concurrente de Daily Session; hay cobertura de la carrera
  por restricción única y queda pendiente el stress de dos conexiones reales.
- [x] Probar intento + progreso + review atómicos.
- [x] Probar timezone y cambio de día.
- [x] Probar snapshot ante cambios del dataset.
- [x] Probar que un scope general distribuya actividades entre descendientes.
- [x] Probar que un scope específico no incluya nodos hermanos.
- [x] Probar que un run `FOCUSED` no complete el Daily Loop.
- [x] Probar que un run `FOCUSED` correcto no consuma un repaso pendiente.
- [x] Probar que un fallo `FOCUSED` cree o refuerce un repaso.

### API y acciones

- [x] Probar Route Handlers.
- [x] Probar validación Zod.
- [x] Probar error mapping.
- [x] Probar autenticación.
- [x] Probar acceso cruzado entre usuarios.
- [x] Probar reenvío del mismo request.
- [x] Probar Server Actions sobre los mismos casos de uso.

### Importador

- [x] Probar dry-run.
- [x] Probar primera importación.
- [x] Probar reejecución sin cambios.
- [x] Probar nueva versión.
- [x] Probar retirada: una versión `retired` permanece auditable y deja de
  aparecer en el catálogo publicado.
- [x] Probar referencia rota.
- [x] Probar rollback.
- [x] Probar checksum global.

### E2E

Los E2E cubren salud, contrato API, accesibilidad, páginas públicas y un
recorrido autenticado de Better Auth contra una SQLite aislada. El runner crea
la base en un directorio temporal y la elimina al terminar.

- [x] Probar registro.
- [x] Probar login.
- [ ] Probar creación de Daily Session.
- [ ] Probar lección completada y omitida.
- [ ] Probar actividad correcta.
- [ ] Probar actividad fallada.
- [ ] Probar feedback.
- [ ] Probar resumen diario.
- [ ] Probar aparición de un repaso.
- [ ] Probar selección de gramática general.
- [ ] Probar selección de un tiempo verbal específico.
- [ ] Probar selección de vocabulario general y específico.
- [ ] Probar selección de phrasal verbs.
- [ ] Probar resumen de práctica dirigida.

## Fase 22 — Orden recomendado de implementación

- [x] 1. Estructura y reglas de dependencias.
- [x] 2. Shared kernel y excepciones.
- [x] 3. Contratos de DTO y puertos.
- [x] 4. Prisma SQLite y Unit of Work.
- [x] 5. Better Auth e IdentityPort.
- [x] 6. Adaptadores de `DATASET/`.
- [x] 7. Account y settings.
- [x] 8. Evaluadores deterministas.
- [x] 9. Intentos y proyecciones.
- [x] 10. Política de repaso.
- [x] 11. PracticeRun y práctica dirigida.
- [~] 12. Daily Session y snapshots; falta completar el snapshot materializado
  por versión.
- [x] 13. API REST.
- [x] 14. Server Actions.
- [x] 15. Dashboard.
- [x] 16. Script de importación.
- [~] 17. Observabilidad y seguridad; los límites HTTP y las métricas de
  latencia/errores están implementados, pero faltan métricas pedagógicas
  específicas y la integración con un proveedor externo.
- [ ] 18. Contract tests PostgreSQL.
- [ ] 19. Preparación de producción.

## Criterios finales de aceptación

- [x] El core no importa frameworks ni infraestructura.
- [x] REST y Server Actions reutilizan los mismos casos de uso.
- [x] No existe lógica de negocio dentro de Route Handlers.
- [x] No existe lógica de negocio dentro de Server Actions.
- [x] Ningún modelo Prisma sale de su adaptador.
- [x] Better Auth queda aislado detrás de `IdentityPort`.
- [x] Todas las actividades se corrigen determinísticamente.
- [x] Las respuestas correctas no se exponen antes del intento.
- [x] Los intentos son inmutables y auditables.
- [x] Las proyecciones se actualizan atómicamente.
- [~] Las Daily Sessions son estables e idempotentes; la idempotencia y la
  lectura por versión están cubiertas, pero sigue pendiente materializar el
  snapshot completo de pregunta/evaluador.
- [x] Los tres modos reutilizan `PracticeRun` sin duplicar corrección.
- [x] La práctica dirigida admite selección por categoría, tema, subtema y
  skill.
- [x] Las selecciones generales incluyen descendientes de forma equilibrada.
- [x] Las selecciones específicas no mezclan nodos hermanos.
- [x] La práctica dirigida actualiza progreso sin completar el Daily Loop.
- [x] Las sesiones respetan la timezone del usuario.
- [x] Las lecciones no se repiten innecesariamente.
- [~] Los repasos no superan el 30% cuando existe contenido nuevo; falta
  imponer el límite porcentual explícito.
- [x] El backend funciona localmente con SQLite y `DATASET/`.
- [x] El importador es idempotente y soporta dry-run.
- [ ] Los contratos pueden ejecutarse contra PostgreSQL sin modificar el core.
- [x] Los límites arquitectónicos están comprobados automáticamente.

## Fuera del alcance inicial

- Microservicios.
- Broker de eventos externo.
- CQRS con bases separadas.
- CMS o panel de administración.
- Corrección manual.
- Corrección mediante IA.
- Aplicación móvil.
- Sincronización offline.
- Emails de marketing.
- Notificaciones externas.
