/**
 * FASE 1 · CASO B — COT-08
 * "Línea de repuesto no marcada/validada → No incluirla en orden a proveedor
 * aunque exista en el diagnóstico" (MD) y Fase 1 §2 de la transcripción:
 * al marcar la validación ("chulito") en la ficha, la línea entra al submódulo
 * de compras pendientes.
 *
 * Regla ejercitada aquí (dos mitades):
 *   B-positiva : una solicitud pendiente del técnico, al ser APROBADA por la
 *                administradora en el panel "Solicitudes" (botón Aprobar),
 *                genera su línea de compra pendiente y queda visible en la
 *                tabla general de líneas (consolidación Fase 1 §2.3).
 *   B-negativa : una solicitud pendiente que NO se aprueba NUNCA debe tener
 *                línea de compra asociada (no entra a compras sin validar).
 *
 * Flujo: LOGIN UI → /app/inventory-orders → panel de solicitudes → aprobar la
 * solicitada → verificar por API ambas mitades + evidencia visual en tabla.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    createPurchaseRequest, findPurchaseRequest, listPurchaseLines, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "fase1-cot08-validacion";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const refA = `COT08-A-${stamp}`;   // se aprueba → debe generar línea
const refB = `COT08-B-${stamp}`; // NO se aprueba → no debe tener línea

const result = {
    case: CASE,
    ids: ["COT-08"],
    requirement: "Solicitud sin validar no genera línea de compra; al aprobarla por UI sí genera la línea pendiente y queda en la lista consolidada.",
    data: { approvedRequest: refA, unapprovedRequest: refB },
    checks: {
        loginUi: false,
        requestsCreatedPending: false,
        negativeBeforeApproval_A: false,
        negativeBeforeApproval_B: false,
        approveViaUi: false,
        requestApprovedInApi: false,
        lineGeneratedForA: false,
        lineAPendingBuyable: false,
        noLineStillForB: false,
        lineATableView: true,
    },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    const [ra, rb] = [await createPurchaseRequest(session, { reference: refA, quantity: 2, supplier: "Mouser" }),
                      await createPurchaseRequest(session, { reference: refB, quantity: 1, supplier: "DigiKey" })];
    result.checks.requestsCreatedPending =
        (await findPurchaseRequest(session, refA))?.status === "pendiente" &&
        (await findPurchaseRequest(session, refB))?.status === "pendiente";
    if (!result.checks.requestsCreatedPending) throw new Error("Las solicitudes fixture no quedaron en estado 'pendiente'.");

    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI ────────────────────────────────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Panel de solicitudes — ambas pendientes visibles ────────────
    await page.goto(`${cfg.baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const panel = page.locator("[data-testid='purchase-requests-panel']");
    await panel.waitFor({ state: "visible", timeout: cfg.timeoutMs });
    const rowA = panel.locator("[data-testid='purchase-request-row']", { hasText: refA }).first();
    if (!(await rowA.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La solicitud ${refA} no es visible en el panel de solicitudes.`);
    const badgeA = (await rowA.locator("[data-testid='purchase-request-status']").first().innerText()).trim();
    result.observations.push(`Solicitud ${refA} visible con estado '${badgeA}'.`);
    await step(page, CASE, stamp, "02-solicitudes-pendientes");

    // ── Paso 3: NEGATIVO — ninguna línea sin validar (mitad B de COT-08) ────
    const linesNow = await listPurchaseLines(session);
    result.checks.negativeBeforeApproval_A = !linesNow.some((l) => String(l.reference) === refA);
    result.checks.negativeBeforeApproval_B = !linesNow.some((l) => String(l.reference) === refB);
    if (!result.checks.negativeBeforeApproval_A || !result.checks.negativeBeforeApproval_B) {
        throw new Error("COT-08 violado ANTES de aprobar: ya existían líneas para solicitudes sin validar.");
    }

    // ── Paso 4: Aprobar la solicitud A ("chulito" de validación) ────────────
    const approveBtn = rowA.locator("[data-testid='approve-purchase-request']").first();
    if (!(await approveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón 'Aprobar' no está visible en la solicitud pendiente.");
    await approveBtn.click(); await pause(page); // el diálogo confirm() se auto-acepta

    const badgeAfter = (await rowA.locator("[data-testid='purchase-request-status']").first().innerText()).trim();
    result.checks.approveViaUi = /aprobada/i.test(badgeAfter);
    if (!result.checks.approveViaUi) throw new Error(`Tras aprobar por UI el badge sigue siendo '${badgeAfter}'.`);
    await step(page, CASE, stamp, "03-solicitud-aprobada");

    // ── Paso 5: Verificar por API la generación de línea + negativo B ───────
    const reqA = await findPurchaseRequest(session, refA);
    result.checks.requestApprovedInApi = reqA?.status === "aprobada";
    if (!result.checks.requestApprovedInApi) throw new Error(`API: solicitud A en estado '${reqA?.status}' (esperado 'aprobada').`);

    const linesAfter = await listPurchaseLines(session);
    const lineA = linesAfter.find((l) => String(l.reference) === refA);
    result.checks.lineGeneratedForA = Boolean(lineA);
    if (!lineA) throw new Error("COT-08: la aprobación NO generó línea de compra (Fase 1 §2.2).");
    result.checks.lineAPendingBuyable = lineA.status === "pendiente" && Number(lineA.quantity ?? 0) >= 1;
    if (!result.checks.lineAPendingBuyable) {
        throw new Error(`Línea A en estado '${lineA.status}' (esperado 'pendiente' comprable).`);
    }
    result.checks.noLineStillForB = !linesAfter.some((l) => String(l.reference) === refB);
    if (!result.checks.noLineStillForB) throw new Error("COT-08 violado: la solicitud B (sin aprobar) generó línea de compra.");
    result.observations.push(`Línea A creada: id=${lineA.id} status='${lineA.status}' qty=${lineA.quantity} supplier='${lineA.supplier}'.`);

    // ── Paso 6: Evidencia visual — la línea consolidada en la tabla general ─
    const table = page.locator("[data-testid='purchase-lines-table']");
    await page.reload({ waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const rowLineA = table.locator("[data-testid='purchase-line-row']", { hasText: refA }).first();
    result.checks.lineATableView = await rowLineA.isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.checks.lineATableView) throw new Error("La línea aprobada NO aparece en la tabla general de líneas de compra (consolidación Fase 1 §2.3).");
    await step(page, CASE, stamp, "04-linea-consolidada-en-tabla");

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
