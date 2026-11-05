import { SavedCustomQuery } from "./extractions-custom.model";

const STORAGE_KEY = "pika.extractions.custom.saved";

/** Persistencia de consultas personalizadas en el navegador del usuario.
 * No toca la base de datos: cada usuario ve solo sus propias consultas. */
export function listSavedQueries(): SavedCustomQuery[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw) as SavedCustomQuery[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveQuery(query: SavedCustomQuery): SavedCustomQuery[] {
    const items = listSavedQueries().filter((item) => item.id !== query.id);
    items.unshift(query);
    persist(items);
    return items;
}

export function deleteSavedQuery(id: string): SavedCustomQuery[] {
    const items = listSavedQueries().filter((item) => item.id !== id);
    persist(items);
    return items;
}

function persist(items: SavedCustomQuery[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Almacenamiento lleno o bloqueado: la consulta simplemente no persiste.
    }
}
