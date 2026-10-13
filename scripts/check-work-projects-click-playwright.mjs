import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/work-projects";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "60000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const pauseAfterOpen = ["true", "1", "yes"].includes((process.env.PW_PAUSE_AFTER_OPEN || "false").toLowerCase());
const holdOpenMs = Number(process.env.PW_HOLD_OPEN_MS || "0");
const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    finalUrl: "",
    status: null,
    cardCount: 0,
    firstProjectTitle: "",
    clickTriggered: false,
    detailOpened: false,
    detailShellCount: 0,
    detailDialogCount: 0,
    detailTitle: "",
    bodyPreview: "",
    visibleTextLength: 0,
    consoleErrors,
    pageErrors,
    screenshotPath: "",
};

let browser;

try {
    browser = await chromium.launch({ headless, slowMo: slowMoMs });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

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

    result.status = response ? response.status() : null;
    result.finalUrl = page.url();

    await page.waitForSelector(".kanban-board", { timeout: timeoutMs });

    const cards = page.locator(".project-card");
    result.cardCount = await cards.count();

    if (!result.cardCount) {
        throw new Error("No se encontraron bloques de proyecto en el tablero.");
    }

    const firstCard = cards.first();
    result.firstProjectTitle = ((await firstCard.locator(".card-title").first().innerText()) || "").trim();

    const firstCardBox = await firstCard.boundingBox();
    if (!firstCardBox) {
        throw new Error("No fue posible calcular el cuadro de la primera ficha del proyecto.");
    }

    await firstCard.click({
        position: {
            x: firstCardBox.width / 2,
            y: firstCardBox.height / 2,
        },
    });
    result.clickTriggered = true;

    try {
        await page.waitForSelector(".project-detail-dialog", {
            state: "visible",
            timeout: 15000,
        });

        await page.waitForFunction(() => {
            const title = document.querySelector(".project-detail-dialog__title")?.textContent?.trim() || "";
            return title.length > 0;
        }, { timeout: 15000 });

        result.detailTitle = ((await page.locator(".project-detail-dialog__title").first().innerText()) || "").trim();
        result.detailOpened = result.detailTitle.length > 0;
    } catch {
        result.detailOpened = false;
    }

    result.detailShellCount = await page.locator(".project-detail-shell").count();
    result.detailDialogCount = await page.locator(".project-detail-dialog").count();

    const metrics = await page.evaluate(() => ({
        visibleTextLength: (document.body?.innerText || "").trim().length,
        bodyPreview: (document.body?.innerText || "").trim().slice(0, 360),
    }));

    result.visibleTextLength = metrics.visibleTextLength;
    result.bodyPreview = metrics.bodyPreview;

    const screenshotPath = path.join(process.cwd(), "playwright-work-projects-click-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    if (pauseAfterOpen && result.detailOpened) {
        await page.pause();
    }

    if (holdOpenMs > 0 && result.detailOpened) {
        await page.waitForTimeout(holdOpenMs);
    }

    const isBroken = pageErrors.length > 0 || !result.detailOpened;

    if (isBroken) {
        console.error("PLAYWRIGHT_WORK_PROJECTS_CLICK_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_WORK_PROJECTS_CLICK_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_WORK_PROJECTS_CLICK_CHECK_ERROR");
    console.error(String(error?.stack || error));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}