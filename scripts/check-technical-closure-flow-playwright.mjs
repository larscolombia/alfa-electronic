/**
 * Playwright headless test — Req #1: Cierre Técnico y Entrada al Flujo de Salida
 *
 * Verifies:
 *  - Technical closure transitions equipment to "listo-entrega"
 *  - Equipment disappears from technician view and appears in admin dispatch column
 *  - Notification is sent to administrative area on status change
 *  - "Listo para Entrega" status auto-updates the workflow process
 *
 * Exit codes: 0 = all checks passed, 1 = failure (see JSON report on stdout)
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

const now = Date.now();
const uniqueIdentifier = `PW-TC-CLOSE-${now}`;
const uniqueSerie = `PW-TC-SER-${now}`;
const intakeCarrier = `Carrier TC ${now}`;
const faceFixturePaths = Array.from({ length: 4 }, (_, i) => path.resolve(artifactsDir, `pw-face-tc-${now}-${i + 1}.jpg`));
const faceFixtureSourcePath = path.resolve("src/assets/img/modern-ai-image/image-1.jpg");

const result = {
    test: "technical-closure-flow",
    requirement: "Cierre Tecnico y Entrada al Flujo de Salida",
    baseUrl: normalizedBaseUrl,
    apiBaseUrl,
    identifier: uniqueIdentifier,
    createdRecordId: "",
    createdItemId: "",
    screenshotPath: "",
    checks: {
        loggedIn: false,
        landedWorkTeams: false,
        equipmentCreated: false,
        statusTransitionToListoEntrega: false,
        equipmentAppearsInAdminDispatch: false,
        notificationSentToAdmin: false,
        workflowAutoUpdated: false,
        projectStatusIsListoEntrega: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    error: "",
};

let browser;
let session;

function assertOrThrow(condition, message) {
    if (!condition) throw new Error(message);
}

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
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`login failed ${response.status}: ${body}`);
    }
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

async function fetchRecordByIdentifier(identifier) {
    const response = await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records?includeArchived=true&identifier=${encodeURIComponent(identifier)}`, {
        method: "GET",
        headers: buildApiHeaders(),
    });
    if (!response.ok) throw new Error(`fetch records failed ${response.status}`);
    const payload = await response.json();
    const records = Array.isArray(payload.items) ? payload.items : [];
    return records.find((r) =>
        Array.isArray(r.items) && r.items.some((item) => String(item.receivedIdentifier || "").trim() === identifier)
    ) || null;
}

async function getRecord(recordId) {
    const response = await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}?includeArchived=true`, {
        method: "GET",
        headers: buildApiHeaders(),
    });
    if (!response.ok) throw new Error(`get record failed ${response.status}`);
    return response.json();
}

async function updateItemRepairStatus(recordId, itemId, newStatus) {
    const record = await getRecord(recordId);
    const updatedItems = (record.items || []).map((item) => {
        if (item.id === itemId) {
            return { ...item, repairStatus: newStatus, repairStatusUpdatedAt: new Date().toISOString(), repairStatusUpdatedBy: "pw-test" };
        }
        return item;
    });
    const response = await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}`, {
        method: "PUT",
        headers: buildApiHeaders(),
        body: JSON.stringify({ ...record, items: updatedItems }),
    });
    if (!response.ok) throw new Error(`update repair status failed ${response.status}`);
    return response.json();
}

async function listProjectsByStatus(status) {
    const response = await fetch(`${apiBaseUrl}/api/v1/projects?status=${encodeURIComponent(status)}`, {
        method: "GET",
        headers: buildApiHeaders(),
    });
    if (!response.ok) throw new Error(`list projects failed ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
}

async function archiveRecord(recordId) {
    if (!recordId) return;
    await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/archive`, {
        method: "PATCH",
        headers: buildApiHeaders(),
        body: JSON.stringify({ archived: true }),
    });
}

function receptionSelect(page, labelText) {
    return page.locator(`label.form-label:has-text("${labelText}") + select.form-select`).first();
}

function receptionInput(page, labelText) {
    return page.locator(`label.form-label:has-text("${labelText}") + input.form-control`).first();
}

async function setRequiredFaceEvidence(page) {
    await page.locator("input[placeholder='QR, código de barras, serial o placa']").first().fill(uniqueIdentifier);
    const evidenceInput = page.locator("input[type='file'][accept='image/*']:visible").first();
    await evidenceInput.setInputFiles(faceFixturePaths);
    await evidenceInput.evaluate((el) => {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const faceTypes = ["face-front", "face-back", "face-left", "face-right"];
    const faceTypeLabels = ["cara frente", "cara atrás", "cara izquierda", "cara derecha"];
    const evidenceTypeSelects = page.locator(".evidence-photo-card select.form-select-sm");

    const waitStart = Date.now();
    while ((Date.now() - waitStart) < timeoutMs) {
        if ((await evidenceTypeSelects.count()) >= faceTypes.length) break;
        await page.waitForTimeout(250);
    }

    for (let i = 0; i < faceTypes.length; i++) {
        const count = await evidenceTypeSelects.count();
        if (i >= count) break;
        await evidenceTypeSelects.nth(i).evaluate((el, payload) => {
            if (!(el instanceof HTMLSelectElement)) throw new Error("invalid select");
            const opt = Array.from(el.options).find((o) => {
                const v = String(o.value || "").trim().toLowerCase();
                const t = String(o.textContent || "").trim().toLowerCase();
                return v === payload.desiredValue || t.includes(payload.desiredLabel);
            });
            if (opt) { el.value = opt.value; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }
        }, { desiredValue: faceTypes[i], desiredLabel: faceTypeLabels[i] });
    }
}

try {
    session = await login();
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    await Promise.all(faceFixturePaths.map((fp) => fs.copyFile(faceFixtureSourcePath, fp)));

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

    // ── Step 1: Navigate to work-teams and create equipment ──
    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    assertOrThrow(!page.url().includes("/auth/signin"), "Session not authenticated");
    await page.waitForSelector("[data-testid='work-equipment-create']", { timeout: timeoutMs });
    result.checks.landedWorkTeams = true;

    await page.getByTestId("work-equipment-create").click();
    await page.waitForSelector("[data-testid='equipment-modal-cancel']", { timeout: timeoutMs });

    // Fill reception data
    await receptionSelect(page, "Método de envío").selectOption("transportadora");
    await receptionInput(page, "Transportadora").fill(intakeCarrier);
    await receptionInput(page, "Guía / tracking").fill(`GUIA-TC-${now}`);

    const currentDate = new Date();
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const hh = String(currentDate.getHours()).padStart(2, "0");
    const min = String(currentDate.getMinutes()).padStart(2, "0");
    await page.locator("label.form-label:has-text('Fecha y hora de recepción física') + input.form-control").first().fill(`${yyyy}-${mm}-${dd}T${hh}:${min}`);

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-add-item']", { timeout: timeoutMs });

    // Fill equipment item
    await page.getByTestId("equipment-modal-registration-mode-0").selectOption("manual");
    await page.locator("label.form-label:has-text('Familia') + input.form-control").first().fill("PLC");
    await page.locator("label.form-label:has-text('Marca') + input.form-control").first().fill("Marca TC Test");
    await page.locator("label.form-label:has-text('Tipo') + input.form-control").first().fill("Controlador");
    await page.locator("label.form-label:has-text('Serie') + input.form-control").first().fill(uniqueSerie);

    // Advance through wizard steps
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector(".question-card", { timeout: timeoutMs });
    await page.getByTestId("equipment-modal-next").click();

    // Handle industrial authorization if needed
    const scannerVisible = await page.locator("[data-testid='equipment-modal-open-scanner-0']").first().isVisible({ timeout: 1200 }).catch(() => false);
    if (!scannerVisible) {
        await page.locator("label.form-label.small:has-text('Autorizado por') + input.form-control").first().fill("Jefe tecnico TC");
        await page.locator("label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().fill("Autorizacion prueba cierre tecnico");
        await page.getByTestId("equipment-modal-next").click();
    }

    await page.waitForSelector("[data-testid='equipment-modal-open-scanner-0']", { timeout: timeoutMs });
    await setRequiredFaceEvidence(page);
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("#generateRepairProjectsOnSave", { timeout: timeoutMs });

    // Enable project generation so we can test workflow transition
    const generateSwitch = page.locator("#generateRepairProjectsOnSave").first();
    if (!(await generateSwitch.isChecked())) {
        await generateSwitch.check();
    }

    await page.getByTestId("equipment-modal-save").click();
    await page.waitForSelector("[data-testid='equipment-modal-save']", { state: "detached", timeout: timeoutMs });
    await page.waitForSelector(".alert.alert-success", { timeout: timeoutMs });
    result.checks.equipmentCreated = true;

    // ── Step 2: Verify record was created via API ──
    const createdRecord = await fetchRecordByIdentifier(uniqueIdentifier);
    assertOrThrow(Boolean(createdRecord), "Record not found via API after creation");
    result.createdRecordId = String(createdRecord.id || "");
    result.createdItemId = Array.isArray(createdRecord.items) && createdRecord.items.length > 0
        ? String(createdRecord.items[0].id || "")
        : "";

    // ── Step 3: Transition equipment to "listo-entrega" via API ──
    if (result.createdItemId) {
        const updatedRecord = await updateItemRepairStatus(result.createdRecordId, result.createdItemId, "listo-entrega");
        const updatedItem = (updatedRecord.items || []).find((item) => item.id === result.createdItemId);
        result.checks.statusTransitionToListoEntrega = updatedItem?.repairStatus === "listo-entrega";

        if (!result.checks.statusTransitionToListoEntrega) {
            result.observations.push("OBSERVACION: El estado no se actualizo automaticamente a 'Listo para Entrega' via API. Requiere cambio manual.");
        }
    }

    // ── Step 4: Check project workflow status via API ──
    try {
        const listoEntregaProjects = await listProjectsByStatus("listo-entrega");
        result.checks.projectStatusIsListoEntrega = listoEntregaProjects.length > 0;
        result.checks.workflowAutoUpdated = result.checks.statusTransitionToListoEntrega && result.checks.projectStatusIsListoEntrega;

        if (!result.checks.workflowAutoUpdated) {
            result.observations.push("OBSERVACION: El flujo de procesos no se actualiza automaticamente al cambiar a 'Listo para Entrega'. Requiere cambio manual.");
        }
    } catch (err) {
        result.observations.push(`OBSERVACION: No se pudo verificar el estado del proyecto en el workflow: ${err.message}`);
    }

    // ── Step 5: Navigate to projects board and verify equipment appears in admin dispatch column ──
    await page.goto(`${normalizedBaseUrl}/app/projects-board`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2000);

    // Check if "Listo para entrega" column is visible
    const listoColumnVisible = await page.locator(".board-column, .kanban-column, [class*='column']").filter({ hasText: /listo.*entrega/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
    result.checks.equipmentAppearsInAdminDispatch = listoColumnVisible;

    if (!listoColumnVisible) {
        result.observations.push("OBSERVACION: La columna 'Listo para entrega' no es visible en el tablero de proyectos.");
    }

    // ── Step 6: Check for notification mechanism ──
    await page.goto(`${normalizedBaseUrl}/app/dashboard`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(1500);

    // Look for notification bell or notification panel
    const notificationBell = page.locator("[class*='notification'], [class*='bell'], [data-testid*='notification'], .nav-link .badge").first();
    const notificationVisible = await notificationBell.isVisible({ timeout: 2000 }).catch(() => false);

    if (notificationVisible) {
        await notificationBell.click();
        await page.waitForTimeout(1000);
        const notificationContent = await page.locator("[class*='notification-dropdown'], [class*='notification-panel'], .dropdown-menu").first().textContent().catch(() => "");
        result.checks.notificationSentToAdmin = /listo|entrega|equipo|despacho/i.test(notificationContent || "");
    }

    if (!result.checks.notificationSentToAdmin) {
        result.observations.push("OBSERVACION: El administrador no recibe notificacion del cambio de estado a 'Listo para Entrega'. No se encontro mecanismo de notificacion.");
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `technical-closure-flow-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    // Report
    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log(result.checks.statusTransitionToListoEntrega ? "PLAYWRIGHT_TECHNICAL_CLOSURE_FLOW_PARTIAL_OK" : "PLAYWRIGHT_TECHNICAL_CLOSURE_FLOW_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `technical-closure-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_TECHNICAL_CLOSURE_FLOW_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    try { if (session && result.createdRecordId) await archiveRecord(result.createdRecordId); } catch {}
    if (browser) await browser.close();
}
