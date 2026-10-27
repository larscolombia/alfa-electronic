/**
 * FASE 1+2 · COMPR-02 — "Equipo solo requiere stock → Pasar a Reparación cuando la
 * reserva esté disponible; NO enviarlo a espera de importación" (MD §5).
 * Contraparte directa de TEC-07/COMPR-03 (pieza AUSENTE → compra externa → Pos 11):
 * aquí la pieza SÍ existe en stock, así que pedir el repuesto desde inventario debe
 * mover el equipo a Reparación (Posición 1), NUNCA a Esperando proveedor.
 *
 * Regla del sistema (project-auto-transitions.logic.ts + kanban L4948):
 *   pedir-repuestos + reserva de material (source='stock')        -> reparacion      (Pos 1)
 *   pedir-repuestos + compra externa  (source='compra-externa')   -> esperando-proveedor (Pos 11)
 * El backend lo fuerza además en materials_gate.go: con líneas de compra abiertas no se
 * puede saltar a reparacion; sin ellas y con stock disponible sí avanza.
 *
 * Escenario (UI real, desde login): tablero técnico → ficha del equipo (Pos 05) →
 * pestaña Materiales → buscar la referencia que SÍ está en stock → el sistema la muestra
 * como Disponible con su cantidad → seleccionar y "Solicitar repuesto" → reserva creada
 * → auto-transición a Reparación. Verificación cruzada por API del estado final +
 * evidencia visual: tarjeta en columna Reparación, AUSENTE de columna Pos 11.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    findReference, createReference, getProject, createProject,
    apiPost, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "compr02-stock-a-reparacion";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const refCode = `CAP-ENSTOCK-PW-${stamp}`;      // pieza que SÍ existe en stock
const projectId = `pw-compr02-${stamp}`;
const projectTitle = `PW COMPR-02 Fuente con cap disponible ${stamp % 100000}`;
const seedQty = 10;

const result = {
    case: CASE,
    ids: ["COMPR-02"],
    requirement: "Repuesto en stock → el equipo pasa a Reparación (Pos 1) al pedirlo desde inventario; NUNCA a Esperando proveedor (Pos 11).",
    data: { reference: refCode, projectId, seedQty },
    checks: {
        loginUi: false,
        referenceInStockPositive: false,      // stock > 0 verificado por API
        projectInPedirRepuestos: false,       // fixture en Pos 05 / pedir-repuestos
        inStockOptionVisible: false,          // dropdown la muestra Disponible con cantidad
        reservationRequestedViaUi: false,     // acción de negocio real (botón Solicitar repuesto)
        projectMovedToReparacion: false,      // estado final = reparacion (Pos 1)
        cardInReparacionColumn: false,        // evidencia visual en tablero
        notInEsperandoProveedor: true,        // AUSENTE de Pos 11
    },
    evidence: { stockBeforeRequest: null, finalStatus: null, reservationMessage: "" },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();

    // ── Fixture: referencia EN STOCK + proyecto en pedir-repuestos (Pos 05) ──
    // Designación única por corrida: el guard de duplicados (INV-06, similitud
    // >= 0.9) bloquea la creación si repite designación/brand de corridas previas.
    const refCreated = await createReference(session, refCode, { designation: `Condensador electrolítico 470µF 450V QA ${stamp % 100000}`, brand: "Nichicon" });
    if (refCreated.existed !== true && refCreated.status !== 200 && refCreated.status !== 201) {
        throw new Error(`No se pudo crear la referencia de stock ${refCode} (HTTP ${refCreated.status}): ${JSON.stringify(refCreated.payload).slice(0, 200)}.`);
    }
    const mov = await apiPost(session, "/api/v1/inventory/movements", { reference: refCode, quantity: seedQty, type: "entrada", reason: `Seed QA COMPR-02 (lote inicial)` });
    if (!mov || !(mov.status === 200 || mov.status === 201)) throw new Error(`El movimiento de entrada no se registró (HTTP ${mov?.status ?? '?'}) (${JSON.stringify(mov).slice(0, 160)}).`);

    const ref = await findReference(session, refCode);
    result.evidence.stockBeforeRequest = Number(ref?.currentStock ?? ref?.current_stock ?? 0);
    result.checks.referenceInStockPositive = (result.evidence.stockBeforeRequest ?? 0) > 0;
    if (!result.checks.referenceInStockPositive) throw new Error(`La referencia ${refCode} no tiene stock disponible (stock=${result.evidence.stockBeforeRequest}); el fixture de COMPR-02 exige stock>0.`);

    const proj = await createProject(session, { id: projectId, status: "pedir-repuestos", title: projectTitle });
    result.checks.projectInPedirRepuestos = (await getProject(session, projectId))?.status === "pedir-repuestos";
    if (!result.checks.projectInPedirRepuestos) throw new Error("El fixture del proyecto no quedó en pedir-repuestos (Pos 05).");

    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI (toda prueba arranca aquí) ─────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Tablero técnico → abrir la ficha del equipo (Pos 05) ─────────
    await page.goto(`${cfg.baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const columnPedir = page.locator('[data-column-id="pedir-repuestos"].cards-sortable').first();
    await columnPedir.waitFor({ state: "visible", timeout: cfg.timeoutMs });
    const card = columnPedir.locator(".project-drag-item").filter({ hasText: projectTitle }).first();
    if (!(await card.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La tarjeta del proyecto no aparece en pedir-repuestos: "${projectTitle}".`);
    await step(page, CASE, stamp, "02-tablero-equipo-en-pos-05");

    // ── Paso 3: pestaña Materiales + búsqueda de la referencia EN STOCK ──────
    await card.click(); await pause(page);
    const materialsTab = page.locator('a.nav-link', { hasText: /^Materiales$/ }).first();
    if (!(await materialsTab.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("La ficha no se abrió (pestaña 'Materiales' no visible).");
    await materialsTab.click(); await pause(page);

    const searchInput = page.locator('input[placeholder="Busca una referencia por codigo o descripcion..."]');
    if (!(await searchInput.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El buscador de repuestos no está visible en la ficha.");
    await searchInput.fill(refCode); await pause(page);

    const option = page.locator(".material-search-option", { hasText: refCode }).first();
    result.checks.inStockOptionVisible = await option.isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.checks.inStockOptionVisible) throw new Error(`La referencia en stock ${refCode} NO aparece como opción Disponible (COMPR-02 exige distinguir stock disponible de ausente).`);
    const optionText = (await option.innerText().catch(() => "")).replace(/\s+/g, " ");
    result.evidence.stockOptionText = optionText;
    await step(page, CASE, stamp, "03-referencia-disponible-en-stock");

    // ── Paso 4: seleccionar la referencia + completar técnico/motivo y pedir (UI real)
    await option.click(); await pause(page);

    // La reserva exige reference+técnico (kanban L985-993: <select> materialAssigneeOptions).
    // 'Asignado a' es un SELECT nativo, no input: leemos la primera opción válida y
    // seleccionamos por value para que la acción de negocio sea completa.
    const assignedSelect = page.locator(".project-detail-field", { hasText: "Asignado a" }).first().locator("select").first();
    if (await assignedSelect.isVisible({ timeout: 6000 }).catch(() => false)) {
        const optionValues = await assignedSelect.locator("option").evaluateAll(opts =>
            opts.map(o => ({ value: o.value, label: o.textContent })).filter(o => o.value && o.value.trim() !== ""));
        if (optionValues.length === 0) throw new Error("El select 'Asignado a' no tiene técnicos disponibles para asignar la reserva.");
        const chosen = optionValues[0].value;
        result.evidence.assignedTo = chosen;
        await assignedSelect.selectOption(chosen); await pause(page);
    }
    const qtyField = page.locator(".project-detail-field", { hasText: "Cantidad solicitada" }).first();
    if (await qtyField.isVisible({ timeout: 6000 }).catch(() => false)) {
        await qtyField.locator("input").fill("2"); await pause(page);
    }

    const requestBtn = page.locator("button", { hasText: /^\s*Solicitar repuesto\s*$/ }).first();
    if (!(await requestBtn.isEnabled({ timeout: 10000 }).catch(() => false))) throw new Error("El botón 'Solicitar repuesto' no está habilitado con la referencia en stock seleccionada.");
    await requestBtn.click(); await pause(page);

    // Feedback inmediato (UX): capturar el alert de éxito O de error para diagnóstico.
    const successAlert = page.locator(".alert.alert-success").first();
    const errorAlert = page.locator(".alert.alert-danger").first();
    result.evidence.reservationMessage = await successAlert.innerText({ timeout: 6000 }).catch(() => "");
    result.evidence.reservationError = await errorAlert.innerText({ timeout: 2500 }).catch(() => "");
    result.checks.reservationRequestedViaUi = Boolean(result.evidence.reservationMessage);
    if (!result.checks.reservationRequestedViaUi) {
        throw new Error(`La reserva por UI no se completó. error='${result.evidence.reservationError || '(sin alert visible)'}'.`);
    }
    await step(page, CASE, stamp, "04-repuesto-solicitado-stock");

    // ── Paso 5: verificación cruzada — debe estar en Reparación (Pos 1) ──────
    let projAfter = null;
    for (let i = 0; i < 6 && (!projAfter || projAfter.status !== "reparacion"); i++) {
        await page.waitForTimeout(500);
        projAfter = await getProject(session, projectId).catch(() => null);
    }
    result.evidence.finalStatus = projAfter?.status ?? null;
    result.checks.projectMovedToReparacion = projAfter?.status === "reparacion";
    if (projAfter?.status === "esperando-proveedor") throw new Error("REGRESIÓN COMPR-02: con el repuesto en STOCK el equipo pasó a Esperando proveedor; debe ir a Reparación.");

    // ── Paso 6: evidencia visual — tarjeta en columna Reparación, NO Pos 11 ─
    await page.reload({ waitUntil: "networkidle", timeout: cfg.timeoutMs });
    // Si el reload reabrio la ficha por URL (?project=...), cerrarla para poder ver el tablero.
    const cancelBtn = page.locator(".project-detail-dialog__actions button", { hasText: /^\s*Cancelar\s*$/ }).first();
    if (await cancelBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await cancelBtn.click(); await pause(page);
    }
    const columnRep = page.locator('[data-column-id="reparacion"].cards-sortable').first();
    const cardInRep = columnRep.locator(".project-drag-item").filter({ hasText: projectTitle }).first();
    result.checks.cardInReparacionColumn = await cardInRep.isVisible({ timeout: 20000 }).catch(() => false);

    const col11 = page.locator('[data-column-id="esperando-proveedor"].cards-sortable').first();
    let inCol11 = false;
    if (await col11.count().then((n) => n > 0).catch(() => false)) {
        const cardIn11 = col11.locator(".project-drag-item").filter({ hasText: projectTitle }).first();
        inCol11 = await cardIn11.isVisible({ timeout: 4000 }).catch(() => false);
    }
    result.checks.notInEsperandoProveedor = !inCol11;

    if (!result.checks.projectMovedToReparacion) throw new Error(`El equipo no pasó a Reparación (estado final '${projAfter?.status ?? "?"}').`);
    await step(page, CASE, stamp, "06-equipo-en-columna-reparacion-pos-1");

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

const outDir = path.resolve("playwright-artifacts/fase12");
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, `${stamp}-${CASE}.json`), JSON.stringify(result, null, 2));
console.log(`[${CASE}] ${result.error ? "FALLO" : "OK"} — ${JSON.stringify(result.checks)}`);
process.exit(result.error ? 1 : 0);
