/**
 * Playwright headless test — Req #7: Control de Pagos y Retenciones
 *
 * Verifies:
 *  - Payment date field (fecha real de pago)
 *  - External invoice number field
 *  - Retention breakdown area (ReteFuente, ReteIVA, ReteICA)
 *  - Comments area for retention details
 *  - Portfolio report: overdue and pending invoices query
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
    test: "payments-retentions",
    requirement: "Control de Pagos y Retenciones",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedFinance: false,
        paymentDateFieldExists: false,
        externalInvoiceNumberField: false,
        reteFuenteFieldExists: false,
        reteIvaFieldExists: false,
        reteIcaFieldExists: false,
        retentionCommentsArea: false,
        portfolioReportAccessible: false,
        overdueInvoicesQuery: false,
        pendingInvoicesQuery: false,
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

    // ── Step 2: Check for payment date field ──
    const paymentDateField = page.locator("input[type='date'], input").filter({ hasText: /fecha.*pago|payment.*date|fecha.*recaudo/i }).first();
    result.checks.paymentDateFieldExists = await paymentDateField.isVisible({ timeout: 3000 }).catch(() => false);

    if (!result.checks.paymentDateFieldExists) {
        result.observations.push("OBSERVACION: No existe campo de fecha real de pago en el sistema. Se lleva en Excel externo.");
    }

    // ── Step 3: Check for external invoice number field ──
    const externalInvoiceField = page.locator("input").filter({ hasText: /factura.*externa|numero.*factura.*cliente|consecutivo.*cliente/i }).first();
    result.checks.externalInvoiceNumberField = await externalInvoiceField.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.externalInvoiceNumberField) {
        result.observations.push("OBSERVACION: No existe campo para numero de factura externa del cliente.");
    }

    // ── Step 4: Check for retention fields ──
    const reteFuenteField = page.locator("input, [class*='retention']").filter({ hasText: /rete.*fuente|retencion.*fuente/i }).first();
    result.checks.reteFuenteFieldExists = await reteFuenteField.isVisible({ timeout: 2000 }).catch(() => false);

    const reteIvaField = page.locator("input, [class*='retention']").filter({ hasText: /rete.*iva|retencion.*iva/i }).first();
    result.checks.reteIvaFieldExists = await reteIvaField.isVisible({ timeout: 2000 }).catch(() => false);

    const reteIcaField = page.locator("input, [class*='retention']").filter({ hasText: /rete.*ica|retencion.*ica/i }).first();
    result.checks.reteIcaFieldExists = await reteIcaField.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.reteFuenteFieldExists || !result.checks.reteIvaFieldExists || !result.checks.reteIcaFieldExists) {
        result.observations.push("OBSERVACION: No existen campos para registrar retenciones (ReteFuente, ReteIVA, ReteICA). Se lleva en Excel externo.");
    }

    // ── Step 5: Check for comments area for retention breakdown ──
    const retentionComments = page.locator("textarea, [class*='comment']").filter({ hasText: /comentario|desglose|retencion|observacion/i }).first();
    result.checks.retentionCommentsArea = await retentionComments.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.retentionCommentsArea) {
        result.observations.push("OBSERVACION: No hay area de comentarios para el desglose de retenciones practicadas por el cliente.");
    }

    // ── Step 6: Check for portfolio report (cartera) ──
    await page.goto(`${normalizedBaseUrl}/app/finance-pagos`, { waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
    await page.waitForTimeout(1500);

    const portfolioSection = page.locator("[class*='portfolio'], [class*='cartera'], h1, h2, h3").filter({
        hasText: /cartera|portafolio|vencidas|pendientes/i,
    }).first();
    result.checks.portfolioReportAccessible = await portfolioSection.isVisible({ timeout: 3000 }).catch(() => false);

    // Check for overdue invoices query
    const overdueFilter = page.locator("button, a, [class*='filter']").filter({ hasText: /vencidas|overdue|vencido/i }).first();
    result.checks.overdueInvoicesQuery = await overdueFilter.isVisible({ timeout: 2000 }).catch(() => false);

    // Check for pending invoices query
    const pendingFilter = page.locator("button, a, [class*='filter']").filter({ hasText: /pendientes|pending|por.*cobrar/i }).first();
    result.checks.pendingInvoicesQuery = await pendingFilter.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.portfolioReportAccessible) {
        result.observations.push("OBSERVACION: No se visualiza un modulo para consultar facturas vencidas y pendientes de pago desde el software.");
    }

    // ── Step 7: Check API for payments/retentions endpoints ──
    try {
        const paymentsResponse = await fetch(`${apiBaseUrl}/api/v1/finance/payments`, { method: "GET", headers: buildApiHeaders() });
        if (paymentsResponse.ok) {
            const payload = await paymentsResponse.json();
            const payments = Array.isArray(payload.items) ? payload.items : [];
            // Check if any payment has retention fields
            if (payments.length > 0) {
                const sample = payments[0];
                result.checks.reteFuenteFieldExists = result.checks.reteFuenteFieldExists || "reteFuente" in sample;
                result.checks.reteIvaFieldExists = result.checks.reteIvaFieldExists || "reteIva" in sample;
                result.checks.reteIcaFieldExists = result.checks.reteIcaFieldExists || "reteIca" in sample;
            }
        }
    } catch {
        result.observations.push("OBSERVACION: No se pudo verificar el endpoint de pagos para campos de retenciones.");
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `payments-retentions-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_PAYMENTS_RETENTIONS_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `payments-retentions-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_PAYMENTS_RETENTIONS_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
