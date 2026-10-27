/**
 * COMERCIAL · CASO — COM-02
 * "Lead sin contacto de mantenimiento/compras → Puede existir como base por
 *  depurar, pero no debe marcarse como visita efectiva ni recibir seguimiento
 *  comercial asignado" (MD §1).
 *
 * Reglas ejercitadas contra el comportamiento real del sistema:
 *   1. El lead SIN empresa se crea y persiste como base (nombre es el único
 *      campo obligatorio — doSaveProspect, crm-prospects.component.ts L993).
 *   2. Al intentar registrar una acción comercial ("Visita presencial" = visita
 *      efectiva), la UI BLOQUEA el guardado: saveCommercialAction exige
 *      companyName (crm-prospect-detail.component.ts L1698) y muestra en el
 *      modal ".alert-warning": 'El cliente potencial debe tener empresa para
 *      crear la accion comercial.'
 *   3. Verificación cruzada por API: GET followups del lead = vacío (no se
 *      asignó ningún seguimiento) y el lead sigue existiendo como prospecto.
 *
 * Flujo: LOGIN UI → crear lead sin empresa → ficha → Acciones comerciales →
 *   Nueva accion comercial ('Visita presencial') → Guardar → bloqueo visible →
 *   cross-check API (0 followups, lead intacto).
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin, setArtifactsDir, apiGet } from "./e2e-compr-helpers.mjs";

const CASE = "com02-lead-sin-contacto-bloqueado";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/comercial");

const uniq = String(stamp).slice(-9);
const leadName = `Lead COM02 ${uniq}`;
const leadEmail = `com02.${uniq}@qa.local`;

const result = {
    case: CASE,
    ids: ["COM-02"],
    requirement: "El lead sin contacto comercial puede existir como base por depurar, pero no se marca visita efectiva ni recibe seguimiento asignado.",
    data: { leadName, leadEmail },
    checks: {
        loginUi: false,
        leadCreatedWithoutCompany: false,
        visitActionAttemptedViaUi: false,
        uiBlockedWithExplicitMessage: false,
        noFollowupAssignedInApi: false,
        leadStillExistsAsBase: false,
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

    async function findLead() {
        const { status, payload } = await apiGet(session, `/api/v1/crm/prospects?search=${encodeURIComponent(uniq)}`);
        if (status !== 200) throw new Error(`GET prospects?search falló (${status}).`);
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
        return items.find((p) => String(p?.nombre ?? p?.name ?? "").trim() === leadName) ?? null;
    }

    // ── Paso 2: Crear el lead SIN empresa ni contacto comercial ─────────────
    await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const addBtn = page.locator("button", { hasText: /Agregar\s+Prospecto/ }).first();
    if (!(await addBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Agregar Prospecto' no es visible.");
    await addBtn.click(); await pause(page);

    const nameInput = page.locator('input[name="formNombre"]');
    if (!(await nameInput.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El formulario de prospecto no se abrió.");
    await nameInput.fill(leadName); await pause(page);
    const emailInput = page.locator('input[name="formCorreo"]');
    if (await emailInput.isVisible().catch(() => false)) { await emailInput.fill(leadEmail); await pause(page); }
    // Deliberadamente NO se completa empresa: es un lead sin contacto de compras/mantenimiento.

    const saveBtn = page.locator("[data-testid='prospect-save-btn']");
    if (!(await saveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón de guardar no es visible.");
    await saveBtn.click(); await pause(page);

    let lead = await findLead();
    for (let i = 0; !lead && i < 6; i++) { await page.waitForTimeout(500); lead = await findLead(); }
    if (!lead) throw new Error(`El lead '${leadName}' no se creó por UI.`);
    const companyEmpty = String(lead?.compania ?? lead?.company ?? "").trim() === "";
    result.checks.leadCreatedWithoutCompany = Boolean(lead) && companyEmpty;
    if (!result.checks.leadCreatedWithoutCompany) {
        throw new Error(`COM-02 violado: el lead no existe como base o traía empresa inesperada. ${JSON.stringify({ id: lead?.id, company: lead?.compania ?? lead?.company }).slice(0, 160)}`);
    }
    result.observations.push(`Lead creado sin empresa id=${lead.id} (base por depurar).`);
    await step(page, CASE, stamp, "02-lead-sin-contacto-creado");

    // ── Paso 3: Intentar marcar 'Visita presencial' desde la ficha ──────────
    const rowLink = page.locator("a", { hasText: leadName }).first();
    if (!(await rowLink.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La fila del lead '${leadName}' no es visible.`);
    await rowLink.click(); await pause(page);
    await page.waitForURL(/\/app\/crm-prospectos\//, { timeout: cfg.timeoutMs });

    const actionsTab = page.locator("button.nav-link", { hasText: "Acciones comerciales" }).first();
    if (!(await actionsTab.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("La pestaña 'Acciones comerciales' no es visible en la ficha.");
    await actionsTab.click(); await pause(page);

    const newActionBtn = page.locator("button", { hasText: /Nueva\s+accion\s+comercial/ }).first();
    if (!(await newActionBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Nueva accion comercial' no es visible.");
    await newActionBtn.click(); await pause(page);

    const actionTypeSelect = page.locator('select').filter({ hasText: "Llamada telefonica" }).last();
    if (!(await actionTypeSelect.isVisible({ timeout: 15000 }).catch(() => false))) throw new Error("El selector de tipo de acción no es visible en el modal.");
    await actionTypeSelect.selectOption({ label: "Visita presencial" }); await pause(page);

    const saveActionBtn = page.locator("[data-testid='commercial-action-save-btn']");
    if (!(await saveActionBtn.isVisible().catch(() => false))) throw new Error("El botón 'Guardar' de la acción comercial no es visible.");
    result.checks.visitActionAttemptedViaUi = true;
    await saveActionBtn.click();

    // ── Paso 4: La UI DEBE bloquear con mensaje explícito (no timeout) ──────
    const warning = page.locator(".modal .alert-warning, .modal .alert-danger").first();
    let warningText = "";
    for (let i = 0; i < 20 && !warningText; i++) {
        if ((await warning.count().catch(() => 0)) > 0 && (await warning.isVisible().catch(() => false))) {
            warningText = (await warning.innerText().catch(() => "")).trim();
        } else {
            await page.waitForTimeout(300);
        }
    }
    if (!warningText) {
        // Si el modal se cerró, la acción se guardó → violación directa.
        const fu = await followups();
        throw new Error(`COM-02 VIOLADO: 'Visita presencial' se guardó sin empresa (followups=${fu.length}). Sin mensaje de bloqueo visible.`);
    }
    result.checks.uiBlockedWithExplicitMessage = /empresa/i.test(warningText);
    if (!result.checks.uiBlockedWithExplicitMessage) {
        throw new Error(`COM-02 violado: el modal mostró un mensaje no relacionado con la falta de empresa: '${warningText}'`);
    }
    result.observations.push(`Bloqueo UI confirmado al intentar visita efectiva sin contacto comercial: "${warningText}"`);
    await step(page, CASE, stamp, "03-visita-bloqueada-sin-empresa");

    // ── Paso 5: Cross-check API — 0 seguimientos asignados, lead intacto ────
    async function followups() {
        const { status, payload } = await apiGet(session, `/api/v1/crm/prospects/${encodeURIComponent(lead.id)}/followups`);
        if (status !== 200) throw new Error(`GET followups falló (${status}).`);
        return Array.isArray(payload) ? payload : (payload?.items ?? []);
    }

    const fu = await followups();
    result.checks.noFollowupAssignedInApi = fu.length === 0;
    if (!result.checks.noFollowupAssignedInApi) {
        throw new Error(`COM-02 VIOLADO: el lead sin contacto recibió ${fu.length} seguimiento(s) comercial(es). ${JSON.stringify(fu).slice(0, 200)}`);
    }

    const stillThere = await findLead();
    result.checks.leadStillExistsAsBase = Boolean(stillThere) && String(stillThere?.estado ?? "").trim() !== "Cerrado";
    if (!result.checks.leadStillExistsAsBase) {
        throw new Error(`COM-02 violado: el lead ya no existe como base por depurar (estado='${stillThere?.estado}').`);
    }

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
