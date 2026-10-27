/** Unit test mirror for project-task-summary.logic.ts. Run with node. */
function enrich(projects, tasks) {
  const tasksByProject = new Map();
  const completedByProject = new Map();
  for (const task of tasks) {
    const projectTasks = tasksByProject.get(task.projectId) ?? [];
    projectTasks.push(task);
    tasksByProject.set(task.projectId, projectTasks);
    if (task.completed) completedByProject.set(task.projectId, (completedByProject.get(task.projectId) ?? 0) + 1);
  }
  return projects.map((project) => {
    const projectTasks = tasksByProject.get(project.id) ?? [];
    const completedTasks = completedByProject.get(project.id) ?? 0;
    const totalTasks = projectTasks.length;
    const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { ...project, tasks: projectTasks, completedTasks, totalTasks, progress };
  });
}

const result = enrich([{ id: 'a' }, { id: 'b' }, { id: 'c' }], [
  { projectId: 'a', completed: true }, { projectId: 'a', completed: false },
  { projectId: 'b', completed: true },
]);
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(result[0].totalTasks === 2 && result[0].completedTasks === 1 && result[0].progress === 50, 'resume proyecto a');
assert(result[1].totalTasks === 1 && result[1].completedTasks === 1 && result[1].progress === 100, 'resume proyecto b');
assert(result[2].totalTasks === 0 && result[2].progress === 0, 'proyecto sin tareas');
console.log('✓ project task summary: agrupación y progreso correctos');
