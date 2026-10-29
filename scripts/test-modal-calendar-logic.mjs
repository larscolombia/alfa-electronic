/**
 * Unit tests — Calendar logic for the custom date-time picker of the reception modal
 *
 * Mirrors the pure functions in:
 *  - src/app/pages/app/crm/crm-modal-calendar.logic.ts
 *
 * Tests:
 *  - dateKeyOf (zero padding)
 *  - buildCalendarDays (42 cells, Monday-first, other-month flags, today/selected marks)
 *  - shiftMonth (month overflow in both directions, year rollover)
 *  - monthLabel (es-CO formatting)
 *  - parseIsoToParts (ISO with Z, invalid and empty -> null)
 *  - partsToIso (local parts -> UTC ISO instant)
 *
 * Run: node scripts/test-modal-calendar-logic.mjs
 */

// ─── Mirror: crm-modal-calendar.logic.ts ─────────────────────────────────────

const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function dateKeyOf(year, month, day) {
    return `${year}-${`${month + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

function buildCalendarDays(viewYear, viewMonth, selected, today) {
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const start = new Date(viewYear, viewMonth, 1 - firstWeekday);
    const days = [];
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

function shiftMonth(viewYear, viewMonth, delta) {
    const date = new Date(viewYear, viewMonth + delta, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
}

function monthLabel(viewYear, viewMonth, locale = "es-CO") {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(viewYear, viewMonth, 1));
}

function parseIsoToParts(value) {
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

function partsToIso(parts) {
    return new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute).toISOString();
}

// ─── Assertions ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, message) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) {
        passed++;
        return;
    }
    failed++;
    console.error(`FAIL: ${message}\n  expected: ${e}\n  actual:   ${a}`);
}

function assertTrue(condition, message) {
    if (condition) {
        passed++;
        return;
    }
    failed++;
    console.error(`FAIL: ${message}`);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// dateKeyOf
assertEqual(dateKeyOf(2026, 9, 5), "2026-10-05", "dateKeyOf pads month and day");
assertEqual(dateKeyOf(2026, 11, 28), "2026-12-28", "dateKeyOf December");

// buildCalendarDays
{
    const days = buildCalendarDays(2026, 9, { year: 2026, month: 9, day: 15 }, { year: 2026, month: 9, day: 28 });
    assertEqual(days.length, 42, "calendar always renders 6x7 cells");
    assertEqual(days[0].dateKey, "2026-09-28", "October 2026 starts Monday 2026-09-28 (Monday-first)");
    assertTrue(days[0].otherMonth, "leading days belong to the previous month");
    assertTrue(days.some((d) => !d.otherMonth && d.number === 1 && d.dateKey === "2026-10-01"), "contains the first of the view month");
    assertTrue(days.filter((d) => !d.otherMonth).length === 31, "October has 31 in-month days");
    assertTrue(days.some((d) => d.isToday && d.dateKey === "2026-10-28"), "today flag lands on 2026-10-28");
    assertTrue(days.some((d) => d.selected && d.dateKey === "2026-10-15"), "selected flag lands on 2026-10-15");
}

// buildCalendarDays — Monday-first invariant for every month of 2026
{
    for (let month = 0; month < 12; month++) {
        const days = buildCalendarDays(2026, month, null, { year: 2099, month: 0, day: 1 });
        const firstCell = new Date(days[0].dateKey + "T00:00:00");
        assertEqual(firstCell.getDay(), 1, `month ${month + 1}/2026 starts on a Monday cell`);
        assertTrue(days.some((d) => !d.otherMonth && d.number === 1), `month ${month + 1}/2026 includes day 1`);
    }
}

// shiftMonth
assertEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 }, "shiftMonth before January wraps year");
assertEqual(shiftMonth(2026, 11, 1), { year: 2027, month: 0 }, "shiftMonth after December wraps year");
assertEqual(shiftMonth(2026, 4, 5), { year: 2026, month: 9 }, "shiftMonth forward within year");
assertEqual(shiftMonth(2026, 4, -5), { year: 2025, month: 11 }, "shiftMonth back across year");

// monthLabel
{
    const label = monthLabel(2026, 9).toLowerCase();
    assertTrue(label.includes("octubre") && label.includes("2026"), `monthLabel is "octubre de 2026", got "${label}"`);
}

// parseIsoToParts
{
    const parts = parseIsoToParts("2026-10-26T09:30:00.000Z");
    assertTrue(parts !== null, "parses a valid ISO string");
    if (parts) {
        assertEqual([parts.year, parts.month, parts.day], [2026, 9, 26], "ISO date parts (local)");
    }
    assertEqual(parseIsoToParts(""), null, "empty string -> null");
    assertEqual(parseIsoToParts("not-a-date"), null, "invalid string -> null");
}

// partsToIso round-trip
{
    const iso = partsToIso({ year: 2026, month: 9, day: 26, hour: 9, minute: 30 });
    assertTrue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(iso), `partsToIso returns an ISO instant, got "${iso}"`);
    const back = parseIsoToParts(iso);
    assertEqual(back ? [back.year, back.month, back.day, back.hour, back.minute] : null, [2026, 9, 26, 9, 30], "partsToIso -> parseIsoToParts round-trip preserves local parts");
}

// WEEKDAY_LABELS contract used by the template
assertEqual(WEEKDAY_LABELS.length, 7, "seven weekday labels");

console.log(`\nmodal-calendar logic: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
