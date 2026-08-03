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
- En el futuro, el dataset se importará a la base de datos mediante un script
  TypeScript.
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
server/
├── core/
│   ├── content/
│   ├── learning/
│   ├── practice/
│   ├── progress/
│   └── account/
├── shared/
├── adapters/
│   ├── inbound/
│   │   ├── http/
│   │   └── actions/
│   └── outbound/
│       ├── persistence/
│       ├── content/
│       ├── auth/
│       └── observability/
└── infrastructure/
    ├── config/
    ├── database/
    ├── auth/
    ├── logging/
    └── composition/
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

- [ ] Crear la estructura raíz `server/`.
- [ ] Crear los bounded contexts iniciales.
- [ ] Crear `server/shared/` como shared kernel mínimo.
- [ ] Documentar la dirección permitida de las dependencias.
- [ ] Prohibir imports de Next.js dentro de `core/`.
- [ ] Prohibir imports de Prisma dentro de `core/`.
- [ ] Prohibir imports de Better Auth dentro de `core/`.
- [ ] Prohibir imports de Zod dentro del dominio.
- [ ] Permitir que `application` dependa del dominio y de puertos.
- [ ] Permitir que los adaptadores implementen puertos.
- [ ] Mantener la configuración tecnológica dentro de infraestructura.
- [ ] Hacer que solo el composition root conozca implementaciones concretas.
- [ ] Usar inyección de dependencias mediante constructores.
- [ ] No instalar un contenedor de inyección de dependencias.
- [ ] No crear `BaseRepository`.
- [ ] No crear `BaseService`.
- [ ] No crear CRUD genérico para agregados.
- [ ] Activar TypeScript estricto en todo el backend.
- [ ] Prohibir `any`.
- [ ] Añadir `dependency-cruiser`.
- [ ] Añadir pruebas automáticas de límites arquitectónicos.

## Fase 2 — Shared kernel

- [ ] Crear `Entity`.
- [ ] Crear `AggregateRoot`.
- [ ] Crear `ValueObject`.
- [ ] Crear `DomainEvent`.
- [ ] Crear `UniqueId`.
- [ ] Crear `UserId`.
- [ ] Crear `ClockPort`.
- [ ] Crear `IdGeneratorPort`.
- [ ] Crear `RandomSourcePort`.
- [ ] Crear tipos de paginación por cursor.
- [ ] Crear tipos básicos de commands y queries.
- [ ] Evitar colocar reglas específicas de negocio en `shared/`.
- [ ] Revisar cada utilidad compartida antes de añadirla al shared kernel.

## Fase 3 — Jerarquía de excepciones

- [ ] Crear `DomainException`.
- [ ] Crear `InvariantViolationException`.
- [ ] Crear `InvalidActivityResponseException`.
- [ ] Crear `InvalidSessionTransitionException`.
- [ ] Crear `InvalidPracticeScopeException`.
- [ ] Crear `InsufficientActivitiesForScopeException`.
- [ ] Crear `UnsupportedEvaluatorException`.
- [ ] Crear `ApplicationException`.
- [ ] Crear `ResourceNotFoundException`.
- [ ] Crear `ConflictException`.
- [ ] Crear `UnauthorizedException`.
- [ ] Crear `ForbiddenException`.
- [ ] Crear `ValidationException`.
- [ ] Crear `IdempotencyConflictException`.
- [ ] Crear `CatalogExhaustedException`.
- [ ] Crear `InfrastructureException`.
- [ ] Crear `PersistenceException`.
- [ ] Crear `DatasetUnavailableException`.
- [ ] Crear `AuthenticationProviderException`.
- [ ] Añadir a cada excepción:
  - Código estable.
  - Mensaje interno.
  - Mensaje público.
  - Metadatos seguros.
- [ ] Crear un mapper central de excepciones a HTTP.
- [ ] No exponer errores Prisma.
- [ ] No exponer stack traces.
- [ ] No exponer secretos o datos privados.

## Fase 4 — Bounded context Content Catalog

### Dominio y puertos

- [ ] Modelar `Lesson`.
- [ ] Modelar `Activity`.
- [ ] Modelar `ContentVersion`.
- [ ] Modelar `TaxonomyNode` y su relación padre-hijos.
- [ ] Modelar nivel, categoría, tema y dificultad como value objects o tipos
  controlados.
- [ ] Crear `LessonCatalogPort`.
- [ ] Crear `ActivityCatalogPort`.
- [ ] Crear `TaxonomyCatalogPort`.
- [ ] Permitir resolver un nodo a todos sus descendientes seleccionables.
- [ ] Permitir contar actividades disponibles por nodo y nivel.
- [ ] Crear filtros de catálogo mediante specifications.
- [ ] Limitar el runtime a contenido `published`.

### Casos de uso

- [ ] Crear `ListLessons`.
- [ ] Crear `GetLesson`.
- [ ] Crear `ListActivities`.
- [ ] Crear `GetActivityQuestion`.
- [ ] Crear `GetCatalogMetadata`.
- [ ] Crear `GetPracticeTaxonomy`.
- [ ] Crear `GetPracticeScopeAvailability`.

### Adaptadores locales

- [ ] Crear `FileLessonCatalogAdapter`.
- [ ] Crear `FileActivityCatalogAdapter`.
- [ ] Crear `FileTaxonomyCatalogAdapter`.
- [ ] Leer `practice-index.json`.
- [ ] Leer los índices generados de `DATASET/`.
- [ ] No recorrer todos los archivos en cada request.
- [ ] Cargar y cachear los índices una vez por proceso.
- [ ] Comprobar la versión del dataset.
- [ ] Rechazar referencias rotas o versiones incompatibles.
- [ ] No devolver respuestas correctas desde los DTO de pregunta.

## Fase 5 — Bounded context Account

### Dominio y puertos

- [ ] Modelar `UserSettings`.
- [ ] Modelar `SavedLesson`.
- [ ] Validar timezone IANA.
- [ ] Validar nivel activo.
- [ ] Validar objetivo diario de lecciones.
- [ ] Validar objetivo diario de actividades.
- [ ] Crear `IdentityPort`.
- [ ] Crear `UserSettingsRepository`.
- [ ] Crear `SavedLessonRepository`.

### Casos de uso

- [ ] Crear `GetOrCreateUserSettings`.
- [ ] Crear `UpdateUserSettings`.
- [ ] Crear `SaveLesson`.
- [ ] Crear `RemoveSavedLesson`.
- [ ] Crear `ListSavedLessons`.
- [ ] Crear settings predeterminados idempotentemente en el primer acceso
  autenticado.

## Fase 6 — Autenticación con Better Auth

- [ ] Instalar Better Auth y su adaptador Prisma.
- [ ] Configurar email y contraseña.
- [ ] Configurar sesiones persistidas en base de datos.
- [ ] Crear el endpoint `/api/auth/[...all]`.
- [ ] Crear `BetterAuthIdentityAdapter`.
- [ ] Traducir la sesión externa a un `Actor` del core.
- [ ] Evitar que tipos Better Auth salgan del adaptador.
- [ ] Configurar cookies `HttpOnly`.
- [ ] Configurar cookies `Secure` en producción.
- [ ] Configurar `SameSite`.
- [ ] Mantener credenciales y sesiones fuera del dominio de aprendizaje.
- [ ] Añadir rate limiting antes del despliegue productivo.
- [ ] Probar registro, login, logout y sesión expirada.
- [ ] Probar que un usuario no acceda a recursos de otro.

## Fase 7 — Prisma y SQLite

- [ ] Crear `prisma/schema.prisma`.
- [ ] Crear `prisma.config.ts` según Prisma 7.
- [ ] Configurar el adaptador `better-sqlite3`.
- [ ] Crear un singleton seguro de Prisma para desarrollo.
- [ ] Mantener Prisma dentro de infraestructura y adaptadores.
- [ ] Crear migraciones reproducibles.
- [ ] Usar UUID generados por la aplicación.
- [ ] Guardar timestamps en UTC.
- [ ] Guardar la fecha local de sesión separada de los timestamps.
- [ ] Evitar SQL nativo.
- [ ] Evitar tipos exclusivos de SQLite o PostgreSQL.
- [ ] Evitar reglas de negocio basadas en filtros internos de JSON.
- [ ] Crear `UnitOfWorkPort`.
- [ ] Crear `PrismaUnitOfWorkAdapter`.
- [ ] Mantener transacciones cortas.
- [ ] Añadir reintentos limitados para conflictos serializables.

## Fase 8 — Modelo persistente

- [ ] Integrar las tablas requeridas por Better Auth:
  - `User`.
  - `Session`.
  - `Account`.
  - `Verification`.
- [ ] Crear `UserSettings`.
- [ ] Crear `SavedLesson`.
- [ ] Crear `DailySession`.
- [ ] Crear `DailySessionLesson`.
- [ ] Crear `PracticeRun`.
- [ ] Crear `PracticeRunActivity`.
- [ ] Crear `ActivityAttempt`.
- [ ] Crear `UserActivityProgress`.
- [ ] Crear `UserLessonProgress`.
- [ ] Crear `TaxonomyProgress` por usuario y nodo.
- [ ] Crear `ReviewItem`.
- [ ] Crear `DatasetImport`.
- [ ] Preparar el futuro modelo:
  - `LessonVersion`.
  - `ActivityVersion`.
  - `TaxonomyNodeVersion`.
  - Relaciones de catálogo.
- [ ] Añadir una restricción única por usuario y fecha local de Daily Session.
- [ ] Añadir a `PracticeRun` el modo `DAILY`, `SMART_REVIEW` o `FOCUSED`.
- [ ] Guardar en `PracticeRun` el alcance de taxonomía y sus descendientes como
  snapshot.
- [ ] Permitir que una Daily Session referencie su `PracticeRun`.
- [ ] Añadir una restricción única de idempotency key por usuario.
- [ ] Añadir una restricción única de progreso por usuario y actividad.
- [ ] Añadir una restricción única de progreso por usuario y nodo de taxonomía.
- [ ] Añadir una restricción única por ID y versión de contenido.
- [ ] Añadir foreign keys.
- [ ] Añadir índices para consultas de progreso y repaso.

## Fase 9 — Bounded context Practice

### Dominio

- [ ] Modelar `ActivityAttempt` como inmutable.
- [ ] Modelar `PracticeRun` como aggregate root para cualquier lote de
  actividades.
- [ ] Modelar `PracticeRunMode` con `DAILY`, `SMART_REVIEW` y `FOCUSED`.
- [ ] Modelar `PracticeScope` con:
  - Nivel activo.
  - `taxonomyNodeId`.
  - IDs descendientes resueltos.
  - Número solicitado de actividades.
- [ ] Crear `PracticeRunPlanner`.
- [ ] Para práctica dirigida:
  - Incluir únicamente actividades publicadas del alcance.
  - Incluir descendientes cuando se selecciona un nodo general.
  - Evitar duplicados dentro de la sesión.
  - Priorizar actividades no realizadas recientemente.
  - Equilibrar subtemas en selecciones generales.
  - Reutilizar actividades recientes solo cuando el pool sea insuficiente.
- [ ] Permitir tamaños de sesión de 5, 10, 15 o 20 actividades.
- [ ] Crear `ActivityEvaluator`.
- [ ] Crear `ActivityEvaluatorFactory`.
- [ ] Implementar estrategia `boolean`.
- [ ] Implementar estrategia `single_option`.
- [ ] Implementar estrategia `multiple_options`.
- [ ] Implementar estrategia `exact_text`.
- [ ] Implementar estrategia `one_of_texts`.
- [ ] Implementar estrategia `per_gap`.
- [ ] Implementar estrategia `ordered_tokens`.
- [ ] Implementar estrategia `unordered_set`.
- [ ] Implementar estrategia `matching_pairs`.
- [ ] Aplicar las reglas de normalización definidas en el dataset.
- [ ] No usar IA o similitud semántica para corregir.

### Puertos y casos de uso

- [ ] Crear `AttemptRepository`.
- [ ] Crear `PracticeRunRepository`.
- [ ] Crear `CreateFocusedPracticeRun`.
- [ ] Crear `GetPracticeRun`.
- [ ] Crear `CompletePracticeRun`.
- [ ] Crear `GetPracticeRunSummary`.
- [ ] Crear `SubmitActivityAttempt`.
- [ ] Crear `GradeActivityResponse`.
- [ ] Crear `GetAttemptFeedback`.
- [ ] Exigir idempotency key al enviar un intento.
- [ ] No permitir modificar o borrar un intento.
- [ ] Guardar respuesta enviada, resultado y versión de evaluación.
- [ ] Registrar el origen `DAILY`, `SMART_REVIEW` o `FOCUSED` en cada intento.
- [ ] No marcar una lección como vista por realizar únicamente práctica
  dirigida.
- [ ] No incrementar loops completados al finalizar una práctica dirigida.
- [ ] No guardar datos innecesarios o sensibles.

## Fase 10 — Bounded context Progress & Review

### Dominio

- [ ] Modelar `ReviewItem`.
- [ ] Crear `ReviewPolicy`.
- [ ] Crear `ProgressProjector`.
- [ ] Crear `ProgressRepository`.
- [ ] Crear `ReviewRepository`.
- [ ] Crear `DomainEventDispatcherPort`.

### Política inicial de repaso

- [ ] Crear una entrada de repaso únicamente después de un fallo.
- [ ] Programar el primer repaso para el día siguiente.
- [ ] Tras el primer acierto, programar a 3 días.
- [ ] Tras el segundo acierto consecutivo, programar a 7 días.
- [ ] Tras el tercer acierto consecutivo, resolver la entrada.
- [ ] Reiniciar la etapa después de un nuevo fallo.
- [ ] Mezclar aproximadamente 50% actividad original y 50% variantes cuando
  exista contenido suficiente.
- [ ] Asociar cada repaso con su objetivo de aprendizaje.
- [ ] Permitir que una lección con errores pendientes aparezca como
  recapitulación.
- [ ] Un intento `FOCUSED` correcto actualizará progreso, pero no resolverá un
  `ReviewItem` vencido salvo que el intento pertenezca explícitamente a ese
  repaso.
- [ ] Un intento `FOCUSED` fallado creará o reforzará el `ReviewItem`
  correspondiente.

### Casos de uso

- [ ] Crear `GetReviewQueue`.
- [ ] Crear `GetProgressOverview`.
- [ ] Crear `GetTaxonomyProgress`.
- [ ] Crear `GetActivityHistory`.
- [ ] Crear `GetDashboardSummary`.

## Fase 11 — Transacción de envío de respuesta

- [ ] Resolver y validar el usuario autenticado.
- [ ] Comprobar el idempotency key.
- [ ] Recuperar el snapshot servidor de la actividad.
- [ ] Corregir mediante la estrategia determinista.
- [ ] Insertar `ActivityAttempt`.
- [ ] Actualizar `UserActivityProgress`.
- [ ] Actualizar la hoja de `TaxonomyProgress` y propagar la proyección a sus
  ancestros.
- [ ] Crear, avanzar o resolver `ReviewItem`.
- [ ] Actualizar el `PracticeRun`.
- [ ] Actualizar la Daily Session únicamente cuando el run sea `DAILY`.
- [ ] Ejecutar todos los cambios en una sola transacción.
- [ ] Publicar eventos internos después del commit.
- [ ] Devolver el resultado existente si se repite el mismo comando.
- [ ] Lanzar conflicto si la misma clave se usa con otro payload.

## Fase 12 — Bounded context Learning

### Dominio

- [ ] Modelar `DailySession` como aggregate root.
- [ ] Modelar estados válidos de sesión.
- [ ] Modelar lecciones asignadas y la referencia a su `PracticeRun`.
- [ ] Crear `DailySessionPlanner`.
- [ ] Crear `DailySessionRepository`.
- [ ] Crear eventos:
  - `DailySessionStarted`.
  - `LessonCompleted`.
  - `LessonSkipped`.
  - `ActivityAnswered`.
  - `ActivityFailed`.
  - `DailySessionCompleted`.

### Política de selección

- [ ] Filtrar por nivel activo.
- [ ] Filtrar por prerrequisitos cumplidos.
- [ ] Priorizar lecciones no vistas.
- [ ] Incluir lecciones con errores pendientes cuando corresponda.
- [ ] No repetir lecciones vistas sin errores mientras exista contenido nuevo
  elegible.
- [ ] Reutilizar contenido visto cuando se agote el contenido nuevo elegible.
- [ ] Reservar como máximo el 30% para repasos si existe contenido nuevo.
- [ ] Usar un seed persistido para selección reproducible.
- [ ] Guardar el motivo de selección de cada elemento.
- [ ] Crear una única sesión por fecha local del usuario.

### Snapshot

- [ ] Persistir el orden de lecciones.
- [ ] Delegar el snapshot de actividades en `PracticeRun`.
- [ ] Persistir la versión del dataset.
- [ ] Persistir la seed.
- [ ] Guardar snapshot servidor de pregunta, evaluador y feedback.
- [ ] No enviar evaluador ni respuesta al cliente antes del intento.
- [ ] Mantener estable una sesión aunque cambie el dataset.

### Casos de uso

- [ ] Crear `GetOrCreateDailySession`.
- [ ] Crear `GetCurrentDailySession`.
- [ ] Crear `CompleteLesson`.
- [ ] Crear `SkipLesson`.
- [ ] Crear `CompleteDailySession`.
- [ ] Hacer idempotente la creación concurrente de sesión.
- [ ] Validar todas las transiciones de estado dentro del agregado.

## Fase 13 — DTOs y validación

- [ ] Crear DTOs planos independientes del dominio.
- [ ] No devolver entidades directamente.
- [ ] No devolver modelos Prisma.
- [ ] Crear `LessonDto`.
- [ ] Devolver el contenido de la lección como Markdown.
- [ ] Crear `ActivityQuestionDto`.
- [ ] Crear `TaxonomyNodeDto`.
- [ ] Crear `PracticeScopeAvailabilityDto`.
- [ ] Crear `CreateFocusedPracticeRunDto`.
- [ ] Crear `PracticeRunDto`.
- [ ] Crear `PracticeRunSummaryDto`.
- [ ] Excluir respuesta, evaluador y explicación del DTO de pregunta.
- [ ] Crear `AttemptFeedbackDto`.
- [ ] Incluir en el feedback:
  - ID del intento.
  - Resultado correcto/incorrecto.
  - Respuesta normalizada.
  - Respuestas aceptadas.
  - Explicación.
  - Próximo repaso.
- [ ] Usar ISO 8601 para timestamps.
- [ ] Usar paginación por cursor.
- [ ] Usar enums controlados en filtros.
- [ ] Validar entradas HTTP y Server Actions con Zod.
- [ ] Mapear los objetos validados a commands o queries.

## Fase 14 — API REST `/api/v1`

- [ ] Crear `GET /api/v1/lessons`.
- [ ] Crear `GET /api/v1/lessons/:id`.
- [ ] Crear `GET /api/v1/activities`.
- [ ] Crear `GET /api/v1/activities/:id`.
- [ ] Crear `GET /api/v1/practice-taxonomy`.
- [ ] Crear `GET /api/v1/practice-taxonomy/:nodeId/availability`.
- [ ] Crear `POST /api/v1/practice-runs`.
- [ ] Crear `GET /api/v1/practice-runs/:id`.
- [ ] Crear `POST /api/v1/practice-runs/:id/attempts`.
- [ ] Crear `POST /api/v1/practice-runs/:id/complete`.
- [ ] Crear `GET /api/v1/practice-runs/:id/summary`.
- [ ] Crear `GET /api/v1/me/settings`.
- [ ] Crear `PATCH /api/v1/me/settings`.
- [ ] Crear `GET /api/v1/me/saved-lessons`.
- [ ] Crear `POST /api/v1/me/saved-lessons/:lessonId`.
- [ ] Crear `DELETE /api/v1/me/saved-lessons/:lessonId`.
- [ ] Crear `PUT /api/v1/daily-sessions/current`.
- [ ] Crear `GET /api/v1/daily-sessions/current`.
- [ ] Crear `POST /api/v1/daily-sessions/:id/lessons/:lessonId/complete`.
- [ ] Crear `POST /api/v1/daily-sessions/:id/lessons/:lessonId/skip`.
- [ ] Crear `POST /api/v1/daily-sessions/:id/complete`.
- [ ] Crear `GET /api/v1/review-queue`.
- [ ] Crear `GET /api/v1/progress/overview`.
- [ ] Crear `GET /api/v1/progress/taxonomy`.
- [ ] Crear `GET /api/v1/progress/history`.
- [ ] Crear `GET /api/v1/dashboard`.
- [ ] Crear `GET /api/v1/health`.
- [ ] Crear `GET /api/v1/ready`.
- [ ] Exigir autenticación en todos los endpoints salvo health y auth.
- [ ] Mantener los Route Handlers como delegadores finos.

## Fase 15 — Contrato de errores HTTP

- [ ] Definir el envelope:

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

- [ ] Mapear validación a `422`.
- [ ] Mapear autenticación a `401`.
- [ ] Mapear autorización a `403`.
- [ ] Mapear recurso inexistente a `404`.
- [ ] Mapear conflictos e idempotencia a `409`.
- [ ] Mapear rate limiting a `429`.
- [ ] Mapear errores inesperados a `500`.
- [ ] Incluir `requestId`.
- [ ] Mantener códigos de error estables.
- [ ] No usar mensajes como contrato programático.

## Fase 16 — Server Actions

- [ ] Crear una action por mutación necesaria para formularios.
- [ ] Validar la entrada con los mismos schemas que REST cuando sea aplicable.
- [ ] Resolver el actor autenticado.
- [ ] Ejecutar el mismo input port que REST.
- [ ] No acceder directamente a Prisma.
- [ ] No incluir reglas de negocio.
- [ ] No llamar por HTTP a `/api/v1`.
- [ ] Devolver DTOs seguros.
- [ ] Invocar query use cases directamente desde Server Components.
- [ ] Probar que REST y actions producen el mismo comportamiento.

## Fase 17 — Script de importación del dataset

- [ ] Crear `ValidateDatasetImport`.
- [ ] Crear `PlanDatasetImport`.
- [ ] Crear `ImportPublishedContent`.
- [ ] Crear un puerto de escritura de catálogo.
- [ ] Crear un adaptador Prisma de escritura.
- [ ] Añadir:

```bash
pnpm dataset:import -- --source ./DATASET --dry-run
pnpm dataset:import -- --source ./DATASET
```

- [ ] Ejecutar primero la validación completa del dataset.
- [ ] Importar la taxonomía antes que lecciones y actividades.
- [ ] Mantener relaciones padre-hijos e IDs estables de taxonomía.
- [ ] Importar únicamente contenido `published`.
- [ ] Calcular checksum de cada elemento.
- [ ] Calcular checksum global del dataset.
- [ ] Comparar versión y checksum con la última importación.
- [ ] Mostrar altas, nuevas versiones, retiradas y elementos sin cambios.
- [ ] No escribir nada en modo `--dry-run`.
- [ ] Hacer la ejecución idempotente.
- [ ] Insertar nuevas versiones sin sobrescribir las antiguas.
- [ ] No eliminar contenido referenciado por progreso o intentos.
- [ ] Marcar contenido retirado.
- [ ] Procesar lotes mediante transacciones pequeñas.
- [ ] Registrar inicio, fin, versión, checksum y resultado.
- [ ] Abortar antes de escribir si existen referencias rotas.
- [ ] Devolver códigos de salida válidos para CI.
- [ ] Probar inicialmente contra una SQLite desechable.
- [ ] Reutilizar el caso de uso al migrar a PostgreSQL.

## Fase 18 — Preparación SQLite → PostgreSQL

- [ ] Mantener puertos neutrales respecto al proveedor.
- [ ] No exponer Prisma en firmas de puertos.
- [ ] Evitar arrays o consultas específicas de PostgreSQL en el core.
- [ ] Evitar asumir el comportamiento de concurrencia de SQLite.
- [ ] Crear contract tests de repositorios.
- [ ] Ejecutar inicialmente los contratos contra SQLite.
- [ ] Añadir PostgreSQL mediante Testcontainers antes de migrar.
- [ ] Ejecutar los mismos contratos contra PostgreSQL.
- [ ] Crear una baseline de migraciones PostgreSQL.
- [ ] Probar la importación completa del dataset.
- [ ] Probar migración de usuarios, settings, sesiones, intentos y progreso.
- [ ] Comparar contadores y checksums antes de cambiar producción.
- [ ] Cambiar el composition root sin modificar el core.

## Fase 19 — Seguridad

- [ ] Marcar módulos backend con `server-only`.
- [ ] Centralizar acceso a variables de entorno.
- [ ] Validar configuración al arrancar.
- [ ] No pasar entidades completas a Client Components.
- [ ] No exponer evaluadores o respuestas antes del intento.
- [ ] Comprobar propiedad del recurso en cada caso de uso.
- [ ] Limitar tamaño de request bodies.
- [ ] Limitar tamaño de respuestas.
- [ ] Sanitizar contenido Markdown antes de renderizarlo.
- [ ] No registrar passwords.
- [ ] No registrar cookies.
- [ ] No registrar respuestas correctas.
- [ ] No registrar snapshots de evaluación.
- [ ] Añadir rate limiting a auth.
- [ ] Añadir rate limiting al envío de intentos.
- [ ] Revisar dependencias y vulnerabilidades.

## Fase 20 — Observabilidad

- [ ] Crear `LoggerPort`.
- [ ] Crear un logger estructurado.
- [ ] Generar o propagar `requestId`.
- [ ] Registrar nombre de caso de uso.
- [ ] Registrar duración.
- [ ] Registrar resultado.
- [ ] Registrar código de error.
- [ ] Pseudonimizar IDs de usuario.
- [ ] Añadir `instrumentation.ts`.
- [ ] Medir latencia por endpoint.
- [ ] Medir errores por código.
- [ ] Medir intentos procesados.
- [ ] Medir conflictos de idempotencia.
- [ ] Medir sesiones creadas y completadas.
- [ ] Medir runs por modo y nodo de taxonomía.
- [ ] Medir scopes solicitados sin suficiente contenido.
- [ ] Medir tamaño de la cola de repaso.
- [ ] Exponer la versión activa del dataset.
- [ ] Hacer que `health` compruebe el proceso.
- [ ] Hacer que `ready` compruebe BD, auth y catálogo.

## Fase 21 — Estrategia de pruebas

### Unitarias

- [ ] Probar entidades.
- [ ] Probar value objects.
- [ ] Probar invariantes.
- [ ] Probar transiciones de Daily Session.
- [ ] Probar `DailySessionPlanner`.
- [ ] Probar `PracticeRunPlanner`.
- [ ] Probar resolución de scopes generales y específicos.
- [ ] Probar `ReviewPolicy`.
- [ ] Probar todos los evaluadores.
- [ ] Añadir property-based tests para normalización y grading.

### Aplicación

- [ ] Probar casos de uso con adaptadores in-memory.
- [ ] Probar comandos autorizados y no autorizados.
- [ ] Probar errores esperados.
- [ ] Probar idempotencia.
- [ ] Probar publicación de eventos.

### Contratos e integración

- [ ] Crear contract tests de catálogo.
- [ ] Ejecutarlos contra filesystem.
- [ ] Ejecutarlos contra Prisma cuando exista el catálogo en BD.
- [ ] Crear contract tests de repositorios.
- [ ] Ejecutarlos contra SQLite.
- [ ] Ejecutarlos contra PostgreSQL futuro.
- [ ] Probar transacciones con SQLite temporal.
- [ ] Probar creación concurrente de Daily Session.
- [ ] Probar intento + progreso + review atómicos.
- [ ] Probar timezone y cambio de día.
- [ ] Probar snapshot ante cambios del dataset.
- [ ] Probar que un scope general distribuya actividades entre descendientes.
- [ ] Probar que un scope específico no incluya nodos hermanos.
- [ ] Probar que un run `FOCUSED` no complete el Daily Loop.
- [ ] Probar que un run `FOCUSED` correcto no consuma un repaso pendiente.
- [ ] Probar que un fallo `FOCUSED` cree o refuerce un repaso.

### API y acciones

- [ ] Probar Route Handlers.
- [ ] Probar validación Zod.
- [ ] Probar error mapping.
- [ ] Probar autenticación.
- [ ] Probar acceso cruzado entre usuarios.
- [ ] Probar reenvío del mismo request.
- [ ] Probar Server Actions sobre los mismos casos de uso.

### Importador

- [ ] Probar dry-run.
- [ ] Probar primera importación.
- [ ] Probar reejecución sin cambios.
- [ ] Probar nueva versión.
- [ ] Probar retirada.
- [ ] Probar referencia rota.
- [ ] Probar rollback.
- [ ] Probar checksum global.

### E2E

- [ ] Probar registro.
- [ ] Probar login.
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

- [ ] 1. Estructura y reglas de dependencias.
- [ ] 2. Shared kernel y excepciones.
- [ ] 3. Contratos de DTO y puertos.
- [ ] 4. Prisma SQLite y Unit of Work.
- [ ] 5. Better Auth e IdentityPort.
- [ ] 6. Adaptadores de `DATASET/`.
- [ ] 7. Account y settings.
- [ ] 8. Evaluadores deterministas.
- [ ] 9. Intentos y proyecciones.
- [ ] 10. Política de repaso.
- [ ] 11. PracticeRun y práctica dirigida.
- [ ] 12. Daily Session y snapshots.
- [ ] 13. API REST.
- [ ] 14. Server Actions.
- [ ] 15. Dashboard.
- [ ] 16. Script de importación.
- [ ] 17. Observabilidad y seguridad.
- [ ] 18. Contract tests PostgreSQL.
- [ ] 19. Preparación de producción.

## Criterios finales de aceptación

- [ ] El core no importa frameworks ni infraestructura.
- [ ] REST y Server Actions reutilizan los mismos casos de uso.
- [ ] No existe lógica de negocio dentro de Route Handlers.
- [ ] No existe lógica de negocio dentro de Server Actions.
- [ ] Ningún modelo Prisma sale de su adaptador.
- [ ] Better Auth queda aislado detrás de `IdentityPort`.
- [ ] Todas las actividades se corrigen determinísticamente.
- [ ] Las respuestas correctas no se exponen antes del intento.
- [ ] Los intentos son inmutables y auditables.
- [ ] Las proyecciones se actualizan atómicamente.
- [ ] Las Daily Sessions son estables e idempotentes.
- [ ] Los tres modos reutilizan `PracticeRun` sin duplicar corrección.
- [ ] La práctica dirigida admite selección por categoría, tema, subtema y
  skill.
- [ ] Las selecciones generales incluyen descendientes de forma equilibrada.
- [ ] Las selecciones específicas no mezclan nodos hermanos.
- [ ] La práctica dirigida actualiza progreso sin completar el Daily Loop.
- [ ] Las sesiones respetan la timezone del usuario.
- [ ] Las lecciones no se repiten innecesariamente.
- [ ] Los repasos no superan el 30% cuando existe contenido nuevo.
- [ ] El backend funciona localmente con SQLite y `DATASET/`.
- [ ] El importador es idempotente y soporta dry-run.
- [ ] Los contratos pueden ejecutarse contra PostgreSQL sin modificar el core.
- [ ] Los límites arquitectónicos están comprobados automáticamente.

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
