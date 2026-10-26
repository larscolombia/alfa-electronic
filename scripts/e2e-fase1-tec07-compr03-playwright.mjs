/**
 * FASE 1 · CASO A — TEC-07 + COMPR-03
 * "El repuesto no existe en stock" (TEC-07) y "Equipo requiere al menos una
 * compra externa → Pasar a Esperando proveedor, no a Reparación" (COMPR-03).
 *
 * Escenario (transcripción Fase 1 §1): el técnico está en la ficha del equipo
 * (Posición 05 / pedir-repuestos), busca la referencia dañada en inventario,
 * NO existe → completa la ficha de solicitud (referencia, componente, cantidad,
 * marca, valor unitario, proveedor) y crea la línea de compra. El sistema debe:
 *   1) Crear la línea vinculada al proyecto (trazabilidad equipo↔ítem).
 *   2) Mover automáticamente el equipo a Posición 11 (esperando-proveedor),
 *      NUNCA a Reparación, porque crear una compra no implica que llegó.
 *
 * Flujo: LOGIN UI → tablero técnico → ficha del proyecto → búsqueda de
 * inventario sin resultado → formulario "Crear línea de compra" → verificación
 * por API (línea + estado del proyecto) → evidencia visual en el tablero.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    findReference, createProject, getProject, listPurchaseLines, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "fase1-tec07-compr03";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const refCode = `IGBT-PW-TEC07-${stamp}`;
const projectId = `pw-tec07-${stamp}`;
const projectTitle = `PW TEC-07 Inversor industrial ${stamp % 100000}`;

const result = {
    case: CASE,
    ids: ["TEC-07", "COMPR-03"],
    requirement: "Referencia inexistente → línea de compra con proveedor/ref/cantidad/costo/plazo + equipo pasa a Pos 11 (esperando-proveedor), no a Reparación.",
    data: { reference: refCode, projectId },
    checks: {
        loginUi: false,
        referenceAbsentInInventory: false,
        projectInPedirRepuestos: false,
        notFoundCardShown: false,
        lineCreatedViaUi: false,
        lineLinkedToProject: false,
        projectMovedToEsperandoProveedor: false,
        cardVisibleInColumn11: false,
    },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    result.checks.referenceAbsentInInventory = !(await findReference(session, refCode));
    if (!result.checks.referenceAbsentInInventory) throw new Error(`La referencia ${refCode} ya existía; el fixture no es válido.`);

    const proj = await createProject(session, { id: projectId, status: "pedir-repuestos", title: projectTitle });
    result.checks.projectInPedirRepuestos = (await getProject(session, projectId))?.status === "pedir-repuestos";
    if (!result.checks.projectInPedirRepuestos) throw new Error("El fixture del proyecto no quedó en pedir-repuestos.");

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
    if (!(await card.isVisible({ timeout: 20000 }).catch(() => false))) {
        throw new Error(`La tarjeta del proyecto no aparece en la columna pedir-repuestos: "${projectTitle}".`);
    }
    await step(page, CASE, stamp, "02-tablero-equipo-en-pos-05");

    // ── Paso 3: Búsqueda de inventario → referencia inexistente ─────────────
    await card.click(); await pause(page);
    // La ficha abre en la pestaña 'Equipo técnico'; el buscador de inventario vive en 'Materiales'.
    const materialsTab = page.locator('a.nav-link', { hasText: /^Materiales$/ }).first();
    if (!(await materialsTab.isVisible({ timeout: 20000 }).catch(() => false))) {
        throw new Error("La ficha del proyecto no se abrió (pestaña 'Materiales' no visible tras clic en la tarjeta).");
    }
    await materialsTab.click(); await pause(page);
    const searchInput = page.locator('input[placeholder="Busca una referencia por codigo o descripcion..."]');
    if (!(await searchInput.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El buscador de repuestos no está visible en la ficha.");
    await searchInput.fill(refCode); await pause(page);

    const notFoundCard = page.locator(".material-not-found-card");
    if (!(await notFoundCard.isVisible({ timeout: 15000 }).catch(() => false))) {
        throw new Error(`No apareció la tarjeta "Referencia no encontrada" para ${refCode} (TEC-07 exige crear línea con proveedor, no descripción genérica).`);
    }
    result.checks.notFoundCardShown = true;
    await step(page, CASE, stamp, "03-referencia-no-encontrada");

    // ── Paso 4: Completar la ficha de solicitud (Fase 1 §1.5) ────────────────
    const fieldByLabel = (labelText) => notFoundCard.locator(".project-detail-field").filter({ hasText: labelText }).locator("input");
    await fieldByLabel("Referencia").fill(refCode); await pause(page);
    await fieldByLabel("Componente").fill("IGBT módulo de potencia 1200V"); await pause(page);
    await fieldByLabel("Tipo").fill("Electronico"); await pause(page);
    await fieldByLabel("Marca").fill("Fuji Electric"); await pause(page);
    await fieldByLabel("Cantidad necesaria").fill("2"); await pause(page);
    await fieldByLabel("Valor unitario").fill("450000"); await pause(page);
    await fieldByLabel("Proveedor sugerido").fill("Mouser"); await pause(page);
    await step(page, CASE, stamp, "04-ficha-solicitud-completada");

    // ── Paso 5: Crear la línea de compra ─────────────────────────────────────
    const createBtn = notFoundCard.locator("button", { hasText: "Crear linea de compra" }).first();
    if (!(await createBtn.isEnabled({ timeout: 10000 }).catch(() => false))) {
        throw new Error("El botón 'Crear linea de compra' no quedó habilitado tras completar los campos obligatorios.");
    }
    await createBtn.click(); await pause(page);

    const lines = await listPurchaseLines(session).then((items) => items);
    const createdLine = lines.find((l) => String(l?.reference ?? "") === refCode);
    result.checks.lineCreatedViaUi = Boolean(createdLine);
    result.checks.lineLinkedToProject = Boolean(
        createdLine && (String(createdLine.projectId ?? createdLine.project_id ?? "").toLowerCase() === projectId.toLowerCase())
    );
    if (!createdLine) throw new Error("La línea de compra no existe en la API tras crearla por UI.");

    // ── Paso 6: Verificar auto-transición a Posición 11 (COMPR-03) ───────────
    await step(page, CASE, stamp, "05-linea-creada-feedback");
    const projAfter = await getProject(session, projectId);
    result.checks.projectMovedToEsperandoProveedor = projAfter?.status === "esperando-proveedor";
    if (projAfter?.status === "reparacion") throw new Error("REGROSA: el equipo pasó a Reparación con una compra pendiente; COMPR-03 exige Esperando proveedor.");
    result.observations.push(`Estado del proyecto tras crear la línea: '${projAfter?.status ?? "?"}' (línea ${createdLine.id}, estado '${createdLine.status}').`);

    // ── Paso 7: Evidencia visual — el equipo debe verse en columna Pos 11 ───
    const cancelBtn = page.locator("button", { hasText: "Cancelar" }).first();
    if (await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) await cancelBtn.click();
    await pause(page);
    await page.reload({ waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const column11 = page.locator('[data-column-id="esperando-proveedor"].cards-sortable').first();
    const cardIn11 = column11.locator(".project-drag-item").filter({ hasText: projectTitle }).first();
    result.checks.cardVisibleInColumn11 = await cardIn11.isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.checks.cardVisibleInColumn11) {
        throw new Error("El equipo NO aparece en la columna 'Esperando proveedor' del tablero técnico (Posición 11).");
    }
    await step(page, CASE, stamp, "06-equipo-en-columna-pos-11");

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
