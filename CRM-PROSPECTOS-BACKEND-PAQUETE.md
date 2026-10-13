# CRM Prospectos - Campos de la vista y paquete backend

## Vista analizada
- URL: https://pika.software.net.co/app/crm-prospectos
- Fuente validada: vista publicada + componentes Angular del modulo CRM prospectos

## Campos detectados en la tabla principal
1. Nombre
2. Correo Electronico
3. Movil
4. Zona
5. Valor del Prospecto
6. Creado
7. Cotizaciones
8. Empleado asignado
9. Estado

## Campos detectados en el formulario "Agregar Prospecto"
1. Saludo
2. Nombre del Prospecto
3. Correo Electronico del Prospecto
4. Empresa
5. Seleccionar Empleados
6. Fuente del Prospecto
7. Categoria del Prospecto
8. Zona
9. Valor del Prospecto
10. Permitir seguimiento
11. Estado
12. Servicios
13. Nota

## Campos adicionales usados por la ficha de detalle del prospecto
1. Sitio web
2. Telefono de oficina
3. Pais
4. Ciudad
5. Direccion

## Observaciones funcionales importantes
1. La tabla muestra "Movil", pero el formulario actual no lo solicita explicitamente.
2. El estado visual del formulario usa "Pending" en UI, pero el dominio funcional usa: Pendiente, En proceso, Cerrado.
3. La vista tiene quick-add para catalogos de Empleados, Fuentes, Categorias y Servicios.
4. Zonas se manejan como catalogo seleccionable (checkbox de opcion unica en la implementacion actual).

## Paquete backend creado
Se creo el paquete completo `backend/internal/crm` con:

1. Tipos y contratos (`types.go`)
- Modelos: `Prospect`, `CatalogItem`, `CatalogsResponse`
- DTOs: `UpsertProspectRequest`, `ProspectListQuery`

2. Servicio de dominio (`service.go`)
- CRUD de prospectos
- Soft delete de prospectos
- Filtros de listado por `search`, `status`, `limit`
- Validaciones de dominio (nombre requerido, estado valido, valor no negativo, cotizaciones no negativas)
- Catalogos dinamicos con defaults por empresa:
  - employees
  - sources
  - categories
  - services
  - zones
- Operaciones de catalogo:
  - listar todos
  - listar por tipo
  - agregar item
  - eliminar item
  - restaurar defaults

3. Handler HTTP (`handler.go`)
- Rutas REST bajo `/api/v1/crm`
- Mapeo consistente de errores a HTTP status (400/404/409/500)

## Endpoints implementados
### Prospectos
- `GET /api/v1/crm/prospects`
- `POST /api/v1/crm/prospects`
- `GET /api/v1/crm/prospects/:prospectID`
- `PUT /api/v1/crm/prospects/:prospectID`
- `DELETE /api/v1/crm/prospects/:prospectID`

### Catalogos
- `GET /api/v1/crm/catalogs`
- `GET /api/v1/crm/catalogs/:catalogType`
- `POST /api/v1/crm/catalogs/:catalogType`
- `DELETE /api/v1/crm/catalogs/:catalogType/:itemID`
- `POST /api/v1/crm/catalogs/:catalogType/restore-defaults`

## Migraciones agregadas
Se extendio la migracion en `backend/internal/platform/database/database.go` con:

1. `crm_catalog_items`
- Catalogos por empresa y tipo con unicidad por nombre

2. `crm_prospects`
- Campos del formulario + campos de tabla + campos de detalle
- Estado restringido a: Pendiente, En proceso, Cerrado
- Soft delete
- Indices por empresa/fecha y empresa/estado

## Integracion en servidor
Se registro el paquete CRM en `backend/cmd/server/main.go`:
- Inicializacion del service y handler
- Registro de rutas protegidas en `/api/v1/crm`
