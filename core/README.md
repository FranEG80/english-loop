# `core/`

Capa de dominio de la aplicación (arquitectura hexagonal ligera). Contiene los
contratos (`models`), los puertos (`ports`) y, cuando existan, los casos de
uso que orquestan varios puertos (`use-cases`).

## Reglas de dependencia

- `core/` **no** importa `react`, `next`, `next/*`, ni ninguna librería de UI.
- `core/` **no** importa nada de `adapters/`, `features/` ni `app/`.
- `core/models` solo define tipos y funciones puras (sin efectos secundarios).
- `core/ports` solo define interfaces; nunca implementaciones concretas.
- `core/use-cases` puede depender de `core/models` y `core/ports`, nunca de
  adaptadores concretos (reciben los puertos por inyección de parámetros).
- Estas reglas se refuerzan mediante `no-restricted-imports` en
  [eslint.config.mjs](../eslint.config.mjs).

## Convención de idioma del contenido

Siguiendo `DOC/DATASET-PLAN.md`, el contenido pedagógico no se traduce con el
selector de idioma de la interfaz:

- Explicaciones, resúmenes y errores frecuentes de lecciones/actividades:
  siempre en español (`string`).
- Ejemplos, enunciados y contenido de ejercicios: siempre en inglés (`string`).
- Títulos de lecciones: término gramatical/léxico en inglés (`string`).

Lo que sí cambia con el selector de idioma es la interfaz (`shared/i18n`) y
las etiquetas de navegación de la taxonomía (`TaxonomyNodeDto.label`), porque
son texto de producto, no contenido didáctico.

## Quién implementa cada puerto

Las implementaciones concretas viven en `adapters/mock` y `adapters/rest`. Los
componentes de `features/` y `app/` nunca importan `adapters/mock` ni
`adapters/rest` directamente: siempre resuelven un puerto a través de
`adapters/adapter-factory.ts`.
