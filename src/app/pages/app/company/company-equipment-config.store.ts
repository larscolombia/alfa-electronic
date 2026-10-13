export interface EquipmentFamilyRecord {
    id: string;
    name: string;
    description: string;
    active: boolean;
    updatedAt: string;
}

export interface EquipmentServiceTypeRecord {
    id: string;
    name: string;
    description: string;
    active: boolean;
    updatedAt: string;
}

export interface EquipmentLocationRecord {
    id: string;
    name: string;
    description: string;
    active: boolean;
    updatedAt: string;
}

export interface IndustrialEquipmentModelRecord {
    id: string;
    familyId: string;
    brand: string;
    type: string;
    series: string;
    isIndustrial: boolean;
    active: boolean;
    notes: string;
    updatedAt: string;
}

interface EquipmentCatalogState {
    families: EquipmentFamilyRecord[];
    models: IndustrialEquipmentModelRecord[];
    serviceTypes: EquipmentServiceTypeRecord[];
    locations: EquipmentLocationRecord[];
}

const STORAGE_KEY = "adminux.company.equipment.catalog.v1";

const DEFAULT_FAMILIES: EquipmentFamilyRecord[] = [
    {
        id: "family-servomotores",
        name: "Servomotores",
        description: "Equipos servo y motion control para maquinaria industrial.",
        active: true,
        updatedAt: "15/04/2026 08:20",
    },
    {
        id: "family-variadores",
        name: "Variadores de velocidad",
        description: "Drives AC/DC para control de motores.",
        active: true,
        updatedAt: "15/04/2026 08:25",
    },
    {
        id: "family-plc",
        name: "PLC",
        description: "Controladores lógicos programables y CPUs industriales.",
        active: true,
        updatedAt: "15/04/2026 08:30",
    },
];

const DEFAULT_MODELS: IndustrialEquipmentModelRecord[] = [
    {
        id: "model-yaskawa-sgm7j",
        familyId: "family-servomotores",
        brand: "Yaskawa",
        type: "Servomotor",
        series: "SGM7J",
        isIndustrial: true,
        active: true,
        notes: "Modelo frecuente en líneas de empaque y ejes de posicionamiento.",
        updatedAt: "15/04/2026 08:35",
    },
    {
        id: "model-siemens-g120",
        familyId: "family-variadores",
        brand: "Siemens",
        type: "Variador",
        series: "SINAMICS G120",
        isIndustrial: true,
        active: true,
        notes: "Variador modular para bombas, ventilación y bandas.",
        updatedAt: "15/04/2026 08:36",
    },
    {
        id: "model-allenbradley-compactlogix",
        familyId: "family-plc",
        brand: "Allen-Bradley",
        type: "PLC",
        series: "CompactLogix 5380",
        isIndustrial: true,
        active: true,
        notes: "CPU compacta para celdas de manufactura y control distribuido.",
        updatedAt: "15/04/2026 08:37",
    },
];

const DEFAULT_SERVICE_TYPES: EquipmentServiceTypeRecord[] = [
    {
        id: "service-reparacion",
        name: "Reparación",
        description: "Diagnóstico, reparación y recuperación funcional del equipo.",
        active: true,
        updatedAt: "16/04/2026 07:10",
    },
    {
        id: "service-venta",
        name: "Venta",
        description: "Suministro o reemplazo comercial del equipo o repuesto.",
        active: true,
        updatedAt: "16/04/2026 07:11",
    },
    {
        id: "service-manufactura",
        name: "Manufactura",
        description: "Fabricación o integración de solución/equipo a medida.",
        active: true,
        updatedAt: "16/04/2026 07:12",
    },
    {
        id: "service-servicio-sitio",
        name: "Servicio en sitio",
        description: "Atención técnica o intervención directamente en planta o instalación del cliente.",
        active: true,
        updatedAt: "16/04/2026 07:13",
    },
];

const DEFAULT_LOCATIONS: EquipmentLocationRecord[] = [
    {
        id: "location-interior-1",
        name: "Interior 1",
        description: "Área interior de almacenamiento 1.",
        active: true,
        updatedAt: "16/04/2026 07:20",
    },
    {
        id: "location-interior-2",
        name: "Interior 2",
        description: "Área interior de almacenamiento 2.",
        active: true,
        updatedAt: "16/04/2026 07:21",
    },
    {
        id: "location-interior-3",
        name: "Interior 3",
        description: "Área interior de almacenamiento 3.",
        active: true,
        updatedAt: "16/04/2026 07:22",
    },
    {
        id: "location-estanteria",
        name: "Estantería",
        description: "Estantería principal para equipos recibidos y accesorios.",
        active: true,
        updatedAt: "16/04/2026 07:23",
    },
];

export function getEquipmentFamilies(): EquipmentFamilyRecord[] {
    return readState().families;
}

export function saveEquipmentFamilies(families: EquipmentFamilyRecord[]): void {
    const state = readState();
    writeState({ ...state, families });
}

export function getIndustrialEquipmentModels(): IndustrialEquipmentModelRecord[] {
    return readState().models;
}

export function saveIndustrialEquipmentModels(models: IndustrialEquipmentModelRecord[]): void {
    const state = readState();
    writeState({ ...state, models });
}

export function getEquipmentServiceTypes(): EquipmentServiceTypeRecord[] {
    return readState().serviceTypes;
}

export function saveEquipmentServiceTypes(serviceTypes: EquipmentServiceTypeRecord[]): void {
    const state = readState();
    writeState({ ...state, serviceTypes });
}

export function getEquipmentLocations(): EquipmentLocationRecord[] {
    return readState().locations;
}

export function saveEquipmentLocations(locations: EquipmentLocationRecord[]): void {
    const state = readState();
    writeState({ ...state, locations });
}

export function getEquipmentFamilyName(familyId: string): string {
    return getEquipmentFamilies().find((family) => family.id === familyId)?.name ?? "Sin familia";
}

export function getIndustrialEquipmentModelById(modelId: string): IndustrialEquipmentModelRecord | undefined {
    return getIndustrialEquipmentModels().find((model) => model.id === modelId);
}

export function getEquipmentServiceTypeById(serviceTypeId: string): EquipmentServiceTypeRecord | undefined {
    return getEquipmentServiceTypes().find((serviceType) => serviceType.id === serviceTypeId);
}

export function getEquipmentServiceTypeName(serviceTypeId: string): string {
    return getEquipmentServiceTypeById(serviceTypeId)?.name ?? "Sin tipo de servicio";
}

export function getEquipmentLocationById(locationId: string): EquipmentLocationRecord | undefined {
    return getEquipmentLocations().find((location) => location.id === locationId);
}

export function getEquipmentLocationName(locationId: string): string {
    return getEquipmentLocationById(locationId)?.name ?? "Sin ubicación";
}

function readState(): EquipmentCatalogState {
    const storage = getSafeStorage();
    if (!storage) {
        return buildDefaultState();
    }

    try {
        const rawValue = storage.getItem(STORAGE_KEY);
        if (!rawValue) {
            return buildDefaultState();
        }

        const parsed = JSON.parse(rawValue) as Partial<EquipmentCatalogState>;
        return {
            families: Array.isArray(parsed.families) ? parsed.families : DEFAULT_FAMILIES,
            models: Array.isArray(parsed.models)
                ? parsed.models.map((model) => ({
                      ...(model as IndustrialEquipmentModelRecord),
                      isIndustrial: (model as { isIndustrial?: boolean }).isIndustrial !== false,
                  }))
                : DEFAULT_MODELS,
            serviceTypes: Array.isArray(parsed.serviceTypes) ? parsed.serviceTypes : DEFAULT_SERVICE_TYPES,
            locations: Array.isArray(parsed.locations) ? parsed.locations : DEFAULT_LOCATIONS,
        };
    } catch {
        return buildDefaultState();
    }
}

function writeState(state: EquipmentCatalogState): void {
    const storage = getSafeStorage();
    if (!storage) {
        return;
    }

    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Ignore storage write failures in restricted browser contexts.
    }
}

function buildDefaultState(): EquipmentCatalogState {
    return {
        families: DEFAULT_FAMILIES.map((family) => ({ ...family })),
        models: DEFAULT_MODELS.map((model) => ({ ...model })),
        serviceTypes: DEFAULT_SERVICE_TYPES.map((serviceType) => ({ ...serviceType })),
        locations: DEFAULT_LOCATIONS.map((location) => ({ ...location })),
    };
}

function getSafeStorage(): Storage | null {
    try {
        if (typeof window === "undefined") {
            return null;
        }

        return window.localStorage;
    } catch {
        return null;
    }
}