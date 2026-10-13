# language: es
Característica: Transiciones automáticas del flujo técnico de reparación
  Como técnico del tablero "Flujo técnico de reparación"
  Quiero que ciertas acciones muevan la tarjeta automáticamente
  Para no tener que arrastrar tarjetas manualmente entre columnas

  Antecedentes:
    Dado que estoy autenticado en el tablero "/app/work-projects"
    Y el tablero tiene las columnas "recibido", "diagnostico", "por-cotizar", "reparacion", "pruebas", "listo-entrega", "garantia-espera-repuestos", "entregado"

  # ─── SOLICITUD DE REPUESTOS AVANZA LA TARJETA ─────────────────────────

  Escenario: Reserva de material en diagnóstico mueve el caso a reparación
    Dado que el proyecto "PRJ-100" está en la columna "diagnostico"
    Cuando creo exitosamente una reserva de material para ese proyecto
    Entonces el proyecto "PRJ-100" se mueve automáticamente a la columna "reparacion"
    Y veo el mensaje "Reserva de material creada. El caso avanzó automáticamente a Reparación."

  Escenario: Línea de compra en por-cotizar mueve el caso a reparación
    Dado que el proyecto "PRJ-101" está en la columna "por-cotizar"
    Cuando confirmo la creación de una línea de compra para ese proyecto
    Entonces el proyecto "PRJ-101" se mueve automáticamente a la columna "reparacion"

  Escenario: Línea de compra manual en diagnóstico mueve el caso a reparación
    Dado que el proyecto "PRJ-102" está en la columna "diagnostico"
    Cuando creo una línea de compra manual para ese proyecto
    Entonces el proyecto "PRJ-102" se mueve automáticamente a la columna "reparacion"

  Escenario: Solicitud de compra en diagnóstico mueve el caso a reparación
    Dado que el proyecto "PRJ-103" está en la columna "diagnostico"
    Cuando envío una solicitud de compra para ese proyecto
    Entonces el proyecto "PRJ-103" se mueve automáticamente a la columna "reparacion"

  Esquema del escenario: La solicitud de repuestos no retrocede tarjetas ya avanzadas
    Dado que el proyecto "PRJ-200" está en la columna "<estado>"
    Cuando creo exitosamente una solicitud de repuestos para ese proyecto
    Entonces el proyecto "PRJ-200" permanece en la columna "<estado>"

    Ejemplos:
      | estado                    |
      | recibido                  |
      | reparacion                |
      | pruebas                   |
      | listo-entrega             |
      | garantia-espera-repuestos |
      | entregado                 |

  Escenario: Solicitud de repuestos fallida no mueve la tarjeta
    Dado que el proyecto "PRJ-104" está en la columna "diagnostico"
    Cuando intento crear una reserva de material y el inventario la rechaza
    Entonces el proyecto "PRJ-104" permanece en la columna "diagnostico"
    Y veo el mensaje de error de la reserva

  # ─── PRUEBAS → LISTO PARA ENTREGA ─────────────────────────────────────

  Escenario: Finalizar pruebas con tipo de prueba registrado
    Dado que el proyecto "PRJ-300" está en la columna "pruebas"
    Y el proyecto tiene la "Prueba de cierre" en "Banco de pruebas"
    Cuando hago clic en "Finalizar pruebas y marcar listo"
    Entonces el proyecto "PRJ-300" se mueve a la columna "listo-entrega"
    Y veo el mensaje "Pruebas finalizadas. El caso ya pasó a Listo para entrega."

  Escenario: Finalizar pruebas con checklist de informe de intervención completado
    Dado que el proyecto "PRJ-301" está en la columna "pruebas"
    Y el proyecto tiene la "Prueba de cierre" en "Sin pruebas"
    Y el proyecto tiene un checklist de transición con "Pruebas realizadas" igual a "Sobre banco de prueba"
    Cuando hago clic en "Finalizar pruebas y marcar listo"
    Entonces el proyecto "PRJ-301" se mueve a la columna "listo-entrega"

  Escenario: No se puede finalizar pruebas sin tipo de prueba real
    Dado que el proyecto "PRJ-302" está en la columna "pruebas"
    Y el proyecto tiene la "Prueba de cierre" en "Sin pruebas"
    Y el proyecto no tiene checklist de pruebas completado
    Cuando hago clic en "Finalizar pruebas y marcar listo"
    Entonces el proyecto "PRJ-302" permanece en la columna "pruebas"
    Y veo un mensaje que indica registrar la "Prueba de cierre" o completar el checklist

  Escenario: El botón de finalizar pruebas solo aparece en la columna pruebas
    Dado que el proyecto "PRJ-303" está en la columna "reparacion"
    Cuando abro el detalle del proyecto
    Entonces no veo el botón "Finalizar pruebas y marcar listo"

  # ─── NO REGRESIONES ───────────────────────────────────────────────────

  Escenario: El arrastrar y soltar sigue funcionando
    Dado que el proyecto "PRJ-400" está en la columna "reparacion"
    Cuando arrastro la tarjeta a la columna "pruebas"
    Entonces el proyecto "PRJ-400" se mueve a la columna "pruebas"
    Y si la transición tiene checklist configurado se abre el modal de verificación

  Escenario: Los chips de estado del detalle siguen abriendo el prompt de transición
    Dado que el proyecto "PRJ-401" está en la columna "reparacion"
    Cuando selecciono el chip de estado "pruebas" en el detalle
    Entonces se abre el modal de checklist de la transición "reparacion" a "pruebas"
