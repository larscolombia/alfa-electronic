/**
 * Helpers compartidos para la suite Playwright de edge cases Compras/Repuestos
 * (Fase 1: solicitud → compras → BOM; Fase 2: recepción → posiciones 11↔01).
 *
 * Reglas fijas de la suite (pedido del usuario):
 *  - Cada caso inicia SIEMPRE desde el login por UI (/auth/signin).
 *  - Pausa de 0.3 s entre cada interacción/clic para poder observar paso a paso.
 *  - Headless=false por defecto; screenshots por paso + JSON final de evidencia.
 *
 * Los fixtures (proyectos, referencias, líneas) se crean por API con códigos
 * únicos por corrida (sufijo timestamp) para no contaminar datos previos; las
 * ACCIONES del caso se ejercitan siempre por UI y se verifican cruzando API.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

export const cfg = {
    baseUrl: (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/+$/, ""),
    companyId: process.env.PW_COMPANY_ID || "demo-company",
    userEmail: process.env.PW_USER_EMAIL || "admin@alfa.com",
    userPassword: process.env.PW_USER_PASSWORD || "1234",
    timeoutMs: Number(process.env.PW_TIMEOUT_MS || "120000"),
    // headless=false por defecto (el usuario quiere ver la ejecución).
    headless: ["true", "1", "yes"].includes(String(process.env.PW_HEADLESS || "").toLowerCase()),
    stepDelayMs: Math.max(50, Number(process.env.PW_STEP_DELAY_MS || "300")),
};

/**
 * Base de la API. En producción es same-origin; en local el frontend (:4200)
 * apunta a :8080 (localStorage 'pika.apiBaseUrl'), por eso el default local
 * usa ese puerto. Sobrescribible con PW_API_BASE_URL.
 */
export const apiBaseUrl = () => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    let origin;
    try { origin = new URL(cfg.baseUrl).origin; } catch { origin = cfg.baseUrl; }
    const localDevFrontends = [":4200", ":3000", ":8081"];
    if (localDevFrontends.some((port) => origin.endsWith(port))) {
        return process.env.PW_LOCAL_API || "http://127.0.0.1:8080";
    }
    return origin;
};

// ─────────────────────────────────────────────── Pausa / evidencia ──────────

/** 0.3 s entre cada interacción (requisito de observación paso a paso). */
export const pause = (page) => page.waitForTimeout(cfg.stepDelayMs);

let artifactsBase = "";
export function setArtifactsDir(dir) {
    artifactsBase = path.resolve(dir);
}
export default function getArtifactsDir() {
    return artifactsBase || path.resolve("playwright-artifacts/fase12");
}

/** Screenshot fullPage nombrado por caso y paso. Devuelve la ruta guardada. */
export async function shot(page, caseId, stamp, stepName) {
    const dir = getArtifactsDir();
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${stamp}-${caseId}-${stepName}.png`);
    await page.screenshot({ path: file, fullPage: true }).catch(() => {});
    return file;
}

/** Pausa + captura en un solo paso (usar tras cada acción significativa). */
export async function step(page, caseId, stamp, stepName) {
    await pause(page);
    const file = await shot(page, caseId, stamp, stepName);
    return file;
}

// ─────────────────────────────────────────────── API base ──────────────────

function assertSession(session, label) {
    if (!session || !session.accessToken) {
        throw new Error(`Sesión API inválida para ${label}; ejecuta apiLogin() primero.`);
    }
}

export async function apiLogin(email = cfg.userEmail, password = cfg.userPassword) {
    if (!email || !password) throw new Error("apiLogin requiere email y password.");
    const res = await fetch(`${apiBaseUrl()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": cfg.companyId },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`Login API falló (${res.status}): ${await res.text().catch(() => "")}`);
    return await res.json();
}

/** Llamada genérica. Devuelve { status, payload } sin lanzar en errores HTTP (el caso decide). */
export async function api(session, method, p, body) {
    assertSession(session, "api()");
    const headers = { "X-Company-Id": cfg.companyId, Authorization: `Bearer ${session.accessToken}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(`${apiBaseUrl()}${p}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let payload = {};
    try { payload = await res.json(); } catch { /* respuestas sin cuerpo */ }
    return { status: res.status, payload };
}

export const apiGet = (s, p) => api(s, "GET", p);
export const apiPost = (s, p, b = {}) => api(s, "POST", p, b);
export const apiPut = (s, p, b = {}) => api(s, "PUT", p, b);

const asArray = (data) => (Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);

// ─────────────────────────────── Fixtures por API (datos únicos) ──────────

export async function findReference(session, code) {
    const items = asArray(await apiGet(session, "/api/v1/inventory/references").then((r) => r.payload));
    return items.find((it) => String(it?.reference ?? it?.code ?? "").toLowerCase() === String(code).toLowerCase()) || null;
}

export async function createReference(session, code, opts = {}) {
    const existing = await findReference(session, code);
    if (existing) return { status: 200, payload: existing, existed: true };
    const body = {
        reference: code,
        designation: opts.designation || `Referencia QA ${code}`,
        brand: opts.brand || "QA-Brand",
        unitMeasure: "unidad",
        minStock: 0,
        targetStock: Number(opts.targetStock ?? 5),
    };
    return await apiPost(session, "/api/v1/inventory/references", body);
}

export async function getProject(session, id) {
    const r = await apiGet(session, `/api/v1/projects/${encodeURIComponent(id)}`);
    if (r.status !== 200) throw new Error(`GET /projects/${id} falló (${r.status}): ${JSON.stringify(r.payload).slice(0, 200)}`);
    return r.payload;
}

export async function createProject(session, { id, status = "pedir-repuestos", title, shortCode, extraProps = {} }) {
    if (!id || !title) throw new Error("createProject requiere id y properties.title.");
    const body = {
        id,
        status,
        properties: {
            title,
            shortCode: shortCode || `EQ-${id.slice(-12).toUpperCase()}`,
            client: "Cliente QA Playwright",
            ...extraProps,
        },
    };
    const r = await apiPost(session, "/api/v1/projects", body);
    if (r.status !== 201 && r.status !== 200) {
        throw new Error(`POST /projects (${id}) falló (${r.status}): ${JSON.stringify(r.payload).slice(0, 200)}`);
    }
    return r.payload;
}

/** Intenta mover un proyecto a otro estado (PUT upsert). Devuelve { status, payload }. */
export async function moveProjectApi(session, id, toStatus, properties = {}) {
    const current = await getProject(session, id);
    const mergedProperties = { ...(current?.properties ?? {}), ...properties };
    return await apiPut(session, `/api/v1/projects/${encodeURIComponent(id)}`, { id, status: toStatus, properties: mergedProperties });
}

export async function listPurchaseLines(session) {
    const r = await apiGet(session, "/api/v1/inventory/purchase-lines");
    if (r.status !== 200) throw new Error(`GET /purchase-lines falló (${r.status}).`);
    return asArray(r.payload);
}

export async function findPurchaseLine(session, reference) {
    const items = await listPurchaseLines(session);
    return items.find((it) => String(it?.reference ?? "").toLowerCase() === String(reference).toLowerCase()) || null;
}

export async function createPurchaseLine(session, payload) {
    if (!payload?.reference) throw new Error("createPurchaseLine requiere reference.");
    const body = {
        component: "Repuesto QA",
        type: "Electronico",
        brand: "QA-Brand",
        description: `Línea QA ${payload.reference}`,
        supplier: "Mouser",
        quantity: 1,
        unitPrice: 0,
        neededBy: "5",
        requestReason: `Creada por fixture Playwright (${payload.requestReason || "QA"})`,
        projectId: "",
        equipmentTag: "",
        ...payload,
    };
    const r = await apiPost(session, "/api/v1/inventory/purchase-lines", body);
    if (r.status !== 201 && r.status !== 200) {
        throw new Error(`POST /purchase-lines (${payload.reference}) falló (${r.status}): ${JSON.stringify(r.payload).slice(0, 200)}`);
    }
    return r.payload;
}

export async function listPurchaseRequests(session) {
    const r = await apiGet(session, "/api/v1/inventory/purchase-requests");
    if (r.status !== 200) throw new Error(`GET /purchase-requests falló (${r.status}).`);
    return asArray(r.payload);
}

export async function findPurchaseRequest(session, reference) {
    const items = await listPurchaseRequests(session);
    return items.find((it) => String(it?.reference ?? "").toLowerCase() === String(reference).toLowerCase()) || null;
}

export async function createPurchaseRequest(session, payload) {
    if (!payload?.reference) throw new Error("createPurchaseRequest requiere reference.");
    const body = {
        description: "Solicitud QA Playwright",
        quantity: 1,
        supplier: "Mouser",
        estimatedCost: 1000,
        leadTimeDays: 2,
        urgency: "normal",
        memo: `Fixture ${payload.reference}`,
        projectId: "",
        equipmentTag: "",
        ...payload,
    };
    const r = await apiPost(session, "/api/v1/inventory/purchase-requests", body);
    if (r.status !== 201 && r.status !== 200) {
        throw new Error(`POST /purchase-requests (${payload.reference}) falló (${r.status}): ${JSON.stringify(r.payload).slice(0, 200)}`);
    }
    return r.payload;
}

export async function listMovements(session) {
    const r = await apiGet(session, "/api/v1/inventory/movements");
    if (r.status !== 200) return [];
    return asArray(r.payload);
}

// ─────────────────────────────── Navegador + login por UI ──────────────────

/**
 * Lanza el navegador con diálogos auto-aceptados, viewport fijo y captura de
 * errores de consola/pageerror. El cierre se gestiona por el script llamador.
 */
export async function launchBrowser() {
    const browser = await chromium.launch({ headless: cfg.headless, slowMo: 0 });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 }, acceptDownloads: true });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const pushUnique = (target, text) => {
        const value = String(text || "").trim();
        if (!value || target.includes(value) || target.length >= 20) return;
        target.push(value);
    };
    page.on("dialog", (dialog) => { void dialog.accept().catch(() => {}); });
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(pageErrors, err?.message || String(err)));
    return { browser, context, page, consoleErrors, pageErrors };
}

/**
 * Login REAL por UI desde /auth/signin (requisito: toda prueba arranca aquí).
 * Pausa de 0.3 s entre cada interacción para observación paso a paso.
 */
export async function uiLogin(page, { email = cfg.userEmail, password = cfg.userPassword } = {}) {
    await page.goto(`${cfg.baseUrl}/auth/signin`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const emailField = page.locator("#emailadd");
    const passField = page.locator("#passwd");
    if (!(await emailField.isVisible({ timeout: 15000 }).catch(() => false))) {
        throw new Error("El formulario de login no está visible (#emailadd).");
    }
    await emailField.fill(email); await pause(page);
    await passField.fill(password); await pause(page);
    await page.locator("form.auth-form button[type='submit']").click(); await pause(page);
    await page.waitForURL((url) => url.href.includes("/app"), { timeout: cfg.timeoutMs });
}
