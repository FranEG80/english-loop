# CD/CI

## Propuesta de integración continua y quality gates

> [!NOTE]
> Esta sección es una propuesta todavía no implementada. El repositorio aún
> no contiene una pipeline CI activa.

### Pull requests

La pipeline de cada pull request debería ejecutar, en paralelo cuando sea
posible:

* instalación reproducible con el lockfile;
* lint, typecheck, arquitectura y validación del dataset;
* tests unitarios, de componentes y de contratos con cobertura;
* tests de integración Prisma sobre una base aislada;
* build de producción;
* smoke E2E en Chromium;
* auditoría de accesibilidad sobre las rutas críticas.

Los artefactos de fallo deben conservar cobertura, traces y screenshots de
Playwright. Coverage y archivos temporales no deben versionarse.

### Nightly y release

La ejecución nocturna o previa a release debería añadir:

* E2E completo en Chromium, Firefox y WebKit;
* viewports móvil y tablet;
* regresión visual de las páginas críticas;
* mutation testing sobre evaluación, planners, review y transacciones;
* auditoría de dependencias, secretos y rendimiento;
* validación integral e importación idempotente del dataset.

### Política operativa propuesta

El objetivo sería mantener la validación de pull requests por debajo de diez
minutos mediante caché y paralelización, sin reintentos para tests unitarios y
con un único reintento E2E acompañado de trace. Cuando la pipeline se
implemente, esta propuesta deberá sustituirse por enlaces al workflow y a los
comandos reales.
