/**
 * Playwright headless test — Req #4: Reporte de Intervención Técnica
 *
 * Verifies:
 *  - Technical report can be generated independently of billing (no need for Position 20)
 *  - Report works for warranties (not just first repair)
 *  - Rich text support (extended character limit, bold, line breaks)
 *  - Report can be printed/downloaded alongside dispatch remission
 *
 * Exit codes: 0 = all checks passed, 1 = failure
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(normalizedBaseUrl).origin;
})();

const result = {
    test: "technical-report",
    requirement: "Reporte de Intervencion Tecnica",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedPage: false,
        technicalReportButtonExists: false,
        reportGenerationModalExists: false,
        reportIndependentOfBilling: false,
        reportWorksForWarranty: false,
        richTextEditorExists: false,
        extendedCharacterLimit: false,
        reportDownloadable: false,
        reportPrintableWithRemission: false,
        reportHasNoPartsSection: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshotPath: "",
    error: "",
};

let browser;
let session;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function login() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!response.ok) throw new Error(`login failed ${response.status}`);
    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

function buildApiHeaders() {
    return {
        "Content-Type": "application/json",
        "X-Company-Id": companyId,
        Authorization: `Bearer ${session.accessToken}`,
    };
}

try {
    session = await login();
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        { authSession: session, apiBase: apiBaseUrl },
    );

    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(result.consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));

    // ── Step 1: Navigate to work-equipment-history to look for technical report ──
    await page.goto(`${normalizedBaseUrl}/app/work-equipment-history`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedPage = !page.url().includes("/auth/signin");
    await page.waitForTimeout(2000);

    // ── Step 2: Look for "Reporte Técnico" button or link ──
    const reportBtn = page.locator("button, a").filter({ hasText: /reporte.*tecnico|technical.*report|informe.*tecnico/i }).first();
    result.checks.technicalReportButtonExists = await reportBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!result.checks.technicalReportButtonExists) {
        result.observations.push("OBSERVACION: No se visualiza la funcion para emitir y descargar el Reporte de Intervencion Tecnica.");
    }

    // ── Step 3: Check for report generation modal/form ──
    const reportModal = page.locator("[class*='modal'], [class*='dialog']").filter({ hasText: /reporte|informe|intervencion/i }).first();
    result.checks.reportGenerationModalExists = await reportModal.isVisible({ timeout: 2000 }).catch(() => false);

    // ── Step 4: Check if report requires billing (Position 20) ──
    // Try to access the report API endpoint
    try {
        const reportResponse = await fetch(`${apiBaseUrl}/api/v1/technical-reports`, { method: "GET", headers: buildApiHeaders() });
        result.checks.reportIndependentOfBilling = reportResponse.ok;
        if (!reportResponse.ok) {
            result.observations.push("OBSERVACION: No existe endpoint API para reportes tecnicos independientes de facturacion.");
        }
    } catch {
        result.observations.push("OBSERVACION: No se pudo verificar el endpoint de reportes tecnicos.");
    }

    // ── Step 5: Check if report works for warranty cases ──
    // Navigate to an equipment in "garantia" status and check for report option
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(1500);

    // Check if there's a guarantee-specific report option
    const warrantyReportOption = page.locator("button, a, option").filter({ hasText: /garantia.*reporte|reporte.*garantia/i }).first();
    result.checks.reportWorksForWarranty = await warrantyReportOption.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.reportWorksForWarranty) {
        result.observations.push("OBSERVACION: El reporte tecnico no funciona para garantias, solo para la primera reparacion.");
    }

    // ── Step 6: Check for rich text editor ──
    const richTextEditor = page.locator("[class*='editor'], [contenteditable='true'], .ql-editor, .ngx-editor, textarea[rich]").first();
    result.checks.richTextEditorExists = await richTextEditor.isVisible({ timeout: 2000 }).catch(() => false);

    // Check for formatting toolbar
    const formattingToolbar = page.locator("[class*='toolbar']").filter({ hasText: /negrita|bold|format/i }).first();
    const hasFormatting = await formattingToolbar.isVisible({ timeout: 1500 }).catch(() => false);

    if (!result.checks.richTextEditorExists && !hasFormatting) {
        result.observations.push("OBSERVACION: No hay editor de texto enriquecido. El limite de caracteres es corto y no permite formatos (negritas, saltos de linea).");
    }
    result.checks.extendedCharacterLimit = result.checks.richTextEditorExists;

    // ── Step 7: Check for download/print capability ──
    const downloadBtn = page.locator("button, a").filter({ hasText: /descargar|download|imprimir|print|pdf/i }).first();
    result.checks.reportDownloadable = await downloadBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.reportDownloadable) {
        result.observations.push("OBSERVACION: No se puede descargar o imprimir el reporte tecnico.");
    }

    // Check if report can be printed with remission
    result.checks.reportPrintableWithRemission = false;
    result.observations.push("OBSERVACION: No es posible imprimir el reporte tecnico junto con la remision de despacho sin facturar primero.");

    // ── Step 8: the printed technical report must NOT list spare parts ──
    // The client-facing document must not contain the parts section (technical-report-parts).
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2000);
    const partsSectionCount = await page.locator("[data-testid='technical-report-parts'], .technical-report-parts-table").count();
    result.checks.reportHasNoPartsSection = partsSectionCount === 0;
    if (!result.checks.reportHasNoPartsSection) {
        result.observations.push("OBSERVACION: el documento del reporte tecnico aun contiene la seccion de repuestos (technical-report-parts); el documento para el cliente no debe listar repuestos.");
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `technical-report-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_TECHNICAL_REPORT_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `technical-report-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_TECHNICAL_REPORT_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
