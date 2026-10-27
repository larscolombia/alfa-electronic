import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const ref = `qa-inv-05-${id}`;
const designation = `Repuesto reposicion auto ${id}`;
const wait = page => page.waitForTimeout(500);
const result = {
  case: "INV-05",
  reference: ref,
  login: false,
  cardCreated: false,
  entryRegistered: false,
  lowStockBadge: false,
  alertsSection: false,
  alertItem: false,
  alertAutoBadge: false,
  autoResolveEntry: false,
  autoResolveBadgeOk: false,
  autoResolveItemGone: false,
  error: "",
};
let browser;

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();

  // 1. Login admin por UI
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;

  // 2. Alta de ficha nueva: referencia con stock minimo 5
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(designation); await wait(page);
  await page.locator("input[placeholder='Ej: Circuito integrado']").fill("QA Reposicion"); await wait(page);
  await page.locator("input[placeholder='Ej: Texas Instruments']").fill("Marca QA"); await wait(page);
  await page.locator("input[type='number']").first().fill("5"); await wait(page);
  await page.getByRole("button", { name: /^Crear ficha$/i }).click();
  const createFeedback = page.locator("[data-testid='inv-feedback-alert']");
  await createFeedback.waitFor({ state: "visible", timeout: 10000 });
  const createText = await createFeedback.innerText();
  if (!/creada correctamente/i.test(createText)) throw new Error(`La ficha no se creo: ${createText}`);
  result.cardCreated = true;

  // 3. Entrada de stock de 2 unidades (stock 0 -> 2, sigue bajo el minimo 5)
  await page.getByRole("button", { name: /Entrada a stock existente/i }).click(); await wait(page);
  const entryRefSelect = page.locator("select").filter({ has: page.locator(`option[value='${ref}']`) });
  await entryRefSelect.selectOption({ value: ref }); await wait(page);
  await page.locator("input[type='number']").first().fill("2"); await wait(page);
  await page.getByRole("button", { name: /^Registrar entrada$/i }).click();
  const entryFeedback = page.locator("[data-testid='inv-feedback-alert']");
  await entryFeedback.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(1500);
  result.entryRegistered = true;

  // 4. Badge "Bajo minimo" y disponible = 2
  await page.reload({ waitUntil: "networkidle" });
  const badge = page.getByTestId(`inv-low-stock-${ref}`);
  await badge.waitFor({ state: "visible", timeout: 10000 });
  if ((await badge.innerText()).trim() !== "Bajo minimo") {
    throw new Error(`Badge inesperado: ${await badge.innerText()}`);
  }
  result.lowStockBadge = true;
  const available = (await page.getByTestId(`inv-available-${ref}`).innerText()).trim();
  if (available !== "2") throw new Error(`Disponible esperado 2, obtengo ${available}`);

  // 5. Alertas de reposicion: seccion + fila con badge "automatico"
  await page.goto(`${base}/app/inventory-orders`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const section = page.getByTestId("replenishment-alerts-section");
  await section.waitFor({ state: "visible", timeout: 10000 });
  result.alertsSection = true;
  const itemRow = page.getByTestId(`replenishment-auto-item-${ref}`);
  await itemRow.waitFor({ state: "visible", timeout: 10000 });
  const rowText = await itemRow.innerText();
  if (!/automatico/i.test(rowText)) throw new Error(`La fila no lleva badge de origen automatico: ${rowText}`);
  result.alertItem = true; result.alertAutoBadge = true;

  // 6. Entrada de 5 unidades (2 -> 7): el backend auto-resuelve la alerta
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Entrada a stock existente/i }).click(); await wait(page);
  await page.locator("select").filter({ has: page.locator(`option[value='${ref}']`) }).selectOption({ value: ref }); await wait(page);
  await page.locator("input[type='number']").first().fill("5"); await wait(page);
  await page.getByRole("button", { name: /^Registrar entrada$/i }).click();
  await page.locator("[data-testid='inv-feedback-alert']").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(1500);
  result.autoResolveEntry = true;

  await page.reload({ waitUntil: "networkidle" });
  const finalBadge = page.getByTestId(`inv-low-stock-${ref}`);
  await finalBadge.waitFor({ state: "visible", timeout: 10000 });
  if ((await finalBadge.innerText()).trim() !== "OK") {
    throw new Error(`Badge final inesperado: ${await finalBadge.innerText()}`);
  }
  const finalAvailable = (await page.getByTestId(`inv-available-${ref}`).innerText()).trim();
  if (finalAvailable !== "7") throw new Error(`Disponible final esperado 7, obtengo ${finalAvailable}`);
  result.autoResolveBadgeOk = true;

  await page.goto(`${base}/app/inventory-orders`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("replenishment-alerts-section").waitFor({ state: "visible", timeout: 10000 });
  if (await page.getByTestId(`replenishment-auto-item-${ref}`).count() > 0) {
    throw new Error("La alerta auto no desaparecio tras volver sobre el minimo");
  }
  result.autoResolveItemGone = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
