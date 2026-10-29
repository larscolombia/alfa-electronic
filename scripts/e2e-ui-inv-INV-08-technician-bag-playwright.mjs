import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const ref = `qa-inv-08-${id}`;
const bagCode = `BAG-${id}`;
const techName = "Danny Ramirez";
const designation = `Bolsa tecnico QA ${id}`;
const wait = page => page.waitForTimeout(500);
const result = {
  case: "INV-08",
  reference: ref,
  bagCode,
  login: false,
  cardCreated: false,
  initialStockZero: false,
  bagReceived: false,
  custodyBadge: false,
  stockUnchangedAfterReceive: false,
  bagReleased: false,
  leftoverBackToStock: false,
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

  // 2. Alta de ficha nueva (stock minimo 0 -> nace con stock 0)
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(designation); await wait(page);
  await page.locator("input[placeholder='Ej: Circuito integrado']").fill("QA Bolsas"); await wait(page);
  await page.locator("input[placeholder='Ej: Texas Instruments']").fill("Marca QA"); await wait(page);
  await page.locator("input[type='number']").first().fill("0"); await wait(page);
  await page.getByRole("button", { name: /^Crear ficha$/i }).click();
  const createFeedback = page.locator("[data-testid='inv-feedback-alert']");
  await createFeedback.waitFor({ state: "visible", timeout: 10000 });
  const createText = await createFeedback.innerText();
  if (!/creada correctamente/i.test(createText)) throw new Error(`La ficha no se creo: ${createText}`);
  result.cardCreated = true;

  await page.reload({ waitUntil: "networkidle" });
  const initialAvailable = (await page.getByTestId(`inv-available-${ref}`).innerText()).trim();
  if (initialAvailable !== "0") throw new Error(`Stock inicial esperado 0, obtengo ${initialAvailable}`);
  result.initialStockZero = true;

  // 3. Panel de bolsas (en /app/inventory-movements): recepcion en custodia
  await page.goto(`${base}/app/inventory-movements`, { waitUntil: "networkidle" });
  await page.getByTestId("inv-tab-bags").click();
  await page.locator("[data-testid='bag-code-input']").fill(bagCode); await wait(page);
  await page.locator("[data-testid='bag-tech-input']").fill(techName); await wait(page);
  await page.locator("[data-testid='bag-item-input']").fill(ref); await wait(page);
  await page.locator("[data-testid='bag-qty-input']").fill("5"); await wait(page);
  await page.locator("[data-testid='bag-receive-btn']").click();
  const receiveFeedback = page.locator("[data-testid='bag-feedback']");
  await receiveFeedback.waitFor({ state: "visible", timeout: 10000 });
  if (!/custodia/i.test(await receiveFeedback.innerText())) {
    throw new Error(`Recepcion de bolsa fallo: ${await receiveFeedback.innerText()}`);
  }
  result.bagReceived = true;

  // 4. Badge "En custodia de tecnico" en la fila de la bolsa
  const bagRow = page.locator("tr", { hasText: bagCode }).first();
  await bagRow.waitFor({ state: "visible", timeout: 10000 });
  const custodyBadge = bagRow.locator("[data-testid^='bag-custody-']");
  await custodyBadge.waitFor({ state: "visible", timeout: 10000 });
  if (!/En custodia de tecnico/i.test(await custodyBadge.innerText())) {
    throw new Error(`Badge de custodia inesperado: ${await custodyBadge.innerText()}`);
  }
  const bagId = (await custodyBadge.getAttribute("data-testid")).replace("bag-custody-", "");
  result.custodyBadge = true;

  // 5. Recibir NO suma al stock: la referencia sigue en 0
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const stockAfterReceive = (await page.getByTestId(`inv-available-${ref}`).innerText()).trim();
  if (stockAfterReceive !== "0") {
    throw new Error(`El stock cambio al recibir la bolsa (esperado 0, obtengo ${stockAfterReceive})`);
  }
  result.stockUnchangedAfterReceive = true;

  // 6. Liberar la bolsa declarando sobrante de 2 unidades
  await page.goto(`${base}/app/inventory-movements`, { waitUntil: "networkidle" });
  await page.getByTestId("inv-tab-bags").click();
  await page.locator(`[data-testid='bag-release-open-${bagId}']`).click(); await wait(page);
  await page.locator("[data-testid='bag-leftover-input']").fill("2"); await wait(page);
  await page.locator("[data-testid='bag-release-btn']").click();
  const releaseFeedback = page.locator("[data-testid='bag-feedback']");
  await releaseFeedback.waitFor({ state: "visible", timeout: 10000 });
  if (!/liberada/i.test(await releaseFeedback.innerText())) {
    throw new Error(`Liberacion de bolsa fallo: ${await releaseFeedback.innerText()}`);
  }
  result.bagReleased = true;

  // 7. Solo el sobrante vuelve a stock: la referencia pasa de 0 a 2
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const stockAfterRelease = (await page.getByTestId(`inv-available-${ref}`).innerText()).trim();
  if (stockAfterRelease !== "2") {
    throw new Error(`Sobrante esperado 2 en stock, obtengo ${stockAfterRelease}`);
  }
  result.leftoverBackToStock = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
