import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
// Windows: /tmp no existe → tmpdir() (patrón rec-04/rec-06).
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectCustomModal } from "./ui-modal-controls.mjs";

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
const facePaths = ["front", "back", "serial-plate"].map(face => join(tmpdir(), `rec10-${face}-${id}.png`));
for (const p of facePaths) writeFileSync(p, PNG_1X1);
const damagePath = join(tmpdir(), `rec10-damage-${id}.png`);
writeFileSync(damagePath, PNG_1X1);
const NOTES_PLACEHOLDER = "Golpe lateral, placa legible, caja sellada...";

// Aligned with the REC battery: respect PW_HEADLESS / PW_SLOW_MO_MS (visible mode + 400ms for review).
try {
  browser = await chromium.launch({ headless: process.env.PW_HEADLESS !== "false", slowMo: Number(process.env.PW_SLOW_MO_MS || 0) });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;
  // Entrada por recepción directa (layout actual): el listado de prospectos ya no expone la acción
  // "Asociar equipo"; el modal es el mismo componente, abierto desde /app/work-equipment-reception.
  await page.goto(`${base}/app/work-equipment-reception`, { waitUntil: "networkidle" });
  await page.getByTestId("work-equipment-create").click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  // El host es inline 0x0: esperar el botón next del footer, nunca visibility sobre el host.
  await page.getByTestId("equipment-modal-next").waitFor({ state: "visible", timeout: 15000 });
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Equipos: familia por catálogo fijo (select nativo) + datos libres del equipo.
  // Familia es un <select> nativo (STANDARD_EQUIPMENT_FAMILIES), no el input libre antiguo.
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" }); await wait(page);
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Osciloscopio"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // Equipos → Evidencia directo: el paso "Preguntas" se eliminó del wizard (UN solo next).
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Evidencia (patrón verde REC-01/REC-04): un input file oculto por cara obligatoria;
  // id = 'evidence-face-' + item.id + '-' + faceType; al subir, handleRequiredFaceEvidenceSelected
  // fija photo.evidenceType — el slot nace clasificado.
  const faceSlotSuffixes = ["-face-front", "-face-back", "serial-plate"];
  for (let i = 0; i < facePaths.length; i += 1) {
    await modal.locator(`input[type='file'][accept='image/*'][id$="${faceSlotSuffixes[i]}"]`).setInputFiles(facePaths[i]);
    await wait(page);
  }
  await modal.getByText("Caras completas", { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });

  // REC-10: activar daño visible exige evidencia "Daño visible" con nota + confirmación.
  await modal.getByTestId("visible-damage-check").check(); await wait(page);
  const requiredAlert = modal.getByTestId("visible-damage-evidence-required").first();
  result.evidenceRequiredAlert = await requiredAlert.isVisible();
  if (!result.evidenceRequiredAlert) throw new Error("No apareció la alerta visible-damage-evidence-required al activar el daño visible");
  await modal.getByTestId("visible-damage-confirm").check(); await wait(page);
  result.blockedAfterConfirm = await requiredAlert.isVisible();
  if (!result.blockedAfterConfirm) throw new Error("La alerta de evidencia desapareció sin haber subido foto de daño visible");

  // Paso Cierre: el guardado completo debe bloquearse SOLO por daño visible. El orden de
  // validación del componente (L2609-2617) es: gate industrial PRIMERO y luego daño visible,
  // así que primero se llena la autorización de jefe para no enmascarar el mensaje de daño.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByTestId("industrial-override-by").first().fill("Jefe QA");
  await modal.getByTestId("industrial-override-reason").first().fill(`Aprobado por QA ${id}`);
  await wait(page);

  await modal.getByTestId("equipment-modal-save").click(); await wait(page);
  const validationMsg = await modal.getByTestId("equipment-modal-validation-message").innerText();
  result.saveBlockedWithMessage = /Daño visible reportado/i.test(validationMsg);
  if (!result.saveBlockedWithMessage) throw new Error(`Guardar no bloqueó por daño visible; mensaje: "${validationMsg.trim()}"`);
  result.saveDraftStillAllowed = await modal.getByTestId("equipment-modal-save-draft").isVisible();
  if (!result.saveDraftStillAllowed) throw new Error("El botón Guardar borrador no está disponible en Cierre con daño visible pendiente");

  // Volver a Evidencia: subir foto tipo "Daño visible" (última tarjeta) con nota → la alerta debe desaparecer.
  await modal.getByTestId("equipment-modal-previous").click(); await wait(page);
  await modal.getByTestId("evidence-files-input").setInputFiles(damagePath);
  const damageCard = modal.locator(".evidence-photo-card").last();
  await damageCard.waitFor({ state: "visible", timeout: 30000 });
  await selectCustomModal(page, damageCard.getByTestId("equipment-modal-evidence-type"), { label: "Daño visible" });
  await damageCard.locator(`input[placeholder='${NOTES_PLACEHOLDER}']`).fill("Golpe en esquina superior derecha");
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
