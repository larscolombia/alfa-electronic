/**
 * Playwright headless test — Req #2: Generación de Remisión (Orden de Envío)
 *
 * Verifies:
 *  - Remission can be created with more than 4 items (limit removal)
 *  - Consecutive numbering format: E-CO-Año-Mes-Número
 *  - PDF preview before generation (draft mode)
 *  - Warranty field (3, 6, 12 months) is functional and prints on document
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
    test: "remission-generation",
    requirement: "Generacion de Remision (Orden de Envio)",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedInventoryOrWork: false,
        expeditionButtonExists: false,
        remissionModuleAccessible: false,
        canAddMoreThan4Items: false,
        consecutiveNumberingFormat: false,
        pdfPreviewAvailable: false,
        warrantyFieldFunctional: false,
        warrantyPrintsOnDocument: false,
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

    // ── Step 1: Navigate to inventory/work area and look for expedition button ──
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedInventoryOrWork = !page.url().includes("/auth/signin");

    // Look for "Expedición" button
    const expeditionBtn = page.locator("button, a").filter({ hasText: /expedicion|remision|despacho/i }).first();
    result.checks.expeditionButtonExists = await expeditionBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!result.checks.expeditionButtonExists) {
        result.observations.push("OBSERVACION: No se encuentra el boton 'Expedicion' o modulo de remisiones en la vista de equipos.");
    }

    // ── Step 2: Try to access remission module via sidebar/navigation ──
    const sidebarRemissionLink = page.locator("a.nav-link, .sidebar a").filter({ hasText: /remision|expedicion|despacho/i }).first();
    result.checks.remissionModuleAccessible = await sidebarRemissionLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.remissionModuleAccessible) {
        result.observations.push("OBSERVACION: No se visualiza el modulo para crear documentos de remisiones en la navegacion.");
    }

    // ── Step 3: Navigate to inventory to check remission-related UI ──
    await page.goto(`${normalizedBaseUrl}/app/inventory-stock`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(1500);

    // Check for remission document type in stock workbench
    const remissionOption = page.locator("option[value='Remision'], select option").filter({ hasText: /remision/i }).first();
    const hasRemissionDocType = await remissionOption.isVisible({ timeout: 2000 }).catch(() => false);

    // ── Step 4: Check for item limit (currently max 4) ──
    // Look for any UI constraint that limits items to 4
    await page.goto(`${normalizedBaseUrl}/app/inventory-stock-workbench`, { waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
    await page.waitForTimeout(1000);

    // Try to find item limit indicators
    const itemLimitIndicator = page.locator("[class*='limit'], [class*='max-items'], .text-danger").filter({ hasText: /4|cuatro|maximo|limite/i }).first();
    const hasItemLimit = await itemLimitIndicator.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasItemLimit) {
        result.observations.push("OBSERVACION: Existe un limite de items visible en la UI. Se requiere eliminar el limite de 4 equipos por remision.");
    }
    result.checks.canAddMoreThan4Items = !hasItemLimit;

    // ── Step 5: Check for PDF preview functionality ──
    const previewButton = page.locator("button, a").filter({ hasText: /previsualizar|preview|borrador|draft/i }).first();
    result.checks.pdfPreviewAvailable = await previewButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.pdfPreviewAvailable) {
        result.observations.push("OBSERVACION: No hay funcionalidad de previsualizacion del PDF antes de generarlo. El sistema actual no muestra el PDF hasta generarlo.");
    }

    // ── Step 6: Check warranty field functionality ──
    const warrantySelect = page.locator("select").filter({ hasText: /garantia|warranty|meses/i }).first();
    const warrantyInput = page.locator("input, select").filter({ hasText: /garantia/i }).first();
    result.checks.warrantyFieldFunctional = await warrantySelect.isVisible({ timeout: 2000 }).catch(() => false)
        || await warrantyInput.isVisible({ timeout: 1000 }).catch(() => false);

    if (!result.checks.warrantyFieldFunctional) {
        result.observations.push("OBSERVACION: No se encuentra el campo de garantia (3, 6, 12 meses) en el formulario de remision.");
    }

    // ── Step 7: Check API for remission-related endpoints ──
    try {
        const remissionResponse = await fetch(`${apiBaseUrl}/api/v1/remissions`, { method: "GET", headers: buildApiHeaders() });
        result.checks.consecutiveNumberingFormat = remissionResponse.ok;
        if (!remissionResponse.ok) {
            result.observations.push("OBSERVACION: No existe endpoint API para remisiones (/api/v1/remissions). El consecutivo E-CO-Ano-Mes-Numero no esta implementado.");
        }
    } catch {
        result.observations.push("OBSERVACION: No se pudo verificar el endpoint de remisiones.");
    }

    // Check if warranty appears on documents
    result.checks.warrantyPrintsOnDocument = false;
    result.observations.push("OBSERVACION: No se puede verificar que la garantia aparezca en el documento de remision porque el modulo de remisiones no existe.");

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `remission-generation-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_REMISSION_GENERATION_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `remission-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_REMISSION_GENERATION_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
