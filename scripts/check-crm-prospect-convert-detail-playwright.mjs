/**
 * CRM — "Convertir a cliente" desde la ficha del prospecto (pestaña Acciones comerciales).
 *
 * Valida el flujo completo como usuario real (UI, modo no-headless opcional):
 *   1. Botón visible en la barra de acciones de "Acciones comerciales".
 *   2. Modal de confirmación: un clic DENTRO no lo cierra; Cancelar sí.
 *   3. Confirmar → banner de éxito (rama created=true) y el prospecto deja de
 *      aparecer en la lista (soft delete); queda exactamente 1 cliente para esa empresa.
 *   4. Segundo prospecto de la MISMA empresa: confirmar → rama idempotente
 *      (created=false, "vinculado sin duplicar") y SIGUE habiendo 1 solo cliente.
 *
 * Los prospectos de prueba se crean por UI con nombre/empresa únicos (<timestamp>)
 * para no pisar datos reales; al convertirse salen del listado (comportamiento
 * esperado del producto), igual que hace e2e-com05-conversion-idempotente.
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const apiOrigin = (process.env.PW_API_ORIGIN || baseUrl).replace(/\/+$/, "");
const email = process.env.PW_USER_EMAIL || "admin@alfa.com";
const password = process.env.PW_USER_PASSWORD || "1234";
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const timeout = Number(process.env.PW_TIMEOUT_MS || "30000");
const uniq = Date.now().toString(36);

const artifacts = path.resolve("playwright-artifacts/crm-convert-detail");
const result = {
    baseUrl,
    company: `ConvDet ${uniq}`,
    prospectA: "",
    prospectB: "",
    checks: {},
    clientCountAfterFirst: 0,
    clientCountAfterSecond: 0,
    error: "",
};

async function api(sessionToken, urlPath, init = {}) {
    const res = await fetch(`${apiOrigin}${urlPath}`, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
    });
    let body;
    try { body = await res.json(); } catch { body = null; }
    return { status: res.status, body };
}

async function capture(page, step) {
    try {
        const file = path.join(artifacts, `${step}.png`);
        await page.screenshot({ path: file });
    } catch { /* no bloqueante */ }
}

function pause(page, ms = 500) { return page.waitForTimeout(ms); }

let browser;
try {
    const loginRes = await fetch(`${apiOrigin}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) throw new Error(`Login falló (${loginRes.status}) — ver credenciales`);
    const login = await loginRes.json();
    const session = { ...login, expiresAt: Date.now() + (login.expiresIn || 3600) * 1000 };
    const token = session.accessToken;

    browser = await chromium.launch({ headless });
    const page = await (await browser.newContext({ viewport: { width: 1540, height: 980 } })).newPage();
    page.on("pageerror", (e) => console.error("[PAGEERROR]", e.message.slice(0, 200)));
    await page.addInitScript(({ s, url }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(s));
        localStorage.setItem("pika.apiBaseUrl", url);
    }, { s: session, url: apiOrigin });

    // ── Helper: crear prospecto por UI (empresa + NIT; el nombre del prospecto es la empresa) ──
    async function createProspectViaUi(company, nit) {
        await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded", timeout });

        const addBtn = page.locator("button", { hasText: /Agregar\s+Prospecto/i }).first();
        await addBtn.waitFor({ state: "visible", timeout });
        await addBtn.click();

        const companyInput = page.locator('input[name="formCompania"]');
        await companyInput.waitFor({ state: "visible", timeout });
        await companyInput.fill(company);

        // NIT obligatorio con formato \d+-\d+ (isValidNit en el componente).
        const nitInput = page.locator('input[name="formNit"]');
        await nitInput.waitFor({ state: "visible", timeout });
        await nitInput.fill(nit);

        const saveBtn = page.locator("[data-testid='prospect-save-btn']");
        await saveBtn.waitFor({ state: "visible", timeout });
        if (!(await saveBtn.isEnabled().catch(() => false))) {
            throw new Error(`El botón de guardar prospecto quedó deshabilitado tras llenar empresa y NIT (empresa='${company}', nit='${nit}')`);
        }
        await saveBtn.click();

        // Si la empresa ya existe como cliente/prospecto, el guardado se detiene en el modal
        // de duplicados: confirmamos "Crear de todos modos" (flujo esperado del producto).
        const dupModal = page.locator(".modal-dialog", { hasText: /Posible duplicado detectado/i });
        if (await dupModal.waitFor({ state: "visible", timeout: 4000 }).then(() => true).catch(() => false)) {
            result.checks.duplicateModalHandled = true;
            await pause(page, 300);
            await page.locator("button", { hasText: /Crear de todos modos/i }).first().click();
        }

        // Polling por API hasta que el prospecto exista (nombre === empresa; desambiguamos por NIT si hay varios).
        const deadline = Date.now() + 15000;
        let found = null;
        while (!found && Date.now() < deadline) {
            const { status, body } = await api(token, `/api/v1/crm/prospects?search=${encodeURIComponent(company)}`);
            if (status === 200) {
                const items = Array.isArray(body) ? body : (body?.items ?? []);
                const byName = items.filter((p) => String(p?.nombre ?? p?.name ?? "").trim().toLowerCase() === company.trim().toLowerCase());
                found = byName.find((p) => nit && String(p?.nit ?? "").replace(/\D/g, "") === nit.replace(/\D/g, ""))
                    || (byName.length >= 1 ? byName[0] : null);
            }
            if (!found) await pause(page, 400);
        }

        if (!found?.id && !found?.backendId) {
            const errEl = page.locator(".alert-danger").first();
            const detail = (await errEl.textContent().catch(() => "")) || "";
            throw new Error(`El prospecto '${company}' no quedó creado tras guardarlo por UI${detail ? ` → "${detail.trim()}"` : ""}`);
        }
        return { id: String(found.backendId ?? found.id), nombre: String(found.nombre ?? found.name ?? company) };
    }

    // ── Helper: convertir desde la ficha (pestaña Acciones comerciales) ───────
    async function convertFromDetail(prospectId, name) {
        await page.goto(`${baseUrl}/app/crm-prospectos/${prospectId}`, { waitUntil: "domcontentloaded", timeout });
        const tab = page.getByRole("tab", { name: /Acciones comerciales/i }).first();
        await tab.waitFor({ state: "visible", timeout });
        await tab.click();
        await pause(page, 900);

        const convertBtn = page.locator("[data-testid='convert-to-client-btn']").first();
        if (!(await convertBtn.isVisible({ timeout: 15000 }).catch(() => false))) {
            throw new Error(`Botón "Convertir a cliente" no visible en Acciones comerciales (${name})`);
        }
        await capture(page, `btn-visible-${name}`);
        await convertBtn.click();

        const modal = page.locator(".modal-dialog", { hasText: /Convertir a cliente/i });
        await modal.waitFor({ state: "visible", timeout });
        result.checks[`modalOpens_${name}`] = true;
        await capture(page, `modal-${name}`);

        // Regresión de backdrop: clic DENTRO no cierra.
        if (name === "A") {
            await modal.locator("h5.modal-title").click({ timeout: 5000 }).catch(() => {});
            await pause(page, 300);
            if ((await page.locator('.modal-dialog', { hasText: /Convertir a cliente/i }).count()) === 0) {
                throw new Error("Regresión: un clic dentro del modal de conversión lo cerró");
            }
            result.checks.backdropInsideClickNoClose = true;
            // Cancelar sí cierra.
            await page.locator(".modal-footer .btn-link", { hasText: /Cancelar/i }).first().click({ timeout: 5000 });
            await pause(page, 400);
            if ((await page.locator('.modal-dialog', { hasText: /Convertir a cliente/i }).count()) !== 0) {
                throw new Error("El botón Cancelar no cerró el modal de conversión");
            }
            result.checks.cancelClosesModal = true;
            // Reabrir para confirmar.
            await page.locator("[data-testid='convert-to-client-btn']").first().click();
            await page.locator(".modal-dialog", { hasText: /Convertir a cliente/i }).waitFor({ state: "visible", timeout });
        }

        const confirmBtn = page.locator("[data-testid='confirm-convert-to-client-btn']").first();
        await confirmBtn.click({ timeout: 5000 });
        const banner = page.locator("[data-testid='convert-result-banner'] .alert-success");
        await banner.waitFor({ state: "visible", timeout: 20000 });
        const bannerText = (await banner.textContent()) || "";
        result.checks[`successBanner_${name}`] = true;
        result[`${name}Banner`] = bannerText.trim();
        await capture(page, `banner-${name}`);

        // El prospecto debe dejar de aparecer en la lista (soft delete) — se verifica por ID.
        const { status: st2, body: b2 } = await api(token, `/api/v1/crm/prospects?search=${encodeURIComponent(result.company)}`);
        const items2 = Array.isArray(b2) ? b2 : (b2?.items ?? []);
        result.checks[`removedFromList_${name}`] = st2 === 200 && !items2.some((p) => String(p?.id ?? p?.backendId ?? "") === prospectId);

        // Clientes para esa empresa: exactamente uno, siempre.
        const { status: cst, body: cbody } = await api(token, "/api/v1/crm/clients?limit=500");
        if (cst !== 200) throw new Error(`GET clients falló (${cst})`);
        const allClients = Array.isArray(cbody) ? cbody : (cbody?.items ?? []);
        const forCompany = allClients.filter((c) => {
            const k = result.company.trim().toLowerCase();
            return String(c?.empresa ?? "").trim().toLowerCase() === k || String(c?.nombre ?? "").trim().toLowerCase() === k;
        });
        if (forCompany.length !== 1) throw new Error(`Se esperaba EXACTAMENTE 1 cliente para '${result.company}', hay ${forCompany.length}`);
        return forCompany[0];
    }

    // ── Escenario A: primera conversión (created=true) ────────────────────────
    const nitA = `9${String(Date.now()).slice(1, 8)}-7`; // formato \d+-\d+ válido
    const createdA = await createProspectViaUi(result.company, nitA);
    result.prospectA = createdA.id;
    await convertFromDetail(createdA.id, "A");
    if (!/se convirtió en cliente correctamente/i.test(result.ABanner || "")) {
        throw new Error(`Rama created=true: banner inesperado → "${result.ABanner}"`);
    }
    result.checks.firstConversionCreated = true;
    result.clientCountAfterFirst = 1;

    // ── Escenario B: MISMA empresa (created=false, idempotente) ───────────────
    // Al existir ya un cliente para la empresa, el alta dispara el modal de duplicados
    // y se confirma con "Crear de todos modos" — flujo real del producto.
    const nitB = `8${String(Date.now()).slice(1, 8)}-7`;
    const createdB = await createProspectViaUi(result.company, nitB);
    result.prospectB = createdB.id;
    await convertFromDetail(createdB.id, "B");
    if (!/sin duplicar datos|vinculado/i.test(result.BBanner || "")) {
        throw new Error(`Rama created=false: banner inesperado → "${result.BBanner}"`);
    }
    result.checks.secondConversionLinkedNoDuplicate = true;
    result.clientCountAfterSecond = 1;

} catch (error) {
    result.error = String(error?.stack || error);
    const page = browser?.contexts()?.[0]?.pages()?.[0];
    if (page) await capture(page, "99-error");
} finally {
    if (browser) await browser.close();
}

await fs.mkdir(artifacts, { recursive: true }).catch(() => {});
await fs.writeFile(path.join(artifacts, `result-${Date.now()}.json`), JSON.stringify(result, null, 2)).catch(() => {});
console.log(JSON.stringify(result, null, 2));

const pass = !result.error
    && result.checks.modalOpens_A === true
    && result.checks.backdropInsideClickNoClose === true
    && result.checks.cancelClosesModal === true
    && result.checks.successBanner_A === true
    && result.checks.firstConversionCreated === true
    && result.checks.removedFromList_A === true
    && result.checks.successBanner_B === true
    && result.checks.secondConversionLinkedNoDuplicate === true
    && result.checks.removedFromList_B === true
    && result.clientCountAfterFirst === 1
    && result.clientCountAfterSecond === 1;
process.exit(pass ? 0 : 1);
