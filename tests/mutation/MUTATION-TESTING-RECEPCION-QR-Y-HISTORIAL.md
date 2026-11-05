# Mutation testing: recepción, QR e historial

| Mutación | Resultado esperado |
|---|---|
| Cambiar el orden de una línea QR | La prueba unitaria falla |
| Serializar el QR como JSON | La prueba unitaria falla |
| Omitir una línea vacía | La prueba unitaria falla |
| Cambiar el tamaño impreso de 1.5 cm | La inspección QA falla |
| Cambiar el rango inicial de Hoy | La prueba visual/E2E falla |
