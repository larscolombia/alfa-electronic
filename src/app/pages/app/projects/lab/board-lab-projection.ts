import type { BoardColumn, Project } from '../models';
import { visibleBoardColumns } from '../board-audience.logic';

export type LabAudience = 'todos' | 'tecnico' | 'administrativo';
export interface LabColumn {
  column: BoardColumn;
  total: number;
  visible: Project[];
}

/** One pass over the received dataset; only visible cards enter Angular's DOM. */
export function projectLabColumns(
  columns: BoardColumn[], projects: Project[], audience: LabAudience,
  assignee: string, limits: Map<string, number>,
): LabColumn[] {
  const result = visibleBoardColumns(columns, audience).map(column => ({ column, total: 0, visible: [] as Project[] }));
  const byId = new Map(result.map(item => [item.column.id, item]));
  const person = assignee.trim().toLowerCase();
  for (const project of projects) {
    if (person && String(project.properties['assignee'] ?? '').trim().toLowerCase() !== person) continue;
    if (audience !== 'todos') {
      const closed = Boolean(project.properties['diagnosisClosedAt']);
      if (audience === 'tecnico' ? closed : !closed) continue;
    }
    const entry = byId.get(project.status);
    if (!entry) continue;
    entry.total++;
    if (entry.visible.length < (limits.get(entry.column.id) || 12)) entry.visible.push(project);
  }
  return result;
}
