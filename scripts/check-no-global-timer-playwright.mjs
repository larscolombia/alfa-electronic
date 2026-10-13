/**
 * Playwright headless test — El temporizador global rojo fue eliminado de la interfaz
 *
 * Verifies:
 *  - No <app-global-timer-button> in the fixed topbar (nor anywhere) after login
 *  - No element with the red pulsing animation class (global-timer-btn-header / home-counter-btn)
 *  - No timer auto-starts: after 16s there is still no running counter text in the header
 *
 * Exit codes: 0 = all checks passed, 1 = failure
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = process.env.PW_API_BASE_URL
    ? String(process.env.PW_API_BASE_URL).replace(/\/+$/, "")
    : new URL(normalizedBaseUrl).origin;

const result = {
    test: "no-global-timer",
    requirement: "Eliminar el temporizador superior resaltado en rojo (cronometro global del topbar y del home)",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        noTimerInHeader: false,
        noTimerInDashboard: false,
        noAutoStartAfter16s: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshotPath: "",
    error: "",
};

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

let browser;

try {
    const loginRes = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!loginRes.ok) throw new Error(`login failed ${loginRes.status}`);
    const session = await loginRes.json();
    session.expiresAt = Date.now() + Math.max(Number(session.expiresIn || 3600), 1) * 1000;
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless });
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

    // ── Header on a working view ──
    await page.goto(`${normalizedBaseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2000);

    const headerTimer = await page.locator("nav.fixed-top app-global-timer-button, nav.fixed-top .global-timer-btn-header, nav.fixed-top .header-timer-wrap").count();
    result.checks.noTimerInHeader = headerTimer === 0;
    if (!result.checks.noTimerInHeader) {
        result.observations.push("OBSERVACION: aun existe el temporizador global en el topbar.");
    }

    // ── Dashboard home ──
    await page.goto(`${normalizedBaseUrl}/app/dashboard`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2000);
    const homeTimer = await page.locator("app-global-timer-button, .home-counter-btn").count();
    result.checks.noTimerInDashboard = homeTimer === 0;
    if (!result.checks.noTimerInDashboard) {
        result.observations.push("OBSERVACION: aun existe el boton contador en el home.");
    }

    // ── Wait past the old 15s auto-start: nothing should appear in the header ──
    await page.waitForTimeout(16000);
    const lateTimer = await page.locator("app-global-timer-button, .global-timer-btn-header, .home-counter-btn").count();
    const headerText = await page.locator("nav.fixed-top").textContent().catch(() => "") || "";
    result.checks.noAutoStartAfter16s = lateTimer === 0 && !/iniciar contador/i.test(headerText);
    if (!result.checks.noAutoStartAfter16s) {
        result.observations.push("OBSERVACION: aparecio un contador en el topbar despues de 16s (auto-arranque aun activo).");
    }

    const screenshotPath = path.resolve(artifactsDir, `no-global-timer-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
        console.error("PLAYWRIGHT_NO_GLOBAL_TIMER_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_NO_GLOBAL_TIMER_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    result.error = String(error?.stack || error);
    console.error("PLAYWRIGHT_NO_GLOBAL_TIMER_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
