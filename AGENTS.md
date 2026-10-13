## Regla de tamaño de archivos

Cada archivo fuente, de configuración o de paquete no debe superar las **250 líneas aproximadamente**.

- Si un archivo se acerca o supera las 250 líneas, **debes dividirlo**.
- Extrae lógica en funciones auxiliares, helpers, servicios o módulos separados.
- Prefiere muchos archivos pequeños y enfocados sobre pocos archivos grandes.

## Buenas prácticas

- Antes de codificar crea: Unit test, gherking test, qa procedures, quality metrics, mutation testing, test coverage <-- desarrollo que no tenga esto no será aceptado
- Mantén una única responsabilidad por archivo.
- Usa nombres descriptivos para archivos y funciones.
- Separa handlers, servicios, modelos y middleware en paquetes distintos.
- En el frontend, divide vistas, componentes, stores y servicios en carpetas propias.
- Escribe código claro; evita comentarios obvios.
- Para cualquier parte del backend con estado compartido/concurrencia (colas, workers, caché, rate limiting, transacciones), pide explícitamente que el modelo:

-- Use go test -race (el detector de race conditions de Go) — esto es gratis y atrapa muchos de estos bugs automáticamente.
-- Escriba tests que simulen "el permiso ya expiró, ¿el sistema le sigue creyendo al worker viejo?"

## Cambios a este documento

Si modificas la arquitectura, las tecnologías o las convenciones, actualiza este archivo para mantenerlo al día.

# Lineamientos de UX/UI para SugarOS
## Basados en Donald Norman y Jakob Nielsen

---

## 1. Principios Fundamentales (Donald Norman)

### 1.1 Affordance (Percepción de Uso)
- **Los elementos deben sugerir su función**: Botones deben parecer clickeables, inputs deben parecer escribibles
- **Usa componentes PrimeVue estándar**: No reinventes la rueda, los usuarios ya conocen estos patrones
- **Ejemplo**: Un botón "Guardar" debe ser visualmente distinto a un botón "Cancelar"

### 1.2 Feedback (Retroalimentación Inmediata)
- **Toda acción debe tener respuesta visible**:
  - Click → cambio visual inmediato (hover, active state)
  - Submit → loading spinner + mensaje de éxito/error
  - Error → mensaje claro en el contexto del problema
- **Usa Toast para confirmaciones**: `toast.add({ severity: 'success', ... })`
- **Nunca dejes al usuario adivinando**: Si algo está cargando, muéstralo

### 1.3 Mapeo Natural (Natural Mapping)
- **La disposición de controles debe reflejar su efecto**:
  - Controles de volumen arriba = más volumen
  - Tabs arriba = contenido abajo
- **Agrupa campos relacionados**: Usa `<fieldset>` con `<legend>` para secciones lógicas
- **Ejemplo**: En un formulario de dirección, agrupa: Calle, Ciudad, País (no los mezcles con datos de contacto)

### 1.4 Constraints (Restricciones Preventivas)
- **Previene errores antes de que ocurran**:
  - Deshabilita botones hasta que los campos obligatorios estén completos
  - Usa dropdowns en lugar de texto libre cuando haya opciones limitadas
  - Valida en tiempo real, no solo al enviar
- **Ejemplo**: Si el email es inválido, muestra error inmediatamente, no esperes al submit

### 1.5 Consistencia
- **Mantén patrones uniformes en toda la plataforma**:
  - Mismos colores para mismas acciones (rojo = peligro/eliminar, verde = éxito)
  - Mismos iconos para mismas funciones (pi-save = guardar, pi-trash = eliminar)
  - Misma estructura de páginas (Header → Tabs → Content → Actions)
- **Sigue el sistema de diseño PrimeVue**: No inventes nuevos estilos

---

## 2. Heurísticas de Usabilidad (Jakob Nielsen)

### 2.1 Visibilidad del Estado del Sistema
✅ **Haz**:
- Muestra indicadores de carga (spinners, progress bars)
- Indica en qué paso del proceso está el usuario (breadcrumbs, tabs activos)
- Muestra contadores cuando sea relevante (ej: "Mis Leads (15)")

❌ **Evita**:
- Páginas que parecen congelarse sin feedback
- Formularios sin indicador de progreso
- Acciones que no confirman su resultado

### 2.2 Match entre Sistema y Mundo Real
✅ **Haz**:
- Usa lenguaje del usuario, no términos técnicos
- Ejemplo: "País destino" en vez de "destination_country"
- Ejemplo: "¿Cómo encontraste este lead?" en vez de "Fuente"
- Usa iconos reconocibles (pi-user para persona, pi-globe para ubicación)

❌ **Evita**:
- Labels como "Outbound Lead Capture"
- Términos como "ICUMSA 45" sin explicación
- Códigos internos visibles al usuario

### 2.3 Control del Usuario y Libertad
✅ **Haz**:
- Proporciona botones "Cancelar" o "Limpiar" visibles
- Permite deshacer acciones críticas (confirmación antes de eliminar)
- Usa dialogs modales para acciones destructivas

❌ **Evita**:
- Acciones irreversibles sin confirmación
- Formularios que no se pueden limpiar fácilmente
- Navegación sin salida (dead ends)

### 2.4 Consistencia y Estándares
✅ **Haz**:
- Sigue las convenciones de PrimeVue
- Usa los mismos componentes para el mismo propósito
- Mantén la misma estructura en todas las vistas

❌ **Evita**:
- Reinventar componentes existentes
- Usar diferentes estilos para el mismo tipo de elemento
- Cambiar patrones de navegación entre módulos

### 2.5 Prevención de Errores
✅ **Haz**:
- Valida campos en tiempo real (on-blur, on-input)
- Deshabilita botones hasta que el formulario sea válido
- Usa constraints (dropdowns, masks, límites)
- Confirma antes de acciones destructivas

❌ **Evita**:
- Validar solo al enviar el formulario
- Permitir valores inválidos sin advertencia
- Mensajes de error genéricos ("Error occurred")

### 2.6 Reconocimiento vs Recuerdo
✅ **Haz**:
- Muestra opciones visibles (dropdowns, botones)
- Usa iconos + texto (no solo iconos)
- Proporciona tooltips para acciones no obvias

❌ **Evita**:
- Menús ocultos sin indicadores
- Acciones que requieren memorizar comandos
- Iconos sin texto que no sean universalmente reconocibles

### 2.7 Flexibilidad y Eficiencia
✅ **Haz**:
- Proporciona búsqueda y filtros en tablas
- Ofrece atajos para usuarios frecuentes (paginación, ordenamiento)
- Permite múltiples formas de lograr el mismo objetivo

❌ **Evita**:
- Forzar un único camino para todas las tareas
- Ocultar funciones avanzadas sin alternativa accesible
- Ignorar a usuarios power users

### 2.8 Estética y Diseño Minimalista
✅ **Haz**:
- Elimina información irrelevante
- Usa espacio en blanco para separar secciones
- Prioriza contenido sobre decoración
- Máximo 7±2 elementos visibles simultáneamente

❌ **Evita**:
- Formularios con 20+ campos sin agrupar
- Tablas con 15+ columnas sin filtros
- Páginas con múltiples llamadas a la acción compitiendo

### 2.9 Ayuda a Reconocer y Recuperarse de Errores
✅ **Haz**:
- Mensajes de error en lenguaje claro
- Indica exactamente qué campo tiene el problema
- Sugiere cómo corregir el error
- Ejemplo: "Ingresa un correo válido (ej: nombre@empresa.com)"

❌ **Evita**:
- "Error 500" o "Invalid input"
- Mensajes que no indican qué hacer
- Errores que aparecen lejos del campo problemático

### 2.10 Ayuda y Documentación
✅ **Haz**:
- Usa tooltips para campos complejos
- Proporciona ejemplos en placeholders
- Incluye mensajes de ayuda contextuales
- Ejemplo: `<small class="field-help">Validaremos duplicados automáticamente</small>`

❌ **Evita**:
- Asumir que el usuario sabe qué ingresar
- Campos sin placeholder ni ayuda
- Documentación externa para tareas básicas

---

## 3. Estructura de Páginas (Patrón SugarOS)

### 3.1 Layout Estándar
```
┌─────────────────────────────────────┐
│ AppTopbar (logo + notificaciones)   │
├─────────────────────────────────────┤
│ Header                              │
│ - Botón "Volver"                    │
│ - Título de la página               │
│ - Subtítulo descriptivo             │
├─────────────────────────────────────┤
│ Tabs (si aplica)                    │
│ - Tab 1 | Tab 2 | Tab 3            │
├─────────────────────────────────────┤
│ Content Area                        │
│ - Card con padding 2rem             │
│ - Contenido específico del tab      │
└─────────────────────────────────────┘
```

### 3.2 Formularios
- **Agrupar campos lógicamente** con `<fieldset>` y `<legend>`
- **Máximo 3-4 campos por fila** (responsive)
- **Campos obligatorios marcados** con `*` rojo
- **Validación en tiempo real** (on-blur mínimo)
- **Botones de acción** alineados a la derecha
- **Botón "Limpiar"** siempre visible

### 3.3 Tablas
- **Barra de búsqueda** arriba de la tabla
- **Paginación** con opciones (5, 10, 20, 50)
- **Columnas ordenables** cuando tenga sentido
- **Acciones por fila** con iconos + tooltips
- **Empty state** amigable con call-to-action

### 3.4 Diálogos Modales
- **Título claro** que indique la acción
- **Mensaje de confirmación** para acciones destructivas
- **Botones claros**: "Cancelar" (secundario) + "Confirmar" (primario)
- **Validación dentro del modal** antes de permitir submit

---

## 4. Colores y Semántica

### 4.1 Colores de Estado (PrimeVue)
- **success** (verde): Operación exitosa, estado positivo
- **info** (azul): Información neutral, estado activo
- **warn** (amarillo): Advertencia, atención requerida
- **danger** (rojo): Error, peligro, estado negativo
- **secondary** (gris): Neutral, inactivo, sin estado

### 4.2 Uso Consistente
- **Botón primario**: Acción principal (Guardar, Crear)
- **Botón secundario**: Acciones secundarias (Cancelar, Limpiar)
- **Botón danger**: Solo para acciones destructivas (Eliminar)
- **Links**: Solo para navegación, no para acciones

---

## 5. Responsive Design

### 5.1 Breakpoints
- **Mobile**: < 768px (1 columna, stack vertical)
- **Tablet**: 768px - 1024px (2 columnas)
- **Desktop**: > 1024px (3-4 columnas)

### 5.2 Reglas
- **Formularios**: 1 columna en mobile, 2-3 en desktop
- **Tablas**: Scroll horizontal en mobile si es necesario
- **Modales**: Full-screen en mobile, centrado en desktop
- **Botones**: Full-width en mobile, auto en desktop

---

## 6. Accesibilidad

### 6.1 Labels y ARIA
- **Todo input debe tener `<label>` asociado** con `for`/`id`
- **Usa `aria-describedby`** para mensajes de ayuda
- **Iconos decorativos**: `aria-hidden="true"`
- **Iconos funcionales**: `aria-label` descriptivo

### 6.2 Navegación por Teclado
- **Todos los elementos interactivos** deben ser accesibles con Tab
- **Enter/Space** deben activar botones
- **Escape** debe cerrar modales
- **Focus visible** en todos los elementos

### 6.3 Contraste
- **Texto normal**: Ratio mínimo 4.5:1
- **Texto grande**: Ratio mínimo 3:1
- **No uses solo color** para transmitir información

---

## 7. Performance

### 7.1 Carga de Datos
- **Lazy loading** para tablas grandes
- **Paginación server-side** si hay > 100 registros
- **Skeleton loaders** en lugar de spinners genéricos
- **Cachea datos** que no cambian frecuentemente

### 7.2 Interactividad
- **Debounce** en búsquedas (300ms mínimo)
- **Optimistic updates** cuando sea posible
- **Cancela requests** si el usuario cambia de vista

---

## 8. Testing de Usabilidad

### 8.1 Checklist Pre-Lanzamiento
- [ ] ¿El usuario puede completar la tarea principal sin ayuda?
- [ ] ¿Los mensajes de error son claros y accionables?
- [ ] ¿Hay feedback visual para todas las acciones?
- [ ] ¿El formulario valida antes de enviar?
- [ ] ¿La tabla tiene búsqueda y filtros?
- [ ] ¿Los botones tienen labels claros?
- [ ] ¿Funciona en mobile?
- [ ] ¿Es accesible por teclado?

### 8.2 Métricas
- **Tiempo para completar tarea principal**: < 30 segundos
- **Tasa de error**: < 5%
- **Satisfacción del usuario**: > 4/5 (escala Likert)

---

## 9. Ejemplos de Código

### 9.1 Formulario con Validación
```vue
<div class="field required">
  <label for="email">
    Correo electrónico
    <span class="req-indicator">*</span>
  </label>
  <InputText
    id="email"
    v-model="form.email"
    :class="{ 'p-invalid': errors.email && touched.email }"
    @blur="touched.email = true"
    aria-describedby="email-help"
  />
  <small id="email-help" class="field-help">
    Validaremos duplicados automáticamente
  </small>
  <Message v-if="errors.email && touched.email" severity="error">
    {{ errors.email }}
  </Message>
</div>
```

### 9.2 Tabla con Búsqueda
```vue
<div class="table-toolbar">
  <InputText
    v-model="searchQuery"
    placeholder="Buscar..."
    class="search-input"
  />
  <Button
    icon="pi pi-refresh"
    label="Actualizar"
    @click="refresh"
  />
</div>

<DataTable
  :value="filteredLeads"
  paginator
  :rows="10"
  emptyMessage="No hay registros"
>
  <!-- columns -->
</DataTable>
```

### 9.3 Toast de Confirmación
```javascript
toast.add({
  severity: 'success',
  summary: '¡Lead registrado!',
  detail: 'El prospecto fue guardado exitosamente',
  life: 4000
})
```

---

## 10. Recursos

- **PrimeVue Components**: https://primevue.org/
- **Nielsen Norman Group**: https://www.nngroup.com/articles/
- **Material Design Guidelines**: https://material.io/design/guidelines/
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/

---

**Última actualización**: 2026-08-13
**Autor**: Equipo SugarOS (basado en principios de Donald Norman y Jakob Nielsen)