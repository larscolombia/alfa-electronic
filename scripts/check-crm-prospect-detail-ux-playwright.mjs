import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const browser = await chromium.launch({ headless: true });
try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(process.env["PW_ADMIN_EMAIL"] || "admin@alfa.com");
    await page.locator('input[type="password"]').fill(process.env["PW_ADMIN_PASSWORD"] || "1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle" });
    await page.locator("tbody a").first().click();
    await page.waitForLoadState("networkidle");
    const tabList = page.getByRole("tablist", { name: "Secciones de la ficha del prospecto" });
    await tabList.waitFor({ timeout: 20_000 });

    const tabs = tabList.getByRole("tab");
    assert.equal(await tabs.count(), 9);
    for (let index = 0; index < 9; index++) {
        const tab = tabs.nth(index);
        await tab.click();
        await page.waitForTimeout(50);
        assert.equal(await tab.getAttribute("aria-selected"), "true");
        assert.equal(await page.locator('[role="tabpanel"] .card').count() > 0, true);
    }
    assert.ok((await tabList.evaluate((element) => element.scrollWidth)) >= (await tabList.evaluate((element) => element.clientWidth)));
    assert.equal(errors.length, 0, errors.join("; "));
    console.log("OK: las 9 secciones de la ficha funcionan en viewport móvil.");
} finally {
    await browser.close();
}
