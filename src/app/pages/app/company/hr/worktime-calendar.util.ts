export type WorkDayLabel = "Lun" | "Mar" | "Mie" | "Jue" | "Vie" | "Sab" | "Dom";

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

export function loadBusinessCalendarFromStorage(): BusinessCalendarConfig {
    if (!canUseStorage()) {
        return buildBusinessCalendar(getDefaultWorkDayLabels(), []);
    }

    const schedules = parseStoredArray(window.localStorage.getItem(WORKTIME_SCHEDULES_STORAGE_KEY)) as WorkScheduleTemplate[];
    const businessDayLabels = loadBusinessDayLabelsFromStorage(schedules);
    const holidays = parseStoredArray(window.localStorage.getItem(WORKTIME_HOLIDAYS_STORAGE_KEY)) as HolidayEntry[];

    return buildBusinessCalendar(businessDayLabels, holidays);
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
