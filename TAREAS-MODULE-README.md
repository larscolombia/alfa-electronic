# Módulo de Tareas - Documentación

## Descripción General

Se ha implementado un módulo completo de gestión de tareas integrado con el sistema de proyectos. Las tareas están directamente relacionadas con cada proyecto y el progreso del proyecto se calcula automáticamente basándose en las tareas completadas.

## Características Principales

### 1. Modelo de Tareas
Cada tarea incluye:
- **Título y descripción**: Información básica de la tarea
- **Prioridad**: Baja, Media, Alta, o Crítica
- **Estado**: Completada o Pendiente
- **Asignación**: Persona responsable
- **Fechas**: Fecha límite y fecha de completado
- **Estimación**: Horas estimadas y horas reales
- **Etiquetas**: Tags para categorizar
- **Dependencias**: Relación con otras tareas
- **Archivos adjuntos**: Soporte para adjuntar archivos

### 2. Progreso Automático del Proyecto
- El progreso del proyecto se calcula automáticamente: `(tareas completadas / total de tareas) × 100`
- Se actualiza en tiempo real cuando se completan o agregan tareas
- Visible en las tarjetas del board Kanban
- Mostrado en el panel de detalle del proyecto

### 3. Visualización en el Board Kanban

#### Tarjetas de Proyecto
Las tarjetas de proyecto ahora muestran:
- Badge con contador de tareas: "X/Y" (completadas/total)
- Barra de progreso actualizada automáticamente

#### Panel de Detalle
Al abrir un proyecto, se muestra:
- Estadísticas de tareas (total, completadas, en progreso, vencidas)
- Lista completa de tareas con filtros
- Indicadores visuales de prioridad
- Fechas de vencimiento
- Asignados a cada tarea

### 4. Gestión de Tareas

#### Crear Tarea
1. Abrir un proyecto desde el board
2. Hacer clic en "Nueva Tarea"
3. Completar el formulario:
   - Título (requerido)
   - Descripción
   - Prioridad
   - Asignado a
   - Fecha límite
   - Horas estimadas
   - Etiquetas

#### Editar Tarea
- Clic en el ícono de editar en cualquier tarea
- Modificar los campos necesarios
- Marcar como completada y agregar horas reales

#### Completar Tarea
- Checkbox al lado de cada tarea
- El progreso del proyecto se actualiza automáticamente
- Se registra la fecha y usuario que completó la tarea

#### Eliminar Tarea
- Clic en el ícono de eliminar
- Confirmación antes de borrar
- Actualización automática del progreso

### 5. Filtros y Vistas

La lista de tareas incluye filtros:
- **Todas**: Muestra todas las tareas
- **Pendientes**: Solo tareas no completadas
- **Completadas**: Solo tareas finalizadas

Ordenamiento:
- Las tareas se ordenan por el campo `order` (personalizable)
- Las vencidas aparecen con borde rojo

### 6. Estadísticas

Para cada proyecto se calculan:
- Total de tareas
- Tareas completadas
- Tareas en progreso
- Tareas vencidas
- Distribución por prioridad
- Horas estimadas totales
- Horas reales totales

## Archivos Creados

### Modelos
- `project.model.ts`: Actualizado con campos de tareas (Task, TaskPriority, TaskFilter)

### Servicios
- `task.service.ts`: Servicio completo para gestión de tareas
  - CRUD de tareas
  - Filtrado
  - Cálculo de progreso
  - Estadísticas

### Componentes
- `task-list/task-list.component.ts`: Lista de tareas con filtros
- `task-form/task-form.component.ts`: Formulario modal para crear/editar tareas
- `project-detail/project-detail.component.ts`: Vista completa de proyecto con tareas

### Integraciones
- `project.service.ts`: Actualizado para integrar tareas y calcular progreso
- `project-card.component.ts`: Muestra contador de tareas
- `kanban-view.component.ts`: Integra gestión de tareas en el panel lateral

## Datos de Prueba

Se incluyen datos de ejemplo con:
- 6 tareas para el proyecto "Implementación Sistema de Pagos"
- 3 tareas para el proyecto "Auditoría Financiera Q1"
- Variedad de prioridades, estados y asignaciones

## Próximas Mejoras Sugeridas

1. **Drag & Drop**: Reordenar tareas arrastrando
2. **Subtareas**: Tareas dentro de tareas
3. **Comentarios**: Discusiones en cada tarea
4. **Time Tracking**: Temporizador integrado
5. **Notificaciones**: Alertas de vencimiento
6. **Archivos**: Subida y gestión de archivos adjuntos
7. **Historial**: Registro de cambios en cada tarea
8. **Templates**: Plantillas de tareas para proyectos recurrentes

## Navegación

Para acceder al módulo de tareas:
1. Ir a http://localhost:4200/app/work-projects
2. Ver el board de proyectos con información de tareas
3. Hacer clic en cualquier tarjeta de proyecto
4. El panel lateral muestra el detalle del proyecto con todas sus tareas
5. Gestionar tareas usando los botones de la interfaz

---

**Fecha de implementación**: 13 de Abril de 2026
**Versión**: FASE 1
