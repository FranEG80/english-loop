# Guía de mantenimiento y ampliación del dataset

Esta guía explica cómo está organizado el dataset de EnglishLoop, qué representa
cada archivo y qué pasos deben seguirse para añadir o modificar contenido sin
romper sus contratos.

El objetivo es que una ampliación normal del contenido no requiera conocer la
implementación completa de la aplicación. Cuando el cambio introduce un nuevo
tipo de interacción o una nueva estrategia de corrección, sí es necesario
modificar tanto el dataset como el código de ejecución.

## 1. Modelo mental

El contenido está dividido en cuatro niveles:

1. **Taxonomía:** define el vocabulario controlado y la jerarquía pedagógica.
2. **Mapa curricular:** define qué se enseña, en qué nivel, con qué objetivos y
   mediante qué lecciones.
3. **Lecciones:** contienen la explicación pedagógica.
4. **Actividades:** permiten practicar y evaluar de forma autocorregible lo
   enseñado en las lecciones.

La relación principal es:

```text
taxonomía
└── unidad curricular
    └── lección
        └── lote de actividades
            └── actividad
```

Los índices y los informes no son fuentes de contenido. Se generan a partir de
los cuatro niveles anteriores.

## 2. Estructura del directorio `DATASET`

```text
DATASET/
├── VERSION
├── CHANGELOG.md
├── README.md
├── catalog/
│   ├── taxonomy.json
│   ├── curriculum-map.json
│   ├── coverage-targets.json
│   ├── lesson-index.json          # generado
│   ├── activity-index.json        # generado
│   └── practice-index.json        # generado
├── schemas/
│   ├── lesson.schema.json
│   ├── activity.schema.json
│   ├── taxonomy.schema.json
│   └── coverage.schema.json
├── templates/
│   ├── lesson.template.md
│   └── activity-batch.template.json
├── references/
│   ├── sources.json
│   └── curriculum-audit.md
├── lessons/
│   └── ...
├── activities/
│   └── ...
└── reports/
    ├── validation.json            # generado
    ├── coverage.json              # generado
    ├── practice-coverage.json     # generado
    └── duplicates.json            # generado
```

### 2.1. Fuentes de verdad

Estos archivos se editan manualmente:

- [`catalog/taxonomy.json`](../DATASET/catalog/taxonomy.json): árbol de
  categorías, temas, subtemas y destrezas.
- [`catalog/curriculum-map.json`](../DATASET/catalog/curriculum-map.json):
  unidades curriculares, objetivos y lecciones previstas.
- [`catalog/coverage-targets.json`](../DATASET/catalog/coverage-targets.json):
  objetivos mínimos de cobertura.
- [`lessons/`](../DATASET/lessons/): contenido explicativo.
- [`activities/`](../DATASET/activities/): actividades autocorregibles.
- [`references/sources.json`](../DATASET/references/sources.json): fuentes
  pedagógicas y de formato.
- [`VERSION`](../DATASET/VERSION) y
  [`CHANGELOG.md`](../DATASET/CHANGELOG.md): versión publicada e historial.
- Los esquemas, plantillas y scripts cuando cambia un contrato.

### 2.2. Archivos generados

No deben editarse manualmente:

- `catalog/lesson-index.json`
- `catalog/activity-index.json`
- `catalog/practice-index.json`
- `reports/validation.json`
- `reports/coverage.json`
- `reports/practice-coverage.json`
- `reports/duplicates.json`

Se regeneran con:

```bash
pnpm dataset:all
```

## 3. Conceptos y contratos

### 3.1. Taxonomía

La taxonomía es un árbol de identificadores pedagógicos estables. Cada nodo
contiene:

- `id`: identificador permanente en `kebab-case`.
- `parentId`: nodo padre o `null` para una raíz.
- `kind`: `category`, `topic`, `subtopic` o `skill`.
- `labels.en` y `labels.es`: nombres visibles.
- `levels`: niveles en los que es válido, `B1`, `B2` o ambos.
- `selectableForPractice`: indica si el usuario puede practicar ese alcance.
- `order`: posición editorial entre nodos hermanos.

Significado de cada clase de nodo:

- **Category:** área general, por ejemplo `grammar` o `vocabulary`.
- **Topic:** familia de contenidos, por ejemplo `verb-tenses`.
- **Subtopic:** objetivo temático más acotado, por ejemplo `future-forms`.
- **Skill:** conocimiento o capacidad concreta, por ejemplo
  `will-predictions`.

Los IDs son contratos, no etiquetas. Cambiar el texto visible no requiere
cambiar el ID. Un ID publicado no debe reutilizarse para otro significado.

### 3.2. Unidad curricular

Una unidad de `curriculum-map.json` expresa una decisión pedagógica:

- qué nivel cubre;
- a qué categoría, tema y subtema pertenece;
- qué destrezas trabaja;
- cuáles son sus objetivos observables;
- qué lecciones necesita;
- qué prerrequisitos tiene;
- qué fuentes la justifican;
- qué tipos de actividad son apropiados.

Campos principales:

- `id`: ID único de la unidad.
- `level`: `B1` o `B2`.
- `category`, `topic`, `subtopic`: IDs existentes en la taxonomía.
- `skills`: IDs existentes en la taxonomía.
- `learningObjectives`: resultados de aprendizaje.
- `prerequisites`: IDs de lecciones planificadas.
- `frameworkRefs`: IDs existentes en `references/sources.json`.
- `compatibleActivityTypes`: tipos recomendados para la unidad.
- `plannedLessonIds`: IDs de las lecciones que materializan la unidad.

La validación exige las dos direcciones:

- toda lección real debe aparecer en `plannedLessonIds`;
- todo ID incluido en `plannedLessonIds` debe tener una lección real.

Por tanto, el mapa actual funciona como catálogo efectivo, no como lista de
lecciones futuras todavía inexistentes.

### 3.3. Lección

Una lección es un archivo Markdown con:

1. frontmatter YAML estructurado;
2. explicación pedagógica en Markdown.

La ruta es estricta:

```text
DATASET/lessons/{nivel-en-minúsculas}/{category}/{topic}/{lesson-id}.md
```

Ejemplo:

```text
DATASET/lessons/b1/grammar/future-forms/
  b1-grammar-future-arrangements-timetables.md
```

El nombre del archivo debe coincidir con `frontmatter.id`.

El frontmatter define, entre otros:

- identidad, nivel y ubicación taxonómica;
- dificultad y duración estimada;
- objetivos de aprendizaje;
- prerrequisitos y lecciones relacionadas;
- referencias pedagógicas;
- estado editorial;
- autor, revisor y versión de contenido.

Las once secciones obligatorias son:

1. `Resumen`
2. `Objetivos`
3. `Explicación`
4. `Forma o estructura`
5. `Usos principales`
6. `Contrastes importantes`
7. `Ejemplos`
8. `Errores frecuentes`
9. `Excepciones relevantes`
10. `Mini resumen`
11. `Comprobación rápida autocorregible`

Los encabezados deben escribirse como encabezados Markdown de primer nivel:

```markdown
# Resumen
```

La plantilla canónica está en
[`templates/lesson.template.md`](../DATASET/templates/lesson.template.md).

### 3.4. Lote de actividades

Un lote agrupa actividades homogéneas. Todas sus actividades comparten:

- nivel;
- categoría;
- tema;
- subtema;
- lección principal;
- tipo de actividad.

La ruta es estricta:

```text
DATASET/activities/{nivel-en-minúsculas}/{category}/{topic}/
  {lessonId}/{activityType}/batch-NNN.json
```

Ejemplo:

```text
DATASET/activities/b1/grammar/future-forms/
  b1-grammar-future-arrangements-timetables/
  single_choice/batch-001.json
```

Cada lote contiene entre 1 y 25 actividades. Si alcanza 25, debe crearse el
siguiente lote: `batch-002.json`, `batch-003.json`, etc.

El `batchId` y los IDs de actividad usan `kebab-case`. El campo
`activityType`, en cambio, utiliza los valores `snake_case` definidos por el
contrato.

La plantilla canónica está en
[`templates/activity-batch.template.json`](../DATASET/templates/activity-batch.template.json).

### 3.5. Actividad

Una actividad es una unidad de práctica autocorregible. Sus campos comunes son:

- `schemaVersion`: versión del contrato JSON.
- `id`: ID único y permanente.
- `status`: estado editorial.
- `autoGradable`: siempre `true`.
- `level`: `B1` o `B2`.
- `type`: tipo de interacción.
- `category`, `topic`, `subtopic`: clasificación principal.
- `taxonomyNodeIds`: nodos concretos que evalúa.
- `difficulty`: entero entre 1 y 5.
- `instructions`: instrucciones en inglés.
- `prompt`: pregunta o enunciado en inglés.
- `passage`: texto de apoyo opcional.
- `options`, `tokens` o `pairs`: datos opcionales según la interacción.
- `lessonIds`: una o más lecciones relacionadas.
- `tags`: etiquetas controladas.
- `estimatedSeconds`: entre 10 y 900 segundos.
- `evaluator`: contrato de corrección.
- `explanation`: explicación posterior, normalmente en español.

Reglas importantes:

- `taxonomyNodeIds` debe contener como mínimo el valor de `subtopic`.
- Todos los nodos referenciados deben existir.
- Los nodos usados por actividades deben tener
  `selectableForPractice: true`.
- `lessonIds` debe contener el `lessonId` del lote.
- Todos los IDs de lección deben existir.
- Los metadatos de la actividad deben coincidir con los del lote.
- Los IDs deben ser únicos en todo el dataset, no solo dentro del lote.

### 3.6. Evaluador

El evaluador describe cómo se decide si una respuesta es correcta. Está
separado del tipo visual de actividad.

| Estrategia | Uso | Datos principales |
| --- | --- | --- |
| `boolean` | Verdadero/falso | `correct` |
| `single_option` | Una opción correcta | `correctOptionId` |
| `multiple_options` | Varias opciones correctas | `correctOptionIds` |
| `exact_text` | Un texto exacto normalizado | `answer`, `normalization` |
| `one_of_texts` | Varias respuestas textuales válidas | `answers`, `normalization` |
| `per_gap` | Respuestas válidas por hueco | `gaps`, `normalization` |
| `ordered_tokens` | Elementos en un orden exacto | `correctTokenIds` |
| `unordered_set` | Conjunto sin importar el orden | `correctValues`, `normalization` |
| `matching_pairs` | Correspondencias entre dos lados | `pairs` |

Las reglas de normalización permiten configurar:

- eliminación de espacios externos;
- colapso de espacios repetidos;
- sensibilidad a mayúsculas;
- ignorar puntuación final;
- normalización de apóstrofos.

El tipo de actividad y la estrategia de evaluación son conceptos diferentes.
Actualmente el esquema comprueba que cada evaluador sea internamente válido,
pero no impone una matriz completa de compatibilidad entre `type` y
`evaluator.strategy`. Esa compatibilidad debe revisarse editorialmente y en las
pruebas.

### 3.7. Estados editoriales

Los estados disponibles son:

- `draft`: contenido incompleto o todavía sujeto a cambios.
- `reviewed`: contenido terminado, pendiente de publicación.
- `published`: contenido disponible para usuarios.

Efectos:

- Los índices generales incluyen todos los estados e indican el estado de cada
  elemento.
- El índice de práctica y los informes de cobertura solo cuentan actividades
  `published`.
- La cobertura de lecciones solo cuenta lecciones `published`.
- Una lección publicada debe tener al menos una actividad publicada.

No existe actualmente un estado `retired` o `archived`. Antes de retirar
contenido ya publicado conviene definir esa política explícitamente en el
contrato, en vez de reutilizar `draft` con un significado distinto.

## 4. Flujo: añadir una actividad a una lección existente

Este es el cambio más pequeño y frecuente.

### Paso 1. Elegir la lección y el objetivo

Comprobar:

- que la lección existe;
- que el objetivo aparece en su unidad curricular;
- que el subtema o skill existe en `taxonomy.json`;
- que el nodo permite práctica;
- que el tipo está incluido en `compatibleActivityTypes` de la unidad.

La compatibilidad curricular es una regla editorial. Actualmente no se valida
automáticamente contra cada actividad.

### Paso 2. Elegir o crear el lote

Puede reutilizarse un lote si:

- tiene menos de 25 actividades;
- su nivel, categoría, tema, subtema, lección y tipo coinciden exactamente.

Si alguna de esas dimensiones cambia, debe utilizarse otro lote.

### Paso 3. Crear la actividad

Usar un ID nuevo y permanente. Una convención recomendable es:

```text
{lesson-id}-{tipo-en-kebab-case}-{secuencia}
```

Ejemplo:

```text
b1-grammar-future-arrangements-timetables-single-choice-026
```

La secuencia ayuda a mantener orden, pero la validación solo exige unicidad y
formato.

### Paso 4. Elegir el evaluador

Ejemplos habituales:

- `true_false` → `boolean`
- `single_choice` → `single_option`
- `multiple_select` → `multiple_options`
- `fill_blank` → `exact_text` o `one_of_texts`
- `multi_gap_fill` → `per_gap`
- `word_order` → `ordered_tokens`
- `matching` → `matching_pairs`

Estas asociaciones son recomendaciones del contrato actual; deben verificarse
según el contenido concreto.

### Paso 5. Revisar la calidad

Antes de publicar:

- debe existir una única interpretación correcta, o enumerarse todas las
  variantes válidas;
- los distractores deben ser plausibles pero inequívocamente incorrectos;
- el enunciado no debe contener pistas involuntarias;
- la explicación debe justificar la respuesta;
- el inglés debe ser natural y preferentemente británico;
- no debe copiarse material propietario;
- la corrección no puede depender de IA, similitud semántica ni revisión
  humana.

### Paso 6. Regenerar y validar

```bash
pnpm dataset:all
```

Revisar especialmente:

- `reports/validation.json`
- `reports/duplicates.json`
- `reports/coverage.json`

## 5. Flujo: crear un nuevo lote

Debe crearse un nuevo lote cuando:

- el lote actual ya contiene 25 actividades;
- cambia el tipo de actividad;
- cambia la lección principal;
- cambia cualquiera de las dimensiones compartidas.

Procedimiento:

1. Copiar `templates/activity-batch.template.json`.
2. Crear la ruta completa con el nivel, categoría, tema, lección y tipo.
3. Usar el siguiente nombre `batch-NNN.json` disponible.
4. Crear un `batchId` único en `kebab-case`.
5. Mantener iguales los campos compartidos del lote y sus actividades.
6. Incluir el `lessonId` del lote dentro de `lessonIds` de cada actividad.
7. Ejecutar `pnpm dataset:all`.

No hay que añadir el lote manualmente a un índice. El cargador descubre todos
los archivos `.json` bajo `DATASET/activities/`.

## 6. Flujo: crear una nueva lección

### Paso 1. Confirmar la taxonomía

Antes de crear la lección deben existir:

- su categoría;
- su tema;
- al menos un subtema o skill específico;
- el nivel de la lección dentro de `levels` de esos nodos.

Si no existen, seguir primero el flujo de nueva taxonomía.

### Paso 2. Crear o actualizar la unidad curricular

En `catalog/curriculum-map.json`:

1. localizar la unidad que cubre el objetivo, o crear una;
2. añadir el ID de la nueva lección a `plannedLessonIds`;
3. revisar objetivos, skills y tipos compatibles;
4. añadir sus prerrequisitos si procede;
5. comprobar que todos los `frameworkRefs` existen.

Los prerrequisitos de una unidad son IDs de lecciones presentes en el conjunto
de `plannedLessonIds` del mapa.

### Paso 3. Crear el archivo de lección

Copiar `templates/lesson.template.md` y colocarlo en:

```text
DATASET/lessons/{level}/{category}/{topic}/{lesson-id}.md
```

El nivel de la ruta se escribe en minúsculas.

### Paso 4. Completar el frontmatter

Comprobar:

- ID y ruta coincidentes;
- título de entre 5 y 120 caracteres;
- al menos un subtema;
- dificultad entre 1 y 5;
- duración entre 5 y 90 minutos;
- al menos dos objetivos únicos;
- al menos una referencia;
- al menos dos tags;
- prerrequisitos y relaciones existentes;
- `contentVersion: 1` para una lección nueva.

### Paso 5. Completar las secciones

Mantener los once encabezados obligatorios. La comprobación rápida debe ser
cerrada y autocorregible; no sustituye a los lotes de actividades.

### Paso 6. Añadir actividades

Si la lección se publica, necesita como mínimo una actividad publicada. Para
una publicación útil se recomienda cubrir varios tipos y dificultades según el
objetivo curricular.

### Paso 7. Ejecutar el pipeline

```bash
pnpm dataset:all
```

El índice de lecciones se generará automáticamente.

## 7. Flujo: crear un nuevo tema, subtema o skill

Este cambio afecta primero a la taxonomía y después al currículo.

### Paso 1. Determinar el nivel correcto

Antes de añadir un nodo:

- comprobar que no exista ya un concepto equivalente;
- decidir si es `topic`, `subtopic` o `skill`;
- definir si corresponde a B1, B2 o ambos;
- documentar la justificación pedagógica en
  `references/curriculum-audit.md` cuando sea una decisión relevante.

### Paso 2. Añadir el nodo a la taxonomía

En `catalog/taxonomy.json`:

1. crear un ID estable en `kebab-case`;
2. asignar un `parentId` existente;
3. elegir el `kind`;
4. añadir etiquetas en inglés y español;
5. declarar los niveles;
6. decidir `selectableForPractice`;
7. asignar un `order` coherente entre hermanos.

La validación comprueba:

- IDs duplicados;
- padres inexistentes;
- ciclos en el árbol;
- referencias rotas desde lecciones, currículo y actividades.

Aunque el esquema no exige actualmente un `order` único entre hermanos,
mantenerlo evita ordenaciones ambiguas.

### Paso 3. Crear o actualizar una unidad curricular

El nuevo nodo debe incorporarse a:

- `category`, `topic`, `subtopic` o `skills` de una unidad;
- sus objetivos de aprendizaje;
- tipos de actividad compatibles;
- lecciones que lo enseñarán.

### Paso 4. Decidir si necesita objetivo de cobertura

Añadir una entrada a `coverage-targets.json` solo cuando el nodo deba tener una
meta explícita:

```json
{
  "taxonomyNodeId": "nuevo-nodo",
  "level": "B1",
  "minimumActivities": 100,
  "minimumActivityTypes": 4,
  "requiredDifficulties": [1, 2, 3, 4, 5]
}
```

Un objetivo de cobertura:

- debe apuntar a un nodo existente;
- debe apuntar a un nodo seleccionable para práctica;
- cuenta también las actividades de sus descendientes;
- filtra por nivel;
- solo cuenta actividades publicadas;
- se convierte inmediatamente en un requisito de validación.

No debe añadirse como simple recordatorio futuro si todavía no se pretende
cumplirlo, porque el validador lo trata como un requisito actual.

### Paso 5. Crear lecciones y actividades

Seguir los flujos de las secciones anteriores y ejecutar:

```bash
pnpm dataset:all
```

## 8. Flujo: crear una nueva unidad curricular

Una unidad nueva no implica necesariamente una nueva categoría. Puede agrupar
una nueva secuencia de aprendizaje dentro de nodos existentes.

Procedimiento:

1. Crear un `id` único.
2. Seleccionar `level`, `category`, `topic` y `subtopic`.
3. Enumerar las skills concretas.
4. Escribir al menos objetivos observables y evaluables.
5. Añadir prerrequisitos como IDs de lección.
6. Añadir referencias existentes.
7. Enumerar tipos de actividad compatibles.
8. Crear las lecciones y añadir sus IDs a `plannedLessonIds`.
9. Ejecutar el pipeline completo.

Actualmente `curriculum-map.json` no tiene un JSON Schema dedicado. Parte de su
integridad se valida mediante código: IDs duplicados, referencias taxonómicas,
niveles, fuentes, prerrequisitos y correspondencia con lecciones. Los cambios
estructurales requieren especial cuidado porque un campo mal formado puede no
producir un error de esquema tan claro como en las lecciones o actividades.

## 9. Flujo: añadir un objetivo de cobertura

`coverage-targets.json` no registra actividades individualmente. Define
umbrales.

Hay dos niveles:

- `global`: mínimo total de lecciones y actividades publicadas;
- `nodes`: mínimos para una combinación de nodo taxonómico y nivel.

Para cada nodo se puede exigir:

- número mínimo de actividades;
- número mínimo de tipos distintos;
- dificultades obligatorias.

La cobertura de un nodo padre incluye actividades asociadas a sus
descendientes. Una actividad se considera una sola vez dentro del alcance de
práctica aunque referencie varios nodos aceptados.

Después de modificar objetivos:

```bash
pnpm dataset:coverage
pnpm dataset:validate
```

O ejecutar directamente:

```bash
pnpm dataset:all
```

## 10. Flujo: añadir una nueva fuente

Las fuentes se registran en `references/sources.json`.

Una entrada contiene:

- `id`;
- organización;
- título;
- URL;
- fecha de consulta;
- uso permitido;
- notas.

Procedimiento:

1. Añadir la fuente con un ID estable.
2. Describir para qué puede utilizarse.
3. Evitar copiar contenido protegido; las lecciones y actividades deben ser
   originales.
4. Referenciar el ID desde `frameworkRefs` de unidades y lecciones.
5. Ejecutar `pnpm dataset:validate`.

El validador comprueba que los IDs referenciados existan. Actualmente
`sources.json` no tiene un JSON Schema dedicado, por lo que también debe
revisarse manualmente su estructura.

## 11. Flujo: añadir un nuevo tipo de actividad

Este cambio es distinto de añadir una actividad de un tipo ya existente.
Requiere coordinar tres capas.

### 11.1. Capa 1: contrato del dataset

Actualizar:

1. El enum `activityType` de
   [`schemas/activity.schema.json`](../DATASET/schemas/activity.schema.json).
2. El tipo `ActivityType` de
   [`scripts/dataset/lib/types.ts`](../scripts/dataset/lib/types.ts).
3. La plantilla si el nuevo formato debe aparecer como ejemplo.
4. `compatibleActivityTypes` de las unidades curriculares pertinentes.
5. Las metas de cobertura si deben contar diversidad de tipos.

Si el tipo puede utilizar un evaluador existente, no es necesario crear una
estrategia nueva.

### 11.2. Capa 2: corrección

Si hace falta una estrategia de evaluación nueva, actualizar:

1. La unión `Evaluator` en `scripts/dataset/lib/types.ts`.
2. La definición `evaluator` en `schemas/activity.schema.json`.
3. La función de corrección en
   [`scripts/dataset/lib/grading.ts`](../scripts/dataset/lib/grading.ts).
4. Las comprobaciones específicas de contrato en
   [`scripts/dataset/lib/validation.ts`](../scripts/dataset/lib/validation.ts).
5. Los generadores de respuestas correctas, incorrectas y variantes en
   [`scripts/dataset/test-grading.ts`](../scripts/dataset/test-grading.ts).
6. Pruebas positivas, negativas y de normalización.

Una estrategia nueva no está terminada hasta que:

- acepta una respuesta válida;
- rechaza una respuesta inválida;
- acepta todas las variantes declaradas;
- no depende de inferencia semántica.

### 11.3. Capa 3: aplicación y experiencia de usuario

El dataset y la aplicación mantienen actualmente listas de tipos diferentes.
Añadir un tipo al dataset no garantiza que la interfaz pueda mostrarlo.

Para integrarlo en la aplicación hay que revisar como mínimo:

1. [`core/models/activity.ts`](../core/models/activity.ts): tipo de dominio y
   DTO necesarios.
2. Adaptadores que transformen el dataset o la API al DTO de actividad.
3. [`features/activities/activity-registry.ts`](../features/activities/activity-registry.ts):
   renderer, modos de interacción y clases de respuesta.
4. [`features/activities/ActivityRenderer.tsx`](../features/activities/ActivityRenderer.tsx):
   selección del renderer.
5. `features/activities/renderers/`: componente nuevo o reutilización de uno
   existente.
6. [`features/activities/illustrations.ts`](../features/activities/illustrations.ts):
   recurso visual por tipo.
7. Corrección utilizada por el adaptador o backend.
8. Datos mock que sigan utilizando esa capa.
9. Textos de interfaz y accesibilidad.
10. Pruebas del registro, renderer, envío y corrección.

La diferencia actual más visible es que el dataset usa `multiple_select`,
mientras que el modelo de aplicación usa `multiple_choice`. También existen
tipos admitidos por el dataset que todavía no aparecen en el modelo de
aplicación. Antes de ampliar la lista conviene unificar ambos vocabularios.

## 12. Flujo: corregir contenido existente

### 12.1. Corrección sin cambiar el objetivo pedagógico

Si se corrige redacción, explicación, opciones o respuestas aceptadas:

- conservar el ID;
- conservar la ruta siempre que siga correspondiendo a los metadatos;
- aumentar `contentVersion` en una lección;
- conservar el significado pedagógico;
- añadir una entrada al changelog si el cambio afecta resultados o contenido
  publicado;
- regenerar índices e informes.

Las actividades no tienen actualmente un campo `contentVersion`. Su historial
depende de la versión global del dataset y del changelog.

### 12.2. Cambio de objetivo pedagógico

No debe reutilizarse el ID anterior para un significado distinto.

Procedimiento:

1. Crear un nuevo elemento con un ID nuevo.
2. Mantener trazabilidad del anterior en el changelog.
3. Revisar currículo, referencias e índices.
4. Definir cómo retirar el contenido anterior.

El contrato actual no dispone de un estado específico para retirada. Si esta
operación se vuelve habitual, debe añadirse una política y un estado explícito.

### 12.3. Eliminación

Solo es segura para contenido que nunca haya sido publicado ni referenciado.
Antes de eliminar:

- buscar referencias desde lecciones;
- buscar referencias desde actividades;
- buscar `plannedLessonIds` y prerrequisitos;
- comprobar índices o datos persistidos que puedan conservar el ID.

Los IDs publicados deben considerarse permanentes.

## 13. Flujo de versionado y publicación

El versionado sigue SemVer:

- **mayor:** cambio incompatible de esquema o contrato;
- **menor:** ampliación compatible, como nuevas lecciones o actividades;
- **parche:** corrección editorial compatible.

Para preparar una publicación:

1. Terminar el conjunto de cambios.
2. Ejecutar `pnpm dataset:all`.
3. Revisar los informes generados.
4. Actualizar `DATASET/VERSION`.
5. Añadir la entrada correspondiente a `DATASET/CHANGELOG.md`.
6. Volver a ejecutar el pipeline para que los artefactos indiquen la nueva
   versión.
7. Confirmar que los archivos generados son deterministas.

Limitación actual: `scripts/dataset/index.ts` y
`scripts/dataset/practice-index.ts` tienen `generatedFromDatasetVersion:
"0.1.0"` escrito directamente. Hasta que lean `DATASET/VERSION`
automáticamente, un cambio de versión requiere actualizar también esos dos
scripts.

## 14. Comandos y qué hace cada uno

### `pnpm dataset:validate`

Comprueba:

- esquemas JSON;
- rutas de lecciones y lotes;
- secciones obligatorias;
- consistencia entre lote y actividades;
- contratos internos de evaluadores;
- IDs duplicados;
- árbol taxonómico;
- referencias entre catálogo, lecciones y actividades;
- correspondencia entre currículo y lecciones;
- cobertura mínima.

Escribe `reports/validation.json` y termina con error si encuentra problemas.

### `pnpm dataset:test-grading`

Para cada actividad:

- construye una respuesta correcta y exige que sea aceptada;
- construye una respuesta incorrecta y exige que sea rechazada;
- prueba las variantes aceptadas.

### `pnpm dataset:index`

Genera:

- `catalog/lesson-index.json`
- `catalog/activity-index.json`

Incluye todos los estados y conserva el campo `status`.

### `pnpm dataset:practice-index`

Genera `catalog/practice-index.json` para cada nodo seleccionable:

- descendientes;
- IDs únicos de actividades publicadas;
- conteos por nivel;
- conteos por dificultad;
- conteos por tipo.

### `pnpm dataset:coverage`

Genera:

- `reports/coverage.json`
- `reports/practice-coverage.json`

Solo cuenta lecciones y actividades publicadas.

### `pnpm dataset:duplicates`

Genera `reports/duplicates.json` con:

- prompts exactamente iguales después de normalización;
- pares cercanos dentro del mismo nivel, tipo y tema.

Los candidatos cercanos requieren revisión editorial; no son necesariamente
duplicados reales.

### `pnpm dataset:all`

Ejecuta, en este orden:

1. índices;
2. índice de práctica;
3. cobertura;
4. duplicados;
5. pruebas de corrección;
6. validación.

Consecuencia: los archivos generados se escriben antes de la validación final.
Si el dataset es inválido, el comando puede dejar informes o índices
regenerados y después terminar con error. Siempre debe revisarse el código de
salida y `reports/validation.json`.

## 15. Objetivos de cobertura durante el desarrollo

Los objetivos de `coverage-targets.json` son requisitos estrictos, no avisos.
El esquema global exige metas de al menos:

- 100 lecciones;
- 10.000 actividades.

El validador también convierte cada objetivo de nodo en error mientras no se
cumpla.

Esto tiene una implicación práctica: durante una construcción incremental, el
dataset puede ser estructuralmente correcto pero `dataset:validate` seguirá
fallando por cobertura incompleta. El informe permite distinguir los códigos
de cobertura de errores de contrato, pero el proceso actual no separa:

- validez estructural;
- meta de publicación.

Si se necesita validación incremental con salida correcta, conviene introducir
en el futuro dos modos separados, por ejemplo:

- validación de contrato y referencias;
- validación de preparación para publicación.

## 16. Matriz rápida de archivos que hay que modificar

| Cambio | Archivos fuente obligatorios | Archivos condicionales |
| --- | --- | --- |
| Nueva actividad de tipo existente | Lote en `DATASET/activities/` | Nuevo lote si se alcanzan 25 |
| Nuevo lote | Nuevo `batch-NNN.json` | Ninguno |
| Nueva lección | Markdown de lección y `curriculum-map.json` | Actividades; taxonomía si faltan nodos |
| Nuevo skill | `taxonomy.json` y `curriculum-map.json` | Cobertura, auditoría, lecciones y actividades |
| Nuevo subtema | `taxonomy.json` y `curriculum-map.json` | Cobertura, auditoría, lecciones y actividades |
| Nuevo tema | `taxonomy.json` y `curriculum-map.json` | Cobertura, auditoría, lecciones y actividades |
| Nueva categoría | `taxonomy.json` y `curriculum-map.json` | Cobertura, auditoría, lecciones y actividades |
| Nuevo objetivo de cobertura | `coverage-targets.json` | Actividades necesarias para cumplirlo |
| Nueva fuente | `references/sources.json` | Currículo y lecciones que la referencian |
| Nuevo tipo de actividad | Esquema y tipos del dataset | Currículo, UI, adapters, renderer, ilustración y pruebas |
| Nuevo evaluador | Esquema, tipos, grading, validación y pruebas | Renderer y DTO si cambia la respuesta |
| Corrección publicada | Contenido afectado y changelog | `contentVersion` de la lección |
| Nueva versión | `VERSION` y `CHANGELOG.md` | Scripts con versión fija mientras no se corrijan |

En todos los casos deben regenerarse los archivos derivados mediante
`pnpm dataset:all`.

## 17. Checklists finales

### Nueva actividad

- [ ] ID nuevo, estable, único y en `kebab-case`.
- [ ] Lote con menos de 25 actividades.
- [ ] Metadatos iguales a los del lote.
- [ ] `lessonIds` incluye la lección del lote.
- [ ] `taxonomyNodeIds` incluye el subtema específico.
- [ ] Nodo existente y seleccionable.
- [ ] Evaluador determinista.
- [ ] Respuestas y variantes completas.
- [ ] Explicación útil.
- [ ] Sin duplicados.
- [ ] Pipeline ejecutado.

### Nueva lección

- [ ] ID nuevo y ruta exacta.
- [ ] Nodos taxonómicos existentes y válidos para el nivel.
- [ ] Añadida al mapa curricular.
- [ ] Frontmatter completo.
- [ ] Once secciones obligatorias.
- [ ] Referencias existentes.
- [ ] Prerrequisitos existentes.
- [ ] Actividad publicada si la lección está publicada.
- [ ] Pipeline ejecutado.

### Nuevo nodo taxonómico

- [ ] No existe un nodo equivalente.
- [ ] ID estable.
- [ ] Padre existente.
- [ ] Clase de nodo correcta.
- [ ] Etiquetas bilingües.
- [ ] Niveles correctos.
- [ ] Decisión explícita sobre práctica.
- [ ] Orden editorial.
- [ ] Unidad curricular actualizada.
- [ ] Cobertura añadida solo si es un requisito actual.
- [ ] Auditoría pedagógica actualizada cuando procede.
- [ ] Pipeline ejecutado.

### Nuevo tipo de actividad

- [ ] Contrato JSON actualizado.
- [ ] Tipo TypeScript del dataset actualizado.
- [ ] Evaluador existente o estrategia nueva completa.
- [ ] Grading y pruebas actualizados.
- [ ] Currículo actualizado.
- [ ] Tipo de dominio de la aplicación actualizado.
- [ ] Registro y renderer actualizados.
- [ ] Ilustración y accesibilidad revisadas.
- [ ] Adaptadores actualizados.
- [ ] Pruebas de interfaz y corrección.
- [ ] Pipeline del dataset y suite de aplicación ejecutados.

## 18. Regla operativa resumida

Para ampliar contenido existente normalmente basta con:

1. editar o crear un lote bajo `DATASET/activities/`;
2. respetar el contrato y las referencias;
3. ejecutar `pnpm dataset:all`;
4. revisar validación, duplicados y cobertura.

Los catálogos e informes generados nunca deben mantenerse a mano. Solo hay que
modificar taxonomía, currículo, esquemas o código cuando cambia el significado
pedagógico o técnico del contenido, no por cada actividad adicional.
