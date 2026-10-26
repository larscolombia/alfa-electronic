/**
 * FASE 2 · CASO E — COMPR-10 + COMPR-04 (+ Fase 2 §2 "Descender" por ítem)
 * "Llegada de proveedor parcial → Actualizar inventario solo con lo físico
 * recibido y conservar pendiente faltante" (COMPR-10) y "Compra parcial o una
 * línea pendiente → Mantener Posición 11; no liberar reparación hasta recibir
 * todas las líneas requeridas" (COMPR-04).
 *
 * Reglas ejercitadas:
 *   E-1: recibo parcial por UI ("Recibir" = el "Descender" de la transcripción):
 *        1 de 3 unidades → badge 1/3, "Faltan 2".
 *   E-2: stock del inventario aumenta EXACTAMENTE lo físico recibido (1), con
 *        movimiento de entrada asociado (trazabilidad).
 *   E-3: segundo recibo parcial (+1) → 2/3, "Faltan 1", stock = 2.
 *   E-4: NEGATIVO — intentar mover el equipo a Reparación es RECHAZADO por el
 *        backend (puerta de materiales) con mensaje explicativo; el equipo
 *        permanece en Posición 11 (esperando-proveedor).
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    createReference, findReference, createProject, getProject,
    createPurchaseLine, findPurchaseLine, listMovements, moveProjectApi, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "fase2-compr04-10-recibo-parcial";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const refCode = `RECIB-PW-${stamp}`;   // referencia EXISTENTE en catálogo → el recibo acredita stock
const projectId = `pw-recib04-${stamp}`;
const title = `PW COMP-04/10 Servidor CNC ${stamp % 100000}`;
const totalQty = 3;

const result = {
    case: CASE,
    ids: ["COMPR-10", "COMPR-04"],
    requirement: "Recibo parcial acredita solo lo físico (stock + movimiento), conserva 'Faltan N' y el equipo queda bloqueado en Pos 11 hasta recibir todo.",
    data: { reference: refCode, projectId, totalQty },
    checks: {
        loginUi: false,
        fixtureReady: false,
        partialReceiptOneViaUi: false,
        stockCreditedExactly1: false,
        movementRecordedForRef: true,
        remainingVisibleFaltan2: false,
        secondPartialToTwoOfThree: false,
        moveBlockedByGate: false,
        blockMessageExplainable: false,
        projectStaysPos11: false,
    },
    evidence: { stockBefore: null, stockAfterFirst: null, stockAfterSecond: null, gateError: "" },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    const refRes = await createReference(session, refCode, { designation: "Sensor inductivo QA", targetStock: totalQty });
    if (refRes.status !== 200 && refRes.status !== 201) throw new Error(`No se pudo crear la referencia ${refCode} (${refRes.status}).`);

    await createProject(session, { id: projectId, status: "esperando-proveedor", title });
    await createPurchaseLine(session, { reference: refCode, component: "Sensor inductivo M18", quantity: totalQty, supplier: "DigiKey", unitPrice: 320000, neededBy: "7", projectId, requestReason: `Repuesto para proyecto ${title}` });

    const line = await findPurchaseLine(session, refCode);
    const ref = await findReference(session, refCode);
    result.evidence.stockBefore = Number(ref?.currentStock ?? ref?.current_stock ?? 0);
    result.checks.fixtureReady = Boolean(line && ref && result.evidence.stockBefore === 0);
    if (!result.checks.fixtureReady) throw new Error(`Fixture inválido: línea=${Boolean(line)} ref=${Boolean(ref)} stock=${result.evidence.stockBefore}.`);

    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI ────────────────────────────────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Contraste físico ítem a ítem — recibo PARCIAL (1 de 3) ─────
    await page.goto(`${cfg.baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const table = page.locator("[data-testid='purchase-lines-table']");
    const row = table.locator("[data-testid='purchase-line-row']", { hasText: refCode }).first();
    if (!(await row.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La línea ${refCode} no es visible en la tabla de entregas.`);
    await step(page, CASE, stamp, "02-linea-antes-de-recibo");

    const qtyInput = row.locator("input[aria-label='Cantidad recibida de esta linea']").first();
    if (!(await qtyInput.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El input 'Cantidad recibida' no es visible (la línea ya estaría cerrada?).");
    await qtyInput.fill("1"); await pause(page);
    const receiveBtn = row.locator("[data-testid='receive-purchase-line']").first();
    if (!(await receiveBtn.isEnabled({ timeout: 10000 }).catch(() => false))) throw new Error("El botón 'Recibir' no está habilitado para un recibo parcial.");
    await receiveBtn.click(); await pause(page);

    const lineAfterFirst = await findPurchaseLine(session, refCode);
    result.checks.partialReceiptOneViaUi = Number(lineAfterFirst?.receivedQuantity ?? -1) === 1 && Number(lineAfterFirst.quantity) === totalQty;
    if (!result.checks.partialReceiptOneViaUi) throw new Error(`API tras recibo parcial: received=${lineAfterFirst?.receivedQuantity}/${totalQty} (esperado 1/${totalQty}).`);

    result.evidence.stockAfterFirst = Number((await findReference(session, refCode))?.currentStock ?? -1);
    result.checks.stockCreditedExactly1 = result.evidence.stockAfterFirst === 1;
    if (!result.checks.stockCreditedExactly1) throw new Error(`COMPR-10: stock acreditado ${result.evidence.stockAfterFirst} (esperado exactamente 1, lo físico recibido).`);

    const movs = await listMovements(session);
    result.checks.movementRecordedForRef = movs.some((m) => String(m?.reference ?? "").toLowerCase() === refCode.toLowerCase());
    if (!result.checks.movementRecordedForRef) throw new Error("No existe movimiento de stock para la referencia tras el recibo parcial (trazabilidad rota).");

    const badgeText = (await row.locator("[data-testid='purchase-line-received']").first().innerText()).trim();
    result.checks.remainingVisibleFaltan2 = /1\/3/.test(badgeText) && (await row.innerText()).includes("Faltan 2");
    if (!result.checks.remainingVisibleFaltan2) throw new Error(`UI tras recibo parcial: badge='${badgeText}' (esperado 1/3 + Faltan 2).`);
    await step(page, CASE, stamp, "03-recibo-parcial-1-de-3");

    // ── Paso 3: Segundo recibo parcial (+1) → 2/3, stock = 2 ────────────────
    const qtyInput2 = row.locator("input[aria-label='Cantidad recibida de esta linea']").first();
    await qtyInput2.fill("1"); await pause(page);
    const receiveBtn2 = row.locator("[data-testid='receive-purchase-line']").first();
    if (await receiveBtn2.isEnabled({ timeout: 5000 }).catch(() => false)) {
        await receiveBtn2.click(); await pause(page);
    }
    const lineAfterSecond = await findPurchaseLine(session, refCode);
    result.evidence.stockAfterSecond = Number((await findReference(session, refCode))?.currentStock ?? -1);
    result.checks.secondPartialToTwoOfThree = Number(lineAfterSecond?.receivedQuantity) === 2 && result.evidence.stockAfterSecond === 2;
    if (!result.checks.secondPartialToTwoOfThree) throw new Error(`Tras segundo recibo: received=${lineAfterSecond?.receivedQuantity}, stock=${result.evidence.stockAfterSecond} (esperado 2/3, stock 2).`);
    await step(page, CASE, stamp, "04-recibo-parcial-2-de-3");

    // ── Paso 4: NEGATIVO — la puerta de materiales BLOQUEA entrar a Reparación ─
    const moveRes = await moveProjectApi(session, projectId, "reparacion", {});
    result.checks.moveBlockedByGate = moveRes.status >= 400 && /materiales? pendientes|repuestos/i.test(JSON.stringify(moveRes.payload));
    result.evidence.gateError = JSON.stringify(moveRes.payload).slice(0, 300);
    if (moveRes.status < 400) throw new Error(`COMPR-04 violado: el equipo con 1/3 de repuestos pendientes pasó a Reparación (${moveRes.status}).`);
    result.checks.blockMessageExplainable = /materiales|repuesto/i.test(result.evidence.gateError);
    if (!result.checks.blockMessageExplainable) {
        throw new Error(`El backend rechazó sin mensaje explicativo (TRA-03): ${result.evidence.gateError}`);
    }

    const proj = await getProject(session, projectId);
    result.checks.projectStaysPos11 = proj?.status === "esperando-proveedor";
    if (!result.checks.projectStaysPos11) throw new Error(`El equipo quedó en '${proj?.status}' (debería permanecer en Pos 11).`);
    await step(page, CASE, stamp, "05-equipo-bloqueado-en-pos-11");

    result.observations.push(`Evidencia de bloqueo: ${result.evidence.gateError}`);

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
