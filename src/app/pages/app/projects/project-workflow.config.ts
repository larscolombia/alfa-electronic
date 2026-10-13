import { BoardColumn, ProjectBoard, ViewType } from './models';
import { computeBusinessDaysBetween as computeBusinessDaysFromCalendar } from '../company/hr/worktime-calendar.util';

export type ProjectWorkflowStatusId =
  | 'recibido'
  | 'diagnostico'
  | 'por-cotizar'
  | 'pedir-repuestos'
  | 'esperando-proveedor'
  | 'reparacion'
  | 'pruebas'
  | 'garantia'
  | 'garantia-espera-repuestos'
  | 'prestamo'
  | 'listo-entrega'
  | 'entregado';

export type ProjectTechnicalTestType =
  | 'banco-pruebas'
  | 'laboratorio'
  | 'multimetro-scan'
  | 'sin-pruebas'
  | 'no-reparable';

export interface ProjectWorkflowStatusOption {
  id: ProjectWorkflowStatusId;
  label: string;
  description: string;
}

export interface ProjectTechnicalTestTypeOption {
  id: ProjectTechnicalTestType;
  label: string;
  description: string;
}

export type ProjectSlaSeverity = 'neutral' | 'success' | 'warning' | 'overdue' | 'critical';

export const PROJECT_WORKFLOW_STATUS_OPTIONS: ProjectWorkflowStatusOption[] = [
  {
    id: 'recibido',
    label: 'Recibido',
    description: 'Equipo recibido y pendiente de asignacion o arranque tecnico.',
  },
  {
    id: 'diagnostico',
    label: 'Diagnostico',
    description: 'Position 0. Revision tecnica inicial y definicion del alcance.',
  },
  {
    id: 'por-cotizar',
    label: 'Por cotizar',
    description: 'Equipo diagnosticado pendiente de oferta comercial.',
  },
  {
    id: 'pedir-repuestos',
    label: 'Pedir componentes',
    description: 'Position 0.5. Equipo aprobado para listar y solicitar componentes.',
  },
  {
    id: 'esperando-proveedor',
    label: 'Esperando proveedor',
    description: 'Position 11. Material solicitado y pendiente de arribo.',
  },
  {
    id: 'reparacion',
    label: 'Reparacion',
    description: 'Position 1. Equipo con material listo o intervencion en curso.',
  },
  {
    id: 'pruebas',
    label: 'Pruebas QA',
    description: 'Validaciones en banco, laboratorio o QA tecnico.',
  },
  {
    id: 'garantia',
    label: 'Garantia',
    description: 'Position 16. Seguimiento de casos devueltos o en garantia.',
  },
  {
    id: 'garantia-espera-repuestos',
    label: 'Garantia esperando repuestos',
    description: 'Position 26. Equipo en garantia que espera llegada de repuestos.',
  },
  {
    id: 'prestamo',
    label: 'Material en prestamo',
    description: 'Position 13. Materiales o equipos prestados al cliente.',
  },
  {
    id: 'listo-entrega',
    label: 'Listo para entrega',
    description: 'Equipo validado, listo para cierre y despacho.',
  },
  {
    id: 'entregado',
    label: 'Entregado',
    description: 'Caso cerrado y equipo entregado al cliente.',
  },
];

export const PROJECT_TEST_TYPE_OPTIONS: ProjectTechnicalTestTypeOption[] = [
  {
    id: 'banco-pruebas',
    label: 'Banco de pruebas',
    description: 'Validacion completa con banco o fixture dedicado.',
  },
  {
    id: 'laboratorio',
    label: 'Laboratorio parcial',
    description: 'Prueba energizada parcial en mesa o laboratorio.',
  },
  {
    id: 'multimetro-scan',
    label: 'Multimetro / scan',
    description: 'Revision con instrumentos y prueba funcional limitada.',
  },
  {
    id: 'sin-pruebas',
    label: 'Sin pruebas',
    description: 'No se realizaron pruebas funcionales antes del cierre.',
  },
  {
    id: 'no-reparable',
    label: 'No reparable',
    description: 'Diagnostico concluye que el equipo no es reparable.',
  },
];

export function getProjectWorkflowStatusLabel(statusId: string): string {
  return PROJECT_WORKFLOW_STATUS_OPTIONS.find((option) => option.id === statusId)?.label ?? 'Recibido';
}

export function getProjectTechnicalTestTypeLabel(testTypeId: string): string {
  return PROJECT_TEST_TYPE_OPTIONS.find((option) => option.id === testTypeId)?.label ?? 'Sin pruebas';
}

export function buildTechnicalBoardColumns(): BoardColumn[] {
  return [
    {
      id: 'recibido',
      name: 'Recibido',
      color: '#64748b',
      order: 1,
      description: 'Recepcion tecnica y asignacion inicial.',
      equipmentStatusId: 'recibido',
      equipmentStatusLabel: 'Recibido',
      greenDays: 0,
      yellowDays: 0,
      includeInWorkload: false,
      trackAging: false,
    },
    {
      id: 'diagnostico',
      name: 'Diagnostico',
      color: '#2563eb',
      order: 2,
      description: 'Diagnostico inicial y memo tecnico.',
      equipmentStatusId: 'diagnostico',
      equipmentStatusLabel: 'Diagnostico',
      greenDays: 2,
      yellowDays: 2,
      includeInWorkload: true,
      trackAging: true,
    },
    {
      id: 'por-cotizar',
      name: 'Por cotizar',
      color: '#f59e0b',
      order: 3,
      description: 'Diagnostico cerrado y pendiente de oferta administrativa/comercial.',
      equipmentStatusId: 'por-cotizar',
      equipmentStatusLabel: 'Por cotizar',
      greenDays: 2,
      yellowDays: 1,
      includeInWorkload: true,
      trackAging: true,
    },
    {
      id: 'reparacion',
      name: 'Reparacion',
      color: '#7c3aed',
      order: 4,
      description: 'Intervencion tecnica y consumo de componentes.',
      equipmentStatusId: 'reparacion',
      equipmentStatusLabel: 'En reparacion',
      greenDays: 3,
      yellowDays: 1,
      includeInWorkload: true,
      trackAging: true,
    },
    {
      id: 'pruebas',
      name: 'Pruebas QA',
      color: '#0f766e',
      order: 5,
      description: 'Pruebas finales en banco, laboratorio o QA.',
      equipmentStatusId: 'pruebas',
      equipmentStatusLabel: 'Pruebas QA',
      greenDays: 1,
      yellowDays: 1,
      includeInWorkload: true,
      trackAging: true,
    },
    {
      id: 'listo-entrega',
      name: 'Listo para entrega',
      color: '#10b981',
      order: 6,
      description: 'Equipo listo para despacho o cierre administrativo.',
      equipmentStatusId: 'listo-entrega',
      equipmentStatusLabel: 'Listo para entrega',
      greenDays: 1,
      yellowDays: 1,
      includeInWorkload: true,
      trackAging: true,
    },
    {
      id: 'garantia-espera-repuestos',
      name: 'Garantia esp. repuestos',
      color: '#f97316',
      order: 8,
      description: 'Equipos en garantia que esperan repuestos.',
      equipmentStatusId: 'garantia-espera-repuestos',
      equipmentStatusLabel: 'Garantia esp. repuestos',
      greenDays: 3,
      yellowDays: 2,
      includeInWorkload: true,
      trackAging: true,
    },
    {
      id: 'entregado',
      name: 'Entregado',
      color: '#94a3b8',
      order: 7,
      description: 'Caso cerrado y equipo entregado.',
      equipmentStatusId: 'entregado',
      equipmentStatusLabel: 'Entregado',
      greenDays: 0,
      yellowDays: 0,
      includeInWorkload: false,
      trackAging: false,
    },
  ];
}

export function buildTechnicalProjectBoard(): ProjectBoard {
  return {
    id: 'board-1',
    name: 'Flujo tecnico de reparacion',
    icon: 'bi-kanban',
    columns: buildTechnicalBoardColumns(),
    propertyTemplates: [],
    defaultView: ViewType.KANBAN,
  };
}

export function mapLegacyProjectStatus(status: string): ProjectWorkflowStatusId {
  const normalized = String(status ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'backlog':
      return 'diagnostico';
    case 'in-progress':
      return 'reparacion';
    case 'review':
      return 'pruebas';
    case 'completed':
      return 'entregado';
    case 'pedir-repuestos':
      return 'reparacion';
    case 'por-cotizar':
      return 'por-cotizar';
    case 'esperando-proveedor':
      return 'reparacion';
    case 'garantia':
      return 'reparacion';
    case 'prestamo':
      return 'recibido';
    case 'listo-entrega':
      return 'listo-entrega';
    case 'entregado':
      return 'entregado';
    case 'reparacion':
      return 'reparacion';
    case 'pruebas':
      return 'pruebas';
    case 'recibido':
      return 'recibido';
    default:
      return 'diagnostico';
  }
}

export function computeBusinessDaysBetween(startDate: Date | null, endDate = new Date()): number {
  return computeBusinessDaysFromCalendar(startDate, endDate);
}

export function resolveProjectSlaSeverity(
  column: BoardColumn | null | undefined,
  stageEnteredAt: Date | null,
  _priority: string,
): ProjectSlaSeverity {
  if (!column || !stageEnteredAt) {
    return 'neutral';
  }

  const elapsedDays = computeBusinessDaysBetween(stageEnteredAt);
  const greenCut = normalizeSlaDays(column.greenDays, 2);
  const yellowCut = greenCut + normalizeSlaDays(column.yellowDays, 2);
  const overdueCut = yellowCut + 2;

  if (elapsedDays <= greenCut) {
    return 'success'; // verde (0-greenCut business days)
  }

  if (elapsedDays <= yellowCut) {
    return 'warning'; // amarillo (greenCut+1-yellowCut business days)
  }

  if (elapsedDays <= overdueCut) {
    return 'overdue'; // naranja (yellowCut+1-overdueCut business days)
  }

  return 'critical'; // rojo (overdueCut+ business days)
}

function normalizeSlaDays(value: number | null | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

export function describeProjectSla(
  column: BoardColumn | null | undefined,
  stageEnteredAt: Date | null,
  priority: string,
): string {
  const severity = resolveProjectSlaSeverity(column, stageEnteredAt, priority);

  if (!column?.trackAging || !stageEnteredAt) {
    return 'Sin SLA activo';
  }

  const elapsedDays = computeBusinessDaysBetween(stageEnteredAt);
  if (severity === 'success') {
    return `Semaforo verde: ${elapsedDays} dia(s) habiles`;
  }

  if (severity === 'warning') {
    return `Semaforo amarillo: ${elapsedDays} dia(s) habiles`;
  }

  if (severity === 'overdue') {
    return `Semaforo naranja: ${elapsedDays} dia(s) habiles`;
  }

  return `Semaforo rojo: ${elapsedDays} dia(s) habiles`;
}