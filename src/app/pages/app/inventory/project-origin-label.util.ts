import { Project } from "../projects/models";

/**
 * Resuelve la etiqueta visible del proyecto origen de una compra.
 * Si el proyecto no esta cargado localmente, muestra el id crudo.
 */
export function projectOriginLabel(projects: Project[], projectId: string | null | undefined): string {
    const id = String(projectId ?? "").trim();
    if (!id) {
        return "--";
    }
    const found = projects.find((project) => project.id === id);
    return found?.title?.trim() || id;
}
