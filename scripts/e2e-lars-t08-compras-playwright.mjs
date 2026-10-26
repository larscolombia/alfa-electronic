/**
 * Playwright E2E — LARS T08: COMPRAS — APROBAR, ENVIAR Y RECIBIR (rol: admin)
 *
 * Flujo validado 100% por UI en /app/inventory-orders:
 *  1. Login admin (API) + creacion idempotente de usuario tecnico t08.
 *  2. Setup por API: referencia de inventario unica (para que el recibo acredite stock)
 *     y solicitud de compra pendiente unica (creada con token de tecnico t08 si el
 *     backend lo permite; si no, con token admin — queda registrado en observations).
 *  3. UI: aprobar la solicitud en el panel (approve-purchase-request) →
 *     verificar por API que la solicitud quedo 'aprobada' y que se genero la
 *     linea de compra (purchaseLineId) en estado 'pendiente' / approvalStatus 'aprobada'.
 *  4. UI: marcar la linea 'Enviar' → verificar status 'enviada' por API.
 *  5. UI: recibir la cantidad completa (input "Cant." + receive-purchase-line) →
 *     verificar receivedQuantity == quantity por API.
 *  6. Verificacion cruzada por API: stock de la referencia aumento exactamente lo
 *     recibido, existe movimiento de entrada con evidencia de la linea y evento
 *     RECEIVE_PURCHASE_LINE en la auditoria.
 *  7. Check negativo (BUG documentado, correccion del auditor): recibir una linea
 *     cuya referencia NO existe en inventory_references. Comportamiento esperado:
 *     error o aviso visible. Comportamiento real observado (bug): el sistema ACEPTA
 *     SIN AVISO (HTTP 200 "Recibo registrado"), marca receivedQuantity completo y
 *     NO acredita stock ni crea movimiento — el material se pierde en silencio.
 *     Se ejercita por UI (boton Recibir de la fila) y se asienta con evidencia
 *     (status HTTP capturado, feedback visible, ausencia de stock/movimiento).
 *
 * Exit codes: 0 = all checks passed, 1 = failure (incluye el bug del check negativo
 * hasta que el sistema lo corrija: entonces ghostReceiveRejectedOrWarned pasara a true).
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const adminEmail = process.env.PW_ADMIN_EMAIL || "admin@alfa.com";
const adminPassword = process.env.PW_ADMIN_PASSWORD || "1234";
const techEmail = "pw-tecnico-t08@alfa.local";
const techPassword = "Alfa2026!Pw";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(normalizedBaseUrl).origin;
})();

const stamp = Date.now();
// La referencia de inventario DEBE coincidir con la referencia de la solicitud/linea:
// el recibo acredita stock buscando la referencia por line.reference.
const reqRef = `SOL-T08-${stamp}`;
const refCode = reqRef;
const ghostRef = `GHOST-T08-${stamp}`; // referencia que NO existira en inventory_references
const qty = 3;
const ghostQty = 2;

const result = {
    test: "e2e-lars-t08-compras",
    requirement: "Aprobar solicitud -> linea de compra pendiente -> enviar -> recibir -> stock acreditado con auditoria",
    baseUrl: normalizedBaseUrl,
    data: { reference: refCode, purchaseRequest: reqRef, quantity: qty, technician: techEmail, ghostReference: ghostRef },
    checks: {
        adminLoggedIn: false,
        technicianReady: false,
        inventoryReferenceReady: false,
        purchaseRequestCreated: false,
        landedInventoryOrders: false,
        requestApprovedViaUI: false,
        purchaseLineGenerated: false,
        purchaseLineListed: false,
        lineSentViaUI: false,
        lineReceivedViaUI: false,
        stockIncreased: false,
        movementAuditRecorded: false,
        ghostReferenceAbsent: false,
        ghostLineCreatedAndSent: false,
        ghostReceiveRejectedOrWarned: false, // comportamiento esperado; hoy es BUG (queda false con evidencia)
        ghostStockNotCredited: false,        // complemento del bug: el recibo sube receivedQuantity sin stock
    },
    bugEvidence: {},
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshots: {},
    error: "",
};

let browser;
let adminSession;
let techSession;
let requestCreatedBy = "admin";

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function login(email, password) {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error(`login ${email} failed ${response.status}`);
    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

function buildApiHeaders(session) {
    return {
        "Content-Type": "application/json",
        "X-Company-Id": companyId,
        Authorization: `Bearer ${session.accessToken}`,
    };
}

async function apiPost(session, pathName, body) {
    const res = await fetch(`${apiBaseUrl}${pathName}`, {
        method: "POST",
        headers: buildApiHeaders(session),
        body: JSON.stringify(body),
    });
    const text = await res.text();
    const payload = text ? JSON.parse(text) : {};
    return { status: res.status, payload };
}

async function apiGet(session, pathName) {
    const res = await fetch(`${apiBaseUrl}${pathName}`, { headers: buildApiHeaders(session) });
    if (!res.ok) throw new Error(`GET ${pathName} failed ${res.status}`);
    return res.json();
}

async function shot(page, name) {
    const file = path.resolve(artifactsDir, `e2e-lars-t08-${stamp}-${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    result.screenshots[name] = file;
}

async function findReferenceByCode(session, code) {
    const data = await apiGet(session, "/api/v1/inventory/references");
    const items = Array.isArray(data) ? data : data?.items || [];
    return items.find((item) => item?.reference === code) || null;
}

async function findReference(session) {
    return findReferenceByCode(session, refCode);
}

async function findRequest(session) {
    const data = await apiGet(session, "/api/v1/inventory/purchase-requests");
    const items = data?.items || data || [];
    return (Array.isArray(items) ? items : []).find((item) => item?.reference === reqRef) || null;
}

async function findLine(session, ref = reqRef) {
    const data = await apiGet(session, "/api/v1/inventory/purchase-lines");
    const items = data?.items || data || [];
    return (Array.isArray(items) ? items : []).find((item) => item?.reference === ref) || null;
}

try {
    // ── Step 0: login admin + preparacion de usuario tecnico y fixtures ──
    adminSession = await login(adminEmail, adminPassword);
    result.checks.adminLoggedIn = true;

    const userRes = await apiPost(adminSession, "/api/v1/users", {
        email: techEmail,
        password: techPassword,
        confirmPassword: techPassword,
        name: "PW Tecnico T08",
        role: "Técnico",
    });
    if (userRes.status === 201 || userRes.status === 200) {
        result.checks.technicianReady = true;
        result.observations.push(`OK: usuario tecnico creado: ${techEmail} (rol 'Técnico').`);
    } else if (userRes.status === 409) {
        result.checks.technicianReady = true;
        result.observations.push(`OK: usuario tecnico ya existia (409): ${techEmail}.`);
    } else {
        result.observations.push(`OBSERVACION: POST /users para tecnico respondio ${userRes.status}: ${JSON.stringify(userRes.payload).slice(0, 160)}.`);
    }

    try {
        techSession = await login(techEmail, techPassword);
    } catch (err) {
        result.observations.push(`OBSERVACION: no se pudo loguear el tecnico (${String(err).slice(0, 120)}); se usara token admin para el setup.`);
    }

    // Referencia de inventario: debe existir para que el recibo acredite stock.
    const existingRef = await findReference(adminSession);
    if (existingRef) {
        result.checks.inventoryReferenceReady = true;
        result.observations.push(`OK: la referencia '${refCode}' ya existia (stock inicial ${existingRef.currentStock ?? existingRef.current_stock}).`);
    } else {
        const refRes = await apiPost(adminSession, "/api/v1/inventory/references", {
            reference: refCode,
            designation: "Referencia QA E2E t08 aprobar-enviar-recibir",
            brand: "QA-Brand",
            unitMeasure: "unidad",
            minStock: 0,
            targetStock: qty,
        });
        result.checks.inventoryReferenceReady = refRes.status === 201 || refRes.status === 200 || refRes.status === 409;
        if (!result.checks.inventoryReferenceReady) {
            result.observations.push(`OBSERVACION: POST /inventory/references respondio ${refRes.status}: ${JSON.stringify(refRes.payload).slice(0, 160)}.`);
        }
    }
    const refBefore = await findReference(adminSession);
    const stockBefore = Number(refBefore?.currentStock ?? refBefore?.current_stock ?? 0);

    // Solicitud de compra pendiente: se intenta con el token del tecnico (mas realista);
    // si el backend ACL lo rechaza, se crea con token admin.
    const requestBody = {
        reference: reqRef,
        description: "Repuesto QA E2E t08 aprobar-enviar-recibir",
        quantity: qty,
        supplier: "QA-Supplier-T08",
        estimatedCost: 1500,
        leadTimeDays: 2,
        urgency: "normal",
        memo: "Creada por e2e-lars-t08-compras-playwright",
        projectId: "",
        equipmentTag: "",
    };
    let createRes = techSession
        ? await apiPost(techSession, "/api/v1/inventory/purchase-requests", requestBody)
        : { status: 0, payload: {} };
    if (createRes.status === 201 || createRes.status === 200) {
        requestCreatedBy = techEmail;
        result.checks.purchaseRequestCreated = true;
    } else {
        if (techSession) {
            result.observations.push(
                `OBSERVACION (ACL): el tecnico no pudo crear la solicitud (${createRes.status}: ${JSON.stringify(createRes.payload).slice(0, 120)}); se crea con admin.`
            );
        }
        createRes = await apiPost(adminSession, "/api/v1/inventory/purchase-requests", requestBody);
        result.checks.purchaseRequestCreated = createRes.status === 201 || createRes.status === 200;
        if (!result.checks.purchaseRequestCreated) {
            result.observations.push(`OBSERVACION: POST /purchase-requests (admin) respondio ${createRes.status}: ${JSON.stringify(createRes.payload).slice(0, 160)}.`);
        }
    }
    result.observations.push(`OK: solicitud ${reqRef} creada por '${requestCreatedBy}' (cantidad ${qty}).`);

    const requestBefore = await findRequest(adminSession);
    if (!requestBefore) throw new Error(`la solicitud ${reqRef} no aparece en GET /purchase-requests tras crearla.`);
    const lineBefore = await findLine(adminSession);
    if (lineBefore) {
        result.observations.push(`DATO: ya existia una linea con referencia ${reqRef} (corrida previa); se continuara con ella si aplica.`);
    }

    // ── Navegador (NO headless bajo xvfb-run) ──
    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        { authSession: adminSession, apiBase: apiBaseUrl },
    );

    const page = await context.newPage();
    page.on("dialog", (dialog) => { void dialog.accept(); });
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(result.consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));

    // ── Step 1: /app/inventory-orders con la solicitud pendiente visible ──
    await page.goto(`${normalizedBaseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(3500);
    result.checks.landedInventoryOrders = page.url().includes("/app/inventory-orders");
    const panel = page.locator("[data-testid='purchase-requests-panel']");
    let requestRow = panel.locator("[data-testid='purchase-request-row']", { hasText: reqRef }).first();
    if (!(await requestRow.isVisible({ timeout: 8000 }).catch(() => false))) {
        // posible carrera de carga: recargar una vez
        await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
        await page.waitForTimeout(3500);
        requestRow = panel.locator("[data-testid='purchase-request-row']", { hasText: reqRef }).first();
    }
    const requestRowVisible = await requestRow.isVisible({ timeout: 8000 }).catch(() => false);
    if (!requestRowVisible) result.observations.push(`OBSERVACION: la solicitud ${reqRef} no se listo en el panel de solicitudes.`);
    await shot(page, "01-solicitud-pendiente-listada");

    // ── Step 2: aprobar la solicitud por UI ──
    if (requestRowVisible) {
        const approveBtn = requestRow.locator("[data-testid='approve-purchase-request']");
        if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await approveBtn.click();
            await page.waitForTimeout(3000);
            const badgeText = String(await requestRow.locator("[data-testid='purchase-request-status']").textContent().catch(() => "") || "").trim();
            const apiRequest = await findRequest(adminSession);
            result.checks.requestApprovedViaUI = badgeText === "aprobada" && apiRequest?.status === "aprobada";
            if (!result.checks.requestApprovedViaUI) {
                result.observations.push(`OBSERVACION: tras aprobar por UI badge="${badgeText}" api="${apiRequest?.status ?? "??"}".`);
            }
        } else {
            result.observations.push("OBSERVACION: el boton Aprobar no fue visible/habilitado para el admin en el panel.");
        }
    }
    await shot(page, "02-solicitud-aprobada");

    // ── Step 3: verificar linea de compra generada (estado pendiente) ──
    const apiRequestAfter = await findRequest(adminSession);
    const lineId = apiRequestAfter?.purchaseLineId || apiRequestAfter?.purchase_line_id || "";
    let apiLine = await findLine(adminSession);
    result.checks.purchaseLineGenerated =
        !!apiLine && apiLine.status === "pendiente" && (apiLine.approvalStatus || apiLine.approval_status) === "aprobada" && !!lineId;
    if (!result.checks.purchaseLineGenerated) {
        result.observations.push(
            `OBSERVACION: linea generada incorrecta: status=${apiLine?.status} approval=${apiLine?.approvalStatus ?? apiLine?.approval_status} link=${lineId || "sin-link"}.`
        );
    } else {
        result.observations.push(`OK: linea generada ${apiLine.id} (purchaseLineId enlazado en la solicitud), estado pendiente/aprobada.`);
    }

    // La linea debe listarse en la tabla de lineas de compra
    const linesTable = page.locator("[data-testid='purchase-lines-table']");
    let lineRow = linesTable.locator("[data-testid='purchase-line-row']", { hasText: reqRef }).first();
    if (!(await lineRow.isVisible({ timeout: 8000 }).catch(() => false))) {
        await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
        await page.waitForTimeout(3500);
        lineRow = page.locator("[data-testid='purchase-lines-table']").locator("[data-testid='purchase-line-row']", { hasText: reqRef }).first();
    }
    result.checks.purchaseLineListed = await lineRow.isVisible({ timeout: 8000 }).catch(() => false);
    if (!result.checks.purchaseLineListed) {
        result.observations.push(`OBSERVACION: la linea ${reqRef} no aparece en la tabla de lineas de compra.`);
    }
    await shot(page, "03-linea-compra-generada");

    // ── Step 4: marcar la linea como enviada por UI ──
    if (result.checks.purchaseLineListed) {
        const sendBtn = lineRow.getByRole("button", { name: "Enviar", exact: true }).first();
        if (await sendBtn.isVisible({ timeout: 5000 }).catch(() => false) && await sendBtn.isEnabled().catch(() => false)) {
            await sendBtn.click();
            await page.waitForTimeout(3000);
            apiLine = await findLine(adminSession);
            result.checks.lineSentViaUI = apiLine?.status === "enviada";
            if (!result.checks.lineSentViaUI) {
                result.observations.push(`OBSERVACION: tras 'Enviar' por UI el status de la linea es "${apiLine?.status}".`);
            }
        } else {
            result.observations.push("OBSERVACION: el boton 'Enviar' no fue visible/habilitado (linea no en estado pendiente?).");
        }
    }
    await shot(page, "04-linea-enviada");

    // ── Step 5: recibir la cantidad completa por UI ──
    if (result.checks.lineSentViaUI) {
        // recargar para tener la fila fresca con status enviada (input de cantidad habilitado)
        await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
        const linesTableAgain = page.locator("[data-testid='purchase-lines-table']");
        lineRow = linesTableAgain.locator("[data-testid='purchase-line-row']", { hasText: reqRef }).first();
        try {
            await lineRow.waitFor({ state: "attached", timeout: 30000 });
        } catch {
            // reintento con recarga: la tabla puede perder la carrera de carga inicial
            await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
            lineRow = page.locator("[data-testid='purchase-lines-table']").locator("[data-testid='purchase-line-row']", { hasText: reqRef }).first();
            await lineRow.waitFor({ state: "attached", timeout: 30000 });
        }
        await page.waitForTimeout(2000);
        await lineRow.scrollIntoViewIfNeeded().catch(() => {});
        const qtyInput = lineRow.locator("input[placeholder='Cant.']").first();
        const receiveBtn = lineRow.locator("[data-testid='receive-purchase-line']").first();
        if (await qtyInput.isVisible({ timeout: 15000 }).catch(() => false) && await receiveBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
            await qtyInput.fill(String(qty));
            await receiveBtn.click();
            await page.waitForTimeout(3500);
            apiLine = await findLine(adminSession);
            const received = Number(apiLine?.receivedQuantity ?? apiLine?.received_quantity ?? -1);
            result.checks.lineReceivedViaUI = received === qty;
            if (!result.checks.lineReceivedViaUI) {
                result.observations.push(`OBSERVACION: tras recibir por UI receivedQuantity=${received} (esperado ${qty}).`);
            }
        } else {
            const rowHtml = String(await lineRow.innerHTML().catch(() => "")).slice(0, 400);
            result.observations.push(`OBSERVACION: no se encontro el input de cantidad o el boton 'Recibir' en la fila. html=${rowHtml}`);
        }
    }
    await shot(page, "05-linea-recibida");

    // ── Step 6: verificacion cruzada por API — stock + movimiento + auditoria ──
    const refAfter = await findReference(adminSession);
    const stockAfter = Number(refAfter?.currentStock ?? refAfter?.current_stock ?? -1);
    result.checks.stockIncreased = stockAfter === stockBefore + qty;
    if (!result.checks.stockIncreased) {
        result.observations.push(`OBSERVACION: stock de ${refCode}: antes=${stockBefore} despues=${stockAfter} (esperado ${stockBefore + qty}).`);
    } else {
        result.observations.push(`OK: stock de ${refCode} ${stockBefore} -> ${stockAfter} (+${qty}).`);
    }

    const movements = await apiGet(adminSession, "/api/v1/inventory/movements");
    const movItems = movements?.items || movements || [];
    const movList = Array.isArray(movItems) ? movItems : [];
    const mov = movList.find((m) => (m?.reference === refCode) && Number(m?.quantity) === qty &&
        ((m?.evidenceRef || m?.evidence_ref || "").includes(lineId) || /recibo/i.test(m?.reason || "")));
    let auditHasEvent = false;
    try {
        const audit = await apiGet(adminSession, "/api/v1/inventory/audit");
        const auditItems = audit?.items || audit || [];
        const auditList = Array.isArray(auditItems) ? auditItems : [];
        auditHasEvent = auditList.some((a) => /RECEIVE_PURCHASE_LINE/.test(a?.action || "") && String(a?.detail || "").includes(lineId));
    } catch (err) {
        result.observations.push(`OBSERVACION: GET /inventory/audit fallo: ${String(err).slice(0, 120)}.`);
    }
    result.checks.movementAuditRecorded = !!mov && auditHasEvent;
    if (!result.checks.movementAuditRecorded) {
        result.observations.push(
            `OBSERVACION: movimiento=${mov ? "OK" : "no-encontrado"} (ref=${refCode}, qty=${qty}, linea=${lineId}); audit RECEIVE_PURCHASE_LINE=${auditHasEvent}.`
        );
    } else {
        result.observations.push(`OK: movimiento de entrada ${mov.id || mov.type} + auditoria RECEIVE_PURCHASE_LINE registrados.`);
    }
    await shot(page, "06-stock-acreditado");

    // ── Step 7 (check negativo, BUG del auditor): recibir linea con referencia inexistente ──
    // Setup por API: linea de compra cuya referencia NO existe en inventory_references.
    try {
        const ghostRefAbsent = !(await findReferenceByCode(adminSession, ghostRef));
        result.checks.ghostReferenceAbsent = ghostRefAbsent;
        const ghostCreate = await apiPost(adminSession, "/api/v1/inventory/purchase-lines", {
            reference: ghostRef,
            component: "Componente fantasma QA",
            type: "Repuesto",
            brand: "QA-Ghost",
            description: "Linea QA t08 con referencia inexistente (check negativo)",
            supplier: "QA-Supplier-T08",
            quantity: ghostQty,
            unitPrice: 900,
            neededBy: "1",
            requestReason: "QA check negativo: recibo sin ficha de inventario",
            projectId: "",
            equipmentTag: "",
        });
        const ghostLineId = ghostCreate.payload?.item?.id || ghostCreate.payload?.id || "";
        if (!ghostLineId) throw new Error(`linea fantasma no creada: ${ghostCreate.status}`);
        const sendRes = await apiPost(adminSession, `/api/v1/inventory/purchase-lines/${encodeURIComponent(ghostLineId)}/send`, {});
        result.checks.ghostLineCreatedAndSent = sendRes.status === 200 && (await findLine(adminSession, ghostRef))?.status === "enviada";

        if (result.checks.ghostLineCreatedAndSent) {
            // El recibo se ejercita por UI (mismo endpoint que usa inventoryApi.receivePurchaseLine).
            await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
            const ghostRow = page.locator("[data-testid='purchase-lines-table']")
                .locator("[data-testid='purchase-line-row']", { hasText: ghostRef }).first();
            try {
                await ghostRow.waitFor({ state: "attached", timeout: 30000 });
            } catch {
                await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
                await page.locator("[data-testid='purchase-lines-table']")
                    .locator("[data-testid='purchase-line-row']", { hasText: ghostRef }).first()
                    .waitFor({ state: "attached", timeout: 30000 });
            }
            await page.waitForTimeout(2000);
            await ghostRow.scrollIntoViewIfNeeded().catch(() => {});

            let receiveHttpStatus = 0;
            const onResponse = (res) => {
                if (/\/purchase-lines\/[^/]+\/receive$/.test(res.url()) && res.request().method() === "POST") {
                    receiveHttpStatus = res.status();
                }
            };
            page.on("response", onResponse);

            const ghostQtyInput = ghostRow.locator("input[placeholder='Cant.']").first();
            const ghostReceiveBtn = ghostRow.locator("[data-testid='receive-purchase-line']").first();
            let feedbackText = "";
            if (await ghostQtyInput.isVisible({ timeout: 15000 }).catch(() => false) && await ghostReceiveBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
                await ghostQtyInput.fill(String(ghostQty));
                await ghostReceiveBtn.click();
                await page.waitForTimeout(3500);
                // feedback visible del componente (alert success/danger tras recibir)
                feedbackText = String(await page.locator("[data-testid='purchase-lines-table']")
                    .locator("..").locator(".alert").first().innerText().catch(() => "")).trim();
                if (!feedbackText) {
                    feedbackText = String(await page.locator(".alert").first().innerText().catch(() => "")).trim();
                }
            } else {
                result.observations.push("OBSERVACION (check negativo): no se encontro input/boton Recibir para la linea fantasma.");
            }

            const ghostLineAfter = await findLine(adminSession, ghostRef);
            const received = Number(ghostLineAfter?.receivedQuantity ?? ghostLineAfter?.received_quantity ?? -1);
            const ghostRefStillAbsent = !(await findReferenceByCode(adminSession, ghostRef));
            const movementsAfter = await apiGet(adminSession, "/api/v1/inventory/movements");
            const movItemsAfter = movementsAfter?.items || movementsAfter || [];
            const ghostMovement = (Array.isArray(movItemsAfter) ? movItemsAfter : [])
                .find((m) => m?.reference === ghostRef && Number(m?.quantity) === ghostQty);
            const warnedOrRejected = receiveHttpStatus >= 400 || /no existe|inexistente|no se pudo|error/i.test(feedbackText);

            result.bugEvidence = {
                reference: ghostRef,
                lineId: ghostLineId,
                receiveHttpStatus,
                feedbackText,
                receivedQuantityAfter: received,
                referenceCreatedByReceipt: !ghostRefStillAbsent,
                stockMovementForReference: ghostMovement ? ghostMovement.id || "presente" : null,
            };
            result.checks.ghostReceiveRejectedOrWarned = warnedOrRejected;
            // El check original exigía received === ghostQty: eso era la
            // EVIDENCIA del bug viejo (recibo fantasma registrado en silencio
            // sin acreditar stock). Tras el fix el sistema RECHAZA el recibo
            // (HTTP 400) y received queda en 0. Lo que este check protege es
            // que el stock fantasma jamás se acredite ni genere movimiento o
            // referencia; el rechazo con aviso queda verificado arriba.
            result.checks.ghostStockNotCredited = ghostRefStillAbsent && !ghostMovement;
            if (warnedOrRejected) {
                result.observations.push(`OK (check negativo): el sistema rechazo o advirtio el recibo sin ficha de inventario (http=${receiveHttpStatus}, feedback='${feedbackText.slice(0, 120)}').`);
            } else {
                result.observations.push(
                    `BUG CONFIRMADO (auditor t08): recibir una linea con referencia inexistente ACEPTA SIN AVISO y NO acredita stock — `
                    + `HTTP ${receiveHttpStatus}, feedback='${feedbackText.slice(0, 140)}', receivedQuantity=${received}/${ghostQty} (el recibo queda registrado), `
                    + `referencia '${ghostRef}' sigue sin existir, movimiento de stock: ${ghostMovement ? "si" : "no"}. El material se pierde en silencio.`
                );
            }
            await shot(page, "07-ghost-recibo-sin-aviso");
        }
    } catch (err) {
        result.observations.push(`OBSERVACION (check negativo): ${String(err).slice(0, 200)}.`);
        await shot(page, "07-ghost-recibo-sin-aviso").catch(() => {});
    }

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
        process.exitCode = 1;
    }

    const resultPath = path.resolve("e2e-lars-t08-result.json");
    await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
    console.log("E2E_LARS_T08_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
    console.log(`Result JSON: ${resultPath}`);
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `e2e-lars-t08-${stamp}-fail.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshots.fail = sp;
        }
    } catch {}
    console.error("E2E_LARS_T08_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
