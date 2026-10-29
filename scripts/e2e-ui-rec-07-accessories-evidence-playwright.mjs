import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC07 ${id}`;
const wait = p => p.waitForTimeout(500);
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const faces = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"].map((label, i) => {
  const path = `/tmp/rec07-face-${i}-${id}.png`;
  writeFileSync(path, Buffer.from(PNG, "base64"));
  return { label, path };
});
const accessoriesPath = `/tmp/rec07-accessories-${id}.png`;
writeFileSync(accessoriesPath, Buffer.from(PNG, "base64"));

const result = {
  case: "REC-07",
  login: false,
  accessoriesWarningVisible: false,
  blockedRouteBlocked: false,
  alertClearedAfterEvidence: false,
  saved: false,
  error: "",
};
let browser;

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;

  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec07-${id}@alfa.local`]]) {
    await page.locator(`input[name='${field}']`).fill(value);
  }
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  await page.getByTestId("equipment-modal-next").click(); await wait(page);

  const modal = page.locator("app-crm-prospect-equipment-modal");
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-registration-mode-']").first(), "manual");
  for (const [placeholder, value] of [
    ["Familia libre", "Control"],
    ["Marca del equipo", "Marca QA"],
    ["Tipo / referencia", "Tipo QA"],
    ["Serie o referencia visible", `SER-${id}`],
  ]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
  await modal.locator("input[placeholder='USB, cables, CD, caja original...']").fill("Cable USB y caja original");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  await modal.getByText("Preguntas por equipo").waitFor({ state: "visible" });
  for (const questionKey of ["costAboveTwoMillion", "softwareIssueRuledOut"]) {
    const switchInput = modal.locator(`input[id$='-${questionKey}']`);
    if (!(await switchInput.isChecked())) await switchInput.click();
    await wait(page);
  }
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  await modal.getByText("Tomar fotos / subir evidencia").waitFor({ state: "visible" });
  const warning = modal.getByTestId("accessories-evidence-required");
  result.accessoriesWarningVisible = await warning.isVisible();

  const photoInput = modal.locator("input[type='file'][accept='image/*']").first();
  await photoInput.setInputFiles(faces.map(f => f.path));
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible" }); await wait(page);
  const cards = modal.locator(".evidence-photo-card");
  for (let i = 0; i < faces.length; i++) await selectCustomModal(page, cards.nth(i).getByTestId("equipment-modal-evidence-type"), { label: faces[i].label });
  await wait(page);

  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const validation = modal.getByTestId("equipment-modal-validation-message");
  const validationText = (await validation.isVisible()) ? await validation.innerText() : "";
  result.blockedRouteBlocked = /accesorios/i.test(validationText)
    && await warning.isVisible()
    && await modal.getByText("Tomar fotos / subir evidencia").isVisible();

  await photoInput.setInputFiles(accessoriesPath);
  await cards.nth(4).waitFor({ state: "visible" }); await wait(page);
  await selectCustomModal(page, cards.nth(4).getByTestId("equipment-modal-evidence-type"), { label: "Accesorios" });
  await warning.waitFor({ state: "hidden", timeout: 5000 });
  result.alertClearedAfterEvidence = true;

  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;

  if (!result.accessoriesWarningVisible || !result.blockedRouteBlocked || !result.saved) {
    throw new Error(`REC-07 incompleto: ${JSON.stringify(result)}`);
  }
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
