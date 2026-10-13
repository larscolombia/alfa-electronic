import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";

const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return process.env.PW_API_BASE_URL;
    }

    const parsed = new URL(baseUrl);
    if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.port !== "8080") {
        parsed.port = "8080";
    }
    return parsed.origin;
})();

const consoleErrors = [];
const pageErrors = [];
const testId = Date.now();
const testToken = `PW-TimeInvoice-${testId}`;
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dueDate = new Date(today);
dueDate.setDate(today.getDate() + 15);

const result = {
    baseUrl,
    apiBaseUrl,
    testToken,
    checks: {
        backendValidationMissingClient: false,
        backendValidationZeroRate: false,
        frontendValidationMissingClient: false,
        frontendValidationInvalidRate: false,
        frontendValidationMissingEntries: false,
        invoiceCreatedViaUi: false,
        invoiceFoundInApiAfterCreate: false,
        invoiceVisibleAfterReload: false,
        invoiceUpdatedInApi: false,
        invoiceDeletedInApi: false,
    },
    createdInvoiceId: 0,
    createdInvoiceCode: "",
    screenshotPath: "",
    consoleErrors,
    pageErrors,
};

function dateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isoAt(date, hour, minute) {
    const next = new Date(date);
    next.setHours(hour, minute, 0, 0);
    return next.toISOString();
}

async function selectByIndex(page, name, index) {
    await page.evaluate(
        ({ fieldName, optionIndex }) => {
            const select = document.querySelector(`select[name='${fieldName}']`);
            if (!select) {
                throw new Error(`select ${fieldName} not found`);
            }

            select.selectedIndex = optionIndex;
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
        },
        { fieldName: name, optionIndex: index },
    );

    await page.waitForFunction(
        (fieldName) => {
            const select = document.querySelector(`select[name='${fieldName}']`);
            return Boolean(select && select.value);
        },
        name,
        { timeout: timeoutMs },
    );
}

async function waitForAlertText(page, text) {
    return page
        .waitForFunction(
            (expectedText) => {
                const normalized = expectedText.toLowerCase();
                return Array.from(document.querySelectorAll(".alert-danger")).some((alert) => (alert.textContent || "").toLowerCase().includes(normalized));
            },
            text,
            { timeout: 10000 },
        )
        .then(() => true)
        .catch(() => false);
}

async function login() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`login failed ${response.status}: ${body}`);
    }

    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

async function api(method, urlPath, token, body) {
    const response = await fetch(`${apiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
            Authorization: `Bearer ${token}`,
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();
    if (!response.ok) {
        throw new Error(`${method} ${urlPath} -> ${response.status}: ${text}`);
    }

    return text ? JSON.parse(text) : null;
}

function buildValidInvoicePayload(overrides = {}) {
    return {
        id: 0,
        referenceCode: "TS",
        seriesPrefix: "PW-TIME-",
        sequenceNumber: 900001,
        projectId: "pw-project-time",
        projectName: "PW Proyecto Tiempo",
        clientId: "pw-client-time",
        clientName: "PW Cliente Tiempo",
        billingAddress: "Direccion QA",
        shippingAddress: "Direccion QA",
        issueDate: dateValue(today),
        dueDate: dateValue(dueDate),
        currencyCode: "COP",
        exchangeRate: 1,
        bankAccountId: null,
        bankAccountName: "--",
        taxCalculation: "Despues del descuento",
        generatedBy: "Equipo comercial",
        items: [
            {
                id: `time-entry-${testId}`,
                name: `Servicio tiempo ${testToken}`,
                description: `Registro facturable ${testToken}`,
                quantity: 2.5,
                unitLabel: "Hora",
                unitPrice: 185000,
                taxRate: 19,
                attachmentName: "",
            },
        ],
        discountValue: 0,
        discountMode: "percent",
        subtotal: 0,
        taxTotal: 0,
        total: 0,
        paidAmount: 0,
        balanceAmount: 0,
        status: "Pendiente",
        note: `Factura de tiempo ${testToken}`,
        terms: "Terminos QA",
        attachmentName: "",
        receivedPayment: false,
        source: "timesheet",
        createdAt: new Date().toISOString(),
        ...overrides,
    };
}

const timesheetState = {
    daily: [],
    timesheetEntries: [
        {
            id: `pw-timesheet-${testId}`,
            project: `Proyecto QA ${testToken}`,
            task: `Trabajo facturable ${testToken}`,
            employee: `QA ${testId}`,
            startAt: isoAt(today, 8, 0),
            endAt: isoAt(today, 10, 30),
            memo: `Memo ${testToken}`,
            totalHours: 2.5,
            createdAt: new Date().toISOString(),
        },
    ],
};

let token = "";
let browser;

try {
    const session = await login();
    token = session.accessToken;

    let missingClientRejected = false;
    try {
        await api("POST", "/api/v1/finance/invoices", token, buildValidInvoicePayload({ clientId: "", clientName: "" }));
    } catch (error) {
        missingClientRejected = String(error).includes("400");
    }
    if (!missingClientRejected) {
        throw new Error("Backend accepted a time invoice without client.");
    }
    result.checks.backendValidationMissingClient = true;

    let zeroRateRejected = false;
    try {
        await api(
            "POST",
            "/api/v1/finance/invoices",
            token,
            buildValidInvoicePayload({
                items: [{ ...buildValidInvoicePayload().items[0], unitPrice: 0 }],
            }),
        );
    } catch (error) {
        zeroRateRejected = String(error).includes("400");
    }
    if (!zeroRateRejected) {
        throw new Error("Backend accepted a time invoice line with zero hourly rate.");
    }
    result.checks.backendValidationZeroRate = true;

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1440, height: 920 } });
    await context.addInitScript(
        ({ storedSession, apiBase, state }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            window.localStorage.setItem("lars.work.time.tracker.v1", JSON.stringify(state));
        },
        { storedSession: session, apiBase: apiBaseUrl, state: timesheetState },
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

    await page.goto(`${baseUrl.replace(/\/$/, "")}/app/finance-facturacion-tiempo`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll("h5,h4,h3,h2,h1")).some((node) => (node.textContent || "").toLowerCase().includes("registro de tiempo")),
        null,
        { timeout: timeoutMs },
    );

    await page.getByRole("button", { name: /^Guardar factura$/i }).click();
    result.checks.frontendValidationMissingClient = await waitForAlertText(page, "cliente");
    if (!result.checks.frontendValidationMissingClient) {
        throw new Error("Frontend did not show client validation.");
    }

    await selectByIndex(page, "clientId", 1);
    await page.locator("input[name='sequenceNumber']").fill(String(900000 + (testId % 100000)));
    await page.locator("input[name='issueDate']").fill(dateValue(today));
    await page.locator("input[name='dueDate']").fill(dateValue(dueDate));
    await page.locator("input[name='hourlyRate']").fill("185000");
    await page.locator("textarea[name='note']").fill(`Factura de tiempo ${testToken}`);
    await page.getByRole("button", { name: /^Guardar factura$/i }).click();
    result.checks.frontendValidationMissingEntries = await waitForAlertText(page, "entrada");
    if (!result.checks.frontendValidationMissingEntries) {
        throw new Error("Frontend did not show selected entries validation.");
    }

    await page.getByRole("button", { name: /Seleccionar visibles/i }).click();
    await page.locator("input[name='hourlyRate']").fill("0");
    await page.getByRole("button", { name: /^Guardar factura$/i }).click();
    result.checks.frontendValidationInvalidRate = await waitForAlertText(page, "tarifa");
    if (!result.checks.frontendValidationInvalidRate) {
        throw new Error("Frontend did not show hourly rate validation.");
    }

    await page.locator("input[name='hourlyRate']").fill("185000");
    await page.getByRole("button", { name: /^Guardar factura$/i }).click();
    await page.waitForURL(/\/app\/finance-facturacion$/, { timeout: timeoutMs });
    result.checks.invoiceCreatedViaUi = true;

    const invoicesAfterCreate = await api("GET", "/api/v1/finance/invoices", token, null);
    const created = (invoicesAfterCreate.items || []).find((invoice) => {
        const noteMatches = String(invoice.note || "").includes(testToken);
        const itemMatches = (invoice.items || []).some((item) => String(item.description || "").includes(testToken) || String(item.name || "").includes(testToken));
        return noteMatches || itemMatches;
    });
    if (!created || !created.id) {
        throw new Error("The time invoice created from UI was not found in API/DB.");
    }
    result.createdInvoiceId = Number(created.id);
    result.createdInvoiceCode = `${created.seriesPrefix}${String(created.sequenceNumber).padStart(3, "0")}`;

    const createdItem = (created.items || [])[0];
    if (String(created.source) !== "timesheet" || !createdItem || Number(createdItem.quantity) !== 2.5 || Number(createdItem.unitPrice) !== 185000) {
        throw new Error("The persisted time invoice does not match the selected time entry and hourly rate.");
    }
    result.checks.invoiceFoundInApiAfterCreate = true;

    await page.goto(`${baseUrl.replace(/\/$/, "")}/app/finance-facturacion`, { waitUntil: "networkidle", timeout: timeoutMs });
    result.checks.invoiceVisibleAfterReload = await page
        .waitForFunction(
            (invoiceCode) => Array.from(document.querySelectorAll("tbody tr")).some((row) => (row.textContent || "").includes(invoiceCode)),
            result.createdInvoiceCode,
            { timeout: timeoutMs },
        )
        .then(() => true)
        .catch(() => false);
    if (!result.checks.invoiceVisibleAfterReload) {
        throw new Error("The time invoice was not visible in the invoice list after reload.");
    }

    const updatedNote = `Factura de tiempo actualizada ${testToken}`;
    await api("PUT", `/api/v1/finance/invoices/${encodeURIComponent(String(result.createdInvoiceId))}`, token, {
        ...created,
        status: "Pagado",
        note: updatedNote,
    });
    const updated = await api("GET", `/api/v1/finance/invoices/${encodeURIComponent(String(result.createdInvoiceId))}`, token, null);
    if (String(updated.status) !== "Pagado" || String(updated.note) !== updatedNote) {
        throw new Error("The time invoice update was not persisted in API/DB.");
    }
    result.checks.invoiceUpdatedInApi = true;

    await api("DELETE", `/api/v1/finance/invoices/${encodeURIComponent(String(result.createdInvoiceId))}`, token, null);
    const invoicesAfterDelete = await api("GET", "/api/v1/finance/invoices", token, null);
    const stillExists = (invoicesAfterDelete.items || []).some((invoice) => Number(invoice.id) === result.createdInvoiceId);
    if (stillExists) {
        throw new Error("The deleted time invoice still appears in API/DB.");
    }
    result.checks.invoiceDeletedInApi = true;

    const screenshotPath = path.resolve("/tmp", `check-finance-facturacion-tiempo-crud-db-${testId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    console.log("RESULT_JSON=" + JSON.stringify(result, null, 2));
} catch (error) {
    console.error("RESULT_JSON=" + JSON.stringify(result, null, 2));
    console.error("CHECK_ERROR=" + (error?.stack || error?.message || String(error)));
    process.exitCode = 1;
} finally {
    if (result.createdInvoiceId && token) {
        try {
            await api("DELETE", `/api/v1/finance/invoices/${encodeURIComponent(String(result.createdInvoiceId))}`, token, null);
        } catch {
            // Ignore cleanup failures.
        }
    }

    if (browser) {
        await browser.close();
    }
}