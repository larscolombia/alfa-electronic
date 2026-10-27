/**
 * COMERCIAL · CASO — COM-04
 * "Prospecto aún no aprueba reparación → Conserva estado Prospecto aunque haya
 *  enviado equipos, recibido diagnóstico o cotización" (MD §1).
 *
 * Regla ejercitada: la actividad de negocio (equipo asociado + cotización
 * creada) NO debe promover automáticamente al prospecto a Cliente ni cambiar su
 * estado comercial. La conversión solo ocurre con OC válida explícita (COM-05).
 *
 * Evidencias construidas:
 *   1. Prospecto P con empresa C creado por UI (estado inicial 'Pendiente').
 *   2. Registro de equipo asociado al prospecto (fixture API — acción de
 *      contexto permitida) → 'envió equipos'.
 *   3. Cotización creada para P POR UI REAL (Crear Cotizacion → seleccionar
 *      prospecto → agregar servicio con precio > 0 → Guardar) → 'cotización'.
 *   4. ASERCIÓN CENTRAL: tras todo lo anterior, P sigue siendo prospecto
 *      ('Pendiente', no Cerrado), NO existe ningún Cliente para la empresa C,
 *      y el CTA 'Convertir a cliente' sigue habilitado (la puerta es explícita).
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import { cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin, setArtifactsDir, apiGet, apiPost } from "./e2e-compr-helpers.mjs";

const CASE = "com04-prospecto-no-promovido";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/comercial");

const uniq = String(stamp).slice(-9);
const prospectName = `Contacto COM04 ${uniq}`;
const prospectEmail = `com04.${uniq}@qa.local`;
const companyC = `COM04 Industrial ${uniq}`;

const result = {
    case: CASE,
    ids: ["COM-04"],
    requirement: "Conserva estado Prospecto aunque haya enviado equipos, recibido diagnóstico o cotización (sin OC válida no se promueve a Cliente).",
    data: { prospectName, prospectEmail, companyC },
    checks: {
        loginUi: false,
        prospectCreatedPendiente: false,
        equipmentRecordLinked: false,
        quoteCreatedViaUi: false,
        quoteTracedInApi: false,
        stateStillProspectAfterActivity: false,
        noClientAutoCreatedForCompany: false,
        convertCtaStillEnabled: false,
    },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI (toda prueba arranca aquí) ─────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    async function findProspect() {
        const { status, payload } = await apiGet(session, `/api/v1/crm/prospects?search=${encodeURIComponent(uniq)}`);
        if (status !== 200) throw new Error(`GET prospects?search falló (${status}).`);
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
        return items.find((p) => String(p?.nombre ?? p?.name ?? "").trim() === prospectName) ?? null;
    }

    async function clientsForCompany() {
        const { status, payload } = await apiGet(session, "/api/v1/crm/clients?limit=500");
        if (status !== 200) throw new Error(`GET /crm/clients falló (${status}).`);
        const all = Array.isArray(payload) ? payload : (payload?.items ?? []);
        const key = companyC.trim().toLowerCase();
        return all.filter((c) => String(c?.empresa ?? "").trim().toLowerCase() === key || String(c?.nombre ?? "").trim().toLowerCase() === key);
    }

    // ── Paso 2: Crear prospecto con empresa por UI ──────────────────────────
    await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const addBtn = page.locator("button", { hasText: /Agregar\s+Prospecto/ }).first();
    if (!(await addBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Agregar Prospecto' no es visible.");
    await addBtn.click(); await pause(page);

    const nameInput = page.locator('input[name="formNombre"]');
    if (!(await nameInput.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El formulario de prospecto no se abrió.");
    await nameInput.fill(prospectName); await pause(page);
    const emailInput = page.locator('input[name="formCorreo"]');
    if (await emailInput.isVisible().catch(() => false)) { await emailInput.fill(prospectEmail); await pause(page); }
    await page.locator('input[name="formCompania"]').fill(companyC); await pause(page);

    const saveBtn = page.locator("[data-testid='prospect-save-btn']");
    if (!(await saveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón de guardar no es visible.");
    await saveBtn.click(); await pause(page);

    let prospect = await findProspect();
    for (let i = 0; !prospect && i < 6; i++) { await page.waitForTimeout(500); prospect = await findProspect(); }
    if (!prospect) throw new Error(`El prospecto '${prospectName}' no se creó por UI.`);
    // La API serializa el prospecto con llaves en inglés ('status'); el modelo
    // Angular lo llama 'estado'. Aceptamos ambas para robustez.
    const estadoDe = (p) => String(p?.status ?? p?.estado ?? "").trim();
    result.checks.prospectCreatedPendiente = estadoDe(prospect) === "Pendiente";
    if (!result.checks.prospectCreatedPendiente) {
        throw new Error(`Precondición fallida: estado inicial='${estadoDe(prospect)}' (esperado 'Pendiente').`);
    }
    const baselineClients = await clientsForCompany();
    if (baselineClients.length !== 0) throw new Error(`Precondición fallida: ya existía(n) ${baselineClients.length} cliente(s) para '${companyC}'.`);
    result.observations.push(`Prospecto id=${prospect.id} estado='Pendiente'; 0 clientes para la empresa (línea base).`);

    // ── Paso 3: Equipo enviado (fixture API asociado al prospecto) ──────────
    const recordId = crypto.randomUUID();
    const eqRes = await apiPost(session, "/api/v1/crm-equipment/records", {
        id: recordId,
        prospectId: prospect.id,
        prospectName,
        clientName: companyC,
        items: [],
    });
    if (eqRes.status !== 200 && eqRes.status !== 201) {
        throw new Error(`Fixture de equipo falló (${eqRes.status}): ${JSON.stringify(eqRes.payload).slice(0, 200)}`);
    }
    const listEq = await apiGet(session, `/api/v1/crm-equipment/records?prospectId=${encodeURIComponent(prospect.id)}`);
    if (listEq.status !== 200) throw new Error(`GET equipment records falló (${listEq.status}).`);
    const eqItems = Array.isArray(listEq.payload) ? listEq.payload : (listEq.payload?.items ?? []);
    result.checks.equipmentRecordLinked = eqItems.some((r) => String(r?.id).toLowerCase() === recordId.toLowerCase());
    if (!result.checks.equipmentRecordLinked) {
        throw new Error(`COM-04: el registro de equipo no quedó asociado al prospecto. ${JSON.stringify(eqItems.map((r) => r.id)).slice(0, 160)}`);
    }
    result.observations.push("Equipo asociado (fixture): 'envió equipos' sin cambiar estado.");

    // ── Paso 4: Cotización creada POR UI REAL para el prospecto ─────────────
    await page.goto(`${cfg.baseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const createQuoteBtn = page.locator("button", { hasText: /Crear\s+Cotizacion/ }).first();
    if (!(await createQuoteBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Crear Cotizacion' no es visible.");
    await createQuoteBtn.click(); await pause(page);

    // Los <select> nativos no responden a filter({hasText}) fiablemente: escaneamos
    // los selects del formulario y elegimos el que contiene la opción buscada.
    async function findSelectWithOption(optionMatcher) {
        const all = page.locator("select.form-select");
        for (let i = 0, n = await all.count().catch(() => 0); i < n; i++) {
            const sel = all.nth(i);
            if ((await sel.locator("option", { hasText: optionMatcher }).count().catch(() => 0)) > 0) return sel;
        }
        return null;
    }

    // prospectOptions se carga asíncronamente: reintentamos hasta ver la opción.
    let prospectSelect = null;
    for (let i = 0; i < 24 && !prospectSelect; i++) {
        const candidate = await findSelectWithOption(prospectName);
        if (candidate) { prospectSelect = candidate; break; }
        await page.waitForTimeout(750);
    }
    if (!prospectSelect || !(await prospectSelect.isVisible({ timeout: 5000 }).catch(() => false))) {
        throw new Error(`El selector de prospecto (con opción '${prospectName}') no es visible en el formulario de cotización.`);
    }
    await prospectSelect.selectOption(prospectName); await pause(page);

    const validUntil = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').first().fill(validUntil); await pause(page);

    // Servicio: selector que tiene la opción placeholder 'Seleccionar Servicio'.
    const serviceSelect = (await findSelectWithOption(/Seleccionar\s+Servicio/)) ?? null;
    if (!serviceSelect || !(await serviceSelect.isVisible({ timeout: 15000 }).catch(() => false))) throw new Error("El selector de servicio no es visible.");
    const options = await serviceSelect.locator("option").allInnerTexts();
    const serviceLabel = options.find((t) => t.trim() && !/Seleccionar/i.test(t));
    if (!serviceLabel) throw new Error("El catálogo de servicios está vacío: imposible cotizar por UI.");
    await serviceSelect.selectOption({ label: serviceLabel }); await pause(page);

    const addServiceBtn = page.locator("button", { hasText: /Agregar\s+servicio/ }).first();
    if (!(await addServiceBtn.isVisible().catch(() => false))) throw new Error("El botón 'Agregar servicio' no es visible.");
    await addServiceBtn.click(); await pause(page);

    const priceInput = page.locator("tbody input[type='number']").last();
    if (!(await priceInput.isVisible({ timeout: 5000 }).catch(() => false))) throw new Error("El campo 'Precio unitario' de la línea no es visible.");
    await priceInput.fill("850000"); await pause(page);

    // El template del botón incluye whitespace en textContent; anclar sin \s
    // haría fallar la regex. (Lección: ^$ estrictos vs. innerText no son lo mismo.)
    const saveQuoteBtn = page.locator('button', { hasText: /^\s*Guardar\s*$/ }).first();
    if (!(await saveQuoteBtn.isVisible().catch(() => false))) {
        // Diagnóstico in-contexto: qué botones existen realmente en este momento.
        let dump = "";
        try {
            const btns = page.locator("button");
            for (let i = 0, n = await btns.count(); i < n; i++) {
                const b = btns.nth(i);
                const t = (await b.innerText().catch(() => "")).replace(/\n/g, " ").trim();
                if (/guardar/i.test(t)) dump += `[${i}] '${t}' vis=${await b.isVisible().catch(() => false)} `;
            }
        } catch { /* sin DOM */ }
        try { await page.screenshot({ path: `playwright-artifacts/comercial/${stamp}-com04-debug-guardar.png`, fullPage: true }); } catch { /* opcional */ }
        throw new Error(`El botón 'Guardar' de la cotización no es visible. ${dump || '(sin botones Guardar en el DOM)'}`);
    }
    await saveQuoteBtn.click();

    // La lista debe volver a mostrarse con la nueva fila del prospecto.
    const quoteRow = page.locator("tr", { hasText: prospectName });
    let quoteVisibleInList = false;
    for (let i = 0; i < 24 && !quoteVisibleInList; i++) {
        if ((await quoteRow.count().catch(() => 0)) > 0) quoteVisibleInList = true;
        else await page.waitForTimeout(500);
    }
    result.checks.quoteCreatedViaUi = quoteVisibleInList;
    if (!result.checks.quoteCreatedViaUi) {
        const saveErr = (await page.locator(".alert-danger").first().innerText().catch(() => "")) || "(sin alerta)";
        throw new Error(`La cotización no apareció en la lista tras 'Guardar'. ${saveErr}`);
    }
    await step(page, CASE, stamp, "02-cotizacion-creada-por-ui");

    // ── Paso 5: Cross-check API de la cotización ────────────────────────────
    const { status: qStatus, payload: qPayload } = await apiGet(session, "/api/v1/crm-quotes/quotes?limit=200");
    if (qStatus !== 200) throw new Error(`GET /crm-quotes/quotes falló (${qStatus}).`);
    const quotes = Array.isArray(qPayload) ? qPayload : (qPayload?.items ?? []);
    const myQuote = quotes.find((q) => String(q?.prospecto ?? "").trim() === prospectName && Number(q?.total ?? 0) > 0);
    result.checks.quoteTracedInApi = Boolean(myQuote);
    if (!result.checks.quoteTracedInApi) {
        throw new Error(`COM-04: la cotización para '${prospectName}' no está en la API. ${JSON.stringify(quotes.slice(-3)).slice(0, 220)}`);
    }
    result.observations.push(`Cotización id=${myQuote.id ?? myQuote.token} total=${myQuote.total} estado='${myQuote.estado}' (sin OC).`);

    // ── Paso 6: ASERCIÓN CENTRAL — el prospecto NO se promueve sin OC válida ─
    const after = await findProspect();
    if (!after) throw new Error("COM-04 VIOLADO: tras la actividad de negocio el prospecto desapareció.");
    result.checks.stateStillProspectAfterActivity = estadoDe(after) === "Pendiente";
    if (!result.checks.stateStillProspectAfterActivity) {
        throw new Error(`COM-04 VIOLADO: con equipo+cotización el estado pasó a '${estadoDe(after)}' (se esperaba seguir 'Pendiente').`);
    }

    const clientsNow = await clientsForCompany();
    result.checks.noClientAutoCreatedForCompany = clientsNow.length === 0;
    if (!result.checks.noClientAutoCreatedForCompany) {
        throw new Error(`COM-04 VIOLADO: se crearon ${clientsNow.length} Cliente(s) automáticamente para '${companyC}' sin OC válida.`);
    }

    // El CTA de conversión debe seguir habilitado (puerta explícita intacta).
    await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const row = page.locator("tr", { hasText: prospectName }).first();
    if (!(await row.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La fila del prospecto '${prospectName}' no es visible en la lista.`);
    let convertCta = null;
    for (let attempt = 0; attempt < 6 && !convertCta; attempt++) {
        await row.locator(".dropdown-toggle").first().click().catch(() => {});
        const candidate = row.locator(".dropdown-item", { hasText: /Convertir\s+a\s+cliente/ }).first();
        if (await candidate.isVisible({ timeout: 2500 }).catch(() => false)) convertCta = candidate;
    }
    if (!convertCta) throw new Error("El menú de acciones no se abrió para verificar el CTA de conversión.");
    result.checks.convertCtaStillEnabled = !(await convertCta.isDisabled().catch(() => true)) && !/Convertido/.test(await convertCta.innerText().catch(() => ""));
    if (!result.checks.convertCtaStillEnabled) {
        throw new Error("COM-04 VIOLADO: el CTA 'Convertir a cliente' ya no está disponible (conversión automática implícita).");
    }
    await step(page, CASE, stamp, "03-estado-prospecto-conservado");

    const failed = Object.entries(result.checks).filter(([, v]) => !v);
    if (failed.length) throw new Error(`Checks no cumplidos: ${failed.map(([k]) => k).join(", ")}`);
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        const pg = browser?.contexts()?.[0]?.pages()?.find(Boolean);
        if (pg) await shot(pg, CASE, stamp, "FAIL");
    } catch { /* sin página */ }
} finally {
    if (browser) await browser.close().catch(() => {});
}

const outDir = path.resolve("playwright-artifacts/comercial");
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, `${stamp}-${CASE}.json`), JSON.stringify(result, null, 2));
console.log(`[${CASE}] ${result.error ? "FALLO" : "OK"} — ${JSON.stringify(result.checks)}`);
process.exit(result.error ? 1 : 0);
