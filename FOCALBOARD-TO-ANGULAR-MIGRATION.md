# Guía de Migración: Focalboard (React) → Angular

## 🔄 Mapeo de Tecnologías

| Focalboard (React + TS) | Angular Equivalente | Notas |
|------------------------|-------------------|-------|
| React Hooks (useState, useEffect) | RxJS + Signals | Usar signals en Angular 19+ |
| Redux Toolkit | NgRx / Services + BehaviorSubject | Empezar con Services |
| React DnD | @angular/cdk/drag-drop | Nativo y suficiente |
| React Router | Angular Router | Ya configurado |
| Emotion/Styled Components | SCSS + :host | Usar ViewEncapsulation |
| React Context | Injectable Services | Usar providedIn: 'root' |
| React.memo | ChangeDetectionStrategy.OnPush | Para performance |

---

## 📦 Componentes React → Angular

### 1. Kanban Board

**Focalboard React**:
```tsx
// /webapp/src/components/kanban/kanban.tsx
const Kanban = ({ board, cards, views }) => {
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  
  const onDragEnd = (result: DragResult) => {
    // Lógica de drag & drop
  };
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {columns.map(column => (
        <KanbanColumn key={column.id} column={column} cards={...} />
      ))}
    </DragDropContext>
  );
};
```

**Angular Equivalente**:
```typescript
// kanban-view.component.ts
@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewComponent implements OnInit {
  columns$ = this.projectService.columns$;
  projects$ = this.projectService.projects$;
  
  drop(event: CdkDragDrop<Project[]>, columnId: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.updateProjectStatus(event.item.data.id, columnId);
    }
  }
  
  updateProjectStatus(projectId: string, newStatus: string) {
    this.projectService.updateStatus(projectId, newStatus).subscribe();
  }
}
```

```html
<!-- kanban-view.component.html -->
<div class="kanban-board">
  <div class="kanban-column" 
       *ngFor="let column of columns$ | async"
       cdkDropList
       [cdkDropListData]="getProjectsByColumn(column.id) | async"
       (cdkDropListDropped)="drop($event, column.id)">
    
    <div class="column-header">
      <h3>{{ column.name }}</h3>
      <span class="count">{{ (getProjectsByColumn(column.id) | async)?.length }}</span>
    </div>
    
    <div class="cards-container">
      <app-project-card
        *ngFor="let project of getProjectsByColumn(column.id) | async"
        [project]="project"
        cdkDrag>
      </app-project-card>
      
      <button class="add-card-btn" (click)="addProject(column.id)">
        + Add Project
      </button>
    </div>
  </div>
</div>
```

```scss
// kanban-view.component.scss
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 16px;
  height: calc(100vh - 200px);
}

.kanban-column {
  min-width: 300px;
  max-width: 300px;
  background: var(--background-light);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  
  &.cdk-drop-list-dragging {
    background: var(--background-hover);
  }
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
  
  .count {
    background: var(--accent-color);
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 12px;
  }
}

.cards-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.add-card-btn {
  border: 2px dashed var(--border-color);
  background: transparent;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  
  &:hover {
    background: var(--background-hover);
    border-color: var(--accent-color);
    color: var(--accent-color);
  }
}
```

---

### 2. Property System (Propiedades Dinámicas)

**Focalboard React**:
```tsx
// /webapp/src/components/propertyValueElement.tsx
const PropertyValueElement = ({ card, property, readOnly, onChange }) => {
  switch (property.type) {
    case 'select':
      return <SelectProperty value={...} options={...} onChange={...} />;
    case 'date':
      return <DateProperty value={...} onChange={...} />;
    case 'person':
      return <PersonProperty value={...} onChange={...} />;
    // ... más tipos
  }
};
```

**Angular Equivalente**:
```typescript
// property-value-renderer.component.ts
@Component({
  selector: 'app-property-value-renderer',
  template: `
    <ng-container [ngSwitch]="property.type">
      <app-text-property 
        *ngSwitchCase="'text'" 
        [value]="value" 
        [readOnly]="readOnly"
        (valueChange)="onChange.emit($event)">
      </app-text-property>
      
      <app-select-property 
        *ngSwitchCase="'select'" 
        [value]="value"
        [options]="property.options"
        [readOnly]="readOnly"
        (valueChange)="onChange.emit($event)">
      </app-select-property>
      
      <app-date-property 
        *ngSwitchCase="'date'" 
        [value]="value"
        [readOnly]="readOnly"
        (valueChange)="onChange.emit($event)">
      </app-date-property>
      
      <app-person-property 
        *ngSwitchCase="'person'" 
        [value]="value"
        [users]="availableUsers$ | async"
        [readOnly]="readOnly"
        (valueChange)="onChange.emit($event)">
      </app-person-property>
      
      <app-currency-property 
        *ngSwitchCase="'currency'" 
        [value]="value"
        [readOnly]="readOnly"
        (valueChange)="onChange.emit($event)">
      </app-currency-property>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyValueRendererComponent {
  @Input() property!: ProjectProperty;
  @Input() value: any;
  @Input() readOnly = false;
  @Output() valueChange = new EventEmitter<any>();
  
  availableUsers$ = this.userService.getUsers();
  
  constructor(private userService: UserService) {}
}
```

```typescript
// select-property.component.ts
@Component({
  selector: 'app-select-property',
  template: `
    <div class="select-property" [class.read-only]="readOnly">
      <mat-select 
        [value]="value" 
        [disabled]="readOnly"
        (selectionChange)="valueChange.emit($event.value)">
        <mat-option *ngFor="let option of options" [value]="option.id">
          <span class="option-badge" [style.background-color]="option.color">
            {{ option.name }}
          </span>
        </mat-option>
      </mat-select>
    </div>
  `,
  styles: [`
    .option-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
    }
  `]
})
export class SelectPropertyComponent {
  @Input() value: string | null = null;
  @Input() options: PropertyOption[] = [];
  @Input() readOnly = false;
  @Output() valueChange = new EventEmitter<string>();
}
```

---

### 3. Card Detail Modal

**Focalboard React**:
```tsx
// /webapp/src/components/cardDetail/cardDetail.tsx
const CardDetail = ({ cardId, onClose }) => {
  const card = useAppSelector(state => state.cards.byId[cardId]);
  const properties = useAppSelector(state => state.board.propertyTemplates);
  
  return (
    <Modal onClose={onClose}>
      <CardDetailHeader card={card} />
      <PropertyList card={card} properties={properties} />
      <ContentBlocks card={card} />
      <Comments cardId={cardId} />
    </Modal>
  );
};
```

**Angular Equivalente**:
```typescript
// project-detail-modal.component.ts
@Component({
  selector: 'app-project-detail-modal',
  templateUrl: './project-detail-modal.component.html',
  styleUrls: ['./project-detail-modal.component.scss']
})
export class ProjectDetailModalComponent implements OnInit {
  project$ = new BehaviorSubject<Project | null>(null);
  properties$ = this.projectService.getPropertyTemplates();
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { projectId: string },
    private dialogRef: MatDialogRef<ProjectDetailModalComponent>,
    private projectService: ProjectService
  ) {}
  
  ngOnInit() {
    this.loadProject();
  }
  
  loadProject() {
    this.projectService.getProject(this.data.projectId)
      .subscribe(project => this.project$.next(project));
  }
  
  updateProperty(propertyId: string, value: any) {
    const project = this.project$.value;
    if (!project) return;
    
    this.projectService.updateProperty(project.id, propertyId, value)
      .subscribe(updated => this.project$.next(updated));
  }
  
  close() {
    this.dialogRef.close();
  }
}
```

```html
<!-- project-detail-modal.component.html -->
<div class="project-detail-modal" *ngIf="project$ | async as project">
  <div class="modal-header">
    <div class="icon-title">
      <mat-icon>{{ project.icon || 'assignment' }}</mat-icon>
      <input 
        class="title-input" 
        [(ngModel)]="project.title"
        (blur)="updateTitle(project.title)"
        placeholder="Project title...">
    </div>
    <button mat-icon-button (click)="close()">
      <mat-icon>close</mat-icon>
    </button>
  </div>
  
  <div class="modal-body">
    <!-- Properties Grid -->
    <div class="properties-grid">
      <div class="property-row" *ngFor="let prop of properties$ | async">
        <span class="property-label">{{ prop.name }}</span>
        <app-property-value-renderer
          [property]="prop"
          [value]="project.properties[prop.id]"
          (valueChange)="updateProperty(prop.id, $event)">
        </app-property-value-renderer>
      </div>
    </div>
    
    <!-- Description -->
    <div class="description-section">
      <h4>Description</h4>
      <app-markdown-editor
        [content]="project.description"
        (contentChange)="updateDescription($event)">
      </app-markdown-editor>
    </div>
    
    <!-- Attachments -->
    <div class="attachments-section">
      <h4>Attachments</h4>
      <app-file-upload-zone
        [files]="project.attachments"
        (filesChanged)="updateAttachments($event)">
      </app-file-upload-zone>
    </div>
    
    <!-- Comments -->
    <div class="comments-section">
      <h4>Comments</h4>
      <app-comments-list [projectId]="project.id"></app-comments-list>
    </div>
  </div>
  
  <div class="modal-footer">
    <span class="created-info">
      Created by {{ project.createdBy }} on {{ project.createdAt | date:'medium' }}
    </span>
  </div>
</div>
```

---

### 4. Filter System

**Focalboard React**:
```typescript
// /webapp/src/cardFilter.ts
class CardFilter {
  static applyFilterGroup(cards: Card[], filterGroup: FilterGroup): Card[] {
    return cards.filter(card => {
      return filterGroup.filters.every(filter => {
        return this.isFilterMet(card, filter);
      });
    });
  }
  
  private static isFilterMet(card: Card, filter: Filter): boolean {
    const propertyValue = card.properties[filter.propertyId];
    
    switch (filter.condition) {
      case 'includes':
        return filter.values.includes(propertyValue);
      case 'notIncludes':
        return !filter.values.includes(propertyValue);
      case 'isEmpty':
        return !propertyValue || propertyValue === '';
      case 'isNotEmpty':
        return !!propertyValue && propertyValue !== '';
      // ... más condiciones
    }
  }
}
```

**Angular Equivalente**:
```typescript
// project-filter.service.ts
@Injectable({ providedIn: 'root' })
export class ProjectFilterService {
  
  applyFilters(projects: Project[], filters: Filter[]): Project[] {
    if (!filters || filters.length === 0) {
      return projects;
    }
    
    return projects.filter(project => {
      return filters.every(filter => this.matchesFilter(project, filter));
    });
  }
  
  private matchesFilter(project: Project, filter: Filter): boolean {
    const value = project.properties[filter.propertyId];
    
    switch (filter.condition) {
      case FilterCondition.INCLUDES:
        return filter.values.includes(value);
        
      case FilterCondition.NOT_INCLUDES:
        return !filter.values.includes(value);
        
      case FilterCondition.IS_EMPTY:
        return value === null || value === undefined || value === '';
        
      case FilterCondition.IS_NOT_EMPTY:
        return value !== null && value !== undefined && value !== '';
        
      case FilterCondition.CONTAINS:
        return typeof value === 'string' && 
               value.toLowerCase().includes(filter.values[0]?.toLowerCase());
        
      case FilterCondition.GREATER_THAN:
        return Number(value) > Number(filter.values[0]);
        
      case FilterCondition.LESS_THAN:
        return Number(value) < Number(filter.values[0]);
        
      case FilterCondition.DATE_RANGE:
        const date = new Date(value);
        const start = new Date(filter.values[0]);
        const end = new Date(filter.values[1]);
        return date >= start && date <= end;
        
      default:
        return true;
    }
  }
  
  applyGrouping(projects: Project[], groupBy: GroupBy): Map<string, Project[]> {
    if (!groupBy || groupBy.mode === 'none') {
      return new Map([['All', projects]]);
    }
    
    const grouped = new Map<string, Project[]>();
    
    projects.forEach(project => {
      const groupValue = project.properties[groupBy.propertyId] || 'Ungrouped';
      
      if (!grouped.has(groupValue)) {
        grouped.set(groupValue, []);
      }
      grouped.get(groupValue)!.push(project);
    });
    
    return grouped;
  }
  
  applySearch(projects: Project[], searchTerm: string): Project[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return projects;
    }
    
    const term = searchTerm.toLowerCase();
    
    return projects.filter(project => {
      // Search in title
      if (project.title.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search in description
      if (project.description?.toLowerCase().includes(term)) {
        return true;
      }
      
      // Search in properties
      return Object.values(project.properties).some(value => {
        return String(value).toLowerCase().includes(term);
      });
    });
  }
}

export enum FilterCondition {
  INCLUDES = 'includes',
  NOT_INCLUDES = 'notIncludes',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  DATE_RANGE = 'dateRange'
}

export interface Filter {
  propertyId: string;
  condition: FilterCondition;
  values: any[];
}

export interface GroupBy {
  propertyId: string;
  mode: 'none' | 'property';
}
```

---

## 🎨 Estilos SCSS (Inspirados en Focalboard)

```scss
// projects-theme.scss
:root {
  // Colors from Focalboard
  --background-light: #f7f8f9;
  --background-hover: #e8eaed;
  --border-color: #d0d7de;
  --text-primary: #1d1c1d;
  --text-secondary: #616061;
  --accent-color: #0073ea;
  --accent-hover: #0060c0;
  --success-color: #00c875;
  --warning-color: #fdab3d;
  --danger-color: #e44258;
  
  // Card shadows
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  --card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.12);
  
  // Spacing
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
}

// Card component styling (Focalboard-like)
.project-card {
  background: white;
  border-radius: 8px;
  padding: var(--spacing-md);
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-2px);
  }
  
  &.cdk-drag-preview {
    opacity: 0.8;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  &.cdk-drag-placeholder {
    opacity: 0.3;
  }
  
  .card-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
    line-height: 1.4;
  }
  
  .card-badges {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
    margin-top: var(--spacing-sm);
    
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      
      &.badge-date {
        background: var(--background-light);
        color: var(--text-secondary);
      }
      
      &.badge-person {
        background: var(--accent-color);
        color: white;
      }
      
      &.badge-priority-high {
        background: var(--danger-color);
        color: white;
      }
    }
  }
}

// Property pills (select/multiselect styling)
.property-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
  
  // Auto-generate colors
  @for $i from 1 through 10 {
    &.color-#{$i} {
      background: hsl($i * 36, 70%, 50%);
      color: white;
    }
  }
}
```

---

## 🔌 API Integration Pattern

**Focalboard Pattern**:
```typescript
// Usa un cliente HTTP custom (octoClient.ts)
class OctoClient {
  async getBlocks(boardId: string): Promise<Block[]> {
    const response = await fetch(`/api/v2/boards/${boardId}/blocks`);
    return response.json();
  }
}
```

**Angular Pattern**:
```typescript
// project-api.service.ts
@Injectable({ providedIn: 'root' })
export class ProjectApiService {
  private baseUrl = environment.apiUrl + '/projects';
  
  constructor(private http: HttpClient) {}
  
  getProjects(boardId: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/boards/${boardId}/projects`);
  }
  
  createProject(boardId: string, project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/boards/${boardId}/projects`, project);
  }
  
  updateProject(projectId: string, updates: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${projectId}`, updates);
  }
  
  updateProperty(projectId: string, propertyId: string, value: any): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${projectId}/properties/${propertyId}`, { value });
  }
  
  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${projectId}`);
  }
}

// project.service.ts (Facade Pattern)
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();
  
  private filtersSubject = new BehaviorSubject<Filter[]>([]);
  public filters$ = this.filtersSubject.asObservable();
  
  public filteredProjects$ = combineLatest([
    this.projects$,
    this.filters$
  ]).pipe(
    map(([projects, filters]) => this.filterService.applyFilters(projects, filters))
  );
  
  constructor(
    private api: ProjectApiService,
    private filterService: ProjectFilterService
  ) {}
  
  loadProjects(boardId: string) {
    this.api.getProjects(boardId).subscribe(
      projects => this.projectsSubject.next(projects)
    );
  }
  
  addFilter(filter: Filter) {
    const current = this.filtersSubject.value;
    this.filtersSubject.next([...current, filter]);
  }
  
  // ... más métodos
}
```

---

## 🚀 Performance Tips (de Focalboard a Angular)

### 1. Virtual Scrolling (para listas largas)
```typescript
// Focalboard usa react-window, nosotros usamos CDK Virtual Scroll
import { ScrollingModule } from '@angular/cdk/scrolling';

// En template:
<cdk-virtual-scroll-viewport itemSize="80" class="cards-viewport">
  <app-project-card 
    *cdkVirtualFor="let project of filteredProjects$ | async"
    [project]="project">
  </app-project-card>
</cdk-virtual-scroll-viewport>
```

### 2. OnPush Change Detection
```typescript
// Todos los componentes deben usar OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 3. Memoization de Filtros
```typescript
// Usar shareReplay para evitar recomputaciones
public filteredProjects$ = combineLatest([...]).pipe(
  map(([projects, filters]) => this.filterService.applyFilters(projects, filters)),
  shareReplay(1) // Cache del último resultado
);
```

---

## 📝 Checklist de Portabilidad

- [ ] **Drag & Drop**: ✅ Usar `@angular/cdk/drag-drop`
- [ ] **Property System**: ✅ Componentes dinámicos con ngSwitch
- [ ] **Filters**: ✅ Service pattern con RxJS
- [ ] **Modal/Dialog**: ✅ Angular Material Dialog
- [ ] **Markdown Editor**: ⚠️ Usar `ngx-markdown` o custom
- [ ] **File Upload**: ⚠️ Implementar custom o usar lib
- [ ] **Comments**: ⚠️ Implementar desde cero
- [ ] **Undo/Redo**: ⚠️ Adaptar patrón Command de Focalboard
- [ ] **Realtime Updates**: ⚠️ WebSockets o SSE (no en FASE 1)

---

## 🎓 Lecciones de Focalboard

### ✅ Qué copiar:
1. **UX patterns**: Drag & drop, inline editing, property pills
2. **Data structures**: Block system, property templates, filters
3. **Visual design**: Card shadows, spacing, colors
4. **Feature set**: Multiple views, templates, grouping

### ❌ Qué NO copiar:
1. **Redux overengineering**: Empezar con Services simples
2. **Plugin architecture**: No necesario en FASE 1
3. **Self-hosting complexity**: Backend separado
4. **Desktop app wrapping**: Solo web por ahora

### 🔄 Qué adaptar:
1. **Property system**: Agregar tipos específicos (currency, percentage)
2. **Permissions**: Integrar con sistema de roles existente
3. **Integration**: Links a presupuestos, órdenes, suppliers
4. **Theming**: Usar colores de AdminUX template

---

## 🏁 Conclusión

**Viabilidad**: ✅ Totalmente factible  
**Esfuerzo**: ⚠️ Medio-Alto (3-6 semanas)  
**ROI**: ✅ Alto (si se necesita customización profunda)  
**Recomendación**: Empezar con FASE 1 (2 semanas) y validar antes de invertir más.

---

**¿Listo para empezar?** Puedo generar ahora:
1. Módulo base + routing
2. Modelos de datos TypeScript
3. Kanban view funcional con drag & drop
4. Card component con modal de detalle
5. Service layer con RxJS

Tardaré ~30-45 minutos en generar el scaffolding completo de FASE 1.
