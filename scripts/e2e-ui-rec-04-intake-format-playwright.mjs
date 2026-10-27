import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC04 ${id}`;
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
  saved: false,
  error: "",
};
let browser;

writeFileSync(pdfPath, Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"));
for (const pngPath of pngPaths) writeFileSync(pngPath, Buffer.from(pngBase64, "base64"));

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();
  page.setDefaultTimeout(60000);
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec04-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await page.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.locator("select[data-testid^='equipment-modal-registration-mode-']").first().selectOption("manual");
  for (const [placeholder, value] of [["Familia libre", "Control"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
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
  for (let i = 0; i < faceLabels.length; i += 1) await modal.locator(".evidence-photo-card select").nth(i).selectOption({ label: faceLabels[i] });
  await wait(page);
  result.facesComplete = await modal.getByText("Caras completas").first().isVisible();
  if (!result.facesComplete) throw new Error("El checklist de caras no quedó completo tras subir las 4 fotos");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const saveBtn = modal.getByTestId("equipment-modal-save");
  await saveBtn.waitFor({ state: "visible" });
  await saveBtn.click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;
  if (!result.pdfAttached) throw new Error("El PDF del formato físico no apareció en la lista de adjuntos");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
