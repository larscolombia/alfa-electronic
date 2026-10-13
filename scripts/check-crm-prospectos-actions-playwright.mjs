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
        prospectsPageLoaded: false,
        prospectCreatedViaUi: false,
        prospectFoundInApiAfterCreate: false,
        prospectActionsRowVisible: false,
        actionAbrirFichaWorks: false,
        actionAsociarEquipoWorks: false,
        actionVerCotizacionesWorks: false,
        actionConvertirClienteWorks: false,
        convertedButtonDisabled: false,
        convertedClientFoundInApi: false,
        convertedClientVisibleInClientesPage: false,
    },
    createdProspectName: "",
    createdProspectId: "",
    createdClientId: "",
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
        const body = await response.text().catch(() => "");
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

async function waitForProspectRow(page, prospectName) {
    const row = page.locator("tbody tr").filter({ hasText: prospectName }).first();
    await row.waitFor({ state: "visible", timeout: timeoutMs });
    return row;
}

const testId = Date.now();
const testProspectName = `PW-Prospect-Actions-${testId}`;
const testCompanyName = "PW Prospect Actions Company";

let savedToken = "";
let createdProspectId = "";
let createdClientId = "";
let browser;

try {
    const session = await loginAndBuildSession(userEmail, userPassword);
    savedToken = session.accessToken;

    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });

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

    console.log("STEP 1: Create test prospect via UI …");
    await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/crm-prospectos`, "prospect");
    result.checks.prospectsPageLoaded = true;

    const addProspectButton = page.getByRole("button", { name: /Agregar Prospecto/i }).first();
    await addProspectButton.waitFor({ state: "visible", timeout: timeoutMs });
    await addProspectButton.scrollIntoViewIfNeeded();
    await addProspectButton.click();

    await page.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("h5")).some((n) =>
                (n.textContent || "").toLowerCase().includes("detalles del prospecto"),
            ),
        null,
        { timeout: timeoutMs },
    );

    await page.locator("input[name='formNombre']").fill(testProspectName);
    await page.locator("input[name='formCorreo']").fill(`pw-actions-${testId}@prueba.com`);
    await page.locator("input[name='formCompania']").fill(testCompanyName);

    const movilInput = page.locator("input[name='formMovil']");
    if (await movilInput.isVisible().catch(() => false)) {
        await movilInput.fill("3001234567");
    }

    await page.locator(".card-footer button", { hasText: "Guardar" }).first().click();

    await page.waitForFunction(
        () =>
            !Array.from(document.querySelectorAll("h5")).some((n) =>
                (n.textContent || "").toLowerCase().includes("detalles del prospecto"),
            ),
        null,
        { timeout: timeoutMs },
    );

    result.checks.prospectCreatedViaUi = true;
    result.createdProspectName = testProspectName;

    console.log("STEP 2: Verify test prospect in API …");
    const prospectsAfterCreate = await apiRequest("GET", "/api/v1/crm/prospects", savedToken, null);
    const createdProspect = (prospectsAfterCreate.items ?? []).find((item) => item.name === testProspectName);

    if (!createdProspect) {
        throw new Error(`BD FAIL: Prospecto "${testProspectName}" no fue encontrado en API.`);
    }

    createdProspectId = String(createdProspect.id || "").trim();
    result.createdProspectId = createdProspectId;
    result.checks.prospectFoundInApiAfterCreate = createdProspectId !== "";

    console.log("STEP 3: Validate all action buttons in prospect row …");
    await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/crm-prospectos`, "prospect");
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    const actionsRow = await waitForProspectRow(page, testProspectName);
    result.checks.prospectActionsRowVisible = true;

    const abrirFichaButton = actionsRow.getByRole("link", { name: /Abrir ficha/i }).first();
    await abrirFichaButton.click();
    await page.waitForURL(/\/app\/crm-prospectos\/[^/?#]+$/, { timeout: timeoutMs });
    await page.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("button.nav-link")).some((n) =>
                (n.textContent || "").trim() === "Contactos relacionados",
            ),
        null,
        { timeout: timeoutMs },
    );
    result.checks.actionAbrirFichaWorks = true;

    await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/crm-prospectos`, "prospect");
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    const rowForEquipment = await waitForProspectRow(page, testProspectName);
    const asociarEquipoButton = rowForEquipment.getByRole("button", { name: /Asociar equipo/i }).first();
    await asociarEquipoButton.click();

    const equipmentModalTitle = page.locator(".modal-title", { hasText: /Asociar equipo/i }).first();
    await equipmentModalTitle.waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.actionAsociarEquipoWorks = true;

    const closeEquipmentModalButton = page.locator("[data-testid='equipment-modal-close']").first();
    if (await closeEquipmentModalButton.isVisible().catch(() => false)) {
        await closeEquipmentModalButton.click();
    } else {
        await page.keyboard.press("Escape").catch(() => {});
    }
    await page.waitForFunction(
        () => Array.from(document.querySelectorAll(".modal.show")).length === 0,
        null,
        { timeout: timeoutMs },
    );

    const rowForQuotes = await waitForProspectRow(page, testProspectName);
    const verCotizacionesLink = rowForQuotes.getByRole("link", { name: /Ver cotizaciones/i }).first();
    await verCotizacionesLink.click();
    await page.waitForURL(/\/app\/crm-cotizaciones/, { timeout: timeoutMs });
    await page.waitForFunction(
        () =>
            Array.from(document.querySelectorAll("h5,h4,h3,h2,h1")).some((n) =>
                (n.textContent || "").toLowerCase().includes("cotizacion"),
            ),
        null,
        { timeout: timeoutMs },
    );
    result.checks.actionVerCotizacionesWorks = true;

    await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/crm-prospectos`, "prospect");
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

    const rowForConvert = await waitForProspectRow(page, testProspectName);
    const convertButton = rowForConvert.getByRole("button", { name: /Convertir a cliente/i }).first();
    await convertButton.waitFor({ state: "visible", timeout: timeoutMs });
    await convertButton.click();

    await page.waitForFunction(
        (prospectName) =>
            Array.from(document.querySelectorAll(".alert.alert-success")).some((n) =>
                (n.textContent || "").includes(`Prospecto ${prospectName} convertido a cliente correctamente.`),
            ),
        testProspectName,
        { timeout: timeoutMs },
    );

    const rowAfterConvert = await waitForProspectRow(page, testProspectName);
    const convertedButton = rowAfterConvert.getByRole("button", { name: /^Convertido$/i }).first();
    await convertedButton.waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.convertedButtonDisabled = await convertedButton.isDisabled();
    if (!result.checks.convertedButtonDisabled) {
        throw new Error("UI FAIL: El botón 'Convertido' no quedó deshabilitado.");
    }
    result.checks.actionConvertirClienteWorks = true;

    console.log("STEP 4: Verify converted client in API …");
    const clientsAfterConvert = await apiRequest(
        "GET",
        `/api/v1/crm/clients?search=${encodeURIComponent(testProspectName)}`,
        savedToken,
        null,
    );

    const convertedClient = (clientsAfterConvert.items ?? []).find(
        (item) =>
            String(item.nombre ?? "").trim() === testProspectName &&
            String(item.empresa ?? "").trim() === testCompanyName,
    );

    if (!convertedClient) {
        throw new Error(`BD FAIL: Cliente convertido para prospecto "${testProspectName}" no encontrado.`);
    }

    createdClientId = String(convertedClient.id || "").trim();
    result.createdClientId = createdClientId;
    result.checks.convertedClientFoundInApi = createdClientId !== "";

    console.log("STEP 5: Verify converted client is visible in CRM Clientes page …");
    await gotoAndWaitForHeading(page, `${baseUrl.replace(/\/$/, "")}/app/crm-clientes`, "clientes");
    await page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => {});

    await page.waitForFunction(
        (prospectName) =>
            Array.from(document.querySelectorAll("table.table tbody tr")).some((tr) =>
                (tr.textContent || "").includes(prospectName),
            ),
        testProspectName,
        { timeout: timeoutMs },
    );
    result.checks.convertedClientVisibleInClientesPage = true;

    const screenshotPath = path.join(process.cwd(), "playwright-crm-prospectos-actions-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const failedChecks = Object.entries(result.checks)
        .filter(([, value]) => value === false)
        .map(([key]) => key);

    if (failedChecks.length > 0 || pageErrors.length > 0) {
        console.error("PLAYWRIGHT_CRM_PROSPECTOS_ACTIONS_CHECK_FAILED");
        if (pageErrors.length > 0) {
            console.error("  Page errors:", pageErrors);
        }
        if (failedChecks.length > 0) {
            console.error("  Failed checks:", failedChecks);
        }
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_CRM_PROSPECTOS_ACTIONS_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_CRM_PROSPECTOS_ACTIONS_CHECK_ERROR");
    console.error(String(error?.stack || error));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (savedToken) {
        if (createdClientId) {
            await apiRequest("DELETE", `/api/v1/crm/clients/${createdClientId}`, savedToken, null).catch(() => null);
        }
        if (createdProspectId) {
            await apiRequest("DELETE", `/api/v1/crm/prospects/${createdProspectId}`, savedToken, null).catch(() => null);
        }
    }

    if (browser) {
        await browser.close();
    }
}
