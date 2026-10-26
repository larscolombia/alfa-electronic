/**
 * E2E t14 — PAGO CON RETENCIONES (rol: admin).
 *
 * Objetivo: registrar el pago de una factura con retención en la fuente (4%)
 * desde la UI real (/app/finance-pagos), y verificar (vía API) el estado final
 * de la factura (se espera "Pagado" con saldo 0 según el requerimiento).
 *
 * Flujo:
 *   1. Login admin (API).
 *   2. Setup: prospecto + cotización (API) → aceptación por token público →
 *      conversión a factura (API) → factura marcada "Pendiente" con plazo 30 días
 *      (API; el dropdown de pagos excluye Borrador/Cancelado).
 *   3. UI: /app/finance-pagos → Agregar pago → factura, fecha hoy,
 *      monto = total - 4% (retefuente), ReteFuente 4 (%), fecha pago real hoy,
 *      comentarios de retenciones → Guardar.
 *   4. UI: pago visible en el listado + mensaje de éxito.
 *   5. API: GET /finance/invoices/:id → status/balance/paidAmount/receivedPayment
 *      y GET /finance/payments → retenciones persistidas.
 *   6. Extra (aisla el gap de retenciones): segundo pago UI por el 4% restante
 *      y re-verificación API (la sincronización pago→factura sí funciona).
 *
 * Uso:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t14-pago-playwright.mjs
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

const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(baseUrl).origin;
})();

const RUN_ID = Date.now();
const PREFIX = "e2e-lars-t14";
const PROSPECT_NAME = `PW-T14-${RUN_ID}`;
const QUOTE_CODE = `PW-T14-${RUN_ID}`;
const QUOTE_COMPANY = `PW T14 Company ${RUN_ID}`;
const PROSPECT_EMAIL = `pw-t14-${RUN_ID}@alfa.local`;

const QUOTE_LINES = [
    { servicio: "Servicio E2E t14 retenciones", descripcion: "Servicio con IVA para retencion en la fuente", cantidad: 1, unidad: "Unidad", precioUnitario: 1000000, impuesto: 19 },
];

const today = new Date();
const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const due = new Date(today.getTime() + 30 * 86400000);
const dueIso = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;

const result = {
    test: "e2e-lars-t14-pago-con-retenciones",
    baseUrl,
    apiBaseUrl,
    runId: RUN_ID,
    checks: {},
    findings: [],
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    artifacts: { prospectId: "", quoteId: "", invoiceId: 0, invoiceCode: "", invoiceTotal: 0, paymentIds: [], paymentCode: "", secondPaymentId: 0 },
    screenshots: {},
    error: "",
};

let accessToken = "";
const createdPaymentIds = [];

function check(label, ok, detail = "") {
    result.checks[label] = Boolean(ok);
    console.log(`${ok ? "✅" : "❌"} ${label}${detail ? ` | ${detail}` : ""}`);
    return Boolean(ok);
}

function note(text) {
    result.findings.push(text);
    console.log(`⚠️ ${text}`);
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

async function shot(page, name) {
    const file = path.resolve(artifactsDir, `${PREFIX}-${name}-${RUN_ID}.png`);
    await page.screenshot({ path: file, fullPage: true }).catch(() => {});
    result.screenshots[name] = file;
    return file;
}

async function cleanup() {
    if (!accessToken) return;
    const log = [];
    try {
        for (const pid of createdPaymentIds.slice().reverse()) {
            const res = await apiRequest("DELETE", `/api/v1/finance/payments/${pid}`, null);
            log.push(`pago ${pid} → HTTP ${res.status}`);
        }
        if (result.artifacts.invoiceId > 0) {
            const res = await apiRequest("DELETE", `/api/v1/finance/invoices/${result.artifacts.invoiceId}`, null);
            log.push(`factura ${result.artifacts.invoiceId} → HTTP ${res.status}`);
        }
        if (result.artifacts.quoteId) {
            const res = await apiRequest("DELETE", `/api/v1/crm-quotes/quotes/${encodeURIComponent(result.artifacts.quoteId)}`, null);
            log.push(`cotización ${result.artifacts.quoteId} → HTTP ${res.status}`);
        }
        if (result.artifacts.prospectId) {
            const res = await apiRequest("DELETE", `/api/v1/crm/prospects/${encodeURIComponent(result.artifacts.prospectId)}`, null);
            log.push(`prospecto ${result.artifacts.prospectId} → HTTP ${res.status}`);
        }
    } catch (error) {
        log.push(`cleanup error: ${String(error).slice(0, 150)}`);
    }
    result.cleanupLog = log;
    console.log(`\n[LIMPIEZA best-effort] ${log.join(" | ")}`);
}

async function main() {
    await fs.mkdir(artifactsDir, { recursive: true });

    // ── 1. Login admin (API) ───────────────────────────────────────────────
    const loginRes = await apiRequest("POST", "/api/v1/auth/login", { email: userEmail, password: userPassword });
    if (!loginRes.ok) throw new Error(`Login falló HTTP ${loginRes.status}: ${loginRes.rawText.slice(0, 200)}`);
    accessToken = String(loginRes.data.accessToken || loginRes.data.token || "");
    if (!accessToken) throw new Error("Login no devolvió accessToken");
    check("1.login-admin", true);

    // ── 2. Prospecto + cotización (API) ────────────────────────────────────
    const prospectRes = await apiRequest("POST", "/api/v1/crm/prospects", {
        name: PROSPECT_NAME,
        email: PROSPECT_EMAIL,
        company: QUOTE_COMPANY,
        mobile: "3005550144",
    });
    check("2.prospecto-creado", prospectRes.status === 201, `HTTP ${prospectRes.status}`);
    if (!prospectRes.ok) throw new Error(`crear prospecto: ${prospectRes.rawText.slice(0, 200)}`);
    result.artifacts.prospectId = String(prospectRes.data?.id || prospectRes.data?.prospectId || "");

    const quotePayload = {
        codigo: QUOTE_CODE,
        prospecto: PROSPECT_NAME,
        empresa: QUOTE_COMPANY,
        correo: PROSPECT_EMAIL,
        movil: "3005550144",
        estado: "Borrador",
        moneda: "COP",
        descuentoTipo: "COP",
        descuentoValor: 0,
        lineas: QUOTE_LINES,
        nota: `Nota t14 retenciones ${RUN_ID}`,
        terminos: "Pago a 30 días. Vigencia 15 días.",
        taxMode: "",
    };
    let quoteRes = await apiRequest("POST", "/api/v1/crm-quotes/quotes", quotePayload);
    if (!quoteRes.ok) {
        quoteRes = await apiRequest("POST", "/api/v1/crm-quotes/quotes", { ...quotePayload, prospectId: Number(result.artifacts.prospectId) || undefined });
    }
    check("3.cotizacion-creada", quoteRes.ok, `HTTP ${quoteRes.status}`);
    if (!quoteRes.ok) throw new Error(`crear cotización: ${quoteRes.rawText.slice(0, 200)}`);
    const quote = quoteRes.data;
    result.artifacts.quoteId = String(quote?.id || "");
    if (!result.artifacts.quoteId || !quote.token) throw new Error("cotización sin id/token");

    const decisionRes = await apiRequest("PATCH", `/api/v1/crm-quotes/quotes/public/${encodeURIComponent(quote.token)}/decision`, {
        estadoCliente: "Aceptada",
        firmadoPor: "Cliente Prueba t14",
        firmanteCorreo: PROSPECT_EMAIL,
        lugarFirma: "Sede principal",
    });
    check("4.cotizacion-aceptada", decisionRes.status === 200, `HTTP ${decisionRes.status}`);

    // ── 3. Conversión a factura + estado Pendiente con plazo 30 días ───────
    const convertRes = await apiRequest("POST", `/api/v1/finance/invoices/from-quote/${encodeURIComponent(result.artifacts.quoteId)}`, {});
    check("5.factura-desde-cotizacion", convertRes.ok, `HTTP ${convertRes.status} ${convertRes.rawText.slice(0, 150)}`);
    if (!convertRes.ok) throw new Error(`from-quote: ${convertRes.rawText.slice(0, 300)}`);
    const invoice = convertRes.data;
    result.artifacts.invoiceId = Number(invoice.id || 0);
    result.artifacts.invoiceTotal = Number(invoice.total || 0);
    result.artifacts.invoiceCode = `${invoice.seriesPrefix || ""}${String(invoice.sequenceNumber || 0).padStart(6, "0")}`;

    const getRes = await apiRequest("GET", `/api/v1/finance/invoices/${result.artifacts.invoiceId}`, null);
    const fullInvoice = getRes.data;
    const putRes = await apiRequest("PUT", `/api/v1/finance/invoices/${result.artifacts.invoiceId}`, {
        ...fullInvoice,
        status: "Pendiente",
        dueDate: dueIso,
    });
    check("6.factura-pendiente-plazo30", putRes.ok && String(putRes.data?.status || "") === "Pendiente",
        `HTTP ${putRes.status} status=${putRes.data?.status} dueDate=${putRes.data?.dueDate} total=${result.artifacts.invoiceTotal}`);
    if (!putRes.ok) throw new Error(`marcar Pendiente: ${putRes.rawText.slice(0, 300)}`);

    const total = Number(putRes.data?.total ?? result.artifacts.invoiceTotal);
    const retentionPct = 4;
    const payAmount = Math.round(total * (1 - retentionPct / 100));
    result.artifacts.expectedNet = payAmount;
    result.artifacts.expectedRetention = Math.round(total * retentionPct / 100);
    console.log(`[INFO] factura=${result.artifacts.invoiceCode} id=${result.artifacts.invoiceId} total=${total} pagoNeto=${payAmount} retencion4%=${result.artifacts.expectedRetention}`);

    // ── 4. UI: registrar pago con retención ────────────────────────────────
    const browser = await chromium.launch({ headless, slowMo: slowMoMs });
    try {
        const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
        await context.addInitScript(
            ({ authSession, apiBase }) => {
                window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
                window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            },
            { authSession: { ...loginRes.data, expiresAt: Date.now() + Math.max(Number(loginRes.data.expiresIn || 3600), 1) * 1000 }, apiBase: apiBaseUrl },
        );
        const page = await context.newPage();
        page.on("console", (msg) => { if (msg.type() === "error" && result.consoleErrors.length < 20) result.consoleErrors.push(msg.text().slice(0, 300)); });
        page.on("pageerror", (err) => { if (result.pageErrors.length < 20) result.pageErrors.push(String(err?.stack || err?.message || err).slice(0, 400)); });

        await page.goto(`${baseUrl}/app/finance-pagos`, { waitUntil: "networkidle", timeout: timeoutMs });
        const landed = !page.url().includes("/auth/signin");
        check("7.landed-finance-pagos", landed, page.url());
        await shot(page, "01-pagos-loaded");

        // Formulario: Agregar pago
        await page.locator('button:has-text("Agregar pago")').first().click();
        const invoiceSelect = page.locator('select[name="invoiceNumber"]');
        await invoiceSelect.waitFor({ state: "visible", timeout: 30000 });

        // Esperar a que el dropdown traiga la factura del backend (excluye Borrador/Cancelado)
        const invoiceCode = result.artifacts.invoiceCode;
        const seqDigits = String(invoice.sequenceNumber || 0);
        const appeared = await page
            .waitForFunction(
                (needle) => {
                    const sel = document.querySelector('select[name="invoiceNumber"]');
                    if (!sel) return false;
                    return Array.from(sel.options).some((o) => o.value === needle || o.text.includes(needle));
                },
                invoiceCode,
                { timeout: 45000, polling: 300 },
            )
            .then(() => true)
            .catch(() => false);
        if (!appeared) {
            // Fallback: por número de secuencia sin padding
            const bySeq = await page.evaluate((seq) => {
                const sel = document.querySelector('select[name="invoiceNumber"]');
                return sel ? Array.from(sel.options).map((o) => o.value).filter((v) => v.includes(seq)) : [];
            }, seqDigits);
            if (bySeq.length > 0) {
                result.artifacts.invoiceCode = bySeq[0];
                check("8.factura-en-dropdown", true, `fallback por secuencia: ${bySeq[0]}`);
            } else {
                check("8.factura-en-dropdown", false, `factura ${invoiceCode} no aparece en el select`);
                await shot(page, "02-factura-no-en-dropdown");
                throw new Error(`La factura ${invoiceCode} no apareció en el dropdown de pagos`);
            }
        } else {
            check("8.factura-en-dropdown", true, invoiceCode);
        }

        await invoiceSelect.selectOption({ value: result.artifacts.invoiceCode });
        await page.waitForTimeout(400);

        // Fecha "Pagado el" = hoy
        await page.locator('input[name="paidAt"]').fill(todayIso);
        // Monto = total - 4% (neto recibido por el cliente)
        await page.locator('input[name="amount"]').fill(String(payAmount));
        // ReteFuente 4 (%)
        await page.locator('[data-testid="rete-fuente-input"]').fill(String(retentionPct));
        // Fecha pago real = hoy
        await page.locator('[data-testid="payment-date-input"]').fill(todayIso);
        // Comentarios de retenciones
        await page.locator('[data-testid="retention-comments-input"]').fill(
            `Retención en la fuente ${retentionPct}% practicada por el cliente sobre la factura ${result.artifacts.invoiceCode} (retefuente).`,
        );
        await shot(page, "02-formulario-llenado");

        const saveRespPromise = page.waitForResponse(
            (resp) => resp.request().method() === "POST" && /\/api\/v1\/finance\/payments$/.test(resp.url()),
            { timeout: 45000 },
        );
        await page.locator('button[type="submit"]:has-text("Guardar")').click();
        const saveResp = await saveRespPromise.catch(() => null);
        const saveOk = saveResp && saveResp.ok();
        check("9.pago-guardado-backend", Boolean(saveOk), saveResp ? `HTTP ${saveResp.status()}` : "sin respuesta POST /payments");
        if (saveResp && saveResp.ok()) {
            const created = await saveResp.json().catch(() => null);
            if (created?.id) {
                createdPaymentIds.push(Number(created.id));
                result.artifacts.paymentIds.push(Number(created.id));
                result.artifacts.paymentCode = String(created.code || "");
            }
        }
        await page.waitForTimeout(1200);
        const successVisible = await page.locator("div.alert-success").isVisible({ timeout: 8000 }).catch(() => false);
        const successText = await page.locator("div.alert-success").innerText().catch(() => "");
        check("10.mensaje-exito-ui", successVisible, successText.replace(/\s+/g, " ").slice(0, 120));
        await shot(page, "03-pago-guardado");

        // ── 5. UI: pago listado ─────────────────────────────────────────────
        const searchBox = page.locator('input[name="searchTerm"]');
        await searchBox.fill(result.artifacts.paymentCode || result.artifacts.invoiceCode);
        await page.waitForTimeout(800);
        const rowText = await page.locator("table tbody").first().innerText().catch(() => "");
        const listed = rowText.includes(result.artifacts.invoiceCode) || rowText.includes(result.artifacts.paymentCode);
        check("11.pago-listado", listed, `buscado=${result.artifacts.paymentCode || result.artifacts.invoiceCode}`);
        if (!listed) {
            note(`El pago ${result.artifacts.paymentCode} no aparece filtrado en el listado. tbody="${rowText.replace(/\s+/g, " ").slice(0, 200)}"`);
        }
        await shot(page, "04-pago-listado");

        // ── 5b. Medición API del estado REAL tras el pago con retención ────────
        // (antes del segundo pago: aquí se observa el efecto del bug de retenciones,
        // no se reconstruye por aritmética).
        const observedAfterFirst = (await apiRequest("GET", `/api/v1/finance/invoices/${result.artifacts.invoiceId}`, null)).data;
        result.artifacts.observedAfterRetention = {
            status: observedAfterFirst?.status,
            total: observedAfterFirst?.total,
            paidAmount: observedAfterFirst?.paidAmount,
            balanceAmount: observedAfterFirst?.balanceAmount,
            receivedPayment: observedAfterFirst?.receivedPayment,
        };
        console.log(`[INFO] factura tras pago con retención (OBSERVADO): ${JSON.stringify(result.artifacts.observedAfterRetention)}`);

        // ── 6. Extra UI: segundo pago por el 4% restante (aisla gap retención) ──
        const remaining = total - payAmount;
        await page.locator('button:has-text("Agregar pago")').first().click();
        const invoiceSelect2 = page.locator('select[name="invoiceNumber"]');
        await invoiceSelect2.waitFor({ state: "visible", timeout: 30000 });
        await page
            .waitForFunction(
                (needle) => {
                    const sel = document.querySelector('select[name="invoiceNumber"]');
                    return sel && Array.from(sel.options).some((o) => o.value === needle);
                },
                result.artifacts.invoiceCode,
                { timeout: 45000, polling: 300 },
            )
            .catch(() => {});
        await invoiceSelect2.selectOption({ value: result.artifacts.invoiceCode }).catch(() => {});
        await page.waitForTimeout(400);
        await page.locator('input[name="paidAt"]').fill(todayIso);
        await page.locator('input[name="amount"]').fill(String(remaining));
        await page.locator('[data-testid="payment-date-input"]').fill(todayIso);
        await page.locator('[data-testid="retention-comments-input"]').fill("Pago del valor retenido (4%) para cerrar la factura — paso complementario E2E t14.");
        const saveResp2Promise = page.waitForResponse(
            (resp) => resp.request().method() === "POST" && /\/api\/v1\/finance\/payments$/.test(resp.url()),
            { timeout: 45000 },
        );
        await page.locator('button[type="submit"]:has-text("Guardar")').click();
        const saveResp2 = await saveResp2Promise.catch(() => null);
        check("12.segundo-pago-guardado", Boolean(saveResp2 && saveResp2.ok()), saveResp2 ? `HTTP ${saveResp2.status()}` : "sin respuesta");
        if (saveResp2 && saveResp2.ok()) {
            const created2 = await saveResp2.json().catch(() => null);
            if (created2?.id) {
                createdPaymentIds.push(Number(created2.id));
                result.artifacts.secondPaymentId = Number(created2.id);
            }
        }
        await page.waitForTimeout(1000);
        await shot(page, "05-segundo-pago");
    } finally {
        await browser.close().catch(() => {});
    }

    // ── 7. Verificaciones API del estado final de la factura ───────────────
    const invoiceFinal = (await apiRequest("GET", `/api/v1/finance/invoices/${result.artifacts.invoiceId}`, null)).data;
    result.artifacts.invoiceFinal = {
        status: invoiceFinal?.status,
        total: invoiceFinal?.total,
        paidAmount: invoiceFinal?.paidAmount,
        balanceAmount: invoiceFinal?.balanceAmount,
        receivedPayment: invoiceFinal?.receivedPayment,
        locked: invoiceFinal?.locked,
    };
    console.log(`[INFO] factura final: ${JSON.stringify(result.artifacts.invoiceFinal)}`);

    const paymentsRes = await apiRequest("GET", `/api/v1/finance/payments?limit=200`, null);
    const allPayments = Array.isArray(paymentsRes.data?.items) ? paymentsRes.data.items : (Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
    const mine = allPayments.filter((p) => createdPaymentIds.includes(Number(p.id)));
    // El listado no garantiza orden: el pago con retención es el de monto neto (total-4%).
    mine.sort((a, b) => (Number(b.amount) > Number(a.amount) ? 1 : -1));
    result.artifacts.paymentsPersisted = mine.map((p) => ({
        id: p.id, code: p.code, amount: p.amount, status: p.status,
        reteFuente: p.reteFuente, reteIva: p.reteIva, reteIca: p.reteIca,
        retentionComments: p.retentionComments, paymentDate: p.paymentDate, paidAt: p.paidAt,
    }));
    check("13.retenciones-persistidas", mine.length > 0 && mine[0] && Number(mine[0].reteFuente) === retentionPct && String(mine[0].retentionComments || "").includes("retefuente"),
        JSON.stringify(result.artifacts.paymentsPersisted[0] || {}).slice(0, 300));

    // Check 14: se aserten los valores OBSERVADOS por GET /finance/invoices/:id
    // capturados tras el pago con retención y ANTES del segundo pago (paso 5b),
    // no un estado reconstruido por aritmética.
    const observed = result.artifacts.observedAfterRetention || {};
    const statusAfterFirst = String(observed.status || "(sin dato)");
    const balanceAfterFirst = Number(observed.balanceAmount ?? -1);
    result.artifacts.afterRetentionPayment = { status: statusAfterFirst, balance: balanceAfterFirst, source: "GET /finance/invoices (observado, paso 5b)" };
    const reqMetAfterRetention = statusAfterFirst === "Pagado" && balanceAfterFirst <= 0.01;
    check("14.factura-pagada-saldo-cero-tras-retencion", reqMetAfterRetention,
        `esperado Pagado/saldo0 → OBSERVADO vía API tras el pago con retención: status=${statusAfterFirst} saldo=${balanceAfterFirst} paidAmount=${observed.paidAmount} (total=${total}, pagoNeto=${payAmount}, retefuente=${retentionPct}%)`);
    if (!reqMetAfterRetention) {
        note(`GAP RETENCIÓN (medido por GET /finance/invoices/${result.artifacts.invoiceId}): tras registrar un pago de total-4% con retefuente ${retentionPct}%, la API devuelve status="${statusAfterFirst}" y balanceAmount=${balanceAfterFirst} en vez de "Pagado"/0. El backend sincroniza SUM(amount) de pagos contra la factura y NO suma las retenciones (rete_fuente/rete_iva/rete_ica) al valor pagado, aunque la práctica contable colombiana cuenta la retención practicada por el cliente como parte del pago de la factura. Además el campo UI "ReteFuente (%)" persiste el valor tal cual (4) sin convertirlo a pesos ni aplicarlo.`);
    }

    const finalOk = String(invoiceFinal?.status || "") === "Pagado" && Math.abs(Number(invoiceFinal?.balanceAmount ?? -1)) <= 0.01;
    check("15.factura-pagada-saldo-cero-final", finalOk,
        `status=${invoiceFinal?.status} saldo=${invoiceFinal?.balanceAmount} paidAmount=${invoiceFinal?.paidAmount} receivedPayment=${invoiceFinal?.receivedPayment}`);
    if (!finalOk) {
        note(`Tras los dos pagos la factura no quedó Pagada/saldo 0: ${JSON.stringify(result.artifacts.invoiceFinal)}`);
    }
}

let exitCode = 0;
try {
    await main();
    if (Object.values(result.checks).some((v) => v === false)) exitCode = 1;
} catch (error) {
    exitCode = 1;
    result.error = String(error?.stack || error);
    console.error("\n❌ FALLO:", String(error?.message || error));
} finally {
    await cleanup().catch((e) => console.warn("cleanup warn:", String(e)));
}

const resultsPath = path.resolve(artifactsDir, `${PREFIX}-results-${RUN_ID}.json`);
await fs.writeFile(resultsPath, JSON.stringify(result, null, 2)).catch(() => {});

console.log("\n════════ RESULTADO t14 PAGO CON RETENCIONES ════════");
console.log(`Entorno: ${baseUrl} (API ${apiBaseUrl}) | runId=${RUN_ID}`);
for (const [key, value] of Object.entries(result.checks)) console.log(`${value ? "✅" : "❌"} ${key}`);
if (result.findings.length) {
    console.log("\n── Hallazgos ──");
    for (const f of result.findings) console.log(`⚠️ ${f}`);
}
console.log(`\nJSON resultados: ${resultsPath}`);
const fails = Object.entries(result.checks).filter(([, v]) => !v).map(([k]) => k);
console.log(fails.length ? `❌ CHECKS EN ROJO (${fails.length}): ${fails.join(", ")}` : "✅ TODOS LOS CHECKS PASARON");
console.log("──────────────────────────────────────────────────────");

process.exit(exitCode);
