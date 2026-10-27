import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const browser = await chromium.launch({ headless: true });

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(process.env["PW_ADMIN_EMAIL"] || "admin@alfa.com");
    await page.locator('input[type="password"]').fill(process.env["PW_ADMIN_PASSWORD"] || "1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);
    await page.goto(`${baseUrl}/app/crm-clientes`, { waitUntil: "networkidle" });

    const list = page.getByTestId("clients-list-card");
    const initialRows = await list.locator("tbody tr").count();
    assert.ok(initialRows <= 10, `Se mostraron ${initialRows} filas; máximo esperado: 10`);
    assert.match(await page.getByTestId("clients-pagination").innerText(), /Mostrando 1–\d+ de \d+/);

    await page.getByLabel("Buscar clientes").fill("cliente-inexistente-para-ux");
    await page.getByText("No encontramos clientes. Cambia la búsqueda o agrega el primero.").waitFor();
    await page.getByLabel("Buscar clientes").fill("");

    await page.getByRole("button", { name: /Agregar Cliente/i }).click();
    const heading = page.getByRole("heading", { name: "Nuevo cliente" });
    await heading.waitFor();
    assert.equal(await list.count(), 0, "La tabla debe ocultarse durante el alta");
    const formTop = await heading.evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(formTop < 400, `El formulario apareció demasiado abajo: ${formTop}px`);
    assert.equal(await page.getByRole("button", { name: "Cerrar" }).count(), 1);
    assert.equal(errors.length, 0, errors.join("; "));

    console.log(JSON.stringify({ initialRows, formTop, errors }, null, 2));
    console.log("OK: listado y alta de CRM Clientes verificados con datos reales.");
} finally {
    await browser.close();
}
