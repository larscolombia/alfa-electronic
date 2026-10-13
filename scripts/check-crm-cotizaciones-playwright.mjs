import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";

const resolvedApiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return process.env.PW_API_BASE_URL;
    }
    try {
        const parsed = new URL(baseUrl);
        if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.port !== "8080") {
            parsed.port = "8080";
            return parsed.origin;
        }
        return parsed.origin;
    } catch {
        return "http://127.0.0.1:8080";
    }
})();

const consoleErrors = [];
const pageErrors = [];

const result = {
    baseUrl,
    apiBaseUrl: resolvedApiBaseUrl,
    checks: {
        backendValidationMissingCode: false,
        frontendValidationMissingProspect: false,
        frontendValidationNoPricedLines: false,
        quoteCreatedViaUi: false,
        quoteFoundInApiAfterCreate: false,
        quoteVisibleAfterReload: false,
        quoteUpdatedViaUi: false,
        quoteUpdatedInApi: false,
        quoteDeletedViaUi: false,
        quoteDeletedInApi: false,
        quotePreviewLoaded: false,
        prospectDeletedViaApi: false,
    },
    createdProspectId: "",
    createdQuoteId: "",
    createdQuoteToken: "",
    createdQuoteCodigo: "",
    screenshotPath: "",
    consoleErrors,
    pageErrors,
};

async function apiRequest(method, urlPath, accessToken, body) {
    const response = await fetch(`${resolvedApiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 204) {
        return null;
    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`API ${method} ${urlPath} -> ${response.status}: ${text}`);
    }

    return response.json();
}

async function loginAndBuildSession(email, password) {
    const response = await fetch(`${resolvedApiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Login failed (${response.status}): ${body}`);
    }

    const payload = await response.json();
    return {
        ...payload,
        expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000,
    };
}

async function gotoAndWaitForHeading(page, url, headingSnippet) {
    await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForFunction(
        (snippet) =>
            Array.from(document.querySelectorAll("h5,h4,h3,h2,h1")).some((n) =>
                (n.textContent || "").toLowerCase().includes(snippet.toLowerCase()),
            ),
        headingSnippet,
        { timeout: timeoutMs },
    );
}

function buildDatePlus(daysToAdd) {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isoToLabel(isoDate) {
    const [yyyy, mm, dd] = String(isoDate).split("-");
    if (!yyyy || !mm || !dd) {
        return "";
    }
    return `${dd}/${mm}/${yyyy}`;
}

async function setProspectSelectValue(page, value) {
    await page.evaluate((nextValue) => {
        const prospectLabel = Array.from(document.querySelectorAll("label")).find((label) => {
            const text = (label.textContent || "").toLowerCase();
            return text.includes("prospecto");
        });
        if (!prospectLabel) {
            return;
        }
        const container = prospectLabel.parentElement;
        const select = container?.querySelector("select");
        if (!select) {
            return;
        }

        const emptyOption = Array.from(select.querySelectorAll("option")).find((option) => option.value === "");
        if (!emptyOption) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "--";
            select.insertBefore(option, select.firstChild);
        }

        select.value = nextValue;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
}

const testId = Date.now();
const testProspectName = `PW-Cot-${testId}`;
let accessToken = "";
let createdProspectId = "";
let createdQuoteId = "";
let createdQuoteToken = "";
let browser;

try {
    const session = await loginAndBuildSession(userEmail, userPassword);
    accessToken = session.accessToken;

    const createdProspect = await apiRequest("POST", "/api/v1/crm/prospects", accessToken, {
        name: testProspectName,
        email: `pw-cot-${testId}@prueba.com`,
        company: "PW Cot Company",
        mobile: "3001112233",
        status: "Pendiente",
    });
    createdProspectId = String(createdProspect.id || "");
    if (!createdProspectId) {
        throw new Error("No se pudo crear el prospecto de prueba para cotizaciones.");
    }
    result.createdProspectId = createdProspectId;

    let backendRejected = false;
    try {
        await apiRequest("POST", "/api/v1/crm-quotes/quotes", accessToken, {
            prospecto: testProspectName,
            estado: "Borrador",
            moneda: "COP",
            lineas: [],
        });
    } catch (error) {
        if (String(error).includes("400")) {
            backendRejected = true;
        }
    }
    if (!backendRejected) {
        throw new Error("Backend no rechazo cotizacion invalida sin codigo.");
    }
    result.checks.backendValidationMissingCode = true;

    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });

    await context.addInitScript(
        ({ storedSession, apiBaseUrl }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBaseUrl);
            window.localStorage.removeItem("app.crm.quotes.form");
        },
        { storedSession: session, apiBaseUrl: resolvedApiBaseUrl },
    );

    const page = await context.newPage();
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            consoleErrors.push(msg.text());
        }
    });
    page.on("pageerror", (error) => {
        pageErrors.push(error.stack || error.message || String(error));
    });

    await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/crm-cotizaciones`, "cotizacion");

    const createButton = page.getByRole("button", { name: /Crear Cotizacion/i }).first();
    await createButton.click();
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll("h5")).some((n) => (n.textContent || "").toLowerCase().includes("cotizacion")),
        null,
        { timeout: timeoutMs },
    );

    await setProspectSelectValue(page, "");
    await page.locator(".card-footer").getByRole("button", { name: /^Guardar$/ }).first().click();
    const missingProspectAlertVisible = await page.locator(".alert-danger").filter({ hasText: /prospecto/i }).first().isVisible().catch(() => false);
    result.checks.frontendValidationMissingProspect = missingProspectAlertVisible;

    await page.locator("select").first().selectOption({ label: testProspectName }).catch(async () => {
        await page.locator("select").first().selectOption(testProspectName);
    });

    const allUnitPriceInputs = page.locator("input[type='number'][step='1000']");
    const allUnitPriceCount = await allUnitPriceInputs.count();
    for (let i = 0; i < allUnitPriceCount; i += 1) {
        await allUnitPriceInputs.nth(i).fill("0");
    }

    await page.locator(".card-footer").getByRole("button", { name: /^Guardar$/ }).first().click();
    const noLinesAlertVisible = await page.locator(".alert-danger").filter({ hasText: /precio|linea/i }).first().isVisible().catch(() => false);
    if (!noLinesAlertVisible) {
        throw new Error("Frontend no mostro validacion por lineas sin precio.");
    }
    result.checks.frontendValidationNoPricedLines = true;

    await page.locator("input[type='date']").first().fill(buildDatePlus(45));

    const addServiceButton = page.getByRole("button", { name: /Agregar servicio/i }).first();
    const addServiceVisible = await addServiceButton.isVisible().catch(() => false);
    if (addServiceVisible) {
        await addServiceButton.click();
    }

    const unitPriceInputs = page.locator("td input[type='number'][step='1000']");
    const unitPriceCount = await unitPriceInputs.count();
    if (unitPriceCount === 0) {
        throw new Error("No se encontro input de precio unitario en cotizacion.");
    }
    await unitPriceInputs.nth(unitPriceCount - 1).fill("250000");

    await page.locator(".card-footer").getByRole("button", { name: /^Guardar$/ }).first().click();
    await page.waitForFunction(
        () => !Array.from(document.querySelectorAll("h5")).some((n) => {
            const text = (n.textContent || "").toLowerCase();
            return text.includes("nueva cotizacion") || text.includes("editar cotizacion");
        }),
        null,
        { timeout: timeoutMs },
    );
    result.checks.quoteCreatedViaUi = true;

    const listAfterCreate = await apiRequest("GET", "/api/v1/crm-quotes/quotes", accessToken, null);
    const createdQuote = (listAfterCreate.items || []).find((item) => String(item.prospecto || "").trim() === testProspectName);
    if (!createdQuote || !createdQuote.id) {
        throw new Error("La cotizacion creada no aparece en API/Bd despues de guardar.");
    }
    createdQuoteId = String(createdQuote.id);
    createdQuoteToken = String(createdQuote.token || "");
    result.createdQuoteId = createdQuoteId;
    result.createdQuoteToken = createdQuoteToken;
    result.createdQuoteCodigo = String(createdQuote.codigo || "");
    result.checks.quoteFoundInApiAfterCreate = true;

    await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
    const createdRowVisible = await page.locator("tbody tr").filter({ hasText: testProspectName }).first().isVisible().catch(() => false);
    if (!createdRowVisible) {
        throw new Error("La cotizacion creada no aparece en tabla tras recargar.");
    }
    result.checks.quoteVisibleAfterReload = true;

    const editRow = page.locator("tbody tr").filter({ hasText: testProspectName }).first();
    await editRow.getByRole("button", { name: /Editar/i }).click();
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll("h5")).some((n) => (n.textContent || "").toLowerCase().includes("editar cotizacion")),
        null,
        { timeout: timeoutMs },
    );

    const updatedNote = `Nota actualizada ${testId}`;
    const updatedValidUntilIso = buildDatePlus(60);
    const notesArea = page.locator("textarea").first();
    await notesArea.fill(updatedNote);
    await page.locator("input[type='date']").first().fill(updatedValidUntilIso);

    await page.locator(".card-footer").getByRole("button", { name: /^Guardar$/ }).first().click();
    await page.waitForFunction(
        () => !Array.from(document.querySelectorAll("h5")).some((n) => (n.textContent || "").toLowerCase().includes("editar cotizacion")),
        null,
        { timeout: timeoutMs },
    );
    result.checks.quoteUpdatedViaUi = true;

    const quoteAfterUpdate = await apiRequest("GET", `/api/v1/crm-quotes/quotes/${encodeURIComponent(createdQuoteId)}`, accessToken, null);
    if (String(quoteAfterUpdate.validoHasta || "").trim() !== isoToLabel(updatedValidUntilIso)) {
        throw new Error("La actualizacion de cotizacion no se reflejo en API/Bd.");
    }
    result.checks.quoteUpdatedInApi = true;

    if (createdQuoteToken) {
        await page.goto(`${baseUrl.replace(/\/$/, "")}/estimate/${createdQuoteToken}`, { waitUntil: "networkidle", timeout: timeoutMs });
        const previewLoaded = await page.waitForFunction(
            () => {
                const bodyText = (document.body?.textContent || "").toLowerCase();
                return bodyText.includes("cotizacion") || bodyText.includes("estimate") || bodyText.includes("total");
            },
            null,
            { timeout: timeoutMs },
        ).then(() => true).catch(() => false);

        if (previewLoaded) {
            result.checks.quotePreviewLoaded = true;
        }

        await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/crm-cotizaciones`, "cotizacion");
    }

    const deleteRow = page.locator("tbody tr").filter({ hasText: testProspectName }).first();
    await deleteRow.getByRole("button", { name: /Eliminar/i }).click();
    await page.getByRole("button", { name: /^Eliminar$/ }).last().click();

    await page.waitForFunction(
        (codigo) => !Array.from(document.querySelectorAll("tbody tr")).some((tr) => (tr.textContent || "").includes(codigo)),
        testProspectName,
        { timeout: timeoutMs },
    );
    result.checks.quoteDeletedViaUi = true;

    const listAfterDelete = await apiRequest("GET", "/api/v1/crm-quotes/quotes", accessToken, null);
    const stillExists = (listAfterDelete.items || []).some((item) => String(item.id) === createdQuoteId);
    if (stillExists) {
        throw new Error("La cotizacion eliminada aun aparece en API/Bd.");
    }
    result.checks.quoteDeletedInApi = true;

    const screenshotPath = path.resolve("/tmp", `check-crm-cotizaciones-${testId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    console.log("RESULT_JSON=" + JSON.stringify(result, null, 2));
} catch (error) {
    console.error("RESULT_JSON=" + JSON.stringify(result, null, 2));
    console.error("CHECK_ERROR=" + (error instanceof Error ? error.stack || error.message : String(error)));
    process.exitCode = 1;
} finally {
    if (createdQuoteId && accessToken) {
        try {
            await apiRequest("DELETE", `/api/v1/crm-quotes/quotes/${encodeURIComponent(createdQuoteId)}`, accessToken, null);
        } catch {
            // ignore cleanup failures
        }
    }

    if (createdProspectId && accessToken) {
        try {
            await apiRequest("DELETE", `/api/v1/crm/prospects/${encodeURIComponent(createdProspectId)}`, accessToken, null);
            result.checks.prospectDeletedViaApi = true;
        } catch {
            // ignore cleanup failures
        }
    }

    if (browser) {
        await browser.close();
    }
}
