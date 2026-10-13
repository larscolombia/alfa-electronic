import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/work-projects";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "60000");
const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const result = {
    fullUrl,
    status: null,
    openedWithPureClick: false,
    openedWithMicroMove: false,
    consoleErrors: [],
    pageErrors: [],
};

let browser;

try {
    browser = await chromium.launch({ headless: true });

    const runScenario = async (microMove) => {
        const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

        page.on("console", (msg) => {
            if (msg.type() === "error") {
                result.consoleErrors.push(msg.text());
            }
        });

        page.on("pageerror", (error) => {
            result.pageErrors.push(error.stack || error.message || String(error));
        });

        const response = await page.goto(fullUrl, {
            waitUntil: "networkidle",
            timeout: timeoutMs,
        });

        result.status = response ? response.status() : null;

        await page.waitForSelector(".kanban-board", { timeout: timeoutMs });

        const firstCard = page.locator(".project-card").first();
        const box = await firstCard.boundingBox();
        if (!box) {
            throw new Error("No fue posible calcular el cuadro de la primera ficha.");
        }

        const x = box.x + 60;
        const y = box.y + 70;

        await page.mouse.move(x, y);
        await page.mouse.down();

        if (microMove) {
            await page.mouse.move(x + 4, y + 4, { steps: 4 });
        }

        await page.mouse.up();

        let opened = false;
        try {
            await page.waitForSelector(".project-detail-dialog", {
                state: "visible",
                timeout: 3000,
            });
            opened = true;
        } catch {
            opened = false;
        }

        await page.close();
        return opened;
    };

    result.openedWithPureClick = await runScenario(false);
    result.openedWithMicroMove = await runScenario(true);

    if (result.pageErrors.length > 0) {
        console.error("PLAYWRIGHT_WORK_PROJECTS_BODY_CLICK_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_WORK_PROJECTS_BODY_CLICK_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_WORK_PROJECTS_BODY_CLICK_CHECK_ERROR");
    console.error(String(error?.stack || error));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}