# `features/`

Cada subcarpeta agrupa la presentación e interacción de una feature del
producto (componentes, hooks de UI, orquestación ligera). Las features nunca
importan `adapters/mock` ni `adapters/rest` directamente: resuelven puertos a
través de `adapters/adapter-factory.ts`.

Se irán poblando a partir de la Fase 4 del
[plan de frontend](../DOC/FRONTEND-PLAN.md): `auth`, `landing`, `daily`,
`lessons`, `activities`, `practice`, `review`, `dashboard`, `settings`.
