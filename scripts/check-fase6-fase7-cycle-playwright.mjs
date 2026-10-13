import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const companyId = process.env.PW_COMPANY_ID || "demo-company";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    }

    const parsed = new URL(normalizedBaseUrl);
    return parsed.origin;
})();

const now = Date.now();
const faceFixturePaths = Array.from({ length: 4 }, (_, index) => path.resolve(artifactsDir, `pw-face-fixture-${now}-${index + 1}.jpg`));
const faceFixtureSourcePath = path.resolve("src/assets/img/modern-ai-image/image-1.jpg");
const uniqueIdentifier = `PW-F67-ID-${now}`;
const uniqueSerie = `PW-F67-SER-${now}`;
const intakeCarrier = `Transportadora PW ${now}`;
const intakeTracking = `GUIA-${now}`;
const intakeAuthorizedBy = "Jefe tecnico PW";
const intakeReason = "Autorizacion para recepcion no industrial en esta etapa";

const result = {
    baseUrl: normalizedBaseUrl,
    apiBaseUrl,
    identifier: uniqueIdentifier,
    createdRecordId: "",
    screenshotPath: "",
    htmlPath: "",
    checks: {
        loggedIn: false,
        landedWorkTeams: false,
        receptionTransportValidationBlock: false,
        receptionAdvancedAfterTransportData: false,
        industrialOverrideValidationBlock: false,
        industrialOverrideAllowedAdvance: false,
        savedRecord: false,
        apiPersistedIntakeFields: false,
        apiPersistedOverrideFields: false,
        editLoadedPersistedValues: false,
    },
    consoleErrors: [],
    pageErrors: [],
    error: "",
};

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
        body: JSON.stringify({
            email: userEmail,
            password: userPassword,
        }),
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

function buildApiHeaders(session) {
    return {
        "Content-Type": "application/json",
        "X-Company-Id": companyId,
        Authorization: `Bearer ${session.accessToken}`,
    };
}

async function fetchRecordsByIdentifier(session, identifier) {
    const url = `${apiBaseUrl}/api/v1/crm-equipment/records?includeArchived=true&identifier=${encodeURIComponent(identifier)}`;
    const response = await fetch(url, {
        method: "GET",
        headers: buildApiHeaders(session),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`fetch records failed ${response.status}: ${body}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
}

async function archiveRecord(session, recordId) {
    if (!recordId) {
        return;
    }

    await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/archive`, {
        method: "PATCH",
        headers: buildApiHeaders(session),
        body: JSON.stringify({ archived: true }),
    });
}

function receptionSelect(page, labelText) {
    return page.locator(`label.form-label:has-text("${labelText}") + select.form-select`).first();
}

function receptionInput(page, labelText) {
    return page.locator(`label.form-label:has-text("${labelText}") + input.form-control`).first();
}

let browser;
let session;

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

    await page.goto(`${normalizedBaseUrl}/app/work-teams`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });

    const finalUrl = page.url();
    assertOrThrow(!finalUrl.includes("/auth/signin"), "Sesion no autenticada: redirigio a /auth/signin");

    await page.waitForSelector("[data-testid='work-equipment-create']", { timeout: timeoutMs });
    result.checks.landedWorkTeams = true;

    await page.getByTestId("work-equipment-create").click();
    await page.waitForSelector("[data-testid='equipment-modal-cancel']", { timeout: timeoutMs });

    await receptionSelect(page, "Método de envío").selectOption("transportadora");
    await page.getByTestId("equipment-modal-next").click();

    const transportValidation = await page.locator(".alert.alert-warning").first().textContent();
    result.checks.receptionTransportValidationBlock = /transportadora/i.test(String(transportValidation || ""))
        && /gu[ií]a/i.test(String(transportValidation || ""));

    await receptionInput(page, "Transportadora").fill(intakeCarrier);
    await receptionInput(page, "Guía / tracking").fill(intakeTracking);

    const nowDate = new Date();
    const yyyy = nowDate.getFullYear();
    const mm = String(nowDate.getMonth() + 1).padStart(2, "0");
    const dd = String(nowDate.getDate()).padStart(2, "0");
    const hh = String(nowDate.getHours()).padStart(2, "0");
    const min = String(nowDate.getMinutes()).padStart(2, "0");
    await page.locator("label.form-label:has-text('Fecha y hora de recepción física') + input.form-control").first().fill(`${yyyy}-${mm}-${dd}T${hh}:${min}`);

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-add-item']", { timeout: timeoutMs });
    result.checks.receptionAdvancedAfterTransportData = true;

    await page.getByTestId("equipment-modal-registration-mode-0").selectOption("manual");
    await page.locator("label.form-label:has-text('Familia') + input.form-control").first().fill("PLC");
    await page.locator("label.form-label:has-text('Marca') + input.form-control").first().fill("Marca PW");
    await page.locator("label.form-label:has-text('Tipo') + input.form-control").first().fill("Controlador");
    await page.locator("label.form-label:has-text('Serie') + input.form-control").first().fill(uniqueSerie);

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector(".question-card", { timeout: timeoutMs });

    await page.getByTestId("equipment-modal-next").click();
    const overrideValidation = await page.locator(".alert.alert-warning").first().textContent();
    result.checks.industrialOverrideValidationBlock = /autorizaci[oó]n/i.test(String(overrideValidation || ""));

    await page.locator("label.form-label.small:has-text('Autorizado por') + input.form-control").first().fill(intakeAuthorizedBy);
    await page.locator("label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().fill(intakeReason);

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-open-scanner-0']", { timeout: timeoutMs });
    result.checks.industrialOverrideAllowedAdvance = true;

    await page.locator("input[placeholder='QR, código de barras, serial o placa']").first().fill(uniqueIdentifier);

    const evidenceInput = page.locator("input[type='file'][accept='image/*']:visible").first();
    await evidenceInput.setInputFiles(faceFixturePaths);
    await evidenceInput.evaluate((inputElement) => {
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const faceTypes = ["face-front", "face-back", "face-left", "face-right"];
    const evidenceTypeSelects = page.locator(".evidence-photo-card select.form-select-sm");
    const evidenceCards = page.locator(".evidence-photo-card");

    const evidenceCardWaitStart = Date.now();
    while ((Date.now() - evidenceCardWaitStart) < timeoutMs) {
        const cardCount = await evidenceCards.count();
        if (cardCount >= faceTypes.length) {
            break;
        }
        await page.waitForTimeout(300);
    }

    const evidenceWaitStart = Date.now();
    while ((Date.now() - evidenceWaitStart) < timeoutMs) {
        const selectCount = await evidenceTypeSelects.count();
        if (selectCount >= faceTypes.length) {
            break;
        }
        await page.waitForTimeout(300);
    }

    const availableEvidenceTypeSelects = await evidenceTypeSelects.count();
    if (availableEvidenceTypeSelects < faceTypes.length) {
        const evidenceDebug = await page.evaluate(() => {
            const fileInput = document.querySelector("input[type='file'][accept='image/*']");
            const fileInputFiles = fileInput && "files" in fileInput && fileInput.files ? fileInput.files.length : -1;

            return {
                fileInputCount: document.querySelectorAll("input[type='file'][accept='image/*']").length,
                fileInputFiles,
                photoCardCount: document.querySelectorAll(".evidence-photo-card").length,
                selectSmallCount: document.querySelectorAll(".evidence-card select.form-select-sm").length,
                selectAnyCount: document.querySelectorAll(".evidence-card select").length,
                typeLabelCount: Array.from(document.querySelectorAll(".evidence-card label.form-label.small"))
                    .filter((label) => String(label.textContent || "").toLowerCase().includes("tipo de evidencia")).length,
                badges: Array.from(document.querySelectorAll(".evidence-card .badge")).map((badge) => String(badge.textContent || "").trim()).slice(0, 8),
            };
        });

        throw new Error(`No se encontraron ${faceTypes.length} selectores de tipo de evidencia: ${JSON.stringify(evidenceDebug)}`);
    }

    const faceTypeLabels = ["cara frente", "cara atrás", "cara izquierda", "cara derecha"];
    for (let index = 0; index < faceTypes.length; index += 1) {
        const desiredValue = faceTypes[index];
        const desiredLabel = faceTypeLabels[index];
        await evidenceTypeSelects.nth(index).evaluate((element, payload) => {
            const select = element;
            if (!(select instanceof HTMLSelectElement)) {
                throw new Error("selector de evidencia invalido");
            }

            const resolvedOption = Array.from(select.options).find((option) => {
                const normalizedValue = String(option.value || "").trim().toLowerCase();
                const normalizedLabel = String(option.textContent || "").trim().toLowerCase();
                return normalizedValue === payload.desiredValue || normalizedLabel.includes(payload.desiredLabel);
            });

            if (!resolvedOption) {
                throw new Error(`opcion de evidencia no encontrada para ${payload.desiredValue}`);
            }

            select.value = resolvedOption.value;
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }, { desiredValue, desiredLabel });
    }

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("#generateRepairProjectsOnSave", { timeout: timeoutMs });

    const generateProjectsSwitch = page.locator("#generateRepairProjectsOnSave").first();
    if (await generateProjectsSwitch.isChecked()) {
        await generateProjectsSwitch.uncheck();
    }

    await page.getByTestId("equipment-modal-save").click();
    await page.waitForSelector("[data-testid='equipment-modal-save']", { state: "detached", timeout: timeoutMs });
    await page.waitForSelector(".alert.alert-success", { timeout: timeoutMs });
    result.checks.savedRecord = true;

    const matchingRecords = await fetchRecordsByIdentifier(session, uniqueIdentifier);
    const createdRecord = matchingRecords.find((record) =>
        Array.isArray(record.items) && record.items.some((item) => String(item.receivedIdentifier || "").trim() === uniqueIdentifier),
    );

    assertOrThrow(Boolean(createdRecord), "No se encontro el registro recien creado en API");
    result.createdRecordId = String(createdRecord.id || "");

    const createdItem = createdRecord.items.find((item) => String(item.receivedIdentifier || "").trim() === uniqueIdentifier);
    assertOrThrow(Boolean(createdItem), "No se encontro el item creado dentro del registro API");

    result.checks.apiPersistedIntakeFields = createdRecord.intakeMethod === "transportadora"
        && String(createdRecord.intakeCarrier || "") === intakeCarrier
        && String(createdRecord.intakeTrackingNumber || "") === intakeTracking
        && String(createdRecord.intakeReceivedAt || "").includes("T");

    result.checks.apiPersistedOverrideFields = String(createdItem.industrialOverrideAuthorizedBy || "") === intakeAuthorizedBy
        && String(createdItem.industrialOverrideReason || "") === intakeReason
        && String(createdItem.industrialOverrideAuthorizedAt || "").includes("T")
        && createdItem.isIndustrial === false;

    await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForSelector(`[data-testid='work-equipment-edit-${result.createdRecordId}']`, { timeout: timeoutMs });
    await page.getByTestId(`work-equipment-edit-${result.createdRecordId}`).click();
    await page.waitForSelector("[data-testid='equipment-modal-cancel']", { timeout: timeoutMs });

    const persistedMethod = await receptionSelect(page, "Método de envío").inputValue();
    const persistedCarrier = await receptionInput(page, "Transportadora").inputValue();
    const persistedTracking = await receptionInput(page, "Guía / tracking").inputValue();

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-add-item']", { timeout: timeoutMs });
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector(".question-card", { timeout: timeoutMs });

    const persistedAuthorizedBy = await page.locator("label.form-label.small:has-text('Autorizado por') + input.form-control").first().inputValue();
    const persistedReason = await page.locator("label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().inputValue();

    result.checks.editLoadedPersistedValues = persistedMethod === "transportadora"
        && persistedCarrier === intakeCarrier
        && persistedTracking === intakeTracking
        && persistedAuthorizedBy === intakeAuthorizedBy
        && persistedReason === intakeReason;

    await page.getByTestId("equipment-modal-cancel").click();

    const screenshotPath = path.resolve(artifactsDir, `fase6-fase7-cycle-ok-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, value]) => value !== true);
    const hasErrors = result.pageErrors.length > 0;

    if (failedChecks.length > 0 || hasErrors) {
        throw new Error(`Checks fallidos: ${failedChecks.map(([key]) => key).join(", ")}${hasErrors ? " + pageErrors" : ""}`);
    }

    console.log("PLAYWRIGHT_FASE6_FASE7_CYCLE_OK");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);

    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const pageRef = browser.contexts()[0].pages()[0];
            const screenshotPath = path.resolve(artifactsDir, `fase6-fase7-cycle-fail-${Date.now()}.png`);
            await pageRef.screenshot({ path: screenshotPath, fullPage: true });
            result.screenshotPath = screenshotPath;

            const htmlPath = path.resolve(artifactsDir, `fase6-fase7-cycle-fail-${Date.now()}.html`);
            await fs.writeFile(htmlPath, await pageRef.content(), "utf8");
            result.htmlPath = htmlPath;
        }
    } catch {
        // Ignore screenshot failures.
    }

    console.error("PLAYWRIGHT_FASE6_FASE7_CYCLE_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    try {
        if (session && result.createdRecordId) {
            await archiveRecord(session, result.createdRecordId);
        }
    } catch {
        // Ignore cleanup errors.
    }

    if (browser) {
        await browser.close();
    }
}
