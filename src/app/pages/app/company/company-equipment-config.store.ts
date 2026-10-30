import { financeStoreFetch } from "../../../services/finance-store-fetch.util";

/**
 * Fase 6 (ítems 1-2): maestros de equipos respaldados por el servidor
 * (`/api/v1/equipment-catalog`).
 *
 * Antes este store leía la clave de localStorage
 * "adminux.company.equipment.catalog.v1" y, si no existía, devolvía los
 * DEFAULT_* hardcodeados (3 familias, 3 modelos, 4 tipos de servicio y 4
 * ubicaciones de muestra). Tres problemas: el catálogo era por navegador, se
 * perdía al limpiar caché, y como el CRUD que lo edita no tenía ruta
 * registrada nadie podía agregar un modelo. En la práctica el 100% de los
 * `equipmentModelId` guardados en recepciones reales eran uno de esos 3 demo.
 *
 * Ya no hay semilla inventada: si el servidor no tiene catálogo, los selectores
 * quedan vacíos y se carga desde Config. Equipos. Las empresas que YA tenían
 * recepciones recibieron los modelos que esas recepciones referencian vía la
 * siembra condicionada de `migrations_equipment_catalog.go`.
 *
 * Los getters siguen siendo síncronos sobre la caché (los consumen 5 módulos,
 * incluido `finance-billing.store.ts` en plena construcción del catálogo de
 * facturación); `ensureEquipmentCatalogLoaded()` puebla la caché y avisa a los
 * suscriptores. Leer un getter dispara la carga perezosamente.
 */

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

/** Respuesta de GET /equipment-catalog. */
interface EquipmentCatalogResponse {
    families?: EquipmentFamilyRecord[];
    models?: IndustrialEquipmentModelRecord[];
    serviceTypes?: EquipmentServiceTypeRecord[];
    locations?: EquipmentLocationRecord[];
}

interface EquipmentCatalogCache {
    families: EquipmentFamilyRecord[];
    models: IndustrialEquipmentModelRecord[];
    serviceTypes: EquipmentServiceTypeRecord[];
    locations: EquipmentLocationRecord[];
}

const CATALOG_PATH = "/api/v1/equipment-catalog";

let cache: EquipmentCatalogCache = { families: [], models: [], serviceTypes: [], locations: [] };
let loaded = false;
let loadPromise: Promise<void> | null = null;
let lastError: string | null = null;
const listeners = new Set<() => void>();

function notifyListeners(): void {
    listeners.forEach((listener) => listener());
}

/**
 * El backend devuelve RFC3339; las tablas del CRUD muestran el formato
 * DD/MM/YYYY HH:mm que ya tenía el store local. Se formatea acá para no tocar
 * las plantillas.
 */
function formatUpdatedAt(value: string): string {
    if (!value) {
        return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function withFormattedTimestamp<T extends { updatedAt: string }>(items: T[] | undefined): T[] {
    return (items ?? []).map((item) => ({ ...item, updatedAt: formatUpdatedAt(item.updatedAt) }));
}

async function loadCatalog(): Promise<void> {
    const response = await financeStoreFetch<EquipmentCatalogResponse>(CATALOG_PATH);
    cache = {
        families: withFormattedTimestamp(response.families),
        models: withFormattedTimestamp(response.models),
        serviceTypes: withFormattedTimestamp(response.serviceTypes),
        locations: withFormattedTimestamp(response.locations),
    };
    loaded = true;
    lastError = null;
}

/**
 * Carga el catálogo una sola vez. Es idempotente: lecturas concurrentes
 * comparten la misma promesa.
 */
export function ensureEquipmentCatalogLoaded(): Promise<void> {
    if (loaded) {
        return Promise.resolve();
    }
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = loadCatalog()
        .catch((error: unknown) => {
            lastError = error instanceof Error && error.message.trim() ? error.message : String(error);
            // Se deja loaded en false para que el próximo lector reintente; la
            // caché queda vacía en vez de rellenarse con datos inventados.
        })
        .finally(() => {
            loadPromise = null;
            notifyListeners();
        });

    return loadPromise;
}

/** Suscribe a los cambios de caché; devuelve la función de desuscripción. */
export function subscribeEquipmentCatalog(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getEquipmentCatalogError(): string | null {
    return lastError;
}

/** Fuerza una recarga (tras crear/editar desde otra pestaña, por ejemplo). */
export function refreshEquipmentCatalog(): Promise<void> {
    loaded = false;
    return ensureEquipmentCatalogLoaded();
}

// ── Lectura síncrona sobre la caché ─────────────────────────────────────────

export function getEquipmentFamilies(): EquipmentFamilyRecord[] {
    void ensureEquipmentCatalogLoaded();
    return cache.families;
}

export function getIndustrialEquipmentModels(): IndustrialEquipmentModelRecord[] {
    void ensureEquipmentCatalogLoaded();
    return cache.models;
}

export function getEquipmentServiceTypes(): EquipmentServiceTypeRecord[] {
    void ensureEquipmentCatalogLoaded();
    return cache.serviceTypes;
}

export function getEquipmentLocations(): EquipmentLocationRecord[] {
    void ensureEquipmentCatalogLoaded();
    return cache.locations;
}

export function getEquipmentFamilyName(familyId: string): string {
    return cache.families.find((family) => family.id === familyId)?.name ?? "Sin familia";
}

export function getIndustrialEquipmentModelById(modelId: string): IndustrialEquipmentModelRecord | undefined {
    return cache.models.find((model) => model.id === modelId);
}

export function getEquipmentServiceTypeById(serviceTypeId: string): EquipmentServiceTypeRecord | undefined {
    return cache.serviceTypes.find((serviceType) => serviceType.id === serviceTypeId);
}

export function getEquipmentServiceTypeName(serviceTypeId: string): string {
    return getEquipmentServiceTypeById(serviceTypeId)?.name ?? "Sin tipo de servicio";
}

export function getEquipmentLocationById(locationId: string): EquipmentLocationRecord | undefined {
    return cache.locations.find((location) => location.id === locationId);
}

export function getEquipmentLocationName(locationId: string): string {
    return getEquipmentLocationById(locationId)?.name ?? "Sin ubicación";
}

// ── Escritura: siempre contra el servidor ───────────────────────────────────

async function upsert<T>(path: string, record: T): Promise<T> {
    const saved = await financeStoreFetch<T>(`${CATALOG_PATH}${path}`, {
        method: "PUT",
        body: JSON.stringify(record),
    });
    return { ...saved, updatedAt: formatUpdatedAt((saved as { updatedAt?: string }).updatedAt ?? "") };
}

async function remove(path: string, id: string): Promise<void> {
    await financeStoreFetch<Record<string, never>>(
        `${CATALOG_PATH}${path}/${encodeURIComponent(id)}`,
        { method: "DELETE" },
    );
}

/** Reemplaza una fila en la caché por id y avisa a los suscriptores. */
function replaceInCache<K extends keyof EquipmentCatalogCache>(key: K, record: EquipmentCatalogCache[K][number]): void {
    const list = cache[key] as Array<{ id: string }>;
    const next = [record, ...list.filter((item) => item.id !== (record as { id: string }).id)];
    cache = { ...cache, [key]: next } as EquipmentCatalogCache;
    notifyListeners();
}

function removeFromCache<K extends keyof EquipmentCatalogCache>(key: K, id: string): void {
    const list = cache[key] as Array<{ id: string }>;
    cache = { ...cache, [key]: list.filter((item) => item.id !== id) } as EquipmentCatalogCache;
    notifyListeners();
}

export async function upsertEquipmentFamily(family: EquipmentFamilyRecord): Promise<EquipmentFamilyRecord> {
    const saved = await upsert<EquipmentFamilyRecord>("/families", family);
    replaceInCache("families", saved);
    return saved;
}

export async function deleteEquipmentFamily(familyId: string): Promise<void> {
    await remove("/families", familyId);
    removeFromCache("families", familyId);
}

export async function upsertIndustrialEquipmentModel(
    model: IndustrialEquipmentModelRecord,
): Promise<IndustrialEquipmentModelRecord> {
    const saved = await upsert<IndustrialEquipmentModelRecord>("/models", model);
    replaceInCache("models", saved);
    return saved;
}

export async function deleteIndustrialEquipmentModel(modelId: string): Promise<void> {
    await remove("/models", modelId);
    removeFromCache("models", modelId);
}

export async function upsertEquipmentServiceType(
    serviceType: EquipmentServiceTypeRecord,
): Promise<EquipmentServiceTypeRecord> {
    const saved = await upsert<EquipmentServiceTypeRecord>("/service-types", serviceType);
    replaceInCache("serviceTypes", saved);
    return saved;
}

export async function deleteEquipmentServiceType(serviceTypeId: string): Promise<void> {
    await remove("/service-types", serviceTypeId);
    removeFromCache("serviceTypes", serviceTypeId);
}

export async function upsertEquipmentLocation(location: EquipmentLocationRecord): Promise<EquipmentLocationRecord> {
    const saved = await upsert<EquipmentLocationRecord>("/locations", location);
    replaceInCache("locations", saved);
    return saved;
}

export async function deleteEquipmentLocation(locationId: string, reassignToLocationId: string): Promise<void> {
    const reassignTo = encodeURIComponent(reassignToLocationId.trim());
    await financeStoreFetch<Record<string, never>>(
        `${CATALOG_PATH}/locations/${encodeURIComponent(locationId)}?reassignTo=${reassignTo}`,
        { method: "DELETE" },
    );
    removeFromCache("locations", locationId);
}
