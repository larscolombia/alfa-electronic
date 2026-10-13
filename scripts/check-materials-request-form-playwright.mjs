/**
 * Playwright headless test — Solicitud de materiales/repuestos (kanban proyecto)
 *
 * Verifies (pedido del usuario "Materiales y Reporte Tecnico"):
 *  - El formulario de solicitud de repuestos NO tiene campo "Motivo" por repuesto
 *  - La prioridad por defecto es "critica" (maxima prioridad)
 *  - La fecha compromiso por defecto esta establecida (fecha compromiso del proyecto o manana = plazo 1 dia)
 *  - El plazo de entrega de la solicitud de compra por defecto es 1 dia
 *  - No existe la seccion de repuestos del reporte tecnico impreso (technical-report-parts)
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
    test: "materials-request-form",
    requirement: "Sin campo Motivo por repuesto, prioridad critica y plazo 1 dia por defecto, reporte tecnico sin repuestos",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        kanbanLoaded: false,
        detailOpened: false,
        materialesTabOpened: false,
        noMotivoField: false,
        priorityDefaultCritica: false,
        commitmentDateDefaultSet: false,
        purchaseLeadTimeDefault1: false,
        noTechnicalReportPartsSection: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshotPath: "",
    error: "",
};

let browser;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

function toDateInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
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
    const session = await login();
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

    // ── Step 1: open the kanban board ──
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForSelector(".kanban-board", { timeout: timeoutMs }).catch(() => {});
    result.checks.kanbanLoaded = await page.locator(".kanban-board").isVisible().catch(() => false);
    if (!result.checks.kanbanLoaded) throw new Error("el tablero kanban no cargo");

    // ── Step 2: open the first project card ──
    const firstCard = page.locator(".project-card").first();
    if ((await page.locator(".project-card").count()) === 0) {
        throw new Error("no hay fichas de proyecto en el tablero (dato de entorno)");
    }
    await firstCard.click();
    await page.waitForSelector(".project-detail-dialog", { state: "visible", timeout: 20000 });
    await page.waitForFunction(
        () => (document.querySelector(".project-detail-dialog__title")?.textContent?.trim() || "").length > 0,
        { timeout: 20000 },
    );
    result.checks.detailOpened = true;

    // ── Step 3: open the "Materiales" tab ──
    const materialesTab = page.locator(".project-detail-dialog .nav-link", { hasText: "Materiales" }).first();
    await materialesTab.click();
    await page.waitForTimeout(1000);
    const materialesH4 = page.locator(".project-detail-dialog h4", { hasText: "Materiales y repuestos" });
    result.checks.materialesTabOpened = (await materialesH4.count()) > 0;
    if (!result.checks.materialesTabOpened) throw new Error("la pestana Materiales no renderizo su contenido");

    const dialog = page.locator(".project-detail-dialog");

    // ── Step 4: there is NO "Motivo" field per spare part ──
    const motivoLabels = await dialog.locator(".project-detail-field__label").filter({ hasText: /motivo/i }).count();
    result.checks.noMotivoField = motivoLabels === 0;
    if (!result.checks.noMotivoField) {
        result.observations.push("OBSERVACION: aun existe un campo 'Motivo' en el formulario de solicitud de materiales.");
    }

    // ── Step 5: priority defaults to "critica" ──
    const priorityField = dialog.locator(".project-detail-field").filter({ hasText: "Prioridad" }).first();
    const priorityValue = await priorityField.locator("select").inputValue().catch(() => "");
    result.checks.priorityDefaultCritica = priorityValue === "critica";
    if (!result.checks.priorityDefaultCritica) {
        result.observations.push(`OBSERVACION: la prioridad por defecto es '${priorityValue}' (se esperaba 'critica').`);
    }

    // ── Step 6: commitment date is set by default (project due date or tomorrow = 1 day) ──
    const commitmentField = dialog.locator(".project-detail-field").filter({ hasText: "Fecha compromiso" }).first();
    const commitmentValue = await commitmentField.locator("input[type='date']").inputValue().catch(() => "");
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(commitmentValue);
    const notInPast = validFormat && commitmentValue >= toDateInputValue(today);
    result.checks.commitmentDateDefaultSet = validFormat && notInPast;
    if (!result.checks.commitmentDateDefaultSet) {
        result.observations.push(`OBSERVACION: la fecha compromiso por defecto es '${commitmentValue}' (se esperaba manana ${toDateInputValue(tomorrow)} o la fecha compromiso del proyecto).`);
    }

    // ── Step 7: purchase request lead time defaults to 1 day ──
    // The section may live in another tab; search all tabs for "Solicitar compra de repuesto".
    let leadTimeValue = "";
    const navLinks = dialog.locator(".nav-link");
    const navCount = await navLinks.count();
    for (let i = 0; i < navCount; i++) {
        const section = dialog.locator("h4", { hasText: "Solicitar compra de repuesto" });
        if ((await section.count()) > 0 && (await section.first().isVisible().catch(() => false))) {
            const leadField = dialog.locator(".project-detail-field").filter({ hasText: "Plazo entrega (dias)" }).first();
            leadTimeValue = await leadField.locator("input[type='number']").inputValue().catch(() => "");
            break;
        }
        if (i + 1 < navCount) {
            await navLinks.nth(i + 1).click().catch(() => {});
            await page.waitForTimeout(600);
        }
    }
    result.checks.purchaseLeadTimeDefault1 = leadTimeValue === "1";
    if (!result.checks.purchaseLeadTimeDefault1) {
        result.observations.push(`OBSERVACION: el plazo de entrega por defecto de la solicitud de compra es '${leadTimeValue}' (se esperaba '1').`);
    }

    // ── Step 8: no technical-report-parts section anywhere (printed report must not list parts) ──
    const partsCount = await page.locator("[data-testid='technical-report-parts'], .technical-report-parts-table").count();
    result.checks.noTechnicalReportPartsSection = partsCount === 0;
    if (!result.checks.noTechnicalReportPartsSection) {
        result.observations.push("OBSERVACION: el reporte tecnico aun contiene la seccion de repuestos (technical-report-parts).");
    }

    const screenshotPath = path.resolve(artifactsDir, `materials-request-form-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
        console.error("PLAYWRIGHT_MATERIALS_REQUEST_FORM_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_MATERIALS_REQUEST_FORM_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `materials-request-form-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_MATERIALS_REQUEST_FORM_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
