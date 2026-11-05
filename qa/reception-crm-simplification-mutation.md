# Mutation testing plan

Ejecute la prueba de regresión tras introducir temporalmente estas mutaciones:

- Cambiar la condición que oculta sucursales por una condición verdadera.
- Quitar `createClientContact` de la creación del remitente.
- Restaurar el texto de cámara trasera o el control de generación de proyectos.

En cada caso `npm run test:reception-crm-simplification` debe fallar.
