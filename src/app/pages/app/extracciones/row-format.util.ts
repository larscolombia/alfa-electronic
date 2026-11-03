/** Convierte un ISO a dd/mm/aaaa; si no es fecha válida lo devuelve tal cual. */
export function formatDate(iso?: string | null): string {
    if (!iso) {
        return "";
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return String(iso);
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
}

/** Sí / No legible para columnas de bandera en reportes. */
export function yesNo(flag?: boolean | null): string {
    if (flag === true) {
        return "Sí";
    }
    if (flag === false) {
        return "No";
    }
    return "";
}
