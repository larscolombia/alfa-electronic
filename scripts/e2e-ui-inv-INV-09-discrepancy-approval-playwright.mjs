import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const ref = `qa-inv-09-${id}`;
const designation = `Repuesto conteo fisico ${id}`;
const reason = `Conteo anual ${id}`;
const wait = page => page.waitForTimeout(500);
const result = {
  case: "INV-09",
  reference: ref,
  login: false,
  cardCreated: false,
  entryRegistered: false,
  availableIs10: false,
  sessionOpened: false,
  discrepancyCreated: false,
  discrepancyRowShows10vs7: false,
  approveAdjusted: false,
  stockAdjustedTo7: false,
  reapproveConflict409: false,
  error: "",
};
let browser;

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. Login admin por UI
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;

  // 2. Alta de ficha nueva (stock minimo 0; la ficha nace con stock 0)
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(designation); await wait(page);
  await page.locator("input[placeholder='Ej: Circuito integrado']").fill("QA Conteo"); await wait(page);
  await page.locator("input[placeholder='Ej: Texas Instruments']").fill("Marca QA"); await wait(page);
  await page.locator("input[type='number']").first().fill("0"); await wait(page);
  await page.getByRole("button", { name: /^Crear ficha$/i }).click();
  const createFeedback = page.locator("[data-testid='inv-feedback-alert']");
  await createFeedback.waitFor({ state: "visible", timeout: 10000 });
  if (!/creada correctamente/i.test(await createFeedback.innerText())) {
    throw new Error(`La ficha no se creo: ${await createFeedback.innerText()}`);
  }
  result.cardCreated = true;

  // 3. Entrada a stock existente: 10 unidades
  await page.getByRole("button", { name: /Entrada a stock existente/i }).click(); await wait(page);
  await page.locator("select").filter({ has: page.locator(`option[value='${ref}']`) }).selectOption({ value: ref }); await wait(page);
  await page.locator("input[type='number']").first().fill("10"); await wait(page);
  await page.getByRole("button", { name: /^Registrar entrada$/i }).click();
  await page.locator("[data-testid='inv-feedback-alert']").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(1500);
  result.entryRegistered = true;

  await page.reload({ waitUntil: "networkidle" });
  const available10 = (await page.getByTestId(`inv-available-${ref}`).innerText()).trim();
  if (available10 !== "10") throw new Error(`Disponible esperado 10, obtengo ${available10}`);
  result.availableIs10 = true;

  // 4. Conciliacion: abrir sesion de conteo rapida
  await page.goto(`${base}/app/inventory-order-details`, { waitUntil: "networkidle" });
  await page.getByTestId("session-open-btn").click();
  const sessionFeedback = page.getByTestId("discrepancy-feedback");
  await sessionFeedback.waitFor({ state: "visible", timeout: 10000 });
  if (!/abierta/i.test(await sessionFeedback.innerText())) {
    throw new Error(`La sesion no se abrio: ${await sessionFeedback.innerText()}`);
  }
  result.sessionOpened = true;

  // 5. Registrar diferencia: contado 7 vs esperado 10
  const form = page.getByTestId("discrepancy-form");
  await form.locator("select").filter({ has: page.locator(`option[value='${ref}']`) }).selectOption({ value: ref }); await wait(page);
  await page.getByTestId("discrepancy-counted-input").fill("7"); await wait(page);
  await page.getByTestId("discrepancy-reason-input").fill(reason); await wait(page);
  await page.getByTestId("discrepancy-create-btn").click();
  await sessionFeedback.waitFor({ state: "visible", timeout: 10000 });
  if (!/Diferencia registrada/i.test(await sessionFeedback.innerText())) {
    throw new Error(`La diferencia no se registro: ${await sessionFeedback.innerText()}`);
  }
  result.discrepancyCreated = true;

  // 6. La discrepancia aparece en la tabla con esperado 10 / contado 7
  await page.getByTestId("discrepancies-table").waitFor({ state: "visible", timeout: 10000 });
  const row = page.locator("[data-testid^='discrepancy-row-']").filter({ hasText: ref });
  await row.waitFor({ state: "visible", timeout: 10000 });
  const rowText = await row.innerText();
  if (!/\b10\b/.test(rowText) || !/\b7\b/.test(rowText) || !/Pendiente/i.test(rowText)) {
    throw new Error(`Fila de discrepancia inesperada: ${rowText}`);
  }
  const discrepancyId = (await row.getAttribute("data-testid")).replace("discrepancy-row-", "");
  result.discrepancyRowShows10vs7 = true;

  // 7. Segunda pestaña del mismo contexto: carga el estado ANTES de aprobar,
  //    asi su boton "Aprobar ajuste" sigue activo cuando la primera ya aprobo.
  const stalePage = await context.newPage();
  await stalePage.goto(`${base}/app/inventory-order-details`, { waitUntil: "networkidle" });
  const staleApprove = stalePage.getByTestId(`discrepancy-approve-${discrepancyId}`);
  await staleApprove.waitFor({ state: "visible", timeout: 10000 });

  // 8. Pestaña principal: aprobar la diferencia -> ajuste aplicado una sola vez
  await page.getByTestId(`discrepancy-approve-${discrepancyId}`).click();
  await page.getByTestId(`discrepancy-adjusted-${discrepancyId}`).waitFor({ state: "visible", timeout: 10000 });
  result.approveAdjusted = true;

  // 9. El stock queda en 7 (solo el ajuste del conteo)
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const available7 = (await page.getByTestId(`inv-available-${ref}`).innerText()).trim();
  if (available7 !== "7") throw new Error(`Disponible esperado 7 tras el ajuste, obtengo ${available7}`);
  result.stockAdjustedTo7 = true;

  // 10. Re-aprobar desde la pestaña con estado viejo -> 409 del backend
  await staleApprove.click();
  const staleFeedback = stalePage.getByTestId("discrepancy-feedback");
  await staleFeedback.waitFor({ state: "visible", timeout: 10000 });
  const conflictText = await staleFeedback.innerText();
  if (!/ya fue aprobada; el ajuste ya se aplico/i.test(conflictText)) {
    throw new Error(`Mensaje de conflicto 409 inesperado: ${conflictText}`);
  }
  result.reapproveConflict409 = true;
  await stalePage.close();
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
