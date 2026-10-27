import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const browser = await chromium.launch({ headless: true });

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(process.env["PW_ADMIN_EMAIL"] || "admin@alfa.com");
    await page.locator('input[type="password"]').fill(process.env["PW_ADMIN_PASSWORD"] || "1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/app/**");
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Agregar Prospecto/i }).click();

    const selected = page.locator('.choices[data-type*="select-one"] .choices__list--single .choices__item').first();
    await selected.waitFor();
    const style = await selected.evaluate((element) => {
        const computed = getComputedStyle(element);
        return { background: computed.backgroundColor, color: computed.color, padding: computed.padding };
    });
    assert.equal(style.background, "rgba(0, 0, 0, 0)");
    assert.notEqual(style.color, "rgb(0, 73, 232)");
    console.log(JSON.stringify(style));
    console.log("OK: selector simple verificado sin franja azul.");
} finally {
    await browser.close();
}
