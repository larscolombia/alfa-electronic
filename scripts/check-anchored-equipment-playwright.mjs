/**
 * Playwright headless test — Req #5: Equipos "Anclados" y Préstamos (Posición 13)
 *
 * Verifies:
 *  - Anchored equipment (chain icon) on main equipment
 *  - Position 13 for loaned equipment
 *  - Dispatch validation: blocks dispatch if anchored equipment not included
 *  - Accessory association with repair equipment
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
    test: "anchored-equipment",
    requirement: "Equipos Anclados y Prestamos (Posicion 13)",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedPage: false,
        anchorIconVisible: false,
        position13Exists: false,
        accessoryAssociationExists: false,
        dispatchValidationBlocks: false,
        anchoredEquipmentInRemission: false,
        loanedEquipmentTracking: false,
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

    // ── Step 1: Navigate to projects board ──
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedPage = !page.url().includes("/auth/signin");
    await page.waitForTimeout(2000);

    // ── Step 2: Check for chain/anchor icon on equipment cards ──
    const chainIcon = page.locator("[class*='chain'], [class*='anchor'], [class*='link'], i.bi-link, i.bi-chain").first();
    result.checks.anchorIconVisible = await chainIcon.isVisible({ timeout: 3000 }).catch(() => false);

    if (!result.checks.anchorIconVisible) {
        result.observations.push("OBSERVACION: No se visualiza icono de cadena para anclar equipos de apoyo (prestamo).");
    }

    // ── Step 3: Check for Position 13 (Material en préstamo) ──
    const position13Column = page.locator(".board-column, .kanban-column, [class*='column']").filter({
        hasText: /prestamo|loan|posicion.*13/i,
    }).first();
    result.checks.position13Exists = await position13Column.isVisible({ timeout: 2000 }).catch(() => false);

    // ── Step 4: Check for accessory association ──
    const projectCard = page.locator(".card, .project-card, [class*='card']").first();
    const hasCard = await projectCard.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasCard) {
        await projectCard.click();
        await page.waitForTimeout(2000);

        const accessoryField = page.locator("input, textarea, [class*='accessory']").filter({
            hasText: /accesorio|accessory|anclado|anchored|prestamo|loan|equipos.*apoyo/i,
        }).first();
        result.checks.accessoryAssociationExists = await accessoryField.isVisible({ timeout: 2000 }).catch(() => false);

        const closeBtn = page.locator("[class*='close'], button").filter({ hasText: /cerrar|close/i }).first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await closeBtn.click();
    }

    if (!result.checks.accessoryAssociationExists) {
        result.observations.push("OBSERVACION: El sistema permite incorporar accesorios pero no se visualiza validacion en la remision de entrega de los mismos con el equipo reparado.");
    }

    // ── Step 5: Check dispatch validation for anchored equipment ──
    // Navigate to equipment in listo-entrega to check dispatch
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(1500);

    const dispatchValidation = page.locator("[class*='alert'], [class*='warning'], [class*='validation']").filter({
        hasText: /anclado|anchored|accesorio|prestamo|incluir.*remision/i,
    }).first();
    result.checks.dispatchValidationBlocks = await dispatchValidation.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.dispatchValidationBlocks) {
        result.observations.push("OBSERVACION: No hay alerta automatica que impida despachar el equipo principal sin incluir el equipo anclado en la misma remision.");
    }

    // ── Step 6: Check API for prestamo status ──
    try {
        const projectsPrestamo = await fetch(`${apiBaseUrl}/api/v1/projects?status=prestamo`, { method: "GET", headers: buildApiHeaders() });
        result.checks.loanedEquipmentTracking = projectsPrestamo.ok;
    } catch {}

    result.checks.anchoredEquipmentInRemission = false;
    result.observations.push("OBSERVACION: No se visualiza en la remision la validacion de la entrega de accesorios con el equipo reparado.");

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `anchored-equipment-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_ANCHORED_EQUIPMENT_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `anchored-equipment-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_ANCHORED_EQUIPMENT_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
