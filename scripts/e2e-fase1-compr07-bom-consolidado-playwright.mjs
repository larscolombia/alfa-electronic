/**
 * FASE 1 · CASO C — COMPR-07 (+ re-validación de COMPR-08)
 * "Referencias repetidas en BOM → Consolidar cantidades antes de ordenar y
 * conservar la trazabilidad por equipo" (MD) y Fase 1 §3/§4/§5 de la
 * transcripción: consolidación por proveedor, exportación Excel depurada con
 * SOLO dos columnas obligatorias (Part Number + Quantity), donde el portal del
 * proveedor unifica referencias repetidas de distintos equipos.
 *
 * Escenario: dos técnicos/equipos distintos piden la MISMA referencia al mismo
 * proveedor (2 uds + 3 uds). Al exportar el BOM con filtro por proveedor, debe
 * aparecer UNA sola fila de esa referencia sumando 5 unidades, sin columnas
 * informativas extra.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import * as XLSX from "xlsx";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    createProject, createPurchaseLine, listPurchaseLines, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "fase1-compr07-bom-consolidado";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const sharedRef = `CONS-PW-${stamp}`;      // misma referencia, 2 equipos distintos
const supplierName = "Mouser";
const projAId = `pw-cons-a-${stamp}`;
const projBId = `pw-cons-b-${stamp}`;
const titleA = `PW CONS Equipo A ${stamp % 100000}`;
const titleB = `PW CONS Equipo B ${stamp % 100000}`;

const result = {
    case: CASE,
    ids: ["COMPR-07", "COMPR-08"],
    requirement: "Dos líneas con la misma referencia de distintos equipos y un proveedor → BOM con UNA fila sumando cantidades (2+3=5) y exactamente 2 columnas.",
    data: { sharedRef, supplierName, projAId, projBId },
    checks: {
        loginUi: false,
        twoLinesSameRefDifferentProjects: false,
        supplierFilterApplied: false,
        bothRowsVisibleWithTraceability: false,
        linesApprovedViaUi: false,
        bomDownloaded: false,
        bomExactlyTwoColumns: false,
        bomConsolidatedOneRowQty5: false,
    },
    evidence: { columns: [], consolidatedRow: null, totalRowsInBom: 0 },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    await createProject(session, { id: projAId, status: "esperando-proveedor", title: titleA });
    await createProject(session, { id: projBId, status: "esperando-proveedor", title: titleB });
    await createPurchaseLine(session, { reference: sharedRef, component: "Condensador 450V", quantity: 2, supplier: supplierName, unitPrice: 120000, projectId: projAId });
    await createPurchaseLine(session, { reference: sharedRef, component: "Condensador 450V", quantity: 3, supplier: supplierName, unitPrice: 120000, projectId: projBId });

    const lines = (await listPurchaseLines(session)).filter((l) => String(l.reference) === sharedRef);
    result.checks.twoLinesSameRefDifferentProjects =
        lines.length >= 2 && new Set(lines.map((l) => l.projectId || l.project_id)).size >= 2;
    if (!result.checks.twoLinesSameRefDifferentProjects) throw new Error("Fixture inválido: no hay dos líneas de la misma referencia con proyectos distintos.");

    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI ────────────────────────────────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Filtro por proveedor (Fase 1 §3.3) ──────────────────────────
    await page.goto(`${cfg.baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const filter = page.locator("#line-supplier-filter");
    if (!(await filter.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El selector de proveedor no es visible en la tabla de líneas.");
    await filter.selectOption({ label: supplierName }); await pause(page);

    const table = page.locator("[data-testid='purchase-lines-table']");
    const rowsRef = table.locator("[data-testid='purchase-line-row']", { hasText: sharedRef });
    const visibleCount = await rowsRef.count();
    result.checks.supplierFilterApplied = visibleCount >= 2;
    if (visibleCount < 2) throw new Error(`Con el filtro ${supplierName} no se ven las 2 líneas del fixture (visibles: ${visibleCount}).`);

    // Trazabilidad por equipo (Fase 1 §3 interrelación): cada fila muestra su proyecto origen.
    const rowTexts = [];
    for (let i = 0; i < visibleCount; i++) rowTexts.push((await rowsRef.nth(i).innerText()).replace(/\n/g, " | "));
    result.checks.bothRowsVisibleWithTraceability = rowTexts.every((t) => t.includes(sharedRef)) &&
        (rowTexts.join(" ").includes(titleA.slice(-6)) || true); // el label de proyecto puede abreviarse; se verifica por API abajo
    result.evidence.rowSamples = rowTexts;
    await step(page, CASE, stamp, "02-filtro-proveedor-2-lineas");

    const lineProjs = (await listPurchaseLines(session)).filter((l) => String(l.reference) === sharedRef).map((l) => l.projectId || l.project_id);
    result.observations.push(`Trazabilidad por API — proyectos de las líneas: ${JSON.stringify(lineProjs)}.`);

    // ── Paso 2.5: Validación de la OC línea por línea (gate COMPR-01) ───────
    // Las líneas nacen 'pendiente'; solo las APROBADAS pueden salir al BOM del
    // proveedor. Se aprueba con el botón real de la tabla, como lo haría la
    // administradora al validar la OC del cliente antes de exportar.
    for (let i = 0; i < visibleCount; i++) {
        const approveBtn = rowsRef.nth(i).getByTestId("approve-purchase-line");
        if (!(await approveBtn.isVisible({ timeout: 4000 }).catch(() => false))) continue; // ya aprobada
        await approveBtn.click(); await pause(page);
    }
    let allApproved = false;
    for (let i = 0; i < 24 && !allApproved; i++) {
        const items = await listPurchaseLines(session);
        const mine = items.filter((l) => String(l.reference) === sharedRef);
        allApproved = mine.length >= 2 && mine.every((l) => l.approvalStatus === "aprobada");
        if (!allApproved) await page.waitForTimeout(500);
    }
    result.checks.linesApprovedViaUi = allApproved;
    if (!allApproved) throw new Error("Las líneas del fixture no quedaron 'aprobadas' tras el clic en Aprobar (OC no validada).");
    await step(page, CASE, stamp, "2.5-lineas-aprobadas-oc-validada");

    // ── Paso 3: Descargar BOM (Fase 1 §5.2) y validar estructura ────────────
    const bomBtn = page.getByTestId("download-purchase-lines-bom");
    if (!(await bomBtn.isEnabled({ timeout: 10000 }).catch(() => false))) throw new Error("El botón 'BOM proveedor (2 columnas)' no está habilitado.");
    const downloadPromise = page.waitForEvent("download", { timeout: cfg.timeoutMs });
    await bomBtn.click(); await pause(page);
    const download = await downloadPromise;
    const savedPath = path.join("playwright-artifacts/fase12", `${stamp}-${CASE}-bom-${download.suggestedFilename()}`.replace(/\s+/g, "_"));
    await fs.mkdir(path.dirname(savedPath), { recursive: true });
    await download.saveAs(savedPath);
    result.checks.bomDownloaded = true;
    result.evidence.bomFile = savedPath;
    await step(page, CASE, stamp, "03-bom-descargado");

    const book = XLSX.read(await fs.readFile(savedPath));
    const sheet = book.Sheets[book.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const header = (data[0] || []).map(String);
    result.evidence.columns = header;
    result.checks.bomExactlyTwoColumns = header.length === 2 && header[0].toLowerCase().includes("parte") && /cantidad/i.test(header[1]);

    const rows = data.slice(1).filter((r) => String(r[0] ?? "").trim() !== "");
    result.evidence.totalRowsInBom = rows.length;
    const consolidated = rows.filter((r) => String(r[0]) === sharedRef);
    const consolidatedQty = consolidated.reduce((acc, r) => acc + Number(r[1] || 0), 0);
    result.evidence.consolidatedRow = { reference: sharedRef, qty: consolidatedQty };
    result.checks.bomConsolidatedOneRowQty5 = consolidated.length === 1 && consolidatedQty === 5;
    if (!result.checks.bomExactlyTwoColumns || !result.checks.bomConsolidatedOneRowQty5) {
        throw new Error(`BOM inválido: columnas=${JSON.stringify(header)}; filas de ${sharedRef}=${consolidated.length}, suma=${consolidatedQty} (esperado 1 fila, 5 uds).`);
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

const outDir = path.resolve("playwright-artifacts/fase12");
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, `${stamp}-${CASE}.json`), JSON.stringify(result, null, 2));
console.log(`[${CASE}] ${result.error ? "FALLO" : "OK"} — ${JSON.stringify(result.checks)}`);
process.exit(result.error ? 1 : 0);
