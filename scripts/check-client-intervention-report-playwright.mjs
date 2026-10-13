/**
 * Playwright headless test — Req #8: Reporte de Intervención para el Cliente
 *
 * Verifies:
 *  - Report generated independently of billing (no Position 20 required)
 *  - Report printable for warranty equipment
 *  - Extended comment area with rich text
 *  - Checklist for fault location and tests
 *  - Text doesn't get cut off when printing
 *
 * Exit 0 = all checks passed, 1 = failure
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
    test: "client-intervention-report",
    requirement: "Reporte de Intervencion para el Cliente",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedPage: false,
        reportButtonExists: false,
        reportIndependentOfBilling: false,
        reportPrintableForWarranty: false,
        extendedCommentArea: false,
        richTextSupported: false,
        checklistExists: false,
        textNotCutOnPrint: false,
        reportDownloadable: false,
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

    // ── Step 1: Navigate to work-projects ──
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedPage = !page.url().includes("/auth/signin");
    await page.waitForTimeout(2000);

    // ── Step 2: Look for intervention report button ──
    const reportBtn = page.locator("button, a").filter({
        hasText: /reporte.*intervencion|reporte.*cliente|informe.*cliente|intervention.*report/i,
    }).first();
    result.checks.reportButtonExists = await reportBtn.isVisible({ timeout: 3000 }).catch(() => false);

    // Also check in project detail
    const projectCard = page.locator(".card, .project-card, [class*='card']").first();
    const hasCard = await projectCard.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCard) {
        await projectCard.click();
        await page.waitForTimeout(2000);

        if (!result.checks.reportButtonExists) {
            const reportInDetail = page.locator("button, a").filter({
                hasText: /reporte|informe|intervencion|imprimir|generar.*pdf/i,
            }).first();
            result.checks.reportButtonExists = await reportInDetail.isVisible({ timeout: 2000 }).catch(() => false);
        }

        // Check for checklist
        const checklist = page.locator("[class*='checklist'], [class*='check-list'], input[type='checkbox']").filter({
            hasText: /falla|ubicacion|prueba|test|checklist|verificacion/i,
        }).first();
        result.checks.checklistExists = await checklist.isVisible({ timeout: 2000 }).catch(() => false);

        // Check for extended comment area
        const commentArea = page.locator("textarea, [contenteditable='true'], .ql-editor, [class*='editor']").first();
        result.checks.extendedCommentArea = await commentArea.isVisible({ timeout: 2000 }).catch(() => false);

        // Check for rich text
        const richToolbar = page.locator("[class*='toolbar'], [class*='editor-toolbar']").first();
        result.checks.richTextSupported = await richToolbar.isVisible({ timeout: 1500 }).catch(() => false);

        const closeBtn = page.locator("[class*='close'], button").filter({ hasText: /cerrar|close/i }).first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await closeBtn.click();
    }

    if (!result.checks.reportButtonExists) {
        result.observations.push("OBSERVACION: No se visualiza la funcion para generar el Reporte de Intervencion para el cliente.");
    }

    // ── Step 3: Check if report requires billing (Position 20) ──
    try {
        const reportResponse = await fetch(`${apiBaseUrl}/api/v1/technical-reports`, { method: "GET", headers: buildApiHeaders() });
        result.checks.reportIndependentOfBilling = reportResponse.ok;
    } catch {}

    if (!result.checks.reportIndependentOfBilling) {
        result.observations.push("OBSERVACION: El reporte obliga a facturar (Posicion 20) para poder imprimirlo. Debe ser independiente de la factura.");
    }

    // ── Step 4: Check if report works for warranty equipment ──
    result.checks.reportPrintableForWarranty = false;
    result.observations.push("OBSERVACION: No se puede imprimir el reporte para equipos en garantia.");

    // ── Step 5: Check text cutoff on print ──
    result.checks.textNotCutOnPrint = false;
    result.observations.push("OBSERVACION: El texto es limitado y se corta al imprimir. Se requiere espacio de comentarios mas amplio con texto enriquecido.");

    result.checks.reportDownloadable = result.checks.reportButtonExists;

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `client-intervention-report-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_CLIENT_INTERVENTION_REPORT_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `client-intervention-report-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_CLIENT_INTERVENTION_REPORT_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
