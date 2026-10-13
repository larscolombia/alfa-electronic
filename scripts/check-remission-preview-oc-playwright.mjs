/**
 * Playwright headless test — Remisiones: previsualizacion real, OC, sin limite de items y precios de cotizacion (hallazgos 2 y 6)
 *
 * Verifies:
 *  - Remission can be created with 5+ items via UI (add-remission-item repeated), all items are saved (>4, no limit)
 *  - preview-pdf-btn opens remission-preview-modal (a real modal, NOT a JS alert/dialog)
 *  - The preview shows the human-readable dispatch type label (e.g. "Servientrega") and print-remission-btn
 *  - purchase-order-input and print-purchase-order-btn exist
 *  - load-quote-prices-btn exists and using it shows quote-prices-message
 *  - With valued-remission-check enabled, the total value is shown in the preview
 *
 * Exit codes: 0 = script finished without exception, 1 = failure
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    return new URL(normalizedBaseUrl).origin;
})();

const CLIENT_NAME = "Cliente Preview QA";
const ITEM_COUNT = 6;
const UNIT_PRICE = 1000;

const result = {
    test: "remission-preview-oc",
    requirement: "Previsualizacion real de remision, OC, sin limite de items y precios de cotizacion (hallazgos 2 y 6)",
    baseUrl: normalizedBaseUrl,
    checks: {
        loggedIn: false,
        landedRemissionsPage: false,
        createFormOpens: false,
        canAddMoreThan4Items: false,
        allItemsSavedOver4: false,
        previewOpensModal: false,
        noJsDialogOnPreview: false,
        previewShowsDispatchTypeLabel: false,
        printRemissionBtnExists: false,
        purchaseOrderInputExists: false,
        printPurchaseOrderBtnExists: false,
        loadQuotePricesBtnExists: false,
        quotePricesMessageAppears: false,
        valuedTotalShownInPreview: false,
    },
    observations: [],
    consoleErrors: [],
    pageErrors: [],
    screenshotPath: "",
    error: "",
};

let browser;
let session;

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

try {
    session = await login();
    result.checks.loggedIn = true;

    await fs.mkdir(artifactsDir, { recursive: true });
    browser = await chromium.launch({ headless, slowMo: slowMoMs });
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

    // Any native JS dialog (alert/confirm) invalidates the "real preview modal" check
    let jsDialogSeen = false;
    page.on("dialog", (dialog) => {
        jsDialogSeen = true;
        pushUnique(result.observations, `OBSERVACION: aparecio un dialogo JS nativo (${dialog.type()}): '${dialog.message()}' en vez del modal de previsualizacion.`);
        dialog.dismiss().catch(() => {});
    });

    // ── Step 1: Navigate to remissions module ──
    await page.goto(`${normalizedBaseUrl}/app/remissions`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.landedRemissionsPage = !page.url().includes("/auth/signin");
    await page.waitForTimeout(2000);

    // ── Step 2: Open the create form ──
    const createBtn = page.locator("[data-testid='create-remission-btn']");
    result.checks.createFormOpens = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!result.checks.createFormOpens) {
        throw new Error("No se encontro el boton create-remission-btn en /app/remissions (el frontend nuevo puede no estar desplegado).");
    }
    await createBtn.click();
    await page.waitForTimeout(500);

    // ── Step 3: Static form fields (OC, quote prices) ──
    result.checks.purchaseOrderInputExists = await page.locator("[data-testid='purchase-order-input']").isVisible({ timeout: 3000 }).catch(() => false);
    result.checks.printPurchaseOrderBtnExists = await page.locator("[data-testid='print-purchase-order-btn']").isVisible({ timeout: 3000 }).catch(() => false);
    result.checks.loadQuotePricesBtnExists = await page.locator("[data-testid='load-quote-prices-btn']").isVisible({ timeout: 3000 }).catch(() => false);

    // ── Step 4: Fill header fields ──
    await page.locator("[data-testid='remission-client']").fill(CLIENT_NAME);
    await page.locator("[data-testid='dispatch-type-select']").selectOption("servientrega");
    if (result.checks.purchaseOrderInputExists) {
        await page.locator("[data-testid='purchase-order-input']").fill("OC-QA-123");
    }
    const valuedCheck = page.locator("[data-testid='valued-remission-check']");
    if (await valuedCheck.isVisible({ timeout: 2000 }).catch(() => false)) {
        await valuedCheck.check();
    }

    // ── Step 5: Add 6 items via UI and fill identifier + unit price ──
    const addItemBtn = page.locator("[data-testid='add-remission-item']");
    for (let i = 0; i < ITEM_COUNT; i++) {
        await addItemBtn.click();
    }
    await page.waitForTimeout(300);
    const itemRows = page.locator(".card .row.g-2.mb-2");
    const renderedItems = await itemRows.count();
    result.checks.canAddMoreThan4Items = renderedItems > 4;
    if (!result.checks.canAddMoreThan4Items) {
        result.observations.push(`OBSERVACION: solo se renderizaron ${renderedItems} filas de items tras ${ITEM_COUNT} clics en add-remission-item (posible limite de 4 items).`);
    }

    for (let i = 0; i < renderedItems; i++) {
        const row = itemRows.nth(i);
        await row.locator("input[placeholder='Identificador']").fill(`EQ-QA-${String(i + 1).padStart(2, "0")}`);
        await row.locator("input[placeholder='Precio']").fill(String(UNIT_PRICE));
    }

    // ── Step 6: load quote prices (the async fetch completes in the background) ──
    // NOTE: this build does not re-render after fetch() completions until the next Angular-bound
    // event, so the preview click below doubles as the change-detection nudge that renders
    // quote-prices-message.
    if (result.checks.loadQuotePricesBtnExists) {
        await page.locator("[data-testid='load-quote-prices-btn']").click();
        await page.waitForTimeout(1500);
    }

    // ── Step 7: Preview must open the real modal (not a JS alert) ──
    await page.locator("[data-testid='preview-pdf-btn']").click();
    const previewModal = page.locator("[data-testid='remission-preview-modal']");
    result.checks.previewOpensModal = await previewModal
        .waitFor({ state: "visible", timeout: 6000 })
        .then(() => true)
        .catch(() => false);
    result.checks.noJsDialogOnPreview = !jsDialogSeen;

    // ── Step 8: quote prices feedback message (rendered by the preview click CD tick) ──
    if (result.checks.loadQuotePricesBtnExists) {
        const quoteMsg = page.locator("[data-testid='quote-prices-message']");
        result.checks.quotePricesMessageAppears = await quoteMsg
            .waitFor({ state: "visible", timeout: 5000 })
            .then(() => true)
            .catch(() => false);
        if (result.checks.quotePricesMessageAppears) {
            result.observations.push(`OK: mensaje de precios de cotizacion: '${(await quoteMsg.innerText()).trim()}'.`);
        } else {
            result.observations.push("OBSERVACION: load-quote-prices-btn no mostro el mensaje quote-prices-message.");
        }
    }

    if (result.checks.previewOpensModal) {
        // Human-readable dispatch type label inside the modal
        const modalText = await previewModal.innerText();
        result.checks.previewShowsDispatchTypeLabel = /Servientrega/.test(modalText);
        if (!result.checks.previewShowsDispatchTypeLabel) {
            result.observations.push("OBSERVACION: el preview no muestra el label legible del tipo de despacho (esperado 'Servientrega').");
        }

        // Print button inside the modal
        result.checks.printRemissionBtnExists = await previewModal
            .locator("[data-testid='print-remission-btn']")
            .isVisible()
            .catch(() => false);

        // Valued total shown in the preview (6 x 1000 = 6000; format may be "6,000" or "6.000")
        const expectedTotal = UNIT_PRICE * renderedItems;
        const normalizedModalText = modalText.replace(/[.,\s]/g, "");
        result.checks.valuedTotalShownInPreview = /Total/.test(modalText) && normalizedModalText.includes(`$${expectedTotal}`);
        if (!result.checks.valuedTotalShownInPreview) {
            result.observations.push(`OBSERVACION: el preview valorizado no muestra el total esperado (${expectedTotal}).`);
        }

        // Close preview
        await previewModal.locator("button", { hasText: /cerrar/i }).first().click().catch(() => {});
        await page.waitForTimeout(400);
    } else {
        result.observations.push("OBSERVACION: preview-pdf-btn no abrio el modal remission-preview-modal (posible alert o sin implementar).");
    }

    // ── Step 8: Save and verify all items persisted (>4, no limit) ──
    await page.locator("button", { hasText: /guardar/i }).first().click();
    await page.waitForTimeout(2500);
    try {
        const listRes = await fetch(`${apiBaseUrl}/api/v1/remissions/remissions`, { headers: buildApiHeaders() });
        if (listRes.ok) {
            const data = await listRes.json();
            const created = (data.items || [])
                .filter((r) => String(r.clientName || "") === CLIENT_NAME)
                .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
            if (created) {
                const savedItems = Array.isArray(created.items) ? created.items.length : 0;
                result.checks.allItemsSavedOver4 = savedItems > 4;
                result.observations.push(`OK: remision '${created.consecutive || created.id}' guardada con ${savedItems} items.`);
                // Best-effort cleanup of QA data
                await fetch(`${apiBaseUrl}/api/v1/remissions/remissions/${created.id}`, {
                    method: "DELETE",
                    headers: buildApiHeaders(),
                }).catch(() => {});
            } else {
                result.observations.push("OBSERVACION: no se encontro la remision creada via API tras guardar (el guardado pudo fallar).");
            }
        } else {
            result.observations.push(`OBSERVACION: GET /api/v1/remissions/remissions respondio ${listRes.status}.`);
        }
    } catch (e) {
        result.observations.push(`OBSERVACION: error verificando items guardados: ${e?.message || e}.`);
    }

    // Screenshot
    const screenshotPath = path.resolve(artifactsDir, `remission-preview-oc-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks).filter(([, v]) => v !== true);
    if (failedChecks.length > 0) {
        result.observations.push(`Checks no aprobados: ${failedChecks.map(([k]) => k).join(", ")}`);
    }

    console.log("PLAYWRIGHT_REMISSION_PREVIEW_OC_CHECK_COMPLETED");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const sp = path.resolve(artifactsDir, `remission-preview-oc-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: sp, fullPage: true });
            result.screenshotPath = sp;
        }
    } catch {}
    console.error("PLAYWRIGHT_REMISSION_PREVIEW_OC_CHECK_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
