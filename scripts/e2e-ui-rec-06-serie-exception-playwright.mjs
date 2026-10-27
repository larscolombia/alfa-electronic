import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC-06 ${id}`;
const wait = page => page.waitForTimeout(500);
const result = {
  case: "REC-06",
  login: false,
  exceptionInputVisible: false,
  blockedWithoutReason: false,
  reasonAccepted: false,
  serialPlateWarningVisible: false,
  blockedWithoutEvidence: false,
  saved: false,
  error: "",
};
let browser;

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const evidenceTypes = ["serial-plate", "face-front", "face-back", "face-left", "face-right"];
const typeLabels = {
  "serial-plate": "Placa / serie",
  "face-front": "Cara frente",
  "face-back": "Cara atrás",
  "face-left": "Cara izquierda",
  "face-right": "Cara derecha",
};

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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec06-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  await page.getByTestId("equipment-modal-next").click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");

  await modal.locator("select[data-testid^='equipment-modal-registration-mode-']").first().selectOption("manual");
  for (const [placeholder, value] of [["Familia libre", "Control"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  await modal.getByLabel(/Etiqueta rota o ilegible/i).check(); await wait(page);
  const reasonInput = modal.getByTestId("serie-exception-reason");
  result.exceptionInputVisible = await reasonInput.isVisible();

  // Ruta bloqueada: sin motivo no debe dejar el paso Equipos.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  result.blockedWithoutReason = (await modal.getByTestId("equipment-modal-validation-message").isVisible()) && /motivo de excepción/i.test(await modal.innerText());
  if (!result.exceptionInputVisible || !result.blockedWithoutReason) throw new Error(`La excepción de serie sin motivo no fue bloqueada: ${(await modal.innerText()).slice(-400)}`);

  await reasonInput.fill(`Placa borrada por humedad QA ${id}`); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  result.reasonAccepted = /Preguntas por equipo/.test(await modal.innerText());
  if (!result.reasonAccepted) throw new Error("Con motivo escrito no avanzó al paso Preguntas");

  // Evita el bloqueo del filtro industrial REC-01: costo nuevo > $2M = Sí.
  const costQuestion = modal.locator("div.border.rounded.p-3.bg-light-subtle", { hasText: /superior a/ }).first();
  await costQuestion.locator("input.form-check-input").check(); await wait(page);
  await modal.getByTestId("software-suspicion-ack").check(); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Ruta bloqueada en Evidencia: alerta serial-plate y Siguiente bloqueado.
  result.serialPlateWarningVisible = await modal.getByTestId("serial-plate-evidence-required").isVisible();
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  result.blockedWithoutEvidence = (await modal.getByTestId("equipment-modal-validation-message").isVisible()) && /Checklist de caras obligatorias/.test(await modal.innerText());
  if (!result.serialPlateWarningVisible || !result.blockedWithoutEvidence) throw new Error(`La evidencia sin placa/serie no quedó bloqueada. Texto modal: ${(await modal.innerText()).slice(0, 900)}`);

  // Ruta exitosa: foto placa/serie + 4 caras.
  const files = evidenceTypes.map((type) => {
    const path = `/tmp/rec06-${type}-${id}.png`;
    writeFileSync(path, png1x1);
    return path;
  });
  await modal.locator("input[capture='environment']").setInputFiles(files);
  await modal.locator(".evidence-photo-card").nth(4).waitFor({ state: "visible", timeout: 30000 });
  for (let i = 0; i < evidenceTypes.length; i++) {
    await modal.locator(".evidence-photo-card").nth(i).locator("select").selectOption({ label: typeLabels[evidenceTypes[i]] });
    await wait(page);
  }
  await modal.getByText("Caras completas").waitFor({ state: "visible", timeout: 10000 });
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  if (!/Resumen de la recepción/.test(await modal.innerText())) throw new Error("No avanzó al paso Cierre con la evidencia completa");

  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 30000 });
  result.saved = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
