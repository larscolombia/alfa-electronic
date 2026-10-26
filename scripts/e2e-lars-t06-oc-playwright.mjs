/**
 * E2E T06 — ORDEN DE COMPRA DEL CLIENTE (rol: admin).
 *
 * Flujo validado (acción de negocio 100% por UI):
 *   1. Login admin (API, sesión reutilizada en localStorage para el browser).
 *   2. Setup mínimo vía API: prospecto + equipo (recepción CRM) + caso técnico
 *      (kanban: diagnostico → por-cotizar) + cotización Enviada con
 *      selectedEquipmentIds vinculado al equipo.
 *   3. UI /app/crm-cotizaciones: abrir la cotización y pulsar "Cargar OC",
 *      diligenciar número OC-LARS-1042, fecha de hoy y un PDF mínimo generado
 *      por el propio script, y guardar ("Guardar OC y pasar a pedir repuestos").
 *   4. Verificación cotización: estado Aprobado + campos OC persistidos (API).
 *   5. Verificación interconexión cotización→técnica: el caso del kanban pasó
 *      a la columna "pedir-repuestos" con properties.equipmentRepairStatus y
 *      purchaseOrderNumber sincronizados (API + UI kanban).
 *
 * Referencias: check-cotizacion-a-pago-v2.mjs, check-cotizacion-a-pago-integridad-playwright.mjs,
 *              check-crm-quote-equipment-playwright.mjs, check-remission-preview-oc-playwright.mjs
 *
 * Uso:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t06-oc-playwright.mjs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const apiBaseUrl = (process.env.PW_API_BASE_URL || new URL(baseUrl).origin).replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const RUN_ID = Date.now();
const SUF = `t06-${RUN_ID}`;
const OC_NUMBER = "OC-LARS-1042";
// Fecha de hoy en zona local (YYYY-MM-DD) — la que el usuario admin vería.
const OC_DATE = (() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
})();

const PROSPECT_NAME = `PW T06 ${RUN_ID}`;
const PROSPECT_EMAIL = `pw-prospecto-t06-${RUN_ID}@alfa.local`;
const PROSPECT_COMPANY = `PW T06 Company ${RUN_ID}`;
const EQUIPMENT_RECORD_ID = `pw-t06-rec-${RUN_ID}`;
const EQUIPMENT_ITEM_ID = `pw-t06-item-${RUN_ID}`;
const EQUIPMENT_SERIE = `PWT06-${RUN_ID}`;
const PROJECT_ID = `pw-t06-proj-${RUN_ID}`;
const QUOTE_CODE = `COT-PWT06-${RUN_ID}`;

const result = {
    test: "e2e-lars-t06-oc",
    baseUrl,
    apiBaseUrl,
    runId: RUN_ID,
    ocNumber: OC_NUMBER,
    ocDate: OC_DATE,
    checks: {},
    findings: [],
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    artifacts: {
        prospectId: "",
        equipmentRecordId: EQUIPMENT_RECORD_ID,
        equipmentItemId: EQUIPMENT_ITEM_ID,
        projectId: PROJECT_ID,
        quoteId: "",
        quoteCode: QUOTE_CODE,
    },
    screenshots: [],
};

let accessToken = "";
let browser;
let page;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 30) target.push(value);
}

function check(label, ok, detail = "") {
    result.checks[label] = Boolean(ok);
    const line = `${ok ? "✅" : "❌"} ${label}${detail ? ` | ${detail}` : ""}`;
    console.log(line);
    return Boolean(ok);
}

async function apiRequest(method, urlPath, body) {
    const response = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": companyId,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text().catch(() => "");
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    return { status: response.status, ok: response.ok, data, rawText: text };
}

async function shot(name) {
    if (!page) return "";
    const file = path.resolve(artifactsDir, `e2e-lars-t06-${name}-${RUN_ID}.png`);
    try {
        await page.screenshot({ path: file, fullPage: false });
        result.screenshots.push(file);
        return file;
    } catch {
        return "";
    }
}

async function login() {
    const res = await apiRequest("POST", "/api/v1/auth/login", { email: userEmail, password: userPassword });
    if (!res.ok) throw new Error(`Login admin falló (HTTP ${res.status}): ${String(res.rawText).slice(0, 200)}`);
    accessToken = String(res.data?.accessToken || res.data?.token || "");
    if (!accessToken) throw new Error("Login no devolvió accessToken.");
    return { ...res.data, expiresAt: Date.now() + Math.max(Number(res.data.expiresIn || 3600), 1) * 1000 };
}

// ── Setup por API (prospecto + equipo + diagnóstico + cotización) ────────────

async function createProspect() {
    const res = await apiRequest("POST", "/api/v1/crm/prospects", {
        name: PROSPECT_NAME,
        email: PROSPECT_EMAIL,
        company: PROSPECT_COMPANY,
        mobile: "3005550106",
    });
    if (!res.ok) throw new Error(`Crear prospecto falló (HTTP ${res.status}): ${String(res.rawText).slice(0, 200)}`);
    result.artifacts.prospectId = String(res.data?.id || res.data?.prospectId || "");
    return res.data;
}

async function createEquipmentRecord() {
    const body = {
        id: EQUIPMENT_RECORD_ID,
        prospectId: result.artifacts.prospectId,
        prospectName: PROSPECT_NAME,
        receptionDay: "24",
        receptionMonth: "10",
        receptionYear: "2026",
        intakeMethod: "personal",
        companyName: PROSPECT_COMPANY,
        nit: `nit-t06-${RUN_ID}`,
        phone: "",
        address: "",
        city: "",
        contactName: PROSPECT_NAME,
        contactRole: "",
        cellphone: "",
        email: PROSPECT_EMAIL,
        clientSignature: "",
        pikaSignature: "",
        archived: false,
        archivedAt: "",
        sourceContext: "crm",
        assignedTo: "",
        items: [
            {
                id: EQUIPMENT_ITEM_ID,
                registrationMode: "manual",
                equipmentModelId: "",
                serviceTypeId: "",
                serviceTypeName: "Reparacion",
                storageLocationId: "",
                storageLocationName: "",
                familyId: "",
                familyName: "HMI",
                marca: "LARS-QA",
                tipo: "Pantalla tactil",
                serie: EQUIPMENT_SERIE,
                receivedIdentifier: EQUIPMENT_SERIE,
                receivedIdentifierType: "manual",
                receivedIdentifierSource: "manual",
                receivedIdentifierCapturedAt: new Date().toISOString(),
                customerShipmentReference: "",
                accessories: "Sin accesorios",
                borrowedEquipments: [],
                failureDescription: "Falla de prueba E2E T06 (no enciende)",
                pendingHomologation: false,
                estimatedData: false,
                identifierLabelIssue: false,
                evidencePhotos: [],
                attachments: [],
                answers: {},
                repairStatus: "recibido",
                repairStatusUpdatedAt: new Date().toISOString(),
                repairStatusUpdatedBy: "qa-t06",
            },
        ],
    };
    const res = await apiRequest("PUT", `/api/v1/crm-equipment/records/${encodeURIComponent(EQUIPMENT_RECORD_ID)}`, body);
    if (!res.ok) throw new Error(`Crear recepción de equipo falló (HTTP ${res.status}): ${String(res.rawText).slice(0, 250)}`);
}

async function createTechnicalCase() {
    // Caso técnico en etapa diagnostico (con datos de diagnóstico cerrado).
    const diagnosisProps = {
        title: `Caso T06 ${RUN_ID}`,
        equipmentRecordId: EQUIPMENT_RECORD_ID,
        equipmentItemId: EQUIPMENT_ITEM_ID,
        equipmentProspectId: 0,
        equipmentProspectName: PROSPECT_NAME,
        equipmentDisplayName: `HMI ${EQUIPMENT_SERIE}`,
        equipmentIdentifier: EQUIPMENT_SERIE,
        equipmentSerie: EQUIPMENT_SERIE,
        equipmentFailureDescription: "Falla de prueba E2E T06 (no enciende)",
        equipmentRepairStatus: "diagnostico",
        equipmentRepairStatusLabel: "Diagnóstico",
        diagnosisFaultFound: true,
        diagnosisEstimatedHours: 2,
        diagnosisPartsBudgetUsd: 150,
        diagnosisNotes: "Diagnóstico E2E T06: fuente de poder dañada.",
    };
    const create = await apiRequest("POST", "/api/v1/projects", { id: PROJECT_ID, status: "diagnostico", properties: diagnosisProps });
    if (!create.ok) throw new Error(`Crear caso técnico falló (HTTP ${create.status}): ${String(create.rawText).slice(0, 250)}`);

    // El diagnóstico concluye: el caso pasa a por-cotizar (transición legal).
    const advance = await apiRequest("POST", "/api/v1/projects", {
        id: PROJECT_ID,
        status: "por-cotizar",
        properties: { ...diagnosisProps, equipmentRepairStatus: "por-cotizar", equipmentRepairStatusLabel: "Por cotizar" },
    });
    if (!advance.ok) throw new Error(`Transición diagnostico→por-cotizar falló (HTTP ${advance.status}): ${String(advance.rawText).slice(0, 250)}`);
    return true;
}

async function createQuote() {
    const payload = {
        codigo: QUOTE_CODE,
        prospecto: PROSPECT_NAME,
        empresa: PROSPECT_COMPANY,
        correo: PROSPECT_EMAIL,
        movil: "3005550106",
        estado: "Enviado",
        moneda: "COP",
        descuentoTipo: "COP",
        descuentoValor: 0,
        lineas: [
            { servicio: "Reparación fuente de poder", descripcion: "Cambio de fuente + pruebas", cantidad: 1, unidad: "Unidad", precioUnitario: 450000, impuesto: 19 },
        ],
        nota: `Nota E2E T06 ${RUN_ID}`,
        terminos: "Pago contra entrega. Vigencia 15 días.",
        taxMode: "",
        selectedEquipmentIds: [EQUIPMENT_ITEM_ID],
    };
    const res = await apiRequest("POST", "/api/v1/crm-quotes/quotes", payload);
    if (!res.ok) {
        // Reintento con prospectId numérico por si el contrato lo exige.
        const retry = await apiRequest("POST", "/api/v1/crm-quotes/quotes", { ...payload, prospectId: Number(result.artifacts.prospectId) || undefined });
        if (!retry.ok) throw new Error(`Crear cotización falló (HTTP ${res.status}/${retry.status}): ${String(retry.rawText || res.rawText).slice(0, 300)}`);
        result.artifacts.quoteId = String(retry.data?.id || "");
    } else {
        result.artifacts.quoteId = String(res.data?.id || "");
    }
    if (!result.artifacts.quoteId) throw new Error("La cotización creada no devolvió id.");
}

// ── UI: carga de la OC (acción de negocio 100% UI) ───────────────────────────

async function openBrowser(session) {
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        { authSession: session, apiBase: apiBaseUrl },
    );
    page = await context.newPage();
    page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        pushUnique(result.consoleErrors, msg.text());
        if (/sincronizar la OC|No se pudo sincronizar/i.test(msg.text())) {
            result.findings.push(`ConsoleError crítico de sincronización OC→proyecto: ${msg.text().slice(0, 300)}`);
        }
    });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));
}

async function loadOcViaUi(pdfPath) {
    await page.goto(`${baseUrl}/app/crm-cotizaciones`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForSelector("table tbody tr", { timeout: 60000 });
    await page.waitForTimeout(1500);
    await shot("01-cotizaciones-loaded");

    const row = page.locator("table tbody tr", { hasText: QUOTE_CODE }).first();
    const rowVisible = await row.isVisible({ timeout: 30000 }).catch(() => false);
    if (!check("ui-cotizacion-visible-en-lista", rowVisible, `codigo=${QUOTE_CODE}`)) {
        throw new Error(`La cotización ${QUOTE_CODE} no aparece en /app/crm-cotizaciones.`);
    }

    // Estado previo: Enviado, sin OC.
    const estadoCell = await row.locator("td").nth(6).innerText().catch(() => "");
    result.observations.push(`Estado previo de la cotización en tabla: '${estadoCell.trim()}'.`);

    const cargarBtn = row.locator("button", { hasText: /Cargar OC/ }).first();
    await cargarBtn.click();

    const modal = page.locator(".modal.fade.show", { hasText: "Cargar OC" }).first();
    const modalVisible = await modal.waitFor({ state: "visible", timeout: 15000 }).then(() => true).catch(() => false);
    if (!check("ui-modal-cargar-oc-abierto", modalVisible)) {
        throw new Error("El modal 'Cargar OC' no se abrió.");
    }

    // Esperar la hidratación GET /quotes/:id del modal (evita guardar con quote null).
    const hydration = page.waitForResponse(
        (resp) => resp.request().method() === "GET" && /\/crm-quotes\/quotes\/[^/]+$/.test(resp.url()),
        { timeout: 30000 },
    );
    await hydration.catch(() => null);
    await shot("02-modal-cargar-oc");

    const numberInput = modal.locator('input[placeholder="Ejemplo: OC-2026-00158"]');
    const dateInput = modal.locator('input[type="date"]');
    const fileInput = modal.locator('input[type="file"]');

    await numberInput.fill(OC_NUMBER);
    await dateInput.fill(OC_DATE);
    await fileInput.setInputFiles(pdfPath);
    // FileReader lee el archivo de forma asíncrona (data URL) antes de guardar.
    await page.waitForTimeout(800);
    await shot("03-modal-oc-diligenciado");
    check("ui-oc-numero-fecha-archivo-cargados", true, `${OC_NUMBER} / ${OC_DATE} / ${path.basename(pdfPath)}`);

    const saveBtn = modal.locator("button", { hasText: /Guardar OC y pasar a pedir repuestos/ }).first();
    // Registro ANTES del clic (race-safe): la app guarda la OC y luego sincroniza
    // el proyecto con la columna pedir-repuestos (2 PUTs); se compite también
    // contra el alert de validación para diagnosticar sin esperar el timeout.
    const quotePutPromise = page.waitForResponse(
        (resp) => resp.request().method() === "PUT" && /\/crm-quotes\/quotes\/[^/]+$/.test(resp.url()),
        { timeout: 45000 },
    ).then((r) => ({ kind: "put", resp: r })).catch(() => ({ kind: "put-timeout" }));
    const projectPutPromise = page
        .waitForResponse(
            (resp) => resp.request().method() === "PUT" && /\/projects\/[^/?]+(\?|$)/.test(resp.url()),
            { timeout: 45000 },
        )
        .then((r) => ({ kind: "project-put", resp: r }))
        .catch(() => ({ kind: "project-put-missing" }));
    const validationErrorPromise = modal
        .locator(".alert.alert-danger")
        .first()
        .waitFor({ state: "visible", timeout: 45000 })
        .then(() => ({ kind: "validation-error" }))
        .catch(() => null);

    await saveBtn.click();
    const outcome = await Promise.race([quotePutPromise, validationErrorPromise]);
    if (outcome?.kind === "validation-error") {
        const msg = (await modal.locator(".alert.alert-danger").first().innerText().catch(() => "")).trim();
        check("ui-guardar-oc-disparo-put", false, `validación del modal rechazó el guardado: '${msg}'`);
        throw new Error(`El modal rechazó el guardado de la OC: ${msg}`);
    }
    const putOutcome = await quotePutPromise;
    if (putOutcome.kind !== "put") {
        check("api-put-cotizacion-respondio", false, "timeout esperando PUT /crm-quotes/quotes/:id");
        throw new Error("No se disparó el PUT de la cotización tras 'Guardar OC'.");
    }
    check("api-put-cotizacion-respondio", putOutcome.resp.ok(), `HTTP ${putOutcome.resp.status()}`);
    const projectSync = await projectPutPromise;
    result.observations.push(
        projectSync.kind === "project-put"
            ? `Sincronización OC→proyecto disparada desde UI: PUT /projects → HTTP ${projectSync.resp.status()}.`
            : "OBSERVACIÓN: no se observó PUT /projects tras guardar la OC (el caso técnico puede no haberse movido).",
    );

    // Mensaje de éxito esperado: "OC OC-LARS-1042 registrada en <codigo>."
    const successAlert = page.locator(".alert.alert-success", { hasText: new RegExp(`OC ${OC_NUMBER.replace(/-/g, "-")} registrada`) }).first();
    const successVisible = await successAlert.waitFor({ state: "visible", timeout: 20000 }).then(() => true).catch(() => false);
    check("ui-mensaje-exito-oc", successVisible, successVisible ? (await successAlert.innerText()).trim() : "sin mensaje de éxito");
    await page.waitForTimeout(1200);
    await shot("04-oc-guardada-cotizacion-aprobada");

    // Refrescar la lista y verificar badge de OC + estado Aprobado en la fila.
    await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForSelector("table tbody tr", { timeout: 60000 });
    const rowAfter = page.locator("table tbody tr", { hasText: QUOTE_CODE }).first();
    const ocBadge = rowAfter.locator("span.badge.text-bg-success", { hasText: OC_NUMBER }).first();
    check("ui-badge-oc-en-fila", await ocBadge.isVisible({ timeout: 15000 }).catch(() => false), `badge 'OC ${OC_NUMBER}'`);
    const estadoAfter = (await rowAfter.locator("td").nth(6).innerText().catch(() => "")).trim();
    check("ui-estado-aprobado-en-tabla", estadoAfter === "Aprobado", `estado='${estadoAfter}'`);
}

// ── Verificaciones cruzadas por API (interconexión cotización→técnica) ───────

async function verifyQuoteApproved() {
    const res = await apiRequest("GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(result.artifacts.quoteId)}`, null);
    if (!res.ok) throw new Error(`GET cotización falló (HTTP ${res.status})`);
    const q = res.data || {};
    check("api-cotizacion-estado-aprobado", String(q.estado) === "Aprobado", `estado=${q.estado}`);
    check("api-oc-numero-persistido", String(q.purchaseOrderNumber || "") === OC_NUMBER, `purchaseOrderNumber=${q.purchaseOrderNumber}`);
    check("api-oc-fecha-persistida", String(q.purchaseOrderDate || "") === OC_DATE, `purchaseOrderDate=${q.purchaseOrderDate}`);
    check("api-oc-archivo-persistido", Boolean(q.purchaseOrderFileName) && Boolean(q.purchaseOrderFileDataUrl), `file=${q.purchaseOrderFileName}`);
    check("api-oc-uploadedat-persistido", Boolean(q.purchaseOrderUploadedAt), `uploadedAt=${q.purchaseOrderUploadedAt}`);
}

async function verifyProjectMoved() {
    const res = await apiRequest("GET", `/api/v1/projects/${encodeURIComponent(PROJECT_ID)}`, null);
    if (!res.ok) throw new Error(`GET proyecto falló (HTTP ${res.status})`);
    const p = res.data || {};
    const props = p.properties || {};
    check("api-proyecto-en-pedir-repuestos", String(p.status) === "pedir-repuestos", `status=${p.status}`);
    check("api-proyecto-equipmentRepairStatus", String(props.equipmentRepairStatus || "") === "pedir-repuestos", `equipmentRepairStatus=${props.equipmentRepairStatus}`);
    check("api-proyecto-oc-numero-propagado", String(props.purchaseOrderNumber || "") === OC_NUMBER, `properties.purchaseOrderNumber=${props.purchaseOrderNumber}`);
    check("api-proyecto-oc-fecha-propagada", String(props.purchaseOrderDate || "") === OC_DATE, `properties.purchaseOrderDate=${props.purchaseOrderDate}`);
    check("api-proyecto-oc-linkedat", Boolean(props.purchaseOrderLinkedAt), `purchaseOrderLinkedAt=${props.purchaseOrderLinkedAt}`);
}

async function verifyKanbanUi() {
    await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    const columnHeader = page.locator('[data-testid="column-header-pedir-repuestos"]');
    const headerVisible = await columnHeader.waitFor({ state: "visible", timeout: 60000 }).then(() => true).catch(() => false);
    if (!headerVisible) {
        check("ui-kanban-columna-pedir-repuestos", false, "columna 'pedir-repuestos' no visible en /app/work-projects");
        return;
    }
    const dropZone = page.locator('div.cards-sortable[data-column-id="pedir-repuestos"]');
    // El ancla determinista es data-project-id: el título de la tarjeta no
    // necesariamente lleva la serie del equipo.
    const card = dropZone.locator(`.project-drag-item[data-project-id="${PROJECT_ID}"]`).first();
    const cardInColumn = await card.waitFor({ state: "visible", timeout: 30000 }).then(() => true).catch(() => false);
    check("ui-kanban-caso-en-pedir-repuestos", cardInColumn, `tarjeta ${PROJECT_ID} en columna pedir-repuestos`);

    if (cardInColumn) {
        // La tarjeta debe lucir el badge con la OC propagada desde CRM.
        const cardText = (await card.innerText().catch(() => "")).replace(/\s+/g, " ");
        check("ui-kanban-tarjeta-muestra-oc", cardText.includes(OC_NUMBER), `badge OC en tarjeta: '${cardText.slice(0, 160)}'`);
        await card.scrollIntoViewIfNeeded().catch(() => {});
    }
    await page.waitForTimeout(800);
    await shot("05-kanban-caso-pedir-repuestos");
}

// ── PDF mínimo ───────────────────────────────────────────────────────────────

async function writeMinimalPdf(filePath) {
    const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 160]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 90>>stream
BT /F1 12 Tf 20 100 Td (${OC_NUMBER} - Orden de compra E2E T06 ${RUN_ID}) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF
`;
    await fs.writeFile(filePath, pdf, "utf8");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    await fs.mkdir(artifactsDir, { recursive: true });

    console.log(`[T06] Entorno: ${baseUrl} (API ${apiBaseUrl}) — OC ${OC_NUMBER} fecha ${OC_DATE}`);
    const session = await login();
    check("1.login-admin", true, userEmail);

    await createProspect();
    check("2.prospecto-creado", true, `${PROSPECT_NAME} id=${result.artifacts.prospectId}`);

    await createEquipmentRecord();
    check("3.equipo-creado", true, `record=${EQUIPMENT_RECORD_ID} item=${EQUIPMENT_ITEM_ID} serie=${EQUIPMENT_SERIE}`);

    await createTechnicalCase();
    check("4.caso-tecnico-diagnostico-por-cotizar", true, `project=${PROJECT_ID}`);

    await createQuote();
    check("5.cotizacion-enviada-creada", true, `${QUOTE_CODE} id=${result.artifacts.quoteId} con selectedEquipmentIds=[${EQUIPMENT_ITEM_ID}]`);

    const pdfPath = path.resolve(artifactsDir, `e2e-lars-t06-oc-${OC_NUMBER}.pdf`);
    await writeMinimalPdf(pdfPath);

    await openBrowser(session);
    await loadOcViaUi(pdfPath);
    await verifyQuoteApproved();
    await verifyProjectMoved();
    await verifyKanbanUi();
}

let exitCode = 0;
try {
    await main();
    if (Object.values(result.checks).some((v) => v === false)) exitCode = 1;
} catch (error) {
    exitCode = 1;
    result.error = String(error?.stack || error?.message || error);
    console.error("\n❌ FALLO:", result.error);
    await shot("99-error").catch(() => "");
} finally {
    if (browser) await browser.close().catch(() => {});
}

const resultsPath = path.resolve(artifactsDir, `e2e-lars-t06-results-${RUN_ID}.json`);
await fs.writeFile(resultsPath, JSON.stringify(result, null, 2)).catch(() => {});

console.log("\n════════ RESULTADO E2E T06 — OC DEL CLIENTE ════════");
console.log(`Entorno: ${baseUrl} | runId=${RUN_ID}`);
console.log(`Códigos: prospecto='${PROSPECT_NAME}' equipo serie='${EQUIPMENT_SERIE}' proyecto='${PROJECT_ID}' cotización='${QUOTE_CODE}' OC='${OC_NUMBER}'`);
for (const [key, value] of Object.entries(result.checks)) {
    console.log(`${value ? "✅" : "❌"} ${key}`);
}
if (result.observations.length) {
    console.log("\n── Observaciones ──");
    for (const o of result.observations) console.log(`• ${o}`);
}
if (result.findings.length) {
    console.log("\n── Hallazgos ──");
    for (const f of result.findings) console.log(`⚠️ ${f}`);
}
if (result.consoleErrors.length) {
    console.log("\n── Errores de consola (máx 30) ──");
    for (const e of result.consoleErrors.slice(0, 10)) console.log(`• ${e.slice(0, 220)}`);
}
if (result.pageErrors.length) {
    console.log("\n── Errores de página ──");
    for (const e of result.pageErrors.slice(0, 5)) console.log(`• ${e.slice(0, 220)}`);
}
const failed = Object.entries(result.checks).filter(([, v]) => v === false).map(([k]) => k);
console.log(failed.length ? `\n❌ CHECKS EN ROJO (${failed.length}): ${failed.join(", ")}` : "\n✅ TODOS LOS CHECKS T06 PASARON");
console.log(`JSON: ${resultsPath}`);
console.log("──────────────────────────────────────────────────────");

process.exit(exitCode);
