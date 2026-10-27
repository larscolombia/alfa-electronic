import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA Conversión ${id}`;
const wait = page => page.waitForTimeout(500);
const result = { case: "COM-05", frontendOnly: true, login: false, created: false, converted: false, idempotent: false, error: "" };
let browser;

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com");
  await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234");
  await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app"));
  result.login = true;
  await wait(page);

  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
  await wait(page);
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `conversion-${id}@alfa.local`]]) {
    await page.locator(`input[name='${field}']`).fill(value);
    await wait(page);
  }
  await page.getByTestId("prospect-save-btn").click();
  await wait(page);
  const row = page.locator("tbody tr", { hasText: name });
  await row.waitFor({ state: "visible" });
  result.created = true;

  const menu = row.getByRole("button").first();
  await menu.click();
  await wait(page);
  await row.getByRole("button", { name: /Convertir a cliente/i }).click();
  await wait(page);
  await row.getByTestId("prospect-converted-badge").waitFor({ state: "visible" });
  result.converted = true;

  await row.getByRole("button").first().click();
  await wait(page);
  const convertedAction = row.getByRole("button", { name: /Convertido/i });
  await convertedAction.waitFor({ state: "visible" });
  result.idempotent = await convertedAction.isDisabled();
  if (!result.idempotent) throw new Error("La acción de conversión sigue habilitada después de convertir");
} catch (error) {
  result.error = String(error?.stack || error);
} finally {
  if (browser) await browser.close();
}

console.log(JSON.stringify(result));
process.exit(result.error ? 1 : 0);
