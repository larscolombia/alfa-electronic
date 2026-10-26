/**
 * E2E LARS — T11 EQUIPOS A DESPACHAR (rol: admin/logística).
 *
 * Interconexión técnico→logística: un caso cerrado en "listo para entrega"
 * debe aparecer SOLO en el panel "Equipos a despachar" de /app/remissions,
 * agrupado por cliente, con código CO-* y datos (marca/tipo/serie); los
 * equipos NO listos no deben aparecer (control negativo).
 *
 * SETUP por API (fiel al flujo del técnico: proyecto movido por las
 * transiciones reales hasta listo-entrega + sync repairStatus del ítem CRM,
 * que es lo que el kanban hace vía syncWorkflowToApi). La VERIFICACIÓN de
 * negocio es 100% UI.
 *
 * Uso:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t11-equipos-despachar-playwright.mjs
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "150000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const apiBaseUrl = (process.env.PW_API_BASE_URL || new URL(baseUrl).origin).replace(/\/+$/, "");

const TS = Date.now();
const SUF = `-t11-${TS}`;
const PROSPECT_A = `LARS T11 Listo ${TS}`;
const EMAIL_A = `lars${SUF}@alfa.local`;
const CLIENT_A = `LARS Logistica T11 ${TS}`;
const EQUIPO_A = `CO-T11-${TS}`;
const SERIE_A = `SER-LARS-T11-${TS}`;
const MARCA_A = "LARSBrand";
const TIPO_A = "Variador";
const RECORD_A = `rec-lars${SUF}`;
const ITEM_A = `item-lars${SUF}`;
const PROJECT_A = `proj-lars${SUF}`;
const SHORT_A = `PRJ-T11-${TS}`;
const PROSPECT_B = `LARS T11 NoListo ${TS}`;
const EMAIL_B = `larsn${SUF}@alfa.local`;
const CLIENT_B = `LARS Reparacion T11 ${TS}`;
const EQUIPO_B = `CO-T11N-${TS}`;
const SERIE_B = `SER-LARS-T11N-${TS}`;
const RECORD_B = `rec-larsn${SUF}`;
const ITEM_B = `item-larsn${SUF}`;

const results = { test: "e2e-lars-t11-equipos-despachar", baseUrl, checks: {}, codes: {}, findings: [], observations: [], consoleErrors: [], pageErrors: [], screenshots: [] };
let accessToken = "";
let browser;

function check(step, ok, detalle = "") {
    results.checks[step] = { ok: Boolean(ok), detalle };
    console.log(`${ok ? "✅" : "❌"} [${step}] ${detalle}`);
}
function find(text) { results.findings.push(text); console.log(`⚠️ [HALLAZGO] ${text}`); }
function observe(text) { results.observations.push(text); console.log(`ℹ️ [OBS] ${text}`); }
function pushUnique(t, v) { const s = String(v || "").trim(); if (s && !t.includes(s) && t.length < 20) t.push(s); }

async function api(method, urlPath, body) {
    const res = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text().catch(() => "");
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    return { status: res.status, ok: res.ok, data, text };
}
async function apiOk(label, method, urlPath, body, expected = [200, 201]) {
    const r = await api(method, urlPath, body);
    if (!expected.includes(r.status)) throw new Error(`${label}: HTTP ${r.status} — ${r.text.slice(0, 250)}`);
    return r.data;
}
async function shot(page, name) {
    const p = path.resolve(artifactsDir, `e2e-lars-t11-${name}-${Date.now()}.png`);
    await page.screenshot({ path: p, fullPage: true, timeout: 20000 }).catch(() => p);
    results.screenshots.push(p);
    return p;
}

async function createRecord(recordId, itemId, prospectId, prospectName, email, company, equipoId, serie, marca, tipo, repairStatus) {
    const d = new Date();
    return apiOk(`crear equipo ${equipoId}`, "POST", "/api/v1/crm-equipment/records", {
        id: recordId, prospectId, prospectName,
        receptionDay: String(d.getDate()), receptionMonth: String(d.getMonth() + 1), receptionYear: String(d.getFullYear()),
        intakeMethod: "transportadora", intakeCarrier: `Transportadora LARS T11`, intakeTrackingNumber: `GUIA-${equipoId}`,
        intakeReceivedAt: new Date().toISOString(), companyName: company, contactName: `Contacto ${prospectName}`, email,
        items: [{
            id: itemId, registrationMode: "manual", isIndustrial: true, serviceTypeName: "Reparación",
            familyName: "Variadores", marca, tipo, serie, receivedIdentifier: equipoId, receivedIdentifierType: "placa",
            failureDescription: "Falla de potencia T11", repairStatus, storageLocationName: "Bodega principal",
        }],
    });
}

async function setup() {
    const login = await api("POST", "/api/v1/auth/login", { email: userEmail, password: userPassword });
    if (!login.ok) throw new Error(`login admin HTTP ${login.status}`);
    accessToken = String(login.data.accessToken || "");
    check("0.login-admin", true, "admin autenticado por API");

    // A) prospecto + equipo + caso cerrado en listo-entrega
    const pa = await apiOk("crear prospecto A", "POST", "/api/v1/crm/prospects", { name: PROSPECT_A, email: EMAIL_A, company: CLIENT_A, mobile: "3005550111" });
    results.codes.prospectoA = String(pa.id || pa.prospectId || PROSPECT_A);
    await createRecord(RECORD_A, ITEM_A, results.codes.prospectoA, PROSPECT_A, EMAIL_A, CLIENT_A, EQUIPO_A, SERIE_A, MARCA_A, TIPO_A, "reparacion");
    results.codes.equipoA = EQUIPO_A;
    check("1.setup-equipo-listo", true, `${EQUIPO_A} / serie ${SERIE_A} (record ${RECORD_A}, estado inicial reparacion)`);

    const props = {
        title: `Reparación ${EQUIPO_A} — LARS T11`, description: `Caso despacho ${SUF}`, icon: "bi-tools",
        boardId: "board-main", createdBy: userEmail, shortCode: SHORT_A, stageName: "Diagnostico",
        equipmentRecordId: RECORD_A, equipmentItemId: ITEM_A, equipmentProspectId: results.codes.prospectoA,
        equipmentProspectName: PROSPECT_A, equipmentDisplayName: `${TIPO_A} ${MARCA_A} · ${SERIE_A}`,
        equipmentIdentifier: EQUIPO_A, equipmentSerie: SERIE_A, equipmentServiceType: "Reparación",
        equipmentFailureDescription: "Falla de potencia T11", diagnosticNotes: `Diagnóstico T11 ${EQUIPO_A}`,
        repairNotes: `Reparación T11 ${EQUIPO_A} completada`, estimatedHours: 2, actualHours: 2,
        partsBudgetUsd: 150, testType: "banco-pruebas", diagnosisInspection: { faultIdentified: true }, dispatchHistory: [],
    };
    await apiOk("crear proyecto", "POST", "/api/v1/projects", { id: PROJECT_A, status: "diagnostico", properties: props });
    await apiOk("cerrar diagnóstico", "POST", `/api/v1/projects/${encodeURIComponent(PROJECT_A)}/diagnosis/close`, {});
    const flow = [
        ["pedir-repuestos", "Pedir componentes"], ["esperando-proveedor", "Esperando proveedor"],
        ["reparacion", "Reparacion"], ["listo-entrega", "Listo para entrega"],
    ];
    for (const [status, stage] of flow) {
        await apiOk(`mover proyecto a ${status}`, "PUT", `/api/v1/projects/${encodeURIComponent(PROJECT_A)}`, { id: PROJECT_A, status, properties: { ...props, stageName: stage } });
    }
    results.codes.proyectoA = PROJECT_A;
    const proj = await apiOk("leer proyecto", "GET", `/api/v1/projects/${encodeURIComponent(PROJECT_A)}`);
    check("2.setup-caso-listo-entrega", String(proj.status) === "listo-entrega", `proyecto ${SHORT_A} en status=${proj.status}`);

    // sync repairStatus del ítem CRM (lo que el kanban del técnico hace al mover la tarjeta)
    const rec = await apiOk("leer record A", "GET", `/api/v1/crm-equipment/records/${encodeURIComponent(RECORD_A)}`);
    rec.items = (rec.items || []).map((it) => (it.id === ITEM_A ? { ...it, repairStatus: "listo-entrega", repairStatusUpdatedAt: new Date().toISOString(), repairStatusUpdatedBy: userEmail } : it));
    await apiOk("sync repairStatus listo-entrega", "PUT", `/api/v1/crm-equipment/records/${encodeURIComponent(RECORD_A)}`, rec);
    check("3.sync-repairStatus", true, `ítem ${ITEM_A} repairStatus=listo-entrega (sync técnico→logística)`);

    // B) control negativo: equipo en reparación (NO listo), otro cliente
    const pb = await apiOk("crear prospecto B", "POST", "/api/v1/crm/prospects", { name: PROSPECT_B, email: EMAIL_B, company: CLIENT_B, mobile: "3005550222" });
    results.codes.prospectoB = String(pb.id || pb.prospectId || PROSPECT_B);
    await createRecord(RECORD_B, ITEM_B, results.codes.prospectoB, PROSPECT_B, EMAIL_B, CLIENT_B, EQUIPO_B, SERIE_B, MARCA_A, TIPO_A, "reparacion");
    results.codes.equipoB = EQUIPO_B;
    check("4.setup-control-negativo", true, `${EQUIPO_B} en reparacion (cliente ${PROSPECT_B})`);

    // Cruce API: el endpoint que alimenta el panel ve los estados correctos
    const items = await apiOk("leer items CRM", "GET", "/api/v1/crm-equipment/items");
    const list = Array.isArray(items) ? items : items.items || [];
    const itemA = list.find((i) => String(i.itemId || i.itemID || "") === ITEM_A || String(i.receivedIdentifier || "") === EQUIPO_A);
    const itemB = list.find((i) => String(i.itemId || i.itemID || "") === ITEM_B || String(i.receivedIdentifier || "") === EQUIPO_B);
    check("5.api-panel-source", itemA && itemB, `items endpoint: A=${itemA?.repairStatus} B=${itemB?.repairStatus}`);
    if (!itemA || String(itemA.repairStatus) !== "listo-entrega") find(`El ítem A no llegó con repairStatus=listo-entrega al endpoint /crm-equipment/items (valor=${itemA?.repairStatus}). El panel quedaría vacío para este equipo.`);
    if (itemB && ["listo-entrega", "garantia", "no-reparable"].includes(String(itemB.repairStatus))) find(`El ítem B (control negativo) aparece con estado despachable ${itemB.repairStatus}.`);
}

async function verifyUi(sessionData) {
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1560, height: 980 } });
    await context.addInitScript(({ s, a }) => {
        window.localStorage.setItem("pika.auth.session", JSON.stringify(s));
        window.localStorage.setItem("pika.apiBaseUrl", a);
    }, { s: sessionData, a: apiBaseUrl });
    const page = await context.newPage();
    page.on("console", (m) => { if (m.type() === "error") pushUnique(results.consoleErrors, m.text()); });
    page.on("pageerror", (e) => pushUnique(results.pageErrors, e?.stack || e?.message || String(e)));

    await page.goto(`${baseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    const landed = !page.url().includes("/auth/signin");
    check("6.ui-landed-remissions", landed, page.url());

    // Nudge de change detection (el build no re-renderiza tras fetch hasta el
    // próximo evento Angular): abrir y cerrar el formulario de creación.
    // Se reintenta hasta 3 veces por si el fetch de items aún no había llegado.
    const createBtn = page.locator("[data-testid='create-remission-btn']");
    const panel = page.locator("[data-testid='dispatch-ready-panel']");
    for (let attempt = 0; attempt < 3; attempt++) {
        if (await panel.isVisible({ timeout: 1000 }).catch(() => false)) break;
        if (await createBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
            await createBtn.click();
            await page.waitForTimeout(1000);
            const cancel = page.locator("button", { hasText: "Cancelar" }).first();
            if (await cancel.isVisible().catch(() => false)) await cancel.click();
            await page.waitForTimeout(3000);
        }
    }

    const panelVisible = await panel.waitFor({ state: "visible", timeout: 30000 }).then(() => true).catch(() => false);
    check("7.ui-panel-exists", panelVisible, "panel 'Equipos a despachar' renderizado (dispatch-ready-panel)");
    if (!panelVisible) {
        find("El panel 'Equipos a despachar' NO se renderizó pese a tener un equipo listo-entrega. Posible bug de carga/change detection.");
        await shot(page, "01-fail-panel-missing");
        return;
    }
    await shot(page, "01-panel-rendered");

    // Grupo del cliente A con su equipo
    const groups = page.locator("[data-testid='dispatch-client-group']");
    const groupA = groups.filter({ hasText: PROSPECT_A }).first();
    const groupAVisible = await groupA.waitFor({ state: "visible", timeout: 15000 }).then(() => true).catch(() => false);
    check("8.ui-grupo-cliente", groupAVisible, `grupo de cliente '${PROSPECT_A}' presente en el panel`);
    let equipoCodeOk = false, datosOk = false;
    if (groupAVisible) {
        equipoCodeOk = (await groupA.locator("[data-testid='equipment-code']").filter({ hasText: EQUIPO_A }).count()) > 0;
        const bodyText = await groupA.innerText();
        datosOk = bodyText.includes(MARCA_A) && bodyText.includes(TIPO_A) && bodyText.includes(SERIE_A);
    }
    check("9.ui-equipo-en-panel", equipoCodeOk, `código ${EQUIPO_A} visible en el panel`);
    check("10.ui-datos-equipo", datosOk, `marca/tipo/serie (${MARCA_A}/${TIPO_A}/${SERIE_A}) visibles en el panel`);
    if (!equipoCodeOk) find(`El equipo listo ${EQUIPO_A} NO aparece en el panel Equipos a despachar. Interconexión técnico→logística rota.`);
    if (groupAVisible) {
        const gp = path.resolve(artifactsDir, `e2e-lars-t11-02-grupo-cliente-${Date.now()}.png`);
        await groupA.screenshot({ path: gp, timeout: 20000 }).catch(() => {});
        results.screenshots.push(gp);
    }

    // Control negativo: equipo NO listo y su cliente no deben aparecer
    const panelText = await panel.innerText();
    const negCode = !panelText.includes(EQUIPO_B);
    const negClient = !panelText.includes(PROSPECT_B);
    check("11.ui-control-negativo", negCode && negClient, `${EQUIPO_B} / '${PROSPECT_B}' ausentes del panel`);
    if (!negCode || !negClient) find(`El equipo NO listo ${EQUIPO_B} (o su cliente) SÍ aparece en el panel Equipos a despachar: filtro de estados roto.`);

    // "No en otros lados": el equipo sin remisión no debe figurar en la tabla
    // de remisiones (se identifica por el encabezado "Consecutivo").
    const remissionTable = page.locator("table").filter({ hasText: "Consecutivo" }).first();
    const inRemissionList = (await remissionTable.locator(`text=${EQUIPO_A}`).count()) > 0;
    check("12.ui-no-en-remisiones", !inRemissionList, `${EQUIPO_A} ausente de la tabla de remisiones creadas`);

    // Observación: el mismo caso también se lista en "Proyectos listos para entrega"
    const readyCard = page.locator("[data-testid='ready-for-delivery-panel']");
    const readyHasCase = (await readyCard.locator("[data-testid='ready-project-code']").filter({ hasText: EQUIPO_A }).count()) > 0;
    if (readyHasCase) find(`El caso ${EQUIPO_A} aparece DUPLICADO en la misma página: también en la tarjeta 'Proyectos listos para entrega' (ready-project-code). El objetivo decía SOLO en 'Equipos a despachar'.`);
    else observe("El caso no aparece en 'Proyectos listos para entrega' (solo en Equipos a despachar): cumple 'solo en un lado' dentro de remisiones.");

    await shot(page, "03-verificacion-final");
}

try {
    await fs.mkdir(artifactsDir, { recursive: true });
    await setup();
    const login = await api("POST", "/api/v1/auth/login", { email: userEmail, password: userPassword });
    await verifyUi({ ...login.data, expiresAt: Date.now() + 3600 * 1000 });
} catch (error) {
    results.error = String(error?.stack || error);
    results.checks["99.fatal"] = { ok: false, detalle: results.error.slice(0, 300) };
    console.error("❌ ERROR FATAL:", results.error);
    try { if (browser?.contexts()?.[0]?.pages()?.[0]) await shot(browser.contexts()[0].pages()[0], "99-fatal"); } catch {}
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}

const fails = Object.entries(results.checks).filter(([, v]) => !v.ok);
const outPath = path.resolve(artifactsDir, `e2e-lars-t11-results-${TS}.json`);
await fs.writeFile(outPath, JSON.stringify(results, null, 2));
console.log(`\n=== RESUMEN t11: ${fails.length === 0 ? "TODOS LOS PASOS OK" : `${fails.length} PASO(S) FALLIDO(S): ${fails.map(([k]) => k).join(", ")}`} ===`);
console.log(`JSON: ${outPath}`);
console.log(JSON.stringify({ checks: results.checks, codes: results.codes, findings: results.findings }, null, 2));
if (fails.length > 0) process.exitCode = 1;
