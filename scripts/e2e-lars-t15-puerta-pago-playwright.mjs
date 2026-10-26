/**
 * E2E LARS t15 — PUERTA DE PAGO AL DESPACHO (rol: admin/logística).
 *
 * Regla de negocio validada (Fase 5c, backend/internal/remissions/service_payment_gate5c.go):
 *   - Cliente sin crédito + remisión contra-entrega sin factura ⇒ el despacho se
 *     BLOQUEA al marcar "entregado" (409 con mensaje visible).
 *   - Con factura vinculada en estado "Pagado" ⇒ se puede marcar entregado.
 *
 * Cadena:
 *   1. Login admin (API).
 *   2. Setup por API: prospecto + cotización → aceptación pública por token →
 *      cliente maestro auto-creado SIN crédito (credit_enabled=false).
 *   3. UI (/app/remissions): crear remisión contra-entrega para ese cliente →
 *      debe mostrar "Retenida por pago".
 *   4. UI: intentar "Marcar entregado" → debe BLOQUEAR con mensaje visible
 *      (alerta + modal de override admin). Cancelar el override.
 *   5. API: factura desde la cotización → registrar pago total → factura "Pagado".
 *   6. UI: "Vincular factura" → seleccionar la factura Pagada → confirmar.
 *   7. UI: "Marcar entregado" → ahora sí debe pasar.
 *   8. API: verificar delivery_status="entregado" (interconexión finanzas→logística).
 *
 * Uso:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t15-puerta-pago-playwright.mjs
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const apiBaseUrl = (process.env.PW_API_BASE_URL || new URL(baseUrl).origin).replace(/\/+$/, "");

const RUN = Date.now();
const SERIE = `t15${String(RUN).slice(-6)}`;
const PROSPECT_NAME = `PW Puerta Pago ${SERIE}`;
const CLIENT_NAME = `Cliente T15 Puerta Pago ${SERIE}`; // empresa; identifica cliente maestro
const CLIENT_EMAIL = `pw-t15-${SERIE}@alfa.local`;
const QUOTE_CODE = `COT-T15-${SERIE}`;
const EQ_IDENTIFIER = `EQ-T15-${SERIE}`;
const GUIDE = `GUIA-T15-${SERIE}`;

const result = {
    test: "e2e-lars-t15-puerta-pago",
    baseUrl,
    runId: RUN,
    checks: {
        loginAdmin: false,
        prospectCreated: false,
        quoteCreated: false,
        quoteAccepted: false,
        clientWithoutCredit: false,
        remissionCreatedUI: false,
        gateBadgeShown: false,
        markDeliveredBlocked: false,
        blockMessageVisible: false,
        stillPendingAfterBlock: false,
        invoiceCreatedFromQuote: false,
        paymentRegistered: false,
        invoiceMarkedPagado: false,
        invoiceOptionsListedInvoice: false,
        invoiceLinkedUI: false,
        invoiceLinked: false,
        linkIndicatorPaid: false,
        markDeliveredSuccess: false,
        deliveryStatusEntregado: false,
    },
    codes: { prospectId: "", quoteId: "", quoteCode: QUOTE_CODE, clientId: "", remissionId: "", remissionConsecutive: "", invoiceId: 0, invoiceCode: "", paymentId: 0 },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshots: [],
    error: "",
};

let browser;
let session;
let remissionId = "";

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function apiLogin() {
    const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!res.ok) throw new Error(`login failed ${res.status}`);
    const payload = await res.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

function apiHeaders() {
    return { "Content-Type": "application/json", "X-Company-Id": companyId, Authorization: `Bearer ${session.accessToken}` };
}

async function api(method, urlPath, body) {
    const res = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: apiHeaders(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text().catch(() => "");
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    return { status: res.status, ok: res.ok, data, raw: text };
}

async function shot(page, name) {
    const p = path.resolve(artifactsDir, `e2e-lars-t15-${name}-${Date.now()}.png`);
    try {
        await page.screenshot({ path: p, fullPage: true, timeout: 15000 });
    } catch {
        try {
            await page.screenshot({ path: p, timeout: 10000 });
        } catch {
            result.observations.push(`OBSERVACIÓN: no se pudo capturar ${name}.png`);
            return "";
        }
    }
    result.screenshots.push(p);
    return p;
}

/** Nudge de change detection: este build no repinta tras fetch() hasta el
 *  siguiente evento Angular-bound. Un click inofensivo lo dispara. */
async function nudge(page) {
    await page.locator("h5, h4, .card-title").first().click({ position: { x: 2, y: 2 }, force: true }).catch(() => {});
    await page.waitForTimeout(700);
}

/** Localiza la fila de la remisión de esta corrida en la tabla. */
function remissionRow(page) {
    return page.locator("tbody tr", { hasText: CLIENT_NAME }).first();
}

async function findRemissionByApi() {
    const res = await api("GET", "/api/v1/remissions/remissions");
    const items = res.data?.items || [];
    const match = items.find((r) => String(r.clientName || "") === CLIENT_NAME && String(r.guideNumber || "") === GUIDE);
    return match || null;
}

async function getRemissionByApi(id) {
    const res = await api("GET", `/api/v1/remissions/remissions/${encodeURIComponent(id)}`);
    return res.ok ? res.data : null;
}

try {
    // ── 1. Login admin ────────────────────────────────────────────────────
    session = await apiLogin();
    result.checks.loginAdmin = true;

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

    // ── 2. Setup API: prospecto + cotización ─────────────────────────────
    const prospectRes = await api("POST", "/api/v1/crm/prospects", {
        name: PROSPECT_NAME, email: CLIENT_EMAIL, company: CLIENT_NAME, mobile: "3005550100",
    });
    if (!prospectRes.ok) throw new Error(`crear prospecto falló ${prospectRes.status}: ${prospectRes.raw.slice(0, 200)}`);
    result.codes.prospectId = String(prospectRes.data?.id || prospectRes.data?.prospectId || "");
    result.checks.prospectCreated = true;

    const quotePayload = {
        codigo: QUOTE_CODE,
        prospecto: PROSPECT_NAME,
        empresa: CLIENT_NAME,
        correo: CLIENT_EMAIL,
        movil: "3005550100",
        estado: "Borrador",
        moneda: "COP",
        descuentoTipo: "COP",
        descuentoValor: 0,
        lineas: [{ servicio: "Equipo de prueba puerta de pago", descripcion: "Equipo QA t15", cantidad: 1, unidad: "Unidad", precioUnitario: 250000, impuesto: 0 }],
        nota: `Cotización QA puerta de pago ${SERIE}`,
        terminos: "Pago contra entrega.",
        taxMode: "",
    };
    let quoteRes = await api("POST", "/api/v1/crm-quotes/quotes", quotePayload);
    if (!quoteRes.ok && result.codes.prospectId) {
        quoteRes = await api("POST", "/api/v1/crm-quotes/quotes", { ...quotePayload, prospectId: Number(result.codes.prospectId) });
    }
    if (!quoteRes.ok) throw new Error(`crear cotización falló ${quoteRes.status}: ${quoteRes.raw.slice(0, 200)}`);
    const quote = quoteRes.data;
    result.codes.quoteId = String(quote?.id || "");
    if (!result.codes.quoteId || !quote?.token) throw new Error("cotización sin id/token");
    result.checks.quoteCreated = true;

    // ── 3. Aceptación pública → cliente maestro auto-creado sin crédito ──
    const decisionRes = await api("PATCH", `/api/v1/crm-quotes/quotes/public/${encodeURIComponent(quote.token)}/decision`, {
        estadoCliente: "Aceptada", firmadoPor: "Cliente QA T15", firmanteCorreo: CLIENT_EMAIL, lugarFirma: "Sede QA",
    });
    if (!decisionRes.ok) throw new Error(`aceptar cotización falló ${decisionRes.status}: ${decisionRes.raw.slice(0, 200)}`);
    const quoteAfter = (await api("GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(result.codes.quoteId)}`)).data;
    if (String(quoteAfter?.estado || "").toLowerCase() !== "aprobado") {
        result.observations.push(`OBSERVACIÓN: cotización quedó en estado '${quoteAfter?.estado}' (se esperaba 'Aprobado').`);
    }
    result.checks.quoteAccepted = String(quoteAfter?.estado || "").toLowerCase() === "aprobado";

    const clientsRes = await api("GET", "/api/v1/crm/clients?limit=500");
    const clients = Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data?.items || [];
    const client = clients.find((c) => String(c.empresa || "").trim() === CLIENT_NAME);
    if (!client) throw new Error(`cliente maestro '${CLIENT_NAME}' no apareció en /crm/clients tras aceptar la cotización`);
    result.codes.clientId = String(client.id || "");
    result.checks.clientWithoutCredit = client?.credito?.enabled === false;
    if (client?.credito?.enabled !== false) {
        result.observations.push(`HALLAZGO: cliente '${CLIENT_NAME}' quedó con credito.enabled=${client?.credito?.enabled} (se esperaba false tras crearlo desde cotización).`);
    }

    // ── 4. UI: crear remisión contra-entrega (sin factura) ───────────────
    await page.goto(`${baseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2500);
    await nudge(page);

    await page.locator("[data-testid='create-remission-btn']").click({ timeout: 15000 });
    await page.waitForTimeout(800);

    await page.locator("[data-testid='remission-client']").fill(CLIENT_NAME);
    await page.locator("[data-testid='remission-contact-name']").fill("Ing. Logística T15");
    await page.locator("[data-testid='dispatch-type-select']").selectOption("contra-entrega");
    await page.locator("[data-testid='carrier-name-input']").fill("Transportadora T15");
    await page.locator("[data-testid='guide-number-input']").fill(GUIDE);
    await page.locator("[data-testid='purchase-order-input']").fill(`OC-T15-${SERIE}`);

    await page.locator("[data-testid='add-remission-item']").click();
    await page.waitForTimeout(400);
    // Los placeholders son atributos (no textContent): se localizan directo.
    await page.locator("input[placeholder='Identificador']").fill(EQ_IDENTIFIER);
    await page.locator("input[placeholder='Descripcion']").fill("Equipo de prueba puerta de pago T15");
    // Sin accesorios a propósito: así "Marcar entregado" no abre el modal de
    // confirmación de accesorios y el bloqueo por pago queda aislado.
    await page.locator("input[placeholder='Precio']").fill("250000");
    await page.locator("input[placeholder='Cant']").fill("1");

    await shot(page, "00-formulario-remision");
    await page.locator("button", { hasText: /^\s*Guardar\s*$/ }).first().click();
    await page.waitForTimeout(2500);
    await nudge(page);

    const created = await findRemissionByApi();
    result.checks.remissionCreatedUI = Boolean(created);
    if (!created) {
        const blockMsg = await page.locator("[data-testid='remission-save-block'], [data-testid='form-save-block']").textContent().catch(() => "");
        if (blockMsg) result.observations.push(`HALLAZGO: la UI no pudo guardar la remisión: ${blockMsg.trim()}`);
        throw new Error("la remisión no apareció vía API tras guardar en la UI");
    }
    remissionId = String(created.id);
    result.codes.remissionId = remissionId;
    result.codes.remissionConsecutive = String(created.consecutive || "");

    // ── 5. UI: indicador "Retenida por pago" ─────────────────────────────
    await page.goto(`${baseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2500);
    await nudge(page);
    let row = remissionRow(page);
    // isVisible() no espera: con el re-render Angular la fila puede llegar a
    // desadjuntarse y devolver false de inmediato. waitFor sí aguanta la
    // aparición del badge hasta 10s.
    const heldIndicator = row.locator("[data-testid='payment-held-indicator']");
    result.checks.gateBadgeShown = await heldIndicator.waitFor({ state: "visible", timeout: 10000 }).then(() => true).catch(() => false);
    if (result.checks.gateBadgeShown) {
        const reason = String(await row.locator("[data-testid='payment-held-reason']").textContent().catch(() => "")).trim();
        if (!/factura/i.test(reason)) {
            result.observations.push(`OBSERVACIÓN: motivo de retención inesperado: "${reason}".`);
        }
    } else {
        result.observations.push("HALLAZGO: la remisión contra-entrega sin factura NO muestra el indicador 'Retenida por pago'.");
        const deliveredBadge = await row.locator("[data-testid='delivery-status-badge']").textContent().catch(() => "");
        if (/entregado/i.test(deliveredBadge)) result.observations.push("HALLAZGO GRAVE: la remisión quedó 'entregada' sin pasar la puerta de pago.");
    }
    await shot(page, "01-remision-retenida");

    // ── 6. UI: intentar marcar entregado → debe BLOQUEAR ─────────────────
    const blockMarkBtn = row.locator("[data-testid='mark-delivered-btn']");
    await blockMarkBtn.click({ timeout: 15000 }).catch(() => blockMarkBtn.dispatchEvent("click"));
    await page.waitForTimeout(2000);
    await nudge(page);

    const actionMsg = page.locator("[data-testid='dispatch-action-message']");
    const msgText = String(await actionMsg.textContent().catch(() => "")).trim();
    const overrideModal = page.locator("[data-testid='payment-override-modal']");
    const modalVisible = await overrideModal.waitFor({ state: "visible", timeout: 8000 }).then(() => true).catch(() => false);
    result.checks.markDeliveredBlocked = modalVisible || /retenid|factura|pago/i.test(msgText);
    result.checks.blockMessageVisible = modalVisible
        ? await overrideModal.locator("[data-testid='override-block-reason']").isVisible().catch(() => false)
        : /factura|pago|retenid/i.test(msgText);
    if (!result.checks.markDeliveredBlocked) {
        result.observations.push(`HALLAZGO GRAVE: 'Marcar entregado' no fue bloqueado (modal=${modalVisible}, mensaje="${msgText}").`);
    } else if (!/factura/i.test(msgText) && modalVisible) {
        result.observations.push(`OBSERVACIÓN: mensaje de bloqueo genérico, no menciona la factura: "${msgText}".`);
    }
    await shot(page, "02-bloqueo-marcar-entregado");

    // Cancelar el override (NO autorizar: la prueba exige la vía del pago).
    if (modalVisible) {
        await overrideModal.locator("[data-testid='cancel-override-btn'], button", { hasText: /cancelar|cerrar/i }).first().click();
        await page.waitForTimeout(800);
    }

    const afterBlock = await getRemissionByApi(remissionId);
    result.checks.stillPendingAfterBlock = String(afterBlock?.deliveryStatus || "") !== "entregado";
    if (!result.checks.stillPendingAfterBlock) {
        result.observations.push("HALLAZGO GRAVE: la remisión quedó entregada pese al bloqueo de la puerta de pago.");
    }

    // ── 7. API: factura desde la cotización + pago total ─────────────────
    const convertRes = await api("POST", `/api/v1/finance/invoices/from-quote/${encodeURIComponent(result.codes.quoteId)}`, {});
    if (!convertRes.ok) throw new Error(`factura desde cotización falló ${convertRes.status}: ${convertRes.raw.slice(0, 300)}`);
    const invoice = convertRes.data;
    result.codes.invoiceId = Number(invoice.id || 0);
    result.checks.invoiceCreatedFromQuote = result.codes.invoiceId > 0;

    const invDetail = (await api("GET", `/api/v1/finance/invoices/${result.codes.invoiceId}`)).data || invoice;
    const seq = Number(invDetail.sequenceNumber || 0);
    const prefix = String(invDetail.seriesPrefix || "").replace(/-+$/, "");
    // El referenceCode puede ser el código de la COTIZACIÓN (no resuelve por
    // serie+secuencia en la sincronización de pagos): se paga con el código
    // real de la factura (prefijo de serie + secuencia).
    result.codes.invoiceCode = prefix && seq ? `${prefix}-${String(seq).padStart(6, "0")}` : String(invDetail.referenceCode || "");
    if (String(invDetail.referenceCode || "") && String(invDetail.referenceCode) !== result.codes.invoiceCode) {
        result.observations.push(
            `FRICCIÓN/INTERCONEXIÓN: la factura ${result.codes.invoiceId} muestra referenceCode='${invDetail.referenceCode}' (código de cotización), pero la sincronización de pagos resuelve por serie+secuencia ('${result.codes.invoiceCode}'). Un usuario que pague con el número visible no impactaría la factura.`,
        );
    }

    const today = new Date().toISOString().slice(0, 10);
    const payRes = await api("POST", "/api/v1/finance/payments", {
        invoiceNumber: result.codes.invoiceCode,
        client: CLIENT_NAME,
        amount: Number(invDetail.total || 0),
        paidAt: today,
        status: "completado",
        currencyCode: "COP",
        exchangeRate: 1,
        notes: `Pago QA puerta de pago t15 ${SERIE}`,
    });
    result.checks.paymentRegistered = payRes.ok;
    if (!payRes.ok) {
        result.observations.push(`HALLAZGO: registrar el pago falló ${payRes.status}: ${payRes.raw.slice(0, 300)}`);
    } else {
        result.codes.paymentId = Number(payRes.data?.id || 0);
    }

    const invAfterPay = (await api("GET", `/api/v1/finance/invoices/${result.codes.invoiceId}`)).data;
    result.checks.invoiceMarkedPagado = String(invAfterPay?.status || "") === "Pagado";
    if (result.checks.paymentRegistered && !result.checks.invoiceMarkedPagado) {
        result.observations.push(
            `HALLAZGO (interconexión pagos→factura rota): tras el pago la factura quedó status='${invAfterPay?.status}' paidAmount=${invAfterPay?.paidAmount} balance=${invAfterPay?.balanceAmount} (se esperaba 'Pagado').`,
        );
    }

    // ── 8. UI: vincular la factura Pagada a la remisión ──────────────────
    await page.goto(`${baseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2500);
    await nudge(page);
    row = remissionRow(page);
    const linkBtn = row.locator("[data-testid='link-invoice-btn']");
    let uiSelectorWorked = false;
    const linkBtnVisible = await linkBtn.waitFor({ state: "visible", timeout: 8000 }).then(() => true).catch(() => false);
    if (!linkBtnVisible) {
        result.observations.push("HALLAZGO: no aparece el botón 'Vincular factura' en la remisión retenida.");
    } else {
        await linkBtn.click().catch(() => linkBtn.dispatchEvent("click"));
        await page.waitForTimeout(1500);
        const linkerModal = page.locator("[data-testid='invoice-linker-modal']");
        const modalOk = await linkerModal.waitFor({ state: "visible", timeout: 8000 }).then(() => true).catch(() => false);
        if (!modalOk) {
            result.observations.push("HALLAZGO: el modal 'Vincular factura al despacho' no abrió.");
        } else {
            const options = linkerModal.locator("[data-testid='invoice-option']");
            await page.waitForTimeout(1500); // deja terminar la carga de opciones
            const count = await options.count();
            result.checks.invoiceOptionsListedInvoice = count > 0
                && (await options.filter({ hasText: result.codes.invoiceCode }).count()) > 0;
            if (count === 0) {
                const empty = String(await linkerModal.locator("[data-testid='invoice-options-empty']").textContent().catch(() => "")).trim();
                result.observations.push(
                    `HALLAZGO (bug real, interconexión finanzas→logística): la factura Pagada ${result.codes.invoiceCode} del cliente NO aparece en el selector 'Vincular factura' ("${empty}"). `
                    + "Causa: las facturas creadas desde cotización guardan finance_invoices.client_id = 'crm-client-'||id "
                    + "(service_billing_from_quote.go), pero InvoiceOptions compara cc.id = fi.client_id sin el prefijo "
                    + "(service_invoice_link5c.go), así que el selector queda vacío para el flujo real cotización→factura. "
                    + "La única vía de despacho sería el override de admin.",
                );
            } else if (!result.checks.invoiceOptionsListedInvoice) {
                result.observations.push(`HALLAZGO: el selector lista ${count} factura(s) pero ninguna es la Pagada ${result.codes.invoiceCode} de esta corrida.`);
            }
            await shot(page, "03-modal-vincular-factura");
            if (result.checks.invoiceOptionsListedInvoice) {
                const target = options.filter({ hasText: result.codes.invoiceCode }).first();
                await target.locator("input[type='radio']").check();
                await page.waitForTimeout(400);
                await linkerModal.locator("[data-testid='confirm-link-invoice-btn']").click();
                await page.waitForTimeout(2000);
                await nudge(page);
                const linked = await getRemissionByApi(remissionId);
                result.checks.invoiceLinkedUI = Number(linked?.invoiceId || 0) === result.codes.invoiceId;
                uiSelectorWorked = result.checks.invoiceLinkedUI;
                if (!result.checks.invoiceLinkedUI) {
                    result.observations.push(
                        `HALLAZGO: tras vincular en la UI, la remisión tiene invoiceId=${linked?.invoiceId} (se esperaba ${result.codes.invoiceId}).`,
                    );
                }
            } else {
                // El selector no ofrece la factura por el bug de join documentado:
                // se cierra el modal y se usa el MISMO endpoint que llama la UI
                // para destrabar la fase de entrega (la acción bajo prueba es
                // "marcar entregado", no el linker).
                await linkerModal.locator("[data-testid='cancel-invoice-linker-btn']").click().catch(() => {});
                await page.waitForTimeout(600);
            }
        }
    }

    if (!uiSelectorWorked) {
        const linkRes = await api("PUT", `/api/v1/remissions/remissions/${encodeURIComponent(remissionId)}/invoice`, { invoiceId: result.codes.invoiceId });
        const linkedRemApi = linkRes.ok ? linkRes.data : null;
        result.checks.invoiceLinked = Number(linkedRemApi?.invoiceId || 0) === result.codes.invoiceId;
        if (!result.checks.invoiceLinked) {
            result.observations.push(`HALLAZGO: la vinculación por API tampoco funcionó (HTTP ${linkRes.status}: ${linkRes.raw.slice(0, 200)}).`);
        } else {
            result.observations.push("NOTA: la factura se vinculó por API (mismo endpoint que la UI) porque el selector del modal está vacío por el bug documentado.");
        }
    } else {
        result.checks.invoiceLinked = true;
    }

    const linkedRem = await getRemissionByApi(remissionId);
    result.checks.linkIndicatorPaid = String(linkedRem?.invoiceStatus || "") === "Pagado"
        && linkedRem?.paymentHeld === false;
    if (result.checks.linkIndicatorPaid && /^COT-/i.test(String(linkedRem?.invoiceReference || ""))) {
        result.observations.push(
            `FRICCIÓN UX: el indicador verde de la remisión muestra 'Factura ${linkedRem.invoiceReference}: Pagado', pero ese código es la COTIZACIÓN `
            + `(${result.codes.invoiceCode} sería el número real de la factura). Logística no puede saber qué factura física liberó el despacho.`,
        );
    }

    // ── 9. UI: marcar entregado (ahora sí debe pasar) ────────────────────
    await page.goto(`${baseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2500);
    await nudge(page);
    row = remissionRow(page);
    const paidIndicator = row.locator("[data-testid='payment-cleared']");
    const paidIndicatorVisible = await paidIndicator.waitFor({ state: "visible", timeout: 6000 }).then(() => true).catch(() => false);
    if (!paidIndicatorVisible) {
        result.observations.push("OBSERVACIÓN: no se ve el indicador verde 'Factura ...: Pagado' tras vincular.");
    }
    await shot(page, "03-factura-vinculada");

    const markBtn = row.locator("[data-testid='mark-delivered-btn']");
    if (!(await markBtn.isVisible({ timeout: 6000 }).catch(() => false))) {
        result.observations.push("OBSERVACIÓN: el botón 'Marcar entregado' no está visible tras vincular la factura pagada.");
        const badge = await row.locator("[data-testid='delivery-status-badge']").textContent().catch(() => "");
        result.checks.markDeliveredSuccess = /entregado/i.test(badge);
    } else {
        // La tabla puede re-renderizarse en caliente (carga por fetch + nudge);
        // si Playwright no logra estabilidad para el click, se dispara el evento
        // directamente sobre el mismo elemento.
        await markBtn.click({ timeout: 15000 }).catch(() => markBtn.dispatchEvent("click"));
        await page.waitForTimeout(2500);
        await nudge(page);
        const successMsg = String(await page.locator("[data-testid='dispatch-action-message']").textContent().catch(() => "")).trim();
        const badge = String(await row.locator("[data-testid='delivery-status-badge']").textContent().catch(() => "")).trim();
        result.checks.markDeliveredSuccess = /entregad/i.test(successMsg) || /entregado/i.test(badge);
        if (!result.checks.markDeliveredSuccess) {
            const blockReason = String(await page.locator("[data-testid='override-block-reason']").textContent().catch(() => "")).trim();
            result.observations.push(`HALLAZGO: con factura Pagada vinculada el despacho siguió bloqueado: "${blockReason || successMsg}".`);
        }
    }
    await shot(page, "04-entregado");

    // ── 10. API: interconexión finanzas→logística ────────────────────────
    const finalRem = await getRemissionByApi(remissionId);
    result.checks.deliveryStatusEntregado = String(finalRem?.deliveryStatus || "") === "entregado";
    if (!result.checks.deliveryStatusEntregado) {
        result.observations.push(`HALLAZGO: deliveryStatus final='${finalRem?.deliveryStatus}' (se esperaba 'entregado').`);
    }

    const failed = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failed.length > 0) result.observations.push(`Checks no aprobados: ${failed.map(([k]) => k).join(", ")}`);

    await fs.writeFile(path.resolve(artifactsDir, `e2e-lars-t15-results-${RUN}.json`), JSON.stringify(result, null, 2)).catch(() => {});
    console.log("E2E_LARS_T15_PUERTA_PAGO_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
    if (failed.length > 0) process.exitCode = 1;
} catch (error) {
    result.error = String(error?.stack || error);
    await fs.writeFile(path.resolve(artifactsDir, `e2e-lars-t15-results-${RUN}.json`), JSON.stringify(result, null, 2)).catch(() => {});
    try {
        const p = browser?.contexts()?.[0]?.pages()?.[0];
        if (p) await shot(p, "fail");
    } catch {}
    console.error("E2E_LARS_T15_PUERTA_PAGO_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
