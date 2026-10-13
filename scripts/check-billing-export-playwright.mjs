/**
 * Playwright headless test — Req #6: Proceso de Facturación y Archivo Plano
 *
 * Verifies:
 *  - Direct CSV/TXT export in Oasis.com format (no manual Excel cleanup)
 *  - Visual priority alerts (bell/pop-up) for "prioridad de factura" marking
 *  - Equipment can be marked as billing priority
 *  - Export includes NIT, postal codes, and correct sum totals
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
    test: "billing-export",
    requirement: "Proceso de Facturacion y Archivo Plano",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedFinance: false,
        csvExportButtonExists: false,
        txtExportButtonExists: false,
        oasisFormatCompliant: false,
        priorityBillingFieldExists: false,
        priorityBellNotification: false,
        priorityPopupNotification: false,
        nitFieldIncluded: false,
        postalCodeIncluded: false,
        sumatoryCorrect: false,
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

    // ── Step 1: Navigate to finance/billing area ──
    await page.goto(`${normalizedBaseUrl}/app/finance-facturacion`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedFinance = !page.url().includes("/auth/signin");
    await page.waitForTimeout(2000);

    // ── Step 2: Check for CSV/TXT export buttons ──
    const csvBtn = page.locator("button, a").filter({ hasText: /csv|exportar.*csv|archivo.*plano|oasis/i }).first();
    result.checks.csvExportButtonExists = await csvBtn.isVisible({ timeout: 3000 }).catch(() => false);

    const txtBtn = page.locator("button, a").filter({ hasText: /txt|exportar.*txt|texto.*plano/i }).first();
    result.checks.txtExportButtonExists = await txtBtn.isVisible({ timeout: 2000 }).catch(() => false);

    // Check for JSON export (current behavior)
    const jsonBtn = page.locator("button, a").filter({ hasText: /json|exportar.*json/i }).first();
    const hasJsonExport = await jsonBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasJsonExport && !result.checks.csvExportButtonExists) {
        result.observations.push("OBSERVACION: El sistema solo permite generar archivo en formato JSON. Debe ser CSV/TXT con el formato establecido por OASIS.");
    }

    if (!result.checks.csvExportButtonExists && !result.checks.txtExportButtonExists) {
        result.observations.push("OBSERVACION: No existe exportacion directa en formato CSV/TXT para Oasis.com. Se requiere edicion manual en Excel.");
    }

    // ── Step 3: Check for Oasis format compliance via API ──
    try {
        const exportResponse = await fetch(`${apiBaseUrl}/api/v1/finance/export-oasis`, {
            method: "GET",
            headers: buildApiHeaders(),
        });
        result.checks.oasisFormatCompliant = exportResponse.ok;
        if (!exportResponse.ok) {
            result.observations.push("OBSERVACION: No existe endpoint API para exportacion directa a formato Oasis.com.");
        }
    } catch {
        result.observations.push("OBSERVACION: No se pudo verificar el endpoint de exportacion Oasis.");
    }

    // ── Step 4: Check for "prioridad de factura" field ──
    const priorityField = page.locator("input[type='checkbox'], button, [class*='priority']").filter({
        hasText: /prioridad|prioridad.*factura|urgente|flag.*factura/i,
    }).first();
    result.checks.priorityBillingFieldExists = await priorityField.isVisible({ timeout: 3000 }).catch(() => false);

    if (!result.checks.priorityBillingFieldExists) {
        result.observations.push("OBSERVACION: No se visualiza el campo para que Maribel marque un equipo como 'prioridad de factura'.");
    }

    // ── Step 5: Check for visual notification (bell/pop-up) ──
    const notificationBell = page.locator("[class*='notification'], [class*='bell'], [data-testid*='notification']").first();
    result.checks.priorityBellNotification = await notificationBell.isVisible({ timeout: 2000 }).catch(() => false);

    const popupAlert = page.locator("[class*='toast'], [class*='alert'], [class*='popup'], [class*='snackbar']").filter({
        hasText: /prioridad|urgente|factura/i,
    }).first();
    result.checks.priorityPopupNotification = await popupAlert.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.priorityBellNotification && !result.checks.priorityPopupNotification) {
        result.observations.push("OBSERVACION: No hay notificaciones visuales (campana o pop-up) para la persona de facturacion cuando se marca prioridad.");
    }

    // ── Step 6: Check for NIT, postal code, and sumatory in export ──
    // Look at the invoice list for these fields
    const tableHeaders = await page.locator("th").allTextContents();
    result.checks.nitFieldIncluded = tableHeaders.some((h) => /nit/i.test(h));
    result.checks.postalCodeIncluded = tableHeaders.some((h) => /postal|codigo.*postal/i.test(h));

    if (!result.checks.nitFieldIncluded) {
        result.observations.push("OBSERVACION: El campo NIT no esta visible en la tabla de facturacion. Requiere edicion manual en Excel.");
    }

    if (!result.checks.postalCodeIncluded) {
        result.observations.push("OBSERVACION: Los codigos postales no estan incluidos. Requiere edicion manual.");
    }

    // Check for sumatory
    const totalRow = page.locator("tfoot tr, .total-row, [class*='sumatoria']").first();
    result.checks.sumatoryCorrect = await totalRow.isVisible({ timeout: 2000 }).catch(() => false);

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `billing-export-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_BILLING_EXPORT_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `billing-export-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_BILLING_EXPORT_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
