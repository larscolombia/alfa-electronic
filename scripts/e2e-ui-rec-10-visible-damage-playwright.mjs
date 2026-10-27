import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC10 ${id}`;
const wait = p => p.waitForTimeout(500);
const result = {
  case: "REC-10",
  login: false,
  evidenceRequiredAlert: false,
  blockedAfterConfirm: false,
  saveBlockedWithMessage: false,
  saveDraftStillAllowed: false,
  damagePhotoAccepted: false,
  saved: false,
  error: "",
};
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const FACES = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];
const NOTES_PLACEHOLDER = "Golpe lateral, placa legible, caja sellada...";

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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec10-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Equipos: modo manual + datos del equipo.
  await modal.locator("select[data-testid^='equipment-modal-registration-mode-']").first().selectOption("manual");
  for (const [placeholder, value] of [["Familia libre", "Instrumento"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Osciloscopio"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // Paso Preguntas: costo > 2M = Sí (libera gate REC-01) y software descartado = Sí.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.locator("input[id$='-costAboveTwoMillion']").check(); await wait(page);
  await modal.locator("input[id$='-softwareIssueRuledOut']").check(); await wait(page);

  // Paso Evidencia: 4 caras obligatorias + daño visible activado.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const facePaths = FACES.map((_, i) => { const p = `/tmp/rec10-face-${i}-${id}.png`; writeFileSync(p, PNG_1X1); return p; });
  await modal.locator("input[type='file'][accept='image/*'][capture]").first().setInputFiles(facePaths);
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible", timeout: 30000 });
  const selects = modal.locator(".evidence-photo-card select.form-select");
  for (let i = 0; i < FACES.length; i++) await selects.nth(i).selectOption({ label: FACES[i] });
  await wait(page);

  // REC-10: activar daño visible exige evidencia "Daño visible" con nota + confirmación.
  await modal.getByTestId("visible-damage-check").check(); await wait(page);
  const requiredAlert = modal.getByTestId("visible-damage-evidence-required").first();
  result.evidenceRequiredAlert = await requiredAlert.isVisible();
  if (!result.evidenceRequiredAlert) throw new Error("No apareció la alerta visible-damage-evidence-required al activar el daño visible");
  await modal.getByTestId("visible-damage-confirm").check(); await wait(page);
  result.blockedAfterConfirm = await requiredAlert.isVisible();
  if (!result.blockedAfterConfirm) throw new Error("La alerta de evidencia desapareció sin haber subido foto de daño visible");

  // Paso Cierre: Guardar completo debe bloquearse con el mensaje de daño visible.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByTestId("equipment-modal-save").click(); await wait(page);
  const validationMsg = await modal.getByTestId("equipment-modal-validation-message").innerText();
  result.saveBlockedWithMessage = /Daño visible reportado/i.test(validationMsg);
  if (!result.saveBlockedWithMessage) throw new Error(`Guardar no bloqueó por daño visible; mensaje: "${validationMsg.trim()}"`);
  result.saveDraftStillAllowed = await modal.getByTestId("equipment-modal-save-draft").isVisible();
  if (!result.saveDraftStillAllowed) throw new Error("El botón Guardar borrador no está disponible en Cierre con daño visible pendiente");

  // Volver a Evidencia: subir foto tipo "Daño visible" con nota → la alerta debe desaparecer.
  await modal.getByTestId("equipment-modal-previous").click(); await wait(page);
  const damagePath = `/tmp/rec10-damage-${id}.png`;
  writeFileSync(damagePath, PNG_1X1);
  await modal.locator("input[type='file'][accept='image/*'][capture]").first().setInputFiles(damagePath);
  await modal.locator(".evidence-photo-card").nth(4).waitFor({ state: "visible", timeout: 30000 });
  await selects.nth(4).selectOption({ label: "Daño visible" });
  await modal.locator(`.evidence-photo-card input[placeholder='${NOTES_PLACEHOLDER}']`).nth(4).fill("Golpe en esquina superior derecha");
  await wait(page);
  result.damagePhotoAccepted = !(await requiredAlert.isVisible());
  if (!result.damagePhotoAccepted) throw new Error("La alerta de evidencia sigue visible tras subir foto de daño con nota");

  // Guardar completo: éxito = el host del modal se destruye.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
