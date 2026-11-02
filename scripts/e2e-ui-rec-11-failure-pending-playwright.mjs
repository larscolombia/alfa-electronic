import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC11 ${id}`;
const wait = p => p.waitForTimeout(500);
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const faces = ["Cara frente", "Cara atrás", "Placa / serie"].map((label, i) => {
  const path = join(tmpdir(), `rec11-face-${i}-${id}.png`); // /tmp no existe en Windows
  writeFileSync(path, Buffer.from(PNG, "base64"));
  return { label, path };
});

const result = {
  case: "REC-11",
  login: false,
  badgeVisibleInClosure: false,
  advanceNotBlocked: false,
  saved: false,
  error: "",
};
let browser;

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
  // Familia es un <select> nativo (STANDARD_EQUIPMENT_FAMILIES), no el input libre antiguo.
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" }); await wait(page);
  for (const [placeholder, value] of [
    ["Marca del equipo", "Marca QA"],
    ["Tipo / referencia", "Tipo QA"],
    ["Serie o referencia visible", `SER-${id}`],
  ]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
  // REC-11: se omite a propósito la "Descripción de la falla" (failureDescription queda vacía).
  // Equipos → Evidencia directo: el paso "Preguntas" se eliminó del wizard y con él la UI de
  // switches; el badge de falla pendiente ahora solo existe en Cierre (aserción final).
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  await modal.getByText("Tomar fotos / subir evidencia").waitFor({ state: "visible" });
  result.advanceNotBlocked = true;
  await modal.getByTestId("evidence-files-input").setInputFiles(faces.map(f => f.path));
  await modal.locator(".evidence-photo-card").nth(2).waitFor({ state: "visible" }); await wait(page);
  const cards = modal.locator(".evidence-photo-card");
  for (let i = 0; i < faces.length; i++) await selectCustomModal(page, cards.nth(i).getByTestId("equipment-modal-evidence-type"), { label: faces[i].label });
  await wait(page);

  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByText("Resumen de la recepción").waitFor({ state: "visible" });
  await modal.getByTestId("failure-pending-badge").waitFor({ state: "visible" });
  result.badgeVisibleInClosure = /Falla pendiente/i.test(await modal.getByTestId("failure-pending-badge").innerText());

  // Gate industrial en Cierre (paso Preguntas eliminado): todo item exige autorización de jefe.
  await modal.getByTestId("industrial-override-by").first().fill("Jefe QA");
  await modal.getByTestId("industrial-override-reason").first().fill(`Aprobado por QA ${id}`);
  await wait(page);

  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;

  // El badge de falla pendiente solo existe en Cierre: el paso Preguntas se eliminó del wizard.
  if (!result.badgeVisibleInClosure || !result.saved) {
    throw new Error(`REC-11 incompleto: ${JSON.stringify(result)}`);
  }
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
