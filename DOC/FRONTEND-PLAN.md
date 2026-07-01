# Plan del frontend de EnglishLoop

## 1. Resumen y correcciones del documento original

Crear una primera versión navegable, bilingüe, responsive y conectada a mocks
mediante ports intercambiables por REST.

### Decisiones definitivas

- Marca única: `EnglishLoop`.
- Español como idioma inicial.
- Selector español/inglés persistido en cookie.
- URLs sin prefijo de idioma.
- Autenticación mock mediante cookie para evitar flashes de hidratación.
- Arquitectura hexagonal ligera orientada a features, sin duplicar el dominio
  del backend.
- REST adapter preparado, pero desactivado hasta disponer del backend.
- Todas las interacciones visuales solicitadas se implementarán.
- `swipe`, drag-and-drop y sentence builder serán presentaciones de actividades
  autocorregibles existentes.
- Flashcards serán estudio/revisión, no intentos puntuables por autoevaluación.
- Canvas será una demostración visual no puntuable.
- No habrá corrección real en componentes: el mock adapter devolverá
  `AttemptFeedbackDto` igual que la futura API.
- `/review` diferenciará repaso automático por errores y repaso dirigido por
  tema.
- El usuario podrá seleccionar desde una categoría general hasta una skill
  concreta de la taxonomía.
- La práctica dirigida reutilizará el mismo `ActivityRenderer`.
- La primera versión será únicamente clara; no se implementará dark mode.
- Todos los assets propios se producirán juntos en una fase independiente
  usando obligatoriamente `$imagegen`.
- No se crearán SVG propios.

### Correcciones de accesibilidad sobre la paleta inicial

- Usar `primary-dark` para botones con texto blanco.
- Mantener `#14B8A6` como acento, no como fondo de botones con texto blanco.
- Añadir un borde interactivo más oscuro que `#E2E8F0`.
- Añadir variantes fuertes de B1/B2 para texto.
- Ningún estado dependerá únicamente del color.

## 2. Arquitectura, contratos y estado

### Organización

```text
frontend/
├── core/
│   ├── models/
│   ├── ports/
│   └── use-cases/
├── adapters/
│   ├── mock/
│   ├── rest/
│   └── browser/
├── features/
│   ├── auth/
│   ├── landing/
│   ├── daily/
│   ├── lessons/
│   ├── activities/
│   ├── practice/
│   ├── review/
│   ├── dashboard/
│   └── settings/
└── shared/
    ├── ui/
    ├── layout/
    ├── i18n/
    └── lib/
```

- `app/` solo compondrá rutas, metadata, layouts y límites de carga/error.
- `core/` no importará React, Next.js ni componentes.
- `features/` contendrá presentación e interacción.
- Los adapters implementarán acceso mock, REST, cookie e idioma.
- No crear entidades DDD que repitan los agregados del backend.
- No usar Redux o Zustand inicialmente.
- Usar estado local para actividades y formularios.
- Usar Context únicamente para locale y estado visual de sesión.
- Guardar filtros de bibliotecas en `searchParams`.
- Usar Server Components por defecto.
- Usar `"use client"` solo en islas interactivas.

### Ports

- `AuthPort`
- `LearningContentPort`
- `DailySessionPort`
- `FocusedPracticePort`
- `ProgressPort`
- `SettingsPort`
- `LocalePort`

Habrá una implementación mock completa y una implementación REST que respete
`/api/v1`. La selección se centralizará en un adapter factory; ningún
componente importará fixtures directamente.

### Contratos públicos

- `Locale = 'es' | 'en'`
- `AuthSession`
- `LessonSummaryDto`
- `LessonDetailDto`
- `ActivityQuestionDto`
- `AttemptFeedbackDto`
- `DailySessionDto`
- `ProgressOverviewDto`
- `ReviewQueueDto`
- `TaxonomyNodeDto`
- `PracticeScopeAvailabilityDto`
- `CreateFocusedPracticeRunDto`
- `PracticeRunDto`
- `PracticeRunSummaryDto`
- `UserSettingsDto`

Separar contenido y presentación:

```ts
type InteractionMode =
  | 'standard'
  | 'swipe'
  | 'drag_drop'
  | 'matching_pairs'
  | 'sentence_builder'
```

- `ActivityQuestionDto` será una unión discriminada por evaluador.
- `interactionMode` decidirá cómo se pinta, no cómo se corrige.
- `ActivityRenderer` tendrá un registro exhaustivo de renderers.
- Los tipos desconocidos mostrarán `UnsupportedActivity`.
- La respuesta correcta no estará disponible en las props del renderer.
- El mock grader permanecerá dentro del adapter mock.

### Mocks

- 6 lecciones.
- 14 actividades autocorregibles.
- 1 flashcard stack de estudio.
- 1 canvas preview.
- Daily Session.
- Progreso.
- Review queue.
- Taxonomía jerárquica bilingüe.
- Disponibilidad y sesiones de práctica dirigida.
- Dashboard.
- Settings.
- Contenido de UI equivalente en español e inglés.
- Ejercicios en inglés.
- IDs y DTOs compatibles con los planes del dataset y backend.

## 3. Diseño, rutas y experiencia

### Routing

- `app/page.tsx` leerá la cookie mock:
  - Sin sesión: landing.
  - Con sesión: Home interna.
- `/login` y `/register` compartirán Public Shell.
- Las rutas internas compartirán Workspace Shell.
- `/daily` redirigirá conceptualmente al paso actual.
- El layout interno protegerá rutas mediante el `AuthPort`.
- Login y register mock establecerán la cookie y redirigirán a `/`.
- Logout eliminará la cookie.
- Better Auth sustituirá posteriormente el adapter sin cambiar componentes.

Rutas:

- `/`
- `/login`
- `/register`
- `/daily`
- `/daily/lesson`
- `/daily/practice`
- `/daily/summary`
- `/lessons`
- `/lessons/[lessonId]`
- `/activities`
- `/activities/[activityId]`
- `/review`
- `/review/focus`
- `/review/session/[sessionId]`
- `/review/session/[sessionId]/summary`
- `/dashboard`
- `/settings`

### Design system

- Tailwind CSS 4 mediante variables y `@theme`.
- Geist como tipografía principal.
- Tokens para color, spacing, radios, sombras, tipografía y movimiento.
- Landing con ancho máximo aproximado de 1200px.
- Bloques de lectura limitados a unas 72 posiciones de caracteres.
- Panel de práctica centrado de hasta 800px.
- Sidebar en desktop.
- Bottom navigation en mobile.
- Tap targets mínimos de 48px.
- Base UI para Select, Switch y Dialog.
- Lucide únicamente para acciones funcionales puntuales.
- Ilustraciones y marca mediante assets propios.
- Skip link.
- Landmarks semánticos.
- Jerarquía correcta de headings.
- Focus visible.
- Feedback mediante icono, texto y color.
- `aria-live="polite"` para feedback de ejercicios.
- `prefers-reduced-motion` desactivará movimiento no esencial.

### Pantallas

#### Landing

- Header.
- Hero.
- CTA de registro y login.
- Loopy.
- Preview construido con componentes reales, no una captura.
- How it works.
- Áreas de práctica.
- Actividades interactivas.
- Daily Loop.
- Progreso.
- CTA final.
- Footer.

#### Home interna

- Saludo.
- Nivel activo.
- Lección recomendada.
- Objetivo diario.
- Streak.
- Accuracy.
- Repasos pendientes.
- Accesos rápidos.
- Loopy visible pero secundario.

#### Daily Lesson

- Metadatos.
- Contenido legible.
- Ejemplos.
- Errores frecuentes.
- Acción siguiente.
- Acción practicar.
- Acción guardar.
- Loopy reading discreto.

#### Daily Practice

- Progreso.
- Pregunta.
- Renderer específico.
- Feedback.
- Explicación.
- Mascota ausente o mínima.
- Siguiente bloqueado hasta responder cuando corresponda.

#### Daily Summary

- Resultados.
- Temas fuertes.
- Temas débiles.
- Próximo repaso.
- Loopy celebrate.
- CTA de regreso.

#### Bibliotecas y detalles

- Búsqueda.
- Filtros persistidos en URL.
- Estados new, viewed, mastered y saved.
- Cards responsive.
- Empty state.
- Loading state.
- Error state.
- Unsupported state.
- Detalles con CTA contextual.

#### Review, Dashboard y Settings

- `/review` será un hub con dos entradas claramente separadas:
  - Repaso recomendado: cola automática basada en errores.
  - Repaso por tema: práctica dirigida elegida por el usuario.
- La cola automática mostrará errores vencidos y próximos repasos.
- El selector de práctica dirigida mostrará:
  - Nivel B1, B2 o ambos.
  - Categorías generales.
  - Navegación progresiva por tema, subtema y skill.
  - Breadcrumb de la selección actual.
  - Número de actividades disponibles.
  - Tamaño de sesión: 5, 10, 15 o 20.
  - Resumen legible del alcance antes de empezar.
- Una categoría general incluirá todos sus descendientes.
- Una selección específica no incluirá nodos hermanos.
- Los nodos sin suficientes actividades se mostrarán deshabilitados con una
  explicación.
- En mobile se usará navegación drill-down con listas y botones, no un árbol
  ARIA complejo.
- La sesión dirigida reutilizará el layout de Daily Practice sin referencias a
  progreso diario.
- El resumen dirigido mostrará aciertos, fallos, subtemas cubiertos y acciones
  para repetir el mismo alcance o elegir otro.
- Errores.
- Temas débiles.
- Estadísticas con texto y datos accesibles además de gráficos.
- Settings bilingües con controles Base UI.
- Reset mock mediante diálogo de confirmación.

### Interacciones avanzadas

- Swipe mediante gesto y dos botones siempre visibles.
- Drag-and-drop mediante `@dnd-kit/core` y `@dnd-kit/sortable`.
- Pointer Sensor y Keyboard Sensor.
- Botones alternativos para mover arriba/abajo o seleccionar destino.
- Matching mediante selección por pares utilizable sin drag.
- Sentence builder con chips seleccionables, teclado y reordenación.
- Flashcards para revelar contenido y navegar.
- Flashcards sin marcar respuestas correctas según percepción del usuario.
- Canvas preview como card informativa.
- Canvas preview sin registrarse como actividad completada.

## 4. Fases de implementación

### Fase 1 — Contratos y fundamentos

- [ ] Crear la estructura frontend.
- [ ] Definir reglas de dependencias.
- [ ] Definir DTOs.
- [ ] Definir ports.
- [ ] Definir el contrato jerárquico de taxonomía.
- [ ] Definir `FocusedPracticePort`.
- [ ] Crear el adapter factory.
- [ ] Crear mocks bilingües consistentes.
- [ ] Crear un árbol mock con categorías, temas, subtemas y skills.
- [ ] Crear disponibilidad mock por nodo y nivel.
- [ ] Crear diccionarios tipados `es` y `en`.
- [ ] Implementar locale cookie con español predeterminado.
- [ ] Implementar auth cookie mock.
- [ ] Preparar REST adapters sin conectarlos.
- [ ] Añadir scripts de typecheck y tests.

### Fase 2 — Sistema visual y planificación de assets

- [ ] Corregir metadata.
- [ ] Eliminar el starter de Next.js.
- [ ] Definir tokens Tailwind 4.
- [ ] Crear Button.
- [ ] Crear Card.
- [ ] Crear Badge.
- [ ] Crear Progress.
- [ ] Crear Input.
- [ ] Crear LoadingState.
- [ ] Crear EmptyState.
- [ ] Crear ErrorState.
- [ ] Crear wireframes responsive.
- [ ] Fijar la guía visual de Loopy:
  - 2D editorial suave.
  - Personaje adulto y amable.
  - Formas limpias.
  - Textura muy ligera.
  - Paleta EnglishLoop.
  - Sin texto.
  - Sin marcas de agua.
  - Sin estética infantil.
- [ ] Cerrar el manifest completo de imágenes antes de generarlas.

### Fase 3 — Generación única de imágenes con `$imagegen`

Esta fase será independiente. No se implementarán componentes
simultáneamente.

- [ ] Usar obligatoriamente la skill `$imagegen`.
- [ ] Usar su herramienta integrada de generación.
- [ ] Generar primero `loopy-reference.webp`.
- [ ] Revisar y aprobar la hoja maestra del personaje.
- [ ] Utilizar esa imagen como referencia para todas las poses e ilustraciones.
- [ ] Ejecutar una llamada de imagegen por asset distinto.
- [ ] Mantener todas las llamadas dentro del mismo bloque de trabajo.
- [ ] Para assets transparentes:
  - Generar sobre fondo chroma-key plano.
  - Eliminar el fondo con el helper oficial de la skill.
  - Revisar canal alpha.
  - Revisar bordes y posibles halos.
- [ ] Guardar todos los assets finales en el workspace.
- [ ] No generar SVG.
- [ ] No pedir a imagegen que escriba el wordmark.
- [ ] Renderizar `EnglishLoop` con Geist junto al mark raster.

Manifest:

```text
public/
├── brand/
│   ├── englishloop-mark.webp
│   └── englishloop-mark-badge.webp
├── mascot/
│   ├── loopy-reference.webp
│   ├── loopy-wave.webp
│   ├── loopy-reading.webp
│   ├── loopy-thinking.webp
│   ├── loopy-celebrate.webp
│   ├── loopy-review.webp
│   └── loopy-rest.webp
├── illustrations/
│   ├── landing-daily-loop.webp
│   ├── auth-welcome.webp
│   ├── grammar-practice.webp
│   ├── vocabulary-practice.webp
│   ├── reading-practice.webp
│   ├── focused-practice.webp
│   ├── empty-lessons.webp
│   ├── empty-activities.webp
│   ├── empty-review.webp
│   ├── empty-search.webp
│   ├── summary-success.webp
│   ├── error-state.webp
│   ├── offline-state.webp
│   └── activities/
│       ├── true-false.webp
│       ├── single-choice.webp
│       ├── multiple-choice.webp
│       ├── fill-blank.webp
│       ├── sentence-transformation.webp
│       ├── error-correction.webp
│       ├── word-formation.webp
│       ├── open-cloze.webp
│       ├── key-word-transformation.webp
│       ├── matching.webp
│       ├── word-order.webp
│       ├── rewrite-sentence.webp
│       ├── complete-dialogue.webp
│       └── complete-paragraph.webp
├── photos/
│   └── landing/
│       ├── study-at-home.webp
│       ├── conversation-practice.webp
│       └── high-five-loopy.webp
└── social/
    └── og-cover-art.webp
```

- [ ] Cada una de las 14 actividades mock tendrá una ilustración propia.
- [ ] Las ilustraciones de actividad vivirán únicamente en
  `public/illustrations/activities/`.
- [ ] Un registro de presentación en `features/activities` asociará cada
  `activityId` con su `illustrationSrc`; el DTO público seguirá libre de rutas
  de assets y ningún componente inferirá la ruta a partir del tipo.
- [ ] La correspondencia inicial será:
  - `true_false` → `true-false.webp`.
  - `single_choice` → `single-choice.webp`.
  - `multiple_choice` → `multiple-choice.webp`.
  - `fill_blank` → `fill-blank.webp`.
  - `sentence_transformation` → `sentence-transformation.webp`.
  - `error_correction` → `error-correction.webp`.
  - `word_formation` → `word-formation.webp`.
  - `open_cloze` → `open-cloze.webp`.
  - `key_word_transformation` → `key-word-transformation.webp`.
  - `matching` → `matching.webp`.
  - `word_order` → `word-order.webp`.
  - `rewrite_sentence` → `rewrite-sentence.webp`.
  - `complete_dialogue` → `complete-dialogue.webp`.
  - `complete_paragraph` → `complete-paragraph.webp`.
- [ ] Usar las fotografías únicamente en la landing y mantener el resto del
  producto en el lenguaje ilustrado de EnglishLoop.
- [ ] `high-five-loopy.webp` combinará fotografía real con Loopy ilustrado a
  pequeña escala para conectar ambos lenguajes visuales.
- [ ] El OG incluirá el mark y el nombre `EnglishLoop`; no dependerá de texto
  generado dentro de la ilustración.
- [ ] Derivar iconos PNG de aplicación desde el mark aprobado.
- [ ] Crear una hoja de contacto para revisar consistencia.
- [ ] Rechazar y regenerar solo assets que fallen identidad, encuadre o
  transparencia.
- [ ] Optimizar a WebP.
- [ ] Conservar dimensiones explícitas.
- [ ] Mantener un fallback CSS en `Mascot`.
- [ ] Animar poses mediante transform y opacity CSS.
- [ ] No crear un sprite obligatorio.
- [ ] No volver a generar imágenes durante otras fases salvo corrección de un
  defecto.

### Fase 4 — Shell, auth y landing

- [ ] Implementar Public Shell.
- [ ] Implementar Workspace Shell.
- [ ] Implementar Sidebar.
- [ ] Implementar Header.
- [ ] Implementar Mobile Nav.
- [ ] Resolver `/` en servidor mediante auth cookie.
- [ ] Implementar login mock accesible.
- [ ] Implementar register mock accesible.
- [ ] Añadir selector de idioma.
- [ ] Construir landing completa.
- [ ] Construir Home interna.
- [ ] Integrar `next/image`.
- [ ] Especificar dimensiones y `sizes`.
- [ ] Dar prioridad únicamente al asset LCP del hero.
- [ ] Cargar de forma diferida el resto de imágenes.

### Fase 5 — Daily Loop y actividades

- [ ] Implementar Daily Lesson.
- [ ] Implementar ActivityRenderer.
- [ ] Implementar Single Choice.
- [ ] Implementar Multiple Choice.
- [ ] Implementar True/False.
- [ ] Implementar Fill Blank.
- [ ] Implementar swipe accesible.
- [ ] Implementar drag-and-drop.
- [ ] Implementar fallback de drag mediante botones.
- [ ] Implementar matching.
- [ ] Implementar sentence builder.
- [ ] Implementar flashcard review.
- [ ] Implementar canvas preview.
- [ ] Implementar feedback mock.
- [ ] Implementar explicación.
- [ ] Implementar Daily Summary.
- [ ] Verificar que ningún componente conozca respuestas correctas.

### Fase 6 — Resto de producto

- [ ] Implementar Lessons.
- [ ] Implementar Lesson detail.
- [ ] Implementar Activities.
- [ ] Implementar Activity detail.
- [ ] Implementar el hub Review.
- [ ] Implementar la cola de repaso recomendado.
- [ ] Implementar el selector de nivel para práctica dirigida.
- [ ] Implementar el explorador jerárquico de taxonomía.
- [ ] Implementar breadcrumb y navegación atrás.
- [ ] Implementar conteos de actividades disponibles.
- [ ] Implementar selector de 5, 10, 15 o 20 actividades.
- [ ] Implementar confirmación del alcance seleccionado.
- [ ] Implementar Focused Practice Session reutilizando `ActivityRenderer`.
- [ ] Implementar Focused Practice Summary.
- [ ] Implementar acciones para repetir alcance o cambiar selección.
- [ ] Implementar Dashboard.
- [ ] Implementar Settings.
- [ ] Implementar loading states.
- [ ] Implementar empty states.
- [ ] Implementar error states.
- [ ] Implementar not-found.
- [ ] Implementar estado sin resultados para filtros.
- [ ] Completar navegación en ambos idiomas.

### Fase 7 — Pulido

- [ ] Comprobar responsive desde 320px hasta desktop ancho.
- [ ] Comprobar teclado y focus.
- [ ] Comprobar reduced motion.
- [ ] Comprobar contraste.
- [ ] Comprobar zoom al 200%.
- [ ] Optimizar imágenes.
- [ ] Reducir Client Components.
- [ ] Cargar módulos interactivos pesados bajo demanda.
- [ ] Auditar copy español.
- [ ] Auditar copy inglés.
- [ ] Ejecutar pruebas visuales.
- [ ] Ejecutar pruebas de rendimiento.

## 5. Pruebas y aceptación

### Automatización

- [ ] Configurar Vitest.
- [ ] Configurar React Testing Library.
- [ ] Configurar Axe.
- [ ] Configurar Playwright.
- [ ] Añadir regresión visual.
- [ ] Añadir tests de arquitectura para imports prohibidos.
- [ ] Ejecutar typecheck en CI.
- [ ] Ejecutar lint en CI.
- [ ] Ejecutar build en CI.
- [ ] Ejecutar tests en CI.

### Escenarios mínimos

- [ ] `/` muestra landing sin cookie.
- [ ] `/` muestra Home con cookie.
- [ ] Login mock funciona sin flash de hidratación.
- [ ] Register mock funciona sin flash de hidratación.
- [ ] Logout elimina la sesión mock.
- [ ] El cambio de idioma persiste.
- [ ] Los diccionarios cubren todas las claves.
- [ ] Todas las rutas funcionan en español.
- [ ] Todas las rutas funcionan en inglés.
- [ ] Cada renderer acepta su DTO.
- [ ] Cada renderer emite una respuesta normalizada.
- [ ] Un tipo desconocido muestra fallback.
- [ ] Swipe funciona con gesto.
- [ ] Swipe funciona con botones.
- [ ] Swipe funciona con teclado.
- [ ] Drag funciona con ratón.
- [ ] Drag funciona con touch.
- [ ] Drag funciona con teclado.
- [ ] Drag funciona mediante botones alternativos.
- [ ] Feedback se anuncia sin depender del color.
- [ ] Mascot muestra fallback si falta un asset.
- [ ] Los assets mantienen espacio reservado.
- [ ] Las imágenes no provocan CLS.
- [ ] Sidebar y bottom navigation contienen las mismas rutas.
- [ ] Los filtros sobreviven a la navegación mediante URL.
- [ ] El hub diferencia repaso recomendado y repaso por tema.
- [ ] Grammar general incluye actividades de varios descendientes.
- [ ] Verb tenses permite bajar hasta un tiempo verbal específico.
- [ ] Vocabulary permite selección general y por campo léxico.
- [ ] Phrasal verbs puede seleccionarse como categoría o skill concreta.
- [ ] Una selección específica no muestra actividades de nodos hermanos.
- [ ] Los nodos sin contenido suficiente explican por qué no pueden iniciarse.
- [ ] La sesión dirigida admite 5, 10, 15 y 20 actividades según
  disponibilidad.
- [ ] El resumen permite repetir exactamente el mismo alcance.
- [ ] La práctica dirigida no modifica visualmente el progreso del Daily Loop.
- [ ] Mobile no produce scroll horizontal.
- [ ] Reduced motion elimina animaciones no esenciales.
- [ ] Ninguna respuesta correcta aparece en el DOM antes del feedback.

### Criterios finales

- [ ] Frontend completamente navegable con mocks.
- [ ] Arquitectura lista para sustituir mocks por REST.
- [ ] Marca consistente como EnglishLoop.
- [ ] Interfaz bilingüe con español predeterminado.
- [ ] Daily Loop completo de inicio a resumen.
- [ ] Repaso automático y práctica dirigida claramente diferenciados.
- [ ] Selección jerárquica desde categoría general hasta skill concreta.
- [ ] Práctica dirigida conectable al `PracticeRun` del backend.
- [ ] Todos los modos interactivos solicitados disponibles.
- [ ] Mascota presente sin distraer.
- [ ] Lote amplio de assets generado exclusivamente mediante `$imagegen`.
- [ ] Sin SVG propios.
- [ ] Accesibilidad WCAG AA en controles y recorridos principales.
- [ ] Build superado.
- [ ] Lint superado.
- [ ] Typecheck superado.
- [ ] Tests superados.
- [ ] Auditoría visual superada.
- [ ] Sin implementación real de backend, dataset, auth o persistencia.
