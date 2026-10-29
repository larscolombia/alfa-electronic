# Relevo: suite UI-only para recorrido de equipo

## Objetivo vigente

Crear y ejecutar una suite Playwright que recorra un equipo de punta a punta **como lo haría un usuario en el frontend**. Debe demostrar que un snapshot acumulativo (cliente/dueño, equipo, técnico y datos comerciales) viaja correctamente entre módulos.

El caso es una placa base cuya reparación cuesta COP 10.000.000. La ejecución solicitada debe ser visible (`PW_HEADLESS=false`) y mostrar el cursor sobre cada CTA, con una pausa de 300 ms por acción.

## Regla esencial

No usar endpoints de negocio desde el runner. En particular, está prohibido crear, actualizar o verificar entidades mediante `fetch`, `apiRequest`, sesiones inyectadas a localStorage o fixtures HTTP.

Permitido:

- Navegar, llenar formularios, seleccionar opciones, subir archivos y clicar elementos mediante Playwright.
- Autenticarse usando la pantalla `/auth/signin`.
- Observar el DOM, tomar capturas y registrar errores del navegador.

No permitido:

- Login por API.
- Crear prospectos, equipos, proyectos, cotizaciones, OC, facturas o remisiones por API.
- `context.addInitScript()` para sembrar token o estado autenticado.
- Verificar el resultado leyendo respuestas de API.

La finalidad es detectar las roturas reales en las transiciones del frontend, no simularlas.

## Estado de datos y entorno

- Repositorio: `/Users/ludwig/Desktop/alfa/repo`
- Rama de trabajo: `cambios-Anderson`; el último trabajo integrado/subido previamente fue `0cbf0d7a`.
- Frontend local: `http://127.0.0.1:4200`.
- Backend local: `http://127.0.0.1:8080`; usa PostgreSQL local, no producción.
- Usuario de prueba: `admin@alfa.com` / `1234`. No copiar secretos de servidores ni tokens a documentos, commits o salida de consola.
- La base operativa local fue limpiada varias veces para las pruebas UI. Se preservaron usuarios, roles/ACL, empleados HR, configuraciones/catálogos y estructura. Hay respaldos locales fuera del repo, por ejemplo `../alfa-local-before-ui-final-20261028-074500.dump`.

## Cambios funcionales ya integrados

El snapshot fue implementado y ya está en la rama:

- `src/app/pages/app/projects/equipment-journey-snapshot.ts`
- `crm-prospect-equipment-modal.component.ts` incorpora `journeySnapshot` al crear el proyecto desde recepción.
- `crm-quotes.component.ts` agrega la información comercial al snapshot al registrar OC.
- `remissions.logic.ts` consume el snapshot como respaldo para cliente, equipo, OC y demás datos de remisión.

Además existen pruebas y documentos de soporte:

- `tests/gherkin/equipment-journey-snapshot.feature`
- `tests/qa/QA-PROCEDURES-EQUIPMENT-JOURNEY-SNAPSHOT.md`
- `scripts/test-remission-features-logic.mjs`

La prueba lógica `npm run test:equipment-journey-snapshot` pasó antes de iniciar este relevo.

## Runner nuevo y estado de depuración

El runner a continuar es:

```bash
scripts/e2e-ui-equipment-journey-playwright.mjs
```

Es un archivo nuevo sin commit en el momento de este documento. Actualmente hace únicamente UI:

1. Login por formulario.
2. Crear prospecto en CRM.
3. Abrir `Asociar equipo`.
4. Completar recepción, placa base, serie, evidencias y generar proyecto.
5. Abrir tablero, mover el proyecto a diagnóstico y cerrar diagnóstico.
6. Crear cotización precargada desde el proyecto, asignar COP 10.000.000 y guardar/enviar.
7. Cargar OC desde la lista de cotizaciones.

Para hacer visibles CTA y cursor, el helper `click()` mueve el mouse y aplica un borde magenta transitorio. La pausa se toma de `PW_SLOW_MO_MS`, con valor recomendado `300`.

Se corrigieron durante la implementación dos problemas de selectores:

1. `Contacto` coincidía con `Contacto remitente (empresa)`. El selector ahora exige coincidencia exacta.
2. Choices.js oculta los `<select>` nativos. `selectLabel()` debe localizar el select dentro del contenedor padre del label y usar `selectOption(..., { force: true })` para disparar el evento Angular.

El último intento quedó detenido/falló durante recepción; no afirmar que la suite pasó sin leer la salida actual. Los logs de intentos pueden estar en `/tmp/ui-only-journey-*.log` y no forman parte del repositorio.

## Cómo continuar correctamente

1. Revisar el estado sin borrar cambios ajenos:

```bash
git status --short
node --check scripts/e2e-ui-equipment-journey-playwright.mjs
```

2. Ejecutar primero rápido y con salida persistente para localizar el siguiente bloqueo:

```bash
PW_HEADLESS=true PW_SLOW_MO_MS=0 \
  node scripts/e2e-ui-equipment-journey-playwright.mjs \
  > /tmp/ui-only-journey-debug.log 2>&1
cat /tmp/ui-only-journey-debug.log
```

3. Ante un fallo, corregir solo el selector o la transición de UI responsable. No resolverlo agregando una llamada API, inyectando localStorage o creando datos de apoyo por HTTP.

4. Cada vez que un intento cree datos parciales, volver a limpiar únicamente tablas operativas locales antes de relanzar. Hay que obtener `DATABASE_URL` del proceso backend local sin imprimirlo. El truncado ya usado incluyó CRM, proyectos, cotizaciones, compras, inventario operativo, facturación, pagos, remisiones, documentos y bitácoras; preservó ACL, empleados y catálogos. No ejecutar contra producción.

5. Cuando el modo rápido complete, limpiar de nuevo y ejecutar la demostración visible:

```bash
PW_HEADLESS=false PW_SLOW_MO_MS=300 \
  node scripts/e2e-ui-equipment-journey-playwright.mjs
```

6. Guardar capturas por etapa y verificar en pantalla, no por API, que al pasar de módulo sobreviven como mínimo:

- nombre y correo del cliente;
- empresa/NIT y contacto;
- serie, marca, referencia, falla y accesorios del equipo;
- técnico asignado;
- código y valor de cotización;
- número de OC;
- datos de factura/pago/remisión si se extiende el flujo completo.

## Extensión pendiente para flujo completo

El runner aún debe extenderse por UI para cubrir:

1. `pedir-repuestos` y compras;
2. llegada de componentes y retorno a reparación;
3. memo de reparación, horas reales, prueba de cierre y `listo-entrega`;
4. conversión de cotización aprobada a factura;
5. registro/validación de pago;
6. preparación y cierre de remisión/entrega.

Como referencias de selectores y comportamientos UI, consultar (sin reutilizar sus setup por API):

- `scripts/e2e-lars-t04-diagnostico-playwright.mjs`
- `scripts/e2e-lars-t05-cotizacion-playwright.mjs`
- `scripts/e2e-lars-t06-oc-playwright.mjs`
- `scripts/e2e-lars-t10-reparacion-cierre-playwright.mjs`
- `scripts/e2e-lars-t13-factura-playwright.mjs`
- `scripts/e2e-lars-t15-puerta-pago-playwright.mjs`

## Criterios de cierre

No desplegar al servidor hasta que:

1. La suite UI-only pase desde una base operativa limpia.
2. La pasada visible con 300 ms por CTA complete sin intervención manual.
3. Las verificaciones visuales confirmen que el snapshot conserva cliente, equipo, técnico y datos comerciales al cruzar módulos.
4. Se ejecuten las pruebas lógicas pertinentes y no haya regresiones.
5. Los cambios se revisen, se agreguen al commit y se suban solamente con autorización explícita.
