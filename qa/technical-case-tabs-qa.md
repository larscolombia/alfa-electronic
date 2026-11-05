# QA: pestañas de ficha técnica

1. En **Adjuntos**, cargue PDF, DOCX, XLSX, imagen y audio; confirme que aparecen y se pueden eliminar antes de guardar.
2. Registre un enlace de YouTube y confirme que se conserva al guardar y reabrir el caso.
3. En **Memo**, complete ambos paneles y los tres campos compactos; guarde y reabra.
4. En **Chat**, publique un mensaje y valide fecha, hora, autor y texto. Los mensajes existentes no deben ser editables.
5. En **Reporte de intervención**, marque un ítem de cada columna, guarde y reabra.
6. En Configuración > Proyectos, use subir/bajar y confirme el nuevo orden en el tablero.

## Métricas de calidad

- Cobertura: la prueba automatizada cubre las opciones de reporte, chat y orden de columnas.
- Mutación manual: cambie una etiqueta de check o elimine una opción; la prueba debe fallar.
- Tiempo objetivo: diligenciar Memo y cotización en menos de 30 segundos en escritorio.
