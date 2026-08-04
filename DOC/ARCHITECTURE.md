# Arquitectura técnica

EnglishLoop 1 es un monolito modular dentro de Next.js. La aplicación separa
el dominio, la experiencia web y la infraestructura para poder ejecutar el
producto con el dataset local, con una base relacional o con Cloudflare D1.

## Mapa del repositorio

| Área | Responsabilidad |
| --- | --- |
| `app/` | Rutas, layouts, Server Components, Route Handlers y composición de la web. |
| `features/` | Presentación, interacción y Server Actions organizadas por funcionalidad. |
| `core/` | Modelos, reglas de dominio, casos de uso y puertos; no conoce Next.js ni React. |
| `adapters/` | Implementaciones de puertos: contenido filesystem, mock, REST y cookies. |
| `server/infrastructure/` | Prisma, Better Auth, persistencia D1, configuración, seguridad y observabilidad. |
| `prisma/` | Esquema, migraciones y entrypoint de seed. |
| `DATASET/` | Fuente editorial versionada de lecciones, actividades y taxonomía. |
| `scripts/` | Validación, índices, cobertura, duplicados, seed y paridad de esquemas. |
| `workers/` | Worker opcional que expone el transporte HTTP autenticado hacia D1. |
| `DOC/` | Documentación técnica operativa y propuestas todavía no implementadas. |

## Dos puntos de composición

La aplicación tiene dos recorridos de entrada, con responsabilidades distintas:

```text
Web de producto
app/features → adapters/adapter-factory → REST real
                         ↘ /demo → mocks de solo lectura

Backend
Route Handler / Server Action → CompositionRoot → core → persistencia
```

`adapters/adapter-factory.ts` selecciona los adaptadores REST para la aplicación
real y expone factorías separadas para el espacio `/demo`. Los mocks no son
código muerto: alimentan esa demo anónima y la cobertura de contratos del
frontend. El registro, login y las sesiones siempre pasan por Better Auth real.
El backend real se compone en
`server/infrastructure/composition/composition-root.ts` y comparte los casos de
uso entre Route Handlers y Server Actions, sin peticiones HTTP internas.

## Reglas de dependencia

- `core/` no importa React, Next.js, UI, Prisma, Better Auth ni adaptadores
  concretos.
- `core/models` contiene tipos y funciones puras; `core/ports` solo define
  contratos.
- `core/use-cases` recibe puertos por inyección.
- `features/` y las páginas de `app/` resuelven adaptadores mediante la
  factoría; no importan directamente `adapters/mock` ni `adapters/rest`.
- Los módulos con secretos, Prisma, Better Auth o acceso a headers están
  marcados con `server-only`.
- Las fronteras se comprueban con `pnpm arch:check` y las reglas de ESLint.

## Fuente de contenido y persistencia

La configuración separa dos decisiones:

- `CONTENT_SOURCE=dataset`: el catálogo se lee de `DATASET/`.
- `CONTENT_SOURCE=database`: el catálogo se lee del release publicado en la
  base.

La persistencia se selecciona con `DATABASE_PROVIDER`:

- `sqlite` para desarrollo local y pruebas aisladas;
- `postgresql` o `mariadb` para un runtime Node;
- `d1` con `D1_TRANSPORT=binding` dentro de Cloudflare o `http` desde Node/Vercel.

Better Auth utiliza el mismo proveedor de persistencia que el backend. El
Worker D1 solo expone operaciones y seed autenticados; no convierte por sí
solo a la aplicación Next en una aplicación desplegada en Cloudflare.

## Verificación

La validación rápida de la release es:

```bash
pnpm lint
pnpm typecheck
pnpm arch:check
pnpm test
pnpm build:test
```

La validación de persistencia, despliegue y proveedores está en
[`BACKEND-README.md`](./BACKEND-README.md) y en la
[guía de deploy](./BACKEND-DEPLOYMENT-NEXT-STEPS.md). El mantenimiento del
contenido está documentado en
[`DATASET-CONTENT-WORKFLOWS.md`](./DATASET-CONTENT-WORKFLOWS.md).
