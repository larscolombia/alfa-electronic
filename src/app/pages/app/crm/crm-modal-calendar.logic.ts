export type CalendarDay = {
    number: number;
    dateKey: string;
    otherMonth: boolean;
    isToday: boolean;
    selected: boolean;
};

export const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"] as const;

export function dateKeyOf(year: number, month: number, day: number): string {
    return `${year}-${`${month + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

export function buildCalendarDays(
    viewYear: number,
    viewMonth: number,
    selected: { year: number; month: number; day: number } | null,
    today: { year: number; month: number; day: number },
): CalendarDay[] {
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const start = new Date(viewYear, viewMonth, 1 - firstWeekday);
    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const isViewMonth = date.getMonth() === viewMonth && date.getFullYear() === viewYear;
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        days.push({
            number: day,
            dateKey: dateKeyOf(year, month, day),
            otherMonth: !isViewMonth,
            isToday: year === today.year && month === today.month && day === today.day,
            selected: !!selected && selected.year === year && selected.month === month && selected.day === day,
        });
    }
    return days;
}

export function shiftMonth(viewYear: number, viewMonth: number, delta: number): { year: number; month: number } {
    const date = new Date(viewYear, viewMonth + delta, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
}

export function monthLabel(viewYear: number, viewMonth: number, locale = "es-CO"): string {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(viewYear, viewMonth, 1));
}

export function parseIsoToParts(value: string): { year: number; month: number; day: number; hour: number; minute: number } | null {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return null;
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return null;
    return {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
    };
}

export function partsToIso(parts: { year: number; month: number; day: number; hour: number; minute: number }): string {
    return new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute).toISOString();
}
