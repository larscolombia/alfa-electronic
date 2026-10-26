# Casos de borde por módulo — flujo Alfa Electronic

Fuente primaria: transcripciones de Recepción, Comercial, Técnica, Cotizaciones,
Compras, Inventario, Logística, Despacho y Facturación. Este documento convierte
las excepciones conversadas en reglas que deben existir de forma consistente en
backend, frontend y Playwright.

## Regla de implementación

Cada caso debe tener: validación de servidor, CTA visible o bloqueo explicable en
la interfaz, evidencia persistida y escenario Playwright de éxito o rechazo. Una
acción de interfaz nunca es una autorización de negocio por sí sola.

## 1. Comercial y prospectos

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| COM-01 | Empresa ya existe con variación de nombre | Advertir posible duplicado antes de crear; permitir continuar solo de forma explícita y auditable | Empresa existente o justificación de duplicado |
| COM-02 | Lead sin contacto de mantenimiento/compras | Puede existir como base por depurar, pero no debe marcarse como visita efectiva ni recibir seguimiento comercial asignado | Fuente del lead y tarea para completar contacto |
| COM-03 | Prospecto contacta por web, WhatsApp o recomendación | Debe conservarse el origen y enviarse el formato de recepción + condiciones por canal trazable | Canal, fecha, responsable y copia/enlace enviado |
| COM-04 | Prospecto aún no aprueba reparación | Conserva estado Prospecto aunque haya enviado equipos, recibido diagnóstico o cotización | Historial comercial y estado de cotización |
| COM-05 | Primera OC/aprobación escrita válida | Convertir a Cliente definitivo una sola vez, sin duplicar empresa, contactos ni historial | OC/aprobación, fecha de conversión y usuario |
| ~~COM-06~~ ✅ | Cotización sin respuesta | Crear seguimiento con responsable y vencimiento; no depender de Excel o memoria personal | Validado por `test:e2e-ui-com-06` |
| COM-07 | Pregunta del cliente llega a técnico por canal informal | Comercial centraliza la respuesta; el técnico recibe tarea y la respuesta queda en el caso | Pregunta, asignado, SLA, respuesta y cierre |
| COM-08 | Cliente pide lista de partes o explicación interna | No exponer costos/lista de partes salvo que se cambie explícitamente el modelo comercial | Aprobación comercial y versión pública del documento |

## 2. Recepción y pre-registro

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| REC-01 | Equipo no es industrial o cuesta nuevo ≤ COP 2M | Bloquear reparación normal; requerir rechazo o override de jefe con motivo | Respuesta del filtro u override firmado |
| REC-02 | Llega equipo sin formato de recepción | Siempre registrar e inventariar para no perder custodia; solicitar formato después sin bloquear el registro físico | Guía/remisión, remitente, fecha y solicitud enviada |
| REC-03 | No se identifica remitente | Registrar incidencia de custodia, no asignar a técnico ni cotizar hasta identificar empresa/contacto | Fotos, transportadora, guía y responsable de resolver |
| REC-04 | Cliente nuevo entrega personalmente | Capturar formato físico y crear prospecto/empresa sin duplicarlo | Formato, contacto, identificación y firma |
| REC-05 | Transportadora entrega paquete | Transportadora, guía y hora de recibo son obligatorias; no reemplazarlas por texto libre sin trazabilidad | Guía, transportadora y recepción física |
| REC-06 | Serie incompleta o ilegible | No permitir despacho futuro sin serie verificada; registrar lectura parcial y fotos de placa | Serie, foto de placa y motivo de excepción |
| REC-07 | Equipo llega con accesorios | Inventariar cada accesorio antes de diagnóstico y mostrarlo en despacho | Lista de accesorios y fotos |
| REC-08 | Equipo auxiliar o préstamo acompaña al principal | Crear identidad propia, anclaje bidireccional y alerta de devolución; no usar solo texto libre | Códigos de ambos equipos y relación |
| REC-09 | Faltan fotos de caras obligatorias | No finalizar recepción sin las caras mínimas; permitir guardar borrador con estado incompleto | Checklist de evidencia y autor |
| REC-10 | Daño visible, sello roto o componente faltante | Exigir foto, nota y confirmación antes de aceptar custodia | Evidencia con fecha/hash y observación |
| REC-11 | Falla declarada no llega o es insuficiente | El equipo puede diagnosticarse si se identifica remitente; marcar “falla pendiente” y no inventar la declaración cliente | Solicitud al cliente y memo técnico separado |
| REC-12 | Sospecha de falla de software | Señalar que no se repara software antes de prometer servicio; técnico puede confirmar alcance | Respuesta del formulario y decisión técnica |
| REC-13 | Equipo fue intervenido previamente, faltan piezas o tiene silicona | Mostrar advertencia técnica/comercial y conservar declaración del cliente | Respuestas de ingreso y fotos |
| REC-14 | QR/código ya existe | Rechazar reutilización silenciosa; pedir confirmación de reingreso/garantía o crear nuevo evento vinculado | Código previo, motivo y relación |

## 3. Diagnóstico técnico

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| TEC-01 | Equipo sin formato completo | No dejarlo “volando”: puede inspeccionarse, pero separar hechos técnicos de información pendiente del cliente | Estado de formato y memo diagnóstico |
| TEC-02 | Falla no identificada | No cerrar diagnóstico ni habilitar cotización de reparación | Checklist, pruebas realizadas y bloqueo explicado |
| TEC-03 | Equipo no reparable | Exigir dictamen, prueba/evidencia y ruta comercial alternativa; no enviarlo a reparación | Memo, tipo de prueba y decisión |
| TEC-04 | Horas estimadas = 0 o ausentes | No cerrar diagnóstico ni calcular cotización | Horas estimadas y autor |
| TEC-05 | Presupuesto de repuestos no existe | No cerrar diagnóstico si el caso requiere repuestos; usar 0 solo cuando se justifique “sin repuestos” | Presupuesto USD o motivo |
| TEC-06 | Repuesto disponible en stock | Reservar para el código/orden; evitar doble uso y aplicar vencimiento de reserva | Reserva, cantidad, vencimiento y responsable |
| TEC-07 | Repuesto no existe en stock | Crear línea con proveedor, referencia exacta, cantidad, costo USD y plazo; no usar una descripción genérica | Línea de importación y fuente de cotización |
| TEC-08 | Técnico crea línea antes de OC | Puede preparar estimación, pero compras no puede adquirir ni comprometer inventario definitivo sin autorización comercial | Estado “pendiente de OC” |
| TEC-09 | Diagnóstico finalizado | Caso sale de la bandeja técnica y entra en Por cotizar sin perder memo, adjuntos, horas ni líneas | Sello de cierre, usuario y fecha |
| TEC-10 | Cliente consulta durante diagnóstico | Respuesta debe llegar por comercial y quedar vinculada al código, no en chat aislado | Pregunta, SLA y respuesta |

## 4. Cotización y OC

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| COT-01 | Diagnóstico sin memo, horas o costos | No habilitar cotización de reparación como si estuviera completa | Motivos de bloqueo y enlace al diagnóstico |
| COT-02 | Valores internos de partes/horas | Usarlos para cálculo interno; no filtrarlos al PDF público sin autorización | Separación de datos internos/públicos |
| COT-03 | Precio/plazo de importación | Incluir flete, arancel/impuesto y plazo comprometido; guardar versión emitida | PDF, moneda, vigencia y condiciones |
| COT-04 | Cliente aprueba verbalmente o por chat informal | Requerir aprobación escrita/OC adjunta antes de comprar | Archivo, correo o aprobación firmada |
| COT-05 | OC sin número, fecha o archivo | Mantener caso en Por cotizar/pendiente; no pasar a compra | Campos faltantes claros |
| COT-06 | OC corresponde a varios equipos | Relacionar cada equipo/línea con la misma OC sin duplicar ni mezclar clientes | IDs de equipos y número de OC |
| COT-07 | OC aprobada | Pasar a Posición 05/Pedir componentes y habilitar validación de líneas | Sello de OC y líneas autorizadas |
| COT-08 | Línea de repuesto no marcada/validada | No incluirla en orden a proveedor aunque exista en el diagnóstico | Estado por línea y aprobador |
| COT-09 | Cliente rechaza o vence cotización | Liberar reservas según política y conservar motivo/historial; no dejar stock congelado | Estado, motivo y reserva liberada |

## 5. Compras a proveedor

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| COMPR-01 | Línea sin OC validada | No debe aparecer en compras ni exportarse al proveedor | Referencia a OC/línea aprobada |
| COMPR-02 | Equipo solo requiere stock | Pasar a Reparación cuando la reserva esté disponible; no enviarlo a espera de importación | Reserva activa/consumible |
| COMPR-03 | Equipo requiere al menos una compra externa | Pasar a Esperando proveedor, no a Reparación al crear/enviar la solicitud | Líneas externas y estado en tránsito |
| COMPR-04 | Compra parcial o una línea pendiente | Mantener Posición 11; no liberar reparación hasta recibir todas las líneas requeridas | Cantidad solicitada/recibida por línea |
| COMPR-05 | Compra cerrada | Cambiar líneas a Comprado/En tránsito y asociar pedido, proveedor y fecha | Pedido, proveedor, fecha y estado Comprado/En tránsito |
| COMPR-06 | Proveedor sin stock | Registrar agotado, resaltar el ítem y solicitar sustitución técnica; no sustituir referencia sin aprobación | Resultado proveedor y aprobación técnica |
| COMPR-07 | Referencias repetidas en BOM | Consolidar cantidades antes de ordenar y conservar la trazabilidad por equipo | BOM consolidada y distribución por códigos |
| ~~COMPR-08~~ ✅ | Archivo para carga masiva | Exportar únicamente número de parte del proveedor y cantidad; validar mapeo antes de subir | Validado por `test:e2e-ui-compr-08` |
| COMPR-09 | Repuesto > USD 8 o ≤ USD 8 | Clasificar RP/L según la regla presupuestal, con excepción justificada si existe | Clasificación, valor USD y autor |
| ~~COMPR-10~~ ✅ | Llegada de proveedor parcial | Actualizar inventario solo con lo físico recibido y conservar pendiente faltante | Validado por `test:e2e-ui-compr-10` |
| COMPR-11 | Último repuesto recibido | Mover a Listo para reparar/Posición 1 una sola vez, con registro de transición | Fecha, líneas completas y responsable |
| COMPR-12 | Compra se atrasa frente al compromiso | Alertar anticipadamente a comercial para informar al cliente | Fecha esperada, días de atraso y aviso |

## 6. Inventario

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| INV-01 | Técnico intenta crear ficha o ajustar stock | Backend debe rechazarlo por rol; un selector visual no es autorización | Usuario, rol y evento de rechazo |
| INV-02 | Salida excede stock disponible | Bloquear salida/reserva y mostrar cantidad disponible | Stock antes/después y solicitud alternativa |
| INV-03 | Reserva vencida | No debe seguir bloqueando disponibilidad; exigir renovación o liberación auditable | Estado vencida, fecha y actor |
| INV-04 | Reserva se libera o se suprime línea | Devolver disponibilidad correctamente, sin doble entrada/salida | Movimiento y saldo resultante |
| INV-05 | Stock cae bajo mínimo | Crear o alertar reposición automáticamente según política; no depender solo de botón manual | Umbral, fecha y línea sugerida |
| INV-06 | Referencia duplicada o muy similar | Alertar antes de crear; revisar referencia/código interno y proveedor | Candidatos y decisión |
| INV-07 | Componente usado/ocasión | Diferenciarlo de nuevo y exigir prueba antes de instalar cuando aplique | Condición, prueba y responsable |
| INV-08 | Bolsa recibida para técnico | No sumarla a stock general si está asignada al técnico; solo sobrante retorna a stock | Destino, técnico, código y saldo |
| INV-09 | Conteo físico anual difiere | Crear discrepancia, requerir aprobación y conservar acta; no ajustar silenciosamente | Conteo, diferencia, aprobador y acta |
| INV-10 | Tercer intento de compra fallido | Escalar/cambiar proveedor o marcar obsoleto según decisión registrada | Intentos, proveedores y resolución |

## 7. Reparación, pruebas y garantía

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| REP-01 | Repuesto externo pendiente | Bloquear inicio/continuación que requiera esa pieza; mostrar faltante concreto | Línea pendiente y fecha esperada |
| REP-02 | Técnico trabaja varias órdenes en un día | Registrar horas por código y fecha; impedir imputación ambigua | Entrada de tiempo, técnico y duración |
| REP-03 | Horas reales superan estimadas | Alertar desviación y conservar ambas métricas, sin sobrescribir estimación | Estimada, real y explicación |
| REP-04 | Prueba funcional no realizada | No pasar a Listo para entrega salvo excepción explícita de no reparable | Tipo de prueba o excepción justificada |
| REP-05 | Prueba de cierre parcial/banco/multímetro | Registrar método, resultado, video/evidencia y fecha | Checklist y adjuntos |
| REP-06 | Reparación cerrada | Exigir sectores intervenidos, memo de intervención y horas antes de despacho | Informe técnico y sello de cierre |
| REP-07 | Equipo retorna dentro de garantía | Identificar intervención anterior y asignar preferentemente al técnico previo | Código anterior, vigencia y técnico |
| REP-08 | Garantía requiere repuesto | Separar estado Garantía espera repuestos y aplicar el mismo control de recepción completa | Relación de garantía y líneas pendientes |
| REP-09 | Garantía durante permanencia en taller | Pausar o calcular correctamente la vigencia según política definida | Periodo suspendido y motivo |

## 8. Logística, remisión y entrega

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| LOG-01 | Código no está Listo para entrega | No permitir crear remisión de equipo sin cierre técnico | Estado técnico y motivo de bloqueo |
| LOG-02 | Marca, tipo o serie no coinciden | Bloquear despacho; no aceptar coincidencia parcial | Comparación de origen vs remisión |
| LOG-03 | Equipo principal tiene préstamo anclado | Bloquear despacho hasta incluir/devolver el préstamo en la misma remisión | Relación anclada y confirmación |
| LOG-04 | Accesorios de recepción no están confirmados | Pedir confirmación explícita antes de cerrar entrega | Lista de accesorios y operador |
| LOG-05 | Falta ubicación física | No presentar como listo para retiro; resolver ubicación antes de empaque | Ubicación y responsable |
| LOG-06 | Entrega por transportadora | Exigir transportadora, guía, fotos de empaque y notificación al cliente | Guía, fotos, fecha y aviso |
| LOG-07 | Recoge el cliente | Exigir nombre/identificación de quien recibe y remisión firmada | Recibido por y firma |
| LOG-08 | Garantía/notas de instalación faltan | Incluir texto estándar o una excepción aprobada en la remisión | Versión documental |
| LOG-09 | OC debe acompañar envío | Generar/anexar copia cuando la política o el cliente lo exijan | Anexo y referencia a OC |
| LOG-10 | Remisión firmada no ha regresado | Mantener entrega como pendiente de prueba de entrega; no concluir trazabilidad | Guía/acta pendiente y seguimiento |
| LOG-11 | Remisión firmada cargada | Cerrar trazabilidad con archivo digital, fecha, firmante y vínculo al equipo | Prueba de entrega adjunta |

## 9. Facturación y pagos

| ID | Condición límite | Regla requerida | Evidencia / siguiente paso |
|---|---|---|---|
| FAC-01 | Cliente con crédito | Puede despacharse según política; el caso pasa a Equipos para facturar y la factura conserva vencimiento por crédito | Condición, plazo y factura pendiente |
| FAC-02 | Pago anticipado o contraentrega sin pago validado | Mantener paquete retenido; no liberar por una marca manual de la ficha | Factura, pago conciliado y validación |
| FAC-03 | Datos fiscales faltantes o inválidos | Bloquear exportación/archivo plano y señalar NIT, dirección, ciudad, correo o OC faltante | Campos corregidos y fuente (RUT/OC) |
| FAC-04 | Factura de reparación con cobro adicional | Incluir diagnóstico urgente u otros ítems como líneas separadas, no alterar el valor aprobado silenciosamente | Detalle de factura y aprobación |
| FAC-05 | Archivo TXT de interfaz | Validar estructura, delimitador y montos antes de cargar a Oasis/DIAN | Archivo, versión y resultado de validación |
| FAC-06 | Oasis/DIAN rechaza archivo | No marcar como facturada; conservar rechazo y permitir corrección/reintento | Error, archivo original y reintento |
| FAC-07 | Factura emitida | Guardar PDF/XML/ZIP legal, número externo y envío al correo del cliente | Radicado, adjuntos y fecha |
| PAG-01 | Pago recibido es menor que total | No asumir mora/error: calcular y validar ReteFuente, ReteIVA y ReteICA | Pago bruto/neto, tasas y soporte |
| PAG-02 | Diferencia no coincide con retenciones válidas | Mantener pago en conciliación y solicitar certificado/extracto al cliente | Diferencia, solicitud y respuesta |
| PAG-03 | Pago parcial | No liberar contraentrega ni cerrar factura hasta completar política de saldo | Saldo, estado parcial y próxima acción |
| PAG-04 | Pago confirmado | Guardar fecha, referencia, comprobante y notificar liberación interna | Validación, usuario y mensaje de liberación |
| PAG-05 | Retenciones no caben en factura interna | Registrar desglose en control contable estructurado, no únicamente en notas libres | Valores/porcentajes y exportación contable |

## 10. Casos transversales de trazabilidad

| ID | Regla transversal | Comportamiento requerido |
|---|---|---|
| TRA-01 | Un equipo nunca queda sin dueño ni estado | Cada recepción, excepción y transición tiene responsable y fecha |
| TRA-02 | Datos viajan, no se recapturan | Cliente, equipo, serie, OC, repuestos, garantía y pago se resuelven por IDs y relaciones persistidas |
| TRA-03 | Transición bloqueada | El backend rechaza; el frontend explica qué falta y ofrece el CTA correctivo |
| TRA-04 | Auditoría | Toda creación, cambio de estado, aprobación, modificación de compra, pago y entrega registra actor, fecha y antes/después |
| TRA-05 | Documentos | Adjuntos relevantes son inmutables/versionados una vez emitidos o firmados |
| TRA-06 | Concurrencia | Dos usuarios no pueden consumir la misma reserva, recibir más de la cantidad comprada ni despachar el mismo equipo dos veces |
| TRA-07 | Reintentos | Operaciones de recepción, pago, remisión y carga externa deben ser idempotentes o detectar duplicados |
| TRA-08 | Seguridad | Permisos se verifican por identidad en backend; nunca por rol seleccionado en pantalla |

## Cobertura Playwright mínima por caso

1. Ejecutar una ruta positiva y una ruta bloqueada por cada tabla anterior.
2. Verificar en API que el estado, actor, documento y relaciones persisten tras recargar.
3. Verificar que el CTA no aparece o queda deshabilitado cuando falta un prerrequisito.
4. Para transiciones de compra, probar stock, compra externa, recibo parcial y recibo completo.
5. Para despacho, probar crédito, contraentrega pagada, contraentrega sin pago, serie distinta y préstamo anclado.
6. Para pagos, probar pago completo, parcial, retención válida y diferencia no conciliable.
