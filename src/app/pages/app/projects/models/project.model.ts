/**
 * Core Project model
 */
export interface Project {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  status: string; // Column/status ID
  properties: Record<string, any>; // Dynamic properties
  boardId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  attachments?: Attachment[];
  tasks?: Task[]; // Project tasks
  completedTasks?: number; // Calculated field
  totalTasks?: number; // Calculated field
  progress?: number; // Calculated from tasks completion (0-100)
}

/**
 * Task model
 */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  dependencies?: string[]; // IDs of tasks that must be completed first
  attachments?: Attachment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  order: number; // For sorting
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Task filter options
 */
export interface TaskFilter {
  completed?: boolean;
  priority?: TaskPriority;
  assignee?: string;
  searchTerm?: string;
}

/**
 * Property template definition
 */
export interface PropertyTemplate {
  id: string;
  name: string;
  type: PropertyType;
  options?: PropertyOption[];
  required?: boolean;
  defaultValue?: any;
}

/**
 * Property types available
 */
export enum PropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multiSelect',
  DATE = 'date',
  PERSON = 'person',
  CHECKBOX = 'checkbox',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone'
}

/**
 * Property option (for select/multiselect)
 */
export interface PropertyOption {
  id: string;
  name: string;
  color: string;
}

/**
 * Board column (status)
 */
export interface BoardColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  description?: string;
  equipmentStatusId?: string;
  equipmentStatusLabel?: string;
  greenDays?: number;
  yellowDays?: number;
  includeInWorkload?: boolean;
  trackAging?: boolean;
}

/**
 * Project board configuration
 */
export interface ProjectBoard {
  id: string;
  name: string;
  icon?: string;
  columns: BoardColumn[];
  propertyTemplates: PropertyTemplate[];
  defaultView: ViewType;
}

/**
 * View types
 */
export enum ViewType {
  KANBAN = 'kanban',
  TABLE = 'table',
  GALLERY = 'gallery',
  CALENDAR = 'calendar'
}

/**
 * File attachment
 */
export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}
