/**
 * E2E t13 — FACTURACIÓN DESDE LA COTIZACIÓN (rol admin).
 *
 * Flujo: login admin (API + sesión sembrada) → setup por API (prospecto →
 * convertir a cliente → plazo de pago 45 días → cotización → aprobación por
 * token público) → FACTURAR 100% por UI desde /app/crm-cotizaciones con el
 * botón "Convertir en factura" (data-testid=convert-to-invoice-btn) →
 * verificar por API: factura borrador con consecutivo FAC-*, cliente
 * vinculado (crm-client-<id>), plazo heredado (dueDate = emisión + 45d) e
 * interconexión finance_invoices.source_quote_id → cotización → idempotencia:
 * re-facturar desde la UI no duplica (alerta 409) y tampoco por API.
 *
 * Re-ejecutar:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t13-factura-playwright.mjs
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
const prefix = "e2e-lars-t13-";
const stamp = Date.now();

const prospectName = `PW-T13-Fact-${stamp}`;
const prospectEmail = `pw-t13-${stamp}@prueba.com`;
const companyName = `PW T13 Fact Company ${stamp}`;
const quoteCodigo = `PW-T13-${stamp}`;
const plazoDias = 45; // distintivo del default (30) para probar la herencia

const result = {
    test: "e2e-lars-t13-factura",
    baseUrl,
    checks: {
        loggedIn: false,
        prospectCreated: false,
        prospectConvertedToClient: false,
        plazoActualizado: false,
        quoteCreated: false,
        quoteApproved: false,
        facturarBtnVisible: false,
        invoiceCreatedViaUi: false,
        invoiceConsecutiveCaptured: false,
        invoiceFoundInApi: false,
        sourceQuoteIdLinked: false,
        clientLinkedToMaster: false,
        plazoInherited: false,
        invoiceInFinanceList: false,
        noDuplicateOnUiRefacturar: false,
        noDuplicateInApi: false,
        apiRefacturarReturns409: false,
    },
    codes: {
        prospectId: "",
        clientId: "",
        quoteId: "",
        quoteCodigo,
        quoteToken: "",
        invoiceId: 0,
        invoiceCode: "",
        invoiceSeriesPrefix: "",
        invoiceSequenceNumber: 0,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshots: [],
    cleanupLog: [],
    error: "",
};

let browser;
let session;

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
            Authorization: session?.accessToken ? `Bearer ${session.accessToken}` : "",
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
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

function daysBetween(isoA, isoB) {
    const a = new Date(`${isoA}T00:00:00Z`).getTime();
    const b = new Date(`${isoB}T00:00:00Z`).getTime();
    return Math.round((b - a) / 86400000);
}

async function cleanup() {
    const log = result.cleanupLog;
    const c = result.codes;
    const steps = [];
    if (c.invoiceId > 0) steps.push(["DELETE", `/api/v1/finance/invoices/${c.invoiceId}`, `factura ${c.invoiceId}`]);
    if (c.quoteId) steps.push(["DELETE", `/api/v1/crm-quotes/quotes/${encodeURIComponent(c.quoteId)}`, `cotización ${c.quoteId}`]);
    if (c.clientId) steps.push(["DELETE", `/api/v1/crm/clients/${encodeURIComponent(c.clientId)}`, `cliente ${c.clientId}`]);
    if (c.prospectId) steps.push(["DELETE", `/api/v1/crm/prospects/${encodeURIComponent(c.prospectId)}`, `prospecto ${c.prospectId}`]);
    for (const [method, url, label] of steps) {
        try {
            const res = await api(method, url);
            log.push(`${label} → HTTP ${res.status}`);
        } catch (error) {
            log.push(`${label} → error ${String(error).slice(0, 100)}`);
        }
    }
    console.log(`\n[LIMPIEZA] ${log.join(" | ")}`);
}

try {
    // ── 1. Login admin ─────────────────────────────────────────────────────
    const loginRes = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
    });
    if (!loginRes.ok) throw new Error(`login admin falló HTTP ${loginRes.status}`);
    const payload = await loginRes.json();
    session = { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
    result.checks.loggedIn = true;

    // ── 2. Setup: prospecto → cliente (conversión real) ────────────────────
    const prospect = await api("POST", "/api/v1/crm/prospects", {
        name: prospectName,
        email: prospectEmail,
        company: companyName,
        mobile: "3005551313",
        status: "Pendiente",
    });
    if (!prospect.ok || !prospect.payload?.id) {
        throw new Error(`crear prospecto falló HTTP ${prospect.status}: ${prospect.text.slice(0, 200)}`);
    }
    result.codes.prospectId = String(prospect.payload.id);
    result.checks.prospectCreated = true;

    const convert = await api("POST", `/api/v1/crm/prospects/${encodeURIComponent(result.codes.prospectId)}/convert-to-client`, {});
    const client = convert.payload?.client || convert.payload;
    if (!convert.ok || !client?.id) {
        throw new Error(`convertir prospecto a cliente falló HTTP ${convert.status}: ${convert.text.slice(0, 200)}`);
    }
    result.codes.clientId = String(client.id);
    result.checks.prospectConvertedToClient = true;
    result.observations.push(`DATO: conversión prospecto→cliente (${convert.payload?.created ? "nuevo" : "existente"}), clientId=${result.codes.clientId}.`);

    // ── 3. Plazo de pago distintivo (45 días) en la ficha del cliente ──────
    const clientGet = await api("GET", `/api/v1/crm/clients/${encodeURIComponent(result.codes.clientId)}`, null);
    const clientBody = clientGet.payload?.client || clientGet.payload;
    if (!clientGet.ok || !clientBody) throw new Error(`GET cliente falló HTTP ${clientGet.status}`);
    const { id: _omitId, creado: _omitCreado, ...putBody } = clientBody;
    putBody.credito = { ...(putBody.credito || {}), paymentTermDays: plazoDias };
    const clientPut = await api("PUT", `/api/v1/crm/clients/${encodeURIComponent(result.codes.clientId)}`, putBody);
    const afterPut = await api("GET", `/api/v1/crm/clients/${encodeURIComponent(result.codes.clientId)}`, null);
    const afterPutBody = afterPut.payload?.client || afterPut.payload;
    result.checks.plazoActualizado =
        (clientPut.ok || Number(afterPutBody?.credito?.paymentTermDays) === plazoDias) &&
        Number(afterPutBody?.credito?.paymentTermDays) === plazoDias;
    if (!result.checks.plazoActualizado) {
        result.observations.push(`FALLO: no se pudo fijar plazo=${plazoDias} en el cliente (PUT HTTP ${clientPut.status}: ${clientPut.text.slice(0, 150)}).`);
    }

    // ── 4. Cotización (contrato API vigente) y aprobación por token ────────
    const quoteRes = await api("POST", "/api/v1/crm-quotes/quotes", {
        codigo: quoteCodigo,
        prospecto: prospectName,
        empresa: companyName,
        correo: prospectEmail,
        movil: "3005551313",
        estado: "Borrador",
        moneda: "COP",
        descuentoTipo: "COP",
        descuentoValor: 0,
        lineas: [
            { servicio: "Reparación PLC", descripcion: `Mano de obra y pruebas (t13 ${stamp})`, cantidad: 1, unidad: "Unidad", precioUnitario: 1200000, impuesto: 19 },
            { servicio: "Despacho local", descripcion: "Entrega en sitio", cantidad: 1, unidad: "Unidad", precioUnitario: 80000, impuesto: 0 },
        ],
        nota: `Facturación t13 ${stamp}`,
        terminos: "Pago a 45 días. Vigencia 30 días.",
        taxMode: "",
    });
    const quote = quoteRes.payload;
    if (!quoteRes.ok || !quote?.id || !quote?.token) {
        throw new Error(`crear cotización falló HTTP ${quoteRes.status}: ${quoteRes.text.slice(0, 250)}`);
    }
    result.codes.quoteId = String(quote.id);
    result.codes.quoteToken = String(quote.token);
    result.checks.quoteCreated = true;

    const decision = await api("PATCH", `/api/v1/crm-quotes/quotes/public/${encodeURIComponent(result.codes.quoteToken)}/decision`, {
        estadoCliente: "Aceptada",
        firmadoPor: "Cliente Prueba T13",
        firmanteCorreo: prospectEmail,
        lugarFirma: "Sede principal",
    });
    if (!decision.ok) throw new Error(`aprobar cotización falló HTTP ${decision.status}: ${decision.text.slice(0, 200)}`);
    const quoteAfter = await api("GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(result.codes.quoteId)}`, null);
    const quoteState = quoteAfter.payload;
    result.checks.quoteApproved =
        String(quoteState?.estadoCliente || "").toLowerCase() === "aceptada" &&
        String(quoteState?.estado || "").toLowerCase() === "aprobado";
    if (!result.checks.quoteApproved) {
        throw new Error(`la cotización no quedó aprobada: estado=${quoteState?.estado} estadoCliente=${quoteState?.estadoCliente}`);
    }

    // ── 5. UI: sesión sembrada y lista de cotizaciones ─────────────────────
    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1600, height: 980 } });
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

    await page.goto(`${baseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(3000);

    const quoteRow = page.locator("tbody tr").filter({ hasText: quoteCodigo }).first();
    let rowVisible = await quoteRow.isVisible({ timeout: 20000 }).catch(() => false);
    if (!rowVisible) {
        await page.reload({ waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
        await page.waitForTimeout(3000);
        rowVisible = await quoteRow.isVisible({ timeout: 20000 }).catch(() => false);
    }
    if (!rowVisible) throw new Error(`la fila de la cotización ${quoteCodigo} no aparece en la lista`);
    const estadoBadge = await quoteRow.locator("span.badge").last().innerText().catch(() => "");
    if (!/aprobado/i.test(estadoBadge)) {
        throw new Error(`la cotización no muestra estado Aprobado en la UI (badge="${estadoBadge}")`);
    }

    const facturarBtn = quoteRow.locator('[data-testid="convert-to-invoice-btn"]');
    result.checks.facturarBtnVisible = await facturarBtn.isVisible({ timeout: 10000 }).catch(() => false);
    await shoot(page, "01-cotizacion-aprobada-lista");
    if (!result.checks.facturarBtnVisible) {
        throw new Error('el botón "Convertir en factura" no está visible en la fila aprobada');
    }

    // ── 6. FACTURAR desde la UI ────────────────────────────────────────────
    await facturarBtn.click();
    const successAlert = page.locator('[data-testid="quote-conversion-success"]');
    const errorAlert = page.locator('[data-testid="quote-conversion-error"]');
    const converted = await successAlert
        .waitFor({ state: "visible", timeout: 30000 })
        .then(() => true)
        .catch(() => false);
    if (!converted) {
        const errText = await errorAlert.innerText().catch(() => "(sin alerta de error)");
        throw new Error(`la conversión por UI no mostró éxito. Alerta de error: ${errText.slice(0, 250)}`);
    }
    result.checks.invoiceCreatedViaUi = true;
    const conversionMsg = await successAlert.innerText();
    const facMatch = conversionMsg.match(/FAC-\d{4}-\d+/);
    if (facMatch) {
        result.codes.invoiceCode = facMatch[0];
        result.checks.invoiceConsecutiveCaptured = true;
    } else {
        result.observations.push(`OBSERVACION: el mensaje de éxito no trae consecutivo FAC-*: "${conversionMsg.slice(0, 200)}"`);
    }
    await shoot(page, "02-factura-creada-mensaje");

    // ── 7. Verificación API de la factura + interconexiones ────────────────
    const invoicesRes = await api("GET", "/api/v1/finance/invoices?limit=300", null);
    const invoiceItems = invoicesRes.payload?.items || invoicesRes.payload || [];
    const invoice = (Array.isArray(invoiceItems) ? invoiceItems : []).find(
        (inv) => String(inv.sourceQuoteId || "") === result.codes.quoteId,
    );
    if (!invoice) throw new Error(`no hay factura con sourceQuoteId=${result.codes.quoteId} en /finance/invoices`);
    result.codes.invoiceId = Number(invoice.id || 0);
    result.checks.invoiceFoundInApi = result.codes.invoiceId > 0;

    result.checks.sourceQuoteIdLinked = String(invoice.sourceQuoteId || "") === result.codes.quoteId;

    result.checks.clientLinkedToMaster =
        String(invoice.clientId || "") === `crm-client-${result.codes.clientId}` &&
        String(invoice.clientName || "").toLowerCase().includes(companyName.toLowerCase().replace(/^pw /, "pw "));

    const issue = String(invoice.issueDate || "").slice(0, 10);
    const due = String(invoice.dueDate || "").slice(0, 10);
    const diff = daysBetween(issue, due);
    result.checks.plazoInherited = diff === plazoDias;
    if (!result.checks.plazoInherited) {
        result.observations.push(`FALLO INTEGRIDAD: plazo no heredado. issueDate=${issue} dueDate=${due} diff=${diff}d (esperado ${plazoDias}d según cliente).`);
    }

    const prefixOk = String(invoice.seriesPrefix || "").startsWith("FAC-");
    result.codes.invoiceSeriesPrefix = String(invoice.seriesPrefix || "");
    result.codes.invoiceSequenceNumber = Number(invoice.sequenceNumber || 0);
    if (!result.codes.invoiceCode && prefixOk) {
        result.codes.invoiceCode = `${invoice.seriesPrefix}${String(invoice.sequenceNumber).padStart(3, "0")}`;
    }
    const uiCodeOk = !result.checks.invoiceConsecutiveCaptured ||
        result.codes.invoiceCode === `${invoice.seriesPrefix}${String(invoice.sequenceNumber).padStart(3, "0")}` ||
        result.codes.invoiceCode === `${invoice.seriesPrefix}${String(invoice.sequenceNumber).padStart(6, "0")}`;
    if (!prefixOk || !uiCodeOk) {
        result.observations.push(`FALLO: consecutivo inconsistente. UI="${result.codes.invoiceCode}" API=${invoice.seriesPrefix}${invoice.sequenceNumber}`);
    }
    if (String(invoice.status || "") !== "Borrador") {
        result.observations.push(`OBSERVACION: estado inicial de la factura convertida = "${invoice.status}" (se esperaba Borrador).`);
    }

    // ── 8. La factura también se ve en el módulo de finanzas ───────────────
    // El chunk de finanzas tarda en bootear en frío (servidor compartido): se
    // espera la respuesta real de GET /finance/invoices (ground truth) antes
    // de buscar la fila, y se reintenta la navegación una vez si no llega.
    let invoicesApiFired = false;
    for (let attempt = 1; attempt <= 2 && !invoicesApiFired; attempt++) {
        const apiPromise = page
            .waitForResponse(
                (resp) => resp.request().method() === "GET" && /\/api\/v1\/finance\/invoices(\?|$)/.test(resp.url()),
                { timeout: 90000 },
            )
            .then(() => true)
            .catch(() => false);
        await page.goto(`${baseUrl}/app/finance-facturacion`, { waitUntil: "domcontentloaded", timeout: timeoutMs }).catch(() => {});
        invoicesApiFired = await apiPromise;
    }
    result.observations.push(`DATO: GET /finance/invoices en la vista de finanzas: ${invoicesApiFired ? "disparado" : "NO disparado en 2 intentos (boot de Angular no completó)"}.`);
    await page.waitForTimeout(2000);
    const invRow = page.locator("tbody tr").filter({ hasText: result.codes.invoiceCode || companyName }).first();
    result.checks.invoiceInFinanceList = await invRow.isVisible({ timeout: 30000 }).catch(() => false);
    await shoot(page, "03-factura-en-modulo-finanzas");
    if (!result.checks.invoiceInFinanceList) {
        const bodySnippet = ((await page.locator("body").innerText().catch(() => "")) || "").replace(/\s+/g, " ").slice(0, 300);
        result.observations.push(`OBSERVACION: la factura ${result.codes.invoiceCode} no se ve en /app/finance-facturacion. body="${bodySnippet}"`);
    }

    // ── 9. Idempotencia: re-facturar desde la UI no duplica ────────────────
    await page.goto(`${baseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(3000);
    const quoteRow2 = page.locator("tbody tr").filter({ hasText: quoteCodigo }).first();
    const btn2 = quoteRow2.locator('[data-testid="convert-to-invoice-btn"]');
    if (await btn2.isVisible({ timeout: 15000 }).catch(() => false)) {
        await btn2.click();
        const dupRejected = await errorAlert
            .waitFor({ state: "visible", timeout: 30000 })
            .then(() => true)
            .catch(() => false);
        const errMsg = dupRejected ? await errorAlert.innerText().catch(() => "") : "(sin alerta)";
        result.checks.noDuplicateOnUiRefacturar = dupRejected;
        if (!dupRejected) {
            result.observations.push(`FALLO IDEMPOTENCIA UI: re-facturar no mostró el rechazo 409 (mensaje="${errMsg.slice(0, 200)}").`);
        }
        await shoot(page, "04-refacturar-rechazado");
    } else {
        result.observations.push("OBSERVACION: tras facturar, el botón 'Convertir en factura' ya no aparece (la UI oculta la acción). Se verifica idempotencia por API.");
        result.checks.noDuplicateOnUiRefacturar = true; // la acción ya no está disponible = no duplica
        await shoot(page, "04-refacturar-boton-oculto");
    }

    const invoicesAfter = await api("GET", "/api/v1/finance/invoices?limit=300", null);
    const itemsAfter = invoicesAfter.payload?.items || invoicesAfter.payload || [];
    const duplicates = (Array.isArray(itemsAfter) ? itemsAfter : []).filter(
        (inv) => String(inv.sourceQuoteId || "") === result.codes.quoteId,
    );
    result.checks.noDuplicateInApi = duplicates.length === 1;

    const refact = await api("POST", `/api/v1/finance/invoices/from-quote/${encodeURIComponent(result.codes.quoteId)}`, {});
    result.checks.apiRefacturarReturns409 = refact.status === 409;
    if (!result.checks.apiRefacturarReturns409) {
        result.observations.push(`FALLO IDEMPOTENCIA API: POST from-quote respondió HTTP ${refact.status} (esperado 409): ${refact.text.slice(0, 200)}`);
    }

    result.observations.push(
        `DATO: factura ${result.codes.invoiceCode} (id=${result.codes.invoiceId}) source='${invoice.source || ""}' ` +
        `cliente='${invoice.clientName}' issue=${issue} due=${due} (${diff}d) total=${invoice.total} estado='${invoice.status}'.`,
    );
} catch (error) {
    result.error = String(error?.stack || error?.message || error);
    console.error("\n❌ FALLO:", result.error);
} finally {
    await cleanup().catch(() => {});
    if (browser) await browser.close().catch(() => {});
}

console.log("\n════════ RESULTADO t13 FACTURACIÓN DESDE COTIZACIÓN ════════");
console.log(`Entorno: ${result.baseUrl} (API ${apiBaseUrl})`);
const failed = [];
for (const [key, value] of Object.entries(result.checks)) {
    console.log(`${value ? "✅" : "❌"} ${key}`);
    if (!value) failed.push(key);
}
if (result.observations.length) {
    console.log("\n── Observaciones ──");
    for (const o of result.observations) console.log(`• ${o}`);
}
if (result.consoleErrors.length) console.log("\n[console.error]", result.consoleErrors.join(" | ").slice(0, 600));
if (result.pageErrors.length) console.log("\n[pageerror]", result.pageErrors.join(" | ").slice(0, 600));
if (failed.length) console.log(`\n❌ CHECKS EN ROJO (${failed.length}): ${failed.join(", ")}`);
else console.log("\n✅ TODOS LOS CHECKS t13 PASARON");
console.log("─────────────────────────────────────────────────────────────");

await fs.writeFile("e2e-lars-t13-result.json", JSON.stringify(result, null, 2));
console.log("JSON de resultados: e2e-lars-t13-result.json");

process.exit(result.error || Object.values(result.checks).some((v) => !v) ? 1 : 0);
