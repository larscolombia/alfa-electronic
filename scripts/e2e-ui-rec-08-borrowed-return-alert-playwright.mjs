import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
// Windows: /tmp no existe → tmpdir() (patrón rec-04/rec-06).
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC08 ${id}`;
const wait = p => p.waitForTimeout(500);
const result = { case: "REC-08", login: false, borrowedCode: "", codeFormatOk: false, removeWorks: false, badgeVisible: false, badgeHasCode: false, saved: false, error: "" };
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const facePaths = ["front", "back", "serial-plate"].map(face => join(tmpdir(), `rec08-${face}-${id}.png`));
for (const p of facePaths) writeFileSync(p, PNG_1X1);

// Aligned with the rest of the REC battery (v39): respect PW_HEADLESS / PW_SLOW_MO_MS so we can run
// in visible mode with 400ms between interactions for user review.
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
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Multímetro"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // REC-08: préstamo anclado con código BLD-XXXXXXXX.
  // La sección de préstamos vive dentro de *ngIf="expanded" (accessorios > 0 O préstamos > 0):
  // en un equipo nuevo el <details> NO existe en DOM, así que primero se materializa agregando
  // UN accesorio (patrón probado por REC-06 verde), se abre el summary y recién ahí el botón
  // Agregar de préstamos es alcanzable. El accesorio se retira al final para no disparar la
  // evidencia obligatoria de accesorios; el préstamo persiste porque `expanded` también lo cubre.
  const accDraft = modal.locator("input[id^='accessory-draft-']").first();
  await accDraft.fill("Cable USB de referencia"); await wait(page);
  await modal.getByTestId("equipment-modal-add-accessory-0").click(); await wait(page);
  // El <details> nace cerrado con entries.length === 0 → abrirlo por el summary.
  const borrowedSummary = modal.locator("app-crm-equipment-borrowed-list summary");
  if (!(await borrowedSummary.evaluate(el => el.parentElement.open))) await borrowedSummary.click();
  await wait(page);
  // Agregar dos entradas de préstamo y quitar la segunda (add/remove works).
  const borrowedRows = modal.locator("app-crm-equipment-borrowed-list .borrowed-equipment-repeater input[placeholder^='Ej.: Parlante']");
  await modal.getByTestId("equipment-modal-add-borrowed-0").click(); await wait(page);
  await modal.getByTestId("equipment-modal-add-borrowed-0").click(); await wait(page);
  if ((await borrowedRows.count()) !== 2) throw new Error(`Agregar no dejó 2 filas de préstamo: count=${await borrowedRows.count()}`);
  await modal.getByTestId("equipment-modal-remove-borrowed-0-1").click(); await wait(page);
  result.removeWorks = (await borrowedRows.count()) === 1;
  if (!result.removeWorks) throw new Error(`El botón Quitar del préstamo no eliminó la fila: count=${await borrowedRows.count()}`);
  // Describir la entrada restante y leer SU código BLD. El span de índice de accesorio también es
  // .input-group-text; el del préstamo se distingue por [title='Código de préstamo ...'] (componente
  // crm-equipment-borrowed-list, plantilla).
  await borrowedRows.first().fill("Parlante activo de referencia"); await wait(page);
  const codeText = (await modal.locator("app-crm-equipment-borrowed-list .input-group-text[title*='Código de préstamo']").first().innerText()).trim();
  result.borrowedCode = codeText;
  result.codeFormatOk = /^BLD-[A-Z2-9]{8}$/.test(codeText);
  if (!result.codeFormatOk) throw new Error(`Código de préstamo inválido: "${codeText}"`);
  if (!result.removeWorks) throw new Error("El botón Quitar del préstamo no eliminó la fila");

  // Quitar el accesorio temporal: sin él no se dispara la evidencia obligatoria de accesorios
  // (contrato REC-06); expanded sigue true por el préstamo, la sección permanece visible.
  await modal.getByTestId("equipment-modal-remove-accessory-0-0").click(); await wait(page);

  // Equipos → Evidencia directo: el paso "Preguntas" se eliminó del wizard (UN solo next).
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Evidencia (patrón verde REC-01/REC-04): un input file oculto por cara obligatoria;
  // al subir, handleRequiredFaceEvidenceSelected fija photo.evidenceType — sin clasificar.
  const faceSlotSuffixes = ["-face-front", "-face-back", "serial-plate"];
  for (let i = 0; i < facePaths.length; i += 1) {
    await modal.locator(`input[type='file'][accept='image/*'][id$="${faceSlotSuffixes[i]}"]`).setInputFiles(facePaths[i]);
    await wait(page);
  }
  // El badge del resumen de tarjeta dice "Caras completas" cuando hasRequiredFaceEvidence(item).
  await modal.getByText("Caras completas", { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });

  // Paso Cierre: badge de préstamo pendiente de devolución con el código.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const badge = modal.getByTestId("borrowed-return-alert").first();
  result.badgeVisible = await badge.isVisible();
  result.badgeHasCode = result.badgeVisible && (await badge.innerText()).includes(result.borrowedCode);
  if (!result.badgeVisible || !result.badgeHasCode) throw new Error(`Badge de préstamo no visible o sin código (visible=${result.badgeVisible}, hasCode=${result.badgeHasCode})`);

  // Gate industrial en Cierre (paso Preguntas eliminado): todo item exige autorización de jefe.
  await modal.getByTestId("industrial-override-by").first().fill("Jefe QA");
  await modal.getByTestId("industrial-override-reason").first().fill(`Aprobado por QA ${id}`);
  await wait(page);

  // Guardar (upsert + finalize): éxito = el modal se cierra sin mensaje de validación.
  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = !(await page.getByTestId("equipment-modal-validation-message").isVisible().catch(() => false));
  if (!result.saved) throw new Error("Guardado falló: modal cerrado pero con mensaje de validación visible");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
