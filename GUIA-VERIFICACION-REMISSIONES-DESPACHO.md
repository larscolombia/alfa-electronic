# Guía de verificación manual — Módulo de Remisiones y Despacho (Logística)

Este documento permite verificar, como usuario desde el frontend, que los 6 hallazgos
de la reunión de Logística y Despacho/Facturación quedaron corregidos.

**Antes de empezar:**

1. Ingrese a la aplicación con su usuario y contraseña (ej: `admin@alfa.com`).
2. En el menú principal, haga clic en **Remisiones** (ícono de camión).
3. Verá la página con el título "Remisiones", el panel "Equipos a despachar" en la parte superior y la tabla de remisiones abajo.

---

## Issue 1 — Panel de equipos a despachar agrupado por cliente

**Qué se verificaba:** que exista un panel que agrupe por cliente todos los equipos que
terminaron su intervención técnica (reparación, garantía o no reparables) y están listos para salir.

1. En la página de **Remisiones**, mire la sección superior **"Equipos a despachar"**.
2. Verá los equipos listos **agrupados por cliente** (cada cliente es un grupo colapsable con su nombre).
3. Haga clic en el nombre de un cliente: el grupo se despliega y muestra sus equipos listos para salir.
4. Verifique que aparecen equipos en estado "Listo para entrega" y también los de **garantía**.
5. Verifique que los equipos que aún están en reparación **NO** aparecen en el panel.

**Resultado esperado:** los equipos listos se ven agrupados por cliente, sin buscarlos uno por uno.

---

## Issue 2 — Generación de orden de envío (remisión)

### 2a. Sin límite de equipos por remisión

1. Haga clic en el botón **"Nueva remision"** (botón verde, parte superior derecha).
2. Se abre el formulario de creación.
3. Haga clic varias veces en el botón **"Agregar equipo"** (botón gris con ícono +, debajo de "Equipos en la remision").
4. Verá que puede agregar 5, 6 o más filas de equipos **sin ningún límite** (antes solo se podían 4).
5. Diligencie cliente y guarde. La remisión se crea con todos los equipos en un solo documento.

### 2b. Previsualización del documento antes de generar

1. Con el formulario de remisión diligenciado (cliente, tipo de despacho, al menos un equipo), haga clic en el botón **"Previsualizar"** (botón gris con ícono de ojo, parte inferior del formulario).
2. Se abre una **ventana de previsualización** con el documento formateado: consecutivo, cliente, tipo de despacho, equipos, transportadora y guía (ya NO sale el mensaje "funcionalidad en desarrollo").
3. Dentro de la previsualización, haga clic en **"Imprimir / Guardar PDF"**: se abre el diálogo de impresión del navegador, donde puede elegir "Guardar como PDF".
4. Haga clic en **"Cerrar"** para volver sin generar nada.

### 2c. Imprimir la Orden de Compra (OC) del cliente

1. En el formulario de remisión, diligencie el campo **"Orden de compra (OC)"**.
2. Haga clic en el botón **"Imprimir OC"**.
3. Se abre la vista imprimible con los datos de la cotización del cliente (si el cliente tiene cotización) o con los datos de la remisión y el número de OC.

**Resultado esperado:** remisión con todos los equipos necesarios, previsualización real antes de generar y OC imprimible desde la misma pantalla.

---

## Issue 3 — Reporte de intervención técnica independiente de la factura

**Qué se verificaba:** poder imprimir el reporte técnico sin que el equipo esté facturado,
que funcione para garantías, y que el texto no salga cortado.

1. Vaya al tablero de proyectos (menú **Work / Proyectos**).
2. Busque una tarjeta de equipo en la columna **"Listo para entrega"** y haga clic en ella para abrir el detalle.
3. En la parte inferior del detalle, haga clic en el botón **"Imprimir reporte tecnico"**.
4. Se abre el reporte técnico con el diagnóstico y los trabajos realizados **completos** (texto largo sin cortes).
5. Verifique que **NO** se pide confirmar pago ni cerrar el despacho para verlo (antes solo se podía al facturar).
6. Haga clic en **"Imprimir"** para generarlo, o **"Cerrar"** para salir.
7. Repita con un equipo en estado **garantía**: el botón también aparece y el reporte se genera.
8. Si el equipo no tiene registros técnicos, verá el mensaje "No hay registros tecnicos disponibles para este equipo" en lugar de un error.

**Resultado esperado:** el reporte técnico se imprime en cualquier momento, también para garantías, con el texto completo.

---

## Issue 4 — Accesorios y equipos "anclados"

### 4a. Alerta de equipos anclados

1. En la página de **Remisiones**, panel "Equipos a despachar", busque un equipo que tenga otro equipo en préstamo (anclado).
2. Haga clic en el botón **"Agregar a remision"** de ese equipo.
3. El formulario se abre con el cliente precargado y verá una **alerta visible** indicando que el equipo tiene equipos en préstamo anclados y que debe incluirlos en la misma remisión.

### 4b. Campo Accesorios visible y editable

1. En la fila del equipo dentro del formulario de remisión, verá el campo **"Accesorios"** (ej: "Cable de poder, caja"), precargado desde la recepción del equipo.
2. Haga clic en el campo y modifíquelo (ej: agregue ", manual").
3. Guarde la remisión y vuelva a abrirla: el valor editado se conserva.

**Resultado esperado:** la alerta evita que los equipos anclados se queden olvidados, y los accesorios se gestionan directamente en la remisión.

---

## Issue 5 — Registro de evidencia (fotos, video y guía)

1. Haga clic en **"Nueva remision"**.
2. En el formulario verá los campos:
   - **"Link de YouTube"**: pegue el enlace del video de pruebas del equipo.
   - **"Fotos del despacho"**: haga clic y seleccione una o varias fotos del equipo sellado/empacado. Verá las miniaturas debajo (puede quitar una foto con el botón de cada miniatura).
   - **"Transportadora"** y **"Numero de guia"**: diligéncielos.
3. Guarde la remisión.
4. Vuelva a abrir la previsualización: verá el link de YouTube y las fotos incluidas en el documento.

**Resultado esperado:** toda la evidencia queda registrada en la remisión, sin Drive ni correos manuales.

---

## Issue 6 — Tipos de despacho, remisión valorizada y estado de entrega

### 6a. Tipo de despacho impreso en el documento

1. En el formulario, en el campo **"Tipo de Despacho"** seleccione una opción del menú desplegable: **Servientrega**, **Recoge Cliente** o **Contra entrega**.
2. Haga clic en **"Previsualizar"**.
3. Verá el tipo de despacho escrito de forma legible en el documento (ej: "Contra entrega"), listo para imprimirse como instrucción de salida.

### 6b. Remisión valorizada con precios desde la cotización

1. Marque la casilla **"Remision valorizada (Zona Franca)"**.
2. Haga clic en el botón **"Traer precios de cotizacion"**.
3. Si el cliente tiene cotización, los precios unitarios de los equipos se llenan **automáticamente** y el total aparece abajo (ya no hay que pasar a Word).
4. Si el cliente no tiene cotización, verá el mensaje "No se encontro cotizacion para este cliente.".

### 6c. Estado de entrega

1. En la tabla de remisiones, mire la columna **"Entrega"**: cada remisión nueva aparece con el estado **"pendiente"**.
2. Cuando el equipo llegue a destino, haga clic en el botón **"Marcar entregado"** de esa fila.
3. El estado cambia a **"entregado"** y el botón desaparece (una remisión entregada no se puede devolver a pendiente).

**Resultado esperado:** el tipo de despacho sale impreso, la remisión valorizada se genera sola desde la cotización, y hay trazabilidad de entrega pendiente/entregado.

---

## Tabla resumen de verificación

| # | Verificación | OK |
|---|--------------|----|
| 1 | Panel agrupa equipos listos por cliente (incluye garantía) | ☐ |
| 2a | Remisión con más de 4 equipos en un solo documento | ☐ |
| 2b | Previsualización real del documento + imprimir/guardar PDF | ☐ |
| 2c | Botón "Imprimir OC" desde la pantalla de remisión | ☐ |
| 3 | Reporte técnico sin exigir factura, también en garantía, texto completo | ☐ |
| 4a | Alerta de equipos anclados al agregar a la remisión | ☐ |
| 4b | Campo Accesorios visible y editable, se conserva al guardar | ☐ |
| 5 | Link YouTube + fotos + transportadora + guía en la remisión | ☐ |
| 6a | Tipo de despacho visible en el documento impreso | ☐ |
| 6b | Precios traídos automáticamente desde la cotización | ☐ |
| 6c | "Marcar entregado" cambia el estado y no se puede revertir | ☐ |

**Nota:** si algún paso no se comporta como se describe, reporte el número de issue y el paso exacto donde falló.
