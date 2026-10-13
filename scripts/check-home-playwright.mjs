import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/dashboard";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "45000");
const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    finalUrl: "",
    status: null,
    hasMainContent: false,
    hasWelcomeText: false,
    visibleTextLength: 0,
    bodyChildren: 0,
    consoleErrors,
    pageErrors,
    screenshotPath: "",
};

let browser;

try {
    browser = await chromium.launch({
        headless: true,
    });

    const page = await browser.newPage({
        viewport: { width: 1366, height: 768 },
    });

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            consoleErrors.push(msg.text());
        }
    });

    page.on("pageerror", (error) => {
        pageErrors.push(error.stack || error.message || String(error));
    });

    const response = await page.goto(fullUrl, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });

    await page.waitForTimeout(1200);

    result.status = response ? response.status() : null;
    result.finalUrl = page.url();
    result.hasMainContent = (await page.locator("#main-content").count()) > 0;
    result.hasWelcomeText = (await page.getByText("Bienvenido/a,").count()) > 0;

    const pageMetrics = await page.evaluate(() => ({
        visibleTextLength: (document.body?.innerText || "").trim().length,
        bodyChildren: document.body?.children?.length || 0,
    }));

    result.visibleTextLength = pageMetrics.visibleTextLength;
    result.bodyChildren = pageMetrics.bodyChildren;

    const screenshotPath = path.join(process.cwd(), "playwright-home-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const isBroken = pageErrors.length > 0 || !result.hasMainContent || result.visibleTextLength < 120;

    if (isBroken) {
        console.error("PLAYWRIGHT_HOME_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_HOME_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_HOME_CHECK_ERROR");
    console.error(String(error?.stack || error));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
