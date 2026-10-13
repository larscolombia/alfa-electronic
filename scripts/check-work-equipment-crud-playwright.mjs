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
    if (process.env.PW_API_BASE_URL) {
        return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    }

    const parsed = new URL(normalizedBaseUrl);
    return parsed.origin;
})();

const now = Date.now();
const uniqueIdentifier = `PW-CRUD-ID-${now}`;
const uniqueSerie = `PW-CRUD-SER-${now}`;
const intakeCarrier = `Carrier PW ${now}`;
const intakeCarrierUpdated = `Carrier PW EDIT ${now}`;
const faceFixturePaths = Array.from({ length: 4 }, (_, index) => path.resolve(artifactsDir, `pw-face-crud-${now}-${index + 1}.jpg`));
const faceFixtureSourcePath = path.resolve("src/assets/img/modern-ai-image/image-1.jpg");

const result = {
    baseUrl: normalizedBaseUrl,
    apiBaseUrl,
    identifier: uniqueIdentifier,
    createdRecordId: "",
    screenshotPath: "",
    checks: {
        loggedIn: false,
        landedWorkTeams: false,
        filtersWorked: false,
        modalOpened: false,
        saveWorked: false,
        apiCreateVerified: false,
        editWorked: false,
        apiEditVerified: false,
        archiveWorked: false,
        restoreWorked: false,
    },
    consoleErrors: [],
    pageErrors: [],
    error: "",
};

let browser;
let session;

function assertOrThrow(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) {
        return;
    }

    if (target.length < 12) {
        target.push(value);
    }
}

async function login() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": companyId,
        },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`login failed ${response.status}: ${body}`);
    }

    const payload = await response.json();
    return {
        ...payload,
        expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000,
    };
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

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`fetch records failed ${response.status}: ${body}`);
    }

    const payload = await response.json();
    const records = Array.isArray(payload.items) ? payload.items : [];
    return records.find((record) =>
        Array.isArray(record.items) && record.items.some((item) => String(item.receivedIdentifier || "").trim() === identifier),
    ) || null;
}

async function getRecord(recordId, includeArchived = true) {
    const query = includeArchived ? "?includeArchived=true" : "";
    const response = await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}${query}`, {
        method: "GET",
        headers: buildApiHeaders(),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`get record failed ${response.status}: ${body}`);
    }

    return response.json();
}

async function archiveRecord(recordId) {
    if (!recordId) {
        return;
    }

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
    await evidenceInput.evaluate((inputElement) => {
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const faceTypes = ["face-front", "face-back", "face-left", "face-right"];
    const faceTypeLabels = ["cara frente", "cara atrás", "cara izquierda", "cara derecha"];
    const evidenceTypeSelects = page.locator(".evidence-photo-card select.form-select-sm");

    const waitStart = Date.now();
    while ((Date.now() - waitStart) < timeoutMs) {
        const count = await evidenceTypeSelects.count();
        if (count >= faceTypes.length) {
            break;
        }
        await page.waitForTimeout(250);
    }

    const availableSelects = await evidenceTypeSelects.count();
    assertOrThrow(availableSelects >= faceTypes.length, `No se encontraron ${faceTypes.length} selectores de evidencia. Detectados: ${availableSelects}`);

    for (let index = 0; index < faceTypes.length; index += 1) {
        const desiredValue = faceTypes[index];
        const desiredLabel = faceTypeLabels[index];
        await evidenceTypeSelects.nth(index).evaluate((element, payload) => {
            if (!(element instanceof HTMLSelectElement)) {
                throw new Error("selector de evidencia invalido");
            }

            const resolvedOption = Array.from(element.options).find((option) => {
                const normalizedValue = String(option.value || "").trim().toLowerCase();
                const normalizedLabel = String(option.textContent || "").trim().toLowerCase();
                return normalizedValue === payload.desiredValue || normalizedLabel.includes(payload.desiredLabel);
            });

            if (!resolvedOption) {
                throw new Error(`opcion de evidencia no encontrada para ${payload.desiredValue}`);
            }

            element.value = resolvedOption.value;
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
        }, { desiredValue, desiredLabel });
    }
}

async function advanceToSignatures(page) {
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-add-item']", { timeout: timeoutMs });

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector(".question-card", { timeout: timeoutMs });

    await page.getByTestId("equipment-modal-next").click();

    const scannerVisible = await page.locator("[data-testid='equipment-modal-open-scanner-0']").first().isVisible({ timeout: 1200 }).catch(() => false);
    if (!scannerVisible) {
        await page.locator("label.form-label.small:has-text('Autorizado por') + input.form-control").first().fill("Jefe tecnico CRUD");
        await page.locator("label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().fill("Autorizacion operativa para prueba CRUD");
        await page.getByTestId("equipment-modal-next").click();
    }

    await page.waitForSelector("[data-testid='equipment-modal-open-scanner-0']", { timeout: timeoutMs });
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("#generateRepairProjectsOnSave", { timeout: timeoutMs });
}

try {
    session = await login();
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    await Promise.all(faceFixturePaths.map((filePath) => fs.copyFile(faceFixtureSourcePath, filePath)));

    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });

    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        {
            authSession: session,
            apiBase: apiBaseUrl,
        },
    );

    const page = await context.newPage();

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            pushUnique(result.consoleErrors, msg.text());
        }
    });

    page.on("pageerror", (error) => {
        pushUnique(result.pageErrors, error?.stack || error?.message || String(error));
    });

    await page.goto(`${normalizedBaseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });

    assertOrThrow(!page.url().includes("/auth/signin"), "Sesion no autenticada: redirigio a /auth/signin");
    await page.waitForSelector("[data-testid='work-equipment-create']", { timeout: timeoutMs });
    result.checks.landedWorkTeams = true;

    await page.getByTestId("work-equipment-filter-archivados").click();
    const archivedSummary = await page.getByTestId("work-equipment-filter-summary").textContent();
    await page.getByTestId("work-equipment-filter-activos").click();
    const activeSummary = await page.getByTestId("work-equipment-filter-summary").textContent();
    result.checks.filtersWorked = /archivad/i.test(String(archivedSummary || "")) && /activ/i.test(String(activeSummary || ""));

    await page.getByTestId("work-equipment-create").click();
    await page.waitForSelector("[data-testid='equipment-modal-cancel']", { timeout: timeoutMs });
    result.checks.modalOpened = true;

    await receptionSelect(page, "Método de envío").selectOption("transportadora");
    await receptionInput(page, "Transportadora").fill(intakeCarrier);
    await receptionInput(page, "Guía / tracking").fill(`GUIA-CRUD-${now}`);

    const currentDate = new Date();
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const hh = String(currentDate.getHours()).padStart(2, "0");
    const min = String(currentDate.getMinutes()).padStart(2, "0");
    await page.locator("label.form-label:has-text('Fecha y hora de recepción física') + input.form-control").first().fill(`${yyyy}-${mm}-${dd}T${hh}:${min}`);

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-add-item']", { timeout: timeoutMs });

    await page.getByTestId("equipment-modal-registration-mode-0").selectOption("manual");
    await page.locator("label.form-label:has-text('Familia') + input.form-control").first().fill("PLC");
    await page.locator("label.form-label:has-text('Marca') + input.form-control").first().fill("Marca CRUD");
    await page.locator("label.form-label:has-text('Tipo') + input.form-control").first().fill("Controlador");
    await page.locator("label.form-label:has-text('Serie') + input.form-control").first().fill(uniqueSerie);

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector(".question-card", { timeout: timeoutMs });

    await page.getByTestId("equipment-modal-next").click();
    await page.locator("label.form-label.small:has-text('Autorizado por') + input.form-control").first().fill("Jefe tecnico CRUD");
    await page.locator("label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().fill("Autorizacion operativa para recepcion no industrial");
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-open-scanner-0']", { timeout: timeoutMs });

    await setRequiredFaceEvidence(page);
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("#generateRepairProjectsOnSave", { timeout: timeoutMs });

    const generateProjectsSwitch = page.locator("#generateRepairProjectsOnSave").first();
    if (await generateProjectsSwitch.isChecked()) {
        await generateProjectsSwitch.uncheck();
    }

    await page.getByTestId("equipment-modal-save").click();
    await page.waitForSelector("[data-testid='equipment-modal-save']", { state: "detached", timeout: timeoutMs });
    await page.waitForSelector(".alert.alert-success", { timeout: timeoutMs });
    result.checks.saveWorked = true;

    const createdRecord = await fetchRecordByIdentifier(uniqueIdentifier);
    assertOrThrow(Boolean(createdRecord), "No se encontro el registro creado en API");
    result.createdRecordId = String(createdRecord.id || "");
    result.checks.apiCreateVerified = String(createdRecord.intakeCarrier || "") === intakeCarrier;

    const searchInput = page.locator("input[type='search']:visible").first();
    await searchInput.fill(uniqueIdentifier);
    await page.waitForSelector(`[data-testid='work-equipment-edit-${result.createdRecordId}']`, { timeout: timeoutMs });

    await page.getByTestId(`work-equipment-edit-${result.createdRecordId}`).click();
    await page.waitForSelector("[data-testid='equipment-modal-cancel']", { timeout: timeoutMs });

    await receptionInput(page, "Transportadora").fill(intakeCarrierUpdated);
    await advanceToSignatures(page);

    const generateProjectsSwitchOnEdit = page.locator("#generateRepairProjectsOnSave").first();
    if (await generateProjectsSwitchOnEdit.isChecked()) {
        await generateProjectsSwitchOnEdit.uncheck();
    }

    await page.getByTestId("equipment-modal-save").click();
    await page.waitForSelector("[data-testid='equipment-modal-save']", { state: "detached", timeout: timeoutMs });
    await page.waitForSelector(".alert.alert-success", { timeout: timeoutMs });
    result.checks.editWorked = true;

    const editedRecord = await getRecord(result.createdRecordId, true);
    result.checks.apiEditVerified = String(editedRecord.intakeCarrier || "") === intakeCarrierUpdated;

    await searchInput.fill(uniqueIdentifier);
    await page.waitForSelector(`[data-testid='work-equipment-archive-${result.createdRecordId}']`, { timeout: timeoutMs });
    await page.getByTestId(`work-equipment-archive-${result.createdRecordId}`).click();

    const confirmArchiveButton = page.locator(".app-confirm-modal .app-confirm-primary-btn").first();
    await confirmArchiveButton.waitFor({ state: "visible", timeout: timeoutMs });
    await confirmArchiveButton.click();
    await page.waitForSelector(".alert.alert-success", { timeout: timeoutMs });

    const archivedRecord = await getRecord(result.createdRecordId, true);
    result.checks.archiveWorked = archivedRecord.archived === true;

    await page.getByTestId("work-equipment-filter-archivados").click();
    await searchInput.fill(uniqueIdentifier);
    await page.waitForSelector(`[data-testid='work-equipment-restore-${result.createdRecordId}']`, { timeout: timeoutMs });
    await page.getByTestId(`work-equipment-restore-${result.createdRecordId}`).click();
    await page.waitForSelector(".alert.alert-success", { timeout: timeoutMs });

    const restoredRecord = await getRecord(result.createdRecordId, true);
    result.checks.restoreWorked = restoredRecord.archived === false;

    const screenshotPath = path.resolve(artifactsDir, `work-equipment-crud-ok-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, value]) => value !== true);
    if (failedChecks.length > 0 || result.pageErrors.length > 0) {
        throw new Error(`Checks fallidos: ${failedChecks.map(([key]) => key).join(", ")}${result.pageErrors.length > 0 ? " + pageErrors" : ""}`);
    }

    console.log("PLAYWRIGHT_WORK_EQUIPMENT_CRUD_CHECK_OK");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);

    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const screenshotPath = path.resolve(artifactsDir, `work-equipment-crud-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: screenshotPath, fullPage: true });
            result.screenshotPath = screenshotPath;
        }
    } catch {
        // Ignore screenshot failures.
    }

    console.error("PLAYWRIGHT_WORK_EQUIPMENT_CRUD_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    try {
        if (session && result.createdRecordId) {
            await archiveRecord(result.createdRecordId);
        }
    } catch {
        // Ignore cleanup errors.
    }

    if (browser) {
        await browser.close();
    }
}
