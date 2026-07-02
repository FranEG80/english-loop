# EnglishLoop frontend: plan de recuperación y rediseño

`FRONTEND-PLAN.md` se conserva como documento histórico. Este documento refleja
el estado real encontrado y separa funcionalidad y diseño.

## Fase 1 — Arquitectura y cobertura funcional

| Área | Estado inicial | Resultado de Fase 1 |
| --- | --- | --- |
| Ports y adapters mock/REST | Implementados | Conservados y orquestados por casos de uso |
| Daily Loop | Parcial | Home autenticada, lección, práctica y resumen navegables |
| Lecciones | Placeholder | Catálogo, filtros y detalle |
| Actividades | Placeholder | Catálogo de los 14 tipos, detalle y preview |
| Review | Placeholder | Cola y práctica dirigida |
| Dashboard | Placeholder | Progreso, precisión y taxonomía |
| Settings | Placeholder | Lectura, actualización y reset mock |
| Estados de ruta | Parcial | Loading, error y not-found |
| Tests | 4 tests | Cobertura de arquitectura y registro de actividades |

### Límites

- `core` solo depende de modelos y ports.
- Los casos de uso reciben ports por inyección.
- `app` selecciona adapters y compone rutas.
- `features` no importa fixtures ni adapters concretos.
- Las respuestas correctas permanecen en el adapter mock.

### Registro de actividades

`features/activities/activity-registry.ts` relaciona exhaustivamente cada
`ActivityType` con renderer, modos de interacción y respuestas normalizadas.
Los tests fallan si falta un tipo, fixture, clave de corrección o modo admitido.

## Fase 2 — Diseño visual

Completada con la dirección **cuaderno editorial contemporáneo**:

- Fondo marfil, tinta oscura, verde estructural y acentos coral/amarillo.
- Newsreader para titulares, Nunito Sans para interfaz y Caveat para notas.
- Bordes expresivos, sombras desplazadas, composición asimétrica y motion CSS.
- Bento grid reservado al Dashboard.
- Loopy y las ilustraciones existentes integradas en las composiciones.

## Fase 3 — Implementación visual

Implementada sobre los flujos de Fase 1:

- Landing, auth, shells, Daily Loop, catálogos, Review, Settings y estados.
- Dashboard operativo separado de `/progress`.
- Ilustración contextual para los 14 tipos de actividad.
- Swipe convertido en un mazo multitarea con gesto y botones accesibles.
- Drag-and-drop, matching y sentence builder reforzados visualmente.
- Canvas interactivo no puntuable para explorar el mapa de una frase.
