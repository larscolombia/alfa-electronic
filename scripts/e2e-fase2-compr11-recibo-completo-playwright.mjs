/**
 * FASE 2 · CASO F — COMPR-11 (+ Fase 2 §4 Caso B de la transcripción)
 * "Último repuesto recibido → Mover a Listo para reparar / Posición 1 una sola
 * vez, con registro de transición" (MD). Al validar la ÚLTIMA línea pendiente,
 * el equipo deja de estar bloqueado por la puerta de materiales y reaparece en
 * la columna 'Reparación' del panel técnico.
 *
 * Reglas ejercitadas:
 *   F-1: recibo COMPLETO por UI (2/2) → badge verde (text-bg-success), línea
 *        al 100 % recibida; stock acreditado por el total físico (2).
 *   F-2: la puerta de materiales se ABRE: el movimiento esperando-proveedor →
 *        reparacion es aceptado (antes estaba bloqueado, ver caso E).
 *   F-3: el equipo queda VISIBLE en la columna 'Reparación' del tablero técnico
 *        (evidencia visual) y su estado persistido es 'reparacion'.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    createReference, findReference, createProject, getProject,
    createPurchaseLine, findPurchaseLine, moveProjectApi, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "fase2-compr11-recibo-completo";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const refCode = `RECIB11-PW-${stamp}`;
const projectId = `pw-recib11-${stamp}`;
const title = `PW COMP-11 Controlador PLC ${stamp % 100000}`;
const totalQty = 2;

const result = {
    case: CASE,
    ids: ["COMPR-11"],
    requirement: "Recibo del último repuesto → línea 100% (verde), gate de materiales se abre y el equipo pasa a Pos 01 visible en la columna Reparación.",
    data: { reference: refCode, projectId, totalQty },
    checks: {
        loginUi: false,
        fixtureReady: false,
        fullReceiptViaUi: false,
        badgeGreenFullReceived: false,
        stockCreditedFull: false,
        gateNowOpenMoveAccepted: false,
        projectPersistedAsReparacion: false,
        cardVisibleInColumnReparacion: false,
    },
    evidence: { badgeText: "", stockAfter: null, moveStatus: 0, usedUiDrag: null },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    const refRes = await createReference(session, refCode, { designation: "Módulo de comunicación QA", targetStock: totalQty });
    if (refRes.status !== 200 && refRes.status !== 201) throw new Error(`No se pudo crear la referencia ${refCode} (${refRes.status}).`);

    await createProject(session, { id: projectId, status: "esperando-proveedor", title });
    await createPurchaseLine(session, { reference: refCode, component: "Módulo comms RS-485", quantity: totalQty, supplier: "Arrow", unitPrice: 210000, neededBy: "5", projectId, requestReason: `Repuesto para proyecto ${title}` });

    const line = await findPurchaseLine(session, refCode);
    result.checks.fixtureReady = Boolean(line) && Number((await findReference(session, refCode))?.currentStock ?? -1) === 0;
    if (!result.checks.fixtureReady) throw new Error("Fixture inválido: la línea o la referencia no quedaron como se esperaba (stock inicial debe ser 0).");

    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI ────────────────────────────────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Recibo COMPLETO de la última línea pendiente (Fase 2 §4-B) ─
    await page.goto(`${cfg.baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const table = page.locator("[data-testid='purchase-lines-table']");
    const row = table.locator("[data-testid='purchase-line-row']", { hasText: refCode }).first();
    if (!(await row.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La línea ${refCode} no es visible en la tabla de entregas.`);

    const qtyInput = row.locator("input[aria-label='Cantidad recibida de esta linea']").first();
    if (!(await qtyInput.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El input 'Cantidad recibida' no es visible (¿línea ya cerrada?).");
    await qtyInput.fill(String(totalQty)); await pause(page);
    const receiveBtn = row.locator("[data-testid='receive-purchase-line']").first();
    if (!(await receiveBtn.isEnabled({ timeout: 10000 }).catch(() => false))) throw new Error("El botón 'Recibir' no está habilitado.");
    await receiveBtn.click(); await pause(page);

    const lineAfter = await findPurchaseLine(session, refCode);
    result.checks.fullReceiptViaUi = Number(lineAfter?.receivedQuantity) === totalQty && Number(lineAfter.quantity) === totalQty;
    if (!result.checks.fullReceiptViaUi) throw new Error(`API tras recibo completo: received=${lineAfter?.receivedQuantity}/${totalQty} (esperado 100 %).`);

    // Evidencia visual: badge 2/2 con clase verde.
    const badge = row.locator("[data-testid='purchase-line-received']").first();
    result.evidence.badgeText = (await badge.innerText().catch(() => "")).trim();
    const badgeClass = await badge.getAttribute("class").catch(() => "");
    result.checks.badgeGreenFullReceived = new RegExp(`${totalQty}/${totalQty}`).test(result.evidence.badgeText) && /text-bg-success/.test(badgeClass || "");
    if (!result.checks.badgeGreenFullReceived) throw new Error(`UI: badge='${result.evidence.badgeText}' class='${badgeClass}' (esperado 2/2 verde).`);

    result.evidence.stockAfter = Number((await findReference(session, refCode))?.currentStock ?? -1);
    result.checks.stockCreditedFull = result.evidence.stockAfter === totalQty;
    if (!result.checks.stockCreditedFull) throw new Error(`COMPR-10/11: stock=${result.evidence.stockAfter} (esperado ${totalQty}, todo lo físico recibido).`);
    await step(page, CASE, stamp, "02-recibo-completo-verde");

    // ── Paso 3: El gate se abre → mover a Reparación por UI (drag en tablero) ─
    await page.goto(`${cfg.baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const columnFrom = page.locator('[data-column-id="esperando-proveedor"].cards-sortable').first();
    const cardIn11 = columnFrom.locator(".project-drag-item").filter({ hasText: title }).first();
    if (!(await cardIn11.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El equipo no aparece en la columna 'Esperando proveedor' del tablero.");
    await step(page, CASE, stamp, "03-equipo-en-pos-11-pre-movimiento");

    // data-column-id y cards-sortable viven en el MISMO nodo (kanban-view.component.ts:209-211).
    const columnTo = page.locator('[data-column-id="reparacion"].cards-sortable').first();
    if (!(await columnTo.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("La columna destino 'Reparación' no es visible en el tablero.");

    // Drag & drop real: dragula solo acepta el arrastre si el mousedown nace en
    // .project-card__drag-handle (kanban-view.component.ts:6467-6470).
    try {
        await cardIn11.scrollIntoViewIfNeeded();
        await columnTo.scrollIntoViewIfNeeded();
        const handle = cardIn11.locator('button.project-card__drag-handle').first();
        if (!(await handle.isVisible({ timeout: 15000 }).catch(() => false))) throw new Error("No se encontró el asa de arrastre en la tarjeta.");
        const fromBox = await handle.boundingBox();
        const toBox = await columnTo.boundingBox();
        if (!fromBox || !toBox) throw new Error("No se pudo medir las cajas del drag.");
        const sx = fromBox.x + fromBox.width / 2;
        const sy = fromBox.y + fromBox.height / 2;
        const tx = toBox.x + toBox.width / 2;
        const ty = Math.min(toBox.y + Math.max(40, toBox.height / 3), toBox.y + toBox.height - 8);
        await page.mouse.move(sx, sy); await pause(page);
        await page.mouse.down();
        const stepsCount = 25;
        for (let i = 1; i <= stepsCount; i++) {
            await page.mouse.move(sx + ((tx - sx) * i) / stepsCount, sy + ((ty - sy) * i) / stepsCount);
            if (i % 4 === 0) await pause(page);
        }
        await pause(page);
        await page.mouse.up(); await pause(page);
    } catch (dragErr) {
        result.observations.push(`Drag por UI falló (${String(dragErr).slice(0, 140)}); se intenta el movimiento por API (mismo endpoint que usa la UI).`);
    }

    // Verificación: ¿el equipo llegó a Reparación? (UI drag o, si no, vía API)
    await page.waitForTimeout(2500);
    let proj = await getProject(session, projectId);
    if (proj?.status !== "reparacion") {
        const moveRes = await moveProjectApi(session, projectId, "reparacion", {});
        result.evidence.moveStatus = moveRes.status;
        if (!(moveRes.status === 200 || moveRes.status === 201)) {
            throw new Error(`COMPR-11 violado: con el 100 % recibido, el movimiento a Reparación fue RECHAZADO (${moveRes.status}): ${JSON.stringify(moveRes.payload).slice(0, 220)}`);
        }
        result.observations.push("El drag por UI no completó; se validó que la puerta de materiales está ABIERTA mediante el mismo endpoint PUT /projects/:id (status " + moveRes.status + ").");
    } else {
        result.evidence.usedUiDrag = true;
    }
    proj = await getProject(session, projectId);
    result.checks.gateNowOpenMoveAccepted = true;
    result.checks.projectPersistedAsReparacion = proj?.status === "reparacion";
    if (!result.checks.projectPersistedAsReparacion) throw new Error(`El proyecto quedó en '${proj?.status}' (esperado 'reparacion').`);

    // ── Paso 4: Evidencia visual — el equipo reaparece en 'Equipos para Reparar' ─
    await page.reload({ waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const cardInReparacion = page.locator('[data-column-id="reparacion"] .project-drag-item').filter({ hasText: title }).first();
    result.checks.cardVisibleInColumnReparacion = await cardInReparacion.isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.checks.cardVisibleInColumnReparacion) {
        throw new Error("El equipo NO reaparece en la columna 'Reparación' del panel técnico (Fase 2 §4 interrelación).");
    }
    await step(page, CASE, stamp, "04-equipo-en-columna-reparacion");

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
