/**
 * FASE 1 · COMPR-01
 * "Línea sin OC validada → No debe aparecer en compras ni exportarse al proveedor." (MD)
 *
 * Escenario: dos líneas de compra del MISMO proveedor nacen 'pendiente'
 * (sin validar). La administradora, tras recibir la OC del cliente:
 *   - RECHAZA una línea por UI (OC no validada para esa referencia).
 *   - APROBA la otra línea por UI (OC validada).
 * Al exportar el BOM de 2 columnas (formato portal de proveedor):
 *   - la línea RECHAZADA NO aparece (regla COMPR-01: sin OC validada no sale);
 *   - la línea APROBADA SÍ aparece con su cantidad exacta (el gate no sobrabloquea).
 *
 * COT-08 (ya verde) cubre la otra mitad de la regla: una solicitud sin OC
 * aprobada nunca se convierte en línea de compra. Aquí se prueba el gate a
 * nivel de línea sobre el archivo que sube al portal del proveedor.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import * as XLSX from "xlsx";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin,
    createProject, createPurchaseLine, listPurchaseLines, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const CASE = "compr01-sin-oc-no-se-exporta";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/fase12");

const rejectedRef = `REJ-PW-${stamp}`;   // sin OC validada → NO debe salir al BOM
const approvedRef = `OKC-PW-${stamp}`;    // OC validada      → SÍ sale al BOM (qty 3)
const supplierName = "Mouser";
const projectId = `pw-c01-${stamp}`;
const title = `PW C01 Equipo ${stamp % 100000}`;

const result = {
    case: CASE,
    ids: ["COMPR-01"],
    requirement: "Línea sin OC validada (rechazada/pendiente) no debe exportarse al proveedor; la aprobada sí.",
    data: { rejectedRef, approvedRef, supplierName, projectId },
    checks: {
        loginUi: false,
        fixtureBothPending: false,
        bothRowsVisibleInPurchases: false,
        rejectedViaUi: false,
        rejectedBadgeShowsRechazada: false,
        approvedViaUi: false,
        bomDownloaded: false,
        bomExactlyTwoColumns: false,
        rejectedLineNotInBom: false,
        approvedLineStillExportedQty3: false,
    },
    evidence: { columns: [], totalRowsInBom: 0, rows: [] },
    observations: [],
    error: "",
};

/** Espera (API) a que TODAS las líneas de una referencia pasen al estado de aprobación esperado. */
async function waitForApproval(session, ref, expected) {
    for (let i = 0; i < 24; i++) {
        const items = await listPurchaseLines(session);
        const mine = items.filter((l) => String(l.reference).toLowerCase() === String(ref).toLowerCase());
        if (mine.length >= 1 && mine.every((l) => l.approvalStatus === expected)) return true;
        await new Promise((r) => setTimeout(r, 500));
    }
    return false;
}

let browser;
try {
    // ── Fixtures por API (líneas únicas por corrida, nacen 'pendiente') ────
    const session = await apiLogin();
    await createProject(session, { id: projectId, status: "esperando-proveedor", title });
    await createPurchaseLine(session, { reference: rejectedRef, component: "Condensador electrolítico 450V", quantity: 2, supplier: supplierName, unitPrice: 80000, neededBy: "3", projectId, requestReason: `QA COMPR-01 línea a rechazar (${title})` });
    await createPurchaseLine(session, { reference: approvedRef, component: "Circuito integrado driver", quantity: 3, supplier: supplierName, unitPrice: 250000, neededBy: "3", projectId, requestReason: `QA COMPR-01 línea a aprobar (${title})` });

    let lines = await listPurchaseLines(session);
    const rejLine = lines.find((l) => String(l.reference).toLowerCase() === rejectedRef.toLowerCase());
    const okcLine = lines.find((l) => String(l.reference).toLowerCase() === approvedRef.toLowerCase());
    result.checks.fixtureBothPending = Boolean(rejLine && okcLine && rejLine.approvalStatus === "pendiente" && okcLine.approvalStatus === "pendiente");
    if (!result.checks.fixtureBothPending) throw new Error(`Fixture inválido: aprobaciones iniciales = ${JSON.stringify({ rej: rejLine?.approvalStatus, okc: okcLine?.approvalStatus })}.`);

    const ctx = await launchBrowser(); // diálogos confirm() auto-aceptados (botón "Rechazar")
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI ────────────────────────────────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Tabla de líneas + filtro proveedor (Fase 1 §3) ─────────────
    await page.goto(`${cfg.baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const table = page.locator("[data-testid='purchase-lines-table']");
    if (!(await table.first().isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("La tabla de líneas de compra no es visible.");
    await page.locator("#line-supplier-filter").selectOption({ label: supplierName }); await pause(page);

    const rowRejected = table.locator("[data-testid='purchase-line-row']", { hasText: rejectedRef });
    const rowApproved = table.locator("[data-testid='purchase-line-row']", { hasText: approvedRef });
    result.checks.bothRowsVisibleInPurchases = (await rowRejected.count()) >= 1 && (await rowApproved.count()) >= 1;
    if (!result.checks.bothRowsVisibleInPurchases) throw new Error("Faltan filas del fixture en la tabla con filtro de proveedor.");
    await step(page, CASE, stamp, "02-filtro-mouser-2-lineas-pendientes");

    // ── Paso 3: RECHAZO por UI (OC NO validada para esta referencia) ───────
    const rejectBtn = rowRejected.getByTestId("reject-purchase-line").first();
    if (!(await rejectBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón 'Rechazar' no es visible en la línea pendiente.");
    await rejectBtn.click(); await pause(page); // confirm() → auto-aceptado por el launcher

    const rejectedNow = await waitForApproval(session, rejectedRef, "rechazada");
    result.checks.rejectedViaUi = rejectedNow;
    if (!rejectedNow) throw new Error("Tras el clic en 'Rechazar' la línea no quedó con approvalStatus='rechazada'.");

    const badge = table.locator("[data-testid='purchase-line-row']", { hasText: rejectedRef }).getByTestId("purchase-line-approval").first();
    result.checks.rejectedBadgeShowsRechazada = (await badge.innerText().catch(() => "")).toLowerCase() === "rechazada";
    await step(page, CASE, stamp, "03-linea-rechazada-badge");

    // ── Paso 4: APROBACIÓN por UI de la otra línea (OC validada) ───────────
    const approveBtn = table.locator("[data-testid='purchase-line-row']", { hasText: approvedRef }).getByTestId("approve-purchase-line").first();
    if (!(await approveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón 'Aprobar' no es visible en la línea pendiente.");
    await approveBtn.click(); await pause(page);

    const approvedNow = await waitForApproval(session, approvedRef, "aprobada");
    result.checks.approvedViaUi = approvedNow;
    if (!approvedNow) throw new Error("Tras el clic en 'Aprobar' la línea no quedó con approvalStatus='aprobada'.");
    await step(page, CASE, stamp, "04-linea-aprobada-oc-validada");

    // ── Paso 5: Exportar BOM del proveedor y auditar su contenido (Fase 1 §5) ─
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
    await step(page, CASE, stamp, "05-bom-descargado");

    const book = XLSX.read(await fs.readFile(savedPath));
    const sheet = book.Sheets[book.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const header = (data[0] || []).map(String);
    result.evidence.columns = header;
    result.checks.bomExactlyTwoColumns = header.length === 2 && header[0].toLowerCase().includes("parte") && /cantidad/i.test(header[1]);

    const rows = data.slice(1).filter((r) => String(r[0] ?? "").trim() !== "");
    result.evidence.totalRowsInBom = rows.length;
    result.evidence.rows = rows.map((r) => ({ ref: String(r[0]), qty: Number(r[1]) }));

    const refsInBom = rows.map((r) => String(r[0]).toLowerCase());
    // REGLA COMPR-01: la línea rechazada (sin OC validada) NO sale al proveedor.
    result.checks.rejectedLineNotInBom = !refsInBom.includes(rejectedRef.toLowerCase());
    // Contraparte positiva: la aprobada SÍ sale, con su cantidad exacta (no sobrabloquea).
    const approvedRows = rows.filter((r) => String(r[0]).toLowerCase() === approvedRef.toLowerCase());
    result.checks.approvedLineStillExportedQty3 = approvedRows.length === 1 && Number(approvedRows[0][1]) === 3;

    if (!result.checks.rejectedLineNotInBom || !result.checks.approvedLineStillExportedQty3) {
        throw new Error(`Contenido BOM incorrecto: ${JSON.stringify(result.evidence.rows)} (esperado: sin ${rejectedRef}, con ${approvedRef} qty 3).`);
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
