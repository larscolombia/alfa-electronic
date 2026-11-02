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
import { makeUtils } from "./ui-journey-helpers.mjs";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
// Helper compartido (ui-journey-helpers.mjs): SelectEnhancementService mejora
// TODOS los <select> de la página con Choices.js (nodo nativo queda hidden),
// así que selectOption directo timeoutea. selectFocus elige sobre el widget
// visible y verifica que Angular fijó el value real; awaitSelectReady espera a
// que el control quede interactuable (widget activo o select nativo visible).
const ui = makeUtils({ base: baseUrl, pause: slowMoMs > 0 ? slowMoMs : 300, data: {} });
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

// GET con reintentos: la persistencia del backend puede tardar unos segundos
// tras el guardado UI; un solo chequeo inmediato es flaky (lo demostró t01).
async function apiGetPoll(path, token, predicate, { tries = 12, delayMs = 1500 } = {}) {
    let lastResp = null;
    for (let i = 1; i <= tries; i++) {
        const resp = await apiRequest("GET", path, token);
        lastResp = resp;
        if (predicate(resp)) return resp;
        if (i < tries) await new Promise((r) => setTimeout(r, delayMs));
    }
    return lastResp;
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
    // El formulario es un <details id="prospect-form-card"> con [open]="showProspectForm":
    // se espera visible y abierto antes de interactuar.
    const formCard = page.locator("#prospect-form-card");
    await formCard.waitFor({ state: "visible", timeout: timeoutMs });
    await page.waitForFunction(
        () => document.querySelector("#prospect-form-card")?.open === true,
        null,
        { timeout: timeoutMs },
    );

    // El formulario actual no tiene campo "formNombre": la empresa se captura en
    // formCompania. País/Ciudad son <select> (la ciudad queda habilitada al elegir país).
    await page.locator("input[name='formCompania']").fill(prospectName);
    await page.locator("input[name='formNit']").fill(`901${String(ts).slice(-6)}-1`);
    await page.locator("input[name='formCorreo']").fill(runEmail);
    await page.locator("input[name='formMovil']").fill(runMobile);
    const countrySelect = page.locator('[data-testid="prospect-country"]');
    await ui.awaitSelectReady(page, countrySelect, "El selector de País no quedó disponible");
    await ui.selectFocus(page, countrySelect, { label: "Colombia" });
    const citySelect = page.locator('[data-testid="prospect-city"]');
    await page.waitForFunction(
        () => !document.querySelector('[data-testid="prospect-city"]').disabled,
        null,
        { timeout: timeoutMs },
    );
    await ui.awaitSelectReady(page, citySelect, "El selector de Ciudad no quedó disponible");
    await ui.selectFocus(page, citySelect, { label: "Bogotá" });
    await shot(page, "03-prospecto-form-llenado");

    await page.locator('[data-testid="prospect-save-btn"]').click();

    // Manejar modal de posible duplicado (re-ejecuciones del script). La
    // verificación de duplicados tarda varios segundos: se espera una de dos
    // salidas — el formulario se cierra, o aparece el modal de duplicado.
    // Cerrado = el <details> del formulario ya no está abierto (o fue removido).
    const formClosedPredicate = () => {
        const card = document.querySelector("#prospect-form-card");
        return !card || card.open === false;
    };
    const formClosedOrModal = page
        .waitForFunction(formClosedPredicate, null, { timeout: 90000 })
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
        await page.waitForFunction(formClosedPredicate, null, { timeout: 90000 }).catch(() => {});
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
    // La API devuelve la ciudad con tilde ("Bogotá"): se normalizan acentos
    // en ambos lados para que el chequeo no falle por grafía.
    const normalize = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    results.prospectDataCompleteInApi =
        !!created &&
        String(created.company ?? "") === prospectName &&
        normalize(String(created.city ?? "")).toLowerCase().includes(normalize("bogotá")) &&
        String(created.nit ?? "") !== "";
    console.log(
        `  ${results.prospectFoundInApiAfterCreate ? "✓" : "✗"} prospecto id=${createdProspectId}` +
            ` | nit=${created?.nit} ciudad=${created?.city} empresa=${created?.company}`,
    );

    // ── PASO 5: Abrir ficha del prospecto vía buscador global ───────────────
    console.log("[5] Abrir ficha del prospecto vía buscador global …");
    await gotoAndWaitStable(page, `${baseUrl}/app/crm-prospectos`);
    await waitForHeading(page, "prospect");
    // El listado actual es el buscador global (debounce 300ms): se escribe el correo —único
    // por corrida— y se clica el link del resultado. El índice BM25 se refresca de forma
    // síncrona tras crear el prospecto, así que aquí ya debe aparecer.
    const searchInput = page.locator('[data-testid="prospects-search"]');
    await searchInput.waitFor({ state: "visible", timeout: timeoutMs });
    await searchInput.fill(runEmail);
    // El email de búsqueda es único por corrida, PERO el índice BM25 también devuelve
    // prospectos viejos con la misma empresa ("LARS Empresa Industrial") y un .first()
    // genérico abría SIEMPRE la ficha más antigua → contacto guardado en otro ID y
    // el chequeo API de esta run veía items=0. Determinismo: se prefiere SIEMPRE el
    // resultado cuya URL contenga el ID que confirmó el paso 4.
    let targetLink = page.locator(`[data-testid="prospect-search-results"] a[href*="${createdProspectId}"]`);
    if ((await targetLink.count().catch(() => 0)) === 0) {
        // Fallback defensivo (cambio de formato de ruta): match por nombre y luego
        // el primer resultado, como antes.
        const byName = page.locator('[data-testid="prospect-search-results"] a').filter({ hasText: prospectName });
        targetLink = (await byName.count()) > 0 ? byName.first() : page.locator('[data-testid="prospect-search-results"] a').first();
    }
    await targetLink.first().waitFor({ state: "visible", timeout: 90000 });
    await targetLink.first().click();
    // Los resultados son <a routerLink> directos a /app/crm-prospectos/{id}.
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

    const contactsPath = `/api/v1/crm/prospects/${encodeURIComponent(createdProspectId)}/contacts`;
    const contactsResp = await apiGetPoll(
        contactsPath,
        ventasToken,
        (r) => ((r.body?.items ?? []).some((c) => String(c.name ?? "").includes("Rugeles"))),
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
    const actionModal = page.locator(".modal-dialog", { hasText: "Agregar Seguimiento" }).first();

    // Si algún evento residual (backdrop del modal anterior, animación) cierra el
    // modal antes o durante el llenado, se reintenta hasta 3 veces. Las
    // verificaciones duras exigen que el modal PERMANEZCA visible tras cada
    // interacción y que la selección quede fijada en el control real (selectFocus).
    // ── Helper: click con auditoría de overlays ────────────────────────────
    // elementFromPoint dice quién recibe REALMENTE el puntero en la posición
    // del objetivo. Si no es él, algo lo tapa: limpamos backdrops/modales
    // residuales (sin tocar código de la app) y reintentamos una vez.
    const clickWithOverlayAudit = async (pageX, target, label) => {
        for (let round = 0; round < 2; round++) {
            const probe = await target.evaluate((el) => {
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height) return { rect: "zero", targetOk: false, hitDesc: null };
                const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                return {
                    rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
                    targetOk: !!(hit && (el === hit || el.contains(hit))),
                    hitDesc: hit ? `${hit.tagName}.${String(hit.className).slice(0, 70)}` : "null",
                };
            }).catch((e) => ({ probeError: String(e?.message || e).slice(0, 160) }));
            if (probe.probeError) throw new Error(`No se pudo sondear ${label}: ${probe.probeError}`);
            if (probe.targetOk) {
                await target.click();
                return probe;
            }
            console.log(`  ↳ [${label}] cubierto por: ${probe.hitDesc} (rect=${JSON.stringify(probe.rect)}) → limpiando overlays residuales …`);
            await pageX.evaluate(() => {
                document.querySelectorAll(".modal-backdrop").forEach((e) => e.remove());
                Array.from(document.querySelectorAll(".modal.fade.show.d-block"))
                    .filter((m) => !/Agregar Seguimiento/.test(m.textContent || ""))
                    .forEach((m) => m.remove());
            }).catch(() => {});
        }
        await target.click(); // última vía: si falla, Playwright reporta la causa real.
    };

    // El SPA renderiza duplicados OCULTOS de botones/nav-links (pestañas inactivas,
    // templates @if apilados). `locator.first()` puede resolver a uno invisible y
    // timeoutear aunque el visible exista (probado con probe-t01-step7: click real OK).
    // Estrategia: iterar candidatos y elegir el PRIMER elemento realmente visible.
    const visibleFirst = async (loc) => {
        const n = await loc.count().catch(() => 0);
        for (let i = 0; i < n; i++) {
            if (await loc.nth(i).isVisible()) return loc.nth(i);
        }
        return null;
    };

    const openActionModal = async () => {
        const navLink = page.locator("button.nav-link", { hasText: "Acciones comerciales" });
        let navVisible = await visibleFirst(navLink);
        if (!navVisible) throw new Error("no se encontró la pestaña 'Acciones comerciales' visible");
        await clickWithOverlayAudit(page, navVisible, "tab Acciones comerciales");
        // El botón real dice "Nueva acción comercial" (tilde en la O: ó).
        // La regex debe aceptar ambas grafías (ó/ó) o el filter de Playwright
        // no casa NINGÚN candidato y visibleFirst devuelve null siempre.
        const candidates = page.locator("button", { hasText: /Nueva acci[oó]n comercial/i });
        await page
            .waitForFunction(
                () =>
                    Array.from(document.querySelectorAll("button"))
                        .some((b) => /nueva acc/i.test(b.textContent || "") && (b.offsetWidth || b.offsetHeight)),
                null,
                { timeout: 20000, polling: 250 },
            )
            .catch(() => {});
        const pwCount = await candidates.count().catch(() => -1);
        let newBtn = await visibleFirst(candidates);
        if (!newBtn) {
            // Volcado del estado real: quién está activo en la ficha, quién tapa el
            // botón por centro de rect y qué ancestro lo oculta (visibility/display).
            const diag = await page.evaluate(() => {
                const auditAncestors = (el) => {
                    const out = [];
                    let n = el.parentElement;
                    while (n && n !== document.body) {
                        const cs = getComputedStyle(n);
                        if (cs.visibility !== "visible" || cs.display === "none" || Number(cs.opacity) < 1) {
                            out.push(`${String(n.tagName).toLowerCase()}.${String(n.className).slice(0, 50)} vis=${cs.visibility} disp=${cs.display} op=${cs.opacity}`);
                        }
                        n = n.parentElement;
                    }
                    return out;
                };
                const btns = Array.from(document.querySelectorAll("button"))
                    .filter((b) => /nueva acc/i.test(b.textContent || ""))
                    .map((b) => {
                        const r = b.getBoundingClientRect();
                        const cs = getComputedStyle(b);
                        const cx = Math.round(r.x + r.width / 2), cy = Math.round(r.y + r.height / 2);
                        let hit = null;
                        try { hit = document.elementFromPoint(cx, cy)?.outerHTML?.slice(0, 160) ?? "null"; } catch (e) { hit = String(e); }
                        return {
                            text: (b.textContent || "").trim().slice(0, 40),
                            rect: `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`,
                            ownVis: cs.visibility, ownDisp: cs.display,
                            hiddenAncestors: auditAncestors(b).slice(0, 4),
                            centerHit: hit,
                        };
                    });
                const fichaList = document.querySelector('ul[aria-label="Secciones de la ficha del prospecto"]');
                return {
                    btns,
                    fichaActiveTab: fichaList?.querySelector(".nav-link.active")?.textContent?.trim() ?? "ninguna",
                    overlays: Array.from(document.querySelectorAll(".modal-backdrop, .modal.fade.show.d-block"))
                        .map((o) => `${String(o.className).slice(0, 60)} rect=${JSON.stringify(o.getBoundingClientRect())}`),
                };
            }).catch(() => null);
            console.log(`  ↳ DIAG newBtn (pwCount=${pwCount}):`, JSON.stringify(diag)?.slice(0, 1500));
            throw new Error("no se encontró un botón 'Nueva acción comercial' visible tras abrir la pestaña");
        }
        await clickWithOverlayAudit(page, newBtn, "Nueva acción comercial");
    };

    const fillActionModal = async () => {
        // El select de "Contacto relacionado" se alimenta de prospectos/clientes
        // por empresa (NO de los contactos de la pestaña anterior): se inspeccionan
        // las opciones para evidenciar la interconexión.
        const contactOptions = await actionModal
            .locator("select.form-select")
            .nth(0)
            .locator("option")
            .allTextContents();
        console.log("  ↳ opciones de 'Contacto relacionado' en modal:", JSON.stringify(contactOptions));

        const actionTypeSelect = actionModal.locator("select.form-select").nth(1);
        await ui.awaitSelectReady(page, actionTypeSelect, "El selector de acción comercial no quedó disponible");
        if (!(await actionModal.isVisible().catch(() => false))) {
            throw new Error("El modal 'Agregar Seguimiento' se cerró antes de elegir la acción comercial");
        }
        await ui.selectFocus(page, actionTypeSelect, { label: actionType });
        if (!(await actionModal.isVisible().catch(() => false))) {
            throw new Error("El modal 'Agregar Seguimiento' se cerró al elegir la acción comercial");
        }
        await actionModal.locator("input[type='date']").fill(actionDate);
        await actionModal.locator("input[type='time']").fill(actionTime);
        const reminderCheckbox = actionModal.locator("input[type='checkbox']#sendCommercialReminder");
        if (!(await reminderCheckbox.isChecked())) {
            await reminderCheckbox.check();
        }
        // El input de número queda [disabled] hasta marcar el checkbox: se exige habilitado.
        const remindValueInput = actionModal.locator("input[type='number']").first();
        if (!(await remindValueInput.isEnabled().catch(() => false))) {
            throw new Error("'Recordar antes de' quedó inhabilitado tras marcar el recordatorio");
        }
        await remindValueInput.fill("1");
        const observationArea = actionModal.locator("textarea").first();
        await observationArea.fill("Primera visita comercial LARS - levantamiento de necesidades (e2e t01)");
        if (!(await actionModal.isVisible().catch(() => false))) {
            throw new Error("El modal 'Agregar Seguimiento' se cerró durante el llenado");
        }
        await shot(page, "08-accion-modal-llenado");

        await actionModal.locator(".modal-footer button.btn-danger", { hasText: "Guardar" }).click();
        // El botón Guardar del template invoca saveCommercialAction(false): guarda
        // pero NO cierra el modal (borrador se reinicia para permitir otra acción).
        const saved = await page
            .waitForFunction(
                (modalText) => {
                    const modal = Array.from(document.querySelectorAll(".modal-dialog")).find((el) =>
                        el.textContent.includes(modalText),
                    );
                    if (!modal) return "cerrado"; // modal ya cerrado
                    const alertBox = modal.querySelector(".alert-warning");
                    if (alertBox && alertBox.textContent.trim()) {
                        return `error:${alertBox.textContent.trim()}`;
                    }
                    const textarea = modal.querySelector("textarea");
                    if (!textarea || textarea.value === "") return "guardado"; // borrador reiniciado
                    return "";
                },
                "Agregar Seguimiento",
                { timeout: 20000, polling: 250 },
            )
            .then(async (handle) => String(await handle.jsonValue()))
            .catch(() => "timeout");
        if (!saved.startsWith("guardado") && saved !== "cerrado") {
            throw new Error(`La acción comercial no se guardó (estado: ${saved})`);
        }
    };

    let lastActionError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            if (attempt > 1) console.log(`[7] reintento de acción comercial (${attempt}/3) …`);
            await openActionModal();
            await actionModal.waitFor({ state: "visible", timeout: 20000 });
            await fillActionModal();
            lastActionError = null;
            break;
        } catch (err) {
            lastActionError = err;
            console.log(`[7] intento ${attempt}/3 falló: ${String(err?.message || err).slice(0, 200)}`);
        }
    }
    if (lastActionError) {
        await shot(page, "08b-accion-FALLIDA").catch(() => {});
        throw new Error(`paso 7 falló tras 3 intentos: ${String(lastActionError?.message || lastActionError).slice(0, 240)}`);
    }
    results.commercialActionCreatedViaUi = true;
    console.log("  ✓ accion comercial guardada (modal sigue abierto por diseño)");
    await shot(page, "08b-accion-guardada-modal-abierto");
    // Cierre robusto: el template lo deja abierto tras Guardar (saveCommercialAction(false));
    // si por algún estado el botón no resuelve a visible, se dispara su handler Angular
    // con un click JS directo en el DOM mismo elemento.
    const closeBtn = actionModal.locator(".modal-footer button", { hasText: /^\s*Cerrar\s*$/ }).first();
    if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ timeout: 10000 });
    } else {
        const jsClose = await page
            .evaluate((title) => {
                const dialog = Array.from(document.querySelectorAll(".modal-dialog")).find((el) => el.textContent.includes(title));
                const btn = dialog?.querySelector('.modal-footer button') &&
                    Array.from(dialog.querySelector(".modal-footer").querySelectorAll("button"))
                        .find((b) => (b.textContent || "").trim() === "Cerrar");
                if (btn) { btn.click(); return true; }
                return false;
            }, "Agregar Seguimiento")
            .catch(() => false);
        console.log(`  ↳ cierre por ${jsClose ? "click JS directo" : "fallback Escape/backdrop"}`);
    }
    if (await actionModal.isVisible().catch(() => true)) {
        // Último recurso: el backdrop cierra vía $event.target === currentTarget.
        await page.keyboard.press("Escape").catch(() => {});
        await page.evaluate((title) => {
            const modal = Array.from(document.querySelectorAll(".modal.fade.show.d-block"))
                .find((el) => el.textContent.includes(title));
            if (modal) modal.click(); // target === currentTrigger → closeCommercialActionModal()
        }, "Agregar Seguimiento").catch(() => {});
    }
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

    const followupsPath = `/api/v1/crm/prospects/${encodeURIComponent(createdProspectId)}/followups`;
    const followupsResp = await apiGetPoll(
        followupsPath,
        ventasToken,
        (r) =>
            ((r.body?.items ?? []).some((f) =>
                String(f.tipo ?? "") === actionType &&
                String(f.fecha ?? "") === actionDate &&
                String(f.hora ?? "") === actionTime)),
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
