# Inventario de vistas y conexión al backend

**Corte:** 27 de octubre de 2026. Este inventario cubre las rutas registradas
en Angular. Una vista está **conectada** cuando ella, un componente que incorpora
o un servicio/estado que consume ejecuta peticiones al API (`/api/v1`). No es una
prueba de disponibilidad del servidor en tiempo de ejecución.

## Seguimiento de vistas intervenidas

Una ruta solo se tacha cuando se haya revisado su tarea principal completa en
navegador, corregido sus problemas propios y ejecutado pruebas específicas. La
infraestructura transversal no cuenta como intervención terminada.

- [x] ~~`/app/crm-prospectos`~~ — 27-10-2026: listado con búsqueda, estado,
  paginación de 10/25/50, contador y vacío accionable; importar navega al flujo
  real y exportar descarga el resultado filtrado. El alta reemplaza la tabla,
  aparece dentro del primer viewport, agrupa sus 24 campos por propósito,
  conserva borradores y ofrece cierre visible. Sus 9 selectores son buscables.
  Verificado con datos reales mediante `check:crm-prospects-ux`.
- [x] ~~`/app/crm-prospectos/:id`~~ — 27-10-2026: las 9 secciones tienen
  semántica de pestañas, estado seleccionado anunciado, panel vivo y navegación
  horizontal en móvil; se corrigió el lenguaje principal. Las nueve secciones
  fueron recorridas en viewport móvil con datos reales y sin errores de página.
- [x] ~~`/app/crm-clientes`~~ — 27-10-2026: el directorio tiene búsqueda,
  ordenamiento, paginación y estado vacío; el alta sustituye el listado, aparece
  en el primer viewport y ofrece salida visible. Verificado con datos reales:
  10 filas iniciales, formulario a 216,75 px y cero errores de página.
- [x] ~~`/app/crm-clientes/:id`~~ — 27-10-2026: se separaron los estados de
  carga y no encontrado; las cuatro secciones usan semántica de pestañas y son
  navegables en móvil; los controles de edición tienen nombre accesible y se
  corrigió el lenguaje visible. Recorrido completo con datos reales y sin
  errores de página.
- [x] ~~`/app/crm-cotizaciones`~~ — 27-10-2026: se retiró la acción de plantilla
  que no hacía nada; se añadieron búsqueda, filtro por estado, paginación y
  exportación CSV real del resultado filtrado. El listado, la descarga generada
  y el alta en primer viewport se verificaron con datos reales y sin errores.

## Conectadas al backend

| Ruta | Vista / alcance | Evidencia de integración |
|---|---|---|
| `/auth/signin` | Inicio de sesión | `AuthService` y `AuthFlowsApiService` |
| `/auth/signup` | Registro | flujos de autenticación |
| `/auth/forgot-password` | Recuperar contraseña | flujos de autenticación |
| `/auth/change-password` | Cambiar contraseña | flujos de autenticación |
| `/auth/onboarding`, `/auth/onboarding2` | Onboarding | flujos de autenticación |
| `/app/dashboard` | Tablero principal | `FinanceBillingApiService` |
| `/app/calendar` | Calendario | `CalendarApiService` |
| `/app/main-menu`, `/app/main-menu/:moduleId`, `/app/grid-view` | Menú y buscador global | `GlobalSearchService` |
| ~~`/app/crm-prospectos`~~ | Prospectos | `CrmProspectsApiService`, equipos y seguimientos |
| ~~`/app/crm-prospectos/:id`~~ | Detalle del prospecto | `CrmProspectsApiService`, equipos y seguimientos |
| `/app/crm-equipment-reception-print/:recordId` | Acta imprimible de recepción | `CrmEquipmentApiService` |
| ~~`/app/crm-cotizaciones`~~ | Cotizaciones | `CrmQuotesApiService`, clientes, equipos y proyectos |
| ~~`/app/crm-clientes`~~ | Directorio y alta de clientes | `CrmClientsApiService` |
| ~~`/app/crm-clientes/:id`~~ | Detalle del cliente | `CrmClientsApiService` |
| `/estimate/:token` | Vista pública de cotización | `CrmQuotesApiService` |
| `/app/company-profile` | Perfil de empresa | `CompanySettingsApiService` |
| `/app/company-user-roles` | Usuarios, roles y permisos | `AclApiService` |
| `/app/company-acl-hr-playground` | Pruebas ACL/RR. HH. | `AclApiService` y `HrApiService` |
| `/app/suppliers-dashboard`, `/app/suppliers-crud` | Proveedores | `SuppliersCatalogService` delega en `SuppliersApiService` |
| `/app/suppliers-orders-history` | Órdenes de proveedor | `SuppliersApiService` |
| `/app/company-hr-employees` | Directorio de colaboradores | `HrApiService` |
| `/app/company-hr-worktime` | Jornada y calendario laboral | `WorktimeApiService` |
| `/app/company-hr-documents` | Expedientes y documentos RR. HH. | `HrApiService` y `HrDocumentsApiService` |
| `/app/company-equipment-config` | Catálogos de equipos | store conectado al API de catálogos/equipos |
| `/app/company-projects-config` | Configuración de flujo de proyectos | `ProjectService` sincronizado con API de proyectos |
| `/app/advanced-security-ip-restrictions` | Restricciones IP | `AdvancedSecurityApiService` |
| `/app/finance-dashboard` | Tablero financiero | `CrmEquipmentApiService` |
| `/app/finance-caja-menor` | Caja menor | `FinanceExpensesApiService`, `FinanceSettingsApiService` |
| `/app/finance-cuentas` | Cuentas | `FinanceAccountsApiService` |
| `/app/finance-pagos` | Pagos | APIs de pagos, facturación y proyectos |
| `/app/finance-facturacion` | Facturación | `FinanceBillingApiService` |
| `/app/finance-facturacion-crear`, `/app/finance-facturacion/editar/:id` | Crear/editar factura | `FinanceBillingApiService` |
| `/app/finance-facturacion-recurrentes`, `/app/finance-facturacion-recurrente` | Facturas recurrentes | `FinanceBillingApiService` |
| `/app/finance-facturacion-recurrentes-crear`, `/app/finance-facturacion-recurrente-crear` | Crear recurrente | `FinanceBillingApiService` |
| `/app/finance-facturacion-tiempo` | Facturación por tiempo | APIs de facturación, configuración y tiempo |
| `/app/finance-garantias` | Garantías | `FinanceWarrantiesApiService` |
| `/app/finance-clientes-credito` | Crédito de clientes | `CrmClientsApiService` |
| `/app/inventory-dashboard` | Centro de control inventario | `InventoryWorkflowService` → `InventoryApiService` |
| `/app/inventory-stock` | Stock | workflow y creación de referencias contra API de inventario |
| `/app/inventory-movements` | Movimientos | workflow de inventario y proyectos sincronizados |
| `/app/inventory-reservations` | Reservas | workflow/acciones contra API de inventario |
| `/app/inventory-orders` | Reabastecimiento | `InventoryApiService`, workflow y proyectos |
| `/app/inventory-order-details` | Conciliación | workflow contra API de inventario |
| `/app/profile-professional` | Perfil profesional / empleado | APIs de RR. HH., ACL y documentos |
| `/app/work-projects`, `/app/work-projects/:id` | Tablero Kanban operativo | `ProjectsApiService`, inventario, CRM, RR. HH., correo y tiempos |
| `/app/work-tasks` | Tareas | `ProjectService` / `TaskService` sincronizados |
| `/app/work-workload` | Carga de trabajo | proyectos y selector de personal conectado |
| `/app/work-test-batches` | Lotes de prueba | `ProjectService` sincronizado |
| `/app/work-timesheet` | Hoja de tiempo | APIs de tiempos, proyectos, equipos y RR. HH. |
| `/app/work-teams`, `/app/work-equipment-reception` | Equipos / recepción operativa | `CrmEquipmentApiService` |
| `/app/work-equipment-history` | Historial técnico de equipos | APIs de CRM, proyectos e inventario |
| `/app/remissions` | Remisiones y despacho | llamadas directas a remisiones, proyectos, cotizaciones y equipos |
| `/app/documentation` | Documentación y respaldos | llamadas directas a `/api/v1/documentation/*` |

## Sin conexión al backend

Estas vistas no tienen una llamada API identificable en su componente ni en los
servicios que usan actualmente. Sus datos son estáticos, de demostración o sólo
persisten en el navegador.

| Ruta | Vista / observación |
|---|---|
| `/auth/signup-success` | Confirmación estática de registro |
| `/app/crm-carga-bases` | Interfaz de carga sin cliente API conectado |
| `/app/inbox`, `/app/compose-mail`, `/app/chat` | Plantillas de correo/chat; no usan `EmailsApiService` |
| `/app/company-career`, `/app/company-contact-us`, `/app/company-help-center`, `/app/company-management`, `/app/company-resources` | Páginas corporativas estáticas |
| `/app/company-hr-dashboard` | Resumen visual de RR. HH. estático |
| `/app/company-hr-compensation`, `/app/company-hr-health`, `/app/company-hr-leaves`, `/app/company-hr-audit` | Datos demo o almacenamiento local |
| `/app/company-commercial-config`, `/app/company-followups-config` | Configuración en stores/localStorage, sin API |
| `/app/contact-us`, `/app/explorer` | Plantillas sin integración |
| `/app/finance-bank`, `/app/finance-crypto`, `/app/finance-rewards`, `/app/finance-wallet` | Tableros financieros de plantilla |
| `/app/forum`, `/app/forum-details` | Foro de plantilla |
| `/app/learning-courses`, `/app/learning-dashboard`, `/app/learning-institutions` | Módulo educativo de plantilla |
| `/app/account-settings`, `/app/my-earning`, `/app/my-profile`, `/app/my-subscription`, `/app/statement`, `/app/payment`, `/app/subscription-plans` | Perfil/pagos de plantilla |
| `/app/network-dashboard`, `/app/network-performance`, `/app/network-smart-home` | Módulo de red de plantilla |
| `/app/privacy-policy`, `/app/terms-of-use` | Contenido legal estático |
| `/app/profile-analytical`, `/app/profile-social` | Perfiles de demostración |
| `/app/project-dashboard`, `/app/project-projects` | Vistas de proyectos de plantilla; distintas del Kanban operativo |
| `/app/social-analytics`, `/app/social-dashboard`, `/app/social-schedular` | Módulo social de plantilla |
| `/app/timeline`, `/app/personalization` | Línea de tiempo y preferencias locales |
| `/not-found`, `/under-construction`, `/coming-soon` | Vistas auxiliares estáticas |

## Rutas de redirección o alias

No son vistas independientes: `/app` redirige a `main-menu`; `/app/project-board`
redirige a `work-projects`; `/auth` redirige a `signin`; la raíz y rutas no
encontradas también terminan en `signin` o `not-found` según el layout.

## Fuentes revisadas

- `src/app/layouts/*/*.routes.ts` para el catálogo de rutas.
- `src/app/pages/**` para imports y llamadas directas.
- `src/app/services/*-api.service.ts`, los stores y los workflows para detectar
  dependencias indirectas hacia el backend.

**Nota de mantenimiento:** al conectar una vista actualmente local, muévela a
la primera tabla y registra el servicio/API que consume.

## Auditoría UX/UI contra los principios unificados

### Resultado ejecutivo

**Ninguna vista puede declararse plenamente conforme todavía.** La razón no es
solo técnica: el principio rector exige observación y prueba con personas reales,
y el repositorio no conserva evidencia de esas pruebas por vista. Además, la
regla nueva de que *todo* `select` tenga buscador no se cumple de forma global.

La auditoría es estática (código fuente), no una validación visual ni una prueba
de usuarios. Por eso `parcial` significa “hay evidencia de buenos mecanismos,
pero no de todos los principios ni de prueba con usuarios”.

| Estado | Significado |
|---|---|
| **No certificable** | No hay evidencia de investigación/prueba con usuarios o hay una infracción conocida. No puede recibir cumplimiento total. |
| **Parcial** | Tiene carga/error/guardado, validación, confirmación o recuperación en partes importantes, pero faltan criterios. |
| **No cumple** | Es una plantilla/local o tiene brechas que impiden el flujo fiable requerido. |

### Regla obligatoria: `select` con búsqueda

**Resultado actual: cobertura técnica completa.** Se localizaron **284** etiquetas
`<select>` en **95** componentes de vistas. Al inicio había solo **47**
configuraciones explícitas `Choices({ searchEnabled: true })` en **44**
componentes. Ahora `SelectEnhancementService` cubre automáticamente los
selectores restantes, incluidos los creados o actualizados después de cargar
datos. Los widgets existentes conservan su búsqueda activa.

Aunque la cobertura técnica ya es global, estos flujos deben validarse primero
con personas usuarias porque manejan catálogos, personas, estados o decisiones:

| Prioridad | Rutas afectadas | Motivo de validación humana prioritaria |
|---|---|---|
| P0 | CRM, proyectos y trabajo | Alta frecuencia, dependencias entre catálogos y transiciones de estado. |
| P0 | Inventario | Cambios de existencias y reservas con consecuencias operativas. |
| P0 | Finanzas | Emisión, pagos y movimientos con impacto económico. |
| P1 | Administración | Permisos y configuraciones que afectan a otros usuarios. |
| P1 | RR. HH. | Datos personales, documentos y jornada laboral. |
| P2 | Plantillas y páginas locales | Menor impacto operativo, pero requieren revisión de accesibilidad. |

**Criterio de salida para cada control:** sustituir el `select` nativo por un
componente accesible con filtro por texto y teclado; conservar etiqueta, valor
seleccionado, estado de carga, vacío y error. No basta con añadir una búsqueda
general a la tabla: el buscador debe estar dentro del selector. Debe probarse
con mouse, teclado, lector de pantalla y móvil.

### Matriz por ruta: flujos conectados y priorizados

`Select` cuenta los `<select>` del componente de la ruta. `Buscador` cuenta
configuraciones explícitas `searchEnabled: true` allí; no cuenta un buscador de
tabla. `Feedback` se basa en evidencia de carga/error/guardado/confirmación en
el código. Esto deja claro qué se sabe y qué falta, sin inferir calidad visual.

| Ruta | Select / buscador | Feedback | Veredicto y siguiente acción |
|---|---:|---|---|
| `/app/calendar` | 1 / 1 | Sí | **Pendiente de intervención propia**; tiene buscador, pero no auditoría integral. |
| ~~`/app/crm-prospectos`~~ | 9 / 9 | Sí | **Intervenida integralmente**: listado y alta verificados con datos reales; pendiente únicamente validación con usuarios representativos. |
| ~~`/app/crm-prospectos/:id`~~ | 6 / 6 | Sí | **Intervenida**: las 9 secciones fueron verificadas en móvil; pendiente validación con usuarios representativos. |
| ~~`/app/crm-clientes`~~ | 3 / 3 | Sí | **Intervenida**: listado y alta verificados con datos reales; pendiente únicamente validación con usuarios representativos. |
| ~~`/app/crm-clientes/:id`~~ | 0 / 0 | Sí | **Intervenida**: cuatro secciones y edición en contexto verificadas en móvil; pendiente validación con usuarios representativos. |
| ~~`/app/crm-cotizaciones`~~ | 8 / 8 | Sí | **Intervenida**: listado, exportación y alta verificados con datos reales; pendiente únicamente validación con usuarios representativos. |
| `/app/company-user-roles` | 6 / 6 | Sí | **Pendiente de intervención propia**; búsqueda cubierta, flujo sin auditar. |
| `/app/finance-facturacion` | 2 / 2 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/finance-facturacion-crear`, `/editar/:id` | 10 / 10 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/finance-pagos` | 8 / 8 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/inventory-dashboard` | 1 / 1 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/inventory-stock` | 7 / 7 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/inventory-movements` | 4 / 4 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/inventory-reservations` | 3 / 3 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/inventory-orders` | 8 / 8 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/inventory-order-details` | 3 / 3 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/work-projects`, `/app/work-projects/:id` | 15 / 15 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/work-timesheet` | 6 / 6 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/work-teams`, `/app/work-equipment-reception` | 1 / 1 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/remissions` | 3 / 3 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| `/app/documentation` | 1 / 1 | Sí | **Pendiente de intervención propia**; solo tiene la línea base transversal. |
| Resto de flujos conectados | No auditado control por control | Variable | **No certificable** hasta inventariar sus controles, estados y prueba de tarea. |

Los conteos muestran la cobertura efectiva tras la intervención: configuración
local o mejora global en tiempo de ejecución. Las rutas P0 son el primer lote de
pruebas con usuarios, no trabajo pendiente de selectores.

### Vistas que no cumplen o no son certificables hoy

| Grupo | Estado | Motivo principal |
|---|---|---|
| `crm-carga-bases`, inbox, compose-mail y chat | **No cumple** | integración ausente o plantilla; no hay flujo completo verificable contra datos reales |
| Career, contacto, ayuda, gestión, recursos y configuraciones locales | **No cumple** | datos estáticos/locales; no hay garantía de persistencia ni recuperación consistente |
| Dashboard RR. HH., compensación, salud, licencias y auditoría | **No cumple** | paneles locales/demo sin evidencia de carga, error y cierre real |
| Bank, crypto, rewards, wallet, foro, learning, perfil/pagos, red y social | **No cumple** | son vistas de plantilla sin flujo de producto validado |
| Project dashboard y project-projects | **No cumple** | plantillas independientes del Kanban operativo |
| Legal, timeline, personalization, not-found, under-construction y coming-soon | **No certificable** | vistas auxiliares/estáticas; la mayoría no requiere formulario, pero tampoco evidencia de accesibilidad o pruebas con usuarios |

### Lista de verificación para certificar una vista

Una vista solo pasa a **cumple** cuando se verifica lo siguiente en QA y con
usuarios representativos:

- Cada acción muestra inmediatamente `cargando`, éxito o error claro y la
  respuesta inicial llega o se percibe en menos de 500 ms.
- Todos los `select` de la vista tienen búsqueda integrada y soporte de teclado.
- Campos invalidables previenen errores; acciones destructivas piden
  confirmación y existe recuperación o deshacer cuando aplica.
- Los formularios preservan el trabajo ante cierre, navegación, fallo de red y
  recarga; no solo en algunos flujos.
- La ruta, título, estados y salida/cancelación hacen visible dónde está el
  usuario y cómo concluir o abandonar el flujo.
- Se prueba con lectores de pantalla, teclado, móvil y personas usuarias reales;
  se registran hallazgos, tasa de éxito, errores y tiempo de tarea.
