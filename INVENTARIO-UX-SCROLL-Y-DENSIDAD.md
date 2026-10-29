# Inventario UX — scroll y densidad de información

**Corte:** 29 de octubre de 2026  
**Método:** revisión estática de componentes Angular operativos. La señal inicial
combina cantidad de controles, tablas, secciones repetibles y modales. No
certifica el resultado visual: cada ítem priorizado debe recorrerse en navegador
en escritorio (1366×768) y móvil (390×844) antes de cerrarse.

## Objetivo

Reducir el scroll evitable sin ocultar información, desactivar scroll ni quitar
capacidad operativa. Para cada pantalla se elegirá la composición adecuada:

| Situación | Patrón preferido |
|---|---|
| Formulario con campos opcionales o de baja frecuencia | Acordeones cerrados por defecto; campos requeridos y frecuentes visibles. |
| Formulario largo con pasos que dependen uno de otro | Pestañas o paso a paso, con resumen persistente y validación por sección. |
| Tabla ancha | DataTable con búsqueda, filtros, paginación, columnas prioritarias y ficha/drawer para el detalle. |
| Varias tarjetas o paneles independientes | Resumen superior, bloques plegables y orden por frecuencia de uso. |
| Acción de creación desde un listado | Sustituir el listado por el formulario o abrir un panel lateral; evitar apilar ambos. |

**Regla:** no se usa un acordeón para esconder un campo obligatorio sin señal de
error/estado. En móvil, pestañas y tablas deben conservar una alternativa
vertical legible.

## Ya intervenidas

| Ruta | Estado | Resultado |
|---|---|---|
| `/app/crm-prospectos` | Hecho | El alta usa cuatro columnas en escritorio, elimina encabezado redundante durante edición, compacta espaciado y deja **Sedes y contactos** como bloque opcional plegable. El scroll queda disponible para sucursales dinámicas y móvil. |
| `/app/crm-prospectos/:id` | Hecho anteriormente | Las secciones están organizadas como pestañas y cuentan con navegación móvil. |
| `/app/crm-clientes`, `/app/crm-cotizaciones` | Hecho anteriormente | Listados con búsqueda, filtros, paginación, vacío accionable y alta separada del listado. |

## Backlog priorizado — flujos operativos

| Prioridad | Ruta / componente | Señal encontrada | Riesgo de scroll o densidad | Propuesta de intervención | Cierre verificable |
|---|---|---|---|---|---|
| P0 | `/app/work-projects` — `projects/kanban-view.component.ts` | 87 controles/estructuras y 3 tablas | Kanban, filtros, ficha y formularios viven en un componente muy denso. | Mantener tablero visible; mover edición extensa a panel lateral con secciones plegables y resumen de proyecto fijo. | Crear/editar proyecto y cambiar estado sin perder contexto; 1366×768 sin scroll inicial innecesario. |
| P0 | Modal de asociar/crear equipo en Prospectos — `crm/crm-prospect-equipment-modal.component.ts` | 52 controles/estructuras | Modal largo: el usuario puede perder pasos, acciones y contexto del prospecto. | Paso a paso para datos del equipo/recepción, con resumen compacto del equipo y botones persistentes. | Recorrer todos los pasos en escritorio y móvil, incluidos errores de validación. |
| P0 | `/app/finance-facturacion-crear`, `/editar/:id` — `finance/finance-invoice-create.component.ts` | 27 controles y tabla | Formulario de factura más líneas/items puede superar un viewport rápidamente. | Encabezado/resumen de factura fijo; pestañas para datos generales, ítems e impuestos; DataTable de ítems con edición en línea. | Crear, editar y guardar factura con varios ítems sin perder total ni acción de guardado. |
| P0 | `/app/finance-pagos` — `finance/finance-pagos.component.ts` | 28 controles y 3 tablas | Filtros, registro y varias tablas compiten en una sola pantalla. | Separar listado y registro; DataTable principal y panel de detalle/conciliación bajo demanda. | Filtrar, registrar y conciliar un pago desde escritorio y móvil. |
| P0 | `/app/remissions` — `remissions/remissions.component.ts` | 29 controles y 2 tablas | Flujo de despacho combina datos de cabecera, equipos y evidencias. | Flujo por secciones con resumen de remisión fijo; tabla de equipos con columnas prioritarias y detalle expandible. | Generar y revisar una remisión con varios equipos sin desplazamiento horizontal. |
| P0 | `/app/inventory-stock` — `inventory/inventory-stock-workbench.component.ts` | 22 controles | Banco de trabajo de stock tiene filtros, creación y movimientos relacionados. | DataTable de referencias; filtros compactos; creación/ajuste en drawer con secciones opcionales plegables. | Buscar, ajustar y crear referencia con teclado y móvil. |
| P0 | `/app/inventory-orders` — `inventory/inventory-replenishment.component.ts` | 17 controles y 3 tablas | Reabastecimiento concentra candidatos, órdenes y detalle. | Vista maestra-detalle: una tabla principal y panel de detalle; ocultar tablas secundarias hasta seleccionar una orden. | Crear, aprobar y consultar una orden sin tres tablas simultáneas. |
| P0 | `/app/inventory-order-details` — `inventory/inventory-reconciliation.component.ts` | 11 controles y 2 tablas | Conciliación suele necesitar comparar cantidades y diferencias. | Tabla comparativa con columnas fijas/priorizadas; evidencia y decisión en drawer o acordeón. | Conciliar ítems con diferencia, incluyendo error y confirmación. |
| P0 | `/app/company-equipment-config` — `company/company-equipment-config.component.ts` | 24 controles y 4 tablas | Múltiples catálogos se muestran juntos, elevando scroll y ruido. | Pestañas por catálogo con una DataTable por pestaña; alta/edición en modal o drawer. | CRUD de cada catálogo sin afectar la navegación entre catálogos. |
| P0 | `/app/suppliers-crud` — `company/company-suppliers-crud.component.ts` | 32 controles y tabla | Alta de proveedor y listado pueden crecer a la vez. | Separar listado de ficha; agrupar datos fiscales, contacto y pago en acordeones. | Crear/editar proveedor y volver al listado conservando filtros. |
| P0 | `/app/profile-professional` — `profiles/profile-professional.component.ts` | 40 controles | Perfil del colaborador reúne información personal, laboral y documental. | Pestañas: identidad, trabajo, contacto y documentos; resumen de identidad persistente. | Guardar cambios por sección y localizar errores de cada una. |

## Prioridad P1 — revisar después del lote P0

| Ruta / componente | Señal | Estrategia inicial |
|---|---|---|
| `/app/crm-prospectos/:id` — `crm/crm-prospect-detail.component.ts` | 43 controles/estructuras y 5 tablas | Aunque ya usa pestañas, revisar densidad dentro de cada panel y convertir tablas secundarias a detalle bajo demanda. |
| `/app/crm-clientes` — `crm/crm-clients.component.ts` | 32 controles y tabla | Aplicar la misma auditoría de formulario compacto a campos opcionales del alta. |
| `/app/crm-cotizaciones` — `crm/crm-quotes.component.ts` | 26 controles y 2 tablas | Mantener el listado liviano; organizar creación, ítems y condiciones por secciones. |
| `/app/company-hr-worktime` — `company/hr/company-hr-worktime.component.ts` | 11 controles y 2 tablas | Separar configuración de jornada del calendario/listado de excepciones. |
| `/app/work-timesheet` — `work/work-timesheet.component.ts` | 14 controles y 2 tablas | Resumen semanal fijo y detalle diario plegable. |
| `/app/finance-caja-menor` — `finance/finance-caja-menor.component.ts` | 21 controles y 3 tablas | DataTable de movimientos; alta y arqueo como paneles independientes. |
| `/app/finance-facturacion-tiempo` — `finance/finance-time-invoice.component.ts` | 15 controles y tabla | Filtros compactos, detalle de tiempo por cliente/proyecto expandible. |
| `/app/company-user-roles` — `company/company-user-roles.component.ts` | 11 controles y 2 tablas | Maestro-detalle para usuarios y permisos; no mostrar ambas tablas completas sin selección. |
| `/app/advanced-security-ip-restrictions` — `security/advanced-security-ip-restrictions.component.ts` | 13 controles y 2 tablas | Listado principal con alta/edición en drawer y bitácora bajo demanda. |

## Fuera del primer lote

Las vistas de plantilla o sin conexión al backend no entran al primer ciclo, aun
cuando el análisis detecte alta densidad. Por ejemplo: red, crypto, wallet,
aprendizaje y perfiles de demostración. Se revisarán solo si se convierten en
flujos de producto.

## Protocolo de revisión visual por vista

1. Recorrer la tarea principal con datos reales en 1366×768, 1024×768 y
   390×844.
2. Registrar qué contenido exige scroll vertical u horizontal antes de iniciar
   la tarea, y qué parte es opcional/dinámica.
3. Elegir un solo patrón dominante de la tabla anterior; no combinar pestañas,
   acordeones y modales sin una razón de tarea.
4. Comprobar foco, validaciones, carga, error, guardado y retorno al listado.
5. Añadir o actualizar prueba Playwright y marcar la fila como intervenida
   únicamente tras validación visual.

## Medición de avance

- **Identificada:** señal estática registrada; falta recorrido visual.
- **Diseñada:** patrón y comportamiento definidos; falta implementación.
- **Intervenida:** cambio implementado y compilado; falta prueba visual con datos reales.
- **Validada:** flujo principal comprobado en navegador en escritorio y móvil.

El presente inventario deja como **intervenida** la compactación del alta de
Prospectos. La validación visual contra el entorno publicado sigue pendiente de
una sesión de navegador conectada.
