# Plan de ejecución — flujo de reparación UI-only

Estado: en ejecución. La suite opera por Playwright mediante la interfaz, sin llamadas de negocio desde el runner.

- [x] Reemplazar el campo editable de horas reales por visualización acumulada y temporizador de sesión.
- [x] Reemplazar la fecha partida por un selector único de fecha sin hora.
- [x] Definir y propagar `equipmentCode` como código interno; nunca usar serie como sustituto.
- [x] Extender la suite UI-only para comprobar fecha, snapshot, contador y ausencia de campo editable.
- [x] Preparar por UI el catálogo mínimo de recepción (servicio Reparación y ubicación) cuando falte.
- [x] Corregir y verificar la apertura/selección de Tipo de servicio en el modal de recepción.
- [x] Reemplazar todos los campos operativos de país/ciudad por selectores relacionados (ciudad dependiente del país) y cubrirlos en la suite UI.
- [x] Conservar y verificar el servicio del equipo desde el lead hasta la entrega final.
- [x] Ejecutar el flujo completo en modo visible (`PW_HEADLESS=false`) contra entorno local con backend disponible.
- [ ] Verificar por DOM, tras cada transición, la preservación de código interno, cliente/empresa, contacto, serie y snapshot hasta remisión (pendiente de corrida visible).
- [x] Registrar artefactos de la ejecución exitosa y el resultado final.

## Criterio de cierre

Todos los puntos anteriores están marcados y el recorrido visible termina con `UI_ONLY_SUCCESS`; ningún punto se marcará solo por compilación.
