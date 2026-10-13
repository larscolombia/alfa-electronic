export interface CrmZoneRecord {
    id: number;
    name: string;
}

const ZONES_STORAGE_KEY = "adminux.crm.zones";

const DEFAULT_ZONES: CrmZoneRecord[] = [
    { id: 1, name: "Bogotá" },
    { id: 2, name: "Medellín" },
    { id: 3, name: "Cali" },
    { id: 4, name: "Barranquilla" },
];

function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeZone(zone: CrmZoneRecord): CrmZoneRecord {
    return {
        id: Number(zone.id),
        name: (zone.name ?? "").trim(),
    };
}

export function getCrmZones(): CrmZoneRecord[] {
    if (!isBrowser()) {
        return [...DEFAULT_ZONES];
    }

    const rawValue = window.localStorage.getItem(ZONES_STORAGE_KEY);
    if (!rawValue) {
        return [...DEFAULT_ZONES];
    }

    try {
        const parsed = JSON.parse(rawValue) as CrmZoneRecord[];
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return [...DEFAULT_ZONES];
        }

        const normalized = parsed
            .map((zone) => normalizeZone(zone))
            .filter((zone) => Number.isFinite(zone.id) && zone.id > 0 && zone.name.length > 0);

        return normalized.length ? normalized : [...DEFAULT_ZONES];
    } catch {
        return [...DEFAULT_ZONES];
    }
}

export function saveCrmZones(zones: CrmZoneRecord[]): void {
    if (!isBrowser()) {
        return;
    }

    const normalized = zones
        .map((zone) => normalizeZone(zone))
        .filter((zone) => Number.isFinite(zone.id) && zone.id > 0 && zone.name.length > 0);

    window.localStorage.setItem(ZONES_STORAGE_KEY, JSON.stringify(normalized));
}

export function getDefaultZoneName(): string {
    return getCrmZones()[0]?.name ?? "Bogotá";
}
