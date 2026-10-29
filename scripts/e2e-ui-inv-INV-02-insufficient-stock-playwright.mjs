import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const REF = `qa-inv-02-${id}`;
const wait = p => p.waitForTimeout(500);
const result = {
  case: "INV-02",
  login: false,
  referenceCreated: false,
  stockEntryOf2: false,
  insufficientStockBlocked: false,
  insufficientStockMessage: "",
  salidaRegistered: false,
  workspaceTabsVisible: false,
  activityHistoryShowsMovement: false,
  movementDetailVisible: false,
  availableAfterSalida: null,
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

  // ── (1) Alta de ficha nueva en /app/inventory-stock ───────────────────────
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(REF); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(`Referencia QA INV-02 ${id}`); await wait(page);
  await page.locator("input[placeholder='Ej: Circuito integrado']").fill("Componente QA"); await wait(page);
  await page.getByRole("button", { name: /^Crear ficha$/ }).click();
  await assertText(page.getByTestId("inv-feedback-alert"), /ficha|creada|registrada/i, "crear ficha");
  result.referenceCreated = true;

  // ── Entrada de stock 2 unidades (tab "Entrada a stock existente") ─────────
  await page.getByRole("button", { name: /Entrada a stock existente/i }).click(); await wait(page);
  const entrySelect = page.locator("select.form-select", { has: page.locator("option", { hasText: "Selecciona referencia" }) });
  await entrySelect.waitFor({ state: "attached" });
  await page.locator(`select.form-select option[value='${REF}']`).waitFor({ state: "attached", timeout: 15000 });
  await entrySelect.selectOption({ value: REF }, { force: true }); await wait(page);
  await page.locator("input[type='number']").first().fill("2"); await wait(page);
  await page.getByRole("button", { name: /^Registrar entrada$/ }).click();
  await assertText(page.getByTestId("inv-feedback-alert"), /Entrada registrada: 2 unidad/i, "entrada de stock");
  result.stockEntryOf2 = true;

  // Disponible = 2 en el catalogo
  const availableCell = page.getByTestId(`inv-available-${REF}`);
  await availableCell.waitFor({ state: "visible", timeout: 15000 });
  const availableNow = (await availableCell.innerText()).trim();
  if (availableNow !== "2") throw new Error(`Disponible tras entrada deberia ser 2, es "${availableNow}"`);

  // ── (2) Salida tecnica de 5 -> debe bloquearse con inv-insufficient-stock-alert ──
  await page.goto(`${base}/app/inventory-movements`, { waitUntil: "networkidle" });
  await page.getByTestId("inv-tab-register").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("inv-tab-activity").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("inv-tab-bags").waitFor({ state: "visible", timeout: 15000 });
  result.workspaceTabsVisible = true;
  const refSelect = page.locator("select.form-select", { has: page.locator("option", { hasText: "Selecciona referencia" }) });
  await page.locator(`select.form-select option[value='${REF}']`).waitFor({ state: "attached", timeout: 15000 });
  await refSelect.selectOption({ value: REF }, { force: true }); await wait(page);
  await page.locator("input[type='number']").first().fill("5"); await wait(page);
  await page.locator("input[placeholder='Explica por que se hace el movimiento']").fill(`Salida excesiva QA ${id}`); await wait(page);
  await page.getByRole("button", { name: /^Registrar salida$/ }).click();
  result.insufficientStockMessage = await assertText(
    page.getByTestId("inv-insufficient-stock-alert"),
    /No hay stock suficiente: disponible 2.*requerido 5/i,
    "alerta stock insuficiente"
  );
  result.insufficientStockBlocked = true;

  // ── (3) Ruta correcta: salida tecnica de 1 ────────────────────────────────
  await page.locator("input[type='number']").first().fill("1"); await wait(page);
  await page.getByRole("button", { name: /^Registrar salida$/ }).click();
  await assertText(page.getByTestId("inv-movements-feedback"), /Movimiento registrado correctamente/i, "salida de 1");
  result.salidaRegistered = true;

  // ── (4) Actividad compacta: historial, búsqueda y detalle expandible ──────
  await page.getByTestId("inv-tab-activity").click(); await wait(page);
  const search = page.getByTestId("inv-history-search");
  await search.waitFor({ state: "visible", timeout: 15000 });
  await search.fill(REF); await wait(page);
  const movementRow = page.locator("table tbody tr", { hasText: REF }).first();
  await movementRow.waitFor({ state: "visible", timeout: 15000 });
  result.activityHistoryShowsMovement = true;
  await movementRow.getByRole("button", { name: "Ver detalle" }).click();
  await page.getByRole("complementary", { name: "Detalle del movimiento" }).waitFor({ state: "visible", timeout: 15000 });
  result.movementDetailVisible = true;

  // ── Disponible baja a 1 en /app/inventory-stock ───────────────────────────
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  const afterCell = page.getByTestId(`inv-available-${REF}`);
  await afterCell.waitFor({ state: "visible", timeout: 15000 });
  result.availableAfterSalida = (await afterCell.innerText()).trim();
  if (result.availableAfterSalida !== "1") {
    throw new Error(`Disponible tras salida deberia ser 1, es "${result.availableAfterSalida}"`);
  }
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }

console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
