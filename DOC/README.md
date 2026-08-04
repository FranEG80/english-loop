# Documentación técnica de EnglishLoop

El [README de la raíz](../README.md) describe el producto y la puesta en marcha
rápida. Esta carpeta contiene la documentación técnica, operativa y las
propuestas que siguen sin implementarse.

## Arquitectura y backend

- [Arquitectura técnica](./ARCHITECTURE.md): módulos, dependencias y puntos de
  composición.
- [Backend](./BACKEND-README.md): core, API, Server Actions, persistencia,
  Better Auth, D1 y verificación.
- [Guía de deploy](./BACKEND-DEPLOYMENT-NEXT-STEPS.md): procedimiento para
  SQLite, PostgreSQL, MariaDB, D1, Vercel y Cloudflare, con sus límites reales.

## Dataset y producto

- [Flujo diario](./flow.md): recorrido funcional del Daily Loop.
- [Mantenimiento del dataset](./DATASET-CONTENT-WORKFLOWS.md): contratos,
  edición, validación, publicación e importación.
- [Assets](./assets/README.md): inventario y dirección visual de los recursos
  rasterizados.

## Propuestas

- [Propuesta de CD/CI](./CI-CD-PROPOSAL.md): quality gates previstos; no es una
  pipeline activa.

Los documentos de planificación de la primera release y los handoffs de trabajo
se han retirado. El código y estas guías describen el estado actual; no se
mantienen checklists históricas como fuente de verdad.
