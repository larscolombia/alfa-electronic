# Guía de verificación manual — Módulo Técnico (Fase Técnica)

Este documento permite verificar, como usuario desde el frontend, que los hallazgos
de las sesiones de Técnica quedaron corregidos.

**Antes de empezar:**

1. Ingrese a la aplicación con su usuario y contraseña (ej: `admin@alfa.com`).
2. Tenga a la mano un equipo de prueba en el tablero técnico.

---

## Issue 1 — Panel de control y plazos parametrizables

### 1a. Resumen compacto de totales por estado

1. En el menú, vaya a **Trabajo / Proyectos** (tablero técnico).
2. Verá una **barra de resumen fija** justo encima de las columnas del tablero.
3. Verifique que cada estado muestra su nombre y el **total de equipos** (ej: "Diagnóstico · 3").
4. Desplace el tablero a la derecha: la barra de resumen **permanece visible** sin moverse.

**Resultado esperado:** todos los totales por estado se ven de un vistazo, sin desplazarse a la derecha.

### 1b. Plazos del semáforo parametrizables

1. Vaya a **Configuración de proyectos** (`/app/company-projects-config`).
2. Edite una columna y cambie los **días verdes** y **días amarillos** (ej: de 2 a 5 días verdes).
3. Guarde. Verá el mensaje de confirmación de que la configuración se guardó en el servidor.
4. Vuelva al tablero técnico: los equipos de esa columna cambian de color según los **nuevos** plazos (un equipo de 4 días que estaba en naranja ahora sale en verde).

**Resultado esperado:** cambiar los plazos cambia los colores del tablero, y la configuración persiste al recargar.

---

## Issue 2 — Registro y control de tiempos

### 2a. Contador por ficha del equipo

1. En el tablero técnico, haga clic en una tarjeta de equipo para abrir el detalle.
2. En la parte superior del detalle verá el cronómetro **"Sesion 00:00"** que empieza a correr.
3. Espere unos segundos y cierre el detalle: el cronómetro **se detiene** y el tiempo se suma a las horas reales del equipo.

**Resultado esperado:** el contador corre solo mientras la ficha está abierta (no desde que entra al sistema).

### 2b. Cuartos de hora, balance de 8 horas y KPI

1. Vaya a **Trabajo / Hoja de tiempo**.
2. Cree un registro de 20 minutos: al guardar, las horas se muestran **redondeadas a 0.5** (cuartos de hora).
3. Mire la franja de indicadores: verá **"Llevas X de 8 horas (faltan Y)"** — en ámbar si no completa la jornada, en verde cuando llegue a 8.
4. Si el proyecto tiene horas estimadas, verá el **KPI**: "Estimadas X · Reales Y · Estado: rentable/aceptable/deficitario/critico".

### 2c. Tipos de registro y técnico real

1. En el formulario de registro, abra el selector **"Tipo de registro"**: verá las opciones **normal, hora-extra, permiso, ausencia, festivo**.
2. Cree un registro tipo "hora-extra": el **resumen por tipo** lo acumula aparte de las horas normales.
3. Abra el selector de **empleado**: muestra los técnicos reales registrados en RRHH (no una lista fija de prueba).

---

## Issue 4 — Repuestos e inventario

### 4a. Búsqueda tolerante a espacios y caracteres especiales

1. Vaya a **Inventario / Stock**.
2. Busque una referencia escribiéndola diferente: `igbt fga25n120` (con espacio, en minúsculas).
3. Verá el resultado `IGBT-FGA25N120` (con guiones) en la lista.

**Resultado esperado:** la búsqueda encuentra la referencia sin importar espacios, guiones, tildes o mayúsculas.

### 4b. Solicitar repuesto desde la ficha del equipo

1. Vaya a **Trabajo / Equipos** y abra la ficha (historial) de un equipo.
2. Haga clic en el botón **"Solicitar repuesto"**.
3. Diligencie **proveedor, referencia, precio y cantidad** y guarde.
4. Verá el mensaje de éxito y la línea queda asociada al equipo.

### 4c. Alerta si compras modifica un repuesto solicitado

1. Pida al área de compras que modifique la marca o referencia de una línea pendiente (o hágalo por API con `PATCH /api/v1/inventory/purchase-lines/:id`).
2. Abra la ficha del equipo: verá la **alerta de modificación** indicando qué línea cambió, quién la modificó y cuándo.

---

## Issue 5 — Validación de entrega de accesorios y anclados

1. Cree una remisión con un equipo que tenga **accesorios** o equipos anclados (el panel de equipos a despachar muestra la alerta de anclados).
2. Guarde la remisión y pulse **"Marcar entregado"**.
3. Verá un diálogo que lista los accesorios/anclados y pide marcar **"Confirmo que se entregaron los accesorios y equipos anclados listados"**.
4. El botón de confirmar **permanece deshabilitado** hasta marcar la casilla.
5. Márquela y confirme: la remisión pasa a "entregado".
6. En el tablero técnico, al completar un despacho de un equipo con accesorios, verá la misma confirmación obligatoria antes de habilitar el botón de despacho.

**Resultado esperado:** no se puede entregar/despachar sin confirmar explícitamente los accesorios y anclados.

---

## Issue 6 — Gestión de garantías

### 6a. Posición "Garantía espera repuestos"

1. En el tablero técnico verá la columna **"Garantia esp. repuestos"** separada de la espera de repuestos normal.
2. Abra el detalle de una tarjeta y abra el selector de estado: la opción **"Garantia esp. repuestos"** está disponible.
3. Si un equipo en garantía tiene repuestos pendientes, el sistema lo sugiere/asigna automáticamente a esa posición.

### 6b. Marcar garantía y validación en la recepción

1. En la recepción de un equipo (CRM o Trabajo / Equipos), abra el formulario de equipo.
2. Al final de la tarjeta del equipo verá la sección **"Garantia"**: marque la casilla **"Es garantia"**.
3. Si el equipo ya tuvo una recepción previa: se precarga el **"Codigo antiguo"** y aparece el **historial previo** (fecha, cliente, falla).
4. Diligencie la fecha de primera recepción y los **meses de garantía**: el badge muestra **"Quedan N mes(es) de garantia"** en verde.
5. Ponga una fecha antigua que supere los meses de garantía: el badge cambia a **"Garantia vencida"** en rojo y aparece la **alerta de validación**.

---

## Issue 7 — Biblioteca técnica y backup de software

### 7a. Documentación no borrable

1. Vaya a **Biblioteca Tecnica** (menú lateral, ícono de libro).
2. Revise cualquier documento: **no hay botón de eliminar** (manuales, planos y videos son permanentes).

### 7b. Icono de backup de software en la ficha del equipo

1. En **Biblioteca Tecnica**, suba un backup de software para un modelo (ej: "S7-1200") seleccionando el archivo: ahora el archivo se guarda de verdad y el botón **"Descargar"** funciona.
2. Abra la ficha de un equipo de ese mismo modelo.
3. Verá el **icono de nube en verde** indicando que hay backup disponible, con el botón **"Descargar backup"**.
4. Abra la ficha de un equipo de otro modelo sin backup: el icono aparece **apagado** (gris).

---

## Tabla resumen de verificación

| # | Verificación | OK |
|---|--------------|----|
| 1a | Barra de resumen con totales por estado, siempre visible | ☐ |
| 1b | Plazos parametrizables que cambian los colores y persisten | ☐ |
| 2a | Cronómetro corre solo con la ficha abierta | ☐ |
| 2b | Cuartos de hora, balance 8h y KPI estimado vs real | ☐ |
| 2c | Tipos de registro (extra/permiso/ausencia/festivo) y técnico real | ☐ |
| 4a | Búsqueda funciona con espacios, guiones y tildes | ☐ |
| 4b | Solicitud de repuesto desde la ficha del equipo | ☐ |
| 4c | Alerta cuando compras modifica un repuesto | ☐ |
| 5 | Confirmación obligatoria de accesorios/anclados al entregar | ☐ |
| 6a | Posición y selector "Garantia esp. repuestos" | ☐ |
| 6b | Marcar garantía en recepción con código antiguo, contador y alerta | ☐ |
| 7a | Documentación técnica sin opción de borrar | ☐ |
| 7b | Icono de backup en la ficha + descarga directa | ☐ |

**Nota:** si algún paso no se comporta como se describe, reporte el número de issue y el paso exacto donde falló.
