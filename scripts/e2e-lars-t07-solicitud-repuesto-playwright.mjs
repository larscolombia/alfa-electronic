/**
 * E2E t07 — Solicitud de repuesto (rol Técnico) → panel de compras (rol admin)
 *
 * Flujo validado:
 *  1. Login admin y alta (o reutilización) del usuario técnico pw-tecnico-t07@alfa.local.
 *  2. Setup mínimo vía API: prospecto + recepción de equipo (con serie única -t07)
 *     + caso (proyecto) en la columna "pedir-repuestos" del kanban técnico.
 *  3. UI como TÉCNICO: abrir el kanban /app/work-projects, abrir el detalle del caso,
 *     pestaña Materiales, formulario "Solicitar compra de repuesto":
 *     referencia "Optoacoplador PC817", cantidad 4, proveedor Mouser, plazo 12 días.
 *  4. Verificación cruzada como ADMIN:
 *     - API GET /api/v1/inventory/purchase-requests: cantidad/proveedor/plazo/proyecto/solicitante.
 *     - UI /app/inventory-orders: la solicitud aparece PENDIENTE con botón Aprobar habilitado.
 *
 * Exit codes: 0 = all checks passed, 1 = failure
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const adminEmail = process.env.PW_ADMIN_EMAIL || "admin@alfa.com";
const adminPassword = process.env.PW_ADMIN_PASSWORD || "1234";
const tecnicoEmail = process.env.PW_TECNICO_EMAIL || "pw-tecnico-t07@alfa.local";
const tecnicoPassword = process.env.PW_TECNICO_PASSWORD || "Alfa2026!Pw";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(normalizedBaseUrl).origin;
})();

const stamp = Date.now();
const serie = `PW-T07-${stamp}`;
const prospectName = `Prospecto QA t07 ${stamp}`;
const projectId = `qa-t07-project-${stamp}`;
const projectTitle = `Caso QA t07 ${stamp} pedir componentes`;
const REFERENCE = "Optoacoplador PC817";
const QTY = 4;
const SUPPLIER = "Mouser";
const LEAD_DAYS = 12;

const result = {
    test: "e2e-lars-t07-solicitud-repuesto",
    requirement: "El técnico solicita repuesto desde el kanban y la solicitud llega pendiente al panel de compras (admin)",
    baseUrl: normalizedBaseUrl,
    artifacts: {
        prospectId: "",
        equipmentRecordId: "",
        projectId,
        requestReference: REFERENCE,
        purchaseRequestId: "",
        requestedBy: "",
        screenshots: [],
    },
    checks: {
        adminLoggedIn: false,
        tecnicoUserReady: false,
        tecnicoLoggedIn: false,
        tecnicoAclInventoryAdd: false,
        aclFactoryGapReproduced: false,
        aclPermissionRestored: false,
        prospectCreated: false,
        equipmentCreated: false,
        boardConfigChecked: false,
        casoCreated: false,
        kanbanLoadedAsTecnico: false,
        cardInPedirRepuestos: false,
        detailOpened: false,
        materialesTabOpened: false,
        formFilled: false,
        purchaseRequestSubmitted: false,
        requestListedInProject: false,
        apiRequestPersisted: false,
        apiFieldsComplete: false,
        adminPanelLoaded: false,
        requestPendingInAdminPanel: false,
        approveButtonEnabled: false,
        requestedByVisibleInPanel: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshotPath: "",
    error: "",
};

let browser;
let adminSession;
let tecnicoSession;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function apiLogin(email, password) {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`login ${email} failed ${response.status}: ${body.slice(0, 200)}`);
    }
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

async function apiRequest(session, method, pathName, body) {
    const res = await fetch(`${apiBaseUrl}${pathName}`, {
        method,
        headers: buildApiHeaders(session),
        body: body === undefined || body === null ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = null; }
    return { status: res.status, ok: res.ok, data: parsed, text: text.slice(0, 300) };
}

async function ensureTecnicoUser() {
    const createRes = await apiRequest(adminSession, "POST", "/api/v1/users", {
        email: tecnicoEmail,
        password: tecnicoPassword,
        confirmPassword: tecnicoPassword,
        name: "Técnico QA t07",
        role: "Técnico",
    });
    if (createRes.ok) {
        result.observations.push(`DATO: usuario técnico creado (${tecnicoEmail}).`);
    } else if (createRes.status === 409) {
        result.observations.push(`DATO: el usuario técnico ya existía (${tecnicoEmail}); se reutiliza.`);
    } else {
        result.observations.push(
            `OBSERVACIÓN: POST /api/v1/users respondió ${createRes.status}: ${createRes.text}. Se intenta login igualmente.`,
        );
    }
    tecnicoSession = await apiLogin(tecnicoEmail, tecnicoPassword);
}

async function createProspect() {
    const res = await apiRequest(adminSession, "POST", "/api/v1/crm/prospects", {
        name: prospectName,
        email: `pw-t07-${stamp}@prueba.com`,
        company: `Empresa QA t07 ${stamp}`,
        mobile: "3001112233",
        status: "Pendiente",
    });
    if (!res.ok || !res.data?.id) {
        throw new Error(`crear prospecto falló ${res.status}: ${res.text}`);
    }
    result.artifacts.prospectId = String(res.data.id);
}

async function createEquipmentRecord() {
    result.artifacts.equipmentRecordId = `qa-t07-equipment-${stamp}`;
    const body = {
        id: result.artifacts.equipmentRecordId,
        prospectId: result.artifacts.prospectId,
        prospectName,
        receptionDay: "24",
        receptionMonth: "10",
        receptionYear: "2026",
        intakeMethod: "personal",
        companyName: `Empresa QA t07 ${stamp}`,
        nit: `qa-nit-t07-${stamp}`,
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
                id: `qa-t07-item-${stamp}`,
                registrationMode: "manual",
                equipmentModelId: "",
                serviceTypeId: "",
                serviceTypeName: "Reparacion",
                storageLocationId: "",
                storageLocationName: "",
                familyId: "",
                familyName: "PLC",
                marca: "QA-Marca-t07",
                tipo: "Modulo optoacoplador",
                serie,
                receivedIdentifier: serie,
                receivedIdentifierType: "manual",
                receivedIdentifierSource: "manual",
                receivedIdentifierCapturedAt: new Date().toISOString(),
                customerShipmentReference: "",
                accessories: "Sin accesorios",
                borrowedEquipments: [],
                failureDescription: "Falla de prueba E2E t07",
                pendingHomologation: false,
                estimatedData: false,
                identifierLabelIssue: false,
                evidencePhotos: [],
                attachments: [],
                answers: {},
                repairStatus: "pedir-repuestos",
                repairStatusUpdatedAt: new Date().toISOString(),
                repairStatusUpdatedBy: tecnicoEmail,
            },
        ],
    };
    const res = await apiRequest(
        adminSession,
        "PUT",
        `/api/v1/crm-equipment/records/${encodeURIComponent(result.artifacts.equipmentRecordId)}`,
        body,
    );
    if (!res.ok) throw new Error(`crear recepción de equipo falló ${res.status}: ${res.text}`);
}

let targetColumnId = "pedir-repuestos";

async function checkBoardConfig() {
    const res = await apiRequest(adminSession, "GET", "/api/v1/projects/board-config");
    if (res.ok && Array.isArray(res.data?.columns) && res.data.columns.length > 0) {
        const ids = res.data.columns.map((c) => String(c.id || ""));
        if (!ids.includes("pedir-repuestos")) {
            const fallback = ids.find((id) => id.includes("pedir")) || "";
            if (fallback) {
                result.observations.push(
                    `OBSERVACIÓN: la columna 'pedir-repuestos' no existe en board-config; se usa '${fallback}'.`,
                );
                targetColumnId = fallback;
            } else {
                result.observations.push(
                    `OBSERVACIÓN: la columna 'pedir-repuestos' no existe en board-config (${ids.join(", ")}); se conserva el id y el front lo reasignará.`,
                );
            }
        }
    } else {
        result.observations.push("DATO: no se pudo leer board-config; se asume columna por defecto 'pedir-repuestos'.");
    }
    result.checks.boardConfigChecked = true;
}

async function createCaso() {
    const nowIso = new Date().toISOString();
    const res = await apiRequest(adminSession, "POST", "/api/v1/projects", {
        id: projectId,
        status: targetColumnId,
        properties: {
            title: projectTitle,
            description: "Caso E2E t07: equipo en etapa de pedir componentes para solicitud de repuesto.",
            icon: "bi-briefcase",
            boardId: "board-1",
            createdBy: tecnicoEmail,
            shortCode: "T07-001",
            startDate: nowIso,
            stageEnteredAt: nowIso,
            noDeadline: true,
            category: "Reparacion",
            department: "Tecnica",
            client: prospectName,
            priority: "high",
            assignee: "Técnico QA t07",
            notes: "",
            diagnosticNotes: "Diagnóstico QA t07 completado.",
            repairNotes: "",
            repairabilityPercent: 80,
            publicProject: false,
            members: [],
            currency: "COP",
            budget: 0,
            estimatedHours: 2,
            actualHours: 0,
            testType: "sin-pruebas",
            allowManualTime: false,
            notifyClient: false,
            equipmentRecordId: result.artifacts.equipmentRecordId,
            equipmentItemId: `qa-t07-item-${stamp}`,
            equipmentProspectId: 0,
            equipmentProspectName: prospectName,
            equipmentDisplayName: `PLC / QA-Marca-t07 / ${serie}`,
            equipmentIdentifier: serie,
            equipmentSerie: serie,
            equipmentReceptionLabel: `Recepción QA t07 ${stamp}`,
            equipmentServiceType: "Reparacion",
            equipmentFailureDescription: "Falla de prueba E2E t07",
            equipmentLocationId: "",
            equipmentLocationName: "",
            equipmentRepairStatus: "pedir-repuestos",
            equipmentRepairStatusLabel: "Pedir componentes",
            equipmentLinkedAt: nowIso,
            equipmentLastScanAt: "",
            equipmentLastScanSource: "",
            equipmentLastWorkflowUpdate: nowIso,
            progress: 0,
            attachments: [],
        },
    });
    if (!res.ok) throw new Error(`crear caso falló ${res.status}: ${res.text}`);
}

async function aclReadInventarioAgregar() {
    const rolesRes = await apiRequest(adminSession, "GET", "/api/v1/acl/roles");
    const roles = Array.isArray(rolesRes.data?.items) ? rolesRes.data.items : [];
    const tecnicoRole = roles.find((r) => String(r.name || "").trim() === "Técnico");
    if (!tecnicoRole?.id) return { roleId: "", modules: [], scope: null };
    const permsRes = await apiRequest(adminSession, "GET", `/api/v1/acl/roles/${encodeURIComponent(tecnicoRole.id)}/permissions`);
    const modules = Array.isArray(permsRes.data?.modules) ? permsRes.data.modules : [];
    const inventario = modules.find((m) => m.moduleSlug === "inventario");
    const agregar = inventario?.actions?.find((a) => a.action === "agregar");
    if (!inventario || !agregar) return { roleId: tecnicoRole.id, modules, scope: null };
    return { roleId: tecnicoRole.id, modules, scope: String(agregar.scope || "") };
}

async function aclSetInventarioAgregar(roleId, modules, scope) {
    const payload = {
        modules: modules.map((m) =>
            m.moduleSlug === "inventario"
                ? {
                    moduleId: m.moduleId,
                    isEnabled: m.isEnabled,
                    actions: m.actions.map((a) => (a.action === "agregar" ? { action: "agregar", scope } : a)),
                    fields: m.fields,
                }
                : m,
        ),
    };
    return apiRequest(adminSession, "PUT", `/api/v1/acl/roles/${encodeURIComponent(roleId)}/permissions`, payload);
}

async function ensureTecnicoInventoryAddPermission() {
    // Evidencia reproducible (pedida por auditoría) del gap ACL de fábrica:
    // el rol 'Técnico' sin 'agregar' sobre 'inventario' recibe 403 al crear una
    // solicitud de compra desde el kanban. Como el permiso concedido persiste
    // entre corridas, aquí se revoca programáticamente, se reproduce el 403 con
    // una sonda como Técnico y se vuelve a conceder antes del flujo UI.
    // Evidencia histórica original: playwright-artifacts/e2e-lars-t07-results-1792889409126.json
    // (403 de fábrica en UI, 24/10 19:54) y e2e-lars-t07-results-1792890319300.json
    // (hallazgo + concesión, 24/10 20:07).
    const current = await aclReadInventarioAgregar();
    if (!current.roleId || current.scope === null) {
        result.observations.push("OBSERVACIÓN: no se encontró el rol ACL 'Técnico' o falta inventario/agregar; no se pudo reproducir el gap.");
        return;
    }

    let revokedByScript = false;
    if (current.scope !== "ninguno") {
        const revoke = await aclSetInventarioAgregar(current.roleId, current.modules, "ninguno");
        if (revoke.ok) {
            revokedByScript = true;
            result.observations.push(
                `SETUP (reproducción auditoría): el rol Técnico tenía agregar='${current.scope}'; se revocó a 'ninguno' por API `
                + "(PUT /api/v1/acl/roles/:id/permissions, mismo mecanismo de la pantalla ACL) para evidenciar el gap de fábrica.",
            );
        } else {
            result.observations.push(
                `OBSERVACIÓN: no se pudo revocar el permiso (PUT respondió ${revoke.status}: ${revoke.text}); `
                + "la sonda se hará con el estado actual del permiso.",
            );
        }
    } else {
        result.observations.push("DATO: el rol Técnico seguía en estado de fábrica (agregar='ninguno'); no hizo falta revocar.");
    }

    // Sonda como TÉCNICO: con agregar='ninguno' el backend (RequireModule, POST=agregar)
    // debe rechazar con 403. Referencia única para trazabilidad si llegara a persistir.
    const probe = await apiRequest(tecnicoSession, "POST", "/api/v1/inventory/purchase-requests", {
        reference: `QA-T07-ACL-PROBE-${stamp}`,
        description: "Sonda ACL para evidenciar gap de fabrica (t07)",
        quantity: 1,
        supplier: "QA",
        estimatedCost: 1,
        leadTimeDays: 1,
        urgency: "normal",
        memo: "probe",
        projectId,
        equipmentTag: "",
    });
    result.checks.aclFactoryGapReproduced = probe.status === 403;
    if (result.checks.aclFactoryGapReproduced) {
        result.observations.push(
            `HALLAZGO ACL DE FÁBRICA (reproducido ${new Date().toISOString()}): con agregar='ninguno' el POST `
            + `/api/v1/inventory/purchase-requests como Técnico respondió 403 (${probe.text.slice(0, 120)}). `
            + "El técnico no puede solicitar repuestos desde el kanban sin que un admin le conceda 'agregar' en inventario.",
        );
    } else {
        result.observations.push(
            `OBSERVACIÓN: la sonda respondió ${probe.status} (se esperaba 403 con agregar='ninguno'); `
            + "el endpoint podría no estar aplicando RequireModule. Body: " + probe.text.slice(0, 120),
        );
    }

    // Restaurar/conceder agregar='propio' (requerido para el flujo UI del técnico).
    const grant = await aclSetInventarioAgregar(current.roleId, current.modules, "propio");
    result.checks.aclPermissionRestored = grant.ok;
    result.checks.tecnicoAclInventoryAdd = grant.ok;
    if (grant.ok) {
        result.observations.push(
            `SETUP: permiso restaurado/concedido — rol Técnico agregar='propio' sobre inventario`
            + (revokedByScript ? " (se revocó solo para la reproducción del 403)." : " (estado necesario para el flujo)."),
        );
    } else {
        result.observations.push(
            `OBSERVACIÓN: PUT permisos ACL respondió ${grant.status}: ${grant.text}. El flujo UI fallará por 403 (evidencia del gap).`,
        );
    }
}

async function findPurchaseRequest(session) {
    const res = await apiRequest(session, "GET", "/api/v1/inventory/purchase-requests");
    if (!res.ok) throw new Error(`list purchase-requests falló ${res.status}`);
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    return items.find(
        (item) =>
            String(item.reference || "").trim() === REFERENCE &&
            String(item.projectId || "").trim() === projectId,
    ) || null;
}

async function buildPage(session, extraInit) {
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 }, ignoreHTTPSErrors: true });
    await context.addInitScript(
        ({ authSession, apiBase, extra }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            if (extra) Object.entries(extra).forEach(([k, v]) => window.localStorage.setItem(k, v));
        },
        { authSession: session, apiBase: apiBaseUrl, extra: extraInit || null },
    );
    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(result.consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));
    return { context, page };
}

async function screenshot(page, name) {
    const filePath = path.resolve(artifactsDir, `e2e-lars-t07-${name}-${Date.now()}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    result.artifacts.screenshots.push(filePath);
    result.screenshotPath = filePath;
    return filePath;
}

try {
    // ── Paso 0: sesiones ──
    adminSession = await apiLogin(adminEmail, adminPassword);
    result.checks.adminLoggedIn = true;
    await ensureTecnicoUser();
    result.checks.tecnicoUserReady = true;
    result.checks.tecnicoLoggedIn = Boolean(tecnicoSession?.accessToken);

    // ── Setup vía API ──
    await createProspect();
    result.checks.prospectCreated = true;
    await createEquipmentRecord();
    result.checks.equipmentCreated = true;
    await checkBoardConfig();
    await createCaso();
    result.checks.casoCreated = true;
    await ensureTecnicoInventoryAddPermission();

    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless, slowMo: slowMoMs });

    // ── UI como TÉCNICO: kanban → detalle → Materiales → solicitud de compra ──
    const tecnicoCtx = await buildPage(tecnicoSession);
    const page = tecnicoCtx.page;

    await page.goto(`${normalizedBaseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForSelector(".kanban-board", { timeout: timeoutMs }).catch(() => {});
    result.checks.kanbanLoadedAsTecnico = await page.locator(".kanban-board").isVisible().catch(() => false);
    if (!result.checks.kanbanLoadedAsTecnico) {
        throw new Error("el tablero kanban no cargó con la sesión de Técnico (¿ACL bloquea work-projects?).");
    }

    const columnSelector = `.cards-sortable[data-column-id='${targetColumnId}']`;
    const card = page.locator(`${columnSelector} .project-drag-item[data-project-id='${projectId}']`).first();
    result.checks.cardInPedirRepuestos = await card.isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.checks.cardInPedirRepuestos) {
        result.observations.push(
            `OBSERVACIÓN: la tarjeta del caso no aparece en la columna '${targetColumnId}'. ¿El front reasignó el estado o el board-config no coincide?`,
        );
    }
    await screenshot(page, "01-kanban-tecnico");

    // Abrir el detalle desde el kanban haciendo click en la tarjeta del caso.
    if (result.checks.cardInPedirRepuestos) {
        await card.click();
    } else {
        await page.goto(
            `${normalizedBaseUrl}/app/work-projects?openProject=${encodeURIComponent(projectId)}`,
            { waitUntil: "networkidle", timeout: timeoutMs },
        );
    }
    await page.waitForSelector(".project-detail-dialog", { state: "visible", timeout: timeoutMs });
    await page.waitForFunction(
        () => (document.querySelector(".project-detail-dialog__title")?.textContent?.trim() || "").length > 0,
        { timeout: timeoutMs },
    );
    result.checks.detailOpened = true;
    await screenshot(page, "02-detalle-caso-tecnico");

    // Pestaña Materiales.
    const dialog = page.locator(".project-detail-dialog");
    await dialog.locator(".nav-link", { hasText: "Materiales" }).first().click();
    const purchaseSectionH4 = dialog.locator("h4", { hasText: "Solicitar compra de repuesto" }).first();
    result.checks.materialesTabOpened = await purchaseSectionH4.isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.checks.materialesTabOpened) {
        throw new Error("la pestaña Materiales no muestra la sección 'Solicitar compra de repuesto'.");
    }

    const section = dialog.locator("section.project-detail-section", {
        has: page.locator("h4", { hasText: "Solicitar compra de repuesto" }),
    }).first();

    async function fillField(labelText, value) {
        const field = section.locator(".project-detail-field", { hasText: labelText }).first();
        const input = field.locator("input, textarea").first();
        await input.fill(String(value));
        return input;
    }

    await fillField("Referencia del componente", REFERENCE);
    await fillField("Cantidad", QTY);
    await fillField("Descripcion", `Optoacoplador PC817 para reemplazo en tarjeta de control (QA t07)`);
    await fillField("Proveedor sugerido", SUPPLIER);
    await fillField("Plazo entrega (dias)", LEAD_DAYS);
    await fillField("Memo tecnico (justificacion)", "Solicitud E2E t07: optoacoplador quemado en entrada digital.");
    result.checks.formFilled = true;
    await screenshot(page, "03-formulario-llenado");

    // Enviar solicitud de compra. La alerta de éxito se acota a la sección del
    // formulario: el diálogo completo tiene otras .alert.alert-success (ngIf) que
    // rompen el .first() a nivel de diálogo.
    const errorBefore = await dialog.locator(".alert.alert-danger").count();
    await section.locator("button", { hasText: "Enviar solicitud de compra" }).first().click();
    const successAlert = section.locator(".alert.alert-success").first();
    result.checks.purchaseRequestSubmitted = await successAlert
        .isVisible({ timeout: 25000 })
        .catch(() => false);
    const successText = result.checks.purchaseRequestSubmitted
        ? String(await successAlert.textContent().catch(() => "") || "").trim()
        : "";
    const errorAfter = result.checks.purchaseRequestSubmitted
        ? ""
        : String(await dialog.locator(".alert.alert-danger").first().textContent().catch(() => "") || "").trim();
    if (!result.checks.purchaseRequestSubmitted) {
        result.observations.push(
            `FALLO: la solicitud no se confirmó en UI. Mensaje de error: '${errorAfter || "(sin alerta)"}'.`,
        );
    } else {
        result.observations.push(`DATO: confirmación UI: '${successText}'.`);
    }
    await page.waitForTimeout(1500);
    await screenshot(page, "04-solicitud-enviada");

    // La solicitud debe listarse dentro del propio proyecto como pendiente.
    const projectRequestsTable = dialog.locator("h6", { hasText: "Solicitudes de este proyecto" }).first();
    if (await projectRequestsTable.isVisible({ timeout: 8000 }).catch(() => false)) {
        const row = dialog.locator("table tbody tr", { hasText: REFERENCE }).first();
        const rowVisible = await row.isVisible({ timeout: 8000 }).catch(() => false);
        const rowText = rowVisible ? String(await row.textContent() || "") : "";
        result.checks.requestListedInProject = rowVisible && rowText.includes("pendiente");
        if (!result.checks.requestListedInProject) {
            result.observations.push(
                `OBSERVACIÓN: la solicitud no aparece como 'pendiente' en 'Solicitudes de este proyecto' (fila visible=${rowVisible}).`,
            );
        }
    } else {
        result.observations.push("OBSERVACIÓN: no se renderizó la tabla 'Solicitudes de este proyecto' tras enviar.");
    }

    // ── Verificación cruzada por API (admin) ──
    const apiItem = await findPurchaseRequest(adminSession);
    result.checks.apiRequestPersisted = Boolean(apiItem);
    if (apiItem) {
        result.artifacts.purchaseRequestId = String(apiItem.id || "");
        result.artifacts.requestedBy = String(apiItem.requestedBy || "");
        const statusOk = String(apiItem.status || "") === "pendiente";
        const fieldsOk =
            Number(apiItem.quantity) === QTY &&
            String(apiItem.supplier || "").trim() === SUPPLIER &&
            Number(apiItem.leadTimeDays) === LEAD_DAYS &&
            String(apiItem.projectId || "").trim() === projectId;
        result.checks.apiFieldsComplete = statusOk && fieldsOk;
        if (!result.checks.apiFieldsComplete) {
            result.observations.push(
                `OBSERVACIÓN: la solicitud llegó INCOMPLETA vía API: status='${apiItem.status}' qty=${apiItem.quantity} ` +
                `supplier='${apiItem.supplier}' leadTimeDays=${apiItem.leadTimeDays} projectId='${apiItem.projectId}'.`,
            );
        }
        if (!String(apiItem.requestedBy || "").trim()) {
            result.observations.push("OBSERVACIÓN: la solicitud llegó sin solicitante (requestedBy vacío).");
        }
    } else {
        result.observations.push("FALLO INTERCONEXIÓN: la solicitud creada por UI NO aparece en GET /api/v1/inventory/purchase-requests.");
        result.checks.apiFieldsComplete = false;
    }

    // ── UI como ADMIN: panel de solicitudes de compra ──
    const adminCtx = await buildPage(adminSession);
    const adminPage = adminCtx.page;
    adminPage.on("dialog", (d) => { void d.dismiss(); }); // no aprobar/rechazar nada

    await adminPage.goto(`${normalizedBaseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout: timeoutMs });
    await adminPage.waitForTimeout(3000);
    const panel = adminPage.locator("[data-testid='purchase-requests-panel']");
    result.checks.adminPanelLoaded = await panel.isVisible({ timeout: 20000 }).catch(() => false);
    if (result.checks.adminPanelLoaded) {
        const requestRow = panel.locator("[data-testid='purchase-request-row']", { hasText: REFERENCE }).first();
        const rowVisible = await requestRow.isVisible({ timeout: 15000 }).catch(() => false);
        if (rowVisible) {
            const badge = requestRow.locator("[data-testid='purchase-request-status']");
            const badgeText = String(await badge.textContent().catch(() => "") || "").trim();
            const rowText = String(await requestRow.textContent() || "");
            result.checks.requestPendingInAdminPanel = badgeText === "pendiente";
            result.checks.requestedByVisibleInPanel =
                result.artifacts.requestedBy === "" || rowText.includes(result.artifacts.requestedBy);
            if (!result.checks.requestPendingInAdminPanel) {
                result.observations.push(`OBSERVACIÓN: en el panel admin el estado es '${badgeText}' (se esperaba 'pendiente').`);
            }
            if (!result.checks.requestedByVisibleInPanel) {
                result.observations.push(
                    `OBSERVACIÓN: el panel no muestra al solicitante '${result.artifacts.requestedBy}' en la fila.`,
                );
            }
            const approveBtn = requestRow.locator("[data-testid='approve-purchase-request']");
            result.checks.approveButtonEnabled =
                await approveBtn.isVisible().catch(() => false) && await approveBtn.isEnabled().catch(() => false);
            if (!result.checks.approveButtonEnabled) {
                result.observations.push("OBSERVACIÓN (ACL): el botón 'Aprobar' no está habilitado para el admin en el panel.");
            }
            result.observations.push(`DATO: fila admin: proyecto origen visible=${rowText.includes(projectTitle) || rowText.includes(projectId)}.`);
        } else {
            result.observations.push(
                "FALLO INTERCONEXIÓN: la solicitud NO aparece en el panel 'Solicitudes de compra de repuestos' del admin.",
            );
        }
        await screenshot(adminPage, "05-panel-admin-pendiente");
    } else {
        result.observations.push("OBSERVACIÓN: el panel 'Solicitudes de compra de repuestos' no se renderizó para el admin.");
    }

    await tecnicoCtx.context.close();
    await adminCtx.context.close();

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    const resultsPath = path.resolve(artifactsDir, `e2e-lars-t07-results-${stamp}.json`);
    await fs.writeFile(resultsPath, JSON.stringify(result, null, 2));

    if (failedChecks.length > 0) {
        console.error("E2E_LARS_T07_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("E2E_LARS_T07_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `e2e-lars-t07-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch { /* ignore */ }
    try {
        const resultsPath = path.resolve(artifactsDir, `e2e-lars-t07-results-${stamp}.json`);
        await fs.writeFile(resultsPath, JSON.stringify(result, null, 2));
    } catch { /* ignore */ }
    console.error("E2E_LARS_T07_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
