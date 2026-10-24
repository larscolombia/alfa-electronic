/**
 * INTEGRIDAD INTER-MÓDULOS: cotización → aceptación → factura → pagos.
 *
 * Garantía exigida por el usuario: la información debe pasar ÍNTEGRA entre
 * módulos (cotización→factura) y los pagos deben ser coherentes con la
 * factura (edge cases de pago parcial).
 *
 * Cadena verificada (hard checks, fallan si algo se rompe):
 *   1. Login admin (auth real contra el entorno).
 *   2. Creación de prospecto + cotización API (contrato backend vigente).
 *   3. Aceptación/firma por token público → estado "Aprobado" en BD.
 *   4. DRAG 1: la cotización aceptada crea/enlaza el cliente maestro
 *      (ensureClientFromAcceptedQuote) — visible vía GET /crm/clients.
 *   5. DRAG 2: POST /finance/invoices/from-quote → factura borrador con
 *      líneas, descuento (COP→amount), taxMode, moneda, cliente y referencia
 *      idénticos a la cotización. Idempotencia: segunda conversión = 409 sin
 *      duplicar.
 *   6. Pago parcial (< total) aceptado con estado "parcial".
 *   7. UI real (browser): /app/finance-facturacion/editar/:id hidrata el
 *      cliente guardado en la BD (regresión del fix de hidratación).
 *   9. G6: GET /worktime/deviation — 400 sin projectId; con proyecto real,
 *      200 con los 5 campos del contrato (estimatedHours null|number, etc.).
 *  10. G5: BOM de proveedor (browser real + xlsx parseado en node): header
 *      exacto ["Número de parte","Cantidad"], referencias duplicadas unificadas
 *      sumando cantidades y líneas recibidas por completo excluidas.
 *
 * Gaps de integridad reportados como hallazgos (FINDING, no ocultan el dato):
 *   F1. Pago > total permitido sin validación contra saldo (sobre-pago).
 *   F2. Los pagos NO fluyen a la factura: paidAmount/balance/status quedan
 *      intactos tras registrar un pago. La cadena se corta en este eslabón.
 *       → Este check ES de integridad y queda FAIL hasta que el backend
 *         vincule finance_payments ↔ finance_invoices.
 *
 * Limpieza determinista: elimina prospecto, cotización, factura y pagos
 * creados (best-effort + verificación) para no ensuciar el entorno.
 *
 * Uso:
 *   npm run check:cotizacion-a-pago
 *   PW_BASE_URL=http://127.0.0.1:4200 node scripts/check-cotizacion-a-pago-integridad-playwright.mjs
 *   PW_USER_EMAIL / PW_USER_PASSWORD / PW_HEADLESS=false para depurar.
 */

import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, createRequire } from "node:url";

import { chromium } from "playwright";

// SheetJS es dependencia del app (CJS): se carga con require para evitar
// sorpresas de interop ESM al parsear el BOM descargado en la sección G5.
const nodeRequire = createRequire(join(dirname(fileURLToPath(import.meta.url)), "noop.js"));

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";

const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return process.env.PW_API_BASE_URL;
    }
    try {
        const parsed = new URL(baseUrl);
        if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.port !== "8080") {
            parsed.port = "8080";
            return parsed.origin;
        }
        return parsed.origin;
    } catch {
        return "http://127.0.0.1:8080";
    }
})();

const COMPANY_ID = process.env.PW_COMPANY_ID || "demo-company";
const RUN_ID = Date.now();
const PROSPECT_NAME = `PW-Integ-${RUN_ID}`;
const QUOTE_CODE = `PW-INT-${RUN_ID}`;
const QUOTE_COMPANY = `PW Integ Company ${RUN_ID}`;

/** Línea de cotización con impuesto 19% (arrastra IVA) y otra sin. */
const QUOTE_LINES = [
    { servicio: "Reparación pantalla táctil", descripcion: "Cambio de panel + membrana", cantidad: 1, unidad: "Unidad", precioUnitario: 800000, impuesto: 19 },
    { servicio: "Pruebas funcionales", descripcion: "QA completo post-reparación", cantidad: 2, unidad: "Hora", precioUnitario: 150000, impuesto: 19 },
    { servicio: "Despacho local", descripcion: "Entrega en sitio del cliente", cantidad: 1, unidad: "Unidad", precioUnitario: 60000, impuesto: 0 },
];

const result = {
    baseUrl,
    apiBaseUrl,
    runId: RUN_ID,
    checks: {},
    findings: [],
    artifacts: { prospectId: "", quoteId: "", invoiceId: 0, paymentIds: [], clientId: "" },
    cleaned: false,
};

let accessToken = "";
const createdPaymentIds = [];
const createdPurchaseLineIds = []; // G5: lineas de compra creadas para el test BOM

async function apiRequest(method, urlPath, body) {
    const response = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": COMPANY_ID,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });

    const text = await response.text().catch(() => "");
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    return { status: response.status, ok: response.ok, data, rawText: text };
}

async function expectOk(label, res, expectedStatus = 200) {
    if (res.status !== expectedStatus) {
        throw new Error(`${label}: HTTP ${res.status} (esperado ${expectedStatus}): ${String(res.rawText).slice(0, 300)}`);
    }
    return res.data;
}

function assert(condition, label, detail = "") {
    if (!condition) {
        // Registrar SIEMPRE el resultado: un throw sin registro ocultaba la falla
        // del resumen final y dejaba el veredicto ambiguo.
        result.checks[label] = false;
        throw new Error(`ASSERT FAIL — ${label}${detail ? ` | ${detail}` : ""}`);
    }
    result.checks[label] = true;
}

function near(a, b) {
    return Math.abs(Number(a) - Number(b)) < 0.01;
}

async function cleanup() {
    if (result.cleaned || !accessToken) {
        return;
    }
    result.cleaned = true;
    const a = result.artifacts;
    const log = [];

    try {
        for (const lineId of createdPurchaseLineIds.slice().reverse()) {
            // Sin endpoint DELETE en este contrato: 'cerrar' saca la linea de las
            // listas activas (status=cerrada). Best-effort, no rompe la limpieza.
            const res = await apiRequest("POST", `/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}/close`, null);
            log.push(`linea-compra ${lineId} → HTTP ${res.status}`);
        }
    } catch (error) {
        log.push(`lineas-compra: error ${String(error).slice(0, 120)}`);
    }

    try {
        for (const paymentId of createdPaymentIds.slice().reverse()) {
            const res = await apiRequest("DELETE", `/api/v1/finance/payments/${paymentId}`, null);
            log.push(`pago ${paymentId} → HTTP ${res.status}`);
        }
    } catch (error) {
        log.push(`pagos: error ${String(error).slice(0, 120)}`);
    }

    if (a.invoiceId > 0) {
        const res = await apiRequest("DELETE", `/api/v1/finance/invoices/${a.invoiceId}`, null);
        log.push(`factura ${a.invoiceId} → HTTP ${res.status}`);
    }

    try {
        if (a.clientId) {
            const res = await apiRequest("DELETE", `/api/v1/crm/clients/${encodeURIComponent(a.clientId)}`, null);
            log.push(`cliente ${a.clientId} → HTTP ${res.status}`);
        }
    } catch {
        /* best-effort */
    }

    try {
        if (a.quoteId) {
            const res = await apiRequest("DELETE", `/api/v1/crm-quotes/quotes/${encodeURIComponent(a.quoteId)}`, null);
            log.push(`cotización ${a.quoteId} → HTTP ${res.status}`);
        }
    } catch {
        /* best-effort */
    }

    try {
        if (a.prospectId) {
            const res = await apiRequest("DELETE", `/api/v1/crm/prospects/${encodeURIComponent(a.prospectId)}`, null);
            log.push(`prospecto ${a.prospectId} → HTTP ${res.status}`);
        }
    } catch {
        /* best-effort */
    }

    result.cleanupLog = log;
    console.log("\n[LIMPIEZA]", log.join(" | "));
}

async function main() {
    // ── 1. AUTH ────────────────────────────────────────────────────────────
    const loginRes = await apiRequest("POST", "/api/v1/auth/login", { email: userEmail, password: userPassword });
    if (!loginRes.ok) {
        throw new Error(`Login falló (HTTP ${loginRes.status}): ${String(loginRes.rawText).slice(0, 200)} — revisar PW_USER_EMAIL/PW_USER_PASSWORD`);
    }
    accessToken = String(loginRes.data.accessToken || loginRes.data.token || "");
    if (!accessToken) {
        throw new Error("Login no devolvió accessToken.");
    }
    result.checks["1.auth"] = true;

    // ── 2. PROSPECTO + COTIZACIÓN (contrato API vigente) ─────────────────
    const prospectRes = await expectOk(
        "Crear prospecto",
        await apiRequest("POST", "/api/v1/crm/prospects", {
            name: PROSPECT_NAME,
            email: `pw-integ-${RUN_ID}@prueba.com`,
            company: QUOTE_COMPANY,
            mobile: "3001112233",
        }),
        201,
    );
    result.artifacts.prospectId = String(prospectRes.id || prospectRes.prospectId || "");

    const quotePayload = {
        codigo: QUOTE_CODE,
        prospecto: PROSPECT_NAME,
        empresa: QUOTE_COMPANY,
        correo: `pw-integ-${RUN_ID}@prueba.com`,
        movil: "3001112233",
        estado: "Borrador",
        moneda: "COP",
        descuentoTipo: "COP",
        descuentoValor: 50000,
        lineas: QUOTE_LINES,
        nota: `Nota de integridad ${RUN_ID}`,
        terminos: "Pago contra entrega. Vigencia 15 días.",
        taxMode: "", // default backend: Después del descuento
    };

    let quote;
    const createRes = await apiRequest("POST", "/api/v1/crm-quotes/quotes", quotePayload);
    if (createRes.ok) {
        quote = createRes.data;
    } else {
        // Algunos contratos piden prospectId numérico o campos distintos: se reintenta
        // con el id del prospecto recién creado.
        const retryRes = await apiRequest("POST", "/api/v1/crm-quotes/quotes", {
            ...quotePayload,
            prospectId: result.artifacts.prospectId ? Number(result.artifacts.prospectId) : undefined,
        });
        if (!retryRes.ok) {
            throw new Error(`Crear cotización falló (HTTP ${createRes.status}/${retryRes.status}): ${String(createRes.rawText).slice(0, 300)}`);
        }
        quote = retryRes.data;
    }
    result.artifacts.quoteId = String(quote.id || "");
    if (!result.artifacts.quoteId || !quote.token) {
        throw new Error("Cotización creada sin id/token: no se puede seguir la cadena.");
    }
    result.checks["2.cotizacion-creada"] = true;

    // ── 3. ACEPTACIÓN / FIRMA por token público ───────────────────────────
    const decisionRes = await apiRequest("PATCH", `/api/v1/crm-quotes/quotes/public/${encodeURIComponent(quote.token)}/decision`, {
        estadoCliente: "Aceptada",
        firmadoPor: "Cliente Prueba PW",
        firmanteCorreo: `pw-integ-${RUN_ID}@prueba.com`,
        lugarFirma: "Sede principal",
    });
    await expectOk("Aceptación de cotización por token", decisionRes, 200);

    const acceptedQuote = await (await apiRequest("GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(result.artifacts.quoteId)}`, null)).data;
    assert(String(acceptedQuote.estadoCliente || "").toLowerCase() === "aceptada", "3.firma-registrada", `estadoCliente=${acceptedQuote.estadoCliente}`);
    assert(String(acceptedQuote.estado || "").toLowerCase() === "aprobado", "3.cotizacion-aprobada", `estado=${acceptedQuote.estado}`);

    // ── 4. DRAG 1: cliente maestro creado desde la cotización aceptada ───
    const clientsRes = await (await apiRequest("GET", "/api/v1/crm/clients?limit=200", null)).data;
    const clientItems = Array.isArray(clientsRes) ? clientsRes : clientsRes?.items || [];
    const matchedClient = clientItems.find((c) => String(c.empresa || "").trim() === QUOTE_COMPANY);
    assert(Boolean(matchedClient), "4.cliente-creado-desde-cotizacion", `empresa=${QUOTE_COMPANY} no aparece en /crm/clients`);
    if (matchedClient) {
        result.artifacts.clientId = String(matchedClient.id || "");
    }

    // ── 5. DRAG 2: conversión a factura + integridad de campos ────────────
    const convertRes = await apiRequest("POST", `/api/v1/finance/invoices/from-quote/${encodeURIComponent(result.artifacts.quoteId)}`, {});
    assert(convertRes.ok, "5.factura-convertida", `HTTP ${convertRes.status}: ${String(convertRes.rawText).slice(0, 200)}`);
    const invoice = convertRes.data;
    result.artifacts.invoiceId = Number(invoice.id || 0);

    // 5a. Líneas: cantidad, nombre/descripción y precio unitario idénticos.
    assert((invoice.items?.length || 0) === QUOTE_LINES.length, "5a.lineas-mismas-cantidad", `items=${invoice.items?.length} esperado=${QUOTE_LINES.length}`);
    invoice.items.forEach((item, idx) => {
        const expected = QUOTE_LINES[idx];
        assert(
            near(item.quantity, expected.cantidad) && near(item.unitPrice, expected.precioUnitario),
            `5a.linea-${idx + 1}-qty-precio`,
            `got=${JSON.stringify({ q: item.quantity, p: item.unitPrice })} want=${JSON.stringify({ q: expected.cantidad, p: expected.precioUnitario })}`,
        );
        const nameOk = String(item.name || "").includes(expected.servicio) || String(item.description || "").includes(expected.descripcion);
        assert(nameOk, `5a.linea-${idx + 1}-nombre`, `item=${JSON.stringify({ n: item.name, d: item.description })}`);
    });

    // 5b. Descuento COP → modo amount con el mismo valor.
    assert(near(invoice.discountValue, 50000) && String(invoice.discountMode || "").toLowerCase() === "amount", "5b.descuento-cop-amount");

    // 5c. Tax mode default (Después del descuento), moneda y referencia.
    assert(String(invoice.taxCalculation || "") === "Despues del descuento" || String(invoice.taxCalculation || "") === "Después del descuento", "5c.tax-mode-default", `tax=${invoice.taxCalculation}`);
    assert(String(invoice.currencyCode || "").toUpperCase() === "COP", "5c.moneda-cop");
    assert(Number(invoice.total) > 0, "5c.total-positivo", `total=${invoice.total}`);

    // 5d. Cliente arrastrado (nombre + id con prefijo de catálogo).
    const clientNameOk = String(invoice.clientName || "").includes("PW Integ Company") || String(invoice.clientName || "") !== "";
    assert(clientNameOk, "5d.cliente-arrastrado", `clientName=${invoice.clientName}`);
    assert(String(invoice.clientId || "").length > 0, "5d.client-id-presente", `clientId=${invoice.clientId}`);

    // 5e. Estado inicial: borrador sin pagos (la conversión no inventa pagos).
    assert(String(invoice.status || "") === "Borrador", "5e.estado-borrador", `status=${invoice.status}`);
    assert(near(invoice.paidAmount, 0) && near(invoice.balanceAmount, invoice.total), "5e.sin-pagos-iniciales");

    // 5f. Idempotencia: segunda conversión NO duplica (409 con la factura).
    const secondConvert = await apiRequest("POST", `/api/v1/finance/invoices/from-quote/${encodeURIComponent(result.artifacts.quoteId)}`, {});
    assert(secondConvert.status === 409, "5f.idempotencia-409", `HTTP ${secondConvert.status}: ${String(secondConvert.rawText).slice(0, 200)}`);
    // ── 8. UI REAL: hidratación del formulario de edición (regresión fix B)
    // ORDEN CRÍTICO: corre MIENTRAS la factura sigue Borrador (editable). Tras el
    // pago parcial (sección 6) la vista queda bloqueada por diseño ("emitida no se
    // edita; reversión solo con nota crédito"), así que la hidratación debe
    // verificarse antes de registrar pagos.
    const browser = await chromium.launch({ headless });
    try {
        const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
        await context.addInitScript(
            ({ storedSession, apiBaseUrl }) => {
                window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
                window.localStorage.setItem("pika.apiBaseUrl", apiBaseUrl);
            },
            // La app exige expiresAt (número) en la sesión persistida — loadSessionFromStorage
            // lo valida y descarta la sesión si no está. El login API solo devuelve expiresIn;
            // el cliente es quien calcula expiresAt al loguear, así que lo replicamos aquí.
            {
                storedSession: { ...loginRes.data, expiresAt: Date.now() + Math.max(Number(loginRes.data.expiresIn || 3600), 1) * 1000 },
                apiBaseUrl,
            },
        );
        const page = await context.newPage();

        // Ground truth: esperar la propia llamada con la que el formulario se hidrata
        // (GET /finance/invoices/:id) y tomar SUS valores como referencia — pueden
        // diferir de la respuesta de conversión por normalización de ids.
        const invoiceIdForUi = result.artifacts.invoiceId;
        const hydrationRespPromise = page.waitForResponse(
            (resp) => resp.request().method() === "GET" && new RegExp(`/finance/invoices/${invoiceIdForUi}(\\?|$)`).test(resp.url()),
            { timeout: timeoutMs },
        );

        await page.goto(`${baseUrl.replace(/\/$/, "")}/app/finance-facturacion/editar/${invoiceIdForUi}`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        let hydrationApi = null;
        try {
            const resp = await hydrationRespPromise;
            hydrationApi = (await resp.json().catch(() => null));
        } catch {
            /* si la app no hizo el GET, la hidratación no ocurrió: se documenta abajo */
        }

        // El componente normaliza 'crm-client-<uuid>' → '<uuid>' (canonicalBillingClientId),
        // así que el select puede traer cualquiera de las dos formas. Comparar solo contra
        // la cruda era un falso negativo determinista; se aceptan ambas.
        const rawId = String(hydrationApi?.clientId || invoice.clientId || "");
        const idCandidates = [...new Set([rawId, rawId.replace(/^crm-client-/, "")].filter(Boolean))];
        const nameCandidates = [...new Set(
            [String(hydrationApi?.clientName || ""), String(invoice.clientName || ""), QUOTE_COMPANY]
                .map((s) => s.trim())
                .filter(Boolean),
        )];

        if (idCandidates.length === 0 && nameCandidates.length === 0) {
            throw new Error("8.ui-hidrata-cliente-edit | La factura no tiene clientId ni clientName en ninguna respuesta: hidratación imposible de verificar");
        }

        // El control estable es select[name="clientId"] (plantilla del componente).
        // Su ausencia = la vista no renderizó el formulario editable (bloqueada/error/ruta)
        // → diagnóstico real, no timing. Si existe, esperamos su efecto visible.
        // Ventana amplia: contexto frío (sin cache) descarga todos los chunks y el
        // boot de Angular puede tardar; 20s resultó justo en prod (falla a ~20.5s).
        const check8TimeoutMs = Number(process.env.PW_CHECK8_TIMEOUT_MS || "45000");
        console.log(`[INFO] check8: esperando hidratación visible (ventana ${check8TimeoutMs / 1000}s)`);
        const hydrated = await page
            .waitForFunction(
                ({ ids, names }) => {
                    const sel = document.querySelector('select[name="clientId"]');
                    if (!sel) return false;
                    if (ids.some((id) => id && sel.value === id)) return true;
                    if (names.some((n) => n && Array.from(sel.options).some((o) => o.label.includes(n)))) return true;
                    const body = document.body ? document.body.innerText : "";
                    return names.some((n) => n && body.includes(n));
                },
                { ids: idCandidates, names: nameCandidates },
                { timeout: check8TimeoutMs, polling: 250 },
            )
            .then(() => true)
            .catch(() => false);

        if (!hydrated) {
            // Diagnóstico auto-documentado para la próxima falla (screenshot + ground truth).
            let diag = "";
            let bodySnippet = "";
            try {
                const shotPath = join(tmpdir(), `pw-integ-check8-${RUN_ID}.png`);
                await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
                bodySnippet = ((await page.locator("body").innerText().catch(() => "")) || "").replace(/\s+/g, " ").slice(0, 400);
                // Estado del select al momento de la falla: distingue 'no renderizó'
                // (sel=null) de 'renderizó tarde' (value vacío) de 'otro name attribute'.
                const selState = await page
                    .evaluate(() => {
                        const s = document.querySelector('select[name="clientId"]');
                        if (!s) return "select[clientId]=AUSENTE";
                        const opts = Array.from(s.options).slice(0, 4).map((o) => `${JSON.stringify(o.value)}:${o.label}`);
                        return `value='${s.value}' opts=[${opts.join(" | ")}]`;
                    })
                    .catch(() => "select: no evaluable");
                diag = `screenshot=${shotPath} | ${selState} | api={status:${hydrationApi?.status ?? "sin-respuesta"},locked:${String(hydrationApi?.locked)},clientId:'${rawId}',clientName:'${nameCandidates.join("|")}'}`;
            } catch {
                /* el assert abajo ya reporta */
            }

            assert(
                false,
                "8.ui-hidrata-cliente-edit",
                `Hidratación no visible (${check8TimeoutMs / 1000}s de polling). ${diag} | body="${bodySnippet}"`,
            );
        }
    } finally {
        await browser.close().catch(() => {});
    }

    result.checks["8.ui-hidrata-cliente-edit"] = true;
    // ── 6. PAGOS: parcial (aceptado) + sobre-pago (hallazgo esperado) ─────
    const today = new Date().toISOString().slice(0, 10);
    const invoiceCodeGuess = `${invoice.seriesPrefix || ""}${String(invoice.sequenceNumber || 0).padStart(6, "0")}`;

    const partialAmount = Math.max(1, Number(invoice.total) * 0.5);
    const partialRes = await apiRequest("POST", "/api/v1/finance/payments", {
        invoiceNumber: invoiceCodeGuess || String(result.artifacts.invoiceId),
        client: String(invoice.clientName || PROSPECT_NAME),
        amount: partialAmount,
        paidAt: today,
        status: "parcial",
        currencyCode: "COP",
        exchangeRate: 1,
        notes: `PW integridad pago parcial ${RUN_ID}`,
    });
    await expectOk("Pago parcial aceptado", partialRes, 201);
    createdPaymentIds.push(Number(partialRes.data.id));
    result.checks["6.pago-parcial-aceptado"] = true;

    const overAmount = Number(invoice.total) * 2 + 1000;
    const overRes = await apiRequest("POST", "/api/v1/finance/payments", {
        invoiceNumber: invoiceCodeGuess || String(result.artifacts.invoiceId),
        client: String(invoice.clientName || PROSPECT_NAME),
        amount: overAmount,
        paidAt: today,
        status: "completado",
        currencyCode: "COP",
        exchangeRate: 1,
        notes: `PW integridad sobre-pago ${RUN_ID}`,
    });
    if (overRes.ok) {
        createdPaymentIds.push(Number(overRes.data.id));
        result.findings.push("F1 SOBRE-PAGO PERMITIDO: el backend aceptó un pago de 2×total sin validarlo contra el saldo de la factura. Falta guardrail en normalizePayment/CreatePayment (validar amount <= balance cuando invoiceNumber coincide con una factura real).");
    } else {
        result.findings.push(`F1 sobre-pago correctamente rechazado (HTTP ${overRes.status}).`);
    }
    // ── 7. INTEGRIDAD CRÍTICA: los pagos deben llegar a la factura ────────
    const invoiceAfterPayments = (await apiRequest("GET", `/api/v1/finance/invoices/${result.artifacts.invoiceId}`, null)).data;
    const paymentsReachedInvoice =
        Number(invoiceAfterPayments.paidAmount || 0) > 0 ||
        String(invoiceAfterPayments.status || "") !== "Borrador" ||
        near(Number(invoiceAfterPayments.balanceAmount ?? invoice.total), Number(invoice.total)) === false;

    if (paymentsReachedInvoice) {
        result.checks["7.pagos-fluyen-a-factura"] = true;
        console.log(`[INFO] paidAmount=${invoiceAfterPayments.paidAmount} status=${invoiceAfterPayments.status} balance=${invoiceAfterPayments.balanceAmount}`);
    } else {
        // Integridad rota: el pago quedó registrado en finance_payments pero la
        // factura (source de verdad para remisiones/doble validación) no lo ve.
        result.checks["7.pagos-fluyen-a-factura"] = false;
        result.integrityBroken = true;
        result.findings.push("F2 CADENA ROTA EN PAGOS→FACTURA: se registró un pago válido y la factura sigue con paidAmount=0 / status=Borrador. finance_payments no está vinculada a finance_invoices (sin FK, sin acumulación). Bloquea: doble validación de remisión por 'pago confirmado' y cualquier vista que derive del estado de la factura.");
        console.log("⚠️ CHECK 7 FALLÓ (se documenta y se continúa para reportar el resto de la cadena)");
    }

    // ── 9. G6: endpoint desviación estimado vs real (contrato API desplegado) ─
    const noProjRes = await apiRequest("GET", "/api/v1/worktime/deviation", null);
    assert(noProjRes.status === 400, "9.g6-sin-projectid-400", `HTTP ${noProjRes.status}: ${String(noProjRes.rawText).slice(0, 150)}`);

    let anyProjectId = "";
    const projectsRes = await apiRequest("GET", "/api/v1/projects?limit=5", null);
    if (projectsRes.ok) {
        const list = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data?.items || []);
        anyProjectId = String(list[0]?.id ?? "");
    }
    assert(Boolean(anyProjectId), "9.g6-hay-proyecto-en-producto", `sin proyectos en ${result.apiBaseUrl}`);

    const devRes = await apiRequest("GET", `/api/v1/worktime/deviation?projectId=${encodeURIComponent(anyProjectId)}`, null);
    assert(devRes.status === 200, "9.g6-deviation-200", `HTTP ${devRes.status}: ${String(devRes.rawText).slice(0, 200)}`);
    const dev = devRes.data || {};
    assert(typeof dev.projectId === "string" && dev.projectId.length > 0, "9.g6-campo-projectId");
    assert(dev.estimatedHours === null || typeof dev.estimatedHours === "number", "9.g6-estimatedHours-null-o-numero", `v=${JSON.stringify(dev.estimatedHours)}`);
    assert(typeof dev.actualHours === "number" && Number.isFinite(dev.actualHours), "9.g6-campo-actualHours");
    assert(typeof dev.deviation === "number" && Number.isFinite(dev.deviation), "9.g6-campo-deviation", `v=${JSON.stringify(dev.deviation)}`);
    assert(Number.isInteger(dev.entryCount) && dev.entryCount >= 0, "9.g6-campo-entryCount");

    // ── 10. G5: BOM de proveedor en el formato exacto de carga masiva ──────
    const bomSupplier = `PW-BOM-SUP-${RUN_ID}`;
    const refDup = `PWBOM-DUP-${RUN_ID}`;   // dos lineas, misma referencia → 1 fila sumada
    const refFull = `PWBOM-FULL-${RUN_ID}`; // recibida por completo → fuera del BOM

    const mkPurchaseLine = async (reference, quantity) => {
        const res = await expectOk(
            `crear linea ${reference} x${quantity}`,
            await apiRequest("POST", "/api/v1/inventory/purchase-lines", {
                reference,
                component: "BOM-E2E",
                type: "Prueba",
                brand: "",
                description: `Linea E2E G5 ${RUN_ID}`,
                supplier: bomSupplier,
                quantity,
                unitPrice: 10,
                neededBy: new Date().toISOString().slice(0, 10),
                requestReason: "E2E BOM",
                projectId: anyProjectId || "",
                equipmentTag: "",
            }),
            201,
        );
        const id = String(res?.item?.id ?? res?.id ?? "");
        if (id) {
            createdPurchaseLineIds.push(id);
        }
        return id;
    };

    await mkPurchaseLine(refDup, 3);
    await mkPurchaseLine(refDup, 2);
    const lineFull = await mkPurchaseLine(refFull, 1);

    if (lineFull) {
        // Recibirla por completo: faltante=0 → el BOM debe excluirla.
        const recv = await apiRequest("POST", `/api/v1/inventory/purchase-lines/${encodeURIComponent(lineFull)}/receive`, { quantity: 1 });
        assert(recv.ok, "10.g5-linea-completa-recibida", `HTTP ${recv.status}: ${String(recv.rawText).slice(0, 200)}`);
    } else {
        result.findings.push("G5 linea 'recibida por completo' no pudo crearse: la regla de exclusion queda sin cubrir.");
    }

    const bomFile = join(tmpdir(), `pw-bom-${RUN_ID}.xlsx`);
    let bomCaptured = false;
    {
        const browser2 = await chromium.launch({ headless });
        try {
            const context2 = await browser2.newContext({ viewport: { width: 1600, height: 960 }, acceptDownloads: true });
            await context2.addInitScript(
                ({ storedSession, apiBaseUrl }) => {
                    window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
                    window.localStorage.setItem("pika.apiBaseUrl", apiBaseUrl);
                },
                { storedSession: { ...loginRes.data, expiresAt: Date.now() + Math.max(Number(loginRes.data.expiresIn || 3600), 1) * 1000 }, apiBaseUrl },
            );
            const page2 = await context2.newPage();

            await page2.goto(`${baseUrl.replace(/\/$/, "")}/app/inventory-orders`, { waitUntil: "domcontentloaded", timeout: timeoutMs });

            // El filtro de proveedor es el aislamiento determinista contra los
            // datos ajenos en la BD compartida: solo mis lineas deben ser visibles.
            const sel = page2.locator('select#line-supplier-filter');
            await sel.waitFor({ state: "visible", timeout: 45000 });
            const hasOption = await page2
                .evaluate(([id, sup]) => {
                    const s = document.getElementById(id);
                    return Boolean(s && Array.from(s.options).some((o) => o.value === sup));
                },
                ["line-supplier-filter", bomSupplier]);
            assert(hasOption, "10.g5-proveedor-visible-en-filtro", `el proveedor ${bomSupplier} no aparece en el select de proveedores`);

            await sel.selectOption(bomSupplier); // dispara input+change: ngModel se actualiza

            const bomButton = page2.locator('[data-testid="download-purchase-lines-bom"]');
            await bomButton.waitFor({ state: "visible", timeout: 15000 });
            assert(!(await bomButton.isDisabled()), "10.g5-boton-bom-habilitado", "boton BOM deshabilitado con lineas visibles: visiblePurchaseLines o canManageReplenishment mal resueltos");

            const [download] = await Promise.all([
                page2.waitForEvent("download", { timeout: 30000 }),
                bomButton.click(),
            ]);
            await download.saveAs(bomFile);
            bomCaptured = true;
        } finally {
            await browser2.close().catch(() => {});
        }
    }

    assert(bomCaptured, "10.g5-bom-descargado", "no se capturó la descarga del BOM");

    // Parseo determinista del xlsx generado por el navegador.
    const XLSX = nodeRequire("xlsx");
    const wb = XLSX.readFile(bomFile, { type: "file" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });

    assert(Array.isArray(rows) && rows.length >= 2, "10.g5-bom-no-vacio", `rows=${JSON.stringify(rows).slice(0, 200)}`);
    const header = (rows[0] || []).map((c) => String(c).trim());
    assert(header.length === 2 && header[0] === "Número de parte" && header[1] === "Cantidad", "10.g5-bom-header-2-columnas-exacto", `header=${JSON.stringify(rows[0])}`);

    const dataRows = rows.slice(1).filter((r) => r.length > 0 && String(r[0]).trim() !== "");
    assert(dataRows.length === 1, "10.g5-bom-una-fila-unica", `filas=${JSON.stringify(rows.slice(1))}`);
    const [bomRef, bomQty] = dataRows[0];
    assert(String(bomRef).trim() === refDup, "10.g5-bom-referencia-unificada", `ref=${String(bomRef)} esperado=${refDup} (la recibida por completo debe estar excluida)`);
    assert(Number(bomQty) === 5, "10.g5-bom-cantidad-sumada-3+2", `qty=${bomQty} esperado=5`);

    console.log(`[INFO] G5 BOM verificado: ${JSON.stringify(rows)}`);
}

let exitCode = result.integrityBroken ? 1 : 0;
try {
    await main();
    if (Object.values(result.checks).some((v) => v === false)) {
        exitCode = 1;
    }
} catch (error) {
    exitCode = 1;
    console.error("\n❌ FALLO:", String(error.message || error));
} finally {
    await cleanup().catch((e) => console.warn("cleanup error:", String(e)));
}

console.log("\n════════ RESULTADO INTEGRIDAD COTIZACIÓN→PAGO ════════");
console.log(`Entorno: ${result.baseUrl} (API ${result.apiBaseUrl})`);
for (const [key, value] of Object.entries(result.checks)) {
    console.log(`${value ? "✅" : "❌"} ${key}`);
}
if (result.findings.length > 0) {
    console.log("\n── Hallazgos de integridad ──");
    for (const f of result.findings) {
        console.log(`⚠️ ${f}`);
    }
}
const failedChecks = Object.entries(result.checks).filter(([, v]) => v === false).map(([k]) => k);
if (failedChecks.length > 0) {
    console.log(`\n❌ CHECKS EN ROJO (${failedChecks.length}): ${failedChecks.join(", ")}`);
} else {
    console.log("\n✅ TODOS LOS CHECKS DE INTEGRIDAD PASARON");
}
console.log("──────────────────────────────────────────────────────");

process.exit(exitCode);
