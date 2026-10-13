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
        backendValidationBancoWithoutBankName: false,
        backendValidationNegativeBalance: false,
        frontendValidationMissingHolderAndAccount: false,
        frontendValidationBankNameRequired: false,
        accountCreatedViaUi: false,
        accountFoundInApiAfterCreate: false,
        accountVisibleAfterReload: false,
        accountUpdatedViaUi: false,
        accountUpdatedInApi: false,
        accountDeletedViaUi: false,
        accountDeletedInApi: false,
    },
    createdAccountId: 0,
    createdAccountNumber: "",
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

async function apiRequestExpectingStatus(method, urlPath, accessToken, body, expectedStatus) {
    const response = await fetch(`${resolvedApiBaseUrl}${urlPath}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });

    const responseText = await response.text().catch(() => "");
    if (response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus} for ${method} ${urlPath} but got ${response.status}: ${responseText}`);
    }

    return responseText;
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

const testId = Date.now();
const accountNumber = `PW-ACC-${testId}`;
const updatedAccountNumber = `${accountNumber}-UPD`;
let accessToken = "";
let createdAccountId = 0;
let browser;

try {
    const session = await loginAndBuildSession(userEmail, userPassword);
    accessToken = session.accessToken;

    await apiRequestExpectingStatus("POST", "/api/v1/finance/accounts", accessToken, {
        accountType: "Banco",
        bankName: "",
        holderName: "Usuario Prueba",
        accountNumber,
        productType: "Ahorros",
        currencyCode: "COP",
        contactNumber: "3001234567",
        initialBalance: 10000,
        status: "Activa",
        logoFileName: "",
    }, 400);
    result.checks.backendValidationBancoWithoutBankName = true;

    await apiRequestExpectingStatus("POST", "/api/v1/finance/accounts", accessToken, {
        accountType: "Efectivo",
        bankName: "",
        holderName: "Usuario Prueba",
        accountNumber: `${accountNumber}-NEG`,
        productType: "Caja menor",
        currencyCode: "COP",
        contactNumber: "3001234567",
        initialBalance: -10,
        status: "Activa",
        logoFileName: "",
    }, 400);
    result.checks.backendValidationNegativeBalance = true;

    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1500, height: 900 } });

    await context.addInitScript(
        ({ storedSession, apiBaseUrl }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBaseUrl);
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

    await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/finance-cuentas`, "cuentas");

    await page.locator("input[name='holderName']").fill("");
    await page.locator("input[name='accountNumber']").fill("");
    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    const missingHolderAlert = await page.locator(".alert-danger").filter({ hasText: /titular|numero de cuenta/i }).first().isVisible().catch(() => false);
    result.checks.frontendValidationMissingHolderAndAccount = missingHolderAlert;

    await page.locator("#typeBank").check();
    await page.locator("input[name='bankName']").fill("");
    await page.locator("input[name='holderName']").fill("Titular UI Test");
    await page.locator("input[name='accountNumber']").fill(accountNumber);
    await page.getByRole("button", { name: /^Guardar$/ }).first().click();
    const bankRequiredAlert = await page.locator(".alert-danger").filter({ hasText: /banco|nombre/i }).first().isVisible().catch(() => false);
    result.checks.frontendValidationBankNameRequired = bankRequiredAlert;

    await page.locator("input[name='bankName']").fill("Banco QA");
    await page.locator("input[name='holderName']").fill("Titular QA");
    await page.locator("input[name='accountNumber']").fill(accountNumber);
    await page.locator("select[name='productType']").selectOption("Ahorros");
    await page.locator("select[name='currencyCode']").selectOption("COP");
    await page.locator("input[name='contactNumber']").fill("3001234567");
    await page.locator("input[name='initialBalance']").fill("125000");
    await page.locator("select[name='status']").selectOption("Activa");
    await page.getByRole("button", { name: /^Guardar$/ }).first().click();

    await page.waitForFunction(
        (searchedAccountNumber) => {
            const successVisible = Array.from(document.querySelectorAll(".alert-success")).some((node) => {
                const text = (node.textContent || "").toLowerCase();
                return text.includes("creada") || text.includes("actualizada");
            });
            const rowVisible = Array.from(document.querySelectorAll("tbody tr")).some((tr) => (tr.textContent || "").includes(searchedAccountNumber));
            return successVisible || rowVisible;
        },
        accountNumber,
        { timeout: timeoutMs },
    );
    result.checks.accountCreatedViaUi = true;

    const accountsAfterCreate = await apiRequest("GET", "/api/v1/finance/accounts", accessToken, null);
    const created = (accountsAfterCreate.items || []).find((item) => String(item.accountNumber || "") === accountNumber);
    if (!created || !created.id) {
        throw new Error("La cuenta creada no aparece en API/BD despues del guardado.");
    }
    createdAccountId = Number(created.id);
    result.createdAccountId = createdAccountId;
    result.createdAccountNumber = accountNumber;
    result.checks.accountFoundInApiAfterCreate = true;

    await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
    const rowVisibleAfterReload = await page.locator("tbody tr").filter({ hasText: accountNumber }).first().isVisible().catch(() => false);
    if (!rowVisibleAfterReload) {
        throw new Error("La cuenta no aparece en la tabla tras recargar.");
    }
    result.checks.accountVisibleAfterReload = true;

    const row = page.locator("tbody tr").filter({ hasText: accountNumber }).first();
    await row.getByRole("button", { name: /Editar/i }).click();

    await page.locator("input[name='bankName']").fill("Banco QA Actualizado");
    await page.locator("input[name='holderName']").fill("Titular QA Editado");
    await page.locator("input[name='accountNumber']").fill(updatedAccountNumber);
    await page.locator("input[name='initialBalance']").fill("500000");
    await page.locator("select[name='status']").selectOption("Inactiva");
    await page.getByRole("button", { name: /^Actualizar$/ }).first().click();

    await page.locator(".alert-success").filter({ hasText: /actualizada correctamente/i }).first().waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.accountUpdatedViaUi = true;

    const updatedFromApi = await apiRequest("GET", `/api/v1/finance/accounts/${encodeURIComponent(String(createdAccountId))}`, accessToken, null);
    if (String(updatedFromApi.accountNumber || "") !== updatedAccountNumber || String(updatedFromApi.status || "") !== "Inactiva" || Number(updatedFromApi.initialBalance || 0) !== 500000) {
        throw new Error("La actualizacion de la cuenta no se reflejo en API/BD.");
    }
    result.checks.accountUpdatedInApi = true;

    const updatedRow = page.locator("tbody tr").filter({ hasText: updatedAccountNumber }).first();
    await updatedRow.getByRole("button", { name: /Eliminar/i }).click();

    await page.waitForFunction(
        (searchedAccountNumber) => !Array.from(document.querySelectorAll("tbody tr")).some((tr) => (tr.textContent || "").includes(searchedAccountNumber)),
        updatedAccountNumber,
        { timeout: timeoutMs },
    );
    result.checks.accountDeletedViaUi = true;

    const accountsAfterDelete = await apiRequest("GET", "/api/v1/finance/accounts", accessToken, null);
    const stillExists = (accountsAfterDelete.items || []).some((item) => Number(item.id) === createdAccountId);
    if (stillExists) {
        throw new Error("La cuenta eliminada sigue apareciendo en API/BD.");
    }
    result.checks.accountDeletedInApi = true;

    const screenshotPath = path.resolve("/tmp", `check-finance-cuentas-crud-db-${testId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    console.log("RESULT_JSON=" + JSON.stringify(result, null, 2));
} catch (error) {
    console.error("RESULT_JSON=" + JSON.stringify(result, null, 2));
    console.error("CHECK_ERROR=" + (error instanceof Error ? error.stack || error.message : String(error)));
    process.exitCode = 1;
} finally {
    if (createdAccountId > 0 && accessToken) {
        try {
            await apiRequest("DELETE", `/api/v1/finance/accounts/${encodeURIComponent(String(createdAccountId))}`, accessToken, null);
        } catch {
            // ignore cleanup failures
        }
    }

    if (browser) {
        await browser.close();
    }
}
