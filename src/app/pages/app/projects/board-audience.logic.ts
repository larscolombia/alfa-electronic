import type { BoardColumn } from './models';

export type BoardAudience = 'tecnico' | 'administrativo' | 'todos';

// El corte es el mismo que usa el filtro de casos: antes del diagnóstico es
// trabajo técnico; después pasa al tablero administrativo/comercial.
const technicalColumnIDs = new Set(['recibido', 'diagnostico']);

export function visibleBoardColumns(columns: BoardColumn[], audience: BoardAudience): BoardColumn[] {
  if (audience === 'todos') return columns;

  return columns.filter((column) => {
    const technical = technicalColumnIDs.has(column.id);
    return audience === 'tecnico' ? technical : !technical;
  });
}
