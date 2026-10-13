# Calendar View - Campos y Contrato Backend

Fecha de analisis: 2026-05-02  
Vista analizada: https://pika.software.net.co/app/calendar  
Referencia de implementacion UI local: src/app/pages/app/calendar/calendar.component.ts

## 1) Campos funcionales de la vista

### Formulario "Agendar una cita"

| Campo UI | Tipo UI | Requerido en backend | Campo API | Tipo API | Notas |
|---|---|---|---|---|---|
| Titulo del evento | Text input | Si | title | string | Se valida que no venga vacio |
| Fecha | Date input | Si (via start) | start | string datetime | Se admite RFC3339 y formatos sin zona (UTC) |
| Hora de inicio | Time input | Si (via start) | start | string datetime | Para allDay se normaliza a 00:00:00 |
| Hora de fin | Time input | No | end | string datetime | Si es menor/igual al inicio, backend ajusta +1 hora |
| Evento de todo el dia | Checkbox | Si | allDay | boolean | Si es true, end se ignora y queda null |
| Descripcion | Textarea | No | description | string | Texto libre |
| Clase visual del evento | No visible directo (interno) | No | className | string | Si no viene, backend asigna valor por defecto |

### Listado "Eventos recientes"

| Campo mostrado | Fuente |
|---|---|
| Nombre de evento | title |
| Fecha formateada | start + end + allDay |

### Modal "Detalle del evento"

| Campo mostrado | Fuente |
|---|---|
| Titulo | title |
| Fecha | start + end + allDay |
| Descripcion | description |
| Accion Eliminar evento | DELETE /api/v1/calendar/events/:eventID |

## 2) Campos de entidad backend (persistencia)

Tabla: calendar_events

| Columna DB | Tipo | Descripcion |
|---|---|---|
| id | text (PK) | UUID del evento |
| company_id | text | Tenant de la empresa (X-Company-Id) |
| title | varchar(180) | Titulo del evento |
| start_at | timestamptz | Inicio del evento |
| end_at | timestamptz null | Fin del evento (null en allDay) |
| all_day | boolean | Marca evento de todo el dia |
| description | text | Notas del evento |
| class_name | varchar(80) | Clase visual para FullCalendar |
| created_at | timestamptz | Fecha de creacion |
| updated_at | timestamptz | Fecha de ultima actualizacion |

## 3) API backend creada

Base protegida por JWT + seguridad avanzada: /api/v1/calendar

| Metodo | Ruta | Uso |
|---|---|---|
| GET | /events | Listar eventos (query opcional: from, to, limit) |
| POST | /events | Crear evento |
| GET | /events/:eventID | Obtener detalle de evento |
| PUT | /events/:eventID | Actualizar evento |
| DELETE | /events/:eventID | Eliminar evento |

### Ejemplo payload crear/actualizar

```json
{
  "title": "Reunion de seguimiento",
  "start": "2026-05-02T09:00:00",
  "end": "2026-05-02T10:00:00",
  "allDay": false,
  "description": "Validar avance semanal.",
  "className": "bg-theme-1-subtle"
}
```

## 4) Reglas de validacion implementadas en backend

- title es obligatorio.
- start es obligatorio.
- end es opcional.
- allDay=true fuerza start a medianoche UTC y end=null.
- Si allDay=false y end no viene, backend asigna end = start + 1 hora.
- Si allDay=false y end <= start, backend corrige end = start + 1 hora.
- className por defecto:
  - bg-success-subtle para allDay=true
  - bg-theme-1-subtle para allDay=false

## 5) Archivos backend creados/modificados

- backend/internal/calendar/types.go
- backend/internal/calendar/service.go
- backend/internal/calendar/handler.go
- backend/internal/platform/database/database.go
- backend/cmd/server/main.go
