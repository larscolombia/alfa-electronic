import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const apiBaseUrl = (process.env.PW_API_BASE_URL || "").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const companyName = `QA REC04 ${id}`;
const wait = page => page.waitForTimeout(500);
const pdfPath = `/tmp/formato-rec04-${id}.pdf`;
const pngPaths = ["front", "back", "left", "right"].map(face => `/tmp/cara-${face}-${id}.png`);
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const result = {
  case: "REC-04",
  frontendOnly: false,
  login: false,
  pdfAttached: false,
  facesComplete: false,
  catalogOptionsVerified: false,
  customLocationCreated: false,
  summaryPreserved: false,
  saved: false,
  error: "",
};
let browser;

writeFileSync(pdfPath, Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"));
for (const pngPath of pngPaths) writeFileSync(pngPath, Buffer.from(pngBase64, "base64"));

try {
  browser = await chromium.launch({ headless: process.env.PW_HEADLESS !== "false", slowMo: Number(process.env.PW_SLOW_MO_MS || 0) });
  const context = await browser.newContext();
  if (apiBaseUrl) await context.addInitScript((value) => window.localStorage.setItem("pika.apiBaseUrl", value), apiBaseUrl);
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const signinUrl = `${base}/auth/signin${apiBaseUrl ? `?apiBaseUrl=${encodeURIComponent(apiBaseUrl)}` : ""}`;
  await page.goto(signinUrl, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
  for (const [field, value] of [["formCompania", companyName], ["formNit", "900123456-7"], ["formCorreo", `rec04-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").waitFor({ state: "visible" });
  if (await page.getByTestId("prospect-save-btn").isDisabled()) throw new Error("El formulario de prospecto quedó inválido antes de guardar");
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: companyName }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await page.getByTestId("equipment-modal-next").click(); await wait(page);
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-registration-mode-']").first(), "manual");
  const familySelect = modal.locator("[data-testid^='equipment-modal-family-']").first();
  const serviceSelect = modal.locator("[data-testid^='equipment-modal-service-type-']").first();
  const familyOptions = await familySelect.locator("option").allTextContents();
  const serviceOptions = await serviceSelect.locator("option").allTextContents();
  const expectedFamilies = ["A - Alimentacion", "CE - Tarjeta Electrónica"];
  const expectedServices = ["Reparación", "intervención en sitio", "Venta Nuevo", "Venta Usado", "Préstamo", "Manufactura", "Intercambio"];
  result.catalogOptionsVerified = expectedFamilies.every(value => familyOptions.includes(value)) && expectedServices.every(value => serviceOptions.includes(value));
  if (!result.catalogOptionsVerified) throw new Error(`Opciones de catálogo incompletas. familias=${JSON.stringify(familyOptions)} servicios=${JSON.stringify(serviceOptions)}`);
  await familySelect.selectOption("family-a-alimentacion");
  await serviceSelect.selectOption("service-intercambio");
  const locationName = `Bodega QA ${id}`;
  const locationInput = modal.getByTestId(/^equipment-modal-storage-location-/).first();
  await locationInput.fill(locationName);
  await locationInput.press("Tab");
  await page.waitForTimeout(800);
  result.customLocationCreated = await locationInput.inputValue() === locationName;
  if (!result.customLocationCreated) throw new Error("La ubicación escrita no quedó seleccionada/creada en el formulario");
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const costSwitch = modal.locator("input[id$='-costAboveTwoMillion']");
  await costSwitch.waitFor({ state: "visible" });
  await costSwitch.click(); await wait(page);
  const softwareAck = modal.getByTestId("software-suspicion-ack");
  await softwareAck.waitFor({ state: "visible" });
  await softwareAck.check(); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByTestId("intake-format-file-input").setInputFiles(pdfPath); await wait(page);
  const removeBtn = modal.getByTestId("intake-format-remove-0");
  await removeBtn.waitFor({ state: "visible" }); result.pdfAttached = true;
  await modal.locator('input[type="file"][accept="image/*"]').setInputFiles(pngPaths);
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible" });
  const faceLabels = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];
  for (let i = 0; i < faceLabels.length; i += 1) await selectCustomModal(page, modal.locator(".evidence-photo-card").nth(i).getByTestId("equipment-modal-evidence-type"), { label: faceLabels[i] });
  await wait(page);
  result.facesComplete = await modal.getByText("Caras completas").first().isVisible();
  if (!result.facesComplete) throw new Error("El checklist de caras no quedó completo tras subir las 4 fotos");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const summary = await modal.innerText();
  result.summaryPreserved = ["A - Alimentacion", "Intercambio", locationName].every(value => summary.includes(value));
  if (!result.summaryPreserved) throw new Error(`El cierre no conservó familia, servicio y ubicación: ${summary.slice(-1800)}`);
  const saveBtn = modal.getByTestId("equipment-modal-save");
  await saveBtn.waitFor({ state: "visible" });
  await saveBtn.click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;
  if (!result.pdfAttached || !result.summaryPreserved) throw new Error("La recepción no conservó los datos requeridos hasta el cierre");
} catch (error) { result.error = String(error?.stack || error); }
finally {
  if (browser) await browser.close();
  if (process.env.PW_RESULT_PATH) writeFileSync(process.env.PW_RESULT_PATH, JSON.stringify(result));
}
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
