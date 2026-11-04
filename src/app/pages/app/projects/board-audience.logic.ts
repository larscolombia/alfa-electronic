import type { BoardColumn } from './models';

export type BoardAudience = 'tecnico' | 'administrativo' | 'todos';

// Estados operativos que el técnico puede consultar y gestionar en el flujo.
// Se usa equipmentStatusId para que una columna renombrada (P0, P1, etc.)
// conserve la misma visibilidad técnica.
export const TECHNICIAN_WORKFLOW_STATUS_IDS = new Set([
  'diagnostico',
  'pedir-repuestos',
  'reparacion',
  'esperando-proveedor',
  'garantia',
  'garantia-espera-repuestos',
  'prestamo',
]);

export function visibleBoardColumns(columns: BoardColumn[], audience: BoardAudience): BoardColumn[] {
  if (audience === 'todos') return columns;

  return columns.filter((column) => {
    const technical = TECHNICIAN_WORKFLOW_STATUS_IDS.has(column.equipmentStatusId || column.id);
    return audience === 'tecnico' ? technical : !technical;
  });
}
