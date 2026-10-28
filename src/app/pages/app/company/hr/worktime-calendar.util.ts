import { resolveApiBaseUrl } from "../../../../services/api-base-url.util";

export type WorkDayLabel = "Lun" | "Mar" | "Mie" | "Jue" | "Vie" | "Sab" | "Dom";

// Fase 4: los FESTIVOS vienen del servidor (GET /api/v1/worktime/holidays,
// tabla `holidays` sembrada con la Ley 51 de Colombia). El mock que vivia en
// localStorage['lars.hr.worktime.holidays'] ya no es la fuente de datos; la
// clave solo se conserva exportada para que la UI de RRHH pueda migrar/borrar
// lo que el usuario tuviera guardado.
//
// Los HORARIOS ('lars.hr.worktime.schedules') y los DIAS HABILES
// ('lars.hr.worktime.business-days.v1') NO se migran en esta fase: siguen en
// localStorage a proposito y quedan documentados para la FASE 6
// (configuracion por empresa en el servidor).

export interface WorkScheduleTemplate {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    days: WorkDayLabel[];
}

export interface HolidayEntry {
    id: string;
    date: string;
    name: string;
    paid: boolean;
}

export interface BusinessCalendarConfig {
    workingDayNumbers: Set<number>;
    holidayDateKeys: Set<string>;
}

export const WORKTIME_SCHEDULES_STORAGE_KEY = "lars.hr.worktime.schedules";
/** @deprecated Fase 4: los festivos viven en el servidor; clave solo para migracion. */
export const WORKTIME_HOLIDAYS_STORAGE_KEY = "lars.hr.worktime.holidays";
export const WORKTIME_BUSINESS_DAYS_STORAGE_KEY = "lars.hr.worktime.business-days.v1";

const ORDERED_WORK_DAY_LABELS: WorkDayLabel[] = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const DEFAULT_WORK_DAY_LABELS: WorkDayLabel[] = ["Lun", "Mar", "Mie", "Jue", "Vie"];
const DAY_LABEL_TO_NUMBER: Record<WorkDayLabel, number> = {
    Dom: 0,
    Lun: 1,
    Mar: 2,
    Mie: 3,
    Jue: 4,
    Vie: 5,
    Sab: 6,
};

function canUseStorage(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseStoredArray(raw: string | null): unknown[] {
    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function isWorkDayLabel(value: unknown): value is WorkDayLabel {
    return typeof value === "string" && ORDERED_WORK_DAY_LABELS.includes(value as WorkDayLabel);
}

function normalizeWorkDayLabels(input: unknown): WorkDayLabel[] {
    if (!Array.isArray(input)) {
        return [];
    }

    const labels = new Set<WorkDayLabel>();
    for (const item of input) {
        if (isWorkDayLabel(item)) {
            labels.add(item);
        }
    }

    return ORDERED_WORK_DAY_LABELS.filter((label) => labels.has(label));
}

function normalizeHolidayDateKey(value: unknown): string {
    const text = String(value ?? "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getDefaultWorkDayLabels(): WorkDayLabel[] {
    return [...DEFAULT_WORK_DAY_LABELS];
}

export function loadBusinessDayLabelsFromStorage(fallbackSchedules: WorkScheduleTemplate[] = []): WorkDayLabel[] {
    if (!canUseStorage()) {
        return getDefaultWorkDayLabels();
    }

    const direct = normalizeWorkDayLabels(parseStoredArray(window.localStorage.getItem(WORKTIME_BUSINESS_DAYS_STORAGE_KEY)));
    if (direct.length) {
        return direct;
    }

    const firstScheduleDays = normalizeWorkDayLabels(fallbackSchedules[0]?.days ?? []);
    if (firstScheduleDays.length) {
        return firstScheduleDays;
    }

    return getDefaultWorkDayLabels();
}

export function persistBusinessDayLabels(labels: WorkDayLabel[]): void {
    if (!canUseStorage()) {
        return;
    }

    const normalized = normalizeWorkDayLabels(labels);
    const safeLabels = normalized.length ? normalized : getDefaultWorkDayLabels();
    window.localStorage.setItem(WORKTIME_BUSINESS_DAYS_STORAGE_KEY, JSON.stringify(safeLabels));
}

export function toWorkingDayNumbers(labels: WorkDayLabel[]): Set<number> {
    const normalized = normalizeWorkDayLabels(labels);
    const safeLabels = normalized.length ? normalized : getDefaultWorkDayLabels();
    return new Set(safeLabels.map((label) => DAY_LABEL_TO_NUMBER[label]));
}

export function toHolidayDateSet(holidays: HolidayEntry[], year?: number): Set<string> {
    const holidayKeys = new Set<string>();

    for (const holiday of holidays) {
        const dateKey = normalizeHolidayDateKey(holiday.date);
        if (!dateKey) {
            continue;
        }

        if (typeof year === "number" && !dateKey.startsWith(`${year}-`)) {
            continue;
        }

        holidayKeys.add(dateKey);
    }

    return holidayKeys;
}

export function buildBusinessCalendar(labels: WorkDayLabel[], holidays: HolidayEntry[]): BusinessCalendarConfig {
    return {
        workingDayNumbers: toWorkingDayNumbers(labels),
        holidayDateKeys: toHolidayDateSet(holidays),
    };
}

// ── Festivos desde el servidor (Fase 4) ──────────────────────────────────────
//
// Cache a nivel de modulo: los consumidores del calendario (semaforos SLA del
// kanban via project-workflow.config, RRHH) son sincronos, asi que el util
// expone la ultima carga del servidor y la refresca en segundo plano. Sin
// sesion (login) la cache queda vacia: se cuentan todos los dias como habiles,
// igual que antes cuando no habia festivos guardados.

let cachedHolidays: HolidayEntry[] = [];
let holidaysInFlight: Promise<HolidayEntry[]> | null = null;
let holidaysLoadKey: string | null = null;

export function getHolidayCache(): HolidayEntry[] {
    return cachedHolidays.map((holiday) => ({ ...holiday }));
}

/** La UI de RRHH usa esto tras editar festivos en el servidor. */
export function setHolidayCache(holidays: HolidayEntry[]): void {
    cachedHolidays = holidays.map((holiday) => ({ ...holiday }));
}

function readStoredAccessToken(): string | null {
    if (!canUseStorage()) {
        return null;
    }

    try {
        const raw = window.localStorage.getItem("pika.auth.session");
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as { accessToken?: string };
        return typeof parsed.accessToken === "string" && parsed.accessToken ? parsed.accessToken : null;
    } catch {
        return null;
    }
}

/**
 * Carga los festivos del servidor (anio anterior, actual y siguiente) con fetch
 * plano: este util no es inyectable y puede llamarse desde codigo no-Angular.
 * Devuelve la cache; nunca lanza (un fallo de red deja la cache anterior).
 */
export async function refreshHolidaysFromServer(): Promise<HolidayEntry[]> {
    if (typeof window === "undefined") {
        return cachedHolidays;
    }

    const token = readStoredAccessToken();
    if (!token) {
        return cachedHolidays;
    }

    const base = resolveApiBaseUrl();
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    try {
        const results = await Promise.all(
            years.map(async (year) => {
                const response = await fetch(`${base}/api/v1/worktime/holidays?year=${year}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`GET holidays ${year}: status ${response.status}`);
                }
                const body = (await response.json()) as { items?: Array<{ id: string; country: string; date: string; name: string; paid: boolean }> };
                return (body.items ?? []).map((item) => ({
                    id: item.id,
                    date: item.date,
                    name: item.name,
                    paid: Boolean(item.paid),
                }));
            })
        );
        cachedHolidays = results.flat();
    } catch {
        // Sin fallback silencioso de datos: se conserva la cache anterior (posible-
        // mente vacia) y los calculos de dias habiles siguen funcionando.
    }

    return cachedHolidays;
}

/** Dispara la carga en segundo plano una sola vez por sesion de pagina. */
export function ensureHolidaysLoaded(): void {
    if (typeof window === "undefined" || holidaysInFlight) {
        return;
    }

    const token = readStoredAccessToken();
    if (!token) return;
    const loadKey = `${token}:${new Date().getFullYear()}`;
    // An empty list is a valid response. Testing its length caused every
    // compact-card render to fetch again and schedule another Angular render.
    if (holidaysLoadKey === loadKey) return;
    holidaysLoadKey = loadKey;

    holidaysInFlight = refreshHolidaysFromServer().finally(() => {
        holidaysInFlight = null;
    });
}

export function loadBusinessCalendarFromStorage(): BusinessCalendarConfig {
    // Los festivos vienen del servidor (cache en memoria, refresco en segundo
    // plano). Los horarios y dias habiles siguen en localStorage: migracion
    // pendiente para la Fase 6 (configuracion por empresa).
    ensureHolidaysLoaded();

    if (!canUseStorage()) {
        return buildBusinessCalendar(getDefaultWorkDayLabels(), cachedHolidays);
    }

    const schedules = parseStoredArray(window.localStorage.getItem(WORKTIME_SCHEDULES_STORAGE_KEY)) as WorkScheduleTemplate[];
    const businessDayLabels = loadBusinessDayLabelsFromStorage(schedules);

    return buildBusinessCalendar(businessDayLabels, cachedHolidays);
}

export function computeBusinessDaysBetween(
    startDate: Date | null,
    endDate = new Date(),
    calendar: BusinessCalendarConfig = loadBusinessCalendarFromStorage()
): number {
    if (!startDate) {
        return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        return 0;
    }

    let businessDays = 0;
    const cursor = new Date(start);

    while (cursor < end) {
        cursor.setDate(cursor.getDate() + 1);
        const dayNumber = cursor.getDay();
        const dateKey = toDateKey(cursor);

        if (calendar.workingDayNumbers.has(dayNumber) && !calendar.holidayDateKeys.has(dateKey)) {
            businessDays += 1;
        }
    }

    return businessDays;
}

export function estimateBusinessDaysForYear(
    year: number,
    calendar: BusinessCalendarConfig = loadBusinessCalendarFromStorage()
): number {
    if (!Number.isFinite(year) || year < 1970 || year > 3000) {
        return 0;
    }

    let businessDays = 0;
    const cursor = new Date(year, 0, 1);

    while (cursor.getFullYear() === year) {
        const dayNumber = cursor.getDay();
        const dateKey = toDateKey(cursor);

        if (calendar.workingDayNumbers.has(dayNumber) && !calendar.holidayDateKeys.has(dateKey)) {
            businessDays += 1;
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return businessDays;
}
