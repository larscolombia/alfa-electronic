import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const baseUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiBase = process.env.PW_API_BASE_URL || baseUrl.replace(/\/$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());

const AUTH_STORAGE_KEY = "pika.auth.session";
const COMPANY_ID = "demo-company";

const RUN_ID = Date.now();
const EVENT_TITLE = `PW Calendar Event ${RUN_ID}`;
const EVENT_DESCRIPTION = `Descripcion playwright ${RUN_ID}`;
const EVENT_DATE = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
const EVENT_START = "14:00";
const EVENT_END = "15:00";

const calendarUrl = new URL("/app/calendar", baseUrl.replace(/\/$/, "") + "/");
calendarUrl.searchParams.set("apiBaseUrl", apiBase);
const fullUrl = calendarUrl.toString();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const checks = [];
const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    apiBase,
    finalUrl: "",
    httpStatus: null,
    createdEventId: "",
    checks,
    passCount: 0,
    failCount: 0,
    consoleErrors,
    pageErrors,
    screenshotPath: "",
    reportPath: "",
};

function appointmentPanel(page) {
    return page.locator(".col-12.col-md-12.col-xl-3").filter({
        has: page.locator("h6:has-text('Agendar una cita')"),
    }).first();
}

function sanitize(value) {
    return (value || "").replace(/\s+/g, " ").trim();
}

function stringifyError(error) {
    if (!error) return "unknown error";
    if (error instanceof Error) return error.stack || error.message;
    return String(error);
}

async function runCheck(key, fn) {
    const startedAt = Date.now();
    try {
        const detail = await fn();
        checks.push({ key, status: "pass", detail: sanitize(detail || "ok"), durationMs: Date.now() - startedAt });
    } catch (error) {
        checks.push({ key, status: "fail", detail: sanitize(stringifyError(error)), durationMs: Date.now() - startedAt });
    }
}

async function loginViaApi() {
    const res = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": COMPANY_ID },
        body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
    });
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Login failed (${res.status}): ${body}`);
    }
    const data = await res.json();
    return { ...data, expiresAt: Date.now() + Math.max(data.expiresIn ?? 3600, 1) * 1000 };
}

async function apiListEvents(token) {
    const res = await fetch(`${apiBase}/api/v1/calendar/events?limit=300`, {
        headers: { Authorization: `Bearer ${token}`, "X-Company-Id": COMPANY_ID },
    });
    if (!res.ok) throw new Error(`GET /calendar/events failed: ${res.status}`);
    const body = await res.json();
    return body.items ?? [];
}

async function apiGetEvent(token, eventID) {
    const res = await fetch(`${apiBase}/api/v1/calendar/events/${encodeURIComponent(eventID)}`, {
        headers: { Authorization: `Bearer ${token}`, "X-Company-Id": COMPANY_ID },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /calendar/events/${eventID} failed: ${res.status}`);
    return await res.json();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let browser;

try {
    let session;
    try {
        session = await loginViaApi();
    } catch (loginErr) {
        throw new Error(`No se pudo autenticar contra el backend (${apiBase}): ${stringifyError(loginErr)}`);
    }
    const token = session.accessToken;

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });

    await context.addInitScript(
        ({ storageKey, sessionData }) => {
            window.localStorage.setItem(storageKey, JSON.stringify(sessionData));
        },
        { storageKey: AUTH_STORAGE_KEY, sessionData: session }
    );

    const page = await context.newPage();

    page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
        pageErrors.push(err.stack || err.message || String(err));
    });

    const response = await page.goto(fullUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    result.httpStatus = response ? response.status() : null;
    result.finalUrl = page.url();

    // -- Check 1: calendar view loaded
    await runCheck("view_loaded", async () => {
        await page.waitForSelector(".fc", { timeout: timeoutMs });
        await page.waitForSelector("h5:has-text('Calendario')", { timeout: timeoutMs });
        const title = sanitize(await page.locator("h5:has-text('Calendario')").first().textContent());
        return `Vista cargada: "${title}"`;
    });

    // -- Check 2: events loaded from API
    await runCheck("initial_events_from_api", async () => {
        await page.waitForTimeout(3000);
        const apiEvents = await apiListEvents(token);
        const errorMsg = await page.locator("p.small.text-secondary:has-text('No se pudo cargar')").count();
        if (errorMsg > 0) {
            throw new Error("La vista reporta que no pudo cargar desde backend.");
        }
        return `API respondio con ${apiEvents.length} evento(s) en la BD.`;
    });

    // -- Check 3: form fields visible
    await runCheck("form_fields_visible", async () => {
        await page.waitForSelector("label:has-text('Titulo del evento')", { timeout: timeoutMs });
        await page.waitForSelector("label:has-text('Fecha')", { timeout: timeoutMs });
        await page.waitForSelector("label:has-text('Hora de inicio')", { timeout: timeoutMs });
        await page.waitForSelector("label:has-text('Hora de fin')", { timeout: timeoutMs });
        await page.waitForSelector("label:has-text('Descripcion')", { timeout: timeoutMs });
        await page.waitForSelector("#allDayEvent", { timeout: timeoutMs });
        await page.waitForSelector("button:has-text('Crear evento')", { timeout: timeoutMs });
        return "Todos los campos del formulario estan presentes y visibles";
    });

    // -- Check 4: create event via form (real POST to backend)
    await runCheck("create_event_via_form", async () => {
        const panel = appointmentPanel(page);

        // Register response listener BEFORE any interaction so we never miss the request
        const createResponsePromise = page.waitForResponse(
            (resp) => resp.url().includes("/api/v1/calendar/events") && resp.request().method() === "POST",
            { timeout: 30000 }
        );

        // Fill form fields
        await panel.locator("input[placeholder='Ejemplo: Reunion de seguimiento']").fill(EVENT_TITLE);
        await panel.locator("label:has-text('Fecha') + input[type='date']").fill(EVENT_DATE);

        const allDayCheckbox = panel.locator("#allDayEvent");
        if (await allDayCheckbox.isChecked()) {
            await allDayCheckbox.uncheck();
        }

        await panel.locator("label:has-text('Hora de inicio') + input[type='time']").fill(EVENT_START);
        await panel.locator("label:has-text('Hora de fin') + input[type='time']").fill(EVENT_END);
        await panel.locator("textarea[placeholder='Notas del evento...']").fill(EVENT_DESCRIPTION);

        // Verify title still set (date fill may blur title input)
        const titleVal = await panel.locator("input[placeholder='Ejemplo: Reunion de seguimiento']").inputValue();
        if (!titleVal.includes("PW Calendar Event")) {
            throw new Error(`Titulo perdido antes de enviar: "${titleVal}"`);
        }

        // Submit form
        await panel.locator("button:has-text('Crear evento')").click();

        // Wait for HTTP response
        const createResp = await createResponsePromise;
        if (!createResp.ok()) {
            const body = await createResp.text().catch(() => "(no body)");
            throw new Error(`POST /calendar/events respondio ${createResp.status()}: ${body}`);
        }

        // Diagnostic: confirm the page didn't navigate away
        const currentUrl = page.url();
        if (!currentUrl.includes("/app/calendar")) {
            await page.screenshot({ path: path.join(process.cwd(), "playwright-calendar-debug.png"), fullPage: true });
            throw new Error(`Pagina navego a "${currentUrl}" (esperado: /app/calendar). Screenshot guardado.`);
        }

        // Give Angular one change detection cycle
        await page.waitForTimeout(1200);

        // Accept either the success message or a cleared title input as UI evidence.
        const msgLocator = panel.locator("p.small.text-secondary.mt-2.mb-0");
        const messageText = sanitize((await msgLocator.first().textContent().catch(() => "")) || "");
        const titleAfter = await panel.locator("input[placeholder='Ejemplo: Reunion de seguimiento']").inputValue();
        const hasSuccessMessage = messageText.includes("Evento creado correctamente");
        const titleCleared = titleAfter.trim() === "";

        if (!hasSuccessMessage && !titleCleared) {
            throw new Error(`No hay evidencia UI de creacion. msg="${messageText}", titleAfter="${titleAfter}"`);
        }

        return `POST HTTP ${createResp.status()}, URL="${currentUrl}", msg="${messageText || "(sin mensaje)"}", tituloLimpio=${titleCleared}`;
    });

    // -- Check 5: event appears in recent events list (UI)
    await runCheck("event_in_recent_list", async () => {
        // Force a reload to validate rendering from backend state and avoid flaky in-memory timing.
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForSelector(".fc", { timeout: timeoutMs });

        const panel = appointmentPanel(page);
        await panel.waitFor({ state: "visible", timeout: timeoutMs });

        await panel.locator("button.list-group-item .fw-semibold", { hasText: EVENT_TITLE }).first().waitFor({ timeout: 15000 });
        const count = await panel.locator("button.list-group-item .fw-semibold", { hasText: EVENT_TITLE }).count();
        return `Evento "${EVENT_TITLE}" visible en lista de eventos recientes (${count} coincidencia(s))`;
    });

    // -- Check 6: event persisted in database (direct API verification)
    await runCheck("event_persisted_in_database", async () => {
        let foundEvent = null;
        for (let i = 0; i < 6; i++) {
            const events = await apiListEvents(token);
            foundEvent = events.find((ev) => ev.title === EVENT_TITLE);
            if (foundEvent) break;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (!foundEvent) {
            throw new Error(`Evento "${EVENT_TITLE}" NO encontrado en BD despues de 6 intentos.`);
        }

        result.createdEventId = foundEvent.id;

        const errors = [];
        if (foundEvent.allDay !== false) errors.push(`allDay deberia ser false pero BD tiene ${foundEvent.allDay}`);
        if (!foundEvent.start.startsWith(EVENT_DATE)) errors.push(`start deberia empezar con ${EVENT_DATE} pero BD tiene ${foundEvent.start}`);
        if (!foundEvent.end) errors.push("end deberia estar definido");
        if (errors.length > 0) throw new Error(`Campos incorrectos: ${errors.join("; ")}`);

        return `Evento id=${foundEvent.id} en BD: title="${foundEvent.title}", start="${foundEvent.start}", end="${foundEvent.end}", allDay=${foundEvent.allDay}`;
    });

    // -- Check 7: open event modal and verify data
    await runCheck("open_event_modal", async () => {
        const panel = appointmentPanel(page);

        // Click the event button (button.list-group-item that contains the title)
        const eventBtn = panel.locator("button.list-group-item", { hasText: EVENT_TITLE }).first();
        await eventBtn.click({ timeout: 15000 });

        // Wait for Angular *ngIf to add the modal to the DOM
        await page.waitForFunction(
            () => {
                const t = document.querySelector(".modal-title");
                return t && (t.textContent || "").includes("Detalle del evento");
            },
            { timeout: 15000 }
        );

        const heading = sanitize(await page.locator(".modal-body h6").first().textContent());
        if (!heading.includes(EVENT_TITLE)) {
            throw new Error(`Modal muestra "${heading}" pero se esperaba "${EVENT_TITLE}"`);
        }

        const deleteCount = await page.locator("button:has-text('Eliminar evento')").count();
        if (deleteCount === 0) throw new Error("Boton 'Eliminar evento' no encontrado en modal");

        return `Modal abierto: heading="${heading}", boton eliminar presente`;
    });

    // -- Check 8: delete event from modal (real DELETE to backend)
    await runCheck("delete_event_via_modal", async () => {
        const panel = appointmentPanel(page);

        // Register DELETE listener before clicking
        const deleteResponsePromise = page.waitForResponse(
            (resp) => resp.url().includes("/api/v1/calendar/events/") && resp.request().method() === "DELETE",
            { timeout: 30000 }
        ).catch(() => null); // .catch prevents unhandled rejection if browser closes

        await page.locator("button:has-text('Eliminar evento')").click({ timeout: 15000 });

        const deleteResp = await deleteResponsePromise;
        if (!deleteResp) throw new Error("No se recibio respuesta HTTP del DELETE");
        if (!deleteResp.ok()) {
            const body = await deleteResp.text().catch(() => "");
            throw new Error(`DELETE respondio ${deleteResp.status()}: ${body}`);
        }

        // Angular removes modal from DOM via *ngIf
        await page.waitForTimeout(500);

        const modalOpen = await page.locator(".modal-title").count();
        if (modalOpen > 0) throw new Error("Modal sigue abierto despues de eliminar");

        // Verify deletion message in <p> elements
        const messageText = sanitize((await panel.locator("p.small.text-secondary.mt-2.mb-0").first().textContent().catch(() => "")) || "");
        const hasDeletion = messageText.includes("Evento eliminado");
        if (!hasDeletion) {
            throw new Error(`Mensaje "Evento eliminado" no encontrado. msg="${messageText}"`);
        }

        return `DELETE HTTP ${deleteResp.status()}, modal cerrado, mensaje "Evento eliminado" confirmado`;
    });

    // -- Check 9: event deleted from database (direct API verification)
    await runCheck("event_deleted_from_database", async () => {
        if (!result.createdEventId) {
            throw new Error("No se tiene el ID del evento — check de persistencia fallo antes.");
        }

        let stillExists = true;
        for (let i = 0; i < 6; i++) {
            const found = await apiGetEvent(token, result.createdEventId);
            if (found === null) { stillExists = false; break; }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (stillExists) {
            throw new Error(`Evento id=${result.createdEventId} SIGUE en BD despues de 6 intentos. DELETE no persistio.`);
        }

        return `Evento id=${result.createdEventId} confirmado como eliminado en BD`;
    });

    // -- Check 10: event no longer in recent list
    await runCheck("event_removed_from_recent_list", async () => {
        const count = await page.locator(".list-group-item .fw-semibold", { hasText: EVENT_TITLE }).count();
        if (count > 0) {
            throw new Error(`Evento "${EVENT_TITLE}" todavia en lista de recientes (${count} coincidencia(s)) tras eliminarse.`);
        }
        return `Evento "${EVENT_TITLE}" ya no aparece en lista de eventos recientes`;
    });

    // Final screenshot
    const screenshotPath = path.join(process.cwd(), "playwright-calendar-crud-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

} catch (fatalError) {
    checks.push({ key: "fatal", status: "fail", detail: stringifyError(fatalError), durationMs: 0 });
} finally {
    if (browser) await browser.close();
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
result.passCount = checks.filter((c) => c.status === "pass").length;
result.failCount = checks.filter((c) => c.status === "fail").length;

const reportPath = path.join(process.cwd(), "playwright-calendar-crud-check.json");
await writeFile(reportPath, JSON.stringify(result, null, 2), "utf-8");
result.reportPath = reportPath;

const LINE = "─".repeat(72);
console.log(`\n${LINE}`);
console.log(` CALENDAR CRUD CHECK  |  ${result.passCount} PASS  ${result.failCount} FAIL`);
console.log(LINE);
for (const c of checks) {
    const icon = c.status === "pass" ? "✔" : "✖";
    const ms = `${c.durationMs}ms`.padStart(7);
    const key = c.key.padEnd(35);
    const detail = c.detail.length > 80 ? c.detail.slice(0, 77) + "..." : c.detail;
    console.log(` ${icon} ${key}  ${ms}  ${detail}`);
}
console.log(LINE);
if (result.failCount === 0) {
    console.log(" RESULT: PASS — CRUD completo confirmado contra base de datos");
} else {
    console.log(" RESULT: FAIL — ver detalles arriba");
}
console.log(`${LINE}\n`);

if (result.failCount > 0) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} else {
    console.log(JSON.stringify(result, null, 2));
}
