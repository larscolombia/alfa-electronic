import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const REF_A = `qa-inv-06a-${id}`;
const REF_B = `qa6x-${id}`;
const SUPPLIER_NAME = `Proveedor QA ${id}`;
const SUPPLIER_NUMBER = `QA06-${id}`;
const wait = p => p.waitForTimeout(500);
const result = {
  case: "INV-06",
  login: false,
  supplierCreated: false,
  referenceACreated: false,
  duplicateWarningListedA: false,
  duplicateReason: "",
  forceBlockedWithoutReason: false,
  forceReasonErrorMessage: "",
  referenceBCreatedForced: false,
  referenceBInCatalog: false,
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

  // ── (0) Proveedor unico vía UI (catálogo vacío; el alta de ficha exige uno) ──
  await page.goto(`${base}/app/suppliers-crud`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Crear proveedor/i }).click(); await wait(page);
  await page.locator("input[name='supplierNumber']").fill(SUPPLIER_NUMBER); await wait(page);
  await page.locator("input[name='legalName']").fill(SUPPLIER_NAME); await wait(page);
  await page.locator("input[name='responsiblePerson']").fill("QA Responsable"); await wait(page);
  await page.getByRole("button", { name: /Guardar proveedor/i }).click();
  await assertText(page.locator("div.alert.alert-success"), /Proveedor creado correctamente/i, "crear proveedor");
  result.supplierCreated = true;
  await page.waitForTimeout(3000); // el catalogo compartido se refresca desde la API

  // ── (1) Alta de ficha A con el proveedor ──────────────────────────────────
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  const supplierSelect = page.locator("select.form-select", { has: page.locator("option", { hasText: "Selecciona proveedor" }) });
  const fillCreateForm = async (ref, designation) => {
    await page.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
    await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(designation); await wait(page);
    await page.locator("input[placeholder='Ej: Circuito integrado']").fill("Componente QA INV-06"); await wait(page);
    const supplierOption = supplierSelect.locator("option", { hasText: SUPPLIER_NAME });
    await supplierOption.waitFor({ state: "attached", timeout: 15000 });
    await supplierSelect.selectOption(await supplierOption.getAttribute("value")); await wait(page);
  };
  await fillCreateForm(REF_A, `Referencia QA INV-06 A ${id}`);
  await page.getByRole("button", { name: /^Crear ficha$/ }).click();
  await assertText(page.getByTestId("inv-feedback-alert"), /creada correctamente/i, "crear ficha A");
  result.referenceACreated = true;

  // ── (2) Ficha B: MISMO proveedor, referencia distinta (similitud < 0.72) ──
  await fillCreateForm(REF_B, `Referencia QA INV-06 B ${id}`);
  await page.getByRole("button", { name: /^Crear ficha$/ }).click();
  const warning = page.getByTestId("inv-duplicate-warning");
  const warningText = await assertText(warning, new RegExp(REF_A), "panel duplicado lista candidato A");
  if (!/Proveedor identico/.test(warningText)) {
    throw new Error(`Se esperaba razon "Proveedor identico", panel dice: "${warningText}"`);
  }
  result.duplicateWarningListedA = true;
  result.duplicateReason = "Proveedor identico";

  // ── (3) Ruta bloqueada: forzar SIN motivo ─────────────────────────────────
  await page.getByTestId("inv-force-create-btn").click(); await wait(page);
  result.forceReasonErrorMessage = await assertText(
    page.getByTestId("inv-force-reason-error"),
    /Para forzar la creacion debes indicar el motivo \(forceReason\)\./i,
    "error motivo obligatorio"
  );
  result.forceBlockedWithoutReason = true;

  // ── (4) Forzar creacion con motivo → ficha B creada ───────────────────────
  await page.getByTestId("inv-force-reason").fill(`Variante real del componente; candidato ${REF_A} dado de baja (QA ${id})`); await wait(page);
  await page.getByTestId("inv-force-create-btn").click();
  await assertText(page.getByTestId("inv-feedback-alert"), new RegExp(`${REF_B} creada correctamente`), "forzar creacion ficha B");
  result.referenceBCreatedForced = true;

  // ── La ficha B queda en el catálogo (stock 0) ─────────────────────────────
  const rowB = page.getByTestId(`stock-row-${REF_B}`);
  await rowB.waitFor({ state: "visible", timeout: 15000 });
  const availableB = (await page.getByTestId(`inv-available-${REF_B}`).innerText()).trim();
  if (availableB !== "0") throw new Error(`Ficha B deberia nacer con stock 0, es "${availableB}"`);
  result.referenceBInCatalog = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }

console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
