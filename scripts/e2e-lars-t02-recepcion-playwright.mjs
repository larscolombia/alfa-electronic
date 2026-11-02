/**
 * E2E LARS t02 — Recepción de equipo (rol: admin)
 *
 * Flujo validado 100% por UI:
 *  1. Login admin (API solo para sesión/verificaciones).
 *  2. Prospecto "LARS Empresa Industrial -t02" (reutilizado si ya existe, creado por UI si no).
 *  3. Modal de equipos desde Trabajo > Recepción (/app/work-equipment-reception, botón 'Nuevo
 *     equipo'), asociando el prospecto por la combobox Empresa (catálogo Clientes + Prospectos).
 *  4. Wizard: Recepción (transportadora/guía/fecha) → Equipos (PLC Siemens, serie única,
 *     servicio, ubicación/estantería, falla impresora Heidelberg) → Preguntas
 *     (valor nuevo >2M: Sí, componentes electrónicos accesibles/falla electrónica: Sí,
 *     autorización jefe por equipo no industrial en modo manual) → Evidencia (identificador
 *     + frente/atrás/placa) → Cierre (guardar).
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
import { selectCustomModal, setCustomModalDateTime } from "./ui-modal-controls.mjs";

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
// La UI persiste name === company === formCompania (executeProspectSave) y findProspectByName()
// busca por `name`: la empresa digitada debe ser EXACTAMENTE prospectName, o el paso 1b no lo encontraría.
const prospectEmail = `lars-t02-${now}@alfa.local`;
// El botón Guardar exige NIT válido (/^\d+-\d+$/): sin esto queda [disabled] y el click es un no-op.
const prospectNit = `900${String(now).slice(-6)}-3`;
const uniqueSerie = `PLC-S7-HEIDELBERG-${now}`;
// La app NO genera un consecutivo CO-* automático (ver audit 02-recepcion H1):
// el "código del equipo" es el identificador escaneado/digitado en el paso Evidencia,
// que recepción digita como CO-* para etiquetar el equipo.
const equipmentCode = `CO-T02-${now}`;
const failureText = "No energiza salidas (impresora Heidelberg)";
const intakeCarrier = `Coordinadora t02 ${now}`;
const trackingNumber = `GUIA-LARS-T02-${now}`;

const faceFixturePaths = Array.from({ length: 3 }, (_, index) =>
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

    // UI actual (required-evidence-grid): un input único por evidencia obligatoria, oculto y single-file,
    // id = 'evidence-face-' + item.id + '-' + faceType. handleRequiredFaceEvidenceSelected()
    // fija photo.evidenceType al subir: el slot ya nace clasificado.
    const faceTypes = ["face-front", "face-back", "serial-plate"];
    for (let index = 0; index < faceTypes.length; index += 1) {
        const slotInput = page.locator(`input[type='file'][accept='image/*'][id$="-${faceTypes[index]}"]`).first();
        await slotInput.setInputFiles(faceFixturePaths[index]);
    }

    // Cada slot renderiza su miniatura <img> cuando la foto quedó procesada (EXIF + hash).
    const slotThumbs = page.locator(".required-evidence-slot img");
    const waitStart = Date.now();
    while ((Date.now() - waitStart) < timeoutMs) {
        if ((await slotThumbs.count()) >= faceTypes.length) break;
        await page.waitForTimeout(250);
    }

    const availableThumbs = await slotThumbs.count();
    if (availableThumbs < faceTypes.length) {
        throw new Error(`No se procesaron las ${faceTypes.length} fotos de caras obligatorias. Miniaturas detectadas: ${availableThumbs}`);
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

    // El panel de creacion es inline (no hay heading "Detalles del prospecto" en la UI actual):
    // el sentinel robusto es que los inputs del formulario ya esten visibles.
    const companiaInput = page.locator("input[name='formCompania']").first();
    await companiaInput.waitFor({ state: "visible", timeout: timeoutMs });

    // executeProspectSave() persiste name === company === formCompania y findProspectByName()
    // busca por `name`: se llena AQUÍ exactamente prospectName (no un valor de empresa distinto).
    await companiaInput.fill(prospectName);
    await page.locator("input[name='formCorreo']").fill(prospectEmail);

    // Sin NIT válido el botón Guardar queda [disabled]: el click no haría nada.
    const nitInput = page.locator("input[name='formNit']").first();
    await nitInput.waitFor({ state: "visible", timeout: timeoutMs });
    await nitInput.fill(prospectNit);

    const movilInput = page.locator("input[name='formMovil']");
    if (await movilInput.isVisible().catch(() => false)) {
        await movilInput.fill("3005550202");
    }

    // Mismo boton que REC-06 (testid estable del panel inline). "Guardar y agregar otro" no casa.
    await page.getByTestId("prospect-save-btn").click();

    const duplicateButton = page.getByRole("button", { name: /Crear de todos modos/i }).first();
    if (await duplicateButton.isVisible({ timeout: 4000 }).catch(() => false)) {
        result.observations.push("UX: apareció el modal 'Posible duplicado detectado' al crear el prospecto; se confirmó 'Crear de todos modos'.");
        await duplicateButton.click();
    }

    // Evidencia de éxito contra la UI actual (NO hay tabla de filas): tras guardar el panel
    // cierra y reabre la búsqueda; escribir el nombre debe devolver su card en los resultados.
    const searchInput = page.locator("#prospects-search").first();
    await searchInput.waitFor({ state: "visible", timeout: timeoutMs });
    await searchInput.fill(prospectName);
    await page
        .locator("[data-testid='prospect-search-results'] .list-group-item", { hasText: prospectName })
        .first()
        .waitFor({ state: "visible", timeout: timeoutMs });
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

    console.log("STEP 1b: abrir modal de equipos (Trabajo > Recepción) y asociar el prospecto …");
    // En la UI actual NO existe "Acciones → Asociar equipo" sobre una fila del prospecto.
    // La recepción se crea desde /app/work-equipment-reception (botón 'Nuevo equipo') y el
    // cliente/prospecto se asocia por la combobox Empresa del modal.
    await page.goto(`${baseUrl}/app/work-equipment-reception`, { waitUntil: "networkidle", timeout: timeoutMs });

    const createButton = page.getByTestId("work-equipment-create").first();
    await createButton.waitFor({ state: "visible", timeout: timeoutMs });
    await createButton.click();

    await page.getByTestId("equipment-modal-cancel").waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.equipmentModalOpened = true;

    // Asociar el prospecto LARS creado en 1a desde la combobox (catálogo Clientes + Prospectos):
    // selectCompanyOption() fija draft.companyName y autocompleta NIT/contacto.
    const companySearch = page.getByTestId("equipment-modal-company-search");
    await companySearch.waitFor({ state: "visible", timeout: timeoutMs });
    await companySearch.fill(prospectName);

    const companyItem = page.locator(".company-dropdown-item", { hasText: prospectName }).first();
    await companyItem.waitFor({ state: "visible", timeout: timeoutMs });
    await companyItem.click();

    // Confirmación visual de que el borrador tomó la empresa LARS (no quedó 'Recepción directa').
    const selectedCompanyLine = page.locator("text=Empresa seleccionada:").first();
    await selectedCompanyLine.waitFor({ state: "visible", timeout: timeoutMs });
    if (!(await selectedCompanyLine.textContent().catch(() => ""))?.includes(prospectName)) {
        result.observations.push(`HALLAZGO: la combobox no muestra el prospecto asociado: "${(await selectedCompanyLine.textContent().catch(() => "")) || "(sin texto)"}".`);
    }

    console.log("STEP 2: paso Recepción (transportadora/guía/fecha) …");
    await selectCustomModal(page, page.getByTestId("equipment-modal-intake-method"), "transportadora");
    await receptionInput(page, "Transportadora").fill(intakeCarrier);
    await receptionInput(page, "Guía / tracking").fill(trackingNumber);

    // "Fecha de recepción" es <input type="date"> nativo autocompletado por el getter del
    // componente (receptionDateInput → fallback a hoy). Solo se aserta que trae fecha ISO.
    const receptionDateValue = await page.locator(".reception-date input[type='date']").first().inputValue();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(receptionDateValue)) {
        result.observations.push(`HALLAZGO: "Fecha de recepción" no trae una fecha ISO (valor="${receptionDateValue}").`);
    } else {
        result.observations.push(`DATO: "Fecha de recepción" autocompletado por la UI con "${receptionDateValue}".`);
    }

    const currentDate = new Date();
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(currentDate.getDate()).padStart(2, "0");
    const hh = String(currentDate.getHours()).padStart(2, "0");
    const min = String(currentDate.getMinutes()).padStart(2, "0");
    await setCustomModalDateTime(page, page.getByTestId("equipment-modal-intake-received-at"), `${yyyy}-${mm}-${dd}T${hh}:${min}`);

    // Verificación UI del commit: el alert de requerido debe haber desaparecido.
    const receivedAtRequiredAlert = page.getByTestId("intake-received-at-required");
    if (await receivedAtRequiredAlert.isVisible().catch(() => false)) {
        await screenshotStep(page, "02-reception-step-validation-fail");
        throw new Error(
            `Paso Recepción: el alert "${(await receivedAtRequiredAlert.textContent().catch(() => ""))?.trim()}" sigue visible; ` +
            `draft.intakeReceivedAt no quedó fijado (carrier="${(await receptionInput(page, "Transportadora").inputValue().catch(() => ""))}", ` +
            `guía="${(await receptionInput(page, "Guía / tracking").inputValue().catch(() => ""))}").`,
        );
    }

    await screenshotStep(page, "02-reception-step");
    await page.getByTestId("equipment-modal-next").click();

    // Fail-fast con diagnóstico: si el wizard no avanza en 15 s, capturamos la causa exacta
    // (mensaje de validación del modal + estado de los campos) en vez de esperar timeoutMs.
    // Marcador de paso Equipos: el <select> "Tipo de servicio" del primer equipo (testid
    // equipment-modal-service-type-0). OJO: NO usar equipment-modal-add-item como marcador:
    // ese botón vive detrás de *ngIf allowMultipleEquipment=false y nunca renderiza.
    const equipmentStep = page.getByTestId("equipment-modal-service-type-0");
    try {
        await equipmentStep.waitFor({ state: "visible", timeout: 15000 });
    } catch (advanceError) {
        await screenshotStep(page, "02-reception-step-no-advance");
        const validationMessage = ((await page.getByTestId("equipment-modal-validation-message").textContent().catch(() => "")) || "").trim();
        const carrierValue = await receptionInput(page, "Transportadora").inputValue().catch(() => "(campo no visible)");
        const trackingValue = await receptionInput(page, "Guía / tracking").inputValue().catch(() => "(campo no visible)");
        const datetimeDisplay = ((await page.getByTestId("equipment-modal-intake-received-at").textContent().catch(() => "")) || "").trim();
        result.observations.push(
            `DIAGNÓSTICO transición Recepción→Equipos: validación="${validationMessage || "(sin mensaje)"}", ` +
            `carrier="${carrierValue}", guía="${trackingValue}", datetime-trigger="${datetimeDisplay}", ` +
            `consoleErrors=${result.consoleErrors.slice(-3).join(" | ")}`,
        );
        throw new Error(
            `Paso Recepción→Equipos no avanzó. validación="${validationMessage || "(sin mensaje)"}", ` +
            `carrier="${carrierValue}", guía="${trackingValue}", datetime-trigger="${datetimeDisplay}" (ver observations).`,
        );
    }
    result.checks.receptionStepCompleted = true;

    console.log("STEP 3: paso Equipos (PLC Siemens) …");
    // Familia es un <select> nativo (STANDARD_EQUIPMENT_FAMILIES: A - Alimentacion | CE - Tarjeta
    // Electrónica), NO un input libre. { label } → selectOption({label}) sobre el option real.
    await selectCustomModal(page, page.getByTestId("equipment-modal-family-0"), { label: "CE - Tarjeta Electrónica" });
    await page.locator("label.form-label:has-text('Marca') + input.form-control").first().fill("Siemens");
    await page.locator("label.form-label:has-text('Tipo') + input.form-control").first().fill("Autómata programable (PLC)");
    await page.locator("label.form-label:has-text('Serie') + input.form-control").first().fill(uniqueSerie);

    // Tipo de servicio: <select> nativo (catálogo STANDARD_SERVICE_TYPES). selectCustomModal
    // detecta el SELECT y usa selectOption; se busca por regex para no depender del acento.
    const serviceTypeTrigger = page.getByTestId("equipment-modal-service-type-0");
    await selectCustomModal(page, serviceTypeTrigger, { labelRegex: /reparaci[oó]n/i });
    result.observations.push(`DATO: tipo de servicio seleccionado: "${(await serviceTypeTrigger.inputValue().catch(() => ""))}" (label: Reparación).`);

    // Ubicación de almacenamiento: la UI actual es un campo LIBRE en mayúsculas (acepta números),
    // sin lista desplegable. onStorageLocationInput() fuerza mayúsculas; se dispara además el
    // evento change para que resolveStorageLocation() lo procese igual que con teclado.
    const storageValue = `ESTANTERIA-T02-${String(now).slice(-6)}`;
    const locationInput = page.getByTestId("equipment-modal-storage-location-0");
    await locationInput.waitFor({ state: "visible", timeout: timeoutMs });
    await locationInput.fill(storageValue);
    await locationInput.evaluate((inputElement) => {
        inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    });
    result.observations.push(`DATO: ubicación de almacenamiento registrada (campo libre): "${storageValue}".`);

    await receptionInput(page, "Remisión del cliente / guía").fill(`REM-LARS-T02-${now}`);
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
    // isVisible({timeout}) NO espera (retorna inmediato): tras el click a 'Siguiente' la
    // vista nueva aún no está en DOM y el probe caía al fallback equivocado. Se usa waitFor:
    // espera de verdad hasta que el input QR sea visible (determinista) o timeout real.
    const scannerInput = page.locator("input[placeholder='QR, código de barras, serial o placa']").first();
    const reachedEvidenceStep = await scannerInput
        .waitFor({ state: "visible", timeout: 20000 })
        .then(() => true)
        .catch(() => false);
    if (!reachedEvidenceStep) {
        // Fallback de robustez: paso intermedio de autorización/firma (no se ha observado
        // en el flujo actual; si aparece, se completa y se avanza a Evidencia).
        await page.locator("label.form-label.small:has-text('Autorizado por') + input.form-control").first().fill("Jefe técnico LARS t02");
        await page.locator("label.form-label.small:has-text('Motivo de autorización') + input.form-control").first().fill("Autorización operativa t02");
        await page.getByTestId("equipment-modal-next").click();
        await scannerInput.waitFor({ state: "visible", timeout: timeoutMs });
    }

    console.log("STEP 5: paso Evidencia (identificador + frente/atrás/placa) …");
    await setRequiredFaceEvidence(page);
    // En el paso de ingreso la señal de estado es el badge del panel "Fotos obligatorias"
    // (.evidence-side-panel): 'Completas' cuando hasRequiredFaceEvidence() pasa. El texto
    // 'Caras completas' solo existe en la tarjeta de revisión posterior (reviewItems).
    // isVisible({timeout}) NO espera: se usa waitFor para dar tiempo al commit visual.
    // El template del badge lleva saltos de línea alrededor de la interpolación:
    // anclar con \s* y sin bandera /i para no capturar 'Caras completas' (revisión) ni 'Pendientes'.
    const completeFacesBadge = page.locator(".evidence-side-panel span.badge", { hasText: /^\s*Completas\s*$/ }).first();
    result.checks.evidenceUploaded = await completeFacesBadge
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false);
    if (!result.checks.evidenceUploaded) {
        result.observations.push("HALLAZGO: la evidencia no quedó con las 3 evidencias obligatorias (frente/atrás/placa) completas.");
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
        // Familia ahora es select estándar (STANDARD_EQUIPMENT_FAMILIES): el test eligió CE.
        String(savedItem?.familyName || "") === "CE - Tarjeta Electrónica" &&
        String(savedItem?.serie || "") === uniqueSerie &&
        String(savedItem?.receivedIdentifier || "") === equipmentCode &&
        String(savedItem?.failureDescription || "") === failureText &&
        String(savedItem?.answers?.costAboveTwoMillion || "") === "Sí" &&
        String(savedItem?.answers?.electronicsAccessible || "") === "Sí" &&
        Boolean(savedItem?.storageLocationName || savedItem?.storageLocationId) &&
        // 3 evidencias obligatorias actuales: FRENTE, ATRÁS y PLACA (requiredFaceEvidenceTypes).
        (savedItem?.evidencePhotos || []).length >= 3;
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
