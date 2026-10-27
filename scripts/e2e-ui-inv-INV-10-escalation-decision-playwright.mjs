import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const ref = `qa-inv-10-${id}`;
const designation = `Repuesto escalamiento QA ${id}`;
const newProvider = `Proveedor Alt ${id}`;
const wait = page => page.waitForTimeout(500);
const result = {
  case: "INV-10",
  reference: ref,
  login: false,
  cardCreated: false,
  lowStockBadge: false,
  alertItem: false,
  attemptsRegistered: false,
  escalated: false,
  escalatedHint: false,
  attemptBlockedWhileEscalated: false,
  decisionProviderRequired: false,
  decisionRegistered: false,
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

  // 2. Alta de ficha nueva con stock minimo 5 (la ficha nace con stock 0 -> bajo minimo)
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(designation); await wait(page);
  await page.locator("input[placeholder='Ej: Circuito integrado']").fill("QA Escalamiento"); await wait(page);
  await page.locator("input[placeholder='Ej: Texas Instruments']").fill("Marca QA"); await wait(page);
  await page.locator("input[type='number']").first().fill("5"); await wait(page);
  await page.getByRole("button", { name: /^Crear ficha$/i }).click();
  const createFeedback = page.locator("[data-testid='inv-feedback-alert']");
  await createFeedback.waitFor({ state: "visible", timeout: 10000 });
  if (!/creada correctamente/i.test(await createFeedback.innerText())) {
    throw new Error(`La ficha no se creo: ${await createFeedback.innerText()}`);
  }
  result.cardCreated = true;

  await page.reload({ waitUntil: "networkidle" });
  const badge = page.getByTestId(`inv-low-stock-${ref}`);
  await badge.waitFor({ state: "visible", timeout: 10000 });
  if ((await badge.innerText()).trim() !== "Bajo minimo") {
    throw new Error(`Badge inesperado: ${await badge.innerText()}`);
  }
  result.lowStockBadge = true;

  // 3. Tres intentos rapidos de compra: el tercero escala el item
  await page.goto(`${base}/app/inventory-orders`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const alertsSection = page.getByTestId("replenishment-alerts-section");
  await alertsSection.waitFor({ state: "visible", timeout: 10000 });
  await page.getByTestId(`replenishment-auto-item-${ref}`).waitFor({ state: "visible", timeout: 10000 });
  result.alertItem = true;

  // Fila del backlog de insuficiencia que corresponde a nuestra referencia
  const backlogRow = page.locator("tr", { hasText: ref }).filter({
    has: page.getByRole("button", { name: /^Intento rapido$/ }),
  });
  const quickAttempt = backlogRow.getByRole("button", { name: /^Intento rapido$/ });

  for (let attempt = 1; attempt <= 3; attempt++) {
    await quickAttempt.click();
    await page.waitForTimeout(1200); // el POST al backend y el refresh deben terminar antes del siguiente click
  }
  result.attemptsRegistered = true;

  // 4. Estado escalado: aparece "Resolver escalacion", el intento rapido queda deshabilitado
  const decisionOpen = page.getByTestId(`decision-open-${ref}`);
  await decisionOpen.waitFor({ state: "visible", timeout: 10000 });
  if (await quickAttempt.getAttribute("disabled") === null) {
    throw new Error("El boton 'Intento rapido' deberia estar deshabilitado en estado escalar");
  }
  result.escalated = true;

  // El hint de escalamiento solo se renderiza al abrir el formulario de decision
  await decisionOpen.click(); await wait(page);
  const hint = page.getByTestId(`replenishment-escalated-hint-${ref}`);
  await hint.waitFor({ state: "visible", timeout: 10000 });
  result.escalatedHint = true;

  // 5. Ruta bloqueada: el cuarto intento (formulario detallado) es rechazado 409 por el backend.
  //    El boton rapido esta deshabilitado, asi que el reintento real entra por "Registro detallado".
  await page.locator("select").filter({ has: page.locator(`option[value='${ref}']`) }).selectOption({ value: ref }); await wait(page);
  await page.getByRole("button", { name: /^Guardar intento detallado$/ }).click();
  const conflictAlert = page.getByTestId("inv-backend-error-alert").filter({ hasText: "registre una decision" });
  await conflictAlert.waitFor({ state: "visible", timeout: 10000 });
  const conflictText = await conflictAlert.innerText();
  if (!/item escalado: registre una decision \(cambiar proveedor o marcar obsoleto\)/.test(conflictText)) {
    throw new Error(`Mensaje 409 inesperado: ${conflictText}`);
  }
  result.attemptBlockedWhileEscalated = true;

  // 6. Ruta bloqueada: decision cambiar_proveedor sin proveedor nuevo
  const decisionForm = page.getByTestId(`replenishment-decision-form-${ref}`);
  await decisionForm.waitFor({ state: "visible", timeout: 10000 });
  await decisionForm.getByTestId("decision-action-select").selectOption("cambiar_proveedor"); await wait(page);
  await decisionForm.getByTestId("decision-reason-input").fill(`Escalamiento QA ${id}`); await wait(page);
  await decisionForm.getByTestId("decision-submit-btn").click();
  const decisionFeedback = decisionForm.getByTestId(`decision-feedback-${ref}`);
  await decisionFeedback.waitFor({ state: "visible", timeout: 10000 });
  const providerError = await decisionFeedback.innerText();
  if (!/cambiar_proveedor exige indicar el nuevo proveedor\./.test(providerError)) {
    throw new Error(`Error de proveedor inesperado: ${providerError}`);
  }
  result.decisionProviderRequired = true;

  // 7. Decision completa: proveedor nuevo + motivo -> el item vuelve a pendiente
  await decisionForm.getByTestId("decision-provider-input").fill(newProvider); await wait(page);
  await decisionForm.getByTestId("decision-submit-btn").click();
  await decisionForm.waitFor({ state: "detached", timeout: 10000 });
  await page.reload({ waitUntil: "networkidle" });
  if (await page.getByTestId(`decision-open-${ref}`).count() > 0) {
    throw new Error("El item sigue escalado tras registrar la decision");
  }
  if (await quickAttempt.getAttribute("disabled") !== null) {
    throw new Error("El boton 'Intento rapido' deberia estar habilitado de nuevo (status pendiente)");
  }
  const rowText = await backlogRow.innerText();
  if (!/pendiente/.test(rowText)) throw new Error(`La fila no volvio a pendiente: ${rowText}`);
  result.decisionRegistered = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
