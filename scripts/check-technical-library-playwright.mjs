/**
 * Playwright headless test — Fase Tecnica T7: Biblioteca Tecnica y Backups de Software
 *
 * Verifies (implementacion real):
 *  - /app/documentation lista documentos y expone doc-search-input
 *  - la documentacion es no-borrable: no hay botones de eliminar en la lista
 *  - subir un backup con archivo real (setInputFiles) lo guarda con url y aparece download-backup-btn
 *  - GET /api/v1/documentation/backups/model/:model responde para el modelo sembrado
 *  - en el modal de recepcion de equipos (/app/work-teams) aparece software-backup-icon
 *
 * Exit codes: 0 = script finished without exception, 1 = failure
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

const QA_MODEL = `QA-MODEL-${Date.now() % 100000}`;

const result = {
    test: "technical-library",
    requirement: "T7: Biblioteca tecnica y backups de software descargables",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedDocumentation: false,
        documentationListed: false,
        documentationSearchExists: false,
        nonDeletableDocumentation: false,
        backupFormOpens: false,
        backupUploaded: false,
        downloadBackupBtnAppears: false,
        backupModelApiResponds: false,
        softwareBackupIconInEquipmentModal: false,
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

    // ── Step 1: documentation module ──
    await page.goto(`${normalizedBaseUrl}/app/documentation`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedDocumentation = !page.url().includes("/auth/signin");
    await page.waitForTimeout(3000);

    const docRoot = page.locator(".container-fluid.p-4").first();

    const docList = docRoot.locator(".list-group-item").first();
    result.checks.documentationListed = await docList.isVisible({ timeout: 8000 }).catch(() => false);
    if (!result.checks.documentationListed) {
        result.observations.push("OBSERVACION: no se visualiza la lista de documentos en /app/documentation (puede estar vacia o el modulo no esta desplegado).");
    }

    result.checks.documentationSearchExists = await page
        .locator("[data-testid='doc-search-input']")
        .isVisible({ timeout: 3000 })
        .catch(() => false);

    // Non-deletable: no VISIBLE delete buttons/trash icons inside the documentation module
    // (hidden layout controls elsewhere in the shell do not count).
    const deleteControls = docRoot.locator("button:has-text('Eliminar'), a:has-text('Eliminar'), button:has(i.bi-trash), a:has(i.bi-trash)");
    const deleteCount = await deleteControls.count();
    let visibleDeletes = 0;
    for (let i = 0; i < deleteCount; i++) {
        if (await deleteControls.nth(i).isVisible().catch(() => false)) visibleDeletes++;
    }
    result.checks.nonDeletableDocumentation = visibleDeletes === 0;
    if (!result.checks.nonDeletableDocumentation) {
        result.observations.push(`OBSERVACION: se encontraron ${visibleDeletes} controles de eliminacion visibles en /app/documentation; la documentacion deberia ser no-borrable.`);
    }

    // ── Step 2: upload a software backup with a real file ──
    const backupToggle = page.locator("button", { hasText: /backup de software/i }).first();
    if (await backupToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
        await backupToggle.click();
        await page.waitForTimeout(600);

        const modelInput = page.locator("label", { hasText: /modelo de equipo\/tarjeta/i }).locator("..").locator("input").first();
        const versionInput = page.locator("label", { hasText: /^version$/i }).locator("..").locator("input").first();
        // scope to the documentation module: the app shell can contain other file inputs
        const fileInput = docRoot.locator("input[type='file']").first();

        result.checks.backupFormOpens = await fileInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (result.checks.backupFormOpens) {
            if (await modelInput.isVisible({ timeout: 1500 }).catch(() => false)) await modelInput.fill(QA_MODEL);
            if (await versionInput.isVisible({ timeout: 1500 }).catch(() => false)) await versionInput.fill("v1.0-qa");
            await fileInput.setInputFiles({
                name: "qa-backup.bin",
                mimeType: "application/octet-stream",
                buffer: Buffer.from("QA BACKUP CONTENT 0123456789"),
            });
            await page.waitForTimeout(500);

            await page.locator("button", { hasText: /subir backup/i }).first().click();
            await page.waitForTimeout(2500);

            const downloadBtn = page.locator("[data-testid='download-backup-btn']").first();
            result.checks.downloadBackupBtnAppears = await downloadBtn.isVisible({ timeout: 6000 }).catch(() => false);
            result.checks.backupUploaded = result.checks.downloadBackupBtnAppears;

            if (result.checks.downloadBackupBtnAppears) {
                const href = await downloadBtn.getAttribute("href").catch(() => "");
                if (!href || (!href.startsWith("data:") && !href.startsWith("http"))) {
                    result.observations.push(`OBSERVACION: download-backup-btn tiene href inesperado ('${String(href || "").slice(0, 60)}').`);
                }
            } else {
                result.observations.push("OBSERVACION: no aparecio download-backup-btn tras subir el backup (guardado de archivo posiblemente no desplegado).");
            }
        } else {
            result.observations.push("OBSERVACION: el formulario de backup no muestra el campo de archivo.");
        }
    } else {
        result.observations.push("OBSERVACION: no se encontro el boton 'Backup de software' en /app/documentation (frontend nuevo posiblemente no desplegado).");
    }

    // ── Step 3: backups/model API for the uploaded model ──
    try {
        const modelRes = await fetch(`${apiBaseUrl}/api/v1/documentation/backups/model/${encodeURIComponent(QA_MODEL)}`, {
            method: "GET",
            headers: buildApiHeaders(),
        });
        result.checks.backupModelApiResponds = modelRes.ok;
        if (!modelRes.ok) {
            result.observations.push(`OBSERVACION: GET /api/v1/documentation/backups/model/:model respondio ${modelRes.status} (endpoint nuevo posiblemente no desplegado).`);
        }
    } catch (e) {
        result.observations.push(`OBSERVACION: error consultando backups/model: ${e?.message || e}.`);
    }

    // ── Step 4: software-backup-icon in the equipment reception modal ──
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2500);

    const createBtn = page.locator("[data-testid='work-equipment-create']");
    if (await createBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForSelector("[data-testid='equipment-modal-cancel']", { timeout: timeoutMs });
        await page.waitForTimeout(800);

        // software-backup-icon renders on wizard step 2 ("Equipos")
        await page.locator("[data-testid='equipment-modal-next']").click().catch(() => {});
        await page.waitForTimeout(1000);

        result.checks.softwareBackupIconInEquipmentModal = await page
            .locator("[data-testid='software-backup-icon']").first()
            .isVisible({ timeout: 5000 })
            .catch(() => false);
        if (!result.checks.softwareBackupIconInEquipmentModal) {
            result.observations.push("OBSERVACION: no se encontro software-backup-icon en el paso Equipos del modal de recepcion (frontend nuevo posiblemente no desplegado).");
        }

        await page.locator("[data-testid='equipment-modal-cancel']").click().catch(() => {});
        await page.waitForTimeout(500);
    } else {
        result.observations.push("OBSERVACION: no se pudo abrir el modal de recepcion en /app/work-teams para verificar software-backup-icon.");
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `technical-library-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_TECHNICAL_LIBRARY_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `technical-library-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_TECHNICAL_LIBRARY_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
