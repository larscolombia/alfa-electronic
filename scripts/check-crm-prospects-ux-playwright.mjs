import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const email = process.env["PW_ADMIN_EMAIL"] || "admin@alfa.com";
const password = process.env["PW_ADMIN_PASSWORD"] || "1234";
const browser = await chromium.launch({ headless: true });

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle" });

    const listCard = page.locator(".card", { hasText: "Cartera de prospectos" });
    const initialRows = await listCard.locator("tbody tr").count();
    assert.ok(initialRows <= 10, `La página inicial muestra ${initialRows} filas; máximo esperado: 10`);
    await page.getByTestId("prospects-pagination").waitFor();
    assert.match(await page.getByTestId("prospects-pagination").innerText(), /Mostrando 1–10 de \d+/);
    assert.equal(await page.locator('a[routerlink="/app/crm-carga-bases"]').count(), 1);

    await page.getByTestId("prospects-search").fill("texto-que-no-existe-ux");
    await page.getByText("No encontramos prospectos").waitFor();
    await page.getByTestId("prospects-search").fill("");

    await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
    await page.getByRole("heading", { name: "Nuevo prospecto" }).waitFor();
    assert.equal(await page.getByText("Cartera de prospectos").count(), 0, "La tabla debe ocultarse durante el alta");
    const formTop = await page.getByRole("heading", { name: "Nuevo prospecto" }).evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(formTop < 400, `El formulario apareció demasiado abajo: ${formTop}px`);
    assert.equal(await page.getByRole("button", { name: /Cerrar/i }).count(), 1);
    assert.equal(errors.length, 0, errors.join("; "));

    console.log(JSON.stringify({ initialRows, formTop, errors }, null, 2));
    console.log("OK: listado y alta de CRM Prospectos verificados con datos reales.");
} finally {
    await browser.close();
}
