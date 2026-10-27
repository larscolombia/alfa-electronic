import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC12 ${id}`;
const wait = p => p.waitForTimeout(500);
const result = { case: "REC-12", login: false, warningVisible: false, advanceBlocked: false, blockMessage: "", ackUnblocks: false, warningInCierre: false, saved: false, error: "" };
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const FACE_LABELS = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];

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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec12-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Equipos: modo manual + datos del equipo.
  await modal.locator("select[data-testid^='equipment-modal-registration-mode-']").first().selectOption("manual");
  for (const [placeholder, value] of [["Familia libre", "Instrumento"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Multímetro"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // Paso Preguntas: >2M = Sí (evita gate REC-01); softwareIssueRuledOut queda en "No".
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.locator("input[id$='-costAboveTwoMillion']").check(); await wait(page);

  // REC-12: con software = "No" debe aparecer el warning de sospecha de software.
  const warning = modal.getByTestId("software-suspicion-warning").first();
  result.warningVisible = await warning.isVisible();
  if (!result.warningVisible) throw new Error("No apareció software-suspicion-warning con softwareIssueRuledOut = No");

  // Intentar avanzar sin el ack: bloqueado con mensaje y sin salir de Preguntas.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const blockMsg = modal.getByTestId("equipment-modal-validation-message");
  result.advanceBlocked = (await blockMsg.isVisible()) && /Posible falla de software/.test(await blockMsg.innerText());
  result.blockMessage = await blockMsg.innerText().catch(() => "");
  const evidenceInput = modal.locator("input[type='file'][accept='image/*']");
  if (!result.advanceBlocked || await evidenceInput.isVisible()) throw new Error(`Avance no bloqueado (blocked=${result.advanceBlocked}, evidenceVisible=${await evidenceInput.isVisible()})`);

  // Marcar ack "Cliente informado" → ya se puede avanzar a Evidencia.
  await modal.getByTestId("software-suspicion-ack").check(); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await evidenceInput.first().waitFor({ state: "attached", timeout: 10000 });
  result.ackUnblocks = true;

  // Paso Evidencia: 4 caras obligatorias.
  const facePaths = FACE_LABELS.map((_, i) => { const p = `/tmp/rec12-face-${i}-${id}.png`; writeFileSync(p, PNG_1X1); return p; });
  await modal.locator("input[type='file'][accept='image/*'][capture]").setInputFiles(facePaths);
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible", timeout: 30000 });
  const selects = modal.locator(".evidence-photo-card select.form-select");
  for (let i = 0; i < FACE_LABELS.length; i++) await selects.nth(i).selectOption({ label: FACE_LABELS[i] });
  await wait(page);

  // Paso Cierre: el warning persiste y el guardado completo tiene éxito.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  result.warningInCierre = await modal.getByTestId("software-suspicion-warning").first().isVisible();
  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
