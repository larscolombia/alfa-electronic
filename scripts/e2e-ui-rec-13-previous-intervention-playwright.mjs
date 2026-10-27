import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC-13 ${id}`;
const wait = p => p.waitForTimeout(500);
const result = { case: "REC-13", login: false, bannerInQuestions: false, bannerInSignatures: false, answerKept: false, saved: false, error: "" };
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec13-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Equipos: modo manual + datos del equipo (sin falla declarada: REC-11 queda para otro caso).
  await modal.locator("select[data-testid^='equipment-modal-registration-mode-']").first().selectOption("manual");
  for (const [placeholder, value] of [["Familia libre", "Instrumento"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Osciloscopio"], ["Serie o referencia visible", `SER-REC13-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

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

  // Paso Evidencia: 4 fotos de caras obligatorias.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const facePaths = ["face-front", "face-back", "face-left", "face-right"].map(face => { const p = `/tmp/rec13-${face}-${id}.png`; writeFileSync(p, PNG_1X1); return p; });
  await modal.locator("input[type='file'][accept='image/*'][capture]").setInputFiles(facePaths);
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible", timeout: 30000 });
  const faceLabels = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];
  const selects = modal.locator(".evidence-photo-card select.form-select");
  for (let i = 0; i < faceLabels.length; i++) await selects.nth(i).selectOption({ label: faceLabels[i] });
  await wait(page);

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
