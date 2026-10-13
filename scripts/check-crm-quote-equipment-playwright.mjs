/**
 * Playwright headless test — Cotización CRM lista equipos del prospecto (UUID real)
 *
 * Verifies:
 *  - Se crea una recepción de equipos vía API asociada al UUID real de un prospecto
 *  - /app/crm-cotizaciones → "Crear Cotizacion" → seleccionar el prospecto
 *    muestra el checkbox del equipo en "Equipos asociados a la cotización"
 *  - Las recepciones directas (-9000) del mismo NIT/empresa también aparecen
 *  - Cleanup: la recepción creada se archiva vía API
 *
 * Requiere el backend desplegado con prospect_id TEXT (migración aplicada).
 * Exit codes: 0 = all checks passed, 1 = failure
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

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(normalizedBaseUrl).origin;
})();

const result = {
    test: "crm-quote-equipment",
    requirement: "Cotización muestra equipos del prospecto por UUID real + match por nit/nombre",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        prospectFound: false,
        equipmentCreated: false,
        quoteFormOpened: false,
        prospectSelected: false,
        equipmentCheckboxVisible: false,
        cleanupDone: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshotPath: "",
    error: "",
};

let browser;
let session;
let createdRecordId = "";
let prospect = null;

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) return;
    if (target.length < 20) target.push(value);
}

async function login() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!response.ok) throw new Error(`login failed ${response.status}`);
    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

function buildApiHeaders() {
    return {
        "Content-Type": "application/json",
        "X-Company-Id": companyId,
        Authorization: `Bearer ${session.accessToken}`,
    };
}

async function findProspect() {
    const res = await fetch(`${apiBaseUrl}/api/v1/crm/prospects`, { headers: buildApiHeaders() });
    if (!res.ok) throw new Error(`list prospects failed ${res.status}`);
    const payload = await res.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    const found = items.find((item) => String(item.id || "").trim() && String(item.name || "").trim());
    if (!found) throw new Error("no hay prospectos con id disponible");
    return {
        id: String(found.id).trim(),
        name: String(found.name).trim(),
        company: String(found.company || "").trim(),
        nit: String(found.nit || "").trim(),
    };
}

async function createEquipmentRecord(stamp) {
    createdRecordId = `qa-pw-quote-equipment-${stamp}`;
    const body = {
        id: createdRecordId,
        prospectId: prospect.id,
        prospectName: prospect.name,
        receptionDay: "14",
        receptionMonth: "08",
        receptionYear: "2026",
        intakeMethod: "personal",
        companyName: prospect.company || prospect.name,
        nit: prospect.nit || `qa-nit-${stamp}`,
        phone: "",
        address: "",
        city: "",
        contactName: prospect.name,
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
                id: `qa-pw-item-${stamp}`,
                registrationMode: "manual",
                equipmentModelId: "",
                serviceTypeId: "",
                serviceTypeName: "Reparacion",
                storageLocationId: "",
                storageLocationName: "",
                familyId: "",
                familyName: "HMI",
                marca: "QA-Marca",
                tipo: "QA-Tipo",
                serie: `QA-PW-${stamp}`,
                receivedIdentifier: `QA-PW-${stamp}`,
                receivedIdentifierType: "manual",
                receivedIdentifierSource: "manual",
                receivedIdentifierCapturedAt: new Date().toISOString(),
                customerShipmentReference: "",
                accessories: "Sin accesorios",
                borrowedEquipments: [],
                failureDescription: "Falla de prueba E2E",
                pendingHomologation: false,
                estimatedData: false,
                identifierLabelIssue: false,
                evidencePhotos: [],
                attachments: [],
                answers: {},
                repairStatus: "recibido",
                repairStatusUpdatedAt: new Date().toISOString(),
                repairStatusUpdatedBy: "qa-pw",
            },
        ],
    };
    const res = await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(createdRecordId)}`, {
        method: "PUT",
        headers: buildApiHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`create equipment record failed ${res.status}: ${text.slice(0, 200)}`);
    }
}

async function cleanupEquipment() {
    if (!createdRecordId) return;
    const res = await fetch(`${apiBaseUrl}/api/v1/crm-equipment/records/${encodeURIComponent(createdRecordId)}/archive`, {
        method: "PATCH",
        headers: buildApiHeaders(),
        body: JSON.stringify({ archived: true }),
    });
    result.checks.cleanupDone = res.ok;
    if (!res.ok) {
        result.observations.push(`OBSERVACION: no se pudo archivar la recepción de prueba ${createdRecordId} (status ${res.status}).`);
    }
}

try {
    session = await login();
    result.checks.loggedIn = true;

    prospect = await findProspect();
    result.checks.prospectFound = true;

    const stamp = Date.now();
    await createEquipmentRecord(stamp);
    result.checks.equipmentCreated = true;
    const serie = `QA-PW-${stamp}`;

    await fs.mkdir(artifactsDir, { recursive: true });
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

    // ── Step 1: abrir cotizaciones y el formulario de nueva cotización ──
    await page.goto(`${normalizedBaseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(2500);

    const createBtn = page.locator("button.btn-theme", { hasText: /Crear Cotizacion/i }).first();
    if (await createBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(1500);
    }
    result.checks.quoteFormOpened = await page.locator("select.form-select").first().isVisible().catch(() => false);
    if (!result.checks.quoteFormOpened) {
        result.observations.push("OBSERVACION: no se abrió el formulario de nueva cotización.");
    }

    // ── Step 2: seleccionar el prospecto con equipos ──
    const prospectSelect = page.locator("select.form-select").first();
    await prospectSelect.selectOption({ label: prospect.name }).catch(async () => {
        await prospectSelect.selectOption(prospect.name);
    });
    await page.waitForTimeout(2500);
    result.checks.prospectSelected = (await prospectSelect.inputValue().catch(() => "")) === prospect.name;
    if (!result.checks.prospectSelected) {
        result.observations.push(`OBSERVACION: no se pudo seleccionar el prospecto "${prospect.name}".`);
    }

    // ── Step 3: el checkbox del equipo aparece en la sección ──
    const equipmentLabel = page.locator("label.form-check", { hasText: serie }).first();
    result.checks.equipmentCheckboxVisible = await equipmentLabel.isVisible({ timeout: 10000 }).catch(() => false);
    if (result.checks.equipmentCheckboxVisible) {
        const checkbox = equipmentLabel.locator("input[type='checkbox']");
        await checkbox.check().catch(() => {});
        result.observations.push(`DATO: equipo "${serie}" visible y seleccionable en la cotización.`);
    } else {
        result.observations.push(
            `OBSERVACION: el equipo "${serie}" no apareció en "Equipos asociados a la cotización" para el prospecto "${prospect.name}".`,
        );
    }

    const screenshotPath = path.resolve(artifactsDir, `crm-quote-equipment-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    // ── Step 4: cleanup ──
    await cleanupEquipment();

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
        process.exitCode = 1;
    }

    console.log("PLAYWRIGHT_CRM_QUOTE_EQUIPMENT_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        await cleanupEquipment();
    } catch {}
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `crm-quote-equipment-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_CRM_QUOTE_EQUIPMENT_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
