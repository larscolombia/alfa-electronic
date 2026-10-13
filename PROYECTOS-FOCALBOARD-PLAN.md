# Plan de Implementación: Módulo Proyectos (Inspirado en Focalboard)

## 📋 Resumen Ejecutivo

**Objetivo**: Crear módulo "Proyectos" bajo menú Financiero, replicando UX/UI de Focalboard adaptado a Angular + AdminUX.

**Tecnología Base**: Focalboard es React + TypeScript (MIT/Apache 2.0 License)  
**Nuestra Stack**: Angular 19 + TypeScript + AdminUX template  
**Esfuerzo Estimado**: 3-6 semanas (1 dev fullstack)

---

## 🎯 Componentes Clave de Focalboard a Replicar

### 1. **Vistas Principales** (Priority 1)
```
/webapp/src/components/
├── kanban/          → Vista tablero (drag & drop por estado)
├── table/           → Vista tabla con edición inline
├── gallery/         → Vista galería (cards visuales)
└── calendar/        → Vista calendario (por fechas)
```

**Angular Equivalentes**:
- Kanban: `@angular/cdk/drag-drop`
- Table: Angular Material Table + inline editing
- Gallery: CSS Grid + card components
- Calendar: FullCalendar o Angular Material Datepicker

---

### 2. **Sistema de Propiedades Personalizadas** (Priority 1)
```typescript
// Focalboard: /webapp/src/properties/
interface PropertyTemplate {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiSelect' | 'date' | 
        'person' | 'checkbox' | 'url' | 'email' | 'phone';
  options?: PropertyOption[];
}
```

**Nuestra Implementación**:
```typescript
// src/app/pages/app/projects/models/project-property.model.ts
export interface ProjectProperty {
  id: string;
  name: string;
  type: PropertyType;
  options?: PropertyOption[];
  required?: boolean;
  defaultValue?: any;
}

export enum PropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multiSelect',
  DATE = 'date',
  PERSON = 'person',       // Integra con usuarios del sistema
  CHECKBOX = 'checkbox',
  CURRENCY = 'currency',   // Específico para financiero
  PERCENTAGE = 'percentage'
}
```

---

### 3. **Card (Proyecto Individual)** (Priority 1)
```
/webapp/src/components/cardDetail/
├── cardDetail.tsx         → Modal de detalle completo
├── cardDialog.tsx         → Wrapper del diálogo
└── cardBadges.tsx         → Badges (fechas, propiedades, etc.)
```

**Nuestra Implementación**:
```
src/app/pages/app/projects/components/
├── project-card/
│   ├── project-card.component.ts
│   ├── project-card.component.html
│   └── project-card.component.scss
└── project-detail-modal/
    ├── project-detail-modal.component.ts
    ├── project-detail-modal.component.html
    └── project-detail-modal.component.scss
```

---

### 4. **Filtros y Agrupaciones** (Priority 2)
```typescript
// Focalboard: /webapp/src/cardFilter.ts
interface Filter {
  propertyId: string;
  condition: 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty';
  values: string[];
}

interface GroupBy {
  propertyId: string;
  mode: 'none' | 'property';
}
```

**Angular Services**:
```typescript
// src/app/pages/app/projects/services/project-filter.service.ts
@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  applyFilters(projects: Project[], filters: Filter[]): Project[] {}
  applyGrouping(projects: Project[], groupBy: GroupBy): Map<string, Project[]> {}
}
```

---

## 📁 Estructura de Carpetas Propuesta

```
src/app/pages/app/projects/
├── models/
│   ├── project.model.ts                    # Modelo principal del proyecto
│   ├── project-property.model.ts           # Sistema de propiedades
│   ├── project-view.model.ts              # Configuración de vistas
│   └── project-template.model.ts          # Templates de proyectos
├── services/
│   ├── project.service.ts                 # CRUD + API calls
│   ├── project-filter.service.ts          # Filtros y búsquedas
│   ├── project-view.service.ts            # Persistencia de vistas
│   └── project-template.service.ts        # Gestión de templates
├── components/
│   ├── project-list/                      # Vista principal (switching views)
│   ├── project-card/                      # Card individual
│   ├── project-detail-modal/              # Modal de detalle completo
│   ├── project-property-editor/           # Editor de propiedades custom
│   ├── views/
│   │   ├── kanban-view/                   # Vista tablero
│   │   ├── table-view/                    # Vista tabla
│   │   ├── gallery-view/                  # Vista galería
│   │   └── calendar-view/                 # Vista calendario
│   ├── filters/
│   │   ├── filter-bar/                    # Barra de filtros
│   │   └── filter-dialog/                 # Editor de filtros avanzados
│   └── shared/
│       ├── property-value-renderer/       # Renderiza valores según tipo
│       └── property-value-editor/         # Editor inline de valores
├── projects-routing.module.ts
├── projects.module.ts
└── projects.component.ts                  # Container principal
```

---

## 🏗️ Fases de Implementación

### **FASE 1: Fundación (Semana 1-2)** ⚡ RÁPIDA
- [x] Crear estructura de módulo y routing
- [x] Modelo de datos base (Project, Property, View)
- [x] Service con CRUD básico (mock inicial)
- [x] Vista Kanban básica con Angular CDK drag-drop
- [x] Card component simple (título, descripción, estado)
- [x] Integración en menú Financiero

**Resultado**: Board funcional con drag-drop, 3-4 propiedades fijas.

---

### **FASE 2: Propiedades Dinámicas (Semana 2-3)**
- [ ] Sistema de propiedades personalizables
- [ ] Editor de propiedades (crear, editar, eliminar tipos)
- [ ] Renderer dinámico según tipo
- [ ] Modal de detalle completo del proyecto
- [ ] Inline editing en cards

**Resultado**: Usuarios pueden customizar campos de proyectos.

---

### **FASE 3: Vistas Múltiples (Semana 3-4)**
- [ ] Vista Tabla con Angular Material Table
- [ ] Vista Galería con CSS Grid
- [ ] Switcher de vistas (tabs o dropdown)
- [ ] Persistencia de vista preferida por usuario

**Resultado**: 3 vistas funcionales (Kanban, Tabla, Galería).

---

### **FASE 4: Filtros y Búsqueda (Semana 4-5)**
- [ ] Barra de búsqueda global
- [ ] Filter bar con chips
- [ ] Dialog de filtros avanzados
- [ ] Agrupaciones por propiedad
- [ ] Ordenamiento customizable

**Resultado**: Sistema de filtros avanzado tipo Notion/Focalboard.

---

### **FASE 5: Templates y Workflow (Semana 5-6)**
- [ ] Sistema de templates de proyectos
- [ ] Estados configurables (workflow customizable)
- [ ] Automatizaciones básicas (ej: fecha límite → notificación)
- [ ] Permisos por rol (quién puede crear/editar/ver)

**Resultado**: Sistema completo de gestión de proyectos.

---

### **FASE 6: Integración Financiera (Semana 6+)** 🎯 CRÍTICO
- [ ] Link proyectos → presupuestos
- [ ] Link proyectos → órdenes de compra
- [ ] Dashboard de costos por proyecto
- [ ] Reportes financieros por proyecto
- [ ] Integración con módulos existentes (Company, Suppliers, etc.)

**Resultado**: Proyectos integrados con ecosistema financiero.

---

## 🎨 Componentes UI a "Clonar" de Focalboard

### Visual Design Elements (CSS/SCSS)
```scss
// Inspirados en /webapp/src/styles/
- Kanban columns con scroll vertical
- Cards con sombras sutiles y hover effects
- Property pills (badges coloreados por tipo)
- Drag & drop visual feedback
- Modal full-screen para card detail
- Toolbar sticky con acciones rápidas
```

### Interacciones Clave
1. **Drag & Drop**: Mover cards entre columnas
2. **Inline Editing**: Click on property → edit mode
3. **Quick Add**: Botón "+" al final de cada columna
4. **Bulk Actions**: Select múltiple + acciones masivas
5. **Keyboard Shortcuts**: `N` = nuevo, `Esc` = cerrar, `/` = buscar

---

## 🔧 Dependencias Angular Necesarias

```json
{
  "dependencies": {
    "@angular/cdk": "^19.x",           // Drag & drop
    "@angular/material": "^19.x",      // Table, Dialogs, Forms
    "fullcalendar": "^6.x",           // Calendar view
    "@fullcalendar/angular": "^6.x",
    "date-fns": "^3.x",               // Date utilities
    "lodash-es": "^4.x"               // Utilities
  }
}
```

---

## 📊 Modelo de Datos Backend (API)

```typescript
// GET /api/projects
interface Project {
  id: string;
  title: string;
  description?: string;
  boardId: string;                    // Permite múltiples tableros
  properties: Record<string, any>;    // Dinámico según PropertyTemplates
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/projects/boards/:id
interface ProjectBoard {
  id: string;
  name: string;
  icon?: string;
  propertyTemplates: PropertyTemplate[];
  defaultView: 'kanban' | 'table' | 'gallery' | 'calendar';
  filters?: Filter[];
  groupBy?: GroupBy;
  permissions: BoardPermissions;
}

// GET /api/projects/templates
interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  propertyTemplates: PropertyTemplate[];
  defaultProperties: Record<string, any>;
  workflow?: WorkflowConfig;
}
```

---

## ⚠️ Decisiones Técnicas Clave

### 1. **Estado Local vs Redux/NgRx**
**Recomendación**: Empezar con Services + RxJS (BehaviorSubject).  
Si crece mucho, migrar a NgRx en FASE 4+.

### 2. **Propiedades: Estáticas vs Dinámicas**
**Recomendación**: Híbrido.
- Propiedades core fijas: `title`, `description`, `status`, `createdBy`
- Propiedades custom: almacenadas en `properties: Record<string, any>`

### 3. **Drag & Drop: CDK vs Terceros**
**Recomendación**: Angular CDK es suficiente y nativo.  
Solo si necesitas multi-board drag, considerar SortableJS.

### 4. **Permisos: Role-Based vs Custom**
**Recomendación**: Role-based inicialmente (Admin, Finance, User).  
FASE 5+: permisos custom por board.

---

## 🚀 Quick Start (Comandos)

```bash
# 1. Generar módulo
ng generate module pages/app/projects --routing

# 2. Generar componentes principales
ng g c pages/app/projects/components/project-list
ng g c pages/app/projects/components/views/kanban-view
ng g c pages/app/projects/components/project-card
ng g c pages/app/projects/components/project-detail-modal

# 3. Generar services
ng g s pages/app/projects/services/project
ng g s pages/app/projects/services/project-filter
ng g s pages/app/projects/services/project-view

# 4. Instalar dependencias
npm install @angular/cdk @angular/material date-fns lodash-es
```

---

## 🎯 Métricas de Éxito

### FASE 1 (Semana 2):
- ✅ Crear 5+ proyectos manualmente
- ✅ Mover entre 3+ columnas de estado
- ✅ Ver detalles en modal

### FASE 3 (Semana 4):
- ✅ Cambiar entre 3 vistas sin perder datos
- ✅ 10+ propiedades custom diferentes

### FASE 6 (Semana 6+):
- ✅ Link 1 proyecto → 3+ presupuestos
- ✅ Dashboard financiero por proyecto
- ✅ Reportes exportables (PDF/Excel)

---

## 📚 Referencias de Código Focalboard

### Componentes React a Estudiar
```
1. Kanban Column Drag:
   /webapp/src/components/kanban/kanbanColumn.tsx
   /webapp/src/components/kanban/kanban.tsx

2. Property System:
   /webapp/src/properties/
   /webapp/src/components/propertyValueElement.tsx

3. Card Detail:
   /webapp/src/components/cardDetail/cardDetail.tsx

4. Filters:
   /webapp/src/cardFilter.ts
   /webapp/src/components/viewHeader/filterComponent.tsx

5. Table View:
   /webapp/src/components/table/table.tsx
   /webapp/src/components/table/tableRow.tsx
```

### Lógica de Negocio Portable
```typescript
// cardFilter.ts - Lógica de filtros (sin UI)
// octoUtils.tsx - Utilidades de datos
// mutator.ts - Patrón Command para undo/redo
// undoManager.ts - Gestión de historial
```

---

## 🏁 Recomendación Final

**Opción Rápida (2 semanas)**: FASE 1 + integración financiera básica.  
**Opción Completa (6 semanas)**: FASE 1-6 completas.  
**Opción Híbrida (4 semanas)**: FASE 1-3 + integración financiera (saltar templates).

**Mi sugerencia**: Empezar con FASE 1 (Kanban + CRUD básico) y validar con usuarios reales antes de invertir en templates y vistas avanzadas.

---

## 📞 Próximos Pasos

1. ¿Apruebas este plan?
2. ¿Empezamos con FASE 1 ahora mismo?
3. ¿Necesitas ajustar prioridades o agregar features?

**¿Quieres que genere el código base de FASE 1?** (estructura + Kanban básico en ~30 min)
