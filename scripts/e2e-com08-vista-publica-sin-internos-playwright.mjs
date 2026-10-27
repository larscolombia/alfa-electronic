/**
 * COMERCIAL · CASO — COM-08
 * "Cliente pide lista de partes o explicación interna" (MD §1)
 * Regla: NO exponer costos / lista de partes salvo que se cambie explícitamente
 * el modelo comercial. Evidencia esperada: aprobación comercial y VERSIÓN PÚBLICA
 * controlada del documento.
 *
 * Diseño de la prueba (evidencia con datos reales, no vacía):
 *   1. Login por UI (obligatorio en toda prueba).
 *   2. Prospecto con empresa + cotización creadas POR UI REAL.
 *   3. "Cargar OC" desde la fila: número + fecha + archivo → el registro queda
 *      con datos internos REALES (purchaseOrderNumber, purchaseOrderFileDataUrl)
 *      y estado Aprobado. Precondición verificada por API autenticada.
 *   4. Contexto SIN SESIÓN (navegador nuevo): /estimate/<token> debe renderizar
 *      el documento comercial controlado (empresa, líneas, totales) — y su DOM
 *      no puede contener los datos internos ni las claves internas.
 *   5. Auditoría del payload crudo SIN autenticación contra
 *      GET /api/v1/crm-quotes/quotes/public/<token>: ningún campo interno
 *      (OC, equipos, IDs de BD, facturación) puede estar presente con valor.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import { cfg, apiBaseUrl, pause, shot, step, apiLogin, launchBrowser, uiLogin, setArtifactsDir, apiGet } from "./e2e-compr-helpers.mjs";

const CASE = "com08-vista-publica-sin-internos";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/comercial");

const uniq = String(stamp).slice(-9);
const prospectName = `Contacto COM08 ${uniq}`;
const companyC = `COM08 Industrial ${uniq}`;
const ocNumber = `OC-COM08-${uniq}`;

// PNG 1x1 válido (el modal acepta .pdf,.png,...) para adjuntar a la OC.
const pngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const ocFile = `/tmp/com08-oc-${uniq}.png`;

// Campos internos que NO deben salir por la ruta pública (MD COM-08).
const SENSITIVE_KEYS = [
    "purchaseOrderNumber",
    "purchaseOrderFileName",
    "purchaseOrderFileDataUrl",
    "purchaseOrderDate",
    "purchaseOrderUploadedAt",
    "selectedEquipmentIds",
    "prospectId",
    "invoiceId",
];

const result = {
    case: CASE,
    ids: ["COM-08"],
    requirement: "No exponer costos/lista de partes salvo cambio explícito del modelo comercial; la versión pública debe ser solo el documento controlado.",
    data: { prospectName, companyC, ocNumber },
    checks: {
        loginUi: false,
        quoteCreatedViaUi: false,
        recordHasRealInternalData: false,   // precondición: OC real adjuntada al registro
        publicViewRendersWithoutSession: false,
        domFreeOfInternalMarkers: false,
        publicJsonHidesInternals: false,
    },
    sensitiveAudit: {},
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

    async function findProspect() {
        const { status, payload } = await apiGet(session, `/api/v1/crm/prospects?search=${encodeURIComponent(uniq)}`);
        if (status !== 200) throw new Error(`GET prospects?search falló (${status}).`);
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
        return items.find((p) => String(p?.name ?? p?.nombre ?? "").trim() === prospectName) ?? null;
    }

    async function findQuoteForProspect() {
        const { status, payload } = await apiGet(session, "/api/v1/crm-quotes/quotes?limit=200");
        if (status !== 200) throw new Error(`GET /crm-quotes/quotes falló (${status}).`);
        const quotes = Array.isArray(payload) ? payload : (payload?.items ?? []);
        return quotes.find((q) => String(q?.prospecto ?? "").trim() === prospectName && Number(q?.total ?? 0) > 0) ?? null;
    }

    // ── Paso 2: Prospecto con empresa por UI ────────────────────────────────
    await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const addBtn = page.locator("button", { hasText: /Agregar\s+Prospecto/ }).first();
    if (!(await addBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Agregar Prospecto' no es visible.");
    await addBtn.click(); await pause(page);

    const nameInput = page.locator('input[name="formNombre"]');
    if (!(await nameInput.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El formulario de prospecto no se abrió.");
    await nameInput.fill(prospectName); await pause(page);
    const emailInput = page.locator('input[name="formCorreo"]');
    if (await emailInput.isVisible().catch(() => false)) { await emailInput.fill(`com08.${uniq}@qa.local`); await pause(page); }
    await page.locator('input[name="formCompania"]').fill(companyC); await pause(page);

    const saveBtn = page.locator("[data-testid='prospect-save-btn']");
    if (!(await saveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón de guardar no es visible.");
    await saveBtn.click(); await pause(page);

    let prospect = null;
    for (let i = 0; !prospect && i < 6; i++) { await page.waitForTimeout(500); prospect = await findProspect(); }
    if (!prospect) throw new Error(`El prospecto '${prospectName}' no se creó por UI.`);

    // ── Paso 3: Cotización creada POR UI REAL ───────────────────────────────
    await page.goto(`${cfg.baseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const createQuoteBtn = page.locator("button", { hasText: /Crear\s+Cotizacion/ }).first();
    if (!(await createQuoteBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Crear Cotizacion' no es visible.");
    await createQuoteBtn.click(); await pause(page);

    async function findSelectWithOption(optionMatcher) {
        const all = page.locator("select.form-select");
        for (let i = 0, n = await all.count().catch(() => 0); i < n; i++) {
            const sel = all.nth(i);
            if ((await sel.locator("option", { hasText: optionMatcher }).count().catch(() => 0)) > 0) return sel;
        }
        return null;
    }

    let prospectSelect = null;
    for (let i = 0; i < 24 && !prospectSelect; i++) {
        const candidate = await findSelectWithOption(prospectName);
        if (candidate) { prospectSelect = candidate; break; }
        await page.waitForTimeout(750);
    }
    if (!prospectSelect) throw new Error(`El selector de prospecto (con opción '${prospectName}') no es visible.`);
    await prospectSelect.selectOption(prospectName); await pause(page);

    const validUntil = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').first().fill(validUntil); await pause(page);

    const serviceSelect = (await findSelectWithOption(/Seleccionar\s+Servicio/)) ?? null;
    if (!serviceSelect) throw new Error("El selector de servicio no es visible.");
    const options = await serviceSelect.locator("option").allInnerTexts();
    const serviceLabel = options.find((t) => t.trim() && !/Seleccionar/i.test(t));
    if (!serviceLabel) throw new Error("El catálogo de servicios está vacío: imposible cotizar por UI.");
    await serviceSelect.selectOption({ label: serviceLabel }); await pause(page);

    const addServiceBtn = page.locator("button", { hasText: /Agregar\s+servicio/ }).first();
    if (!(await addServiceBtn.isVisible().catch(() => false))) throw new Error("El botón 'Agregar servicio' no es visible.");
    await addServiceBtn.click(); await pause(page);

    const priceInput = page.locator("tbody input[type='number']").last();
    if (!(await priceInput.isVisible({ timeout: 5000 }).catch(() => false))) throw new Error("El campo 'Precio unitario' no es visible.");
    await priceInput.fill("850000"); await pause(page);

    const saveQuoteBtn = page.locator('button', { hasText: /^\s*Guardar\s*$/ }).first();
    if (!(await saveQuoteBtn.isVisible().catch(() => false))) throw new Error("El botón 'Guardar' de la cotización no es visible.");
    await saveQuoteBtn.click();

    let quoteVisibleInList = false;
    for (let i = 0; i < 24 && !quoteVisibleInList; i++) {
        if ((await page.locator("tr", { hasText: prospectName }).count().catch(() => 0)) > 0) quoteVisibleInList = true;
        else await page.waitForTimeout(500);
    }
    result.checks.quoteCreatedViaUi = quoteVisibleInList;
    if (!quoteVisibleInList) {
        const saveErr = (await page.locator(".alert-danger").first().innerText().catch(() => "")) || "(sin alerta)";
        throw new Error(`La cotización no apareció en la lista tras 'Guardar'. ${saveErr}`);
    }
    await step(page, CASE, stamp, "01-cotizacion-creada-por-ui");

    // ── Paso 4: "Cargar OC" desde la fila → datos internos REALES ───────────
    const row = page.locator("tr", { hasText: prospectName }).first();
    const ocBtn = row.locator("button", { hasText: /Cargar\s+OC/ }).first();
    if (!(await ocBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error(`El botón 'Cargar OC' no es visible en la fila de '${prospectName}'.`);
    await ocBtn.click(); await pause(page);

    const modal = page.locator(".modal").filter({ hasText: /Cargar\s+OC/ }).first();
    if (!(await modal.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El modal 'Cargar OC' no se abrió.");
    await modal.locator('input[type="text"]').first().fill(ocNumber); await pause(page);
    await modal.locator('input[type="date"]').first().fill(new Date().toISOString().slice(0, 10)); await pause(page);

    await fs.writeFile(ocFile, Buffer.from(pngB64, "base64"));
    const fileInput = modal.locator('input[type="file"]');
    if (!(await fileInput.isVisible({ timeout: 5000 }).catch(() => false))) throw new Error("El input de archivo OC no es visible.");
    await fileInput.setInputFiles(ocFile); await pause(page);

    const saveOcBtn = modal.locator('button', { hasText: /^\s*Guardar\s*$/ }).first();
    if (!(await saveOcBtn.isVisible().catch(() => false))) throw new Error("El botón 'Guardar' del modal OC no es visible.");
    await saveOcBtn.click();

    // Precondición de auditoría: el registro debe tener datos internos reales.
    let quote = null;
    for (let i = 0; !quote && i < 16; i++) {
        const candidate = await findQuoteForProspect();
        if (candidate && String(candidate?.purchaseOrderNumber ?? "").trim() === ocNumber) quote = candidate;
        else await page.waitForTimeout(500);
    }
    result.checks.recordHasRealInternalData = Boolean(quote)
        && String(quote.purchaseOrderFileDataUrl ?? "").startsWith("data:")
        && (await findQuoteForProspect()).token.length > 0;
    if (!result.checks.recordHasRealInternalData || !quote) {
        const lastErr = (await page.locator(".alert-danger").first().innerText().catch(() => "")) || "(sin alerta visible)";
        throw new Error(`Precondición fallida: la OC '${ocNumber}' no quedó adjuntada con archivo real. ${lastErr}`);
    }
    result.observations.push(`OC real en el registro: número='${quote.purchaseOrderNumber}', fileDataUrl=${String(quote.purchaseOrderFileDataUrl).slice(0, 40)}... (token=${quote.token}).`);

    // ── Paso 5: Contexto SIN SESIÓN → /estimate/<token> ─────────────────────
    const incognito = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const anonPage = await incognito.newPage();
    try {
        const resp = await anonPage.goto(`${cfg.baseUrl}/estimate/${encodeURIComponent(quote.token)}`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
        if (!resp || !resp.ok()) throw new Error(`La vista pública no cargó sin sesión (HTTP ${resp?.status()}).`);

        // El documento comercial controlado SÍ debe renderizarse para el cliente:
        // empresa destinataria + código de cotización (COT-AAAA-NNN).
        const bodyText = await anonPage.locator("body").innerText().catch(() => "");
        result.checks.publicViewRendersWithoutSession =
            bodyText.includes(companyC) && /COT-\d{4}-\d+/.test(bodyText);

        if (!result.checks.publicViewRendersWithoutSession) {
            throw new Error(`La vista pública no muestra el documento comercial (empresa '${companyC}' o código COT ausente).`);
        }
        await anonPage.screenshot({ path: `playwright-artifacts/comercial/${stamp}-${CASE}-publica.png`, fullPage: true });

        // El DOM público no puede contener los datos internos ni las claves internas.
        const html = (await anonPage.content().catch(() => ""));
        const dataUrlProbe = String(quote.purchaseOrderFileDataUrl ?? "");
        const domLeaks = [];
        if (html.includes(ocNumber)) domLeaks.push("purchaseOrderNumber(valor)");
        if (dataUrlProbe.length > 60 && html.includes(dataUrlProbe.slice(40, 120))) domLeaks.push("purchaseOrderFileDataUrl(valor)");
        for (const key of ["selectedEquipmentIds", "purchaseOrderFileDataUrl", "prospectId", "invoiceId"]) {
            if (html.includes(key)) domLeaks.push(`clave:${key}`);
        }
        result.checks.domFreeOfInternalMarkers = domLeaks.length === 0;
        if (domLeaks.length) throw new Error(`DOM público expone internos: ${domLeaks.join(", ")}.`);
    } finally {
        await incognito.close().catch(() => {});
    }
    result.observations.push("Vista pública /estimate/<token> renderiza el documento comercial sin sesión; DOM limpio de marcadores internos.");

    // ── Paso 6: Auditoría del payload crudo SIN autenticación ───────────────
    const pubUrl = `${apiBaseUrl()}/api/v1/crm-quotes/quotes/public/${encodeURIComponent(quote.token)}`;
    const pubRes = await fetch(pubUrl); // sin cabecera Authorization a propósito
    if (!pubRes.ok) throw new Error(`GET público falló (HTTP ${pubRes.status}).`);
    const pubBody = await pubRes.json();

    for (const key of SENSITIVE_KEYS) {
        const value = pubBody[key];
        let exposed = false;
        if (typeof value === "string") exposed = value.trim().length > 0;
        else if (Array.isArray(value)) exposed = value.length > 0;
        else if (typeof value === "number") exposed = value !== 0;
        else if (value !== null && value !== undefined) exposed = true;
        result.sensitiveAudit[key] = { presente: key in pubBody, expuesto: exposed };
    }

    const violations = SENSITIVE_KEYS.filter((k) => result.sensitiveAudit[k]?.expuesto);
    result.checks.publicJsonHidesInternals = violations.length === 0;
    if (violations.length) {
        throw new Error(`COM-08 VIOLADO: el payload público sin auth expone campos internos con valor: ${violations.join(", ")}.`);
    }

    // La superficie pública debe seguir incluyendo lo comercial controlado.
    const requiredPublic = ["token", "codigo", "prospecto", "empresa", "lineas", "total"];
    const missingRequired = requiredPublic.filter((k) => !(k in pubBody));
    if (missingRequired.length) {
        throw new Error(`COM-08 REGRESIÓN: la versión pública perdió campos comerciales: ${missingRequired.join(", ")}.`);
    }
    result.observations.push("Payload público auditado: 0 campos internos expuestos; campos comerciales controlados presentes.");

    await step(page, CASE, stamp, "02-auditoria-publica-limpia");

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
console.log(`[${CASE}] ${result.error ? "FALLO" : "OK"} — ${JSON.stringify({ ...result.checks })}`);
process.exit(result.error ? 1 : 0);
