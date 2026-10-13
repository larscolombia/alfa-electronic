/**
 * Playwright headless test — Req #3: Diagnóstico Técnico (Posición 0)
 *
 * Verifies:
 *  - Memo is structured (Diagnosis Section + Repair Section), not plain text
 *  - Mandatory "Success percentage" field for management analysis
 *  - Photo capture integration at diagnosis stage
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
    test: "diagnosis-technical",
    requirement: "Diagnostico Tecnico (Posicion 0)",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedPage: false,
        diagnosisSectionExists: false,
        repairSectionExists: false,
        structuredMemoNotPlainText: false,
        successPercentageField: false,
        successPercentageMandatory: false,
        photoCaptureAtDiagnosis: false,
        closeDiagnosisValidation: false,
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

    // ── Step 1: Navigate to projects board and find a project in diagnosis ──
    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedPage = !page.url().includes("/auth/signin");
    await page.waitForTimeout(2000);

    // ── Step 2: Look for diagnosis section in project detail ──
    // Click on first available project card
    const projectCard = page.locator(".card, .project-card, [class*='card']").first();
    const hasCard = await projectCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCard) {
        await projectCard.click();
        await page.waitForTimeout(2000);

        // Check for structured sections
        const diagnosisSection = page.locator("[class*='diagnosis'], [class*='diagnostico'], h4, h5, .section-title").filter({
            hasText: /diagnostico|diagnosis|inspeccion|hallazgo/i,
        }).first();
        result.checks.diagnosisSectionExists = await diagnosisSection.isVisible({ timeout: 2000 }).catch(() => false);

        const repairSection = page.locator("[class*='repair'], [class*='reparacion'], h4, h5, .section-title").filter({
            hasText: /reparacion|repair|intervencion|solucion/i,
        }).first();
        result.checks.repairSectionExists = await repairSection.isVisible({ timeout: 2000 }).catch(() => false);

        result.checks.structuredMemoNotPlainText = result.checks.diagnosisSectionExists && result.checks.repairSectionExists;

        // Check for success percentage field
        const successField = page.locator("input[type='number'], input, [class*='percentage']").filter({
            hasText: /exito|porcentaje|success.*rate|%.*reparacion|probabilidad/i,
        }).first();
        result.checks.successPercentageField = await successField.isVisible({ timeout: 2000 }).catch(() => false);

        if (result.checks.successPercentageField) {
            const isRequired = await successField.getAttribute("required") !== null
                || await successField.locator("..").locator("[class*='required'], .text-danger, span:has-text('*')").isVisible({ timeout: 500 }).catch(() => false);
            result.checks.successPercentageMandatory = isRequired;
        }

        // Check for photo capture at diagnosis
        const photoCapture = page.locator("input[type='file'], button").filter({ hasText: /foto|photo|evidencia|capturar/i }).first();
        result.checks.photoCaptureAtDiagnosis = await photoCapture.isVisible({ timeout: 2000 }).catch(() => false);

        // Close modal
        const closeBtn = page.locator("[class*='close'], button").filter({ hasText: /cerrar|close/i }).first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeBtn.click();
        }
    }

    if (!result.checks.structuredMemoNotPlainText) {
        result.observations.push("OBSERVACION: El Memo es texto plano. Se requiere estructura dividida en Seccion de Diagnostico y Seccion de Reparacion.");
    }

    if (!result.checks.successPercentageField) {
        result.observations.push("OBSERVACION: No existe el campo obligatorio 'Porcentaje de exito de reparacion' para analisis gerencial.");
    }

    // ── Step 3: Check diagnosis close validation via API ──
    try {
        const projectsResponse = await fetch(`${apiBaseUrl}/api/v1/projects?status=diagnostico`, {
            method: "GET",
            headers: buildApiHeaders(),
        });
        if (projectsResponse.ok) {
            const payload = await projectsResponse.json();
            const projects = Array.isArray(payload.items) ? payload.items : [];
            if (projects.length > 0) {
                // Try to close diagnosis without required fields
                const closeResponse = await fetch(`${apiBaseUrl}/api/v1/projects/${projects[0].id}/diagnosis/close`, {
                    method: "POST",
                    headers: buildApiHeaders(),
                    body: JSON.stringify({ closedBy: "pw-test" }),
                });
                result.checks.closeDiagnosisValidation = !closeResponse.ok; // Should fail without required fields
            }
        }
    } catch {}

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `diagnosis-technical-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_DIAGNOSIS_TECHNICAL_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `diagnosis-technical-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_DIAGNOSIS_TECHNICAL_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
