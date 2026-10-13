# language: es
Característica: Módulo de Compras (Proveedores y Órdenes)
  Como comprador
  Quiero gestionar proveedores y órdenes de compra
  Para controlar el abastecimiento de componentes

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado con rol "responsable"

  # ─── CRUD PROVEEDORES ──────────────────────────────────────────────────

  Escenario: Crear proveedor nuevo
    Cuando creo un proveedor con número "PRV-GH-001", razón social "Electrónica Test SAS", ciudad "Bogotá", grado "A"
    Entonces el proveedor se crea exitosamente
    Y el proveedor aparece en la lista con grado "A"

  Escenario: Editar proveedor existente
    Dado que existe el proveedor "PRV-GH-001" con grado "A"
    Cuando actualizo el grado a "B"
    Entonces el grado del proveedor es ahora "B"

  Escenario: Eliminar proveedor
    Dado que existe el proveedor "PRV-GH-001"
    Cuando elimino el proveedor
    Entonces el proveedor ya no aparece en la lista

  Escenario: Crear proveedor sin razón social es rechazado
    Cuando intento crear un proveedor sin razón social
    Entonces recibo un error "razon social es obligatoria"

  # ─── ÓRDENES DE COMPRA ─────────────────────────────────────────────────

  Escenario: Crear orden de compra con items
    Dado que existe el proveedor "PRV-GH-001"
    Cuando creo una orden de compra número "OC-GH-001" para el proveedor con 2 items
    Entonces la orden se crea con estado "Borrador"
    Y la orden tiene 2 items registrados
    Y se registra un evento de trazabilidad "CREAR_PEDIDO"

  Escenario: Editar orden cambia estado y registra trazabilidad
    Dado que existe la orden "OC-GH-001" con estado "Borrador"
    Cuando cambio el estado a "Solicitado"
    Entonces la orden tiene estado "Solicitado"
    Y se registra un evento de trazabilidad "CAMBIAR_ESTADO" de "Borrador" a "Solicitado"

  Escenario: Agregar trazabilidad a orden
    Dado que existe la orden "OC-GH-001"
    Cuando agrego un evento de trazabilidad con acción "Pedido confirmado" y notas "Entrega en 15 días"
    Entonces el evento aparece en la trazabilidad de la orden

  Escenario: Eliminar orden elimina items y trazas
    Dado que existe la orden "OC-GH-001" con items y trazas
    Cuando elimino la orden
    Entonces la orden ya no existe
    Y los items asociados fueron eliminados
    Y las trazas asociadas fueron eliminadas

  # ─── DASHBOARD PROVEEDORES (Gap 6) ─────────────────────────────────────

  Escenario: Dashboard muestra datos reales de proveedores
    Dado que existen 3 proveedores en la base de datos con grados A, B y C
    Cuando abro el dashboard de proveedores
    Entonces el KPI "Total proveedores" muestra 3
    Entonces el KPI "Confiables (A-B)" muestra 2
    Y la tabla ABCD refleja los grados reales de los proveedores

  Escenario: Dashboard se actualiza al crear proveedor
    Dado que el dashboard muestra 3 proveedores
    Cuando creo un proveedor nuevo con grado "A"
    Y recargo el dashboard
    Entonces el KPI "Total proveedores" muestra 4

  # ─── APROBACIÓN DE LÍNEAS (Gap 2) ─────────────────────────────────────

  Escenario: Aprobar línea de compra
    Dado que existe una línea de compra con estado de aprobación "pendiente"
    Cuando apruebo la línea
    Entonces la línea cambia a aprobación "aprobada"
    Y se registra el aprobador y la fecha

  Escenario: Rechazar línea de compra
    Dado que existe una línea de compra con estado de aprobación "pendiente"
    Cuando rechazo la línea
    Entonces la línea cambia a aprobación "rechazada"

  # ─── CONSOLIDACIÓN POR PROVEEDOR (Gap 3) ──────────────────────────────

  Escenario: Consolidar líneas abiertas por proveedor
    Dado que existen 3 líneas abiertas para el proveedor "DigiKey" y 2 para "Mouser"
    Cuando solicito la consolidación por proveedor
    Entonces recibo 2 grupos de consolidación
    Y el grupo "DigiKey" tiene 3 líneas y la cantidad total de sus items
    Y el grupo "Mouser" tiene 2 líneas y la cantidad total de sus items

  # ─── VINCULAR LÍNEA A ORDEN (Gap 1) ───────────────────────────────────

  Escenario: Vincular línea de compra a orden de proveedor
    Dado que existe una línea de compra "po-001"
    Y existe una orden de proveedor con id 1
    Cuando vinculo la línea a la orden
    Entonces la línea tiene linkedOrderId = 1

  # ─── PERSISTENCIA (Gaps 6, 8) ─────────────────────────────────────────

  Escenario: Datos persisten al recargar página
    Dado que creé una ficha de inventario "PERSIST-001"
    Cuando recargo la página del navegador
    Entonces la ficha "PERSIST-001" sigue apareciendo en el catálogo

  Escenario: Datos son consistentes entre navegadores
    Dado que creo un proveedor "PERSIST-PRV" en el navegador A
    Cuando abro el navegador B y cargo la lista de proveedores
    Entonces el proveedor "PERSIST-PRV" aparece en el navegador B
