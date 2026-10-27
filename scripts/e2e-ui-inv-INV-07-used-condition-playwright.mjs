import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const REF = `qa-inv-07-${id}`;
const USED_NOTE = `Probo tecnico QA ${id}, equipo donante, 1200 horas de uso`;
const wait = p => p.waitForTimeout(500);
const result = {
  case: "INV-07",
  login: false,
  referenceCreated: false,
  usedEntryWithoutNoteBlocked: false,
  usedEntryWithoutNoteMessage: "",
  usedEntryRegistered: false,
  usedBadgeVisible: false,
  salidaWithoutTestBlocked: false,
  salidaWithoutTestMessage: "",
  usedTestRecorded: false,
  salidaAfterApprovedTest: false,
  availableAfterFinalSalida: null,
  error: "",
};
let browser;

const assertText = async (locator, re, label) => {
  await locator.waitFor({ state: "visible", timeout: 15000 });
  const text = (await locator.innerText()).replace(/\s+/g, " ").trim();
  if (!re.test(text)) throw new Error(`${label}: texto inesperado "${text}"`);
  return text;
};

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();

  // ── Login admin por UI ────────────────────────────────────────────────────
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;

  // ── (1) Alta de ficha nueva (stock minimo 0) en /app/inventory-stock ──────
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(REF); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(`Componente usado QA INV-07 ${id}`); await wait(page);
  await page.locator("input[placeholder='Ej: Circuito integrado']").fill("Componente QA"); await wait(page);
  await page.locator("input[type='number']").first().fill("0"); await wait(page);
  await page.getByRole("button", { name: /^Crear ficha$/ }).click();
  await assertText(page.getByTestId("inv-feedback-alert"), /ficha|creada|registrada/i, "crear ficha");
  result.referenceCreated = true;

  // ── (1a) Entrada USADA sin nota -> ruta bloqueada por el backend ──────────
  await page.getByRole("button", { name: /Entrada a stock existente/i }).click(); await wait(page);
  const entrySelect = page.locator("select.form-select", { has: page.locator("option", { hasText: "Selecciona referencia" }) });
  await page.locator(`select.form-select option[value='${REF}']`).waitFor({ state: "attached", timeout: 15000 });
  await entrySelect.selectOption({ value: REF }); await wait(page);
  await page.locator("input[type='number']").first().fill("3"); await wait(page);
  await page.getByTestId("stock-entry-condition").selectOption("usado"); await wait(page);
  const usedNoteInput = page.getByTestId("stock-entry-used-note");
  await usedNoteInput.waitFor({ state: "visible" });
  await page.getByRole("button", { name: /^Registrar entrada$/ }).click();
  result.usedEntryWithoutNoteMessage = await assertText(
    page.getByTestId("inv-backend-error-alert"),
    /La entrada de un componente usado requiere nota de prueba\/origen \(usedTestNote\)\./i,
    "entrada usada sin nota"
  );
  result.usedEntryWithoutNoteBlocked = true;

  // ── (1b) Entrada USADA con nota -> OK ─────────────────────────────────────
  await page.locator(`select.form-select option[value='${REF}']`).waitFor({ state: "attached", timeout: 15000 });
  await entrySelect.selectOption({ value: REF }); await wait(page);
  await page.locator("input[type='number']").first().fill("3"); await wait(page);
  await page.getByTestId("stock-entry-condition").selectOption("usado"); await wait(page);
  await page.getByTestId("stock-entry-used-note").waitFor({ state: "visible" });
  await page.getByTestId("stock-entry-used-note").fill(USED_NOTE); await wait(page);
  await page.getByRole("button", { name: /^Registrar entrada$/ }).click();
  await assertText(page.getByTestId("inv-feedback-alert"), /Entrada registrada: 3 unidad/i, "entrada usada con nota");
  result.usedEntryRegistered = true;

  // ── (2) Badge "Usado/Ocasion" y disponible 3 ──────────────────────────────
  const usedBadge = page.getByTestId(`inv-condition-used-${REF}`);
  await assertText(usedBadge, /Usado\/Ocasion/i, "badge condicion usado");
  result.usedBadgeVisible = true;
  const availableCell = page.getByTestId(`inv-available-${REF}`);
  await availableCell.waitFor({ state: "visible", timeout: 15000 });
  const availableNow = (await availableCell.innerText()).trim();
  if (availableNow !== "3") throw new Error(`Disponible tras entrada deberia ser 3, es "${availableNow}"`);

  // ── (3) Salida tecnica de 1 sin prueba aprobada -> bloqueada ──────────────
  await page.goto(`${base}/app/inventory-movements`, { waitUntil: "networkidle" });
  await page.locator("select:has(option[value='salida'])").selectOption("salida"); await wait(page);
  const movRefSelect = page.locator("select.form-select", { has: page.locator("option", { hasText: "Selecciona referencia" }) });
  await page.locator(`select.form-select option[value='${REF}']`).waitFor({ state: "attached", timeout: 15000 });
  await movRefSelect.selectOption({ value: REF }); await wait(page);
  await page.locator("input[type='number']").first().fill("1"); await wait(page);
  await page.locator("input[placeholder='Explica por que se hace el movimiento']").fill(`Instalacion QA ${id}`); await wait(page);
  await page.getByRole("button", { name: /^Registrar movimiento$/ }).click();
  result.salidaWithoutTestMessage = await assertText(
    page.getByTestId("inv-used-test-required-alert"),
    /componente usado requiere prueba aprobada registrada antes de instalar/i,
    "salida usado sin prueba"
  );
  result.salidaWithoutTestBlocked = true;

  // ── (4) Registrar prueba aprobada desde el catalogo de stock ──────────────
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByTestId(`used-test-open-${REF}`).click();
  await page.getByTestId("used-test-form").waitFor({ state: "visible" });
  await page.getByTestId("used-test-result").selectOption("aprobada"); await wait(page);
  await page.getByTestId("used-test-note").fill(`Prueba funcional OK en banco QA ${id}`); await wait(page);
  await page.getByTestId(`used-test-submit-${REF}`).click();
  await assertText(page.getByTestId(`used-test-last-${REF}`), /aprobada/i, "ultima prueba registrada");
  result.usedTestRecorded = true;

  // ── (5) Salida tecnica de 1 con prueba aprobada -> OK ─────────────────────
  await page.goto(`${base}/app/inventory-movements`, { waitUntil: "networkidle" });
  await page.locator("select:has(option[value='salida'])").selectOption("salida"); await wait(page);
  await page.locator(`select.form-select option[value='${REF}']`).waitFor({ state: "attached", timeout: 15000 });
  await movRefSelect.selectOption({ value: REF }); await wait(page);
  await page.locator("input[type='number']").first().fill("1"); await wait(page);
  await page.locator("input[placeholder='Explica por que se hace el movimiento']").fill(`Instalacion QA ${id} tras prueba aprobada`); await wait(page);
  await page.getByRole("button", { name: /^Registrar movimiento$/ }).click();
  await assertText(page.getByTestId("inv-movements-feedback"), /Movimiento registrado correctamente/i, "salida con prueba aprobada");
  result.salidaAfterApprovedTest = true;

  // ── Disponible baja a 2 en /app/inventory-stock ───────────────────────────
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  const afterCell = page.getByTestId(`inv-available-${REF}`);
  await afterCell.waitFor({ state: "visible", timeout: 15000 });
  result.availableAfterFinalSalida = (await afterCell.innerText()).trim();
  if (result.availableAfterFinalSalida !== "2") {
    throw new Error(`Disponible tras salida deberia ser 2, es "${result.availableAfterFinalSalida}"`);
  }
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }

console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
