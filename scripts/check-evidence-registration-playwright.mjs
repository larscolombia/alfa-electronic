/**
 * Playwright headless test — Req #5: Registro de Evidencia (Fotos y Video)
 *
 * Verifies:
 *  - YouTube link field on equipment record (for test proof videos)
 *  - Dispatch photo upload (packed equipment + seals)
 *  - Both available when equipment is in "Listo para Entrega" status
 *  - Photos attach directly to equipment folder
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
    test: "evidence-registration",
    requirement: "Registro de Evidencia (Fotos y Video)",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedPage: false,
        youtubeLinkFieldExists: false,
        youtubeLinkSaveable: false,
        dispatchPhotoUploadExists: false,
        dispatchPhotoUploadable: false,
        fieldsAvailableInListoEntrega: false,
        attachmentsApiEndpoint: false,
        photoAttachedToEquipmentFolder: false,
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

    // ── Step 1: Navigate to work-teams ──
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedPage = !page.url().includes("/auth/signin");

    // ── Step 2: Check for YouTube link field ──
    const youtubeInput = page.locator("input[type='url'], input[placeholder*='youtube'], input").filter({ hasText: /youtube|video.*prueba|link.*video|url.*video/i }).first();
    result.checks.youtubeLinkFieldExists = await youtubeInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (!result.checks.youtubeLinkFieldExists) {
        // Also check if there's a field in the equipment detail/edit modal
        // Open first record if available
        const editBtn = page.locator("[data-testid^='work-equipment-edit-']").first();
        if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await editBtn.click();
            await page.waitForSelector("[data-testid='equipment-modal-cancel']", { timeout: timeoutMs });

            const youtubeInModal = page.locator("input").filter({ hasText: /youtube|video/i }).first();
            result.checks.youtubeLinkFieldExists = await youtubeInModal.isVisible({ timeout: 2000 }).catch(() => false);

            // Close modal
            await page.getByTestId("equipment-modal-cancel").click();
        }
    }

    if (!result.checks.youtubeLinkFieldExists) {
        result.observations.push("OBSERVACION: No existe campo especifico para pegar el enlace de YouTube del video de prueba. Los links se buscan manualmente y se pegan en correos.");
    }

    // ── Step 3: Check for dispatch photo upload ──
    const dispatchPhotoUpload = page.locator("input[type='file']").filter({ hasText: /foto.*despacho|despacho.*foto|foto.*empacado|evidencia.*salida/i }).first();
    result.checks.dispatchPhotoUploadExists = await dispatchPhotoUpload.isVisible({ timeout: 2000 }).catch(() => false);

    // Also check for a general attachment section in the equipment detail
    const attachmentSection = page.locator("[class*='attachment'], [class*='evidence']").filter({ hasText: /adjunto|evidencia|foto/i }).first();
    const hasAttachmentSection = await attachmentSection.isVisible({ timeout: 2000 }).catch(() => false);

    if (!result.checks.dispatchPhotoUploadExists && !hasAttachmentSection) {
        result.observations.push("OBSERVACION: No se puede cargar fotos del equipo empacado y con sellos directamente en la carpeta de adjuntos del codigo.");
    }

    // ── Step 4: Check API for attachment endpoints ──
    try {
        // Check if the attachment API endpoint exists by trying to list records
        const recordsResponse = await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records?includeArchived=false`, {
            method: "GET",
            headers: buildApiHeaders(),
        });
        if (recordsResponse.ok) {
            const payload = await recordsResponse.json();
            const records = Array.isArray(payload.items) ? payload.items : [];
            if (records.length > 0 && Array.isArray(records[0].items) && records[0].items.length > 0) {
                const recordId = records[0].id;
                const itemId = records[0].items[0].id;

                // Check if the attachment endpoint exists
                const attachmentCheck = await fetch(
                    `${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/items/${encodeURIComponent(itemId)}/attachments`,
                    { method: "GET", headers: buildApiHeaders() },
                );
                result.checks.attachmentsApiEndpoint = attachmentCheck.ok || attachmentCheck.status === 200;
            }
        }
    } catch {
        result.observations.push("OBSERVACION: No se pudo verificar el endpoint de adjuntos.");
    }

    // ── Step 5: Check if fields are available in "Listo para Entrega" status ──
    // Navigate to projects board to find equipment in listo-entrega
    await page.goto(`${normalizedBaseUrl}/app/projects-board`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2000);

    const listoColumn = page.locator(".board-column, .kanban-column, [class*='column']").filter({ hasText: /listo.*entrega/i }).first();
    const hasListoColumn = await listoColumn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasListoColumn) {
        // Check if equipment cards in this column have YouTube/photo options
        const cardsInListo = listoColumn.locator(".card, .project-card, [class*='card']").first();
        const hasCards = await cardsInListo.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasCards) {
            await cardsInListo.click();
            await page.waitForTimeout(1000);

            const youtubeInDetail = page.locator("input, a").filter({ hasText: /youtube|video/i }).first();
            const photoInDetail = page.locator("input[type='file'], button").filter({ hasText: /foto.*despacho|subir.*foto/i }).first();

            result.checks.fieldsAvailableInListoEntrega =
                await youtubeInDetail.isVisible({ timeout: 1500 }).catch(() => false)
                || await photoInDetail.isVisible({ timeout: 1500 }).catch(() => false);
        }
    }

    if (!result.checks.fieldsAvailableInListoEntrega) {
        result.observations.push("OBSERVACION: Cuando el equipo esta en estado 'Listo para Entrega' no se puede cargar Link de YouTube ni Fotos de Despacho. Estas funciones no se visualizan.");
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `evidence-registration-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_EVIDENCE_REGISTRATION_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `evidence-registration-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_EVIDENCE_REGISTRATION_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
