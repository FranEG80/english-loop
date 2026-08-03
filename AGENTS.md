## Skills discovery

Before starting a task, consult the `codebase-memory-mcp` knowledge graph index to discover the available skills and use any skill relevant to the request. If the graph index does not contain enough information about the required skill, inspect the `.agents/` directory for additional project-specific skills and instructions.

Call read-only codebase-memory-mcp tools automatically whenever useful. Do not ask for confirmation before querying the knowledge graph.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Testing obligatorio para cambios

Todo cambio de comportamiento debe incluir sus pruebas en el mismo cambio.

Aplica esta correspondencia:

- `core/`: tests unitarios de reglas, casos de uso, errores e invariantes.
- `app/`: tests de páginas, layouts, estados de carga/error y Route Handlers;
  los Server Components asíncronos se cubren con E2E.
- `server/`: tests unitarios de infraestructura, contratos HTTP, autenticación,
  seguridad, logging, composición y persistencia; los repositorios requieren
  integración contra una base aislada.
- `app/api/`: tests del Route Handler para éxito, validación, autenticación,
  autorización y errores.
- Server Actions: tests de validación, efectos, redirects y errores.
- `features/` y `shared/`: tests de componente, utilidades e interacción
  accesible.
- Prisma y persistencia: tests de contrato, aislamiento, transacciones y
  migraciones.
- Adapters: tests de serialización, errores y compatibilidad con el puerto.
- `scripts/`: tests unitarios de transformaciones y comandos; los scripts que
  generan archivos deben tener un smoke test en un directorio temporal y ser
  deterministas.
- `DATASET/`: fixtures de validación, grading, referencias, importación y
  cobertura.
- Cada bug corregido debe incluir una prueba de regresión.
- Los Server Components asíncronos y los recorridos completos deben cubrirse
  con E2E.

Un cambio no está terminado si deja tests fallando, añade un `skip` sin
justificación o reduce la cobertura relevante sin explicar el motivo. Si una
prueba no es viable, documenta el riesgo, la razón y la cobertura alternativa.
