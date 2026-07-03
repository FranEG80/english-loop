## Skills discovery

Before starting a task, consult the `codebase-memory-mcp` knowledge graph index to discover the available skills and use any skill relevant to the request. If the graph index does not contain enough information about the required skill, inspect the `.agents/` directory for additional project-specific skills and instructions.

Call read-only codebase-memory-mcp tools automatically whenever useful. Do not ask for confirmation before querying the knowledge graph.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
