/**
 * E2E t12 — REMISION DE DESPACHO (rol admin/logistica)
 *
 * Flujo: login admin → setup prospecto + equipo CRM "listo-entrega" (API) →
 * /app/remissions → crear remision desde el panel "Equipos a despachar" →
 * validar bloqueo SIN contacto (mensaje visible + sin POST + backend 400 por API) →
 * llenar contacto, Servientrega, guia SERV-778899, garantia 6 meses →
 * previsualizar PDF → guardar → capturar consecutivo E-CO-* →
 * verificacion cruzada API del registro guardado.
 *
 * Exit codes: 0 = script finished, 1 = exception
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const prefix = "e2e-lars-t12-";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(normalizedBaseUrl).origin;
})();

const stamp = Date.now();
const CLIENT_NAME = `Cliente Remision T12 ${stamp}`;
const EQUIP_CODE = `CO-T12-${stamp}`;
const CONTACT_NAME = "Ing. QA Logistica T12";
const GUIDE = "SERV-778899";
const WARRANTY_COMMENT = "retorno despues de la reparacion, 6 meses de garantia";

const result = {
    test: "e2e-lars-t12-remision",
    baseUrl: normalizedBaseUrl,
    stamp,
    clientName: CLIENT_NAME,
    equipmentCode: EQUIP_CODE,
    generated: { prospectId: "", remissionConsecutive: "" },
    checks: {
        loggedIn: false,
        prospectCreated: false,
        equipmentReadySeeded: false,
        backendBlocksMissingContact400: false,
        landedRemissionsPage: false,
        dispatchPanelShowsEquipment: false,
        addFromPanelPrefillsClient: false,
        saveWithoutContactBlocked: false,
        saveWithoutContactMessage: false,
        saveWithoutContactNoPostRequest: false,
        formFilledContactCarrierGuide: false,
        warranty6MonthsSelected: false,
        notesCommentFieldAvailable: false,
        previewModalShowsData: false,
        remissionSaved: false,
        consecutiveFormatE_CO: false,
        apiRecordMatchesForm: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshots: [],
    error: "",
};

let browser;
let session;
let prospectId = "";

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

function observe(text) { result.observations.push(text); }

async function api(method, urlPath, body) {
    const res = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": companyId,
            Authorization: `Bearer ${session.accessToken}`,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, data };
}

async function shot(page, name) {
    const p = path.resolve(artifactsDir, `${prefix}${name}.png`);
    try {
        await page.screenshot({ path: p, fullPage: true, timeout: 15000 });
        result.screenshots.push(p);
    } catch (e) {
        observe(`OBSERVACION: screenshot ${name} fallo (${String(e?.message || e).split("\n")[0]}).`);
    }
    return p;
}

try {
    // ── Setup: login admin + prospecto + equipo listo-entrega (API) ──
    const loginRes = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!loginRes.ok) throw new Error(`login failed ${loginRes.status}`);
    const payload = await loginRes.json();
    session = { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });

    const prospectRes = await api("POST", "/api/v1/crm/prospects", {
        name: CLIENT_NAME,
        email: `pw-logistica-t12-${stamp}@alfa.local`,
        company: `Empresa Remision T12 ${stamp}`,
        mobile: "3005551212",
    });
    if (prospectRes.status === 201 || prospectRes.status === 200) {
        prospectId = String(prospectRes.data?.id || prospectRes.data?.prospectId || "");
        result.checks.prospectCreated = true;
        result.generated.prospectId = prospectId;
    } else {
        observe(`OBSERVACION: crear prospecto respondio ${prospectRes.status}; se continua sin prospecto vinculado.`);
    }

    const recordId = `qa-t12-remision-${stamp}`;
    const recordRes = await api("PUT", `/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}`, {
        id: recordId,
        prospectId,
        prospectName: CLIENT_NAME,
        receptionDay: "24", receptionMonth: "10", receptionYear: "2026",
        intakeMethod: "personal",
        companyName: `Empresa Remision T12 ${stamp}`,
        nit: `901234-t12-${stamp}`,
        phone: "", address: "", city: "",
        contactName: CLIENT_NAME, contactRole: "", cellphone: "", email: "",
        clientSignature: "", pikaSignature: "",
        archived: false, archivedAt: "",
        sourceContext: "crm", assignedTo: "",
        items: [{
            id: `qa-t12-item-${stamp}`,
            registrationMode: "manual",
            equipmentModelId: "", serviceTypeId: "", serviceTypeName: "Reparacion",
            storageLocationId: "", storageLocationName: "",
            familyId: "", familyName: "Variadores",
            marca: "LARS", tipo: "Variador de velocidad",
            serie: EQUIP_CODE,
            receivedIdentifier: EQUIP_CODE,
            receivedIdentifierType: "manual",
            receivedIdentifierSource: "manual",
            receivedIdentifierCapturedAt: new Date().toISOString(),
            customerShipmentReference: "",
            accessories: "Cargador y cable de poder",
            borrowedEquipments: [],
            failureDescription: "Falla de prueba E2E t12",
            pendingHomologation: false, estimatedData: false, identifierLabelIssue: false,
            evidencePhotos: [], attachments: [], answers: {},
            repairStatus: "listo-entrega",
            repairStatusUpdatedAt: new Date().toISOString(),
            repairStatusUpdatedBy: "qa-t12",
        }],
    });
    result.checks.equipmentReadySeeded = recordRes.status >= 200 && recordRes.status < 300;
    if (!result.checks.equipmentReadySeeded) {
        observe(`OBSERVACION: PUT crm-equipment/records respondio ${recordRes.status}; el panel puede quedar vacio.`);
    }

    // Cross-check backend: sin contactName el POST debe responder 400.
    const noContactRes = await api("POST", "/api/v1/remissions/remissions", {
        clientName: CLIENT_NAME, clientNit: "", contactName: "",
        dispatchType: "servientrega", carrierName: "Servientrega", guideNumber: GUIDE,
        purchaseOrder: "", youtubeLink: "", valued: false, warrantyMonths: 6,
        notes: WARRANTY_COMMENT, anchoredAccepted: false,
        items: [{ equipmentId: "", identifier: EQUIP_CODE, description: "Equipo t12", accessories: "", anchoredNote: "", warrantyMonths: 6, unitPrice: 0, quantity: 1 }],
    });
    result.checks.backendBlocksMissingContact400 = noContactRes.status === 400
        && /contacto/i.test(String(noContactRes.data?.error || ""));
    if (!result.checks.backendBlocksMissingContact400) {
        observe(`OBSERVACION: POST sin contacto respondio ${noContactRes.status} (se esperaba 400 con mensaje de contacto).`);
    }

    // ── Navegador ──
    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
    await context.addInitScript(
        ({ authSession, apiBase }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
        },
        { authSession: session, apiBase: apiBaseUrl },
    );
    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") pushUnique(result.consoleErrors, msg.text()); });
    page.on("pageerror", (err) => pushUnique(result.pageErrors, err?.stack || err?.message || String(err)));
    let remissionPostsDuringBlockedStep = 0;
    page.on("response", (resp) => {
        if (resp.request().method() === "POST" && resp.url().includes("/api/v1/remissions/remissions")) remissionPostsDuringBlockedStep++;
    });

    await page.goto(`${normalizedBaseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedRemissionsPage = !page.url().includes("/auth/signin");
    await page.waitForTimeout(2000);
    // Nudge de change-detection: abrir/cerrar el formulario para que el panel se renderice.
    const createBtn = page.locator("[data-testid='create-remission-btn']");
    if (await createBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(500);
        await page.locator("button", { hasText: /^cancelar$/i }).first().click().catch(() => {});
        await page.waitForTimeout(800);
    }
    await shot(page, "01-landed-remissions");

    // ── Panel Equipos a despachar con mi equipo ──
    const myGroup = page.locator("[data-testid='dispatch-client-group']", { hasText: CLIENT_NAME }).first();
    result.checks.dispatchPanelShowsEquipment = await myGroup
        .waitFor({ state: "visible", timeout: 10000 })
        .then(() => true)
        .catch(() => false);
    if (!result.checks.dispatchPanelShowsEquipment) {
        observe("OBSERVACION: el equipo sembrado en listo-entrega NO aparece en el panel 'Equipos a despachar'.");
    } else {
        await shot(page, "02-dispatch-panel");
        await myGroup.locator("[data-testid='add-equipment-to-remission']").first().click();
        await page.waitForTimeout(800);
        const clientValue = String(await page.locator("[data-testid='remission-client']").inputValue().catch(() => "")).trim();
        result.checks.addFromPanelPrefillsClient = clientValue === CLIENT_NAME;
        if (!result.checks.addFromPanelPrefillsClient) {
            observe(`OBSERVACION: al agregar desde el panel, cliente='${clientValue}' (esperado '${CLIENT_NAME}').`);
        }
    }
    if (!await page.locator("[data-testid='remission-contact-name']").isVisible().catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(600);
    }
    const saveBtn = page.locator("button.btn-theme", { hasText: /Guardar/ }).last();
    if (!(await saveBtn.isVisible().catch(() => false))) {
        observe("OBSERVACION: boton Guardar no visible tras abrir el formulario.");
    }

    // ── Intento de guardar SIN contacto: el sistema debe bloquear ──
    remissionPostsDuringBlockedStep = 0;
    await saveBtn.waitFor({ state: "visible", timeout: 10000 });
    await saveBtn.click();
    await page.waitForTimeout(800);
    const blockAlert = page.locator("[data-testid='remission-save-block']");
    result.checks.saveWithoutContactBlocked = await blockAlert.isVisible({ timeout: 4000 }).catch(() => false);
    const blockText = result.checks.saveWithoutContactBlocked
        ? String(await blockAlert.textContent().catch(() => "")) : "";
    result.checks.saveWithoutContactMessage = /contacto/i.test(blockText);
    result.checks.saveWithoutContactNoPostRequest = remissionPostsDuringBlockedStep === 0;
    if (!result.checks.saveWithoutContactBlocked) {
        observe("OBSERVACION: guardar sin contacto NO fue bloqueado en la UI (no aparecio remission-save-block).");
    } else if (!result.checks.saveWithoutContactMessage) {
        observe(`OBSERVACION: el mensaje de bloqueo no menciona el contacto: '${blockText.trim()}'.`);
    }
    if (!result.checks.saveWithoutContactNoPostRequest) {
        observe("OBSERVACION: la UI llamo al backend aunque el contacto estaba vacio (se esperaba bloqueo client-side).");
    }
    await shot(page, "03-blocked-without-contact");

    // ── Llenar formulario completo ──
    await page.locator("[data-testid='remission-contact-name']").fill(CONTACT_NAME);
    await page.locator("[data-testid='dispatch-type-select']").selectOption({ label: "Servientrega" });
    await page.locator("[data-testid='carrier-name-input']").fill("Servientrega");
    await page.locator("[data-testid='guide-number-input']").fill(GUIDE);
    await page.locator("[data-testid='warranty-select']").selectOption({ label: "6 meses" });
    const itemWarranty = page.locator("div.row.g-2 select").first();
    if (await itemWarranty.isVisible().catch(() => false)) await itemWarranty.selectOption({ label: "6 meses" });
    const warrantyLabel = await page.locator("[data-testid='warranty-select']")
        .evaluate((el) => String(el.selectedOptions[0]?.textContent || "").trim()).catch(() => "");
    result.checks.warranty6MonthsSelected = warrantyLabel === "6 meses";
    result.checks.formFilledContactCarrierGuide = true; // se valida de nuevo en el preview/API

    // Campo de comentario/notas: existe en el modelo y en el PDF, pero no como input.
    const notesInput = page.locator("textarea, input[data-testid*='note'], input[placeholder*='omento']");
    result.checks.notesCommentFieldAvailable = (await notesInput.count()) > 0;
    if (!result.checks.notesCommentFieldAvailable) {
        observe(`HALLAZGO UX: no existe campo de notas/comentario en el formulario de remision; `
            + `el modelo si tiene 'notes' y el PDF lo imprime, pero por UI es imposible escribir `
            + `'${WARRANTY_COMMENT}'. Solo la garantia (6 meses) queda registrada.`);
    }
    await shot(page, "04-form-filled");

    // ── Previsualizar PDF ──
    await page.locator("[data-testid='preview-pdf-btn']").click();
    const preview = page.locator("[data-testid='remission-preview-modal']");
    const previewVisible = await preview.waitFor({ state: "visible", timeout: 6000 }).then(() => true).catch(() => false);
    if (previewVisible) {
        const text = String(await preview.textContent().catch(() => ""));
        const ok = text.includes("Servientrega") && text.includes(GUIDE) && /Garantia: 6 meses/.test(text);
        result.checks.previewModalShowsData = ok;
        if (!ok) observe("OBSERVACION: la previsualizacion no muestra transportadora/guia/garantia esperadas.");
        const printBtnVisible = await preview.locator("[data-testid='print-remission-btn']").isVisible().catch(() => false);
        observe(printBtnVisible
            ? "OK: boton 'Imprimir / Guardar PDF' (print-remission-btn) presente en la previsualizacion."
            : "OBSERVACION: no se encontro print-remission-btn en la previsualizacion.");
    } else {
        observe("OBSERVACION: preview-pdf-btn no abrio remission-preview-modal.");
    }
    await shot(page, "05-preview-pdf");
    await preview.locator("button", { hasText: /cerrar/i }).first().click().catch(() => {});
    await page.waitForTimeout(500);

    // ── Guardar y capturar consecutivo E-CO-* ──
    await saveBtn.waitFor({ state: "visible", timeout: 10000 });
    await saveBtn.click();
    const myRow = page.locator("tr", { hasText: CLIENT_NAME }).first();
    result.checks.remissionSaved = await myRow
        .waitFor({ state: "visible", timeout: 12000 })
        .then(() => true)
        .catch(() => false);
    let consecutive = "";
    if (result.checks.remissionSaved) {
        const rowText = String(await myRow.textContent().catch(() => ""));
        consecutive = (rowText.match(/E-CO-\d{4}-\d{4,}/) || [""])[0];
        result.generated.remissionConsecutive = consecutive;
        result.checks.consecutiveFormatE_CO = /^E-CO-\d{4}-\d{4,}$/.test(consecutive);
        if (!result.checks.consecutiveFormatE_CO) {
            observe(`OBSERVACION: consecutivo '${consecutive}' no cumple E-CO-YYMM-NNNN.`);
        }
    } else {
        const block = page.locator("[data-testid='remission-save-block']");
        if (await block.isVisible().catch(() => false)) {
            observe(`OBSERVACION: el guardado fue bloqueado: '${String(await block.textContent().catch(() => "")).trim()}'.`);
        } else {
            observe("OBSERVACION: tras Guardar, la remision no aparece en la tabla.");
        }
    }
    await shot(page, "06-saved-with-consecutive");

    // ── Verificacion cruzada API del registro guardado ──
    if (consecutive) {
        const listRes = await api("GET", "/api/v1/remissions/remissions");
        const items = Array.isArray(listRes.data?.items) ? listRes.data.items : [];
        const saved = items.find((r) => r.consecutive === consecutive);
        if (saved) {
            const itemOk = (saved.items || []).some((it) =>
                String(it.identifier) === EQUIP_CODE && Number(it.warrantyMonths || 0) === 6);
            result.checks.apiRecordMatchesForm =
                String(saved.contactName || "").trim() === CONTACT_NAME
                && String(saved.carrierName || "") === "Servientrega"
                && String(saved.guideNumber || "") === GUIDE
                && Number(saved.warrantyMonths || 0) === 6
                && String(saved.dispatchType || "") === "servientrega"
                && String(saved.clientName || "") === CLIENT_NAME
                && itemOk;
            if (!result.checks.apiRecordMatchesForm) {
                observe(`OBSERVACION: el registro API no coincide con el formulario: ${JSON.stringify({
                    contactName: saved.contactName, carrierName: saved.carrierName,
                    guideNumber: saved.guideNumber, warrantyMonths: saved.warrantyMonths,
                    dispatchType: saved.dispatchType, itemOk,
                })}`);
            }
            observe(`DATO: notes guardado='${String(saved.notes || "")}' (esperado vacio por falta de campo en UI).`);
        } else {
            observe("OBSERVACION: la remision creada por UI no aparece en GET /api/v1/remissions/remissions.");
        }
    }

    const outPath = path.resolve(artifactsDir, `${prefix}results.json`);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2));
    console.log("E2E_LARS_T12_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
    console.log(`RESULTS_JSON: ${outPath}`);
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            await shot(browser.contexts()[0].pages()[0], "99-fail");
        }
    } catch {}
    console.error("E2E_LARS_T12_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
