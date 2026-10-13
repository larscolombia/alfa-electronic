# Guía de Pruebas Frontend — Inventario + Compras

> Paso a paso desde el navegador. Sin comandos, solo clics.
> Fecha: 2026-08-05

---

## 0. Antes de empezar

1. Asegúrate de que el backend esté corriendo:
   ```
   sudo systemctl restart alfa-backend.service
   ```
2. Levanta el frontend:
   ```
   cd /var/www/alfa.software.net.co && npx ng serve
   ```
3. Abre el navegador en `https://alfa.software.net.co` (o `http://localhost:4200`)
4. Inicia sesión con tu usuario

---

## 1. Módulo Inventario

### 1.1 Panel de control de inventario

1. En el menú lateral, busca la sección **Inventario**
2. Haz clic en **"Inventory Dashboard"** (o navega a `/app/inventory-dashboard`)
3. Verás el **Centro de Control de Inventario** con:
   - Un selector de rol en la parte superior (Técnico / Responsable / Administrativo / Compras / Auditor)
   - Un árbol de módulos filtrado según el rol seleccionado
   - KPIs y backlog operativo
4. **Prueba:** Cambia el rol a **"Responsable"** → deben aparecer todas las opciones del menú habilitadas
5. **Prueba:** Cambia a rol **"Auditor"** → solo deben verse las opciones de conciliación y dashboard

### 1.2 Stock — Crear ficha de referencia

1. En el menú lateral, haz clic en **"Inventory Stock"** (o `/app/inventory-stock`)
2. Verás el **Workbench de Inventario** con dos pestañas: **"Crear ficha"** y **"Entrada a stock"**
3. Asegúrate de estar en la pestaña **"Crear ficha"**
4. Completa el formulario:
   - **Referencia:** `PRUEBA-001`
   - **Designación:** `Resistor 10K ohm`
   - **Familia:** `Resistencias`
   - **Marca:** `Yageo`
   - **Proveedor:** selecciona uno de la lista (o escribe `DigiKey`)
   - **Criticidad:** selecciona `Alta`
   - **Stock mínimo:** `10`
   - **Ubicación:** `R01`
5. Haz clic en el botón **"Crear ficha"**
6. ✅ **Verifica:** Aparece un mensaje verde "Ficha PRUEBA-001 creada correctamente."
7. ✅ **Verifica:** La nueva ficha aparece en la tabla del catálogo debajo del formulario
8. **Recarga la página** (F5)
9. ✅ **Verifica:** La ficha `PRUEBA-001` **sigue apareciendo** (persiste en backend, no se perdió)

### 1.3 Stock — Entrada a stock

1. En la misma pantalla (`/app/inventory-stock`), haz clic en la pestaña **"Entrada a stock"**
2. Completa el formulario:
   - **Referencia:** selecciona `PRUEBA-001` del dropdown
   - **Cantidad:** `50`
   - **Proveedor:** selecciona el mismo que usaste arriba
   - **Tipo de documento:** `Remision`
   - **Número de documento:** `REM-2026-001`
3. Haz clic en **"Registrar entrada"**
4. ✅ **Verifica:** Mensaje "Entrada registrada: 50 unidad(es) en PRUEBA-001."
5. ✅ **Verifica:** En la tabla de catálogo, la columna "Stock actual" de PRUEBA-001 ahora muestra `50`

### 1.4 Stock — Detección de duplicados

1. Vuelve a la pestaña **"Crear ficha"**
2. Escribe en Referencia: `PRUEBA-002`
3. Escribe en Designación: `Resistor 10K ohm` (igual que la anterior)
4. ✅ **Verifica:** Aparece una advertencia indicando que ya existe una referencia similar (similitud de designación)
5. Ahora intenta con Referencia: `PRUEBA-001` (exactamente igual)
6. ✅ **Verifica:** La alerta muestra "Coincidencia exacta" con similitud 1.0

### 1.5 Movimientos

1. En el menú lateral, haz clic en **"Inventory Movements"** (o `/app/inventory-movements`)
2. Verás el historial de movimientos y la cola de solicitudes pendientes
3. ✅ **Verifica:** La entrada que registraste aparece en el historial (tipo "entrada", referencia PRUEBA-001, cantidad 50)

#### Registrar una salida

4. En el formulario "Nuevo movimiento":
   - **Tipo:** selecciona `Salida`
   - **Referencia:** selecciona `PRUEBA-001`
   - **Cantidad:** `5`
   - **Motivo:** `Consumo para reparación equipo`
5. Haz clic en **"Registrar movimiento"**
6. ✅ **Verifica:** Mensaje "Movimiento registrado correctamente."
7. ✅ **Verifica:** El movimiento de salida aparece en el historial
8. **Intenta registrar otra salida** con cantidad `999`
9. ✅ **Verifica:** Mensaje de error "No hay stock suficiente" (solo tienes 45)

### 1.6 Reposición y líneas de compra

1. En el menú lateral, haz clic en **"Inventory Orders"** (o `/app/inventory-orders`)
2. Verás el panel de **Reabastecimiento** con:
   - KPIs: items insuficientes, escalados, promedio días de espera
   - Tabla de backlog (referencias con stock bajo mínimo)
   - Tabla de líneas de compra
   - Histórico semanal

#### Verificar backlog

3. ✅ **Verifica:** Si creaste una referencia con stock mínimo alto y stock actual bajo, aparece en la tabla de backlog

#### Generar líneas de compra

4. Haz clic en el botón **"Generar líneas de compra"**
5. ✅ **Verifica:** Se crean líneas automáticas para las referencias con stock bajo mínimo
6. Las líneas aparecen en la tabla inferior con estado **"Pendiente"**

#### Acciones sobre líneas

7. En una línea con estado "Pendiente", haz clic en **"Enviar"**
8. ✅ **Verifica:** El estado cambia a "Enviada"
9. En una línea "Enviada", haz clic en **"Cerrar"**
10. ✅ **Verifica:** El estado cambia a "Cerrada" y se genera automáticamente una entrada de stock (verifica en movimientos)

### 1.7 Reservas (desde el Kanban)

1. En el menú lateral, haz clic en **"Work Projects"** (o `/app/work-projects`)
2. Abre el detalle de cualquier proyecto haciendo clic en una tarjeta
3. En el modal, ve a la pestaña **"Materiales"**
4. Verás el formulario de **"Nueva reserva de material"**:
   - **Referencia:** selecciona una referencia del catálogo
   - **Cantidad:** `2`
   - **Asignado a:** nombre del técnico
   - **Motivo:** `Reparación urgente`
   - **Prioridad:** `Alta`
5. Haz clic en **"Reservar material"**
6. ✅ **Verifica:** La reserva aparece en la tabla de reservas activas debajo
7. En la tabla de reservas, haz clic en **"Renovar"** → la fecha de vencimiento se extiende
8. Haz clic en **"Consumir"** → se descuenta del stock y la reserva se marca como liberada

### 1.8 Conciliación (conteo físico)

1. En el menú lateral, haz clic en **"Inventory Order Details"** (o `/app/inventory-order-details`)
2. Verás el panel de **Conciliación** con:
   - KPIs: sesiones abiertas, diferencias sin resolver
   - Formulario "Nueva sesión"
   - Tabla de sesiones
   - Tabla de diferencias
   - Tabla de auditoría

#### Crear y gestionar sesión

3. Completa el formulario:
   - **Nombre:** `Inventario Agosto 2026`
   - **Alcance:** `Bodega principal`
   - **Responsable:** tu nombre
   - **Fecha inicio:** fecha de hoy
4. Haz clic en **"Crear sesión"**
5. ✅ **Verifica:** La sesión aparece en la tabla con estado "Planificada"
6. Haz clic en **"Iniciar"** → estado cambia a "En curso"
7. Haz clic en **"Cerrar"** → estado cambia a "Cerrada"
8. Haz clic en **"Exportar acta"** → se descarga un archivo CSV

---

## 2. Módulo Compras — Proveedores

### 2.1 CRUD de Proveedores

1. En el menú lateral, busca la sección **Compañía** → **"Suppliers CRUD"** (o `/app/suppliers-crud`)
2. Verás la tabla maestra de proveedores con columnas: número, razón social, ciudad, país, sector, grado, términos de pago

#### Crear proveedor

3. Busca el botón **"Agregar proveedor"** o similar y haz clic
4. Completa el formulario:
   - **Número:** `PRV-TEST-001`
   - **Razón social:** `Electrónica de Prueba SAS`
   - **NIT:** `900123456-1`
   - **Ciudad:** `Bogotá`
   - **País:** `Colombia`
   - **Contacto:** nombre y teléfono
   - **Grado de confianza:** `A`
   - **Términos de pago:** `Transferencia a 30 días`
5. Haz clic en **"Guardar"**
6. ✅ **Verifica:** El proveedor nuevo aparece en la tabla
7. **Recarga la página** (F5)
8. ✅ **Verifica:** El proveedor **sigue ahí** (persiste en backend)

#### Editar proveedor

9. Haz clic en el botón de editar (lápiz) junto al proveedor que creaste
10. Cambia el grado de confianza a `B`
11. Haz clic en **"Guardar"**
12. ✅ **Verifica:** El grado se actualizó en la tabla

#### Eliminar proveedor

13. Haz clic en el botón de eliminar (basura)
14. Confirma la eliminación
15. ✅ **Verifica:** El proveedor desaparece de la tabla

### 2.2 Dashboard de Proveedores

1. En el menú lateral, haz clic en **"Suppliers Dashboard"** (o `/app/suppliers-dashboard`)
2. Verás el dashboard con:
   - **KPIs:** Total proveedores, Confiables (A-B), Suscripciones activas, Alertas
   - **Clasificación ABCD:** barras de distribución por grado
   - **Tabla de proveedores** con badge de grado y barra de confiabilidad
3. ✅ **Verifica:** Los números de los KPIs coinciden con los proveedores reales que creaste en el CRUD
4. ✅ **Verifica:** Si creaste un proveedor grado A, aparece en la barra verde de "Alta confiabilidad"
5. ✅ **Verifica:** Los datos NO son hardcodeados — si agregaste o eliminaste proveedores en el CRUD, el dashboard refleja los cambios

### 2.3 Historial de Pedidos a Proveedor

1. En el menú lateral, haz clic en **"Suppliers Orders History"** (o `/app/suppliers-orders-history`)
2. Verás la lista de pedidos con columnas: pedido, proveedor, fecha, solicitante, equipo, finalidad, cantidad, estado

#### Ver detalle de un pedido

3. Haz clic en el número de cualquier pedido (link azul)
4. Se abre un **modal de detalle** con:
   - **Cabecera del caso:** proveedor, estado, prioridad, fechas, cliente, máquina, placa
   - **Diagnóstico y objetivo de reparación**
   - **Items solicitados:** tabla con tipo, descripción, referencia, cantidad, costo unitario, subtotal
   - **Trazabilidad:** tabla con fecha/hora, usuario, acción, estado, notas
5. ✅ **Verifica:** Los datos del pedido se cargan correctamente

#### Editar un pedido

6. En el modal, cambia el **estado** a "En tránsito"
7. Agrega un item nuevo haciendo clic en **"Agregar item"**
8. Completa: tipo `Componente`, descripción `Capacitor 100uF`, cantidad `10`, costo `5000`
9. Haz clic en **"Guardar pedido"**
10. ✅ **Verifica:** Mensaje de confirmación con el número de items actualizados
11. ✅ **Verifica:** En la sección de trazabilidad aparece un nuevo evento "Edición integral y cambio de estado"

---

## 3. Brechas Corregidas — Pruebas Específicas

### 3.1 Flujo de aprobación de líneas de compra (Gap 2)

1. Ve a `/app/inventory-orders` (Inventory Orders)
2. Genera líneas de compra (si no hay)
3. Las líneas nuevas aparecen con estado **"Pendiente"**
4. ✅ **Verifica:** Ahora las líneas tienen un campo de estado de aprobación visible
5. Haz clic en **"Aprobar"** en una línea pendiente
6. ✅ **Verifica:** La línea cambia a aprobación "Aprobada"
7. En otra línea, haz clic en **"Rechazar"**
8. ✅ **Verifica:** La línea cambia a aprobación "Rechazada"

### 3.2 Consolidación por proveedor (Gap 3)

1. Ve a `/app/inventory-orders`
2. Genera varias líneas de compra para diferentes proveedores
3. ✅ **Verifica:** Existe un botón o sección **"Consolidar por proveedor"**
4. Al activarlo, las líneas se agrupan mostrando:
   - Nombre del proveedor
   - Cantidad total de líneas
   - Cantidad total de unidades
   - Lista de líneas bajo ese proveedor

### 3.3 Vincular línea de compra a orden (Gap 1)

1. Ve a `/app/inventory-orders` — ten una línea de compra visible
2. Ve a `/app/suppliers-orders-history` — ten una orden a proveedor visible
3. ✅ **Verifica:** En el detalle de la orden, existe la opción de vincular líneas de compra del inventario
4. Al vincular, la línea de compra muestra el ID de la orden asociada

### 3.4 Solicitud de compra del técnico (Gap 5)

1. Ve al Kanban (`/app/work-projects`)
2. Abre el detalle de un proyecto en estado de reparación
3. En la pestaña **"Materiales"** o sección de solicitudes:
4. ✅ **Verifica:** Existe un formulario para **"Solicitar compra de repuesto"** con campos:
   - Referencia del componente
   - Descripción
   - Cantidad
   - Proveedor sugerido
   - Costo estimado
   - Plazo de entrega
   - Urgencia (Normal / Alta / Crítica)
   - Memo técnico (justificación)
5. Completa el formulario y haz clic en **"Enviar solicitud"**
6. ✅ **Verifica:** La solicitud aparece con estado "Pendiente"
7. Cambia el rol de inventario a **"Responsable"** (en `/app/inventory-dashboard`)
8. Ve a la sección de solicitudes de compra
9. ✅ **Verifica:** La solicitud del técnico aparece en la cola
10. Haz clic en **"Aprobar"**
11. ✅ **Verifica:** Se genera automáticamente una línea de compra vinculada a la solicitud
12. Ve a `/app/inventory-orders` → la línea de compra nueva aparece

### 3.5 Dashboard con datos reales (Gap 6)

1. Ve a `/app/suppliers-crud`
2. Crea 2-3 proveedores nuevos con diferentes grados (A, C, D)
3. Ve a `/app/suppliers-dashboard`
4. ✅ **Verifica:** El total de proveedores aumentó
5. ✅ **Verifica:** La distribución ABCD refleja los grados reales
6. ✅ **Verifica:** Los proveedores en la tabla son los mismos del CRUD (no datos ficticios)
7. Elimina un proveedor en el CRUD
8. Recarga el dashboard
9. ✅ **Verifica:** El proveedor eliminado ya no aparece

---

## 4. Pruebas de Persistencia

### 4.1 Recargar página

1. Ve a cualquier pantalla de inventario (ej: `/app/inventory-stock`)
2. Crea una ficha nueva
3. **Recarga la página** con F5
4. ✅ **Verifica:** La ficha que creaste **sigue apareciendo**
5. Ve a `/app/suppliers-crud`
6. Crea un proveedor nuevo
7. **Recarga la página**
8. ✅ **Verifica:** El proveedor sigue en la tabla

### 4.2 Cerrar sesión y volver

1. Cierra sesión (botón de logout en el header)
2. Vuelve a iniciar sesión
3. Ve a `/app/inventory-stock`
4. ✅ **Verifica:** Todas las fichas, movimientos y reservas siguen ahí
5. Ve a `/app/suppliers-crud`
6. ✅ **Verifica:** Los proveedores siguen ahí

### 4.3 Multi-navegador

1. Abre el sistema en dos pestañas o navegadores diferentes
2. En la pestaña 1, crea una ficha de inventario nueva
3. En la pestaña 2, recarga la página de inventario
4. ✅ **Verifica:** La ficha creada en la pestaña 1 aparece en la pestaña 2
5. Repite con proveedores: crea en una pestaña, recarga en la otra
6. ✅ **Verifica:** El proveedor aparece en ambos navegadores

---

## 5. Checklist Rápido

Copia y marca cada casilla al completar:

```
INVENTARIO
[ ] Dashboard carga con selector de rol funcional
[ ] Crear ficha → persiste tras recargar
[ ] Entrada a stock → stock incrementa
[ ] Salida → stock decrementa
[ ] Salida con stock insuficiente → error
[ ] Detección de duplicados funciona
[ ] Movimientos se registran en historial
[ ] Reservas: crear, renovar, consumir
[ ] Reservas: vencimiento automático
[ ] Reposición: backlog se genera automáticamente
[ ] Líneas de compra: generar, enviar, cerrar
[ ] Cierre de línea → entrada automática de stock
[ ] Conciliación: crear sesión, iniciar, cerrar, exportar CSV
[ ] Bolsas de técnico: recibir y liberar

COMPRAS
[ ] CRUD proveedores: crear, editar, eliminar → persiste
[ ] Dashboard proveedores: datos reales (no hardcodeados)
[ ] Historial pedidos: ver detalle, editar, trazabilidad
[ ] Aprobación de líneas: aprobar / rechazar
[ ] Consolidación por proveedor
[ ] Vincular línea de compra a orden
[ ] Solicitud de compra del técnico → aprobación → línea auto

PERSISTENCIA
[ ] Recargar página → datos persisten
[ ] Cerrar sesión y volver → datos persisten
[ ] Multi-navegador → datos sincronizados
```

---

## 6. Si algo no funciona

| Problema | Qué hacer |
|----------|-----------|
| La pantalla de inventario está vacía | Abre DevTools (F12) → pestaña Network → recarga → verifica que `/api/v1/inventory` retorne 200 con datos |
| "No tienes permisos" | En el dashboard de inventario, cambia el rol a **"Responsable"** (tiene todos los permisos) |
| Los datos se pierden al recargar | Verifica que el backend esté corriendo: `sudo systemctl status alfa-backend.service` |
| Error 401 en las peticiones | Tu sesión expiró. Cierra sesión y vuelve a iniciar |
| El dashboard de proveedores muestra datos vacíos | Verifica que hayas creado al menos un proveedor en el CRUD (`/app/suppliers-crud`) |
| El formulario de solicitud de compra no aparece | Asegúrate de estar en un proyecto con estado de reparación activo en el Kanban |
