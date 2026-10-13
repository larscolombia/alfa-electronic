import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://pika.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const targetIdentifier = String(process.env.PW_EQUIPMENT_IDENTIFIER || "CO260206").trim();
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBase = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
    }

    const parsed = new URL(normalizedBase);
    return parsed.origin;
})();

const result = {
    baseUrl: normalizedBase,
    apiBaseUrl,
    identifier: targetIdentifier,
    checks: {
        loggedIn: false,
        historyLoaded: false,
        analyzeButtonVisible: false,
        insightsRequestCaptured: false,
        insightsStatusIsNot404: false,
        lubotMessageHasNo404Warning: false,
    },
    insightsRequestUrl: "",
    insightsStatus: 0,
    lubotMessage: "",
    screenshotPath: "",
    error: "",
};

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

let browser;

try {
    const session = await login();
    result.checks.loggedIn = true;

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    await context.addInitScript(
        ({ storedSession, apiBase, identifier }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBase);
            window.sessionStorage.setItem(
                "work.equipment.history.context.v1",
                JSON.stringify({
                    reference: "",
                    identifier,
                    projectId: "",
                    origin: "playwright-lubot-ai",
                }),
            );
        },
        {
            storedSession: session,
            apiBase: apiBaseUrl,
            identifier: targetIdentifier,
        },
    );

    const page = await context.newPage();

    await page.goto(`${normalizedBase}/app/work-equipment-history`, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
    });

    await page.waitForURL(/\/app\/work-equipment-history/, { timeout: timeoutMs });
    const historyHeader = page.locator("h5", { hasText: /Historial técnico por equipo/i }).first();
    await historyHeader.waitFor({ state: "visible", timeout: timeoutMs });

    result.checks.historyLoaded = true;

    const analyzeButton = page.getByRole("button", { name: /Analizar con Lubot AI/i }).first();
    await analyzeButton.waitFor({ state: "visible", timeout: timeoutMs });
    result.checks.analyzeButtonVisible = true;

    const insightsResponsePromise = page.waitForResponse(
        (response) => response.request().method() === "GET" && response.url().includes("/api/v1/crm-equipment/insights"),
        { timeout: 45000 },
    );

    const clickResult = await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll("button")).find((node) =>
            (node.textContent || "").includes("Analizar con Lubot AI"),
        );

        if (!button) {
            return { found: false, disabled: null };
        }

        const disabled = button.hasAttribute("disabled");
        if (!disabled) {
            button.click();
        }

        return { found: true, disabled };
    });
    if (!clickResult.found || clickResult.disabled) {
        throw new Error("analyze button is not clickable");
    }

    const insightsResponse = await insightsResponsePromise;
    result.checks.insightsRequestCaptured = true;
    result.insightsRequestUrl = insightsResponse.url();
    result.insightsStatus = insightsResponse.status();
    result.checks.insightsStatusIsNot404 = insightsResponse.status() !== 404;

    await page.waitForTimeout(1200);

    const lubotMessageNode = page
        .locator("h6", { hasText: "Lubot AI" })
        .locator("xpath=ancestor::div[contains(@class,'col-12') or contains(@class,'col-lg-7')][1]")
        .locator("p.text-secondary.small")
        .first();

    result.lubotMessage = String((await lubotMessageNode.textContent().catch(() => "")) || "").trim();
    result.checks.lubotMessageHasNo404Warning = !result.lubotMessage.includes("endpoint de insights respondió 404");

    if (!result.checks.insightsStatusIsNot404) {
        throw new Error(`insights endpoint returned 404 at ${result.insightsRequestUrl}`);
    }

    if (!result.checks.lubotMessageHasNo404Warning) {
        throw new Error("lubot panel still shows 404 warning message");
    }

    const screenshotPath = path.resolve(artifactsDir, `work-equipment-lubot-ai-ok-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    console.log("PLAYWRIGHT_WORK_EQUIPMENT_LUBOT_AI_OK");
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    result.error = String(error?.stack || error);

    try {
        if (browser?.contexts()?.[0]?.pages()?.[0]) {
            const screenshotPath = path.resolve(artifactsDir, `work-equipment-lubot-ai-fail-${Date.now()}.png`);
            await browser.contexts()[0].pages()[0].screenshot({ path: screenshotPath, fullPage: true });
            result.screenshotPath = screenshotPath;
        }
    } catch {
        // Ignore screenshot failures.
    }

    console.error("PLAYWRIGHT_WORK_EQUIPMENT_LUBOT_AI_ERROR");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
