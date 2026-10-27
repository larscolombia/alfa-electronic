import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC11 ${id}`;
const wait = p => p.waitForTimeout(500);
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const faces = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"].map((label, i) => {
  const path = `/tmp/rec11-face-${i}-${id}.png`;
  writeFileSync(path, Buffer.from(PNG, "base64"));
  return { label, path };
});

const result = {
  case: "REC-11",
  login: false,
  badgeVisibleInQuestions: false,
  badgeVisibleInClosure: false,
  advanceNotBlocked: false,
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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec11-${id}@alfa.local`]]) {
    await page.locator(`input[name='${field}']`).fill(value);
  }
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  await page.getByTestId("equipment-modal-next").click(); await wait(page);

  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.locator("select[data-testid^='equipment-modal-registration-mode-']").first().selectOption("manual");
  for (const [placeholder, value] of [
    ["Familia libre", "Control"],
    ["Marca del equipo", "Marca QA"],
    ["Tipo / referencia", "Tipo QA"],
    ["Serie o referencia visible", `SER-${id}`],
  ]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
  // REC-11: se omite a propósito la "Descripción de la falla" (failureDescription queda vacía).
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  await modal.getByText("Preguntas por equipo").waitFor({ state: "visible" });
  const badge = modal.getByTestId("failure-pending-badge");
  await badge.waitFor({ state: "visible" });
  result.badgeVisibleInQuestions = /Falla pendiente/i.test(await badge.innerText());

  for (const questionKey of ["costAboveTwoMillion", "softwareIssueRuledOut"]) {
    const switchInput = modal.locator(`input[id$='-${questionKey}']`);
    if (!(await switchInput.isChecked())) await switchInput.click();
    await wait(page);
  }
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  await modal.getByText("Tomar fotos / subir evidencia").waitFor({ state: "visible" });
  result.advanceNotBlocked = true;
  const photoInput = modal.locator("input[type='file'][accept='image/*']").first();
  await photoInput.setInputFiles(faces.map(f => f.path));
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible" }); await wait(page);
  const cards = modal.locator(".evidence-photo-card");
  for (let i = 0; i < faces.length; i++) await cards.nth(i).locator("select.form-select").selectOption({ label: faces[i].label });
  await wait(page);

  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByText("Resumen de la recepción").waitFor({ state: "visible" });
  await modal.getByTestId("failure-pending-badge").waitFor({ state: "visible" });
  result.badgeVisibleInClosure = /Falla pendiente/i.test(await modal.getByTestId("failure-pending-badge").innerText());

  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;

  if (!result.badgeVisibleInQuestions || !result.badgeVisibleInClosure || !result.saved) {
    throw new Error(`REC-11 incompleto: ${JSON.stringify(result)}`);
  }
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
