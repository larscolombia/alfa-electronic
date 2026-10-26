/**
 * E2E LARS — T16 TRAZABILIDAD 360 DEL EQUIPO (rol: admin).
 *
 * Construye una cadena completa SOLO de este equipo con sufijo -t16:
 *   prospecto LARS → cliente → equipo CO-* → diagnóstico → cotización COT-* →
 *   OC → repuesto solicitado y recibido → reparación cerrada → remisión
 *   E-CO-* → factura → pago.
 *
 * El SETUP va por API (se tolera acelerar). La VERIFICACIÓN es 100% UI:
 * se abre cada módulo en el navegador real y se comprueba que el eslabón
 * aparece con su código real. El punto álgido es la vista de historial del
 * equipo (/app/work-equipment-history): debe mostrar identidad, recepciones,
 * repuestos solicitados a compras e intervenciones (proyecto + diagnóstico +
 * repuestos usados). Además se verifica si la cotización muestra badge/enlace
 * de "facturada" y si la remisión enlaza la factura.
 *
 * Uso:
 *   xvfb-run -a env PW_BASE_URL=https://alfa.software.net.co PW_HEADLESS=false \
 *     node scripts/e2e-lars-t16-trazabilidad360-playwright.mjs
 */

import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "150000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const apiBaseUrl = process.env.PW_API_BASE_URL || new URL(baseUrl).origin;

const TS = Date.now();
const SUF = `-t16-${TS}`;
const PROSPECT_NAME = `LARS T16 ${TS}`;
const PROSPECT_EMAIL = `lars${SUF}@alfa.local`;
const CLIENT_COMPANY = `LARS Industrial T16 ${TS}`;
const CLIENT_NIT = `900${String(TS).slice(-6)}1`;
const EQUIPO_ID = `CO-T16-${TS}`;
const EQUIPO_SERIE = `SER-LARS-T16-${TS}`;
const PART_REF = `IGBT-LARS${SUF}`;
const QUOTE_CODE = `COT-LARS-T16-${TS}`;
const OC_CODE = `OC-LARS-1042-t16-${TS}`;
const PROJECT_ID = `proj-lars${SUF}`;
const SHORT_CODE = `PRJ-T16-${TS}`;
const RECORD_ID = `rec-lars${SUF}`;
const ITEM_ID = `item-lars${SUF}`;
const RESERVATION_ID = `res-lars${SUF}`;
const DIAG_MEMO = `Diagnóstico T16: falla en módulo de potencia IGBT identificada en banco de pruebas.`;
const REPAIR_MEMO = `Reparación T16: reemplazo de IGBT y prueba funcional de 4 horas en banco.`;

/** Eslabones de la cadena 360: step → { ok, detalle, evidencia }. */
const chain = {};
const findings = [];
const codes = {};
let accessToken = "";

function chainStep(step, ok, detalle = "", evidencia = "") {
    chain[step] = { ok: Boolean(ok), detalle, evidencia };
    console.log(`${ok ? "✅" : "❌"} [CADENA] ${step}${detalle ? ` — ${detalle}` : ""}`);
}

function find(step, text) {
    findings.push(`[${step}] ${text}`);
    console.log(`⚠️ [HALLAZGO] ${step}: ${text}`);
}

async function api(method, urlPath, body) {
    const res = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": companyId,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text().catch(() => "");
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = null; }
    return { status: res.status, ok: res.ok, data, text };
}

async function apiOk(stepLabel, method, urlPath, body, expected = [200, 201]) {
    const r = await api(method, urlPath, body);
    if (!expected.includes(r.status)) {
        throw new Error(`${stepLabel}: HTTP ${r.status} (esperado ${expected}) — ${String(r.text).slice(0, 300)}`);
    }
    return r.data;
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function nowLocalInput() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ─── FASE 1: SETUP DE LA CADENA POR API ─────────────────────────────────────
async function setupChain() {
    const login = await api("POST", "/api/v1/auth/login", { email: userEmail, password: userPassword });
    if (!login.ok) throw new Error(`login admin falló HTTP ${login.status}: ${login.text.slice(0, 200)}`);
    accessToken = String(login.data.accessToken || "");
    chainStep("0.login-admin", true, "admin autenticado por API");

    // 1. Prospecto LARS único
    const prospect = await apiOk("crear prospecto", "POST", "/api/v1/crm/prospects", {
        name: PROSPECT_NAME,
        email: PROSPECT_EMAIL,
        company: CLIENT_COMPANY,
        mobile: "3005550100",
    }, [200, 201]);
    codes.prospecto = String(prospect.id || prospect.prospectId || PROSPECT_NAME);
    chainStep("1.prospecto", true, `${PROSPECT_NAME} (id ${codes.prospecto})`);

    // 2. Equipo CO-* (registro de recepción con un ítem)
    const d = new Date();
    const record = await apiOk("crear equipo", "POST", "/api/v1/crm-equipment/records", {
        id: RECORD_ID,
        prospectId: String(codes.prospecto),
        prospectName: PROSPECT_NAME,
        receptionDay: String(d.getDate()),
        receptionMonth: String(d.getMonth() + 1),
        receptionYear: String(d.getFullYear()),
        intakeMethod: "transportadora",
        intakeCarrier: `Transportadora LARS T16`,
        intakeTrackingNumber: `GUIA-REC${SUF}`,
        intakeReceivedAt: new Date().toISOString(),
        companyName: CLIENT_COMPANY,
        contactName: `Contacto LARS T16`,
        email: PROSPECT_EMAIL,
        items: [{
            id: ITEM_ID,
            registrationMode: "manual",
            isIndustrial: true,
            serviceTypeName: "Reparación",
            familyName: "PLC",
            marca: "LARS",
            tipo: "Controlador",
            serie: EQUIPO_SERIE,
            receivedIdentifier: EQUIPO_ID,
            receivedIdentifierType: "placa",
            failureDescription: "No enciende - módulo de potencia quemado",
            repairStatus: "recibido",
            storageLocationName: "Bodega principal",
            diagnosisMemo: DIAG_MEMO,
            repairMemo: "",
        }],
    });
    codes.equipo = EQUIPO_ID;
    chainStep("2.equipo", true, `${EQUIPO_ID} / serie ${EQUIPO_SERIE} (record ${record.id || RECORD_ID})`);

    // 3. Cotización COT-*
    const quotePayload = {
        codigo: QUOTE_CODE,
        prospecto: PROSPECT_NAME,
        empresa: CLIENT_COMPANY,
        correo: PROSPECT_EMAIL,
        movil: "3005550100",
        estado: "Borrador",
        moneda: "COP",
        descuentoTipo: "COP",
        descuentoValor: 0,
        lineas: [
            { servicio: "Reparación módulo de potencia", descripcion: "Cambio de IGBT y pruebas", cantidad: 1, unidad: "Unidad", precioUnitario: 2500000, impuesto: 19 },
            { servicio: "Mano de obra técnica", descripcion: "Horas de banco de pruebas", cantidad: 4, unidad: "Hora", precioUnitario: 180000, impuesto: 19 },
        ],
        nota: `Cotización trazabilidad 360 ${SUF}`,
        terminos: "Pago contra entrega. Vigencia 30 días.",
    };
    let quote = (await apiOk("crear cotización", "POST", "/api/v1/crm-quotes/quotes", quotePayload, [200, 201]));
    codes.cotizacion = String(quote.codigo || QUOTE_CODE);
    chainStep("3.cotizacion", true, `${codes.cotizacion} creada en Borrador`);

    // 4. Aceptación pública → estado Aprobado + cliente maestro arrastrado
    await apiOk("aceptar cotización", "PATCH", `/api/v1/crm-quotes/quotes/public/${encodeURIComponent(quote.token)}/decision`, {
        estadoCliente: "Aceptada",
        firmadoPor: `Cliente LARS T16`,
        firmanteCorreo: PROSPECT_EMAIL,
        lugarFirma: "Sede principal",
    });
    quote = await apiOk("leer cotización", "GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(quote.id)}`);
    if (String(quote.estado) !== "Aprobado") throw new Error(`cotización no quedó Aprobada: estado=${quote.estado}`);
    const clients = await apiOk("listar clientes", "GET", "/api/v1/crm/clients?limit=300");
    const clientItems = Array.isArray(clients) ? clients : clients.items || [];
    const client = clientItems.find((c) => String(c.empresa || "").trim() === CLIENT_COMPANY);
    chainStep("4.cliente", Boolean(client), client ? `cliente maestro creado desde cotización (id ${client.id})` : `empresa ${CLIENT_COMPANY} NO apareció en /crm/clients`);
    if (!client) find("cliente", "La cotización aceptada NO arrastró la creación del cliente maestro (ensureClientFromAcceptedQuote).");
    codes.cliente = client ? String(client.id) : "";

    // 5. OC sobre la cotización (el backend exige número + fecha + archivo)
    const ocFileDataUrl = `data:text/plain;base64,${Buffer.from(`Orden de compra ${OC_CODE} - cliente LARS T16`, "utf8").toString("base64")}`;
    await apiOk("registrar OC", "PUT", `/api/v1/crm-quotes/quotes/${encodeURIComponent(quote.id)}`, {
        ...quote,
        estado: "Aprobado",
        purchaseOrderNumber: OC_CODE,
        purchaseOrderDate: today(),
        purchaseOrderFileName: `${OC_CODE}.txt`,
        purchaseOrderFileDataUrl: ocFileDataUrl,
        purchaseOrderUploadedAt: new Date().toISOString(),
    });
    const quoteWithOc = await apiOk("releer cotización con OC", "GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(quote.id)}`);
    codes.oc = String(quoteWithOc.purchaseOrderNumber || "");
    chainStep("5.oc", codes.oc === OC_CODE, `OC registrada en la cotización: ${codes.oc}`);

    // 6. Proyecto vinculado al equipo, con diagnóstico
    const baseProps = {
        title: `Reparación ${EQUIPO_ID} — LARS T16`,
        description: `Caso de trazabilidad 360 ${SUF}`,
        icon: "bi-tools",
        boardId: "board-main",
        createdBy: userEmail,
        shortCode: SHORT_CODE,
        stageName: "Diagnostico",
        equipmentRecordId: RECORD_ID,
        equipmentItemId: ITEM_ID,
        equipmentProspectId: codes.prospecto,
        equipmentProspectName: PROSPECT_NAME,
        equipmentDisplayName: `PLC LARS · ${EQUIPO_SERIE}`,
        equipmentIdentifier: EQUIPO_ID,
        equipmentSerie: EQUIPO_SERIE,
        equipmentServiceType: "Reparación",
        equipmentFailureDescription: "No enciende - módulo de potencia quemado",
        diagnosticNotes: DIAG_MEMO,
        repairNotes: "",
        estimatedHours: 4,
        actualHours: 0,
        partsBudgetUsd: 150,
        testType: "sin-pruebas",
        diagnosisInspection: { faultIdentified: true },
        dispatchHistory: [],
    };
    await apiOk("crear proyecto", "POST", "/api/v1/projects", { id: PROJECT_ID, status: "diagnostico", properties: baseProps }, [200, 201]);
    codes.proyecto = PROJECT_ID;
    chainStep("6.diagnostico", true, `proyecto ${SHORT_CODE} en diagnóstico con memo`);

    // 7. Repuesto: referencia en inventario → solicitud (línea de compra) → aprobación → recibo con stock
    //    (ReceivePurchaseLine sólo suma stock si la referencia YA existe en inventory_references)
    await apiOk("crear referencia inventario", "POST", "/api/v1/inventory/references", {
        reference: PART_REF,
        internalCode: PART_REF,
        designation: `IGBT módulo de potencia LARS T16`,
        brand: "LARS",
        unitMeasure: "Unidad",
        preferredSupplierName: "Mouser LARS",
        minStock: 0,
        targetStock: 4,
    }, [200, 201]);
    const pl = await apiOk("solicitar repuesto", "POST", "/api/v1/inventory/purchase-lines", {
        reference: PART_REF,
        description: `Repuesto IGBT para equipo ${EQUIPO_ID}`,
        supplier: "Mouser LARS",
        quantity: 2,
        unitPrice: 120000,
        requestReason: `Solicitud de repuesto para el equipo ${EQUIPO_ID}`,
        projectId: PROJECT_ID,
        equipmentTag: EQUIPO_ID,
    }, [200, 201]);
    const purchaseLine = pl.item || pl;
    await apiOk("aprobar línea de compra", "POST", `/api/v1/inventory/purchase-lines/${encodeURIComponent(purchaseLine.id)}/approve`, {});
    await apiOk("recibir repuesto", "POST", `/api/v1/inventory/purchase-lines/${encodeURIComponent(purchaseLine.id)}/receive`, { quantity: 2 });
    codes.repuesto = PART_REF;
    chainStep("7.repuesto", true, `${PART_REF} solicitado, aprobado y recibido (stock +2)`);

    // 8. Cerrar diagnóstico → por-cotizar; luego flujo completo hasta entregado
    await apiOk("cerrar diagnóstico", "POST", `/api/v1/projects/${encodeURIComponent(PROJECT_ID)}/diagnosis/close`, {});
    const propsPorCotizar = { ...baseProps, stageName: "Por cotizar", diagnosisClosedAt: new Date().toISOString() };
    const flow = [
        ["pedir-repuestos", { ...propsPorCotizar, stageName: "Pedir componentes" }],
        ["esperando-proveedor", { ...propsPorCotizar, stageName: "Esperando proveedor" }],
        ["reparacion", { ...propsPorCotizar, stageName: "Reparacion", repairNotes: REPAIR_MEMO, actualHours: 3, testType: "banco-pruebas", materialReservationIds: [RESERVATION_ID] }],
        ["listo-entrega", { ...propsPorCotizar, stageName: "Listo para entrega", repairNotes: REPAIR_MEMO, actualHours: 3, testType: "banco-pruebas", materialReservationIds: [RESERVATION_ID] }],
        ["entregado", { ...propsPorCotizar, stageName: "Entregado", repairNotes: REPAIR_MEMO, actualHours: 3, testType: "banco-pruebas", materialReservationIds: [RESERVATION_ID], dispatchHistory: [{ createdAt: new Date().toISOString(), remissionClient: CLIENT_COMPANY }] }],
    ];
    for (const [status, props] of flow) {
        await apiOk(`mover proyecto a ${status}`, "PUT", `/api/v1/projects/${encodeURIComponent(PROJECT_ID)}`, { id: PROJECT_ID, status, properties: props });
    }
    chainStep("8.reparacion-cerrada", true, "proyecto en 'entregado' con memo de reparación y prueba de cierre");

    // 9. Reserva de material vinculada al equipo/orden (alimenta "repuestos usados")
    await apiOk("reservar repuesto", "POST", "/api/v1/inventory/reservations", {
        id: RESERVATION_ID,
        reference: PART_REF,
        quantity: 1,
        assignedTo: "Tecnico LARS T16",
        purpose: `Reparación equipo ${EQUIPO_ID}`,
        workOrder: SHORT_CODE,
        equipmentTag: EQUIPO_ID,
        commitmentDate: today(),
    }, [200, 201]);

    // 10. Equipo con estado final de reparación
    const fullRecord = await apiOk("leer equipo", "GET", `/api/v1/crm-equipment/records/${encodeURIComponent(RECORD_ID)}`);
    fullRecord.items = (fullRecord.items || []).map((it) => (it.id === ITEM_ID
        ? { ...it, repairStatus: "entregado", repairStatusUpdatedAt: new Date().toISOString(), repairMemo: REPAIR_MEMO }
        : it));
    await apiOk("actualizar estado equipo", "PUT", `/api/v1/crm-equipment/records/${encodeURIComponent(RECORD_ID)}`, fullRecord);

    // 11. Factura desde la cotización
    const invoice = await apiOk("convertir a factura", "POST", `/api/v1/finance/invoices/from-quote/${encodeURIComponent(quote.id)}`, {});
    codes.factura = String(invoice.referenceCode || `${invoice.seriesPrefix || ""}${String(invoice.sequenceNumber || "").padStart(3, "0")}`);
    codes.facturaNumero = `${invoice.seriesPrefix || ""}${String(invoice.sequenceNumber || "").padStart(3, "0")}`;
    codes.facturaId = Number(invoice.id);
    chainStep("9.factura", true, `factura ${codes.facturaNumero} (ref ${codes.factura}, desde cotización ${codes.cotizacion}, sourceQuoteId=${invoice.sourceQuoteId || ""})`);

    // 12. Pago registrado contra la factura
    const pay = await api("POST", "/api/v1/finance/payments", {
        invoiceNumber: codes.factura,
        client: CLIENT_COMPANY,
        amount: Number(invoice.total),
        paidAt: today(),
        status: "Completado",
        currencyCode: "COP",
        exchangeRate: 1,
        notes: `Pago trazabilidad 360 ${SUF}`,
    });
    if (pay.ok) {
        codes.pago = String(pay.data.id || "");
        chainStep("10.pago", true, `pago #${codes.pago} por ${invoice.total} registrado contra factura ${codes.factura}`);
    } else {
        chainStep("10.pago", false, `HTTP ${pay.status}: ${pay.text.slice(0, 200)}`);
    }

    // 13. Marcar factura como Pagada (libera la puerta de pago del despacho)
    const inv = await apiOk("leer factura", "GET", `/api/v1/finance/invoices/${codes.facturaId}`);
    const invPaid = await api("PUT", `/api/v1/finance/invoices/${codes.facturaId}`, {
        ...inv,
        status: "Pagado",
        paidAmount: Number(inv.total),
        balanceAmount: 0,
        receivedPayment: true,
    });
    if (!invPaid.ok) find("pago", `No se pudo marcar la factura como Pagada por API (HTTP ${invPaid.status}): ${invPaid.text.slice(0, 160)}. Se intenta el despacho con la puerta de pago activa.`);

    // 14. Remisión E-CO-* con OC del cliente y factura vinculada
    const remission = await apiOk("crear remisión", "POST", "/api/v1/remissions/remissions", {
        clientName: CLIENT_COMPANY,
        clientNit: CLIENT_NIT,
        contactName: `Ing. LARS T16`,
        dispatchType: "contra-entrega",
        carrierName: "Servientrega",
        guideNumber: `GUIA-DES${SUF}`,
        items: [{
            equipmentId: ITEM_ID,
            identifier: EQUIPO_ID,
            description: `PLC LARS ${EQUIPO_ID} reparado`,
            quantity: 1,
            unitPrice: 2500000,
            warrantyMonths: 3,
        }],
        valued: true,
        notes: `Despacho trazabilidad 360 ${SUF}`,
        purchaseOrder: OC_CODE,
        invoiceId: codes.facturaId,
    }, [200, 201]);
    codes.remision = String(remission.consecutive || "");
    const remOk = Boolean(remission.invoiceId) || codes.remision.length > 0;
    chainStep("11.remision", remOk, `remisión ${codes.remision} (OC ${codes.oc}, factura vinculada id=${remission.invoiceId || "NO"})`);
    if (!remission.invoiceId) find("remision", `La remisión ${codes.remision} quedó SIN factura vinculada pese a enviar invoiceId.`);

    // Cruce API: el pago ¿llegó a la factura?
    const invAfter = await apiOk("releer factura post-pago", "GET", `/api/v1/finance/invoices/${codes.facturaId}`);
    if (Number(invAfter.paidAmount || 0) <= 0) {
        find("pago→factura", `El pago #${codes.pago} quedó en finance_payments pero la factura sigue con paidAmount=${invAfter.paidAmount}. finance_payments no está vinculada a finance_invoices (hallazgo ya conocido F2).`);
    }
    return login.data;
}

// ─── FASE 2: VERIFICACIÓN 100% UI ───────────────────────────────────────────
async function verifyUi(sessionData) {
    const browser = await chromium.launch({ headless });
    try {
        const context = await browser.newContext({ viewport: { width: 1560, height: 980 } });
        await context.addInitScript(
            ({ authSession, apiBase, identifier }) => {
                window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
                window.localStorage.setItem("pika.apiBaseUrl", apiBase);
                window.sessionStorage.setItem(
                    "work.equipment.history.context.v1",
                    JSON.stringify({ reference: "", identifier, projectId: "", origin: "e2e-lars-t16" }),
                );
            },
            {
                authSession: { ...sessionData, expiresAt: Date.now() + 3600 * 1000 },
                apiBase: apiBaseUrl,
                identifier: EQUIPO_ID,
            },
        );
        const page = await context.newPage();
        const consoleErrors = [];
        page.on("console", (m) => { if (m.type() === "error" && consoleErrors.length < 10) consoleErrors.push(m.text().slice(0, 200)); });
        const shot = (n) => page.screenshot({ path: path.resolve(artifactsDir, `e2e-lars-t16-${n}.png`), fullPage: true });
        const bodyText = async () => (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");

        const gotoApp = async (route) => {
            await page.goto(`${baseUrl}/app/${route}`, { waitUntil: "networkidle", timeout: timeoutMs });
            if (page.url().includes("/auth/signin")) throw new Error(`Sesión no autenticada en /app/${route} (redirigió a signin)`);
        };

        // ── V1: Work Teams — el equipo existe como CO-* ──
        await gotoApp("work-teams");
        await page.waitForSelector("[data-testid='work-equipment-create']", { timeout: timeoutMs });
        try {
            // La tabla es DataTables v2 paginada (10/reg): se filtra con su buscador
            // nativo. DataTables 2.x usa .dt-search (v1 usaba .dataTables_filter);
            // el input[type=search] del navbar es otro elemento.
            const dtSearch = page.locator(".dt-search input, .dataTables_filter input").first();
            await dtSearch.waitFor({ state: "visible", timeout: timeoutMs });
            await dtSearch.fill(EQUIPO_SERIE);
            await page.waitForTimeout(1500);
            // El enlace del historial en Work Teams muestra "familia · marca · tipo · serie"
            // (buildProspectEquipmentLabel), NO el identificador CO-*: se busca por serie.
            const equipoCard = page.locator(".equipment-preview", { hasText: EQUIPO_SERIE }).first();
            let equipoVisible = await equipoCard.isVisible({ timeout: 15000 }).catch(() => false);
            let equipoDetalle = `equipo ${EQUIPO_SERIE} visible en Work Teams`;
            if (!equipoVisible) {
                // Respaldo: la fila de la recepción con la empresa del cliente.
                const equipoRow = page.locator("tr", { hasText: CLIENT_COMPANY }).first();
                equipoVisible = await equipoRow.isVisible({ timeout: 8000 }).catch(() => false);
                equipoDetalle = equipoVisible
                    ? `recepción de ${CLIENT_COMPANY} listada (enlace con ${EQUIPO_SERIE} no encontrado — el label no incluye el identificador)`
                    : `ni la serie ${EQUIPO_SERIE} ni la empresa ${CLIENT_COMPANY} aparecen en Work Teams (filtro "${EQUIPO_SERIE}")`;
            }
            chainStep("V1.equipo-en-work-teams", equipoVisible, equipoDetalle);
        } catch (e) {
            chainStep("V1.equipo-en-work-teams", false, `EXCEPCIÓN: ${String(e?.message || e).slice(0, 200)}`);
        }
        await shot("01-equipo-work-teams");

        // ── V2: Historial 360 del equipo ──
        await page.evaluate((identifier) => {
            window.sessionStorage.setItem(
                "work.equipment.history.context.v1",
                JSON.stringify({ reference: "", identifier, projectId: "", origin: "e2e-lars-t16" }),
            );
        }, EQUIPO_ID);
        await gotoApp("work-equipment-history");
        await page.waitForSelector("text=Historial técnico por equipo", { timeout: timeoutMs });
        await page.waitForSelector("text=Intervenciones registradas", { timeout: timeoutMs });
        const historyText = await bodyText();
        // 'Repuestos usados' se verifica DENTRO de la tarjeta de la intervención
        // (fuera, PART_REF también aparece en 'Repuestos solicitados a compras' y
        // produciría un falso positivo).
        const interventionCard = page.locator(".intervention-card", { hasText: SHORT_CODE }).first();
        const intervOk = await interventionCard.isVisible({ timeout: 10000 }).catch(() => false);
        const intervText = intervOk ? (await interventionCard.innerText().catch(() => "")).replace(/\s+/g, " ") : "";
        const sinRepuestos = /Sin repuestos registrados/.test(intervText);
        const checks = {
            identidad: historyText.includes(EQUIPO_ID),
            serie: historyText.includes(EQUIPO_SERIE),
            recepciones: /recepci[oó]n\(es\)/i.test(historyText) && !historyText.includes("0 recepción(es)"),
            repuestosCompra: historyText.includes(PART_REF),
            intervencion: historyText.includes(SHORT_CODE) || historyText.includes(`Reparación ${EQUIPO_ID}`),
            diagnostico: historyText.includes("falla en módulo de potencia"),
            stageFinal: /Entregado/i.test(historyText),
            repuestoUsado: intervOk && intervText.includes(PART_REF),
        };
        chainStep("V2.historial-identidad", checks.identidad && checks.serie, `identidad ${EQUIPO_ID} / ${EQUIPO_SERIE}`);
        chainStep("V2.historial-recepciones", checks.recepciones, "recepciones vinculadas en el historial");
        chainStep("V2.historial-repuestos-compra", checks.repuestosCompra, `repuesto ${PART_REF} en 'Repuestos solicitados a compras'`);
        chainStep("V2.historial-intervencion", checks.intervencion, `proyecto ${SHORT_CODE} como intervención`);
        chainStep("V2.historial-diagnostico", checks.diagnostico, "memo diagnóstico visible");
        chainStep("V2.historial-stage-entregado", checks.stageFinal, "etapa final 'Entregado' visible");
        chainStep("V2.historial-repuesto-usado", checks.repuestoUsado, checks.repuestoUsado
            ? `repuesto usado ${PART_REF} en la tabla de material de la intervención`
            : sinRepuestos
                ? "la tabla de material de la intervención dice 'Sin repuestos registrados' aunque la reserva existe"
                : "tarjeta de intervención no encontrada o sin material");
        if (!checks.repuestoUsado) find("historial-repuestos-usados", "La tabla 'Repuestos usados' de la intervención muestra 'Sin repuestos registrados' pese a existir la reserva vinculada (materialReservationIds + workOrder + equipmentTag). Causa en código: work-equipment-history.component.ts:954 construye el historial con emptyInventoryState() y nunca consulta reservations/movements del API de inventario, con lo que buildMaterialUsage() siempre devuelve [] — la sección de material usado está muerta (siempre vacía).");
        await shot("02-historial-360");

        // ── V3: Cotizaciones — COT + OC + estado (+ badge facturada) ──
        await gotoApp("crm-cotizaciones");
        await page.waitForSelector("text=Cotizacion", { timeout: timeoutMs }).catch(() => {});
        await page.waitForTimeout(1500);
        const quoteRow = page.locator("tr", { hasText: QUOTE_CODE }).first();
        const quoteVisible = await quoteRow.isVisible({ timeout: 20000 }).catch(() => false);
        let quoteRowText = quoteVisible ? (await quoteRow.innerText().catch(() => "")).replace(/\s+/g, " ") : "";
        if (!quoteVisible) {
            // La tabla puede paginar: buscar en todo el cuerpo.
            const t = await bodyText();
            quoteRowText = t.includes(QUOTE_CODE) ? t : "";
        }
        chainStep("V3.cotizacion-visible", Boolean(quoteRowText), `cotización ${QUOTE_CODE} listada en CRM`);
        chainStep("V3.cotizacion-oc", quoteRowText.includes(OC_CODE), `badge OC ${OC_CODE} en la fila de la cotización`);
        chainStep("V3.cotizacion-aprobada", /Aprobado/.test(quoteRowText), "estado Aprobado visible");
        // Vínculo real cotización→factura: un badge/enlace "facturada" o el número
        // de factura (FAC-*) en la fila. OJO: referenceCode == OC del cliente, así
        // que NO vale como evidencia de vínculo (aparece igual en filas no facturadas).
        const facturadaBadge = /facturada/i.test(quoteRowText) || quoteRowText.includes(codes.facturaNumero);
        chainStep("V3.cotizacion-badge-facturada", facturadaBadge, facturadaBadge ? `badge/enlace 'facturada' o n° ${codes.facturaNumero} visible` : `sin badge 'facturada' ni n° de factura ${codes.facturaNumero} en la fila (solo OC ${codes.oc} y botón 'Convertir en factura')`);
        if (!facturadaBadge) find("cotización→factura", `Tras convertir ${QUOTE_CODE} en factura ${codes.facturaNumero}, la fila de la cotización NO muestra badge ni enlace de 'facturada' — solo el badge de la OC y el botón 'Convertir en factura' (que ya respondería 409). La trazabilidad cotización→factura no es visible para el usuario.`);
        await shot("03-cotizacion-oc");

        // ── V4: Remisiones — E-CO-* con factura enlazada ──
        await gotoApp("remissions");
        await page.waitForSelector("text=Consecutivo", { timeout: timeoutMs }).catch(() => {});
        await page.waitForTimeout(1500);
        const remRow = page.locator("tr", { hasText: codes.remision }).first();
        const remVisible = await remRow.isVisible({ timeout: 20000 }).catch(() => false);
        const remText = remVisible ? (await remRow.innerText().catch(() => "")).replace(/\s+/g, " ") : await bodyText();
        chainStep("V4.remision-visible", remText.includes(codes.remision), `remisión ${codes.remision} listada`);
        chainStep("V4.remision-cliente", remText.includes(CLIENT_COMPANY), `cliente ${CLIENT_COMPANY} en la remisión`);
        const linkOk = remText.includes(codes.factura) && /Pagado/.test(remText) && !/Retenida por pago/.test(remText);
        chainStep("V4.remision-enlaza-factura", linkOk, linkOk ? `indicador 'Factura ${codes.factura}: Pagado' visible` : `no se vio el enlace Factura ${codes.factura}: Pagado`);
        if (!linkOk) find("remisión→factura", `La remisión ${codes.remision} no muestra el indicador de factura pagada/enlazada en la UI.`);
        await shot("04-remision-factura");

        // ── V5: Facturación — factura con cliente y estado Pagado ──
        await gotoApp("finance-facturacion");
        await page.waitForTimeout(2500);
        const billText = await bodyText();
        chainStep("V5.factura-visible", billText.includes(codes.facturaNumero) || billText.includes(codes.factura), `factura ${codes.facturaNumero} listada en Facturación`);
        chainStep("V5.factura-cliente", billText.includes(CLIENT_COMPANY), `cliente ${CLIENT_COMPANY} en la factura`);
        chainStep("V5.factura-pagada", new RegExp(`Pagad`, "i").test(billText), "estado 'Pagado' visible en facturación");
        await shot("05-factura");

        // ── V6: Pagos — el pago contra la factura ──
        await gotoApp("finance-pagos");
        await page.waitForSelector("h5:has-text('Pagos')", { timeout: timeoutMs });
        await page.waitForSelector("table", { timeout: timeoutMs });
        // Filtrar por cliente para no depender del orden ni de la paginación.
        const paySearch = page.locator("input[name='searchTerm']").first();
        await paySearch.fill(CLIENT_COMPANY);
        await page.waitForTimeout(1500);
        const payText = await bodyText();
        const pagoOk = payText.includes(CLIENT_COMPANY) || payText.includes(codes.factura);
        chainStep("V6.pago-visible", pagoOk, pagoOk ? `pago de ${CLIENT_COMPANY} / factura ${codes.factura} listado en Pagos` : `ni ${CLIENT_COMPANY} ni ${codes.factura} aparecen en Pagos`);
        if (!pagoOk) find("pago", `El pago #${codes.pago} registrado contra la factura ${codes.factura} no aparece en /app/finance-pagos.`);
        await shot("06-pago");

        // ── V7: CRM — prospecto y cliente maestro ──
        await gotoApp("crm-prospectos");
        await page.waitForSelector("h5:has-text('Prospectos')", { timeout: timeoutMs });
        await page.waitForSelector("table", { timeout: timeoutMs });
        await page.waitForTimeout(2000);
        const prospectText = await bodyText();
        const prospectoEnLista = prospectText.includes(PROSPECT_NAME);
        if (prospectoEnLista) {
            chainStep("V7.prospecto-visible", true, `prospecto ${PROSPECT_NAME} listado`);
        } else {
            // Comportamiento conocido: visibleProspectRows oculta prospectos con cliente
            // maestro coincidente (convertidos). Se verifica la ficha directa del prospecto.
            await page.goto(`${baseUrl}/app/crm-prospectos/${encodeURIComponent(codes.prospecto)}`, { waitUntil: "networkidle", timeout: timeoutMs });
            await page.waitForTimeout(2500);
            const detailText = await bodyText();
            const detailOk = detailText.includes(PROSPECT_NAME) && !detailText.includes("No encontramos el prospecto solicitado");
            chainStep("V7.prospecto-visible", detailOk, detailOk
                ? `prospecto ${PROSPECT_NAME} accesible por ficha directa (pero OCULTO en el listado: quedó convertido a cliente)`
                : `prospecto ${PROSPECT_NAME} ni en listado ni en ficha directa`);
            if (detailOk) find("prospecto", `Tras la conversión a cliente, el prospecto ${PROSPECT_NAME} DESAPARECE del listado /app/crm-prospectos sin indicio ni filtro de "convertidos" — solo es alcanzable por URL directa. Fracción de trazabilidad visible prospecto→cliente.`);
            await shot("07-prospecto-detail");
        }
        await shot("07-prospecto");
        await gotoApp("crm-clientes");
        await page.waitForTimeout(2500);
        const clientText = await bodyText();
        chainStep("V7.cliente-visible", clientText.includes(CLIENT_COMPANY), `cliente maestro ${CLIENT_COMPANY} listado`);
        await shot("08-cliente");

        return consoleErrors;
    } finally {
        await browser.close();
    }
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
const summary = { baseUrl, apiBaseUrl, sufijo: SUF, codes, chain, findings, consoleErrors: [], error: "" };
try {
    const sessionData = await setupChain();
    summary.consoleErrors = await verifyUi(sessionData);
} catch (error) {
    summary.error = String(error?.stack || error);
    console.error("❌ ERROR:", summary.error);
}

console.log("\n════════ TABLA TRAZABILIDAD 360 — LARS T16 ════════");
console.log("Eslabón                                        | OK   | Detalle");
console.log("───────────────────────────────────────────────┼──────┼────────");
for (const [step, { ok, detalle }] of Object.entries(chain)) {
    console.log(`${step.padEnd(46).slice(0, 46)} | ${ok ? "OK " : "FAIL"} | ${detalle}`.slice(0, 220));
}
const fails = Object.entries(chain).filter(([, v]) => !v.ok);
console.log(`\n${fails.length === 0 ? "✅ CADENA 360 COMPLETA" : `❌ ${fails.length} ESLABÓN(ES) EN ROJO: ${fails.map(([k]) => k).join(", ")}`}`);
if (findings.length) {
    console.log("\n── Hallazgos ──");
    findings.forEach((f) => console.log(`⚠️ ${f}`));
}
console.log("═══════════════════════════════════════════════════");

const fs = await import("node:fs/promises");
await fs.mkdir(artifactsDir, { recursive: true });
await fs.writeFile(path.resolve(artifactsDir, "e2e-lars-t16-results.json"), JSON.stringify(summary, null, 2), "utf8");
console.log(`\nResultados: ${path.resolve(artifactsDir, "e2e-lars-t16-results.json")}`);
process.exit(fails.length > 0 || summary.error ? 1 : 0);
