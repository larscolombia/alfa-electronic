import { writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/company-acl-hr-playground";
const apiBaseUrlOverride = process.env.PW_API_BASE_URL || "";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const targetUrl = new URL(targetPath, `${baseUrl.replace(/\/$/, "")}/`);
if (apiBaseUrlOverride) {
    targetUrl.searchParams.set("apiBaseUrl", apiBaseUrlOverride);
}
const fullUrl = targetUrl.toString();

const expectedChecks = ["acl-modules", "acl-roles", "acl-create-role", "hr-employees", "hr-catalogs", "hr-sync"];
const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    finalUrl: "",
    httpStatus: null,
    expectedChecks,
    checks: [],
    passCount: 0,
    failCount: 0,
    summary: "",
    consoleErrors,
    pageErrors,
    screenshotPath: "",
    reportPath: "",
};

let browser;

try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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

    result.httpStatus = response ? response.status() : null;
    result.finalUrl = page.url();

    await page.waitForSelector("[data-testid='run-playground-tests']", { timeout: timeoutMs });
    await page.locator("[data-testid='run-playground-tests']").click();

    await page.waitForFunction(
        (keys) => {
            return keys.every((key) => {
                const row = document.querySelector(`[data-testid=\"play-test-${key}\"]`);
                const status = row?.getAttribute("data-status");
                return status === "pass" || status === "fail";
            });
        },
        expectedChecks,
        { timeout: timeoutMs }
    );

    const checks = await page.evaluate((keys) => {
        return keys.map((key) => {
            const row = document.querySelector(`[data-testid=\"play-test-${key}\"]`);
            const statusBadge = document.querySelector(`[data-testid=\"status-${key}\"]`);
            const detailsCell = document.querySelector(`[data-testid=\"details-${key}\"]`);

            return {
                key,
                status: row?.getAttribute("data-status") || "missing",
                badgeLabel: (statusBadge?.textContent || "").trim(),
                details: (detailsCell?.textContent || "").trim(),
            };
        });
    }, expectedChecks);

    const summaryText = (await page.locator("[data-testid='playground-summary']").textContent())?.trim() || "";
    const passCount = Number((await page.locator("[data-testid='playground-pass-count']").textContent())?.trim() || "0");
    const failCount = Number((await page.locator("[data-testid='playground-fail-count']").textContent())?.trim() || "0");

    result.checks = checks;
    result.summary = summaryText;
    result.passCount = passCount;
    result.failCount = failCount;

    const screenshotPath = path.join(process.cwd(), "playground-acl-hr-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const reportPath = path.join(process.cwd(), "playground-acl-hr-check.json");
    await writeFile(reportPath, JSON.stringify(result, null, 2), "utf-8");
    result.reportPath = reportPath;

    const failedChecks = checks.filter((check) => check.status !== "pass");
    const hasRuntimeErrors = pageErrors.length > 0;

    if (failedChecks.length > 0 || hasRuntimeErrors) {
        console.error("PLAYGROUND_ACL_HR_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYGROUND_ACL_HR_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYGROUND_ACL_HR_CHECK_ERROR");
    console.error(String(error?.stack || error));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
