# Plan de construcción del dataset

## Objetivo

Crear `DATASET/` en la raíz del proyecto como fuente independiente, versionada y
validable de:

- Lecciones detalladas B1 y B2.
- Miles de actividades con corrección automática determinista.
- Taxonomía, esquemas, índices, informes y herramientas de control de calidad.

Este documento es la hoja de ruta operativa. Los puntos completados se marcarán
con `[x]`.

## Decisiones fijadas

- `DOC/README.md` es una guía creada por un LLM, no una especificación
  autoritativa.
- El temario deberá contrastarse con CEFR y los formatos oficiales de Cambridge.
- CEFR determinará nivel y progresión.
- Cambridge servirá como referencia para formatos de actividades escritas, sin
  copiar contenido oficial.
- B1 y B2 se construirán en paralelo.
- Las lecciones se escribirán en Markdown con frontmatter.
- Las actividades se almacenarán en JSON.
- Todas las actividades tendrán corrección automática determinista.
- No habrá corrección manual de respuestas de usuarios.
- No habrá corrección mediante LLM.
- Writing se limitará a ejercicios guiados con respuestas verificables.
- Sí habrá revisión humana lingüística y pedagógica del contenido antes de
  publicarlo.
- `DATASET/` no dependerá de Next.js, del backend ni de una base de datos.

## Fuentes principales

- [Descriptores CEFR](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors)
- [CEFR Companion Volume](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions)
- [Cambridge B1 Preliminary](https://www.cambridgeenglish.org/exams-and-tests/preliminary/exam-format/)
- [Cambridge B2 First](https://www.cambridgeenglish.org/es/exams-and-tests/first/exam-format/)

## Estructura objetivo

```text
DATASET/
├── README.md
├── VERSION
├── CHANGELOG.md
├── references/
│   └── sources.json
├── catalog/
│   ├── taxonomy.json
│   ├── curriculum-map.json
│   ├── coverage-targets.json
│   ├── lesson-index.json
│   └── activity-index.json
├── schemas/
│   ├── lesson.schema.json
│   ├── activity.schema.json
│   ├── taxonomy.schema.json
│   └── coverage.schema.json
├── lessons/
│   ├── b1/
│   │   └── categoria/tema/leccion.md
│   └── b2/
│       └── categoria/tema/leccion.md
├── activities/
│   ├── b1/
│   │   └── categoria/tema/leccion/tipo/batch-001.json
│   └── b2/
│       └── categoria/tema/leccion/tipo/batch-001.json
├── templates/
│   ├── lesson.template.md
│   └── activity-batch.template.json
└── reports/
    ├── validation.json
    ├── coverage.json
    └── duplicates.json
```

## Fase 1 — Gobierno y convenciones

- [ ] Crear la carpeta raíz `DATASET/`.
- [ ] Crear `DATASET/README.md` con las reglas de contribución.
- [ ] Crear `DATASET/VERSION` con una versión inicial.
- [ ] Crear `DATASET/CHANGELOG.md`.
- [ ] Documentar la diferencia entre contenido `draft`, `reviewed` y
  `published`.
- [ ] Definir el proceso para corregir errores detectados en contenido
  publicado.
- [ ] Usar `kebab-case` para carpetas, archivos e IDs.
- [ ] Establecer que los IDs no cambian si se renombra o mueve el contenido.
- [ ] Limitar cada lote JSON a 25 actividades.
- [ ] Establecer inglés británico como variante editorial principal.
- [ ] Admitir variantes americanas cuando sean lingüísticamente correctas.
- [ ] Usar español para explicaciones y traducciones.
- [ ] Usar inglés para ejemplos, preguntas y respuestas.
- [ ] Prohibir contenido copiado de exámenes, libros o materiales propietarios.
- [ ] Crear una checklist de revisión lingüística.
- [ ] Crear una checklist de revisión pedagógica.
- [ ] Separar explícitamente:
  - Revisión humana del contenido del dataset.
  - Corrección automática de las respuestas del usuario.

## Fase 2 — Auditoría del temario

- [ ] Extraer de `DOC/README.md` una lista provisional de temas B1 y B2.
- [ ] No importar directamente esa lista como taxonomía definitiva.
- [ ] Contrastar cada tema con descriptores CEFR.
- [ ] Contrastar los tipos de ejercicio con B1 Preliminary y B2 First.
- [ ] Clasificar cada tema provisional como:
  - Confirmado.
  - Requiere cambio de nivel.
  - Demasiado amplio.
  - Duplicado.
  - No justificado.
- [ ] Dividir los temas grandes en objetivos de aprendizaje concretos.
- [ ] Definir prerrequisitos entre temas.
- [ ] Definir progresiones B1 → B2.
- [ ] Identificar contenidos presentes en ambos niveles con distinta
  profundidad.
- [ ] Eliminar categorías inconsistentes o redundantes.
- [ ] No asumir que CEFR contiene una lista cerrada de puntos gramaticales.
- [ ] Documentar las decisiones pedagógicas que no procedan directamente de una
  fuente oficial.
- [ ] Crear `references/sources.json`.
- [ ] Registrar para cada fuente:
  - ID interno.
  - Organización.
  - Título.
  - URL.
  - Fecha de consulta.
  - Uso permitido dentro del proyecto.
  - Notas.

## Fase 3 — Taxonomía y mapa curricular

- [ ] Crear `catalog/taxonomy.json`.
- [ ] Definir los niveles `B1` y `B2`.
- [ ] Definir las categorías definitivas.
- [ ] Definir temas y subtemas mediante valores controlados.
- [ ] Evitar tags libres cuando exista un valor en la taxonomía.
- [ ] Crear `catalog/curriculum-map.json`.
- [ ] Registrar para cada unidad:
  - Nivel.
  - Categoría.
  - Tema.
  - Subtema.
  - Objetivos de aprendizaje.
  - Prerrequisitos.
  - Referencias CEFR.
  - Referencias Cambridge.
  - Tipos de actividades compatibles.
  - Lecciones previstas.
- [ ] Crear `catalog/coverage-targets.json`.
- [ ] Definir objetivos de cobertura después de auditar la amplitud de cada
  tema.
- [ ] No aplicar automáticamente el objetivo provisional de 300 actividades por
  tema del README.
- [ ] Medir cobertura por:
  - Nivel.
  - Categoría.
  - Tema.
  - Subtema.
  - Tipo de actividad.
  - Dificultad.
- [ ] Mantener como meta global de producto:
  - 100 o más lecciones.
  - 10.000 o más actividades.
- [ ] No forzar una división exacta 50/50 entre B1 y B2 si la matriz curricular
  justifica otra distribución.

## Fase 4 — Contrato de las lecciones

- [ ] Crear `schemas/lesson.schema.json`.
- [ ] Crear `templates/lesson.template.md`.
- [ ] Definir el frontmatter obligatorio:
  - `schemaVersion`.
  - `id`.
  - `title`.
  - `level`.
  - `category`.
  - `topic`.
  - `subtopics`.
  - `difficulty`.
  - `estimatedMinutes`.
  - `learningObjectives`.
  - `prerequisites`.
  - `frameworkRefs`.
  - `relatedLessonIds`.
  - `tags`.
  - `status`.
  - `author`.
  - `reviewer`.
  - `contentVersion`.
- [ ] Definir las secciones obligatorias de una lección:
  1. Resumen.
  2. Objetivos.
  3. Explicación.
  4. Forma o estructura.
  5. Usos principales.
  6. Contrastes importantes.
  7. Ejemplos.
  8. Errores frecuentes.
  9. Excepciones relevantes.
  10. Mini resumen.
  11. Comprobación rápida autocorregible.
- [ ] Exigir ejemplos originales en inglés.
- [ ] Añadir traducción solamente cuando aporte valor.
- [ ] Evitar explicaciones absolutas cuando existan excepciones.
- [ ] No guardar listas masivas de actividades dentro de las lecciones.
- [ ] Obtener la relación lección → actividades desde los índices generados.

## Fase 5 — Contrato de las actividades

- [ ] Crear `schemas/activity.schema.json`.
- [ ] Crear `templates/activity-batch.template.json`.
- [ ] Hacer obligatorio `autoGradable: true`.
- [ ] Rechazar cualquier actividad que necesite interpretación humana.
- [ ] Definir los campos comunes:
  - `schemaVersion`.
  - `id`.
  - `status`.
  - `autoGradable`.
  - `level`.
  - `category`.
  - `topic`.
  - `subtopic`.
  - `difficulty`.
  - `instructions`.
  - `prompt`.
  - `lessonIds`.
  - `tags`.
  - `estimatedSeconds`.
  - `evaluator`.
  - `explanation`.
- [ ] Reemplazar `correctAnswer: string | string[]` por evaluadores
  discriminados.
- [ ] Implementar estas estrategias:
  - `boolean`.
  - `single_option`.
  - `multiple_options`.
  - `exact_text`.
  - `one_of_texts`.
  - `per_gap`.
  - `ordered_tokens`.
  - `unordered_set`.
  - `matching_pairs`.
- [ ] Definir reglas explícitas de normalización:
  - Espacios externos.
  - Espacios repetidos.
  - Mayúsculas.
  - Puntuación.
  - Apóstrofos.
  - Contracciones.
  - Variantes británicas y americanas.
- [ ] Exigir al menos una `lessonId` válida.
- [ ] Permitir varias lecciones cuando la actividad combine conocimientos.
- [ ] Añadir explicaciones posteriores a todas las actividades.
- [ ] Añadir feedback específico por distractor cuando sea útil.

## Fase 6 — Catálogo de actividades autocorregibles

### Tipos admitidos

- [ ] True/false.
- [ ] Single choice.
- [ ] Multiple select.
- [ ] Fill in the blank.
- [ ] Multi-gap fill.
- [ ] Multiple-choice cloze.
- [ ] Open cloze con respuestas finitas.
- [ ] Word formation.
- [ ] Matching.
- [ ] Word order.
- [ ] Sentence transformation restringida.
- [ ] Key word transformation restringida.
- [ ] Error identification.
- [ ] Error correction restringida.
- [ ] Complete dialogue con huecos u opciones.
- [ ] Complete paragraph con huecos u opciones.
- [ ] Vocabulary in context.
- [ ] Phrasal verb choice.
- [ ] Collocation choice.
- [ ] Preposition choice.
- [ ] Reading comprehension con preguntas cerradas.
- [ ] Reading matching.
- [ ] Gapped text con opciones cerradas.
- [ ] Guided writing determinista.

### Restricciones obligatorias

- [ ] Single choice tendrá exactamente una respuesta correcta.
- [ ] Multiple select tendrá al menos dos respuestas correctas.
- [ ] Matching tendrá pares únicos.
- [ ] Cada hueco tendrá su conjunto de respuestas aceptadas.
- [ ] Una transformación solo se publicará si sus respuestas válidas forman un
  conjunto finito.
- [ ] Error correction indicará con precisión qué debe corregirse.
- [ ] Open cloze almacenará todas las variantes válidas conocidas.
- [ ] Reading utilizará únicamente preguntas verificables objetivamente.
- [ ] Los distractores serán plausibles pero inequívocamente incorrectos.
- [ ] Si existen dos respuestas razonables:
  - Añadir ambas como aceptadas, o
  - Reescribir la actividad, o
  - Descartar la actividad.
- [ ] No usar similitud semántica para decidir si una respuesta es correcta.
- [ ] No usar embeddings para evaluar respuestas.
- [ ] No usar un LLM para evaluar respuestas.

## Fase 7 — Writing guiado

- [ ] Mantener lecciones sobre emails, artículos, essays, reviews e informes.
- [ ] No pedir al usuario que escriba un texto libre completo.
- [ ] Crear actividades para ordenar frases o párrafos.
- [ ] Crear actividades para elegir aperturas y cierres.
- [ ] Crear actividades para completar conectores.
- [ ] Crear actividades para seleccionar el registro adecuado.
- [ ] Crear actividades para reconstruir párrafos.
- [ ] Crear transformaciones formales/informales restringidas.
- [ ] Crear actividades para completar estructuras de opinión.
- [ ] Crear actividades para identificar elementos ausentes.
- [ ] Crear actividades para elegir topic sentences.
- [ ] Crear actividades para relacionar párrafos con su función.
- [ ] Prohibir:
  - Essays libres.
  - Emails libres.
  - Stories libres.
  - Reviews libres.
  - Rúbricas de evaluación subjetiva.
  - Campos de revisión manual.

## Fase 8 — Tooling y validación

- [ ] Crear scripts TypeScript independientes de la aplicación.
- [ ] Usar JSON Schema Draft 2020-12.
- [ ] Usar Ajv para validar JSON y frontmatter.
- [ ] Añadir `pnpm dataset:validate`.
- [ ] Añadir `pnpm dataset:index`.
- [ ] Añadir `pnpm dataset:coverage`.
- [ ] Añadir `pnpm dataset:duplicates`.
- [ ] Añadir `pnpm dataset:test-grading`.
- [ ] Añadir `pnpm dataset:all`.
- [ ] Validar estructura de carpetas.
- [ ] Validar que la ruta coincida con los metadatos.
- [ ] Detectar IDs duplicados.
- [ ] Detectar referencias rotas.
- [ ] Detectar lecciones sin actividades.
- [ ] Detectar actividades sin lección.
- [ ] Rechazar actividades sin evaluador automático.
- [ ] Rechazar evaluadores no deterministas.
- [ ] Comprobar cardinalidad de respuestas.
- [ ] Comprobar que una respuesta correcta no aparezca como distractor.
- [ ] Detectar duplicados exactos normalizados.
- [ ] Detectar posibles duplicados cercanos para revisión editorial.
- [ ] Generar índices deterministas.
- [ ] Generar informes de cobertura y dificultad.
- [ ] Ejecutar `dataset:all` en CI.

## Fase 9 — Piloto vertical

### Recorridos iniciales

- [ ] B1: future forms.
- [ ] B1: first y second conditionals.
- [ ] B2: modal perfects.
- [ ] B2: third y mixed conditionals.

### Trabajo por recorrido

- [ ] Confirmar primero su posición en el mapa curricular.
- [ ] Crear entre 2 y 4 lecciones.
- [ ] Crear lotes de true/false.
- [ ] Crear lotes de single choice.
- [ ] Crear lotes de multiple select.
- [ ] Crear lotes de fill in the blank.
- [ ] Añadir después cloze, transformations y error correction.
- [ ] Alcanzar entre 75 y 100 actividades por recorrido.
- [ ] Incluir dificultades 1–5.
- [ ] Probar cada respuesta correcta.
- [ ] Probar respuestas incorrectas representativas.
- [ ] Probar todas las variantes aceptadas.
- [ ] Corregir ambigüedades antes de producir más contenido.
- [ ] Congelar la versión 1 de los esquemas al terminar el piloto.

## Fase 10 — Producción masiva

- [ ] Crear actividades en lotes de 25.
- [ ] Limitar cada lote a un nivel, tema, lección y tipo.
- [ ] Variar contexto, vocabulario, sujeto, tiempo y dificultad.
- [ ] Evitar clones creados mediante sustituciones superficiales.
- [ ] Balancear la posición de las respuestas correctas.
- [ ] Explicar siempre la respuesta correcta.
- [ ] Diseñar distractores a partir de errores frecuentes reales.
- [ ] Crear actividades de contraste entre estructuras confundibles.
- [ ] Crear actividades acumulativas entre varias lecciones.
- [ ] Producir B1 y B2 en paralelo.
- [ ] Priorizar gramática y Use of English.
- [ ] Continuar con vocabulario, phrasal verbs, collocations y preposiciones.
- [ ] Incorporar reading después de validar sus esquemas.
- [ ] Incorporar writing guiado después de validar sus esquemas.
- [ ] No aumentar temas saturados mientras existan huecos relevantes.
- [ ] No considerar completo un tema solo por alcanzar una cifra.

## Fase 11 — Hitos de volumen

- [ ] Hito 1: estructura, esquemas y validadores.
- [ ] Hito 2: piloto con 8–16 lecciones y unas 400 actividades.
- [ ] Hito 3: gramática principal B1/B2 y 2.500 actividades.
- [ ] Hito 4: Use of English y 4.500 actividades acumuladas.
- [ ] Hito 5: vocabulario temático y 6.000 actividades acumuladas.
- [ ] Hito 6: phrasal verbs, collocations y preposiciones; 7.500 acumuladas.
- [ ] Hito 7: reading y writing guiado; 8.500 acumuladas.
- [ ] Hito 8: cubrir huecos y superar 10.000 actividades.
- [ ] Hito 9: superar 100 lecciones publicadas.
- [ ] Hito 10: auditoría final y versión `1.0.0`.

## Fase 12 — Control de calidad

- [ ] Revisar precisión gramatical.
- [ ] Revisar naturalidad del inglés.
- [ ] Revisar claridad de las explicaciones en español.
- [ ] Revisar adecuación B1/B2.
- [ ] Revisar todas las respuestas aceptadas.
- [ ] Revisar todos los distractores.
- [ ] Comprobar variantes británicas y americanas.
- [ ] Comprobar que no haya pistas involuntarias.
- [ ] Comprobar que el contenido sea original.
- [ ] Registrar el revisor antes de usar `published`.
- [ ] Mantener el ID cuando se corrija o reorganice contenido.
- [ ] Incrementar `contentVersion` al modificar contenido publicado.
- [ ] Incrementar `schemaVersion` para cambios de contrato.
- [ ] Registrar cambios relevantes en `CHANGELOG.md`.

## Criterios finales de aceptación

- [ ] Todo el dataset valida sin cargar la aplicación.
- [ ] Todas las actividades tienen `autoGradable: true`.
- [ ] No existen evaluadores manuales o basados en IA.
- [ ] No existen respuestas abiertas con soluciones no enumerables.
- [ ] Cada actividad pasa pruebas correctas, incorrectas y alternativas.
- [ ] No existen IDs duplicados.
- [ ] No existen referencias rotas.
- [ ] Los metadatos coinciden con sus rutas.
- [ ] Los índices se generan de forma determinista.
- [ ] Las lecciones publicadas tienen actividades asociadas.
- [ ] El contenido publicado ha pasado revisión lingüística y pedagógica.
- [ ] Ningún contenido publicado copia material oficial o propietario.
- [ ] La cobertura B1/B2 está justificada en el mapa curricular.
- [ ] Reading y writing son completamente autocorregibles.
- [ ] Existen al menos 100 lecciones publicadas.
- [ ] Existen al menos 10.000 actividades publicadas.
