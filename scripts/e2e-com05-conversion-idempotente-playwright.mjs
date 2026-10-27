/**
 * COMERCIAL · CASO — COM-05
 * "Primera OC/aprobación escrita válida → Convertir a Cliente definitivo una
 *  sola vez, sin duplicar empresa, contactos ni historial" (MD §1).
 *
 * Reglas ejercitadas:
 *   1. La conversión por UI crea EXACTAMENTE UN cliente para la empresa y lo
 *      marca en la lista (badge "Convertido" + CTA deshabilitado).
 *   2. El backend es idempotente (service_convert.go): re-conversiones devuelven
 *      el MISMO cliente con created=false, sin duplicar filas.
 *
 * Flujo: LOGIN UI → crear prospecto por UI → dropdown "Convertir a cliente" →
 *   verificar badge + API (1 solo cliente) → CTA deshabilitado en re-intento →
 *   2 llamadas directas POST /convert-to-client → created=false, mismo ID,
 *   sin duplicados.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin, setArtifactsDir, apiGet, apiPost } from "./e2e-compr-helpers.mjs";

const CASE = "com05-conversion-idempotente";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/comercial");

const uniq = String(stamp).slice(-9);
const name = `Contacto COM05 ${uniq}`;
const email = `com05.${uniq}@qa.local`;
const company = `COM05 Industrial ${uniq}`;

const result = {
    case: CASE,
    ids: ["COM-05"],
    requirement: "Convertir a Cliente definitivo una sola vez, sin duplicar empresa, contactos ni historial.",
    data: { name, email, company },
    checks: {
        loginUi: false,
        prospectCreated: false,
        convertedViaUi: false,
        exactlyOneClientInApi: false,
        badgeShownInList: false,
        convertCtaDisabledOnRetry: false,
        backendIdempotentNoDuplicates: false,
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

    async function listClients() {
        const { status, payload } = await apiGet(session, "/api/v1/crm/clients?limit=500");
        if (status !== 200) throw new Error(`GET /crm/clients falló (${status}): ${JSON.stringify(payload).slice(0, 200)}`);
        return Array.isArray(payload) ? payload : (payload?.items ?? []);
    }

    async function clientsForCompany() {
        const all = await listClients();
        const key = company.trim().toLowerCase();
        return all.filter((c) => String(c?.empresa ?? "").trim().toLowerCase() === key || String(c?.nombre ?? "").trim().toLowerCase() === key);
    }

    // ── Paso 2: Crear prospecto por UI ──────────────────────────────────────
    await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const addBtn = page.locator("button", { hasText: /Agregar\s+Prospecto/ }).first();
    if (!(await addBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Agregar Prospecto' no es visible.");
    await addBtn.click(); await pause(page);

    const nameInput = page.locator('input[name="formNombre"]');
    if (!(await nameInput.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El formulario de prospecto no se abrió.");
    await nameInput.fill(name); await pause(page);
    const emailInput = page.locator('input[name="formCorreo"]');
    if (await emailInput.isVisible().catch(() => false)) { await emailInput.fill(email); await pause(page); }
    await page.locator('input[name="formCompania"]').fill(company); await pause(page);

    const saveBtn = page.locator("[data-testid='prospect-save-btn']");
    if (!(await saveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón de guardar prospecto no es visible.");
    await saveBtn.click(); await pause(page);

    const { status: searchStatus, payload: searchPayload } = await apiGet(session, `/api/v1/crm/prospects?search=${encodeURIComponent(uniq)}`);
    if (searchStatus !== 200) throw new Error(`GET prospects?search falló (${searchStatus}).`);
    const items = Array.isArray(searchPayload) ? searchPayload : (searchPayload?.items ?? []);
    const prospect = items.find((p) => String(p?.nombre ?? p?.name ?? "").trim() === name);
    if (!prospect) throw new Error(`El prospecto '${name}' no quedó creado tras guardarlo por UI.`);
    result.checks.prospectCreated = true;

    // Línea base: la empresa NO debe existir aún como cliente.
    const before = await clientsForCompany();
    if (before.length !== 0) throw new Error(`Precondición fallida: ya existía(n) ${before.length} cliente(s) para '${company}' antes de convertir.`);
    result.observations.push(`Línea base OK: sin clientes para '${company}' antes de la conversión.`);

    // ── Paso 3: Convertir a cliente por UI (dropdown de la fila) ────────────
    const row = page.locator("tr", { hasText: name }).first();
    if (!(await row.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La fila del prospecto '${name}' no es visible en la lista.`);

    const kebab = row.locator(".dropdown-toggle, [data-bs-toggle='dropdown']").first();
    if (!(await kebab.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El menú de acciones (kebab) no es visible en la fila.");
    await kebab.click(); await pause(page);

    const convertItem = row.locator(".dropdown-item", { hasText: /Convertir\s+a\s+cliente/ }).first();
    if (!(await convertItem.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El ítem 'Convertir a cliente' no es visible en el menú.");
    await convertItem.click();

    // Espera (badge "Convertido" O CTA deshabilitado) con margen generoso.
    let convertedUi = false;
    for (let i = 0; i < 40 && !convertedUi; i++) {
        await page.waitForTimeout(500);
        const badge = row.locator("[data-testid='prospect-converted-badge']");
        if ((await badge.count().catch(() => 0)) > 0 && (await badge.first().isVisible().catch(() => false))) { convertedUi = true; break; }
    }
    result.checks.convertedViaUi = convertedUi;
    result.checks.badgeShownInList = convertedUi;
    if (!result.checks.convertedViaUi) {
        const errAlert = page.locator(".alert-danger").first();
        const msg = (await errAlert.count().catch(() => 0)) ? (await errAlert.innerText().catch(() => "")) : "(sin alerta visible)";
        throw new Error(`La conversión por UI no quedó confirmada en la lista. ${msg}`);
    }
    await step(page, CASE, stamp, "03-prospecto-convertido");

    // ── Paso 4: API — exactamente UN cliente para la empresa ────────────────
    const after = await clientsForCompany();
    result.checks.exactlyOneClientInApi = after.length === 1;
    if (!result.checks.exactlyOneClientInApi) {
        throw new Error(`COM-05 violado: tras convertir por UI hay ${after.length} cliente(s) para '${company}' (esperado 1).`);
    }
    const client = after[0];

    // ── Paso 5: Re-intento por UI → CTA deshabilitado ───────────────────────
    // Tras la conversión el botón cambia de texto a 'Convertido' y queda [disabled]
    // (crm-prospects.component.ts L166). El toggle de Bootstrap JS es asíncrono:
    // reintentar apertura hasta ver el CTA.
    let convertItem2 = null;
    for (let attempt = 0; attempt < 6 && !convertItem2; attempt++) {
        await kebab.click().catch(() => {});
        const candidate = row.locator(".dropdown-item", { hasText: /Convertir\s+a\s+cliente|Convirtiendo|Convertido/ }).first();
        if (await candidate.isVisible({ timeout: 2500 }).catch(() => false)) convertItem2 = candidate;
    }
    if (!convertItem2) throw new Error("El menú de acciones no se reabrió para el re-intento.");
    result.checks.convertCtaDisabledOnRetry = (await convertItem2.isDisabled().catch(() => false)) || /Convertido/.test((await convertItem2.innerText().catch(() => "")));
    if (!result.checks.convertCtaDisabledOnRetry) {
        throw new Error("COM-05 violado: el CTA de conversión sigue habilitado tras la primera conversión.");
    }

    // ── Paso 6: Idempotencia en backend — 2 conversiones directas vía API ───
    const r1 = await apiPost(session, `/api/v1/crm/prospects/${encodeURIComponent(prospect.id)}/convert-to-client`);
    if (r1.status !== 200 && r1.status !== 201) {
        throw new Error(`POST convert-to-client #1 falló (${r1.status}): ${JSON.stringify(r1.payload).slice(0, 200)}`);
    }
    const r2 = await apiPost(session, `/api/v1/crm/prospects/${encodeURIComponent(prospect.id)}/convert-to-client`);
    if (r2.status !== 200 && r2.status !== 201) {
        throw new Error(`POST convert-to-client #2 falló (${r2.status}): ${JSON.stringify(r2.payload).slice(0, 200)}`);
    }

    const c1 = r1.payload?.client ?? {};
    const c2 = r2.payload?.client ?? {};
    // Nota: ambas llamadas pueden traer created=false (el cliente ya existía por la UI);
    // lo que importa es mismo ID de cliente + sin filas nuevas.
    const sameClient = Boolean(c1?.id) && String(c1.id) === String(client.id) && String(c2.id) === String(client.id);
    const noNewRows = (await clientsForCompany()).length === 1;
    result.checks.backendIdempotentNoDuplicates = sameClient && noNewRows;
    if (!sameClient || !noNewRows) {
        throw new Error(`COM-05 violado en backend: c1=${JSON.stringify(c1).slice(0, 120)} c2=${JSON.stringify(c2).slice(0, 120)} clientesAhora=${await clientsForCompany().then((x) => x.length)}.`);
    }
    result.checks.backendIdempotentNoDuplicates = true;
    result.observations.push(`Idempotencia OK: cliente único id='${client.id}', created(r1)=${r1.payload.created} created(r2)=${r2.payload.created}, sin filas duplicadas.`);
    await step(page, CASE, stamp, "04-idempotencia-confirmada");

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
