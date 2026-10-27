import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const browser = await chromium.launch({ headless: true });

try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(process.env["PW_ADMIN_EMAIL"] || "admin@alfa.com");
    await page.locator('input[type="password"]').fill(process.env["PW_ADMIN_PASSWORD"] || "1234");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/app\//);
    await page.goto(`${baseUrl}/app/crm-cotizaciones`, { waitUntil: "networkidle" });

    const list = page.getByTestId("quotes-list-card");
    const initialRows = await list.locator("tbody tr").count();
    assert.ok(initialRows <= 10, `Se mostraron ${initialRows} filas; máximo esperado: 10`);
    assert.match(await page.getByTestId("quotes-pagination").innerText(), /Mostrando 1–\d+ de \d+/);

    await list.locator("button", { hasText: "Exportar" }).click();
    const exportLink = page.locator('a[download^="cotizaciones-"]');
    await exportLink.waitFor({ state: "attached" });
    assert.match(await exportLink.getAttribute("download"), /^cotizaciones-\d{4}-\d{2}-\d{2}\.csv$/);
    assert.match(await exportLink.getAttribute("href"), /^data:text\/csv;charset=utf-8,/);

    await page.getByTestId("quotes-search").fill("cotizacion-inexistente-ux");
    await page.getByText("No encontramos cotizaciones. Cambia los filtros o crea la primera.").waitFor();
    await page.getByTestId("quotes-search").fill("");
    await page.getByRole("button", { name: /Crear cotización/i }).click();
    const heading = page.getByRole("heading", { name: "Nueva cotización" });
    await heading.waitFor();
    assert.equal(await list.count(), 0, "El listado debe ocultarse durante el alta");
    const formTop = await heading.evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(formTop < 400, `El formulario apareció demasiado abajo: ${formTop}px`);
    assert.equal(errors.length, 0, errors.join("; "));
    console.log(JSON.stringify({ initialRows, formTop, errors }, null, 2));
    console.log("OK: listado, exportación y alta de Cotizaciones verificados con datos reales.");
} finally {
    await browser.close();
}
