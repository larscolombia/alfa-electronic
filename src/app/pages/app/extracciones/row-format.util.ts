/** Convierte un ISO a dd/mm/aaaa; si no es fecha válida lo devuelve tal cual.
 * Los valores solo-fecha (YYYY-MM-DD) se formatean por partes para no
 * desplazar el día según la zona horaria del navegador. */
export function formatDate(iso?: string | null): string {
    if (!iso) {
        return "";
    }

    const dateOnly = String(iso).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnly) {
        return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
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
