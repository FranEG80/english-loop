# EnglishLoop Dataset

Fuente independiente y versionada de las lecciones y actividades B1/B2 de
EnglishLoop. Ningún archivo de este directorio depende de Next.js, una base de
datos o servicios externos.

## Convenciones editoriales

- Los IDs, rutas y nombres de archivo usan `kebab-case`.
- Un ID es permanente: no cambia al mover o renombrar contenido.
- El inglés británico es la variante principal. Se aceptan variantes americanas
  correctas cuando no alteran el objetivo evaluado.
- Las explicaciones y traducciones se escriben en español.
- Los ejemplos, instrucciones, preguntas y respuestas se escriben en inglés.
- Todo el contenido es original. No se copian preguntas, textos ni respuestas de
  exámenes, manuales o materiales propietarios.
- Cada lote contiene como máximo 25 actividades y se limita a un nivel, tema,
  lección y tipo de actividad.
- Cada actividad es autocorregible de forma determinista y referencia el nodo
  más específico de la taxonomía que evalúa.

## Estados

- `draft`: contenido incompleto o todavía sujeto a cambios estructurales.
- `reviewed`: contenido terminado y comprobado, pendiente de publicación.
- `published`: contenido disponible para usuarios e incluido en índices.

Por decisión del propietario del proyecto, la versión inicial se publica sin una
fase separada de revisión humana. El valor
`publication-authorised-by-project-owner` deja constancia de esa autorización
sin afirmar que hubo una revisión lingüística externa.

## Corrección de errores publicados

1. Mantener el ID y la ruta siempre que el objetivo pedagógico no cambie.
2. Corregir la explicación, las opciones o las respuestas aceptadas.
3. Incrementar `contentVersion`.
4. Añadir una entrada al changelog cuando el cambio pueda afectar resultados.
5. Regenerar índices e informes con `pnpm dataset:all`.
6. Si cambia el objetivo pedagógico, retirar el elemento anterior y crear otro
   ID; nunca reutilizar un ID con significado distinto.

## Checklist lingüística

- La frase es natural y completa en el contexto indicado.
- Solo hay una interpretación correcta, o todas las variantes válidas están
  enumeradas.
- La ortografía, puntuación y concordancia son correctas.
- Las contracciones y variantes británicas/americanas se tratan explícitamente.
- Los distractores son plausibles, pero inequívocamente incorrectos.
- La explicación identifica la regla y no se limita a repetir la respuesta.

## Checklist pedagógica

- El objetivo pertenece al nivel declarado.
- La dificultad refleja la carga lingüística, no la longitud superficial.
- El enunciado aporta contexto suficiente y no contiene pistas accidentales.
- La actividad evalúa el nodo más específico posible.
- Los ejemplos y contextos son variados, inclusivos y adecuados para adultos.
- La respuesta puede evaluarse sin inferencia semántica, IA ni revisión manual.
- La actividad contribuye a la cobertura indicada en el mapa curricular.

## Comandos

- `pnpm dataset:validate`: contratos, rutas, referencias, cardinalidad y árbol.
- `pnpm dataset:test-grading`: pruebas positivas, negativas y variantes.
- `pnpm dataset:index`: índices de lecciones y actividades.
- `pnpm dataset:practice-index`: resolución de descendientes para práctica.
- `pnpm dataset:coverage`: cobertura curricular y de práctica.
- `pnpm dataset:duplicates`: duplicados exactos y candidatos cercanos.
- `pnpm dataset:all`: ejecuta todo en orden y vuelve a validar.

Los índices e informes son deterministas: con el mismo contenido deben producir
exactamente los mismos bytes.
