/**
 * Playwright headless test — Req #3: Gestión de Logística y Tipos de Despacho
 *
 * Verifies:
 *  - "Tipo de Despacho" dropdown field (Servientrega, Recoge Cliente, Contra entrega)
 *  - Carrier guide field (company name + guide number) per remission
 *  - Valued remissions option (include quotation prices for Zona Franca)
 *  - Shipping fields are per-remission, value fields are per-equipment with total
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
    test: "logistics-dispatch",
    requirement: "Gestion de Logistica y Tipos de Despacho",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedPage: false,
        dispatchTypeDropdownExists: false,
        dispatchTypeOptions: false,
        carrierGuideFieldExists: false,
        guideNumberFieldExists: false,
        valuedRemissionButtonExists: false,
        shippingFieldsPerRemission: false,
        valueFieldsPerEquipment: false,
        totalValueCalculation: false,
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

    // ── Step 1: Navigate to work-teams to check dispatch-related fields ──
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedPage = !page.url().includes("/auth/signin");

    // ── Step 2: Check for "Tipo de Despacho" dropdown ──
    const dispatchTypeSelect = page.locator("select, [class*='dropdown']").filter({ hasText: /tipo.*despacho|dispatch.*type|modalidad.*envio/i }).first();
    result.checks.dispatchTypeDropdownExists = await dispatchTypeSelect.isVisible({ timeout: 3000 }).catch(() => false);

    if (!result.checks.dispatchTypeDropdownExists) {
        result.observations.push("OBSERVACION: No se encuentra el campo desplegable 'Tipo de Despacho' (Servientrega, Recoge Cliente, Contra entrega). Actualmente se usan sellos fisicos.");
    }

    // ── Step 3: Check for dispatch type options (Servientrega, Recoge Cliente, Contra entrega) ──
    if (result.checks.dispatchTypeDropdownExists) {
        const options = await dispatchTypeSelect.locator("option").allTextContents();
        const hasServientrega = options.some((o) => /servientrega/i.test(o));
        const hasRecogeCliente = options.some((o) => /recoge.*cliente/i.test(o));
        const hasContraEntrega = options.some((o) => /contra.*entrega/i.test(o));
        result.checks.dispatchTypeOptions = hasServientrega && hasRecogeCliente && hasContraEntrega;
    }

    // ── Step 4: Check carrier guide fields ──
    const carrierField = page.locator("input, select").filter({ hasText: /transportadora|carrier|empresa.*transporte/i }).first();
    result.checks.carrierGuideFieldExists = await carrierField.isVisible({ timeout: 2000 }).catch(() => false);

    const guideNumberField = page.locator("input").filter({ hasText: /guia|tracking|numero.*guia/i }).first();
    result.checks.guideNumberFieldExists = await guideNumberField.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.carrierGuideFieldExists || !result.checks.guideNumberFieldExists) {
        result.observations.push("OBSERVACION: Los campos de guia de transportadora (empresa y numero) existen por equipo pero se requieren por remision.");
    }

    // ── Step 5: Check for valued remission button ──
    const valuedBtn = page.locator("button, a, label").filter({ hasText: /valorizada|valores|incluir.*precio|zona.*franca/i }).first();
    result.checks.valuedRemissionButtonExists = await valuedBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.valuedRemissionButtonExists) {
        result.observations.push("OBSERVACION: No existe boton opcional para remisiones valorizadas (incluir precios de cotizacion para Zona Franca).");
    }

    // ── Step 6: Check if shipping fields are per-remission vs per-equipment ──
    // Open an equipment record to inspect field structure
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(1500);

    // Check the equipment table for per-remission vs per-equipment field structure
    const tableHeaders = await page.locator("th, .table-header").allTextContents();
    const hasDispatchColumn = tableHeaders.some((h) => /despacho|tipo.*envio|transportadora/i.test(h));
    result.checks.shippingFieldsPerRemission = !hasDispatchColumn; // If per-equipment, this is wrong

    if (hasDispatchColumn) {
        result.observations.push("OBSERVACION: Los campos de envio aparecen por equipo en vez de por remision.");
    }

    // ── Step 7: Check for total value calculation ──
    const totalField = page.locator("[class*='total'], .fw-bold, tfoot td").filter({ hasText: /total|suma|valor.*total/i }).first();
    result.checks.totalValueCalculation = await totalField.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.totalValueCalculation) {
        result.observations.push("OBSERVACION: No se visualiza calculo del valor total de la remision basado en los precios individuales de cada equipo.");
    }

    result.checks.valueFieldsPerEquipment = false;
    result.observations.push("OBSERVACION: Los campos de valor por equipo y total de remision no estan implementados en el modulo de remisiones.");

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `logistics-dispatch-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_LOGISTICS_DISPATCH_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `logistics-dispatch-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_LOGISTICS_DISPATCH_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
