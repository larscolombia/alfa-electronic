import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://pika.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "60000");
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const queryText = process.env.PW_QUERY || "maribel";
const resolvedApiBaseUrl = process.env.PW_API_BASE_URL || new URL(baseUrl).origin;

const consoleErrors = [];
const pageErrors = [];
const searchResponses = [];
const failedRequests = [];

async function loginAndBuildSession(email, password) {
    const response = await fetch(`${resolvedApiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        throw new Error(`Login failed (${response.status})`);
    }
    const payload = await response.json();
    return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

let browser;
const result = { loaderVisible: null, resultCards: null, noResults: null, searchResponses, failedRequests, consoleErrors, pageErrors };

try {
    const session = await loginAndBuildSession(userEmail, userPassword);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    await context.addInitScript(
        ({ storedSession, apiBaseUrl }) => {
            window.localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
            window.localStorage.setItem("pika.apiBaseUrl", apiBaseUrl);
        },
        { storedSession: session, apiBaseUrl: resolvedApiBaseUrl },
    );

    const page = await context.newPage();
    page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.stack || error.message || String(error)));
    page.on("requestfailed", (req) => {
        if (req.url().includes("/api/v1/search")) {
            failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
        }
    });
    page.on("response", async (res) => {
        if (res.url().includes("/api/v1/search")) {
            let body = "";
            try { body = (await res.text()).slice(0, 300); } catch { body = "<no body>"; }
            searchResponses.push({ url: res.url(), status: res.status(), body });
        }
    });

    await page.goto(`${baseUrl.replace(/\/$/, "")}/app/main-menu`, { waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(1000);

    const input = page.locator(".mm-search-input");
    await input.waitFor({ state: "visible", timeout: timeoutMs });
    await input.fill(queryText);

    // wait for debounce + request to resolve
    await page.waitForTimeout(2500);

    result.loaderVisible = await page.locator(".mm-loader").isVisible().catch(() => null);
    result.resultCards = await page.locator(".mm-result-card").count().catch(() => null);
    result.noResults = await page.locator(".mm-no-results").isVisible().catch(() => null);

    await page.screenshot({ path: "playwright-menu-search.png", fullPage: true });
} catch (error) {
    result.fatalError = error.stack || error.message || String(error);
} finally {
    if (browser) await browser.close();
}

console.log(JSON.stringify(result, null, 2));
