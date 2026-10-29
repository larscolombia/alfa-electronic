import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const wait = p => p.waitForTimeout(500);
const result = { case: "REC-14", login: false, firstSaved: false, dialogVisible: false, dialogMessage: "", confirmedSaved: false, error: "" };
let browser;

const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const FACE_LABELS = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];
const DUP_IDENTIFIER = `SER-DUP-${id}`;

async function newProspectWithEquipment(page, suffix) {
  const name = `QA REC-14 ${suffix} ${id}`;
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${suffix} ${id}`], ["formCorreo", `rec14-${suffix}-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first();
  await row.waitFor({ state: "visible", timeout: 15000 }).catch(async () => {
    await page.reload({ waitUntil: "networkidle" });
    await row.waitFor({ state: "visible", timeout: 15000 });
  });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-registration-mode-']").first(), "manual");
  for (const [placeholder, value] of [["Familia libre", "Instrumento"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Multímetro"], ["Serie o referencia visible", `${DUP_IDENTIFIER}-${suffix}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.locator("input[id$='-costAboveTwoMillion']").check(); await wait(page);
  await modal.locator("input[id$='-softwareIssueRuledOut']").check(); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  // Identificador recibido: entrada manual (sin testid; placeholder fijo).
  await modal.locator("input[placeholder='QR, código de barras, serial o placa']").fill(DUP_IDENTIFIER); await wait(page);
  const facePaths = FACE_LABELS.map((label, i) => { const p = `/tmp/rec14-face-${i}-${id}.png`; writeFileSync(p, PNG_1X1); return p; });
  await modal.locator("input[type='file'][accept='image/*'][capture]").setInputFiles(facePaths);
  await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible", timeout: 30000 });
  for (let i = 0; i < FACE_LABELS.length; i++) await selectCustomModal(page, modal.locator(".evidence-photo-card").nth(i).getByTestId("equipment-modal-evidence-type"), { label: FACE_LABELS[i] });
  await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  return modal;
}

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;

  // (1) Prospecto A: mismo identificador, guardado completo exitoso.
  const modalA = await newProspectWithEquipment(page, "A");
  await modalA.getByTestId("equipment-modal-save").click();
  await modalA.waitFor({ state: "hidden", timeout: 60000 });
  result.firstSaved = true;

  // (2) Prospecto B: reutiliza el identificador → diálogo de duplicado → confirma reingreso.
  const modalB = await newProspectWithEquipment(page, "B");
  await modalB.getByTestId("equipment-modal-save").click();
  const dialog = page.getByTestId("duplicate-identifier-dialog");
  await dialog.waitFor({ state: "visible", timeout: 30000 });
  result.dialogVisible = true;
  result.dialogMessage = (await dialog.locator(".alert").first().innerText()).trim();
  if (!result.dialogMessage.toLowerCase().includes(DUP_IDENTIFIER.toLowerCase())) throw new Error(`El diálogo no menciona el identificador duplicado: "${result.dialogMessage}"`);
  await dialog.getByTestId("duplicate-relation-select").selectOption("reingreso"); await wait(page);
  await dialog.getByTestId("duplicate-reason-input").fill("Reingreso del mismo equipo por falla recurrente reportada por el cliente"); await wait(page);
  await dialog.getByTestId("duplicate-confirm-btn").click();
  await modalB.waitFor({ state: "hidden", timeout: 60000 });
  result.confirmedSaved = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
