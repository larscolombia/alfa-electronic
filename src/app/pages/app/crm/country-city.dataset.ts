/** Dataset operativo base. La ciudad siempre se elige dentro del país activo. */
export const COUNTRY_CITY_DATASET: Readonly<Record<string, readonly string[]>> = {
    Colombia: ["Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga", "Cartagena", "Pereira", "Manizales", "Cúcuta", "Ibagué"],
    "El Salvador": ["San Salvador", "Santa Ana", "San Miguel", "Soyapango", "Mejicanos", "Santa Tecla"],
    México: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana"],
    Perú: ["Lima", "Arequipa", "Trujillo", "Cusco"],
    Ecuador: ["Quito", "Guayaquil", "Cuenca"],
    Panamá: ["Ciudad de Panamá", "San Miguelito", "Colón"],
};

export const COUNTRY_OPTIONS = Object.keys(COUNTRY_CITY_DATASET);

export function citiesForCountry(country: string): readonly string[] {
    return COUNTRY_CITY_DATASET[String(country ?? "").trim()] ?? [];
}
