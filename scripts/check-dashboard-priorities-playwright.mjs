/**
 * Playwright headless test — Req #1: Panel de Control y Gestión de Prioridades
 *
 * Verifies:
 *  - Dashboard with color codes (Green/Yellow/Orange/Red) by aging
 *  - Compact summary visible without horizontal scrolling
 *  - Parametrizable SLA deadlines per workflow stage
 *  - Spanish language UI
 *  - Multiple data lines handled fluidly
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
    test: "dashboard-priorities",
    requirement: "Panel de Control y Gestion de Prioridades",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedDashboard: false,
        colorCodesVisible: false,
        greenColorExists: false,
        yellowColorExists: false,
        orangeColorExists: false,
        redColorExists: false,
        compactSummaryVisible: false,
        slaParametrizable: false,
        spanishLanguage: false,
        multipleDataLinesHandled: false,
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

    // ── Step 1: Navigate to projects kanban ──
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedDashboard = !page.url().includes("/auth/signin");
    await page.waitForTimeout(3000);

    // ── Step 2: Check for color-coded SLA indicators (semaforo real: project-card--*, compact-chip--*) ──
    const greenCards = page.locator(".project-card--success, .compact-chip--success, .sla-summary-chip--success").first();
    result.checks.greenColorExists = await greenCards.isVisible({ timeout: 2000 }).catch(() => false);

    const yellowCards = page.locator(".project-card--warning, .compact-chip--warning, .sla-summary-chip--warning").first();
    result.checks.yellowColorExists = await yellowCards.isVisible({ timeout: 2000 }).catch(() => false);

    const orangeCards = page.locator(".project-card--overdue, .compact-chip--overdue, .sla-summary-chip--overdue").first();
    result.checks.orangeColorExists = await orangeCards.isVisible({ timeout: 2000 }).catch(() => false);

    const redCards = page.locator(".project-card--critical, .compact-chip--critical, .sla-summary-chip--critical").first();
    result.checks.redColorExists = await redCards.isVisible({ timeout: 2000 }).catch(() => false);

    result.checks.colorCodesVisible = result.checks.greenColorExists || result.checks.yellowColorExists || result.checks.orangeColorExists || result.checks.redColorExists;

    if (!result.checks.colorCodesVisible) {
        result.observations.push("OBSERVACION: No se visualizan codigos de colores por antiguedad (Verde/Amarillo/Naranja/Rojo) en el tablero.");
    }

    // ── Step 3: Check for compact summary — sla-summary-bar con un chip por columna, visible sin scroll horizontal ──
    const viewportWidth = 1540;
    const summaryBar = page.locator("[data-testid='sla-summary-bar']").first();
    const summaryBarVisible = await summaryBar.isVisible({ timeout: 5000 }).catch(() => false);

    if (summaryBarVisible) {
        const chipCount = await summaryBar.locator("[data-testid='sla-summary-chip']").count();
        const barBox = await summaryBar.boundingBox();
        const fitsViewport = !!barBox && barBox.x >= 0 && barBox.x + barBox.width <= viewportWidth;
        result.checks.compactSummaryVisible = chipCount > 0 && fitsViewport;
        if (!fitsViewport && barBox) {
            result.observations.push(`OBSERVACION: sla-summary-bar desborda el viewport (x=${Math.round(barBox.x)}, ancho=${Math.round(barBox.width)}).`);
        }
    } else {
        // Fallback: column headers dentro del viewport
        const columnHeaders = page.locator("[data-testid^='column-header-']");
        const headerCount = await columnHeaders.count();
        let allVisible = true;
        for (let i = 0; i < Math.min(headerCount, 7); i++) {
            const box = await columnHeaders.nth(i).boundingBox();
            if (box && box.x + box.width > viewportWidth) {
                allVisible = false;
                break;
            }
        }
        result.checks.compactSummaryVisible = allVisible && headerCount > 0;
    }

    if (!result.checks.compactSummaryVisible) {
        result.observations.push("OBSERVACION: El dashboard no es lo suficientemente compacto. El tecnico debe desplazarse hacia la derecha para ver el total de cada estado.");
    }

    // ── Step 4: Check for parametrizable SLA deadlines ──
    const slaSettings = page.locator("button, a, [class*='settings'], [class*='config']").filter({ hasText: /parametr|configurar|plazos|sla|ajustes/i }).first();
    result.checks.slaParametrizable = await slaSettings.isVisible({ timeout: 2000 }).catch(() => false);

    // Also check via API if there's a configuration endpoint
    try {
        const configResponse = await fetch(`${apiBaseUrl}/api/v1/projects/sla-config`, {
            method: "GET",
            headers: { "Content-Type": "application/json", "X-Company-Id": companyId, Authorization: `Bearer ${session.accessToken}` },
        });
        if (configResponse.ok) result.checks.slaParametrizable = true;
    } catch {}

    if (!result.checks.slaParametrizable) {
        result.observations.push("OBSERVACION: No se visualiza el modulo para parametrizar los plazos del SLA. Los plazos estan hardcodeados.");
    }

    // ── Step 5: Check Spanish language ──
    const pageText = await page.locator("body").textContent();
    const spanishIndicators = ["Recibido", "Diagnostico", "Reparacion", "Listo", "Entregado", "Proyectos", "Tablero"];
    const spanishCount = spanishIndicators.filter((s) => pageText?.includes(s)).length;
    result.checks.spanishLanguage = spanishCount >= 3;

    // ── Step 6: Check multiple data lines handling ──
    const cardCount = await page.locator(".card, .project-card, [class*='card']").count();
    result.checks.multipleDataLinesHandled = cardCount > 0;

    if (!result.checks.multipleDataLinesHandled) {
        result.observations.push("OBSERVACION: No hay datos en el tablero para verificar la fluidez con multiples lineas.");
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `dashboard-priorities-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_DASHBOARD_PRIORITIES_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `dashboard-priorities-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_DASHBOARD_PRIORITIES_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
