import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "90000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";

const AUTH_STORAGE_KEY = "pika.auth.session";
const API_BASE_STORAGE_KEY = "pika.apiBaseUrl";
const fullBaseUrl = baseUrl.replace(/\/$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    }

    const parsed = new URL(fullBaseUrl);
    return parsed.origin;
})();

const result = {
    baseUrl: fullBaseUrl,
    finalUrl: "",
    status: null,
    checks: {
        loggedIn: false,
        trabajoMenuOpened: false,
        receptionMenuItemVisible: false,
        receptionNavigationOk: false,
        receptionTitleOk: false,
        noMockWarningVisible: false,
        actionButtonsVisible: false,
        editActionWorks: false,
        archiveRestoreActionWorks: false,
        receptionModalOpenCloseOk: false,
        legacyRouteStillWorks: false,
    },
    screenshotPath: "",
    consoleErrors: [],
    pageErrors: [],
};

let browser;

async function login() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
        },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`login failed ${response.status}: ${body}`);
    }

    const payload = await response.json();
    return {
        ...payload,
        expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000,
    };
}

function pushLimitedError(target, value) {
    const text = String(value || "").trim();
    if (!text) {
        return;
    }

    if (target.includes(text)) {
        return;
    }

    if (target.length < 10) {
        target.push(text);
    }
}

async function waitForReceptionPageReady(page) {
    const loadingAlert = page.locator(".alert.alert-info", { hasText: /Cargando recepciones/i }).first();
    await loadingAlert.waitFor({ state: "detached", timeout: timeoutMs }).catch(() => {});
    await page.waitForSelector("[data-testid='work-equipment-filter-summary']", { timeout: timeoutMs });
}

async function clickCreateButtonSafely(page) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const createButton = page.getByTestId("work-equipment-create");
        await createButton.waitFor({ state: "visible", timeout: timeoutMs });

        try {
            await createButton.click({ timeout: timeoutMs });
            return;
        } catch (error) {
            if (attempt === 2) {
                throw error;
            }

            await waitForReceptionPageReady(page);
        }
    }
}

async function firstVisibleActionButton(page, selector) {
    const candidates = page.locator(selector);
    const count = await candidates.count();

    for (let index = 0; index < count; index++) {
        const button = candidates.nth(index);
        const isVisible = await button.isVisible().catch(() => false);
        if (isVisible) {
            return button;
        }
    }

    return null;
}

try {
    const session = await login();
    result.checks.loggedIn = true;

    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1200 } });

    await context.addInitScript(
        ({ authStorageKey, apiStorageKey, session, apiBase }) => {
            window.localStorage.setItem(authStorageKey, JSON.stringify(session));
            window.localStorage.setItem(apiStorageKey, apiBase);
        },
        {
            authStorageKey: AUTH_STORAGE_KEY,
            apiStorageKey: API_BASE_STORAGE_KEY,
            session,
            apiBase: apiBaseUrl,
        },
    );

    const page = await context.newPage();
    page.on("console", (msg) => {
        if (msg.type() === "error") {
            pushLimitedError(result.consoleErrors, msg.text());
        }
    });
    page.on("pageerror", (error) => {
        pushLimitedError(result.pageErrors, error?.stack || error?.message || String(error));
    });

    const response = await page.goto(`${fullBaseUrl}/app/dashboard`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });

    result.status = response ? response.status() : null;

    const trabajoMenuButton = page.locator("a.nav-link.dropdown-toggle", { hasText: "Trabajo" }).first();
    await trabajoMenuButton.waitFor({ state: "visible", timeout: timeoutMs });
    await trabajoMenuButton.click();
    result.checks.trabajoMenuOpened = true;

    const receptionLink = page.locator("a.nav-link", { hasText: "Recepción de equipos" }).first();
    await receptionLink.waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.receptionMenuItemVisible = true;

    await receptionLink.click();
    await page.waitForURL("**/app/work-equipment-reception", { timeout: timeoutMs });
    result.checks.receptionNavigationOk = /\/app\/work-equipment-reception$/.test(page.url());

    const receptionTitle = page.locator("h5", { hasText: "Trabajo - Recepción de equipos" }).first();
    await receptionTitle.waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.receptionTitleOk = await receptionTitle.isVisible();
    await waitForReceptionPageReady(page);

    const mockWarningVisible = await page.locator(".alert.alert-warning", { hasText: /mock/i }).first().isVisible().catch(() => false);
    result.checks.noMockWarningVisible = !mockWarningVisible;

    const todosFilter = page.getByTestId("work-equipment-filter-todos");
    await todosFilter.waitFor({ state: "visible", timeout: timeoutMs });
    await todosFilter.click({ timeout: timeoutMs });
    await page.waitForTimeout(600);

    const editButtons = page.locator("button[data-testid^='work-equipment-edit-']");
    const archiveButtons = page.locator("button[data-testid^='work-equipment-archive-']");
    const restoreButtons = page.locator("button[data-testid^='work-equipment-restore-']");

    const firstEdit = await firstVisibleActionButton(page, "button[data-testid^='work-equipment-edit-']");
    const firstArchiveVisible = await firstVisibleActionButton(page, "button[data-testid^='work-equipment-archive-']");
    const firstRestoreVisible = await firstVisibleActionButton(page, "button[data-testid^='work-equipment-restore-']");

    result.checks.actionButtonsVisible = Boolean(firstEdit || firstArchiveVisible || firstRestoreVisible);

    if (!result.checks.actionButtonsVisible) {
        throw new Error("No hay filas de equipos para validar los botones de acción.");
    }

    if (!firstEdit) {
        throw new Error("No se encontró botón visible de edición para validar acciones.");
    }

    await firstEdit.waitFor({ state: "visible", timeout: timeoutMs });
    await firstEdit.click({ timeout: timeoutMs });
    await page.getByTestId("equipment-modal-close").waitFor({ state: "visible", timeout: timeoutMs });
    await page.getByTestId("equipment-modal-close").click();
    await page.getByTestId("equipment-modal-close").waitFor({ state: "detached", timeout: timeoutMs });
    result.checks.editActionWorks = true;

    if (firstArchiveVisible) {
        const firstArchive = firstArchiveVisible;
        const archiveTestId = String((await firstArchive.getAttribute("data-testid")) || "").trim();
        const recordId = archiveTestId.replace(/^work-equipment-archive-/, "");

        await firstArchive.click({ timeout: timeoutMs });
        await page.getByRole("button", { name: /Si, archivar/i }).first().click({ timeout: timeoutMs });
        await page.locator(`button[data-testid='work-equipment-restore-${recordId}']`).first().waitFor({ state: "visible", timeout: timeoutMs });

        await page.locator(`button[data-testid='work-equipment-restore-${recordId}']`).first().click({ timeout: timeoutMs });
        await page.locator(`button[data-testid='work-equipment-archive-${recordId}']`).first().waitFor({ state: "visible", timeout: timeoutMs });
        result.checks.archiveRestoreActionWorks = true;
    } else if (firstRestoreVisible) {
            const firstRestore = firstRestoreVisible;
            const restoreTestId = String((await firstRestore.getAttribute("data-testid")) || "").trim();
            const recordId = restoreTestId.replace(/^work-equipment-restore-/, "");

            await firstRestore.click({ timeout: timeoutMs });
            await page.locator(`button[data-testid='work-equipment-archive-${recordId}']`).first().waitFor({ state: "visible", timeout: timeoutMs });
            result.checks.archiveRestoreActionWorks = true;
    }

    await clickCreateButtonSafely(page);
    await page.getByTestId("equipment-modal-cancel").waitFor({ state: "visible", timeout: timeoutMs });
    await page.getByTestId("equipment-modal-cancel").click();
    await page.getByTestId("equipment-modal-cancel").waitFor({ state: "detached", timeout: timeoutMs });
    result.checks.receptionModalOpenCloseOk = true;

    await page.goto(`${fullBaseUrl}/app/work-teams`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });

    const legacyTitle = page.locator("h5", { hasText: "Trabajo - Equipos" }).first();
    await legacyTitle.waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.legacyRouteStillWorks = await legacyTitle.isVisible();

    result.finalUrl = page.url();
    result.screenshotPath = path.join(artifactsDir, "work-equipment-reception-menu-check.png");
    await page.screenshot({ path: result.screenshotPath, fullPage: true });

    const allChecksPass = Object.values(result.checks).every(Boolean);
    if (!allChecksPass) {
        throw new Error("Una o mas validaciones de Recepcion de equipos no pasaron.");
    }

    console.log("PLAYWRIGHT_WORK_EQUIPMENT_RECEPTION_MENU_CHECK_OK");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error("PLAYWRIGHT_WORK_EQUIPMENT_RECEPTION_MENU_CHECK_ERROR");
    console.error(error?.stack || error?.message || String(error));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
