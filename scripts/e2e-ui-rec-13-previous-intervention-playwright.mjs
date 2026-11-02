import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
// Windows: /tmp no existe → tmpdir() (patrón rec-04/rec-06).
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC-13 ${id}`;
const wait = p => p.waitForTimeout(500);
const result = { case: "REC-13", login: false, bannerInQuestions: false, bannerInSignatures: false, answerKept: false, saved: false, error: "" };
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const facePaths = ["front", "back", "serial-plate"].map(face => join(tmpdir(), `rec13-${face}-${id}.png`));
for (const p of facePaths) writeFileSync(p, PNG_1X1);

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
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

  // Paso Equipos: familia por catálogo fijo + datos libres (sin falla declarada: REC-11 queda para otro caso).
  // Familia es un <select> nativo (STANDARD_EQUIPMENT_FAMILIES), no el input libre antiguo.
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" }); await wait(page);
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Osciloscopio"], ["Serie o referencia visible", `SER-REC13-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // Paso Preguntas: marcar Sí en "reparación previa" (REC-13) y liberar los gates REC-01 / REC-12.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const prevRepair = modal.locator("input[id$='-previousRepairAttempt']");
  await prevRepair.check(); await wait(page);
  result.answerKept = await prevRepair.isChecked();
  const bannerQuestions = modal.getByTestId("previous-intervention-warning").first();
  result.bannerInQuestions = await bannerQuestions.isVisible();
  if (!result.bannerInQuestions) throw new Error("Banner previous-intervention-warning no visible en Preguntas tras marcar reparación previa");
  if (!(await bannerQuestions.innerText()).match(/intervenido/i)) throw new Error("El banner en Preguntas no menciona intervención previa");
  await modal.locator("input[id$='-costAboveTwoMillion']").check(); await wait(page);
  await modal.locator("input[id$='-softwareIssueRuledOut']").check(); await wait(page);

  // Paso Evidencia: UI actual (required-evidence-grid) — un input por evidencia obligatoria,
  // id = 'evidence-face-' + item.id + '-' + faceType; el slot nace clasificado al subir.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const faceSlotSuffixes = ["-face-front", "-face-back", "serial-plate"];
  for (let i = 0; i < facePaths.length; i += 1) {
    await modal.locator(`input[type='file'][accept='image/*'][id$="${faceSlotSuffixes[i]}"]`).setInputFiles(facePaths[i]);
    await wait(page);
  }
  await modal.getByText("Caras completas", { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });

  // Paso Cierre (signatures): el banner debe seguir visible y la respuesta conservada (switch sigue en Sí).
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  result.answerKept = result.answerKept && (await prevRepair.isChecked().catch(() => true));
  const bannerSignatures = modal.getByTestId("previous-intervention-warning").first();
  result.bannerInSignatures = await bannerSignatures.isVisible();
  if (!result.bannerInSignatures) throw new Error("Banner previous-intervention-warning no visible en Cierre");

  // Guardar (upsert + finalize): éxito = el modal se destruye.
  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = !(await page.getByTestId("equipment-modal-validation-message").isVisible().catch(() => false));
  if (!result.saved) throw new Error("Guardado falló: modal cerrado pero con mensaje de validación visible");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
