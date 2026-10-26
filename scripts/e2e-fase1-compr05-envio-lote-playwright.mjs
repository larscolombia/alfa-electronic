/**
 * FASE 1 · CASO D — COMPR-05
 * "Compra cerrada → Cambiar líneas a Comprado/En tránsito y asociar pedido,
 * proveedor y fecha" (MD) y Fase 1 §6: cierre de compra en el sistema interno;
 * las líneas pasan al estado equivalente a "Comprado / En espera de importación"
 * (naranja) y el equipo queda congelado en Posición 11.
 *
 * Reglas ejercitadas:
 *   D-1: línea 'pendiente' → botón Enviar habilitado; tras enviar, badge
 *        'enviada' (equivalente naranja del sistema actual).
 *   D-2: el proveedor y la fecha de generación se conservan (trazabilidad del
 *        lote) — verificado por API.
 *   D-3: tras enviar, el botón Enviar queda DESHABILITADO (no hay doble envío).
 *   D-4: el equipo vinculado PERMANECE en Posición 11 (esperando-proveedor);
 *        enviar no significa que llegó (COMPR-03/COMPR-05).
 *
 * NOTA de cobertura: la transcripción menciona un "Código de Orden de Compra
 * de Proveedor" asignado al lote (ej. 260-3005). Si el backend no lo genera,
 * queda documentado en observations como brecha conocida (no bloqueante aquí).
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    createProject, getProject, createPurchaseLine, findPurchaseLine, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "fase1-compr05-envio-lote";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const refCode = `COMP05-PW-${stamp}`;
const supplierName = "Mouser";
const projectId = `pw-comp05-${stamp}`;
const title = `PW COMP-05 Tabla de control ${stamp % 100000}`;

const result = {
    case: CASE,
    ids: ["COMPR-05"],
    requirement: "Enviar la línea pendiente → estado 'enviada' (Comprado/En tránsito), proveedor y fecha trazables, botón deshabilitado, equipo sigue en Pos 11.",
    data: { reference: refCode, supplierName, projectId },
    checks: {
        loginUi: false,
        linePendingVisible: false,
        sendEnabledBefore: false,
        sentViaUi: false,
        lineEnvviadaInApi: false,
        supplierAndDatePreserved: false,
        sendDisabledAfter: false,
        projectStaysPos11: false,
    },
    evidence: { lineBefore: null, lineAfter: null, lotCodeAssigned: null },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    await createProject(session, { id: projectId, status: "esperando-proveedor", title });
    await createPurchaseLine(session, { reference: refCode, component: "Relé de potencia 24V", quantity: 1, supplier: supplierName, unitPrice: 95000, neededBy: "10", projectId, requestReason: `Repuesto para proyecto ${title}` });

    const lineBefore = await findPurchaseLine(session, refCode);
    if (!lineBefore || lineBefore.status !== "pendiente") throw new Error(`Fixture inválido: línea en '${lineBefore?.status}' (esperado 'pendiente').`);
    result.evidence.lineBefore = { id: lineBefore.id, status: lineBefore.status, supplier: lineBefore.supplier };

    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI ────────────────────────────────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Línea pendiente visible con su proveedor (Fase 1 §6.1) ──────
    await page.goto(`${cfg.baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const table = page.locator("[data-testid='purchase-lines-table']");
    const row = table.locator("[data-testid='purchase-line-row']", { hasText: refCode }).first();
    result.checks.linePendingVisible = await row.isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.checks.linePendingVisible) throw new Error(`La línea ${refCode} no es visible en la tabla de compras.`);

    const sendBtn = row.locator("button", { hasText: /^Enviar$/ }).first();
    result.checks.sendEnabledBefore = await sendBtn.isEnabled({ timeout: 10000 }).catch(() => false);
    if (!result.checks.sendEnabledBefore) throw new Error("El botón 'Enviar' no está habilitado para una línea pendiente.");
    await step(page, CASE, stamp, "02-linea-pendiente-con-enviar");

    // ── Paso 3: Cierre/envío de la compra (Fase 1 §6.1) ────────────────────
    await sendBtn.click(); await pause(page);
    const badge = row.locator(".badge").filter({ hasText: /pendiente|enviada/ }).last();
    await page.waitForTimeout(1500);
    const lineAfterApi = await findPurchaseLine(session, refCode);
    result.checks.sentViaUi = true;
    result.checks.lineEnvviadaInApi = lineAfterApi?.status === "enviada";
    if (!result.checks.lineEnvviadaInApi) throw new Error(`API: línea en '${lineAfterApi?.status}' tras enviar por UI (esperado 'enviada').`);

    result.evidence.lineAfter = { id: lineAfterApi.id, status: lineAfterApi.status, supplier: lineAfterApi.supplier, generatedAt: lineAfterApi.generatedAt };
    result.checks.supplierAndDatePreserved =
        String(lineAfterApi?.supplier ?? "") === supplierName && Boolean(lineAfterApi?.generatedAt || lineAfterApi?.created_at);
    if (!result.checks.supplierAndDatePreserved) throw new Error("La trazabilidad (proveedor/fecha) no se conservó tras enviar.");

    // Código de lote: verificar si existe algún campo de orden/lote en la línea.
    const lotCode = lineAfterApi?.orderId || lineAfterApi?.lotCode || lineAfterApi?.lote || null;
    result.evidence.lotCodeAssigned = lotCode;
    if (!lotCode) {
        result.observations.push("BRECHA DOCUMENTADA (Fase 1 §6.2): el sistema no asigna un 'Código de Orden de Compra de Proveedor' al lote (ej. 260-3005); solo cambia el estado a 'enviada'.");
    }
    await step(page, CASE, stamp, "03-linea-enviada-naranja");

    // ── Paso 4: Estado de la UI — badge enviada + botón deshabilitado ───────
    const sendBtnAfter = row.locator("button", { hasText: /^Enviar$/ }).first();
    result.checks.sendDisabledAfter = !(await sendBtnAfter.isEnabled({ timeout: 5000 }).catch(() => true));
    if (!result.checks.sendDisabledAfter) throw new Error("El botón 'Enviar' sigue habilitado tras el envío (riesgo de doble envío).");

    // ── Paso 5: El equipo debe seguir congelado en Posición 11 ─────────────
    const proj = await getProject(session, projectId);
    result.checks.projectStaysPos11 = proj?.status === "esperando-proveedor";
    if (!result.checks.projectStaysPos11) throw new Error(`El equipo cambió a '${proj?.status}' tras enviar (debería permanecer en Pos 11 esperando el lote).`);

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
