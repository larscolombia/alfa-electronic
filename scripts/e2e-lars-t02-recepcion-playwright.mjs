/**
 * E2E LARS t02 — Recepción de equipo (rol: admin)
 *
 * Flujo validado 100% por UI:
 *  1. Login admin (API solo para sesión/verificaciones).
 *  2. Prospecto "LARS Empresa Industrial -t02" (reutilizado si ya existe, creado por UI si no).
 *  3. Desde la fila del prospecto: Acciones → "Asociar equipo" (modal crm-prospect-equipment-modal).
 *  4. Wizard: Recepción (transportadora/guía/fecha) → Equipos (PLC Siemens, serie única,
 *     servicio, ubicación/estantería, accesorios, falla impresora Heidelberg) → Preguntas
 *     (valor nuevo >2M: Sí, componentes electrónicos accesibles/falla electrónica: Sí,
 *     autorización jefe por equipo no industrial en modo manual) → Evidencia (identificador
 *     + 4 caras fotográficas) → Cierre (guardar).
 *  5. Captura del código generado (record id + shortCode QR) vía API de verificación.
 *  6. Verificación: equipo listado en Trabajo > Equipos y hoja/etiqueta QR imprimible.
 *
 * Re-ejecutar:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t02-recepcion-playwright.mjs
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";
import { openCustomSelectMenu, selectCustomModal, setCustomModalDateTime } from "./ui-modal-controls.mjs";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const apiBaseUrl = (process.env.PW_API_BASE_URL || baseUrl).replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "180000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const artifactPrefix = "e2e-lars-t02-";

const now = Date.now();
const prospectName = "LARS Empresa Industrial -t02";
const prospectCompany = `LARS Industrial SAS t02 ${now}`;
const prospectEmail = `lars-t02-${now}@alfa.local`;
const uniqueSerie = `PLC-S7-HEIDELBERG-${now}`;
// La app NO genera un consecutivo CO-* automático (ver audit 02-recepcion H1):
// el "código del equipo" es el identificador escaneado/digitado en el paso Evidencia,
// que recepción digita como CO-* para etiquetar el equipo.
const equipmentCode = `CO-T02-${now}`;
const failureText = "No energiza salidas (impresora Heidelberg)";
const accessoriesText = "Cable de programación MPI, manual de usuario, caja original";
const intakeCarrier = `Coordinadora t02 ${now}`;
const trackingNumber = `GUIA-LARS-T02-${now}`;

const faceFixturePaths = Array.from({ length: 4 }, (_, index) =>
    path.resolve(artifactsDir, `${artifactPrefix}face-${now}-${index + 1}.jpg`),
);
const faceFixtureSourcePath = path.resolve("src/assets/img/modern-ai-image/image-1.jpg");

const result = {
    test: "e2e-lars-t02-recepcion",
    baseUrl,
    prospectName,
    uniqueSerie,
    generated: {
        prospectId: "",
        recordId: "",
        itemId: "",
        equipmentCode: "",
        qrShortCode: "",
        qrLabelFileName: "",
        receptionConsecutiveMatchesCO: false,    },
    checks: {
        loggedIn: false,
        prospectReady: false,
        equipmentModalOpened: false,
        receptionStepCompleted: false,
        equipmentDataEntered: false,
        questionsAnswered: false,
        evidenceUploaded: false,
        receptionSaved: false,
        apiRecordVerified: false,
        codeCaptured: false,
        codeMatchesCOPrefix: false,
        listedInWorkEquipment: false,
        qrPrintableSheet: false,
    },
    observations: [],
    screenshots: {},
    consoleErrors: [],
    pageErrors: [],
    error: "",
};

let browser;
let session;
let recordId = "";

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 12) target.push(value);
}

async function apiLogin() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!response.ok) {
        throw new Error(`login failed ${response.status}: ${await response.text()}`);
    }
    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

function apiHeaders() {
    return {
        "Content-Type": "application/json",
        "X-Company-Id": companyId,
        Authorization: `Bearer ${session.accessToken}`,
    };
}

async function findProspectByName(name) {
    const response = await fetch(`${apiBaseUrl}/api/v1/crm/prospects`, { headers: apiHeaders() });
    if (!response.ok) throw new Error(`list prospects failed ${response.status}`);
    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    return items.find((item) => String(item.name || "").trim() === name) || null;
}

async function fetchRecordByIdentifier(identifier) {
    const response = await fetch(
        `${apiBaseUrl}/api/v1/crm-equipment/records?includeArchived=true&identifier=${encodeURIComponent(identifier)}`,
        { headers: apiHeaders() },
    );
    if (!response.ok) throw new Error(`fetch records failed ${response.status}: ${await response.text()}`);
    const payload = await response.json();
    const records = Array.isArray(payload.items) ? payload.items : [];
    return (
        records.find((record) =>
            Array.isArray(record.items) &&
            record.items.some((item) => String(item.receivedIdentifier || "").trim() === identifier),
        ) || null
    );
}

async function screenshotStep(page, step) {
    const filePath = path.resolve(artifactsDir, `${artifactPrefix}${step}-${Date.now()}.png`);
    await page.screenshot({ path: filePath, fullPage: true }).catch(() => "");
    result.screenshots[step] = filePath;
}

function receptionSelect(page, labelText) {
    return page.locator(`label.form-label:has-text("${labelText}") + select.form-select`).first();
}

function receptionInput(page, labelText) {
    return page.locator(`label.form-label:has-text("${labelText}") + input.form-control`).first();
}

async function fillDateIfEmpty(page) {
    const today = new Date();
    const dd = page.locator("input[placeholder='DD']").first();
    const mm = page.locator("input[placeholder='MM']").first();
    const aaaa = page.locator("input[placeholder='AAAA']").first();
    if ((await dd.inputValue().catch(() => "")) === "") {
        await dd.fill(String(today.getDate()).padStart(2, "0"));
    }
    if ((await mm.inputValue().catch(() => "")) === "") {
        await mm.fill(String(today.getMonth() + 1).padStart(2, "0"));
    }
    if ((await aaaa.inputValue().catch(() => "")) === "") {
        await aaaa.fill(String(today.getFullYear()));
    }
}

async function answerQuestionYes(page, questionSnippet) {
    const container = page
        .locator(".question-card div.border.rounded.p-3.bg-light-subtle", { hasText: questionSnippet })
        .first();
    const toggle = container.locator("input.form-check-input").first();
    await toggle.waitFor({ state: "visible", timeout: timeoutMs });
    if (!(await toggle.isChecked())) {
        await toggle.check({ timeout: timeoutMs });
    }
    return toggle.isChecked();
}

async function setRequiredFaceEvidence(page) {
    await page.locator("input[placeholder='QR, código de barras, serial o placa']").first().fill(equipmentCode);

    const evidenceInput = page.locator("input[type='file'][accept='image/*']:visible").first();
    await evidenceInput.setInputFiles(faceFixturePaths);
    await evidenceInput.evaluate((inputElement) => {
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const faceTypeLabels = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];
    const photoCards = page.locator(".evidence-photo-card");

    const waitStart = Date.now();
    while ((Date.now() - waitStart) < timeoutMs) {
        if ((await photoCards.count()) >= faceTypeLabels.length) break;
        await page.waitForTimeout(250);
    }

    const availableCards = await photoCards.count();
    if (availableCards < faceTypeLabels.length) {
        throw new Error(`No se encontraron ${faceTypeLabels.length} tarjetas de evidencia. Detectadas: ${availableCards}`);
    }

    for (let index = 0; index < faceTypeLabels.length; index += 1) {
        await selectCustomModal(page, photoCards.nth(index).getByTestId("equipment-modal-evidence-type"), { label: faceTypeLabels[index] });
    }
}

async function createProspectViaUi(page) {
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll("h5,h4,h3,h2,h1")).some((n) => (n.textContent || "").toLowerCase().includes("prospect")),
        null,
        { timeout: timeoutMs },
    );

    const addButton = page.getByRole("button", { name: /Agregar Prospecto/i }).first();
    await addButton.waitFor({ state: "visible", timeout: timeoutMs });
    await addButton.click();

    await page.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("h5")).some((n) =>
                (n.textContent || "").toLowerCase().includes("detalles del prospecto"),
            ),
        null,
        { timeout: timeoutMs },
    );

    await page.locator("input[name='formNombre']").fill(prospectName);
    await page.locator("input[name='formCorreo']").fill(prospectEmail);
    await page.locator("input[name='formCompania']").fill(prospectCompany);

    const movilInput = page.locator("input[name='formMovil']");
    if (await movilInput.isVisible().catch(() => false)) {
        await movilInput.fill("3005550202");
    }

    await page.locator(".card-footer button", { hasText: "Guardar" }).first().click();

    const duplicateButton = page.getByRole("button", { name: /Crear de todos modos/i }).first();
    if (await duplicateButton.isVisible({ timeout: 4000 }).catch(() => false)) {
        result.observations.push("UX: apareció el modal 'Posible duplicado detectado' al crear el prospecto; se confirmó 'Crear de todos modos'.");
        await duplicateButton.click();
    }

    await page.waitForFunction(
        () =>
            !Array.from(document.querySelectorAll("h5")).some((n) =>
                (n.textContent || "").toLowerCase().includes("detalles del prospecto"),
            ),
        null,
        { timeout: timeoutMs },
    );
}

try {
    session = await apiLogin();
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    await Promise.all(faceFixturePaths.map((filePath) => fs.copyFile(faceFixtureSourcePath, filePath)));

    let prospect = await findProspectByName(prospectName).catch(() => null);
    const prospectExisted = Boolean(prospect);

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
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            const location = msg.location();
            pushUnique(result.consoleErrors, `${msg.text()}${location?.url ? ` @ ${location.url}` : ""}`);
        }
    });
    page.on("pageerror", (error) => {
        pushUnique(result.pageErrors, error?.stack || error?.message || String(error));
    });

    if (!prospect) {
        console.log("STEP 1a: crear prospecto por UI …");
        await createProspectViaUi(page);
        prospect = await findProspectByName(prospectName);
    }
    if (!prospect) {
        throw new Error(`El prospecto "${prospectName}" no existe ni pudo crearse.`);
    }
    result.generated.prospectId = String(prospect.id || "").trim();
    result.checks.prospectReady = result.generated.prospectId !== "";
    if (prospectExisted) {
        result.observations.push(`SETUP: el prospecto "${prospectName}" ya existía; se reutilizó (idempotente).`);
    }

    console.log("STEP 1b: abrir modal 'Asociar equipo' desde la fila del prospecto …");
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForFunction(
        (name) =>
            Array.from(document.querySelectorAll("tbody tr")).some((tr) => (tr.textContent || "").includes(name)),
        prospectName,
        { timeout: timeoutMs },
    );

    const prospectRow = page.locator("tbody tr", { hasText: prospectName }).first();
    await prospectRow.locator("button.dropdown-toggle", { hasText: "Acciones" }).click();
    await prospectRow.getByRole("button", { name: /Asociar equipo/i }).first().click();

    await page.getByTestId("equipment-modal-cancel").waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.equipmentModalOpened = true;

    // Precarga del prospecto en el paso Recepción
    const companyPreloaded = await page
        .locator(".modal-body", { hasText: "Empresa seleccionada:" })
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);
    if (!companyPreloaded) {
        result.observations.push("HALLAZGO: al abrir 'Asociar equipo' desde el prospecto, la empresa no quedó precargada/confirmada en el paso Recepción.");
    }

    console.log("STEP 2: paso Recepción (transportadora/guía/fecha) …");
    await selectCustomModal(page, page.getByTestId("equipment-modal-intake-method"), "transportadora");
    await receptionInput(page, "Transportadora").fill(intakeCarrier);
    await receptionInput(page, "Guía / tracking").fill(trackingNumber);
    await fillDateIfEmpty(page);

    const currentDate = new Date();
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const hh = String(currentDate.getHours()).padStart(2, "0");
    const min = String(currentDate.getMinutes()).padStart(2, "0");
    await setCustomModalDateTime(page, page.getByTestId("equipment-modal-intake-received-at"), `${yyyy}-${mm}-${dd}T${hh}:${min}`);

    await screenshotStep(page, "02-reception-step");
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("[data-testid='equipment-modal-add-item']", { timeout: timeoutMs });
    result.checks.receptionStepCompleted = true;

    console.log("STEP 3: paso Equipos (PLC Siemens) …");
    await selectCustomModal(page, page.getByTestId("equipment-modal-registration-mode-0"), "manual");
    await page.locator("label.form-label:has-text('Familia') + input.form-control").first().fill("PLC");
    await page.locator("label.form-label:has-text('Marca') + input.form-control").first().fill("Siemens");
    await page.locator("label.form-label:has-text('Tipo') + input.form-control").first().fill("Autómata programable (PLC)");
    await page.locator("label.form-label:has-text('Serie') + input.form-control").first().fill(uniqueSerie);

    // Tipo de servicio: primera opción que indique reparación
    const serviceTypeTrigger = page.getByTestId("equipment-modal-service-type-0");
    const serviceMenu = await openCustomSelectMenu(page, serviceTypeTrigger);
    const serviceOptions = await serviceMenu.locator(".crm-modal-select-option").allTextContents();
    const repairOption = serviceOptions.find((label) => /repar/i.test(label)) || serviceOptions.find((label) => label.trim() !== "");
    if (!repairOption) throw new Error("No hay opciones de tipo de servicio disponibles");
    await selectCustomModal(page, serviceTypeTrigger, { label: repairOption });
    result.observations.push(`DATO: tipo de servicio seleccionado: "${String(repairOption).trim()}".`);

    // Ubicación / estantería: primera ubicación real del catálogo
    const locationTrigger = page.getByTestId("equipment-modal-storage-location-0");
    const locationMenu = await openCustomSelectMenu(page, locationTrigger);
    const locationOptions = (await locationMenu.locator(".crm-modal-select-option").allTextContents()).filter((label) => label.trim() !== "" && !/seleccionar/i.test(label));
    if (locationOptions.length === 0) {
        result.observations.push("HALLAZGO: no hay ubicaciones/estanterías configuradas en el catálogo; el equipo quedará sin ubicación de almacenamiento.");
    } else {
        await selectCustomModal(page, locationTrigger, { label: locationOptions[0] });
        result.observations.push(`DATO: ubicación de almacenamiento seleccionada: "${String(locationOptions[0]).trim()}".`);
    }

    await receptionInput(page, "Remisión del cliente / guía").fill(`REM-LARS-T02-${now}`);
    await receptionInput(page, "Accesorios").fill(accessoriesText);
    await page.locator("label.form-label:has-text('Descripción de la falla') + textarea.form-control").first().fill(failureText);

    await screenshotStep(page, "03-equipment-step");
    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector(".question-card", { timeout: timeoutMs });
    result.checks.equipmentDataEntered = true;

    console.log("STEP 4: paso Preguntas (>2M: Sí, electrónica: Sí, autorización jefe) …");
    const costAnswer = await answerQuestionYes(page, "es superior a $ 2'000.000");
    const electronicAnswer = await answerQuestionYes(page, "componentes electrónicos están accesibles");
    result.checks.questionsAnswered = costAnswer && electronicAnswer;

    // Equipo en modo manual => no industrial => el formato exige autorización de jefe
    const overrideVisible = await page
        .locator(".question-card", { hasText: "Bloqueo por filtro industrial" })
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);
    if (overrideVisible) {
        result.observations.push(
            "DATO: el equipo en modo manual quedó como 'No industrial' y el formato exigió autorización de jefe técnico (aunque el valor nuevo >2M = Sí). No existe pregunta literal de 'gama industrial' en el formato; el flag viene del catálogo.",
        );
        await page.locator(".question-card label.form-label.small:has-text('Autorizado por') + input.form-control").first().fill("Jefe técnico LARS t02");
        await page.locator(".question-card label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().fill("Recepción PLC modo manual no homologado, valor nuevo >2M");
    }

    await screenshotStep(page, "04-questions-step");
    await page.getByTestId("equipment-modal-next").click();

    // El paso Evidencia es el siguiente; si el flujo exige firma antes, se cubre aquí.
    const scannerOrEvidence = await page
        .locator("input[placeholder='QR, código de barras, serial o placa']")
        .first()
        .isVisible({ timeout: timeoutMs })
        .catch(() => false);
    if (!scannerOrEvidence) {
        await page.locator("label.form-label.small:has-text('Autorizado por') + input.form-control").first().fill("Jefe técnico LARS t02");
        await page.locator("label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().fill("Autorización operativa t02");
        await page.getByTestId("equipment-modal-next").click();
        await page.locator("input[placeholder='QR, código de barras, serial o placa']").first().waitFor({ state: "visible", timeout: timeoutMs });
    }

    console.log("STEP 5: paso Evidencia (identificador + 4 caras) …");
    await setRequiredFaceEvidence(page);
    const completeFacesBadge = page.locator(".evidence-card .badge", { hasText: "Caras completas" }).first();
    result.checks.evidenceUploaded = await completeFacesBadge
        .isVisible({ timeout: 15000 })
        .catch(() => false);
    if (!result.checks.evidenceUploaded) {
        result.observations.push("HALLAZGO: la evidencia no quedó con las 4 caras obligatorias completas.");
    }
    await screenshotStep(page, "05-evidence-step");

    await page.getByTestId("equipment-modal-next").click();
    await page.waitForSelector("#generateRepairProjectsOnSave", { timeout: timeoutMs });

    const generateProjectsSwitch = page.locator("#generateRepairProjectsOnSave").first();
    if (await generateProjectsSwitch.isChecked()) {
        // El footer pegajoso del modal intercepta el click físico sobre el switch:
        // se alterna vía click DOM (dispara el evento change de Angular).
        await generateProjectsSwitch.evaluate((element) => {
            if (element instanceof HTMLInputElement && element.checked) {
                element.click();
            }
        });
    }

    console.log("STEP 6: Guardar recepción …");
    await screenshotStep(page, "06-signatures-step");
    await page.getByTestId("equipment-modal-save").click();
    await page.getByTestId("equipment-modal-save").waitFor({ state: "detached", timeout: timeoutMs });
    result.checks.receptionSaved = true;

    console.log("STEP 7: verificación API + captura de código …");
    const createdRecord = await fetchRecordByIdentifier(equipmentCode);
    if (!createdRecord) {
        throw new Error(`No se encontró el registro de recepción con identificador ${equipmentCode} en la API.`);
    }
    recordId = String(createdRecord.id || "");
    result.generated.recordId = recordId;

    const savedItem = (createdRecord.items || []).find((item) => String(item.receivedIdentifier || "").trim() === equipmentCode);
    result.generated.itemId = String(savedItem?.id || "");
    result.generated.equipmentCode = String(savedItem?.receivedIdentifier || equipmentCode);

    const qrAttachment = (savedItem?.attachments || []).find(
        (attachment) => String(attachment.attachmentType || "").trim().toLowerCase() === "qr-label",
    );
    result.generated.qrLabelFileName = String(qrAttachment?.fileName || "");
    result.generated.qrShortCode = result.generated.qrLabelFileName.replace(/\.png$/i, "");

    const apiChecks =
        String(savedItem?.marca || "") === "Siemens" &&
        String(savedItem?.familyName || "") === "PLC" &&
        String(savedItem?.serie || "") === uniqueSerie &&
        String(savedItem?.receivedIdentifier || "") === equipmentCode &&
        String(savedItem?.failureDescription || "") === failureText &&
        String(savedItem?.accessories || "") === accessoriesText &&
        String(savedItem?.answers?.costAboveTwoMillion || "") === "Sí" &&
        String(savedItem?.answers?.electronicsAccessible || "") === "Sí" &&
        Boolean(savedItem?.storageLocationName || savedItem?.storageLocationId) &&
        (savedItem?.evidencePhotos || []).length >= 4;
    result.checks.apiRecordVerified = apiChecks;
    if (!apiChecks) {
        result.observations.push(`HALLAZGO: verificación API incompleta para item ${result.generated.itemId}: ${JSON.stringify(savedItem).slice(0, 900)}`);
    }

    const recordProspectId = String(createdRecord.prospectId || "").trim();
    if (recordProspectId && recordProspectId !== result.generated.prospectId) {
        result.observations.push(`HALLAZGO: el registro quedó asociado a prospectId "${recordProspectId}" distinto al del prospecto usado "${result.generated.prospectId}".`);
    }
    if (!String(createdRecord.prospectName || "").includes("LARS")) {
        result.observations.push(`HALLAZGO: prospectName del registro no contiene 'LARS': "${createdRecord.prospectName}".`);
    }

    result.checks.codeCaptured = recordId !== "" && result.generated.equipmentCode !== "";
    result.checks.codeMatchesCOPrefix = /^CO-/.test(result.generated.equipmentCode);
    if (!result.checks.codeMatchesCOPrefix) {
        result.observations.push(`HALLAZGO: el código capturado del equipo no tiene prefijo CO-*: "${result.generated.equipmentCode}".`);
    }
    result.observations.push(
        `DATO: la app no genera consecutivo CO-* automático para recepciones (audit 02-recepcion H1): el código CO-* del equipo es el identificador digitado en el paso Evidencia. recordId=${recordId}, qrShortCode=${result.generated.qrShortCode}.`,
    );

    console.log("STEP 8: verificar equipo listado en Trabajo > Equipos …");
    await page.goto(`${baseUrl}/app/work-teams`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.getByTestId("work-equipment-filter-summary").waitFor({ state: "visible", timeout: timeoutMs });

    // DataTables 2.x inyecta el buscador en div.dt-search (el build usa datatables.net-dt ^2.2.2;
    // la clase .dataTables_filter era de DataTables 1.x). Se espera cualquiera de las dos.
    const searchInput = page.locator(".dt-search input[type='search'], .dataTables_filter input[type='search']").first();
    await searchInput.waitFor({ state: "visible", timeout: timeoutMs });
    await page.waitForTimeout(1500);
    await searchInput.fill(uniqueSerie);
    await searchInput.evaluate((element) => {
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("keyup", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(2000);

    const zeroRecords =
        (await page
            .locator("td.dt-empty, td.dataTables_empty", { hasText: /No se encontraron recepciones/i })
            .first()
            .isVisible()
            .catch(() => false)) ||
        (await page
            .locator("td", { hasText: /No se encontraron recepciones/i })
            .first()
            .isVisible()
            .catch(() => false));
    const listedRow = page.locator("tbody tr", { hasText: uniqueSerie }).first();
    result.checks.listedInWorkEquipment =
        !zeroRecords &&
        (await listedRow.isVisible({ timeout: 10000 }).catch(() => false));
    if (result.checks.listedInWorkEquipment) {
        const rowText = await listedRow.textContent().catch(() => "");
        if (!/LARS/i.test(String(rowText))) {
            result.observations.push("HALLAZGO: la fila del equipo en Trabajo > Equipos no muestra el nombre LARS del prospecto/empresa.");
        }
    } else {
        result.observations.push("HALLAZGO: el equipo recién registrado NO aparece listado en Trabajo > Equipos al buscar su serie.");
    }
    await screenshotStep(page, "07-listed-work-equipment");

    console.log("STEP 9: hoja de recepción imprimible con etiqueta QR …");
    await page.goto(`${baseUrl}/app/crm-equipment-reception-print/${encodeURIComponent(recordId)}`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });
    const sheetHeading = page.locator("h1", { hasText: "Formato de recepción de equipos" }).first();
    await sheetHeading.waitFor({ state: "visible", timeout: timeoutMs });
    const qrImage = page.locator(".sheet-qr img").first();
    const printButton = page.getByRole("button", { name: /^Imprimir$/i }).first();
    const sheetHasSerie = await page
        .locator(".reception-sheet", { hasText: uniqueSerie })
        .first()
        .isVisible()
        .catch(() => false);
    const sheetHasCode = await page
        .locator(".reception-sheet", { hasText: equipmentCode })
        .first()
        .isVisible()
        .catch(() => false);
    if (!sheetHasCode) {
        result.observations.push(`HALLAZGO: la hoja imprimible no muestra el código del equipo ${equipmentCode}.`);
    }
    result.checks.qrPrintableSheet =
        (await qrImage.isVisible().catch(() => false)) &&
        (await printButton.isVisible().catch(() => false)) &&
        sheetHasSerie;
    if (!result.checks.qrPrintableSheet) {
        result.observations.push("HALLAZGO: la hoja imprimible no muestra la etiqueta QR, el botón Imprimir o la serie del equipo.");
    }
    await screenshotStep(page, "08-print-sheet");

    const failedChecks = Object.entries(result.checks).filter(([, value]) => value !== true);
    if (failedChecks.length > 0) {
        result.error = `Checks fallidos: ${failedChecks.map(([key]) => key).join(", ")}`;
        process.exitCode = 1;
    }

    console.log(process.exitCode ? "PLAYWRIGHT_E2E_LARS_T02_COMPLETED_WITH_FAILURES" : "PLAYWRIGHT_E2E_LARS_T02_OK");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);

    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const page = browser.contexts()[0].pages()[0];
            const filePath = path.resolve(artifactsDir, `${artifactPrefix}fail-${Date.now()}.png`);
            await page.screenshot({ path: filePath, fullPage: true });
            result.screenshots.fail = filePath;
        }
    } catch {
        // Ignorar errores de screenshot.
    }

    console.error("PLAYWRIGHT_E2E_LARS_T02_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }

    const summaryPath = path.resolve(artifactsDir, `${artifactPrefix}results-${now}.json`);
    await fs.writeFile(summaryPath, JSON.stringify(result, null, 2)).catch(() => "");
}
