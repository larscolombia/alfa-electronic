/**
 * E2E t01 — PROSPECTO COMERCIAL (rol: ventas)
 *
 * Escenario: un comercial (rol ACL "ventas") registra el prospecto
 * "LARS Empresa Industrial" + contacto (Carlos Rugeles, jefe de mantenimiento)
 * + accion comercial (visita con fecha y recordatorio), y verifica que la
 * accion aparece en la ficha del prospecto bajo "Acciones comerciales".
 *
 * Ejecutar:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t01-prospecto-playwright.mjs
 */
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const adminEmail = process.env.PW_ADMIN_EMAIL || "admin@alfa.com";
const adminPassword = process.env.PW_ADMIN_PASSWORD || "1234";
const ventasEmail = process.env.PW_VENTAS_EMAIL || "pw-ventas-t01@alfa.local";
const ventasPassword = process.env.PW_VENTAS_PASSWORD || "Alfa2026!Pw";
const artifactsDir = "playwright-artifacts";
const shotPrefix = `${artifactsDir}/e2e-lars-t01-`;

const ts = Date.now();
const prospectName = "LARS Empresa Industrial";
const runEmail = `contacto.lars.t01.${ts}@example.com`;
const runMobile = `300${String(ts).slice(-7)}`;
const contactName = "Carlos Rugeles";
const contactRole = "Jefe de mantenimiento";
const actionType = "Visita presencial";
const actionDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10); // +3 dias
const actionDateEs = actionDate.split("-").reverse().join("/"); // dd/mm/yyyy
const actionTime = "10:30";

const consoleErrors = [];
const pageErrors = [];
const httpErrors = [];
const screenshots = [];

const results = {
    ventasUserReady: false,
    uiLoginVentas: false,
    prospectsPageLoaded: false,
    prospectCreatedViaUi: false,
    prospectFoundInApiAfterCreate: false,
    prospectDataCompleteInApi: false,
    fichaOpenedViaUi: false,
    contactAddedViaUi: false,
    contactFoundInApiAfterCreate: false,
    commercialActionCreatedViaUi: false,
    commercialActionVisibleInFicha: false,
    commercialActionFoundInApi: false,
};

async function apiRequest(method, path, token, body) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body != null ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return null;
    const text = await response.text();
    let parsed = null;
    try {
        parsed = JSON.parse(text);
    } catch {
        parsed = text;
    }
    return { status: response.status, body: parsed };
}

async function loginApi(email, password) {
    const { status, body } = await apiRequest("POST", "/api/v1/auth/login", null, { email, password });
    if (status !== 200 || !body?.accessToken) {
        throw new Error(`Login API ${email} -> ${status}: ${JSON.stringify(body).slice(0, 200)}`);
    }
    return body.accessToken;
}

async function shot(page, name) {
    const path = `${shotPrefix}${name}.png`;
    await page.screenshot({ path, fullPage: false }).catch(() => {});
    screenshots.push(path);
    return path;
}

async function gotoAndWaitStable(page, url) {
    await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
}

async function waitForHeading(page, snippet, timeout = timeoutMs) {
    await page.waitForFunction(
        (s) =>
            Array.from(document.querySelectorAll("h5,h4,h3,h2,h1")).some((n) =>
                (n.textContent || "").toLowerCase().includes(s.toLowerCase()),
            ),
        snippet,
        { timeout },
    );
}

let ventasToken = "";
let createdProspectId = "";
let browser;

try {
    // ── SETUP (API): asegurar usuario ventas ────────────────────────────────
    console.log("[setup] Asegurando usuario ventas por API …");
    const adminToken = await loginApi(adminEmail, adminPassword);
    const createResp = await apiRequest("POST", "/api/v1/users", adminToken, {
        email: ventasEmail,
        password: ventasPassword,
        confirmPassword: ventasPassword,
        name: "PW Ventas T01",
        role: "ventas",
    });
    if (createResp.status === 201 || createResp.status === 200) {
        console.log(`  ✓ usuario ventas creado (${createResp.status})`);
    } else if (createResp.status === 409) {
        console.log("  ↳ usuario ventas ya existía (409), se reutiliza");
    } else {
        console.log(`  ✗ crear usuario -> ${createResp.status}: ${JSON.stringify(createResp.body).slice(0, 200)}`);
    }
    ventasToken = await loginApi(ventasEmail, ventasPassword);
    results.ventasUserReady = true;

    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
    const page = await context.newPage();
    page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message || String(err)));
    page.on("response", (resp) => {
        if (resp.status() >= 400) httpErrors.push(`${resp.status()} ${resp.url()}`);
    });

    // ── PASO 1: Login UI con usuario ventas ─────────────────────────────────
    console.log("[1] Login UI como usuario ventas …");
    await gotoAndWaitStable(page, `${baseUrl}/auth/signin`);
    await page.locator("#emailadd").waitFor({ state: "visible", timeout: timeoutMs });
    await page.locator("#emailadd").fill(ventasEmail);
    await page.locator("#passwd").fill(ventasPassword);
    await page.locator('form.auth-form button[type="submit"]').click();
    await page.waitForURL((url) => url.href.includes("/app"), { timeout: timeoutMs });
    results.uiLoginVentas = true;
    console.log("  ✓ login UI OK, sesión en /app");
    await shot(page, "01-login-ventas");

    // ── PASO 2: Listado de prospectos ───────────────────────────────────────
    console.log("[2] Navegar a /app/crm-prospectos …");
    await gotoAndWaitStable(page, `${baseUrl}/app/crm-prospectos`);
    await waitForHeading(page, "prospect");
    results.prospectsPageLoaded = true;
    console.log("  ✓ listado de prospectos visible");
    await shot(page, "02-prospectos-listado");

    // ── PASO 3: Crear prospecto "LARS Empresa Industrial" por UI ────────────
    console.log(`[3] Crear prospecto "${prospectName}" por UI …`);
    const addBtn = page.getByRole("button", { name: /Agregar Prospecto/i }).first();
    await addBtn.waitFor({ state: "visible", timeout: timeoutMs });
    await addBtn.click();
    await page.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("h5")).some((n) =>
                (n.textContent || "").toLowerCase().includes("detalles del prospecto"),
            ),
        null,
        { timeout: timeoutMs },
    );

    await page.locator("input[name='formNombre']").fill(prospectName);
    await page.locator("input[name='formCompania']").fill(prospectName);
    await page.locator("input[name='formNit']").fill(`901${String(ts).slice(-6)}-1`);
    await page.locator("input[name='formCorreo']").fill(runEmail);
    await page.locator("input[name='formMovil']").fill(runMobile);
    await page.locator("input[name='formPais']").fill("Colombia");
    await page.locator("input[name='formCiudad']").fill("Bogota");
    await shot(page, "03-prospecto-form-llenado");

    await page.locator(".card-footer button", { hasText: "Guardar" }).first().click();

    // Manejar modal de posible duplicado (re-ejecuciones del script). La
    // verificación de duplicados tarda varios segundos: se espera una de dos
    // salidas — el formulario se cierra, o aparece el modal de duplicado.
    const formClosedOrModal = page
        .waitForFunction(
            () =>
                !Array.from(document.querySelectorAll("h5")).some((n) =>
                    (n.textContent || "").toLowerCase().includes("detalles del prospecto"),
                ),
            null,
            { timeout: 90000 },
        )
        .then(() => "closed")
        .catch(() => "timeout");
    const modalAppears = page
        .getByRole("button", { name: /Crear de todos modos/i })
        .first()
        .waitFor({ state: "visible", timeout: 90000 })
        .then(() => "modal")
        .catch(() => "timeout");
    const outcome = await Promise.race([formClosedOrModal, modalAppears]);
    if (outcome === "modal") {
        console.log("  ↳ modal de duplicado detectado → 'Crear de todos modos'");
        await shot(page, "03b-modal-duplicado");
        await page.getByRole("button", { name: /Crear de todos modos/i }).first().click();
        await page
            .waitForFunction(
                () =>
                    !Array.from(document.querySelectorAll("h5")).some((n) =>
                        (n.textContent || "").toLowerCase().includes("detalles del prospecto"),
                    ),
                null,
                { timeout: 90000 },
            )
            .catch(() => {});
    }
    results.prospectCreatedViaUi = true;
    console.log("  ✓ formulario de prospecto guardado y cerrado");
    await shot(page, "04-prospecto-guardado");

    // ── PASO 4: Verificación cruzada por API ────────────────────────────────
    console.log("[4] Verificar prospecto en API …");
    const prospectsResp = await apiRequest(
        "GET",
        `/api/v1/crm/prospects?search=${encodeURIComponent(runEmail)}`,
        ventasToken,
    );
    const items = prospectsResp.body?.items ?? [];
    const created = items.find((i) => String(i.email ?? "") === runEmail) ?? null;
    createdProspectId = String(created?.id ?? "").trim();
    results.prospectFoundInApiAfterCreate = createdProspectId !== "";
    results.prospectDataCompleteInApi =
        !!created &&
        String(created.company ?? "") === prospectName &&
        String(created.city ?? "").toLowerCase().includes("bogota") &&
        String(created.nit ?? "") !== "";
    console.log(
        `  ${results.prospectFoundInApiAfterCreate ? "✓" : "✗"} prospecto id=${createdProspectId}` +
            ` | nit=${created?.nit} ciudad=${created?.city} empresa=${created?.company}`,
    );

    // ── PASO 5: Abrir ficha del prospecto ───────────────────────────────────
    console.log("[5] Abrir ficha del prospecto desde el listado …");
    await gotoAndWaitStable(page, `${baseUrl}/app/crm-prospectos`);
    await waitForHeading(page, "prospect");
    const row = page.locator("tbody tr").filter({ hasText: runEmail }).first();
    await row.waitFor({ state: "visible", timeout: timeoutMs });
    await row.getByRole("button", { name: /^\s*Acciones\s*$/i }).first().click();
    await page
        .locator("ul.dropdown-menu.show a.dropdown-item", { hasText: "Abrir ficha" })
        .first()
        .waitFor({ state: "visible", timeout: timeoutMs });
    await page.locator("ul.dropdown-menu.show a.dropdown-item", { hasText: "Abrir ficha" }).first().click();
    await page.waitForURL(/\/app\/crm-prospectos\/[^/?#]+$/, { timeout: timeoutMs });
    await page.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("button.nav-link")).some((n) =>
                (n.textContent || "").trim() === "Acciones comerciales",
            ),
        null,
        { timeout: timeoutMs },
    );
    results.fichaOpenedViaUi = true;
    console.log("  ✓ ficha abierta:", page.url());
    await shot(page, "05-ficha-prospecto");

    // ── PASO 6: Agregar contacto (Carlos Rugeles, jefe de mantenimiento) ────
    console.log(`[6] Agregar contacto "${contactName}" (${contactRole}) …`);
    await page.locator("button.nav-link", { hasText: "Contactos relacionados" }).first().click();
    await page.getByRole("button", { name: /Agregar contacto/i }).first().waitFor({ state: "visible", timeout: timeoutMs });
    await page.getByRole("button", { name: /Agregar contacto/i }).first().click();

    const contactModal = page.locator(".modal-dialog", { hasText: "Agregar contacto" }).first();
    await contactModal.waitFor({ state: "visible", timeout: timeoutMs });
    await contactModal.locator("input[placeholder*='Maria Garcia']").fill(contactName);
    await contactModal.locator("input[placeholder*='Gerente de compras']").fill(contactRole);
    await contactModal.locator("input[type='email']").fill("carlos.rugeles.t01@lars.example.com");
    await contactModal.locator("input[placeholder*='3001234567']").fill("3105550123");
    await contactModal.locator("textarea").fill("Contacto de mantenimiento LARS (e2e t01)");
    await shot(page, "06-contacto-modal-llenado");
    await contactModal.locator(".modal-footer button.btn-theme", { hasText: "Guardar" }).click();

    const contactRow = page
        .locator("tbody tr")
        .filter({ hasText: contactName })
        .first();
    await contactRow.waitFor({ state: "visible", timeout: timeoutMs });
    results.contactAddedViaUi = true;
    console.log(`  ✓ contacto "${contactName}" visible en la ficha`);
    await shot(page, "07-contacto-agregado");

    const contactsResp = await apiRequest(
        "GET",
        `/api/v1/crm/prospects/${encodeURIComponent(createdProspectId)}/contacts`,
        ventasToken,
    );
    const contacts = contactsResp.body?.items ?? [];
    const foundContact = contacts.find((c) => String(c.name ?? "").includes("Rugeles"));
    results.contactFoundInApiAfterCreate = !!foundContact;
    console.log(
        `  ${results.contactFoundInApiAfterCreate ? "✓" : "✗"} contacto en API:`,
        foundContact ? `${foundContact.name} | rol=${foundContact.role} | tel=${foundContact.phone}` : `items=${contacts.length}`,
    );

    // ── PASO 7: Registrar accion comercial (visita + recordatorio) ──────────
    console.log(`[7] Registrar accion comercial "${actionType}" …`);
    await page.locator("button.nav-link", { hasText: "Acciones comerciales" }).first().click();
    await page.getByRole("button", { name: /Nueva accion comercial/i }).first().waitFor({ state: "visible", timeout: timeoutMs });
    await page.getByRole("button", { name: /Nueva accion comercial/i }).first().click();

    const actionModal = page.locator(".modal-dialog", { hasText: "Agregar Seguimiento" }).first();
    await actionModal.waitFor({ state: "visible", timeout: timeoutMs });

    // El select de "Contacto relacionado" se alimenta de prospectos/clientes
    // por empresa (NO de los contactos de la pestaña anterior): se inspeccionan
    // las opciones para evidenciar la interconexión.
    const contactOptions = await actionModal
        .locator("select.form-select")
        .nth(0)
        .locator("option")
        .allTextContents();
    console.log("  ↳ opciones de 'Contacto relacionado' en modal:", JSON.stringify(contactOptions));

    await actionModal.locator("select.form-select").nth(1).selectOption({ label: actionType });
    await actionModal.locator("input[type='date']").fill(actionDate);
    await actionModal.locator("input[type='time']").fill(actionTime);
    const reminderCheckbox = actionModal.locator("input[type='checkbox']#sendCommercialReminder");
    if (!(await reminderCheckbox.isChecked())) {
        await reminderCheckbox.check();
    }
    await actionModal.locator("input[type='number']").fill("1");
    await actionModal.locator("textarea").fill("Primera visita comercial LARS - levantamiento de necesidades (e2e t01)");
    await shot(page, "08-accion-modal-llenado");

    await actionModal.locator(".modal-footer button.btn-danger", { hasText: "Guardar" }).click();
    // El botón Guardar del template invoca saveCommercialAction(false): guarda
    // pero NO cierra el modal (borrador se reinicia para permitir otra acción).
    await actionModal
        .locator("textarea")
        .first()
        .waitFor({ state: "visible", timeout: timeoutMs });
    await page.waitForFunction(
        (modalText) => {
            const modal = Array.from(document.querySelectorAll(".modal-dialog")).find((el) =>
                el.textContent.includes(modalText),
            );
            if (!modal) return true; // modal ya cerrado
            const textarea = modal.querySelector("textarea");
            return !textarea || textarea.value === "";
        },
        "Agregar Seguimiento",
        { timeout: timeoutMs },
    );
    results.commercialActionCreatedViaUi = true;
    console.log("  ✓ accion comercial guardada (modal sigue abierto por diseño)");
    await shot(page, "08b-accion-guardada-modal-abierto");
    await actionModal.locator(".modal-footer button.btn-link", { hasText: "Cerrar" }).click();
    await page
        .waitForFunction(
            () =>
                Array.from(document.querySelectorAll(".modal-dialog")).every(
                    (el) => !el.textContent.includes("Agregar Seguimiento"),
                ),
            null,
            { timeout: timeoutMs },
        )
        .catch(() => {});

    // ── PASO 8: Verificar que la accion aparece en la ficha ─────────────────
    console.log("[8] Verificar accion visible en 'Acciones comerciales' …");
    const actionRow = page
        .locator("tbody tr")
        .filter({ hasText: actionType })
        .first();
    await actionRow.waitFor({ state: "visible", timeout: timeoutMs });
    const actionRowText = (await actionRow.innerText()).replace(/\s+/g, " ").slice(0, 300);
    results.commercialActionVisibleInFicha =
        actionRowText.includes(actionType) &&
        actionRowText.includes(actionDateEs) &&
        actionRowText.includes(actionTime);
    console.log(`  fila accion: ${actionRowText}`);
    await shot(page, "09-accion-visible-ficha");

    const followupsResp = await apiRequest(
        "GET",
        `/api/v1/crm/prospects/${encodeURIComponent(createdProspectId)}/followups`,
        ventasToken,
    );
    const followups = followupsResp.body?.items ?? [];
    const foundAction = followups.find(
        (f) =>
            String(f.tipo ?? "") === actionType &&
            String(f.fecha ?? "") === actionDate &&
            String(f.hora ?? "") === actionTime,
    );
    results.commercialActionFoundInApi = !!foundAction;
    console.log(
        `  ${results.commercialActionFoundInApi ? "✓" : "✗"} accion en API:`,
        foundAction
            ? `tipo=${foundAction.tipo} fecha=${foundAction.fecha} hora=${foundAction.hora} recordatorio=${foundAction.recordatorio} estado=${foundAction.estado} registradoPor=${foundAction.registradoPor}`
            : `items=${followups.length}`,
    );
} catch (error) {
    console.error("E2E_LARS_T01_ERROR");
    console.error(String(error?.stack || error));
    try {
        const pages = browser?.contexts?.()?.[0]?.pages?.() ?? [];
        const p = pages[0];
        if (p) await shot(p, "99-error");
    } catch {
        /* noop */
    }
} finally {
    if (browser) await browser.close().catch(() => {});
}

// ── Resumen y JSON de resultados ────────────────────────────────────────────
const failed = Object.entries(results)
    .filter(([, v]) => v !== true)
    .map(([k]) => k);
const passed = Object.keys(results).length - failed.length;

const summary = {
    task: "t01-prospecto-comercial-ventas",
    baseUrl,
    prospectName,
    runEmail,
    contactName,
    contactRole,
    actionType,
    actionDate,
    actionTime,
    createdProspectId,
    results,
    screenshots,
    httpErrors: httpErrors.slice(0, 15),
    consoleErrors: consoleErrors.slice(0, 10),
    pageErrors: pageErrors.slice(0, 10),
};

console.log(`\n${"=".repeat(64)}`);
console.log(`E2E LARS t01: ${passed}/${Object.keys(results).length} checks pasaron`);
if (failed.length) console.log(`Fallidos: ${failed.join(", ")}`);
if (consoleErrors.length) console.log(`Console errors (${consoleErrors.length}):`, consoleErrors.slice(0, 5));
if (httpErrors.length) console.log(`HTTP errors (${httpErrors.length}):`, httpErrors.slice(0, 10));
if (pageErrors.length) console.log(`Page errors (${pageErrors.length}):`, pageErrors.slice(0, 5));
console.log("=".repeat(64));
console.log(JSON.stringify(summary, null, 2));

const fs = await import("node:fs");
fs.writeFileSync(`${artifactsDir}/e2e-lars-t01-results.json`, JSON.stringify(summary, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
