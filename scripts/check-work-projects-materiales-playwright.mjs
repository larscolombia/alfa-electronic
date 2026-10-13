import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const targetPath = process.env.PW_TARGET_PATH || "/app/work-projects";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "60000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const slowMoMs = Number(process.env.PW_SLOW_MO_MS || "0");
const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    finalUrl: "",
    status: null,
    cardCount: 0,
    firstProjectTitle: "",
    detailOpened: false,
    detailTitle: "",
    tabNavFound: false,
    tabNavItems: [],
    materialesTabFound: false,
    materialesTabClicked: false,
    materialesContentVisible: false,
    materialesH4Text: "",
    materialesEstimateFieldVisible: false,
    materialesReferenceSelectVisible: false,
    materialesTableVisible: false,
    bodyScrolledToTop: false,
    consoleErrors,
    pageErrors,
    screenshotBeforeTab: "",
    screenshotAfterTab: "",
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

    // 1. Navigate to kanban board
    const response = await page.goto(fullUrl, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
    });

    // Wait for Angular to bootstrap (look for any root element)
    await page.waitForTimeout(3000);

    result.status = response ? response.status() : null;
    result.finalUrl = page.url();

    await page.waitForSelector(".kanban-board", { timeout: timeoutMs });

    // 2. Find project cards
    const cards = page.locator(".project-card");
    result.cardCount = await cards.count();

    if (!result.cardCount) {
        throw new Error("No hay fichas de proyecto en el tablero. Crea al menos un proyecto primero.");
    }

    const firstCard = cards.first();
    result.firstProjectTitle = ((await firstCard.locator(".card-title").first().innerText().catch(() => "")) || "").trim();

    // 3. Open project detail
    await firstCard.click();
    result.detailOpened = false;

    try {
        await page.waitForSelector(".project-detail-dialog", { state: "visible", timeout: 15000 });
        await page.waitForFunction(
            () => (document.querySelector(".project-detail-dialog__title")?.textContent?.trim() || "").length > 0,
            { timeout: 15000 }
        );
        result.detailTitle = ((await page.locator(".project-detail-dialog__title").first().innerText()) || "").trim();
        result.detailOpened = result.detailTitle.length > 0;
    } catch {
        result.detailOpened = false;
    }

    if (!result.detailOpened) {
        throw new Error("El detalle del proyecto no se abrio correctamente.");
    }

    // 4. Check tab nav
    const navLinks = page.locator(".project-detail-dialog .nav-link");
    const navCount = await navLinks.count();
    result.tabNavFound = navCount > 0;

    for (let i = 0; i < navCount; i++) {
        const text = ((await navLinks.nth(i).innerText()) || "").trim();
        result.tabNavItems.push(text);
    }

    // 5. Find and verify Materiales tab exists in nav
    const materialesTab = page.locator(".project-detail-dialog .nav-link", { hasText: "Materiales" });
    const materialesTabCount = await materialesTab.count();
    result.materialesTabFound = materialesTabCount > 0;

    if (!result.materialesTabFound) {
        // screenshot before failing
        const screenshotBefore = path.join(process.cwd(), "playwright-materiales-before-click.png");
        await page.screenshot({ path: screenshotBefore, fullPage: false });
        result.screenshotBeforeTab = screenshotBefore;
        throw new Error("La pestana 'Materiales' no se encontro en el nav del modal. Tabs encontrados: " + result.tabNavItems.join(" | "));
    }

    // 6. Screenshot before clicking
    const screenshotBefore = path.join(process.cwd(), "playwright-materiales-before-click.png");
    await page.screenshot({ path: screenshotBefore, fullPage: false });
    result.screenshotBeforeTab = screenshotBefore;

    // 7. Click Materiales tab
    await materialesTab.first().click();
    result.materialesTabClicked = true;

    // Wait for Angular to process the click and re-render
    await page.waitForTimeout(800);

    // 8. Check that Materiales content rendered (look for h4 with the section title)
    const materialesH4 = page.locator(".project-detail-dialog h4", { hasText: "Materiales y repuestos" });
    const materialesH4Count = await materialesH4.count();
    result.materialesContentVisible = materialesH4Count > 0;

    if (result.materialesContentVisible) {
        result.materialesH4Text = ((await materialesH4.first().innerText()) || "").trim();
    }

    // 9. Check individual elements inside the Materiales tab
    const estimateInput = page.locator(".material-estimate-input");
    result.materialesEstimateFieldVisible = (await estimateInput.count()) > 0 && await estimateInput.first().isVisible().catch(() => false);

    const referenceSelect = page.locator(".project-detail-dialog select").filter({ hasText: "Selecciona una referencia" });
    result.materialesReferenceSelectVisible = (await referenceSelect.count()) > 0;

    const materialesTable = page.locator(".project-materials-table");
    result.materialesTableVisible = (await materialesTable.count()) > 0 && await materialesTable.first().isVisible().catch(() => false);

    // 10. Verify scroll position reset (body should be at top after tab change)
    const scrollTop = await page.evaluate(() => {
        const body = document.querySelector(".project-detail-dialog__body");
        return body ? body.scrollTop : -1;
    });
    result.bodyScrolledToTop = scrollTop === 0;

    // 11. Screenshot after clicking
    const screenshotAfter = path.join(process.cwd(), "playwright-materiales-after-click.png");
    await page.screenshot({ path: screenshotAfter, fullPage: false });
    result.screenshotAfterTab = screenshotAfter;

    // Final verdict
    const isBroken =
        pageErrors.length > 0 ||
        !result.detailOpened ||
        !result.materialesTabFound ||
        !result.materialesContentVisible;

    if (isBroken) {
        console.error("PLAYWRIGHT_MATERIALES_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_MATERIALES_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_MATERIALES_CHECK_ERROR");
    console.error(String(error?.stack || error));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
