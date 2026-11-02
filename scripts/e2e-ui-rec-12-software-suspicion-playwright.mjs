import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
// Windows: /tmp no existe → tmpdir() (patrón rec-04/rec-06).
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
// REC-12 (contrato post-retiro del gate de sospecha de software, commit 9ca92a3b):
// con costo > $2M el wizard debe avanzar DIRECTO a Evidencia sin warning ni ack.
// Entrada por recepción directa (layout actual): el modal se abre desde /app/work-equipment-reception.
const result = { case: "REC-12", login: false, warningGone: false, advanceDirect: false, goneInCierre: false, saved: false, error: "" };
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const facePaths = ["front", "back", "serial-plate"].map(face => join(tmpdir(), `rec12-${face}-${id}.png`));
for (const p of facePaths) writeFileSync(p, PNG_1X1);

try {
  browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com");
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234");
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;

  // El listado de prospectos ya no expone la acción "Asociar equipo"; el modal es el mismo
  // componente, abierto desde /app/work-equipment-reception (contrato rec-05/rec-13).
  await page.goto(`${base}/app/work-equipment-reception`, { waitUntil: "networkidle" });
  await page.getByTestId("work-equipment-create").click();
  const modal = page.locator("app-crm-prospect-equipment-modal");
  // El host es inline 0x0: esperar el botón next del footer, nunca visibility sobre el host.
  await page.getByTestId("equipment-modal-next").waitFor({ state: "visible", timeout: 15000 });

  // Paso Recepción con defaults válidos → avanzar a Equipos (contrato rec-13).
  await modal.getByTestId("equipment-modal-next").click();
  await modal.locator("[data-testid^='equipment-modal-family-']").first().waitFor({ state: "visible", timeout: 10000 });

  // Paso Equipos: familia por catálogo fijo + datos libres del equipo.
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" });
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tarjeta de control industrial"], ["Serie o referencia visible", `SER-REC12-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // Equipos → Evidencia directo: el paso "Preguntas" se eliminó del wizard (con él, los switches de costo/software).
  await modal.getByTestId("equipment-modal-next").click();

  // Aserción central REC-12: el gate de sospecha de software ya NO existe en la UI.
  result.warningGone = (await modal.getByTestId("software-suspicion-warning").count()) === 0;
  if (!result.warningGone) throw new Error("El gate de sospecha de software sigue presente en la UI (debería estar retirado)");
  const evidenceInput = modal.locator(`input[type='file'][accept='image/*'][id$="-face-front"]`);
  await evidenceInput.waitFor({ state: "attached", timeout: 10000 });
  result.advanceDirect = true;

  // Paso Evidencia (UI actual required-evidence-grid, contrato rec-13): un input por cara obligatoria.
  const faceSlotSuffixes = ["-face-front", "-face-back", "serial-plate"];
  for (let i = 0; i < facePaths.length; i += 1) {
    await modal.locator(`input[type='file'][accept='image/*'][id$="${faceSlotSuffixes[i]}"]`).setInputFiles(facePaths[i]);
  }
  await modal.getByText("Caras completas", { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });

  // Paso Cierre: sin warning (gate retirado) y guardado completo con éxito.
  await modal.getByTestId("equipment-modal-next").click();
  result.goneInCierre = (await modal.getByTestId("software-suspicion-warning").count()) === 0;
  if (!result.goneInCierre) throw new Error("El warning de sospecha de software reapareció en Cierre");

  // Gate industrial en Cierre (paso Preguntas eliminado): todo item exige autorización de jefe.
  await modal.getByTestId("industrial-override-by").first().fill("Jefe QA");
  await modal.getByTestId("industrial-override-reason").first().fill(`Aprobado por QA ${id}`);

  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
const ok = !result.error && result.warningGone === true && result.advanceDirect === true && result.goneInCierre === true && result.saved === true;
console.log(JSON.stringify(result)); process.exit(ok ? 0 : 1);
