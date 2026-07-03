<p align="center">
  <img
    src="./public/social/og-cover-art.webp"
    alt="EnglishLoop"
    width="960"
  />
</p>

# EnglishLoop

Entrenamiento diario de inglés escrito para refrescar B1, avanzar hacia B2 y
mantener lo aprendido mediante lecciones breves, práctica relacionada y repaso
de errores.

EnglishLoop evita que el usuario tenga que decidir constantemente qué estudiar.
La aplicación propone un recorrido diario, conecta cada lección con actividades
autocorregibles y convierte los fallos en oportunidades de repaso.

> [!IMPORTANT]
> El frontend es navegable y funciona actualmente con datos y autenticación
> mock. Los contratos y adapters REST ya existen, pero el backend real y los
> endpoints `/api/v1` siguen pendientes de implementación.

## La experiencia de producto

```text
Lección recomendada
        ↓
2–4 contenidos breves
        ↓
Práctica relacionada
        ↓
Corrección y explicación
        ↓
Resumen y próximos repasos
```

El Daily Loop mezcla tres tipos de contenido:

- aprendizaje nuevo según el nivel activo;
- actividades relacionadas con las lecciones de la sesión;
- refuerzo de errores anteriores y mantenimiento de contenidos.

Además del recorrido guiado, el usuario puede consultar libremente las
bibliotecas de lecciones y actividades, practicar un tema concreto, revisar sus
errores y seguir su progreso.

## Qué incluye

- Landing, registro, login y sesión simulada mediante cookie.
- Daily Loop con lección, práctica, feedback inmediato y resumen.
- Catálogo y detalle de lecciones B1 y B2.
- Catálogo de actividades con 14 tipos de interacción.
- Práctica dirigida por nivel, categoría, tema, subtema o skill.
- Cola de repaso basada en errores.
- Dashboard de progreso, precisión y cobertura por taxonomía.
- Ajustes de nivel, objetivos diarios, idioma y preferencias.
- Interfaz responsive en español e inglés.
- Contenido pedagógico versionado, validable e independiente de Next.js.
- Diseño accesible para teclado, movimiento reducido y distintos tamaños de
  pantalla.

El contenido didáctico sigue una convención deliberada: las explicaciones se
presentan en español y los ejemplos, enunciados y respuestas en inglés. El
selector de idioma traduce la interfaz, no el material de aprendizaje.

## Estado del proyecto

| Área | Estado |
| --- | --- |
| Experiencia frontend | Implementada y navegable |
| Adaptadores mock | Activos por defecto |
| Dataset B1/B2 | En construcción, con validación e informes automáticos |
| Adaptadores REST | Preparados contra `/api/v1` |
| Backend y persistencia real | Pendientes |
| Autenticación real | Planificada con Better Auth |
| Base de datos | Planificada inicialmente con Prisma y SQLite |

La cobertura vigente del contenido se consulta en
[`DATASET/reports/coverage.json`](./DATASET/reports/coverage.json) y
[`DATASET/reports/practice-coverage.json`](./DATASET/reports/practice-coverage.json).
Estos informes son generados y no deben editarse manualmente.

## Arquitectura técnica

El frontend aplica una arquitectura hexagonal ligera orientada a features:

```text
app/ y features/
        │
        ▼
  core/use-cases
        │
        ▼
    core/ports
        │
        ├── adapters/mock     ← activo actualmente
        ├── adapters/rest     ← preparado para /api/v1
        └── adapters/browser  ← cookies y estado del navegador
```

- `app/` compone rutas, layouts, metadata y estados de carga o error.
- `features/` contiene la presentación y la interacción de cada área.
- `core/` define modelos, puertos y casos de uso sin depender de React o
  Next.js.
- `adapters/adapter-factory.ts` selecciona las implementaciones concretas.
- `DATASET/` mantiene lecciones, actividades, taxonomía, esquemas e índices
  fuera del runtime de la aplicación.

Esta separación permite sustituir los mocks por el backend sin cambiar los
componentes ni duplicar las reglas de presentación.

### Stack

- Next.js 16 con App Router y Server Components por defecto.
- React 19 y TypeScript estricto.
- Tailwind CSS 4.
- Base UI, Lucide y dnd-kit.
- Vitest y Testing Library.
- AJV, gray-matter y scripts TypeScript para el dataset.
- Prisma 7 y SQLite preparados para la futura persistencia.

### Estructura del repositorio

```text
english-loop/
├── app/          # Rutas y composition root
├── features/     # UI e interacción por funcionalidad
├── core/         # Modelos, puertos y casos de uso
├── adapters/     # Implementaciones mock, REST y browser
├── shared/       # UI, layout, i18n y utilidades compartidas
├── DATASET/      # Contenido pedagógico y contratos
├── scripts/      # Tooling de validación e indexación
├── public/       # Marca, mascota e ilustraciones
└── DOC/          # Planes y documentación ampliada
```

## Desarrollo local

### Requisitos

- Node.js 20.9 o superior.
- pnpm.

### Instalación

```bash
pnpm install
pnpm dev
```

La aplicación estará disponible en
[`http://localhost:3000`](http://localhost:3000).

No hace falta configurar variables de entorno para trabajar con la versión
actual. El origen de datos predeterminado es `mock`.

```bash
# Opcional y equivalente al comportamiento por defecto
NEXT_PUBLIC_DATA_SOURCE=mock
```

No uses `NEXT_PUBLIC_DATA_SOURCE=rest` hasta que exista una implementación del
backend compatible con `/api/v1`.

## Comandos

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Inicia el entorno de desarrollo |
| `pnpm build` | Genera la build de producción |
| `pnpm start` | Sirve la build de producción |
| `pnpm lint` | Ejecuta ESLint |
| `pnpm typecheck` | Comprueba los tipos sin emitir archivos |
| `pnpm test` | Ejecuta la suite con Vitest |
| `pnpm dataset:validate` | Valida contratos y referencias del dataset |
| `pnpm dataset:index` | Regenera índices de lecciones y actividades |
| `pnpm dataset:practice-index` | Regenera el índice de práctica |
| `pnpm dataset:coverage` | Calcula cobertura curricular |
| `pnpm dataset:duplicates` | Busca duplicados exactos y cercanos |
| `pnpm dataset:test-grading` | Verifica estrategias de corrección |
| `pnpm dataset:all` | Ejecuta todo el pipeline del dataset |

Antes de integrar cambios se recomienda ejecutar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Los cambios de contenido deben validarse además con:

```bash
pnpm dataset:all
```

## Contenido y calidad pedagógica

Las lecciones se escriben en Markdown con frontmatter y las actividades se
guardan en lotes JSON. La taxonomía jerárquica conecta niveles, categorías,
temas, subtemas y skills.

Cada actividad:

- es autocorregible de forma determinista;
- referencia la lección y el objetivo pedagógico que practica;
- incluye una explicación posterior;
- mantiene un ID estable y una versión de contenido;
- se valida contra los esquemas y reglas del repositorio.

Los índices y reportes se generan desde las fuentes de verdad del dataset. Para
añadir o modificar contenido, sigue la
[`guía de mantenimiento`](./DOC/DATASET-CONTENT-WORKFLOWS.md) y las
[`convenciones editoriales`](./DATASET/README.md).

## Roadmap

El siguiente bloque estructural es sustituir la infraestructura mock por un
backend real sin alterar la interfaz de los puertos existentes:

1. Monolito modular dentro del proyecto Next.js.
2. API REST versionada bajo `/api/v1` y Server Actions sobre el mismo core.
3. Better Auth para identidad y sesiones.
4. Prisma con SQLite en desarrollo y posibilidad de migrar a PostgreSQL.
5. Persistencia de intentos, progreso, sesiones diarias y cola de repaso.
6. Importación idempotente del dataset a base de datos.

El diseño completo está documentado en
[`DOC/BACKEND-PLAN.md`](./DOC/BACKEND-PLAN.md).

## Documentación

- [Visión original del producto](./DOC/README.md)
- [Flujo diario](./DOC/flow.md)
- [Estado y rediseño del frontend](./DOC/FRONTEND-REDESIGN-PLAN.md)
- [Arquitectura y plan del frontend](./DOC/FRONTEND-PLAN.md)
- [Plan del backend](./DOC/BACKEND-PLAN.md)
- [Plan de construcción del dataset](./DOC/DATASET-PLAN.md)
- [Mantenimiento y ampliación del dataset](./DOC/DATASET-CONTENT-WORKFLOWS.md)
- [Convenciones del dataset](./DATASET/README.md)
- [Arquitectura del core](./core/README.md)

## Situación del repositorio

EnglishLoop está en desarrollo activo y todavía no debe considerarse una
aplicación con backend, persistencia o autenticación listas para producción.
La versión actual sirve para desarrollar y validar la experiencia de producto,
los contratos frontend y el sistema de contenido antes de conectar la
infraestructura definitiva.
