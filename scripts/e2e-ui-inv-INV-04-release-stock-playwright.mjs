import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const ref = `qa-inv-04-${id}`;
const wait = page => page.waitForTimeout(500);
const result = {
  case: "INV-04",
  reference: ref,
  login: false,
  cardCreated: false,
  entryRegistered: false,
  availableDropsTo6WithReservation: false,
  releaseConfirmed: false,
  availableRestoredTo10: false,
  stockNotDoubledAfterRelease: false,
  doubleReleaseBlocked: false,
  error: "",
};
let browser;

const availableText = async (page) => {
  const cell = page.getByTestId(`inv-available-${ref}`);
  await cell.waitFor({ state: "visible", timeout: 15000 });
  return (await cell.innerText()).trim();
};

const stockCellText = async (page, index) => {
  const row = page.getByTestId(`stock-row-${ref}`);
  await row.waitFor({ state: "visible", timeout: 15000 });
  return (await row.locator("td").nth(index).innerText()).trim();
};

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();

  // Login admin por UI.
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;

  // (1) Alta de ficha nueva con referencia unica.
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(`Ficha QA INV-04 ${id}`); await wait(page);
  await page.locator("input[placeholder='Ej: Circuito integrado']").fill("Repuesto QA"); await wait(page);
  await page.locator("input[placeholder='Ej: Texas Instruments']").fill("Marca QA"); await wait(page);
  await page.getByRole("button", { name: /^Crear ficha$/ }).click(); await wait(page);
  await page.getByTestId("inv-feedback-alert").waitFor({ state: "visible", timeout: 15000 });
  result.cardCreated = true;

  // Entrada de stock: 10 unidades (la UI no permite stock inicial en el alta).
  await page.getByRole("button", { name: /Entrada a stock existente/i }).click(); await wait(page);
  const entryRefSelect = page.locator("select").filter({ has: page.locator(`option[value='${ref}']`) });
  await entryRefSelect.selectOption(ref); await wait(page);
  await page.locator("input[type='number']").fill("10"); await wait(page);
  await page.getByRole("button", { name: /^Registrar entrada$/ }).click(); await wait(page);
  await page.getByTestId("inv-feedback-alert").waitFor({ state: "visible", timeout: 15000 });
  result.entryRegistered = true;
  const available10 = await availableText(page);
  if (available10 !== "10") throw new Error(`Disponible tras entrada deberia ser 10, es '${available10}'`);

  // (2) Reserva de 4 unidades.
  await page.goto(`${base}/app/inventory-reservations`, { waitUntil: "networkidle" });
  const newCard = page.locator("div.card", { hasText: "Nueva reserva" }).first();
  await newCard.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await newCard.locator("input[type='number']").fill("4"); await wait(page);
  await newCard.locator("input[placeholder='Reparacion urgente, cliente critico, etc.']").fill(`QA INV-04 ${id}`); await wait(page);
  await newCard.locator("select[name='reservationAssignedTo']").selectOption({ index: 1 }); await wait(page);
  await newCard.getByRole("button", { name: /^Crear reserva$/ }).click(); await wait(page);
  await wait(page); await wait(page);
  const feedbackAlert = page.locator("[data-testid='inv-reservations-feedback']");
  if (await feedbackAlert.count()) {
    result.reservationFeedback = (await feedbackAlert.innerText()).trim();
  }
  const row = page.locator("[data-testid^='reservation-row-']", { hasText: ref }).first();
  await row.waitFor({ state: "visible", timeout: 15000 });
  const rowTestId = await row.getAttribute("data-testid");
  const reservationId = rowTestId.replace("reservation-row-", "");

  // Disponible baja a 6 (10 - 4 reservado), stock actual sigue 10.
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  const available6 = await availableText(page);
  const stockWithReservation = await stockCellText(page, 5);
  const reservedWithReservation = await stockCellText(page, 6);
  result.availableDropsTo6WithReservation = available6 === "6" && stockWithReservation === "10" && reservedWithReservation === "4";
  if (!result.availableDropsTo6WithReservation) {
    throw new Error(`Tras reserva: disponible='${available6}' stock='${stockWithReservation}' reservado='${reservedWithReservation}'`);
  }

  // (3) Liberar la reserva: confirmacion + disponible vuelve a 10 sin doble efecto.
  await page.goto(`${base}/app/inventory-reservations`, { waitUntil: "networkidle" });
  await page.getByTestId(`reservation-release-${reservationId}`).click(); await wait(page);
  const releasedAlert = page.getByTestId(`reservation-released-${reservationId}`);
  await releasedAlert.waitFor({ state: "visible", timeout: 15000 });
  result.releaseConfirmed = /liberad/i.test(await releasedAlert.innerText());
  if (!result.releaseConfirmed) throw new Error("La confirmacion de liberacion no menciona 'liberada'");

  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  const availableAfterRelease = await availableText(page);
  const stockAfterRelease = await stockCellText(page, 5);
  result.availableRestoredTo10 = availableAfterRelease === "10";
  result.stockNotDoubledAfterRelease = stockAfterRelease === "10";
  if (!result.availableRestoredTo10 || !result.stockNotDoubledAfterRelease) {
    throw new Error(`Tras liberar: disponible='${availableAfterRelease}' stock='${stockAfterRelease}' (esperado 10/10, sin doble efecto)`);
  }

  // (4) No se puede liberar dos veces: el boton desaparece (estado liberada).
  await page.goto(`${base}/app/inventory-reservations`, { waitUntil: "networkidle" });
  result.doubleReleaseBlocked = (await page.getByTestId(`reservation-release-${reservationId}`).count()) === 0;
  if (!result.doubleReleaseBlocked) throw new Error("El boton Liberar sigue visible tras liberar (doble liberacion posible)");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
