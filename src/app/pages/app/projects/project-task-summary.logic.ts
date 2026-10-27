import { Project, Task } from './models';

/**
 * Añade el resumen de tareas en una sola pasada por la colección de tareas.
 * Evita recorrer toda la lista de tareas por cada tarjeta del tablero.
 */
export function enrichProjectsWithTaskSummary(projects: Project[], tasks: Task[]): Project[] {
  const tasksByProject = new Map<string, Task[]>();
  const completedByProject = new Map<string, number>();

  for (const task of tasks) {
    const projectID = task.projectId;
    const projectTasks = tasksByProject.get(projectID) ?? [];
    projectTasks.push(task);
    tasksByProject.set(projectID, projectTasks);

    if (task.completed) {
      completedByProject.set(projectID, (completedByProject.get(projectID) ?? 0) + 1);
    }
  }

  return projects.map((project) => {
    const projectTasks = tasksByProject.get(project.id) ?? [];
    const completedTasks = completedByProject.get(project.id) ?? 0;
    const totalTasks = projectTasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...project,
      tasks: projectTasks,
      completedTasks,
      totalTasks,
      progress,
      properties: { ...project.properties, progress },
    };
  });
}
