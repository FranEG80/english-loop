<p align="center">
  <img
    src="./public/social/og-cover-art.webp"
    alt="EnglishLoop"
    width="960"
  />
</p>

# EnglishLoop

EnglishLoop es un entrenador diario de inglés escrito para refrescar B1,
avanzar hacia B2 y mantener lo aprendido. Propone qué estudiar, relaciona cada
lección con actividades autocorregibles y convierte los errores en repaso útil.

La experiencia principal sigue este recorrido:

```text
Lección recomendada → práctica relacionada → feedback → resumen → repaso
```

## Qué ofrece la release 1

- Daily Loop con lecciones, práctica, corrección y resumen.
- Catálogos de lecciones y actividades con detalle y filtros.
- Catorce tipos de interacción, práctica dirigida y cola de repaso.
- Dashboard de progreso, precisión y cobertura por taxonomía.
- Ajustes de nivel, objetivos diarios, idioma y preferencias.
- Interfaz responsive en español e inglés, con soporte para teclado y reduced
  motion.
- Backend funcional local con API `/api/v1`, Server Actions, Better Auth,
  SQLite, seed idempotente y persistencia D1 por binding o HTTP.
- Dataset versionado y validado con 124 lecciones, 12.100 actividades y 164
  nodos taxonómicos.

Las explicaciones pedagógicas se presentan en español; los ejemplos,
enunciados y respuestas están en inglés. El selector de idioma cambia la
interfaz, no el material de aprendizaje.

## Estado de la release

La release 1 está cerrada para desarrollo local y pruebas aisladas. El código
incluye los adaptadores mock para demos deterministas y los adaptadores REST
para consumir el backend real. Los proveedores PostgreSQL y MariaDB, el
runtime completo de Next.js en Cloudflare y la operación de producción
(backups, observabilidad, secretos y rollback) todavía requieren validación en
un entorno real.

## Inicio rápido

Requisitos: Node.js 20.9 o superior y pnpm.

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en
[`http://localhost:3000`](http://localhost:3000). Sin configuración adicional,
el backend usa `DATASET` y SQLite local. La autenticación de registro, login y
sesión siempre usa Better Auth real. Las personas no registradas pueden abrir
`/demo` desde la landing para probar un panel de solo lectura con el usuario
demo; no se escribe nada en la base de datos.

Para preparar el catálogo relacional local:

```bash
cp .env.example .env
pnpm prisma migrate deploy
pnpm db:seed
```

Para usar la UI contra los endpoints reales, configura
`NEXT_PUBLIC_DATA_SOURCE=rest` y `CONTENT_SOURCE=database` después de aplicar
las migraciones y el seed.

## Comandos habituales

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve la build generada |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Comprobación de tipos |
| `pnpm arch:check` | Reglas de dependencia |
| `pnpm test` | Suite Vitest |
| `pnpm verify` | Lint, tipos, arquitectura, tests y build de prueba |
| `pnpm test:integration` | Integración Prisma sobre SQLite aislado |
| `pnpm test:e2e` | Recorridos E2E sobre una base aislada |
| `pnpm d1:dev` | Worker D1 local con Wrangler (tras copiar su configuración) |
| `pnpm d1:migrate:local` | Migraciones D1 en el almacenamiento local de Wrangler |
| `pnpm dataset:all` | Validación e informes del dataset |
| `pnpm test:coverage` | Suite con cobertura y umbrales |

## Contenido

El contenido fuente vive en `DATASET/`: lecciones Markdown, actividades JSON,
taxonomía, plantillas e informes generados. Los informes no se editan a mano.
Para añadir o modificar contenido, sigue la
[guía de mantenimiento del dataset](./DOC/DATASET-CONTENT-WORKFLOWS.md).

## Documentación técnica

La documentación técnica y operativa está centralizada en [`DOC/`](./DOC/):

- [Índice técnico](./DOC/README.md)
- [Arquitectura](./DOC/ARCHITECTURE.md)
- [Backend](./DOC/BACKEND-README.md)
- [Guía de deploy](./DOC/BACKEND-DEPLOYMENT-NEXT-STEPS.md)
- [Flujo diario](./DOC/flow.md)
- [Mantenimiento del dataset](./DOC/DATASET-CONTENT-WORKFLOWS.md)
- [Propuesta de CD/CI](./DOC/CI-CD-PROPOSAL.md)

La propuesta de CD/CI se conserva separada porque todavía no existe una
pipeline activa en el repositorio.
