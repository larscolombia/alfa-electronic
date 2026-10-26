/**
 * E2E t05 — COTIZACIÓN (rol admin, la cotiza Maribel).
 *
 * Flujo: login admin (UI con sesión sembrada) → setup mínimo por API
 * (prospecto + recepción de equipo) → crear cotización 100% por UI desde
 * /app/crm-cotizaciones con el equipo asociado → línea "Reparación PLC"
 * 3.800.000 COP sin IVA (impuesto 0%) + ítem de diagnóstico cerrado a $0 →
 * plazo 15 días hábiles, garantía 6 meses y vigencia 1 mes en términos/
 * descripción → nota "requerido antes del 15 de diciembre de 2026" →
 * guardar → capturar consecutivo COT-* → verificar por API (líneas,
 * selectedEquipmentIds, vigencia) → interconexión: el equipo cotizado ya no
 * aparece seleccionable en una nueva cotización → PDF descargable desde la
 * vista previa pública /estimate/<token>.
 *
 * Re-ejecutar:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t05-cotizacion-playwright.mjs
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const apiBaseUrl = process.env.PW_API_BASE_URL
    ? process.env.PW_API_BASE_URL.replace(/\/+$/, "")
    : new URL(baseUrl).origin;
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const prefix = "e2e-lars-t05-";
const stamp = Date.now();

const prospectName = `PW-T05-Cot-${stamp}`;
const prospectEmail = `pw-t05-${stamp}@prueba.com`;
const serie = `PW-T05-${stamp}`;
const recordId = `qa-t05-equipment-${stamp}`;
const itemId = `qa-t05-item-${stamp}`;

function buildDatePlus(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const validUntilIso = buildDatePlus(30); // vigencia: 1 mes
const isoToLabel = (iso) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };

const result = {
    test: "e2e-lars-t05-cotizacion",
    baseUrl,
    checks: {
        loggedIn: false,
        prospectCreated: false,
        equipmentCreated: false,
        quoteFormOpened: false,
        prospectSelected: false,
        equipmentSelectedInQuote: false,
        serviceLinePriced: false,
        termsAndNoteFilled: false,
        quoteSavedViaUi: false,
        quoteCodeCaptured: false,
        quoteVerifiedInApi: false,
        equipmentLinkedInApi: false,
        equipmentExcludedAfterQuote: false,
        quotePreviewLoaded: false,
        quotePdfDownloadable: false,
    },
    codes: { prospectId: "", equipmentRecordId: recordId, equipmentItemId: itemId, quoteId: "", quoteCodigo: "", quoteToken: "" },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshots: [],
    error: "",
};

let browser;
let session;
const consoleErrors = result.consoleErrors;
const pageErrors = result.pageErrors;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (value && !target.includes(value) && target.length < 20) target.push(value);
}

async function api(method, urlPath, body) {
    const res = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": companyId,
            Authorization: `Bearer ${session.accessToken}`,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text().catch(() => "");
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { /* noop */ }
    return { ok: res.ok, status: res.status, payload, text };
}

async function shoot(page, name) {
    const p = path.resolve(artifactsDir, `${prefix}${name}-${Date.now()}.png`);
    await page.screenshot({ path: p, fullPage: true }).catch(() => "");
    result.screenshots.push(p);
    return p;
}

async function setupProspectAndEquipment() {
    const created = await api("POST", "/api/v1/crm/prospects", {
        name: prospectName,
        email: prospectEmail,
        company: `PW T05 Company ${stamp}`,
        mobile: "3005550105",
        status: "Pendiente",
    });
    if (!created.ok || !created.payload?.id) {
        throw new Error(`crear prospecto falló ${created.status}: ${created.text.slice(0, 200)}`);
    }
    result.codes.prospectId = String(created.payload.id);
    result.checks.prospectCreated = true;

    const rec = await api("PUT", `/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}`, {
        id: recordId,
        prospectId: result.codes.prospectId,
        prospectName,
        receptionDay: "24",
        receptionMonth: "10",
        receptionYear: "2026",
        intakeMethod: "personal",
        companyName: `PW T05 Company ${stamp}`,
        nit: `qa-t05-nit-${stamp}`,
        phone: "",
        address: "",
        city: "",
        contactName: prospectName,
        contactRole: "",
        cellphone: "",
        email: "",
        clientSignature: "",
        pikaSignature: "",
        archived: false,
        archivedAt: "",
        sourceContext: "crm",
        assignedTo: "",
        items: [
            {
                id: itemId,
                registrationMode: "manual",
                equipmentModelId: "",
                serviceTypeId: "",
                serviceTypeName: "Reparacion",
                storageLocationId: "",
                storageLocationName: "",
                familyId: "",
                familyName: "PLC",
                marca: "Siemens",
                tipo: "PLC S7-1200",
                serie,
                receivedIdentifier: serie,
                receivedIdentifierType: "manual",
                receivedIdentifierSource: "manual",
                receivedIdentifierCapturedAt: new Date().toISOString(),
                customerShipmentReference: "",
                accessories: "Sin accesorios",
                borrowedEquipments: [],
                failureDescription: "PLC no encienda / falla de comunicación E/S",
                pendingHomologation: false,
                estimatedData: false,
                identifierLabelIssue: false,
                evidencePhotos: [],
                attachments: [],
                answers: {},
                repairStatus: "diagnosticado",
                repairStatusUpdatedAt: new Date().toISOString(),
                repairStatusUpdatedBy: "e2e-t05",
            },
        ],
    });
    if (!rec.ok) {
        throw new Error(`crear recepción de equipo falló ${rec.status}: ${rec.text.slice(0, 200)}`);
    }
    result.checks.equipmentCreated = true;
}

async function fillLastQuoteLine(page, { servicioPattern, descripcion, precio }) {
    const rows = page.locator("table tbody tr", { has: page.locator("input[placeholder='Descripcion del servicio']") });
    const count = await rows.count();
    if (count === 0) throw new Error("no hay líneas de servicio en la cotización");
    const row = rows.nth(count - 1);

    const servicioSelect = row.locator("td").first().locator("select.form-select");
    const options = await servicioSelect.locator("option").allTextContents();
    const wanted = options.find((o) => servicioPattern.test(o)) || options[options.length - 1];
    await servicioSelect.selectOption({ label: wanted.trim() });

    await row.locator("input[placeholder='Descripcion del servicio']").fill(descripcion);
    const qty = row.locator("td").nth(1).locator("input[type='number']").first();
    await qty.fill("1");
    const price = row.locator("td").nth(2).locator("input[type='number']");
    await price.fill(String(precio));
    const tax = row.locator("td").nth(3).locator("select.form-select");
    await tax.selectOption({ label: "0%" }); // valor sin IVA
    return { servicioElegido: wanted.trim(), opcionesServicio: options.map((o) => o.trim()) };
}

try {
    // ── Login admin ──────────────────────────────────────────────────────
    const loginRes = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
    });
    if (!loginRes.ok) throw new Error(`login admin falló ${loginRes.status}`);
    const payload = await loginRes.json();
    session = { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
    result.checks.loggedIn = true;

    // ── Setup mínimo por API: prospecto + equipo (diagnóstico cerrado) ──
    await setupProspectAndEquipment();

    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1600, height: 980 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            // Trazar window.print: el botón "Descargar" de la vista previa usa
            // el diálogo de impresión del navegador para guardar como PDF.
            const w = window;
            w.__e2ePrintCalls = 0;
            w.print = () => {
                w.__e2ePrintCalls += 1;
                // No invocar el print nativo: evita el diálogo de impresión en
                // el navegador E2E; sólo contamos la intención de descarga.
            };
        },
        { authSession: session, apiBase: apiBaseUrl },
    );
    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(pageErrors, err?.stack || err?.message || String(err)));

    // ── Abrir CRM cotizaciones y el formulario ───────────────────────────
    await page.goto(`${baseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2500);
    const createBtn = page.getByRole("button", { name: /Crear Cotizacion/i }).first();
    if (!(await createBtn.isVisible({ timeout: 15000 }).catch(() => false))) {
        // Carga transitoria (servidor compartido con otros agentes): reintentar una vez.
        await page.reload({ waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
        await page.waitForTimeout(3000);
    }
    await createBtn.click({ timeout: 20000 });
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll("h5")).some((n) => (n.textContent || "").toLowerCase().includes("nueva cotizacion")),
        null,
        { timeout: timeoutMs },
    );
    result.checks.quoteFormOpened = true;
    await shoot(page, "01-formulario-nueva-cotizacion");

    // ── Seleccionar prospecto y el equipo asociado ───────────────────────
    const prospectSelect = page.locator("select.form-select").first();
    await prospectSelect.selectOption({ label: prospectName }).catch(async () => {
        await prospectSelect.selectOption(prospectName);
    });
    await page.waitForTimeout(3000);
    result.checks.prospectSelected = (await prospectSelect.inputValue().catch(() => "")) === prospectName;
    if (!result.checks.prospectSelected) throw new Error(`no se pudo seleccionar el prospecto ${prospectName}`);

    const equipmentLabel = page.locator("label.form-check", { hasText: serie }).first();
    result.checks.equipmentSelectedInQuote = await equipmentLabel.isVisible({ timeout: 15000 }).catch(() => false);
    if (result.checks.equipmentSelectedInQuote) {
        await equipmentLabel.locator("input[type='checkbox']").check();
        result.observations.push(`DATO: equipo ${serie} visible y seleccionado en la cotización.`);
    } else {
        result.observations.push(`FALLO: el equipo ${serie} no apareció en "Equipos asociados a la cotización".`);
    }
    await shoot(page, "02-prospecto-y-equipo-seleccionado");

    // ── Vigencia 1 mes ───────────────────────────────────────────────────
    await page.locator("input[type='date']").first().fill(validUntilIso);

    // ── Línea 1: Reparación PLC 3.800.000 sin IVA ───────────────────────
    const lineInfo = await fillLastQuoteLine(page, {
        servicioPattern: /repar/i,
        descripcion: `Reparación PLC (serie ${serie}) - mano de obra y pruebas`,
        precio: 3800000,
    });
    result.observations.push(`DATO: catálogo de servicios disponible: [${lineInfo.opcionesServicio.join(", ")}]; línea 1 con servicio "${lineInfo.servicioElegido}".`);
    const resumenText = await page.locator("h6", { hasText: /^Resumen$/i }).locator("..").innerText().catch(() => "");
    const subtotalOk = resumenText.replace(/[.,\s]/g, "").includes("3800000");
    result.checks.serviceLinePriced = subtotalOk;
    if (!subtotalOk) result.observations.push(`OBSERVACION: el resumen no refleja el subtotal 3.800.000: "${resumenText.slice(0, 200)}"`);

    // ── Línea 2: diagnóstico cerrado como ítem a $0 ─────────────────────
    await page.getByRole("button", { name: /Agregar item/i }).first().click();
    await page.waitForTimeout(800);
    await fillLastQuoteLine(page, {
        servicioPattern: /diagn/i,
        descripcion: `Diagnóstico técnico cerrado (serie ${serie}) - sin costo adicional`,
        precio: 0,
    }).catch(() => {
        result.observations.push("OBSERVACION: no se pudo agregar la línea de diagnóstico (ítem opcional).");
    });

    // ── Plazo, garantía, vigencia y comentario del cliente ───────────────
    const termsBox = page.locator("label", { hasText: /Terminos y Condiciones/i }).locator("..").locator("textarea");
    await termsBox.fill(
        "Plazo de ejecución: 15 días hábiles a partir de la aceptación. " +
        "Garantía: 6 meses sobre la reparación realizada. " +
        "Vigencia de la oferta: 1 mes (30 días calendario).",
    );
    const noteBox = page.locator("label", { hasText: /Nota Para El Destinatario/i }).locator("..").locator("textarea");
    await noteBox.fill("requerido antes del 15 de diciembre de 2026");
    const descBox = page.locator("textarea[placeholder*='condiciones generales']").first();
    await descBox.fill(`Cotización de reparación PLC serie ${serie}. Valores en COP sin IVA.`);
    result.checks.termsAndNoteFilled = true;
    await shoot(page, "03-cotizacion-llena");

    // ── Guardar ──────────────────────────────────────────────────────────
    await page.locator(".card-footer").getByRole("button", { name: /^Guardar$/ }).first().click();
    await page.waitForFunction(
        () => !Array.from(document.querySelectorAll("h5")).some((n) => (n.textContent || "").toLowerCase().includes("nueva cotizacion")),
        null,
        { timeout: timeoutMs },
    );
    result.checks.quoteSavedViaUi = true;
    await page.waitForTimeout(2000);

    // ── Consecutivo COT-* en la lista ────────────────────────────────────
    const row = page.locator("tbody tr").filter({ hasText: prospectName }).first();
    const rowVisible = await row.isVisible({ timeout: 15000 }).catch(() => false);
    if (!rowVisible) throw new Error(`la fila de la cotización de ${prospectName} no aparece en la lista`);
    const rowText = await row.innerText();
    const cotMatch = rowText.match(/COT-\d{4}-\d+/);
    if (cotMatch) {
        result.codes.quoteCodigo = cotMatch[0];
        result.checks.quoteCodeCaptured = true;
    } else {
        result.observations.push(`OBSERVACION: la fila no muestra consecutivo COT-*: "${rowText.slice(0, 160)}"`);
    }
    await shoot(page, "04-cotizacion-guardada-en-lista");

    // ── Verificación cruzada por API ─────────────────────────────────────
    const list = await api("GET", "/api/v1/crm-quotes/quotes");
    const quote = (list.payload?.items || []).find((q) => String(q.prospecto || "").trim() === prospectName);
    if (!quote) {
        throw new Error("la cotización creada no aparece en API/BD");
    }
    result.codes.quoteId = String(quote.id);
    result.codes.quoteToken = String(quote.token || "");
    if (result.codes.quoteCodigo && String(quote.codigo) !== result.codes.quoteCodigo) {
        result.observations.push(`OBSERVACION: código en UI (${result.codes.quoteCodigo}) != API (${quote.codigo})`);
    }
    if (!result.codes.quoteCodigo) {
        result.codes.quoteCodigo = String(quote.codigo || "");
        result.checks.quoteCodeCaptured = /^COT-\d{4}-\d+/.test(result.codes.quoteCodigo);
    }
    const lines = Array.isArray(quote.lineas) ? quote.lineas : [];
    const repairLine = lines.find((l) => /reparaci/i.test(String(l.descripcion || "")));
    const apiOk =
        Boolean(repairLine) &&
        Number(repairLine?.precioUnitario) === 3800000 &&
        Number(repairLine?.impuesto) === 0 &&
        String(quote.validoHasta || "").trim() === isoToLabel(validUntilIso);
    result.checks.quoteVerifiedInApi = apiOk;
    if (!apiOk) {
        result.observations.push(
            `OBSERVACION API: lineas=${JSON.stringify(lines).slice(0, 300)} validoHasta=${quote.validoHasta}`,
        );
    }
    const equipIds = Array.isArray(quote.selectedEquipmentIds) ? quote.selectedEquipmentIds : [];
    result.checks.equipmentLinkedInApi = equipIds.includes(itemId);
    if (!result.checks.equipmentLinkedInApi) {
        result.observations.push(`OBSERVACION: selectedEquipmentIds=${JSON.stringify(equipIds)} no incluye ${itemId}`);
    }
    const detail = await api("GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(result.codes.quoteId)}`);
    if (detail.ok && !result.checks.equipmentLinkedInApi) {
        const ids = Array.isArray(detail.payload?.selectedEquipmentIds) ? detail.payload.selectedEquipmentIds : [];
        result.checks.equipmentLinkedInApi = ids.includes(itemId);
    }

    // ── Interconexión: el equipo cotizado ya no es seleccionable ────────
    await createBtn.click({ timeout: 15000 }).catch(() => {});
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll("h5")).some((n) => (n.textContent || "").toLowerCase().includes("nueva cotizacion")),
        null,
        { timeout: timeoutMs },
    ).catch(() => {});
    const prospectSelect2 = page.locator("select.form-select").first();
    await prospectSelect2.selectOption({ label: prospectName }).catch(() => {});
    await page.waitForTimeout(3000);
    const stillVisible = await page.locator("label.form-check", { hasText: serie }).first().isVisible({ timeout: 8000 }).catch(() => false);
    result.checks.equipmentExcludedAfterQuote = !stillVisible;
    if (stillVisible) {
        result.observations.push(`FALLO interconexión: el equipo ${serie} sigue seleccionable tras cotizarlo (debería excluirse).`);
    } else {
        result.observations.push("DATO interconexión: tras guardar la cotización el equipo ya NO aparece como seleccionable en una nueva cotización (excludeAlreadyQuotedItems).");
    }
    await shoot(page, "05-equipo-excluido-nueva-cotizacion");
    await page.goto(`${baseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
    await page.waitForTimeout(1500);

    // ── Vista previa pública + descarga PDF ─────────────────────────────
    if (result.codes.quoteToken) {
        const previewPage = await context.newPage();
        previewPage.on("pageerror", (err) => pushUnique(pageErrors, err?.stack || err?.message || String(err)));
        await previewPage.goto(`${baseUrl}/estimate/${result.codes.quoteToken}`, { waitUntil: "networkidle", timeout: timeoutMs });
        // Esperar el render real del documento: el innerText inmediato puede
        // capturarse antes de que Angular pinte la cotización (timing flake).
        await previewPage.waitForFunction(
            () => {
                const text = (document.body?.innerText || "").toLowerCase();
                return text.includes("cotizacion") || text.includes("presupuesto") || text.includes("total") || text.includes("estimacion");
            },
            null,
            { timeout: 30000 },
        ).catch(() => {});
        const previewText = await previewPage.evaluate(() => (document.body?.innerText || "").toLowerCase());
        result.checks.quotePreviewLoaded =
            previewText.includes("cotizacion") || previewText.includes("presupuesto") || previewText.includes("total") || previewText.includes("estimacion");
        await previewPage.waitForTimeout(1500);
        await previewPage.screenshot({ path: path.resolve(artifactsDir, `${prefix}06-vista-previa-${Date.now()}.png`), fullPage: true }).catch(() => "");
        const downloadBtn = previewPage.getByRole("button", { name: /Descargar/i }).first();
        if (await downloadBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
            await downloadBtn.click();
            await previewPage.waitForTimeout(2500);
            const printCalls = await previewPage.evaluate(() => window.__e2ePrintCalls || 0).catch(() => 0);
            if (printCalls > 0) {
                // El flujo "Descargar" = window.print() (guardar como PDF desde
                // el diálogo del navegador); no genera un evento download.
                result.checks.quotePdfDownloadable = true;
                result.observations.push(
                    "DATO: botón Descargar operativo: dispara window.print() → el usuario guarda el PDF desde el diálogo de impresión (no hay descarga directa de archivo).",
                );
            } else {
                result.observations.push("FALLO: el botón Descargar no disparó window.print().");
            }
        } else {
            result.observations.push("OBSERVACION: botón Descargar no visible en la vista previa.");
        }
        await previewPage.close().catch(() => {});
    }

    const failed = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failed.length > 0) {
        result.observations.push(`Checks no aprobados: ${failed.map(([k]) => k).join(", ")}`);
        process.exitCode = 1;
    }
    await fs.writeFile(
        path.resolve(artifactsDir, `${prefix}results-${stamp}.json`),
        JSON.stringify(result, null, 2),
    );
    console.log("E2E_LARS_T05_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            await shoot(browser.contexts()[0].pages()[0], "fail");
        }
    } catch { /* noop */ }
    try {
        await fs.writeFile(
            path.resolve(artifactsDir, `${prefix}results-error-${stamp}.json`),
            JSON.stringify(result, null, 2),
        );
    } catch { /* noop */ }
    console.error("E2E_LARS_T05_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
