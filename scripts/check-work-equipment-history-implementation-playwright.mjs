import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const targetIdentifier = String(process.env.PW_EQUIPMENT_IDENTIFIER || "CO260206").trim();
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    }

    const parsed = new URL(normalizedBaseUrl);
    return parsed.origin;
})();

const result = {
    baseUrl: normalizedBaseUrl,
    apiBaseUrl,
    identifier: targetIdentifier,
    finalUrl: "",
    checks: {
        loggedIn: false,
        directHistoryLoaded: false,
        workTeamsLinkVisible: false,
        workTeamsNavigationOk: false,
        kanbanHistoryButtonVisible: false,
        kanbanNavigationOk: false,
    },
    notes: [],
    screenshotPath: "",
    consoleErrors: [],
    pageErrors: [],
    error: "",
};

let browser;

function assertOrThrow(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function pushUnique(target, text) {
    const value = String(text || "").trim();
    if (!value || target.includes(value)) {
        return;
    }

    if (target.length < 12) {
        target.push(value);
    }
}

async function login() {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": companyId,
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

async function assertHistoryPageLoaded(page) {
    await page.waitForURL(/\/app\/work-equipment-history/, { timeout: timeoutMs });
    result.finalUrl = page.url();

    const titleLocator = page.locator("h5", { hasText: /Historial/i }).first();
    const titleVisible = await titleLocator.isVisible({ timeout: 8000 }).catch(() => false);

    if (!titleVisible) {
        const fallbackTitleVisible = await page.locator("h6", { hasText: /Historial/i }).first().isVisible({ timeout: 8000 }).catch(() => false);
        assertOrThrow(fallbackTitleVisible, "No se detecto el encabezado de historial tecnico.");
    }

    result.checks.directHistoryLoaded = true;
}

try {
    const session = await login();
    result.checks.loggedIn = true;

    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });

    await context.addInitScript(
        ({ authSession, apiBase, identifier }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            window.sessionStorage.setItem(
                "work.equipment.history.context.v1",
                JSON.stringify({
                    reference: "",
                    identifier,
                    projectId: "",
                    origin: "playwright-history-smoke",
                }),
            );
        },
        {
            authSession: session,
            apiBase: apiBaseUrl,
            identifier: targetIdentifier,
        },
    );

    const page = await context.newPage();

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            pushUnique(result.consoleErrors, msg.text());
        }
    });

    page.on("pageerror", (error) => {
        pushUnique(result.pageErrors, error?.stack || error?.message || String(error));
    });

    await page.goto(`${normalizedBaseUrl}/app/work-equipment-history`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });

    assertOrThrow(!page.url().includes("/auth/signin"), "Sesion no autenticada: redirigio a /auth/signin");
    await assertHistoryPageLoaded(page);

    const similaritySectionVisible = await page.locator("h6", { hasText: /Equipos similares/i }).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!similaritySectionVisible) {
        result.notes.push("No se detecto la seccion de equipos similares en la carga inicial.");
    }

    await page.goto(`${normalizedBaseUrl}/app/work-teams`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });
    assertOrThrow(!page.url().includes("/auth/signin"), "Sesion no autenticada al abrir Work Teams");

    await page.waitForSelector("[data-testid='work-equipment-create']", { timeout: timeoutMs });

    const workTeamsHistoryLink = page.locator(".equipment-preview button").first();
    result.checks.workTeamsLinkVisible = await workTeamsHistoryLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (result.checks.workTeamsLinkVisible) {
        await workTeamsHistoryLink.click();
        await page.waitForURL(/\/app\/work-equipment-history/, { timeout: timeoutMs });
        result.checks.workTeamsNavigationOk = true;
    } else {
        result.notes.push("No se encontro enlace de historial en Work Teams durante la prueba.");
    }

    await page.goto(`${normalizedBaseUrl}/app/work-projects`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });
    assertOrThrow(!page.url().includes("/auth/signin"), "Sesion no autenticada al abrir Work Projects");

    const projectCard = page.locator(".project-card").first();
    const cardVisible = await projectCard.isVisible({ timeout: 7000 }).catch(() => false);

    if (!cardVisible) {
        result.notes.push("No se encontraron tarjetas en Kanban para validar acceso a historial desde detalle.");
    } else {
        await projectCard.click();
        const detailDialog = page.locator(".project-detail-dialog").first();
        const detailVisible = await detailDialog.isVisible({ timeout: timeoutMs }).catch(() => false);

        if (!detailVisible) {
            result.notes.push("No se pudo abrir el detalle de proyecto en Kanban.");
        } else {
            const historyButton = page.locator("button", { hasText: /Historial tecnico completo/i }).first();
            result.checks.kanbanHistoryButtonVisible = await historyButton.isVisible({ timeout: 8000 }).catch(() => false);

            if (result.checks.kanbanHistoryButtonVisible) {
                await historyButton.click();
                await page.waitForURL(/\/app\/work-equipment-history/, { timeout: timeoutMs });
                result.checks.kanbanNavigationOk = true;
            } else {
                result.notes.push("No se detecto el boton 'Historial tecnico completo' en detalle de Kanban.");
            }
        }
    }

    const hasAtLeastOneEntryFlow = result.checks.workTeamsNavigationOk || result.checks.kanbanNavigationOk;
    assertOrThrow(result.checks.loggedIn && result.checks.directHistoryLoaded && hasAtLeastOneEntryFlow, "No se logro validar navegacion a historial desde las rutas esperadas.");

    const screenshotPath = path.resolve(artifactsDir, `work-equipment-history-impl-ok-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    console.log("PLAYWRIGHT_WORK_EQUIPMENT_HISTORY_IMPL_OK");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);

    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const screenshotPath = path.resolve(artifactsDir, `work-equipment-history-impl-failure-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: screenshotPath, fullPage: true });
            result.screenshotPath = screenshotPath;
        }
    } catch {
        // Ignore screenshot errors.
    }

    console.error("PLAYWRIGHT_WORK_EQUIPMENT_HISTORY_IMPL_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
