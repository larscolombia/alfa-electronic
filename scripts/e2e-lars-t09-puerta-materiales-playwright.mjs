/**
 * e2e-lars-t09 — Puerta de materiales y paso a Reparacion (rol: Tecnico)
 *
 * Regla de negocio validada (backend/internal/projects/materials_gate.go):
 *  NO se puede mover un caso a "reparacion" con obligaciones de material
 *  abiertas (linea de compra sin recibir al 100%, reserva activa/vencida,
 *  solicitud de compra pendiente). SÍ se puede cuando todo llego.
 *
 * Escenario A (bloqueo): proyecto en "esperando-proveedor" con linea de compra
 *   abierta (received < quantity) -> mover a Reparacion por UI -> debe BLOQUEAR
 *   con mensaje explicativo visible (detail-save-error).
 * Escenario B (permiso): proyecto en "esperando-proveedor" con la linea de
 *   compra recibida al 100% -> mover a Reparacion por UI -> debe PERMITIR y
 *   la tarjeta llega a la columna Reparacion.
 *
 * Setup y verificaciones cruzadas por API (admin); las acciones de negocio
 * (mover el caso) 100% por UI con sesion de usuario Tecnico (sufijo t09).
 *
 * Salida: resumen en consola + playwright-artifacts/e2e-lars-t09-results.json
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const adminEmail = process.env.PW_ADMIN_EMAIL || "admin@alfa.com";
const adminPassword = process.env.PW_ADMIN_PASSWORD || "1234";
const techEmail = process.env.PW_TECH_EMAIL || "pw-tecnico-t09@alfa.local";
const techPassword = process.env.PW_TECH_PASSWORD || "Alfa2026!Pw";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const apiBaseUrl = (process.env.PW_API_BASE_URL || baseUrl).replace(/\/+$/, "");

const stamp = Date.now();
const projectBlockedId = `qa-t09-gate-bloqueado-${stamp}`;
const projectFreeId = `qa-t09-gate-libre-${stamp}`;
const referenceBlocked = `QA-T09-REP-BLOQ-${stamp}`;
const referenceFree = `QA-T09-REP-LIBRE-${stamp}`;
const shortBlocked = `QA-T09-A-${stamp}`;
const shortFree = `QA-T09-B-${stamp}`;

const consoleErrors = [];
const pageErrors = [];

const result = {
    test: "e2e-lars-t09-puerta-materiales",
    requirement: "Puerta de materiales: no entrar a Reparacion con materiales pendientes; si cuando todo llego",
    baseUrl,
    codes: {
        projectBlockedId,
        projectFreeId,
        referenceBlocked,
        referenceFree,
        shortBlocked,
        shortFree,
        purchaseLineBlockedId: "",
        purchaseLineFreeId: "",
        tecnicoUser: techEmail,
    },
    checks: {
        adminLoggedIn: false,
        tecnicoUserReady: false,
        tecnicoLoggedIn: false,
        projectBlockedCreated: false,
        lineBlockedCreated: false,
        projectFreeCreated: false,
        lineFreeCreated: false,
        lineFreeFullyReceived: false,
        boardLoadedAsTecnico: false,
        cardBlockedVisibleOnBoard: false,
        cardFreeVisibleOnBoard: false,
        caseA_detailOpened: false,
        caseA_moveAttempted: false,
        caseA_blockedWithMessage: false,
        caseA_messageMentionsMaterials: false,
        caseA_cardStaysInEsperando: false,
        caseA_statusUnchangedOnServer: false,
        caseB_detailOpened: false,
        caseB_moveAttempted: false,
        caseB_moveAllowed: false,
        caseB_cardInReparacion: false,
        caseB_statusReparacionOnServer: false,
    },
    evidence: {
        caseA_blockMessage: "",
        screenshots: {},
    },
    observations: [],
    consoleErrors,
    pageErrors,
    error: "",
};

let browser;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function apiFetch(token, method, urlPath, body) {
    const headers = { "Content-Type": "application/json", "X-Company-Id": companyId };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let payload = null;
    try {
        payload = await response.json();
    } catch {}
    return { status: response.status, payload };
}

async function login(email, password) {
    const { status, payload } = await apiFetch(null, "POST", "/api/v1/auth/login", { email, password });
    if (status !== 200 || !payload?.accessToken) {
        throw new Error(`login ${email} fallo: HTTP ${status} ${JSON.stringify(payload)}`);
    }
    return payload;
}

async function ensureTecnicoUser(adminToken) {
    const create = await apiFetch(adminToken, "POST", "/api/v1/users", {
        email: techEmail,
        password: techPassword,
        confirmPassword: techPassword,
        name: "PW Tecnico t09",
        role: "Técnico",
    });
    if (create.status === 201 || create.status === 200) return "created";
    if (create.status === 409) return "already-exists";
    // Algunos backends devuelven 400 con mensaje de duplicado en lugar de 409.
    const msg = JSON.stringify(create.payload || {});
    if (/existe|duplicate|ya/i.test(msg)) return "already-exists";
    throw new Error(`no se pudo crear usuario Tecnico: HTTP ${create.status} ${msg}`);
}

async function createProject(token, id, title, shortCode) {
    const { status, payload } = await apiFetch(token, "POST", "/api/v1/projects", {
        id,
        status: "esperando-proveedor",
        properties: {
            title,
            shortCode,
            boardId: "board-1",
            stageName: "Esperando proveedor",
            stageEnteredAt: new Date().toISOString(),
        },
    });
    if (status !== 201) {
        throw new Error(`crear proyecto ${id} fallo: HTTP ${status} ${JSON.stringify(payload)}`);
    }
    return payload;
}

async function createPurchaseLine(token, projectId, reference, quantity) {
    const { status, payload } = await apiFetch(token, "POST", "/api/v1/inventory/purchase-lines", {
        reference,
        component: `Componente QA t09 ${stamp}`,
        type: "repuesto",
        brand: "QA",
        description: `Linea de compra QA t09 ${stamp}`,
        supplier: "Proveedor QA t09",
        quantity,
        unitPrice: 10,
        neededBy: "2026-12-31",
        requestReason: `Puerta de materiales QA t09 ${stamp}`,
        projectId,
        equipmentTag: "",
    });
    if (status !== 201 || !payload?.item?.id) {
        throw new Error(`crear linea de compra para ${projectId} fallo: HTTP ${status} ${JSON.stringify(payload)}`);
    }
    return payload.item;
}

async function receivePurchaseLine(token, lineId, quantity) {
    const { status, payload } = await apiFetch(token, "POST", `/api/v1/inventory/purchase-lines/${lineId}/receive`, { quantity });
    if (status !== 200) {
        throw new Error(`recibir linea ${lineId} fallo: HTTP ${status} ${JSON.stringify(payload)}`);
    }
    return payload;
}

async function getProjectStatus(token, projectId) {
    const { status, payload } = await apiFetch(token, "GET", `/api/v1/projects/${encodeURIComponent(projectId)}`);
    if (status !== 200) return null;
    return { status: payload?.status ?? null, raw: payload };
}

async function getPurchaseLine(token, lineId) {
    const { status, payload } = await apiFetch(token, "GET", `/api/v1/inventory/purchase-lines?limit=200`);
    if (status !== 200 || !Array.isArray(payload?.items)) return null;
    return payload.items.find((item) => item.id === lineId) || null;
}

function cardInColumn(columnId, projectId) {
    return `.cards-sortable[data-column-id='${columnId}'] .project-drag-item[data-project-id='${projectId}']`;
}

async function shot(page, name) {
    const file = path.resolve(artifactsDir, `e2e-lars-t09-${name}-${stamp}.png`);
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await page.screenshot({ path: file, fullPage: false, timeout: 20000 });
            result.evidence.screenshots[name] = file;
            return file;
        } catch (err) {
            result.observations.push(
                `AVISO: screenshot ${name} intento ${attempt} fallo: ${String(err?.message || err).slice(0, 120)}`,
            );
            await page.waitForTimeout(1000);
        }
    }
    return "";
}

/** Intenta mover el caso abierto en el detalle a "Reparacion" y guardar. */
async function attemptMoveToReparacion(page) {
    const chip = page.locator(".project-detail-dialog .status-chip", { hasText: /^\s*Reparacion\s*$/ });
    await chip.first().waitFor({ state: "visible", timeout: 15000 });
    await chip.first().click();
    await page.waitForTimeout(800);

    // Si la transicion pide checklist/prompt de transicion, confirmarlo.
    const transitionModalConfirm = page.locator("app-project-transition-check-modal button", { hasText: /Confirmar transicion/i });
    if (await transitionModalConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await transitionModalConfirm.first().click();
        await page.waitForTimeout(800);
    }

    const saveBtn = page.locator(".project-detail-dialog__actions button", { hasText: /^\s*Guardar cambios\s*$/ });
    await saveBtn.first().waitFor({ state: "visible", timeout: 15000 });
    await saveBtn.first().click();
    await page.waitForTimeout(2500);
}

async function openCardDetail(page, projectId, titleHint) {
    const card = page.locator(cardInColumn("esperando-proveedor", projectId));
    await card.first().waitFor({ state: "visible", timeout: 30000 });
    if (titleHint) {
        const cardTitle = ((await card.first().innerText().catch(() => "")) || "").trim();
        if (!cardTitle.includes(titleHint)) {
            result.observations.push(`AVISO: la tarjeta ${projectId} no muestra el titulo esperado '${titleHint}' (texto: '${cardTitle.slice(0, 80)}').`);
        }
    }
    await card.first().click();
    try {
        await page.waitForFunction(
            () => (document.querySelector(".project-detail-dialog .project-detail-dialog__title")?.textContent?.trim() || "").length > 0,
            { timeout: 20000 },
        );
    } catch (openError) {
        const debugUrl = page.url();
        const dialogCount = await page.locator(".project-detail-dialog").count();
        const shellCount = await page.locator(".project-detail-shell").count();
        const bodyPreview = ((await page.locator("body").innerText().catch(() => "")) || "").slice(0, 400);
        await shot(page, `open-detail-failed-${projectId.slice(0, 24)}`);
        throw new Error(
            `El detalle no abrio para ${projectId}. url=${debugUrl} dialogs=${dialogCount} shells=${shellCount} `
            + `body='${bodyPreview.replace(/\n+/g, " | ")}' causa=${String(openError?.message || openError).slice(0, 200)}`,
        );
    }
    await page.waitForTimeout(800);
}

try {
    // ── SETUP por API (admin) ────────────────────────────────────────────────
    const adminSession = await login(adminEmail, adminPassword);
    result.checks.adminLoggedIn = true;

    const techState = await ensureTecnicoUser(adminSession.accessToken);
    result.checks.tecnicoUserReady = true;
    result.observations.push(`Usuario Tecnico ${techEmail}: ${techState}.`);

    const techSession = await login(techEmail, techPassword);
    result.checks.tecnicoLoggedIn = true;
    result.observations.push(`Login Tecnico OK (rol en respuesta: ${techSession.role || techSession.user?.role || "n/d"}).`);

    await createProject(adminSession.accessToken, projectBlockedId, `QA t09 GATE bloqueado ${stamp}`, shortBlocked);
    result.checks.projectBlockedCreated = true;

    const lineBlocked = await createPurchaseLine(adminSession.accessToken, projectBlockedId, referenceBlocked, 2);
    result.checks.lineBlockedCreated = true;
    result.codes.purchaseLineBlockedId = lineBlocked.id;

    await createProject(adminSession.accessToken, projectFreeId, `QA t09 GATE libre ${stamp}`, shortFree);
    result.checks.projectFreeCreated = true;

    const lineFree = await createPurchaseLine(adminSession.accessToken, projectFreeId, referenceFree, 1);
    result.checks.lineFreeCreated = true;
    result.codes.purchaseLineFreeId = lineFree.id;

    await receivePurchaseLine(adminSession.accessToken, lineFree.id, 1);
    const lineFreeAfter = await getPurchaseLine(adminSession.accessToken, lineFree.id);
    result.checks.lineFreeFullyReceived = Number(lineFreeAfter?.receivedQuantity ?? lineFreeAfter?.received_quantity ?? -1) >= 1;
    if (!result.checks.lineFreeFullyReceived) {
        result.observations.push("FALLO SETUP: la linea libre no quedo recibida al 100%: " + JSON.stringify(lineFreeAfter));
    }
    const lineBlockedAfter = await getPurchaseLine(adminSession.accessToken, lineBlocked.id);
    result.observations.push(
        `Interconexion inventario: linea bloqueada ${lineBlocked.id} estado=${lineBlockedAfter?.status} recibidas=${lineBlockedAfter?.receivedQuantity ?? lineBlockedAfter?.received_quantity ?? "n/d"}/${lineBlockedAfter?.quantity}; linea libre recibidas=${lineFreeAfter?.receivedQuantity ?? lineFreeAfter?.received_quantity ?? "n/d"}/${lineFreeAfter?.quantity}.`,
    );

    // ── UI con sesion de Tecnico ─────────────────────────────────────────────
    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        { authSession: { ...techSession, expiresAt: Date.now() + 3600 * 1000 }, apiBase: apiBaseUrl },
    );

    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(pageErrors, err?.stack || err?.message || String(err)));
    page.on("response", (res) => {
        if (res.status() === 403) pushUnique(result.observations, `HTTP 403 en recurso: ${res.url()}`);
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
        await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "networkidle", timeout: timeoutMs }).catch(() => {});
        result.checks.boardLoadedAsTecnico = await page
            .waitForSelector(".kanban-board", { state: "visible", timeout: 60000 })
            .then(() => true)
            .catch(() => false);
        if (result.checks.boardLoadedAsTecnico) break;
        result.observations.push(`AVISO: tablero no visible tras intento ${attempt} de carga; se recarga la pagina.`);
        await page.waitForTimeout(3000);
    }
    if (!result.checks.boardLoadedAsTecnico) {
        const bodyText = ((await page.locator("body").innerText().catch(() => "")) || "").slice(0, 300);
        result.observations.push(`ACL/UX: el tablero de proyectos NO cargo con rol Tecnico. Texto visible: ${bodyText}`);
        await shot(page, "board-not-loaded-tecnico");
        throw new Error("Tablero /app/work-projects no visible para rol Tecnico.");
    }

    await page
        .locator(cardInColumn("esperando-proveedor", projectBlockedId))
        .first()
        .waitFor({ state: "visible", timeout: 45000 })
        .catch(() => {});
    await page
        .locator(cardInColumn("esperando-proveedor", projectFreeId))
        .first()
        .waitFor({ state: "visible", timeout: 45000 })
        .catch(() => {});

    result.checks.cardBlockedVisibleOnBoard = (await page.locator(cardInColumn("esperando-proveedor", projectBlockedId)).count()) === 1;
    result.checks.cardFreeVisibleOnBoard = (await page.locator(cardInColumn("esperando-proveedor", projectFreeId)).count()) === 1;
    await shot(page, "board-both-cards-esperando");

    // ── CASO A: linea de compra abierta -> BLOQUEO ──────────────────────────
    await openCardDetail(page, projectBlockedId, "GATE bloqueado");
    result.checks.caseA_detailOpened = true;
    await shot(page, "casoA-detalle-antes-de-mover");

    await attemptMoveToReparacion(page);
    result.checks.caseA_moveAttempted = true;

    const errorBox = page.locator("[data-testid='detail-save-error']");
    result.checks.caseA_blockedWithMessage = await errorBox.isVisible({ timeout: 15000 }).catch(() => false);
    if (result.checks.caseA_blockedWithMessage) {
        result.evidence.caseA_blockMessage = ((await errorBox.innerText().catch(() => "")) || "").trim();
        result.checks.caseA_messageMentionsMaterials = /materiales pendientes/i.test(result.evidence.caseA_blockMessage)
            && /linea de compra abierta|reserva|solicitud/i.test(result.evidence.caseA_blockMessage);
    }
    await shot(page, "casoA-bloqueo-mensaje");

    await page.locator(".project-detail-dialog__actions button", { hasText: /^\s*Cancelar\s*$/ }).first().click().catch(() => {});
    await page.waitForTimeout(1500);

    result.checks.caseA_cardStaysInEsperando = (await page.locator(cardInColumn("esperando-proveedor", projectBlockedId)).count()) === 1
        && (await page.locator(cardInColumn("reparacion", projectBlockedId)).count()) === 0;
    const serverA = await getProjectStatus(adminSession.accessToken, projectBlockedId);
    result.checks.caseA_statusUnchangedOnServer = serverA?.status === "esperando-proveedor";
    await shot(page, "casoA-sigue-en-esperando");

    // ── CASO B: todo recibido -> PERMITE ─────────────────────────────────────
    await openCardDetail(page, projectFreeId, "GATE libre");
    result.checks.caseB_detailOpened = true;

    await attemptMoveToReparacion(page);
    result.checks.caseB_moveAttempted = true;
    await page.waitForTimeout(2000);

    const dialogStillOpen = await page.locator(".project-detail-dialog.is-open").isVisible().catch(() => false);
    if (dialogStillOpen) {
        const detailError = ((await page.locator("[data-testid='detail-save-error']").innerText().catch(() => "")) || "").trim();
        if (detailError) {
            result.observations.push(`FALLO Caso B: el movimiento permitido fue rechazado por la UI/servidor: ${detailError}`);
        }
        await shot(page, "casoB-detalle-tras-guardar");
        await page.locator(".project-detail-dialog__actions button", { hasText: /^\s*Cancelar\s*$/ }).first().click().catch(() => {});
        await page.waitForTimeout(1200);
    }

    result.checks.caseB_cardInReparacion = (await page.locator(cardInColumn("reparacion", projectFreeId)).count()) === 1;
    const serverB = await getProjectStatus(adminSession.accessToken, projectFreeId);
    result.checks.caseB_statusReparacionOnServer = serverB?.status === "reparacion";
    result.checks.caseB_moveAllowed = result.checks.caseB_cardInReparacion && result.checks.caseB_statusReparacionOnServer;
    await shot(page, "casoB-en-columna-reparacion");

    // ── Resumen ──────────────────────────────────────────────────────────────
    const failed = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failed.length) {
        result.observations.push(`Checks no aprobados: ${failed.map(([k]) => k).join(", ")}`);
    }

    const resultsPath = path.resolve(artifactsDir, `e2e-lars-t09-results-${stamp}.json`);
    await fs.writeFile(resultsPath, JSON.stringify(result, null, 2));

    console.log("E2E_LARS_T09_COMPLETED");
    console.log(JSON.stringify({ checks: result.checks, codes: result.codes, evidence: result.evidence, observations: result.observations, resultsPath }, null, 2));
    if (failed.length) process.exitCode = 1;
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        const pageRef = browser?.contexts()?.[0]?.pages()?.[0];
        if (pageRef) await shot(pageRef, "fatal-error");
    } catch {}
    try {
        const resultsPath = path.resolve(artifactsDir, `e2e-lars-t09-results-${stamp}.json`);
        await fs.writeFile(resultsPath, JSON.stringify(result, null, 2));
    } catch {}
    console.error("E2E_LARS_T09_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
