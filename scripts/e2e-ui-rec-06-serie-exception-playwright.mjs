import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
// Screenshot opcional del chip de warning para revisar el layout de la frase larga.
const chipShotPath = process.env.PW_CHIP_SHOT_PATH || join(tmpdir(), `rec06-chip-${id}.png`);
const wait = page => page.waitForTimeout(500);
const result = {
  case: "REC-06",
  login: false,
  checkboxLabelExact: false,
  checkboxChecked: false,
  warningChipVisible: false,
  promptLabelExact: false,
  exactErrorPhrase: false,
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

  // Entrada por recepción directa: el listado de prospectos ya no expone filas ni la acción "Asociar equipo"
  // (layout actual = buscador + resultados card). El modal es exactamente el mismo componente, alimentado
  // desde /app/work-equipment-reception con el prospecto sintético WORK_DIRECT_PROSPECT.
  await page.goto(`${base}/app/work-equipment-reception`, { waitUntil: "networkidle" });
  await page.getByTestId("work-equipment-create").click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  // El host <app-...> es inline 0x0: esperar visibility sobre el host puede dar falso negativo
  // (patrón probado en check-work-equipment-single-add: esperar el botón next del footer, que solo existe con el modal abierto).
  await page.getByTestId("equipment-modal-next").waitFor({ state: "visible", timeout: 15000 });

  // Paso Recepción (intakeMethod=personal por defecto, sin bloqueos) → paso Equipos.
  await page.getByTestId("equipment-modal-next").click(); await wait(page);

  // Ruta de registro manual libera los inputs Marca/Tipo/Serie (en el modo catálogo quedan readonly).
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-registration-mode-']").first(), "manual");
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // El checkbox debe existir con la etiqueta nueva EXACTA (una sola ocurrencia en el modal).
  const labelIssueBox = modal.getByLabel(/^Equipo con Etiqueta rota, ilegible o sin etiqueta$/i);
  result.checkboxLabelExact = (await labelIssueBox.count()) === 1;
  if (!result.checkboxLabelExact) throw new Error(`El checkbox "Equipo con Etiqueta rota, ilegible o sin etiqueta" no se encontró exactamente: ${JSON.stringify(await modal.locator("label.form-check-label").allInnerTexts()).slice(0, 600)}`);
  await labelIssueBox.check(); await wait(page);
  result.checkboxChecked = await labelIssueBox.isChecked();

  // Chip de warning del ítem debe mostrar la misma nomenclatura nueva.
  const labelChip = modal.locator(".equipment-warning-list .warning-chip", { hasText: /^Equipo con Etiqueta rota, ilegible o sin etiqueta$/i });
  // isVisible() NO espera: responde según el instante exacto y bajo headless:false + slowMo el
  // re-render de Angular del chip puede estar unos ms por detrás. waitFor({state:'visible'}) sí sondea.
  result.warningChipVisible = await labelChip.first().waitFor({ state: "visible", timeout: 15000 }).then(() => true, () => false);
  if (result.warningChipVisible) await modal.screenshot({ path: chipShotPath }).catch(() => {});

  // El prompt del motivo de excepción debe usar la nomenclatura nueva.
  const modalTextBeforeReason = await modal.innerText();
  result.promptLabelExact = /Motivo de excepción \(equipo con etiqueta rota, ilegible o sin etiqueta\)/i.test(modalTextBeforeReason);

  const reasonInput = modal.getByTestId("serie-exception-reason");
  result.exceptionInputVisible = await reasonInput.isVisible();

  // Ruta bloqueada: sin motivo no debe dejar el paso Equipos; el error debe citar la nomenclatura nueva.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const blockedText = await modal.innerText();
  result.exactErrorPhrase = /Equipo con Etiqueta rota, ilegible o sin etiqueta/i.test(blockedText);
  result.blockedWithoutReason = (await modal.getByTestId("equipment-modal-validation-message").isVisible()) && /motivo de excepción/i.test(blockedText) && result.exactErrorPhrase;
  if (!result.checkboxLabelExact || !result.checkboxChecked || !result.warningChipVisible || !result.promptLabelExact || !result.exceptionInputVisible || !result.blockedWithoutReason) throw new Error(`La excepción de serie sin motivo no fue bloqueada con la nomenclatura nueva: ${blockedText.slice(-400)}`);

  await reasonInput.fill(`Placa borrada por humedad QA ${id}`); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  result.reasonAccepted = /Preguntas por equipo/.test(await modal.innerText());
  if (!result.reasonAccepted) throw new Error("Con motivo escrito no avanzó al paso Preguntas");

  // Evita el bloqueo del filtro industrial REC-01: costo nuevo > $2M = Sí libera requiresIndustrialOverride() (no hay más ack en la UI actual).
  const costQuestion = modal.locator("div.border.rounded.p-3.bg-light-subtle", { hasText: /superior a/ }).first();
  await costQuestion.locator("input.form-check-input").check(); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Ruta bloqueada en Evidencia: alerta serial-plate y Siguiente bloqueado.
  result.serialPlateWarningVisible = await modal.getByTestId("serial-plate-evidence-required").isVisible();
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  // La app bloquea con SERIAL_PLATE_EVIDENCE_ERROR ("Placa o serie ilegible: registra el motivo..."); la frase "Checklist..." no existe en el código.
  result.blockedWithoutEvidence = (await modal.getByTestId("equipment-modal-validation-message").isVisible()) && /placa o serie ilegible/i.test(await modal.innerText());
  if (!result.serialPlateWarningVisible || !result.blockedWithoutEvidence) throw new Error(`La evidencia sin placa/serie no quedó bloqueada. Texto modal: ${(await modal.innerText()).slice(0, 900)}`);

  // Ruta exitosa: foto placa/serie + 4 caras.
  const files = evidenceTypes.map((type) => {
    const path = join(tmpdir(), `rec06-${type}-${id}.png`);
    writeFileSync(path, png1x1);
    return path;
  });
  // input[capture=...] coincide también con los 4 slots de cara (strict-mode violation): usar el multi-input único.
  await modal.getByTestId("evidence-files-input").setInputFiles(files);
  await modal.locator(".evidence-photo-card").nth(4).waitFor({ state: "visible", timeout: 30000 });
  for (let i = 0; i < evidenceTypes.length; i++) {
    await selectCustomModal(page, modal.locator(".evidence-photo-card").nth(i).getByTestId("equipment-modal-evidence-type"), { label: typeLabels[evidenceTypes[i]] });
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
