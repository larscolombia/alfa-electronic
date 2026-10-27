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
    await page.goto(`${baseUrl}/app/crm-clientes`, { waitUntil: "networkidle" });

    const firstClient = page.getByTestId("clients-list-card").locator('tbody a[href*="/app/crm-clientes/"]').first();
    assert.ok(await firstClient.count(), "No hay un cliente real con el cual validar la ficha");
    await firstClient.click();
    const tablist = page.getByRole("tablist", { name: "Secciones de la ficha del cliente" });
    await tablist.waitFor();

    const tabs = ["Perfil", "Contactos", "Crédito", "Historial comercial"];
    for (const name of tabs) {
        const tab = tablist.getByRole("tab", { name, exact: true });
        await tab.click();
        await page.waitForFunction((label) => {
            const tabs = [...document.querySelectorAll('[role="tab"]')];
            return tabs.some((item) => item.textContent?.trim() === label && item.getAttribute("aria-selected") === "true");
        }, name);
        assert.equal(await tab.getAttribute("aria-selected"), "true", `${name} no quedó seleccionada`);
        await page.getByRole("tabpanel").waitFor();
    }

    const profileTab = tablist.getByRole("tab", { name: "Perfil", exact: true });
    await profileTab.click();
    await page.getByRole("button", { name: /Editar Nombre del cliente/i }).waitFor();
    const overflowX = await tablist.evaluate((element) => getComputedStyle(element).overflowX);
    assert.match(overflowX, /auto|scroll/);
    assert.equal(errors.length, 0, errors.join("; "));
    console.log(JSON.stringify({ tabs: tabs.length, overflowX, errors }, null, 2));
    console.log("OK: ficha de cliente verificada en móvil con datos reales.");
} finally {
    await browser.close();
}
