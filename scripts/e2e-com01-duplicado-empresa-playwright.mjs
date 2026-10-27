/**
 * COMERCIAL · CASO — COM-01
 * "Empresa ya existe con variación de nombre → Advertir posible duplicado antes
 *  de crear; permitir continuar solo de forma explícita y auditable" (MD §1).
 *
 * Reglas ejercitadas:
 *   1. Al intentar crear un prospecto con datos similares a uno existente, la
 *      UI MUESTRA advertencia ("Posible duplicado detectado") listando el
 *      registro similar ANTES de crear nada (bloqueo por defecto).
 *   2. "Cancelar" no crea: el prospecto no aparece en la API.
 *   3. "Crear de todos modos" es la única vía explícita: ambos registros
 *      coexisten y quedan trazables (evidencia auditable).
 *
 * Flujo: LOGIN UI → crear prospecto A (empresa base) → intentar B con el MISMO
 *   correo (match garantizado por buildDuplicateMatches) + empresa variada →
 *   modal duplicado → Cancelar (verificar NO creado) → reintentar → Crear de
 *   todos modos → verificación cruzada API.
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { cfg, pause, shot, step, apiLogin, launchBrowser, uiLogin, setArtifactsDir, apiGet } from "./e2e-compr-helpers.mjs";

const CASE = "com01-duplicado-empresa";
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/comercial");

const uniq = String(stamp).slice(-9);
const emailShared = `com01.${uniq}@qa.local`;
const nameA = `Contacto COM01 A ${uniq}`;
const companyA = `COM01 Empresa ${uniq}`;
const nameB = `Contacto COM01 B ${uniq}`;
const companyB = `${companyA} Sucursal Norte`;

const result = {
    case: CASE,
    ids: ["COM-01"],
    requirement: "Advertir duplicado antes de crear; continuar solo de forma explícita y auditable.",
    data: { emailShared, nameA, companyA, nameB, companyB },
    checks: {
        loginUi: false,
        prospectACreated: false,
        duplicateWarningShownBeforeCreate: false,
        existingRecordListedInModal: false,
        cancelBlocksCreation: false,
        explicitContinueCreatesBoth: false,
        bothRecordsTracedInApi: false,
    },
    observations: [],
    error: "",
};

/** Busca prospectos por término de búsqueda y filtra por nombre. */
async function findProspectsByName(session, search, name) {
    const { status, payload } = await apiGet(session, `/api/v1/crm/prospects?search=${encodeURIComponent(search)}`);
    if (status !== 200) throw new Error(`GET prospects?search falló (${status}): ${JSON.stringify(payload).slice(0, 200)}`);
    const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
    return items.filter((p) => String(p?.nombre ?? p?.name ?? "").trim() === name);
}

/** Llena el formulario rápido de prospecto por UI. */
async function fillProspectForm(page, { nombre, correo, compania }) {
    await page.locator('input[name="formNombre"]').fill(nombre); await pause(page);
    const emailInput = page.locator('input[name="formCorreo"]');
    if (await emailInput.isVisible().catch(() => false)) { await emailInput.fill(correo); await pause(page); }
    await page.locator('input[name="formCompania"]').fill(compania); await pause(page);
}

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

    // ── Paso 2: Crear prospecto A (empresa base) por UI ─────────────────────
    await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    const addBtn = page.locator("button", { hasText: /Agregar\s+Prospecto/ }).first();
    if (!(await addBtn.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El botón 'Agregar Prospecto' no es visible.");
    await addBtn.click(); await pause(page);

    const nameInputA = page.locator('input[name="formNombre"]');
    if (!(await nameInputA.isVisible({ timeout: 20000 }).catch(() => false))) throw new Error("El formulario de prospecto no se abrió.");
    await fillProspectForm(page, { nombre: nameA, correo: emailShared, compania: companyA });

    const saveBtn = page.locator("[data-testid='prospect-save-btn']");
    if (!(await saveBtn.isVisible({ timeout: 10000 }).catch(() => false))) throw new Error("El botón de guardar prospecto no es visible.");
    await saveBtn.click(); await pause(page);

    const createdA = await findProspectsByName(session, uniq, nameA);
    result.checks.prospectACreated = createdA.length === 1;
    if (!result.checks.prospectACreated) throw new Error(`El prospecto A '${nameA}' no quedó creado (${createdA.length} coincidencias).`);
    await step(page, CASE, stamp, "02-prospecto-a-creado");

    // ── Paso 3: Intentar crear B (mismo correo, empresa variada) → advertencia
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
        await page.goto(`${cfg.baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout: cfg.timeoutMs });
    }
    const addBtn2 = page.locator("button", { hasText: /Agregar\s+Prospecto/ }).first();
    if (!(await nameInputA.isVisible({ timeout: 3000 }).catch(() => false))) await addBtn2.click(); // si el modal se cerró, reabrir
    await pause(page);

    const formVisible = page.locator('input[name="formNombre"]');
    if (!(await formVisible.isVisible({ timeout: 15000 }).catch(() => false))) {
        throw new Error("No se pudo (re)abrir el formulario de prospecto para intentar crear B.");
    }
    await fillProspectForm(page, { nombre: nameB, correo: emailShared, compania: companyB });

    const saveBtn2 = page.locator("[data-testid='prospect-save-btn']");
    await saveBtn2.click(); await pause(page);

    // Advertencia visible ANTES de crear (bloqueo por defecto).
    const dupModal = page.locator(".modal", { hasText: /Posible duplicado detectado/ }).first();
    if (!(await dupModal.isVisible({ timeout: 15000 }).catch(() => false))) {
        // Si ya se creó B sin advertencia, el caso falla; si no existe, tampoco pasó nada.
        const leakedB = await findProspectsByName(session, uniq, nameB).catch(() => []);
        throw new Error(`COM-01 violado: NO apareció la advertencia de duplicado antes de crear.${leakedB.length ? " Además B SÍ se creó sin confirmación explícita." : ""}`);
    }
    result.checks.duplicateWarningShownBeforeCreate = true;

    const dupBodyText = (await dupModal.innerText().catch(() => "")) || "";
    result.checks.existingRecordListedInModal = dupBodyText.includes(emailShared) || dupBodyText.includes(companyA);
    if (!result.checks.existingRecordListedInModal) {
        throw new Error(`COM-01 violado: el modal de duplicado no lista el registro existente (correo '${emailShared}' / empresa '${companyA}').`);
    }
    await step(page, CASE, stamp, "03-advertencia-duplicado");

    // ── Paso 4: Cancelar → NO debe crearse nada ─────────────────────────────
    const cancelBtn = dupModal.locator("button", { hasText: /^Cancelar$/ }).first();
    if (!(await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false))) throw new Error("El botón 'Cancelar' del modal de duplicado no es visible.");
    await cancelBtn.click(); await pause(page);

    const leakedAfterCancel = await findProspectsByName(session, uniq, nameB);
    result.checks.cancelBlocksCreation = leakedAfterCancel.length === 0;
    if (!result.checks.cancelBlocksCreation) {
        throw new Error(`COM-01 violado: tras 'Cancelar' el prospecto B SÍ se creó (${leakedAfterCancel.length} registros).`);
    }
    await step(page, CASE, stamp, "04-cancelar-no-crea");

    // ── Paso 5: Reintentar → advertencia de nuevo → continuar EXPLÍCITAMENTE ─
    const saveBtn3 = page.locator("[data-testid='prospect-save-btn']");
    if (!(await saveBtn3.isVisible({ timeout: 10000 }).catch(() => false))) {
        throw new Error("Tras cancelar, el formulario de prospecto no sigue disponible para reintentar.");
    }
    await saveBtn3.click(); await pause(page);

    const dupModal2 = page.locator(".modal", { hasText: /Posible duplicado detectado/ }).first();
    if (!(await dupModal2.isVisible({ timeout: 15000 }).catch(() => false))) {
        throw new Error("COM-01 violado: el segundo intento no volvió a advertir el posible duplicado.");
    }

    const confirmBtn = dupModal2.locator("button", { hasText: /Crear\s+de\s+todos\s+modos/ }).first();
    if (!(await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false))) throw new Error("El botón 'Crear de todos modos' no es visible.");
    await confirmBtn.click(); await pause(page);

    const finalA = await findProspectsByName(session, uniq, nameA);
    const finalB = await findProspectsByName(session, uniq, nameB);
    result.checks.explicitContinueCreatesBoth = finalA.length === 1 && finalB.length === 1;
    if (!result.checks.explicitContinueCreatesBoth) {
        throw new Error(`Tras 'Crear de todos modos' no coexisten ambos registros (A=${finalA.length}, B=${finalB.length}).`);
    }

    // Trazabilidad: ambos con datos auditablemente distintos (empresa + nombre).
    const bRecord = finalB[0];
    // La API serializa 'company' (el modelo frontend lo llama 'compania'); aceptar ambas llaves.
    const bCompany = String(bRecord?.compania ?? bRecord?.company ?? "");
    result.checks.bothRecordsTracedInApi = bCompany.includes("Sucursal Norte") && Boolean(finalA[0]?.id) ;
    if (!result.checks.bothRecordsTracedInApi) {
        throw new Error(`Los registros no trazan el origen del duplicado: A=${JSON.stringify(finalA[0]).slice(0, 160)} B=${JSON.stringify(bRecord).slice(0, 160)}`);
    }
    result.observations.push(`Duplicado explícito auditable: A='${finalA[0].id}' B='${bRecord.id}', mismo correo '${emailShared}'.`);
    await step(page, CASE, stamp, "05-dos-registros-coexisten");

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
