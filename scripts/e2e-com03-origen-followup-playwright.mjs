/**
 * COMERCIAL · CASO — COM-03
 * "Prospecto contacta por web, WhatsApp o recomendación → Debe conservarse el
 * origen y enviarse el formato de recepción + condiciones por canal trazable" (MD §1).
 *
 * Regla ejercitada:
 *   1. El prospecto se crea con ORIGEN explícito ("Formulario web") y ese dato
 *      persiste en la API tras recargar.
 *   2. La acción comercial de seguimiento se registra por canal concreto
 *      ("Whatsapp de seguimiento" / "Correo de seguimiento") con fecha y hora,
 *      y queda trazable en la ficha (tipo + fecha + hora persistidos).
 *
 * Flujo: LOGIN UI → /app/crm-prospectos → Agregar Prospecto (origen web)
 *   → detalle del prospecto → Nueva accion comercial (Whatsapp de seguimiento)
 *   → verificación cruzada por API.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import {
    cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin, setArtifactsDir, apiGet,
} from "./e2e-compr-helpers.mjs";

const CASE = "com03-origen-followup";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/comercial");

const company = `COM03 Empresa Industrial ${stamp}`;
const contactName = `Contacto COM03 ${stamp}`;

const result = {
    case: CASE,
    ids: ["COM-03"],
    requirement: "El origen del lead (web) se conserva y la acción de seguimiento queda registrada por canal trazable con fecha/hora.",
    data: { company },
    checks: {
        loginUi: false,
        prospectCreatedWithSource: false,
        sourcePersistedAfterReload: false,
        followupChannelSavedViaUi: false,
        followupTracedInApi: false,
        secondChannelEmailTraced: false,
        timelineShowsBothActions: false,
    },
    observations: [],
    error: "",
};

let browser;
try {
    const session = await apiLogin();
    const ctx = await launchBrowser();
    browser = ctx.browser;
    const { page } = ctx;

    // ── Paso 1: LOGIN por UI (toda prueba arranca aquí) ─────────────────────
    await uiLogin(page, {});
    result.checks.loginUi = true;
    await step(page, CASE, stamp, "01-login-completado");

    // ── Paso 2: Crear prospecto con origen 'Formulario web' por UI ──────────
    await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const addBtn = page.locator("button", { hasText: /Agregar\s+Prospecto/ }).first();
    if (!(await addBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Agregar Prospecto' no es visible en /app/crm-prospectos.");
    await addBtn.click(); await pause(page);

    const nameInput = page.locator('input[name="formNombre"]');
    if (!(await nameInput.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El formulario de prospecto no se abrió (campo nombre no visible).");
    await nameInput.fill(contactName); await pause(page);

    // COM-03 exige empresa: saveCommercialAction rechaza sin companyName y el
    // modal queda abierto (causa raíz del fallo previo). Se crea el prospecto
    // CON empresa por UI para poder registrar la acción comercial.
    const companyInput = page.locator('input[name="formCompania"]');
    if (!(await companyInput.isVisible({ timeout: 15000 }).catch(() => false))) throw new Error("El campo empresa (formCompania) no existe en el formulario de prospecto.");
    await companyInput.fill(company); await pause(page);

    const sourceSelect = page.locator('select[name="formFuente"]');
    if (!(await sourceSelect.isVisible({ timeout: 15000 }).catch(() => false))) throw new Error("El selector de origen (formFuente) no existe en el formulario.");
    await sourceSelect.selectOption({ label: "Formulario web" }); await pause(page);

    const saveBtn = page.locator("[data-testid='prospect-save-btn']");
    if (!(await saveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón de guardar prospecto no es visible.");
    await saveBtn.click(); await pause(page);

    // Verificación API: el prospecto existe con source='Formulario web'.
    // (la lista por defecto trae un límite y NO garantiza incluir el recién creado → uso ?search=)
    const uniq = String(stamp).slice(-9);
    const { status: searchStatus, payload: searchPayload } = await apiGet(session, `/api/v1/crm/prospects?search=${encodeURIComponent(uniq)}`);
    if (searchStatus !== 200) throw new Error(`GET prospects?search falló (${searchStatus}): ${JSON.stringify(searchPayload).slice(0, 200)}`);
    const items = Array.isArray(searchPayload) ? searchPayload : (searchPayload?.items ?? []);
    let prospect = items.find((p) => String(p?.nombre ?? p?.name ?? "").includes(uniq) && String(p?.nombre ?? p?.name ?? "").includes("COM03"));
    if (!prospect) throw new Error(`El prospecto '${contactName}' no aparece en GET /crm/prospects tras guardarlo por UI.`);
    result.checks.prospectCreatedWithSource = true;

    await page.reload({ waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const { status: getProspectStatus, payload: afterReload } = await apiGet(session, `/api/v1/crm/prospects/${encodeURIComponent(prospect.id)}`);
    if (getProspectStatus !== 200) throw new Error(`GET prospecto falló (${getProspectStatus}): ${JSON.stringify(afterReload).slice(0, 200)}`);
    result.checks.sourcePersistedAfterReload = String(afterReload?.source ?? "").trim() === "Formulario web";
    if (!result.checks.sourcePersistedAfterReload) {
        throw new Error(`COM-03 violado: tras recargar, source='${afterReload?.source}' (esperado 'Formulario web').`);
    }
    result.observations.push(`Prospecto creado id=${prospect.id} source='Formulario web' (persiste tras reload).`);
    await step(page, CASE, stamp, "02-prospecto-con-origen-web");

    // ── Paso 3: Abrir la ficha del prospecto y registrar accion por canal ───
    const rowLink = page.locator("a", { hasText: contactName }).first();
    if (!(await rowLink.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error(`La fila del prospecto '${contactName}' no es visible tras recargar.`);
    await rowLink.click(); await pause(page);
    await page.waitForURL(/\/app\/crm-prospectos\//, { timeout: cfg.timeoutMs });

    // El botón de nueva acción vive en la pestaña 'Acciones comerciales' (tab activo por defecto = Perfil).
    const actionsTab = page.locator("button.nav-link", { hasText: "Acciones comerciales" }).first();
    if (!(await actionsTab.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("La pestaña 'Acciones comerciales' no es visible en la ficha del prospecto.");
    await actionsTab.click(); await pause(page);

    const newActionBtn = page.locator("button", { hasText: /Nueva\s+accion\s+comercial/ }).first();
    if (!(await newActionBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Nueva accion comercial' no es visible en la ficha.");
    await newActionBtn.click(); await pause(page);

    const actionTypeSelect = page.locator('select').filter({ hasText: "Llamada telefonica" }).last();
    if (!(await actionTypeSelect.isVisible({ timeout: 15000 }).catch(() => false))) throw new Error("El selector de tipo de acción no es visible en el modal.");
    await actionTypeSelect.selectOption({ label: "Whatsapp de seguimiento" }); await pause(page);

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill(tomorrow); await pause(page);
    const timeInput = page.locator('input[type="time"]').first();
    await timeInput.fill("10:30"); await pause(page);

    // Contrato UI real (crm-prospect-detail.component.ts L943): el botón
    // 'Guardar' llama a saveCommercialAction(false) → guarda y DEJA EL MODAL ABIERTO
    // por diseño; lo cierra el botón 'Cerrar'. La confirmación de éxito se valida
    // cruzando la API (GET followups); si el modal emite .alert-warning, falla con ese texto.
    async function saveActionAndConfirm(typeLabel) {
        const saveBtn = page.locator("[data-testid='commercial-action-save-btn']");
        if (!(await saveBtn.isVisible().catch(() => false))) throw new Error("El botón 'Guardar' de la acción comercial no es visible.");
        await saveBtn.click();

        async function followupList() {
            const { status, payload } = await apiGet(session, `/api/v1/crm/prospects/${encodeURIComponent(prospect.id)}/followups`);
            if (status !== 200) throw new Error(`GET followups falló (${status}): ${JSON.stringify(payload).slice(0, 200)}`);
            return Array.isArray(payload) ? payload : (payload?.items ?? []);
        }

        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
            const warning = page.locator(".modal .alert-warning, .modal .alert-danger").first();
            if ((await warning.count().catch(() => 0)) > 0 && (await warning.isVisible().catch(() => false))) {
                throw new Error(`La acción comercial NO se guardó; el modal muestra: "${(await warning.innerText().catch(() => "?")).trim()}"`);
            }
            if ((await followupList()).some((f) => String(f?.tipo ?? f?.actionType ?? "").includes(typeLabel))) break;
            await page.waitForTimeout(400);
        }

        const list = await followupList();
        if (!list.some((f) => String(f?.tipo ?? f?.actionType ?? "").includes(typeLabel))) {
            throw new Error(`La acción '${typeLabel}' no quedó registrada en la API tras 'Guardar'. Recibido: ${JSON.stringify(list).slice(0, 220)}`);
        }

        // Cerrar el modal (por diseño queda abierto tras guardar).
        const closeBtn = page.locator("div.modal button", { hasText: /^Cerrar$/ }).first();
        if (!(await closeBtn.isVisible().catch(() => false))) throw new Error("El botón 'Cerrar' del modal no es visible tras guardar.");
        await closeBtn.click();
        for (let i = 0; i < 20 && (await page.locator("[data-testid='commercial-action-save-btn']").isVisible().catch(() => false)); i++) {
            await page.waitForTimeout(300);
        }
    }

    await saveActionAndConfirm("Whatsapp"); await pause(page);

    // Segundo canal: correo (evidencia de trazabilidad multi-canal).
    if (!(await newActionBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("Tras guardar la acción, el botón 'Nueva accion comercial' no sigue disponible.");
    await newActionBtn.click(); await pause(page);
    const actionTypeSelect2 = page.locator('select').filter({ hasText: "Llamada telefonica" }).last();
    await actionTypeSelect2.selectOption({ label: "Correo de seguimiento" }); await pause(page);
    await page.locator('input[type="date"]').first().fill(tomorrow); await pause(page);
    await page.locator('input[type="time"]').first().fill("15:00"); await pause(page);
    await saveActionAndConfirm("Correo"); await pause(page);

    // ── Paso 4: Verificación cruzada por API (canal + fecha + hora) ─────────
    const { status: fuStatus, payload: fuPayload } = await apiGet(session, `/api/v1/crm/prospects/${encodeURIComponent(prospect.id)}/followups`);
    if (fuStatus !== 200) throw new Error(`GET followups falló (${fuStatus}): ${JSON.stringify(fuPayload).slice(0, 200)}`);
    const followups = Array.isArray(fuPayload) ? fuPayload : (fuPayload?.items ?? []);
    const waAction = followups.find((f) => String(f?.tipo ?? "").includes("Whatsapp"));
    result.checks.followupChannelSavedViaUi = Boolean(waAction);
    if (!waAction) throw new Error(`COM-03 violado: la acción 'Whatsapp de seguimiento' no está registrada en GET followups. Recibido: ${JSON.stringify(followups).slice(0, 220)}`);

    const waDateOk = String(waAction?.followUpDate ?? "").startsWith(tomorrow) || String(waAction?.fecha ?? "").startsWith(tomorrow);
    const waTimeOk = ["10:30", "10:30:00"].some((t) => JSON.stringify(waAction).includes(t));
    result.checks.followupTracedInApi = waDateOk && waTimeOk;
    if (!result.checks.followupTracedInApi) {
        throw new Error(`COM-03 violado: la acción de canal no trae fecha/hora trazable. Recibido: ${JSON.stringify(waAction).slice(0, 220)}`);
    }

    const mailAction = followups.find((f) => String(f?.tipo ?? "").includes("Correo"));
    result.checks.secondChannelEmailTraced = Boolean(mailAction);
    if (!result.checks.secondChannelEmailTraced) {
        throw new Error(`COM-03 violado: la segunda acción 'Correo de seguimiento' no está registrada. Recibido: ${JSON.stringify(followups).slice(0, 220)}`);
    }

    // ── Paso 5: Evidencia visual — tabla de acciones con ambos canales ──────
    await page.reload({ waitUntil: "networkidle", timeout: cfg.timeoutMs });
    // Tras el reload el tab activo vuelve a 'Perfil'; hay que reabrir la pestaña.
    const actionsTab2 = page.locator("button.nav-link", { hasText: "Acciones comerciales" }).first();
    if (!(await actionsTab2.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("Tras recargar, la pestaña 'Acciones comerciales' no es visible.");
    await actionsTab2.click(); await pause(page);
    const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
    result.checks.timelineShowsBothActions = bodyText.includes("Whatsapp de seguimiento") && bodyText.includes("Correo de seguimiento");
    if (!result.checks.timelineShowsBothActions) {
        throw new Error("Las acciones de canal no se muestran en la ficha del prospecto tras recargar (falta trazabilidad visual).");
    }
    await step(page, CASE, stamp, "03-ficha-con-acciones-por-canal");

    const failed = Object.entries(result.checks).filter(([, v]) => !v);
    if (failed.length) throw new Error(`Checks no cumplidos: ${failed.map(([k]) => k).join(", ")}`);
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        const pg = browser?.contexts()?.[0]?.pages()?.find(Boolean);
        if (pg) await shot(pg, CASE, stamp, "FAIL");
    } catch { /* sin página */ }
} finally {
    if (browser) await browser.close().catch(() => {});
}

const outDir = path.resolve("playwright-artifacts/comercial");
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, `${stamp}-${CASE}.json`), JSON.stringify(result, null, 2));
console.log(`[${CASE}] ${result.error ? "FALLO" : "OK"} — ${JSON.stringify(result.checks)}`);
process.exit(result.error ? 1 : 0);
