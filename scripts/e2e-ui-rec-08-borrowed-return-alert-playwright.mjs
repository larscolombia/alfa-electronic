import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC08 ${id}`;
const wait = p => p.waitForTimeout(500);
const result = { case: "REC-08", login: false, borrowedCode: "", codeFormatOk: false, removeWorks: false, badgeVisible: false, badgeHasCode: false, saved: false, error: "" };
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const FACES = ["face-front", "face-back", "face-left", "face-right"];

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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec08-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Equipos: modo manual + datos del equipo.
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-registration-mode-']").first(), "manual");
  for (const [placeholder, value] of [["Familia libre", "Instrumento"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Multímetro"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // REC-08: préstamo anclado con código BLD-XXXXXXXX.
  await modal.getByTestId("equipment-modal-add-borrowed-0").click(); await wait(page);
  await modal.getByTestId("equipment-modal-add-borrowed-0").click(); await wait(page);
  const removeBtn = modal.getByTestId("equipment-modal-remove-borrowed-0-1");
  await removeBtn.click(); await wait(page);
  result.removeWorks = (await modal.locator("app-crm-equipment-borrowed-list input[placeholder^='Ej.: Parlante']").count()) === 1;
  await modal.locator("app-crm-equipment-borrowed-list input[placeholder^='Ej.: Parlante']").first().fill("Multímetro de referencia"); await wait(page);
  const codeText = (await modal.locator("app-crm-equipment-borrowed-list .input-group-text").first().innerText()).trim();
  result.borrowedCode = codeText;
  result.codeFormatOk = /^BLD-[A-Z2-9]{8}$/.test(codeText);
  if (!result.codeFormatOk) throw new Error(`Código de préstamo inválido: "${codeText}"`);
  if (!result.removeWorks) throw new Error("El botón Quitar del préstamo no eliminó la fila");

  // Paso Preguntas: costo > 2M = Sí (libera gate REC-01) y software descartado = Sí.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.locator("input[id$='-costAboveTwoMillion']").check(); await wait(page);
  await modal.locator("input[id$='-softwareIssueRuledOut']").check(); await wait(page);

  // Paso Evidencia: 4 fotos de caras obligatorias.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const facePaths = FACES.map(face => { const p = `/tmp/rec08-${face}-${id}.png`; writeFileSync(p, PNG_1X1); return p; });
  await modal.locator("input[type='file'][accept='image/*'][capture]").setInputFiles(facePaths);
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible", timeout: 30000 });
  const faceLabels = { "face-front": "Cara frente", "face-back": "Cara atrás", "face-left": "Cara izquierda", "face-right": "Cara derecha" };
  for (let i = 0; i < FACES.length; i++) await selectCustomModal(page, modal.locator(".evidence-photo-card").nth(i).getByTestId("equipment-modal-evidence-type"), { label: faceLabels[FACES[i]] });
  await wait(page);

  // Paso Cierre: badge de préstamo pendiente de devolución con el código.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const badge = modal.getByTestId("borrowed-return-alert").first();
  result.badgeVisible = await badge.isVisible();
  result.badgeHasCode = result.badgeVisible && (await badge.innerText()).includes(result.borrowedCode);
  if (!result.badgeVisible || !result.badgeHasCode) throw new Error(`Badge de préstamo no visible o sin código (visible=${result.badgeVisible}, hasCode=${result.badgeHasCode})`);

  // Guardar (upsert + finalize): éxito = el modal se cierra sin mensaje de validación.
  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = !(await page.getByTestId("equipment-modal-validation-message").isVisible().catch(() => false));
  if (!result.saved) throw new Error("Guardado falló: modal cerrado pero con mensaje de validación visible");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
