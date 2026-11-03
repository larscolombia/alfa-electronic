import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const wait = page => page.waitForTimeout(500);
// 2026-11-01 — REC-06 reescrito: el flujo "Motivo de excepción" (check de etiqueta + input de motivo)
// se RETIRÓ de la UI por decisión del usuario. Esta prueba ahora cubre:
//   1. celda ACCESORIOS RECIBIDOS CON EL EQUIPO (add/edit/remove, botón y Enter),
//   2. sección "Elementos prestados para prueba" operativa,
//   3. T12: el ÚNICO checkbox "equipo con etiqueta roja, ilegible o sin etiqueta" existe junto a Serie,
//      activa/desactiva (ligado a identifierLabelIssue) y NO trae sección ni input de motivo,
//   4. override industrial por costo, evidencia obligatoria FRENTE/ATRÁS/PLACA y guardado completo.
const result = {
  case: "REC-06",
  login: false,
  accessoryCellPresent: false,
  accessoryBtnDisabledWhenEmpty: false,
  accessoryBtnEnabledWithText: false,
  accessoryAddedViaButton: false,
  accessoryAddedViaEnter: false,
  accessoryInlineEditWorks: false,
  accessoryRemoveSecond: false,
  accessoryCollapsedWhenEmpty: false,
  reExpandedAfterAdd: false,
  finalCollapsedEmpty: false,
  borrowedAddRemoveWorks: false,
  labelIssueCheckSinglePresent: false,
  labelIssueToggleWorks: true,
  exceptionSectionStillAbsent: false,
  advancedToQuestions: false,
  serialPlateEvidenceStillRequired: true,
  saved: false,
  error: "",
};
let browser;

const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
const evidenceTypes = ["serial-plate", "face-front", "face-back"];
const typeLabels = {
  "serial-plate": "Placa / serie",
  "face-front": "Cara frente",
  "face-back": "Cara atrás",
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

  // Desde 2026-11-01 no hay modo de registro: Familia por catálogo fijo y Marca/Tipo/Serie siempre libres.
  await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" });
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // Celda ACCESORIOS RECIBIDOS CON EL EQUIPO (input libre + boton AGREGAR). Cada accesorio
  // queda como fila editable inline; se prueba add por boton y Enter, edit inline y quitar.
  // La lista se deja VACIA al final para no disparar ACCESSORIES_EVIDENCE_ERROR en Evidencia.
  const accessoryHeading = modal.getByText("Accesorios recibidos con el equipo", { exact: true });
  result.accessoryCellPresent = (await accessoryHeading.count()) === 1 && (await modal.locator("input[id^='accessory-draft-']").first().isVisible());
  if (!result.accessoryCellPresent) throw new Error(`Falta la celda "Accesorios recibidos con el equipo" en el paso Equipos: titulo=${await accessoryHeading.count()}`);

  const accDraft = modal.locator("input[id^='accessory-draft-']").first();
  const accAdd = modal.getByTestId("equipment-modal-add-accessory-0");
  result.accessoryBtnDisabledWhenEmpty = await accAdd.isDisabled();
  if (!result.accessoryBtnDisabledWhenEmpty) throw new Error(`El boton Agregar deberia estar disabled con el input vacio`);

  // Add por boton: fila editable registrada y draft vaciado.
  await accDraft.fill("Cable USB"); await wait(page);
  result.accessoryBtnEnabledWithText = !(await accAdd.isDisabled());
  if (!result.accessoryBtnEnabledWithText) throw new Error(`El boton Agregar deberia habilitarse al escribir texto`);
  await accAdd.click(); await wait(page);
  const accRowByValue = (n, value) => modal.locator(`input[aria-label='Accesorio ${n}: ${value}']`).first();
  result.accessoryAddedViaButton = (await accRowByValue(1, "Cable USB").isVisible()) && (await accDraft.inputValue()) === "";
  if (!result.accessoryAddedViaButton) throw new Error(`Agregar por boton no registro la fila o no vacio el draft: filas=${await modal.locator("input[aria-label^='Accesorio ']").count()}, draft='${await accDraft.inputValue()}'`);

  // Add por Enter: segundo accesorio.
  await accDraft.fill("Cargador original");
  await accDraft.press("Enter"); await wait(page);
  result.accessoryAddedViaEnter = (await modal.locator("input[aria-label^='Accesorio ']").count()) === 2 && (await accRowByValue(2, "Cargador original").isVisible());
  if (!result.accessoryAddedViaEnter) throw new Error(`Agregar con Enter no dejo exactamente 2 filas: count=${await modal.locator("input[aria-label^='Accesorio ']").count()}`);

  // Editar inline el primer accesorio.
  await accRowByValue(1, "Cable USB").fill("Cable HDMI (editado)"); await wait(page);
  result.accessoryInlineEditWorks = (await modal.locator(`input[aria-label='Accesorio 1: Cable HDMI (editado)']`).count()) === 1 && (await accRowByValue(1, "Cable USB").count()) === 0;
  if (!result.accessoryInlineEditWorks) throw new Error(`Editar inline no actualizo el valor del primer accesorio`);

  // Quitar el segundo -> queda solo uno.
  await modal.getByTestId("equipment-modal-remove-accessory-0-1").click(); await wait(page);
  result.accessoryRemoveSecond = (await modal.locator("input[aria-label^='Accesorio ']").count()) === 1;
  if (!result.accessoryRemoveSecond) throw new Error(`Quitar el segundo accesorio no dejo 1 fila: count=${await modal.locator("input[aria-label^='Accesorio ']").count()}`);

  // Quitar el ultimo -> la seccion colapsa (simplificación visual, 2026-11-02):
  // sin estado vacío "Sin accesorios registrados." y sin sección de préstamos.
  await modal.getByTestId("equipment-modal-remove-accessory-0-0").click(); await wait(page);
  result.accessoryCollapsedWhenEmpty =
    (await modal.locator("input[aria-label^='Accesorio ']").count()) === 0 &&
    (await modal.getByText("Sin accesorios registrados.", { exact: true }).count()) === 0 &&
    !(await modal.getByText("¿El cliente prestó algo para la prueba?").first().isVisible());
  if (!result.accessoryCollapsedWhenEmpty) throw new Error(`Quitar el ultimo accesorio no colapsó la seccion (estado vacio o préstamos visibles)`);

  // Re-agregar un accesorio -> vuelve a expandirse: fila editable + sección de préstamos.
  await accDraft.fill("Cargador original"); await wait(page);
  await accAdd.click(); await wait(page);
  result.reExpandedAfterAdd =
    (await modal.locator("input[aria-label^='Accesorio ']").count()) === 1 &&
    (await modal.getByText("¿El cliente prestó algo para la prueba?").first().isVisible());
  if (!result.reExpandedAfterAdd) throw new Error(`La seccion no volvió a expandirse al re-agregar un accesorio`);

  // La seccion "Elementos prestados para prueba" sigue operativa:
  // abrir details -> Agregar una entrada -> fila editable -> quitarla -> lista vacia.
  const borrowedSummary = modal.getByText("¿El cliente prestó algo para la prueba?").first();
  await borrowedSummary.click(); await wait(page);
  await modal.getByTestId("equipment-modal-add-borrowed-0").click(); await wait(page);
  // Locales acotados a <details>: hay 1 fila de accesorio fuera que no debe contar.
  const borrowedRows = modal.locator("details.borrowed-equipment-repeater .input-group.input-group-sm");
  result.borrowedAddRemoveWorks = (await borrowedRows.count()) === 1 && (await borrowedRows.nth(0).locator("input.form-control").first().isVisible());
  if (!result.borrowedAddRemoveWorks) throw new Error(`Agregar una entrada de "Elementos prestados" no dejo una fila editable: count=${await borrowedRows.count()}`);
  await modal.getByTestId("equipment-modal-remove-borrowed-0-0").click(); await wait(page);
  result.borrowedAddRemoveWorks = (await borrowedRows.count()) === 0;

  // Cierre del ciclo: quitar el ultimo accesorio -> la seccion colapsa otra vez.
  // IMPORTANTE (contrato de Evidencia): la celda debe quedar VACIA al final; un accesorio
  // registrado dispara evidencia adicional y bloquearia el avance a Resumen de la recepción.
  await modal.getByTestId("equipment-modal-remove-accessory-0-0").click(); await wait(page);
  result.finalCollapsedEmpty =
    (await modal.locator("input[aria-label^='Accesorio ']").count()) === 0 &&
    !(await modal.getByText("¿El cliente prestó algo para la prueba?").first().isVisible());
  if (!result.finalCollapsedEmpty) throw new Error(`Al final la celda no quedo vacia/colapsada`);

  // T12 (2026-11-02): el paso Equipos conserva ÚNICO un checkbox de etiqueta junto al campo Serie,
  // sin sección propia ni input de motivo. Se valida: existe exactamente una vez (un solo item
  // en esta recepción), se activa y desactiva, y la caja "Motivo de excepción" sigue inexistente.
  const equipmentStepText = await modal.innerText();
  const labelCheck = modal.getByTestId("equipment-modal-label-issue");
  result.labelIssueCheckSinglePresent =
    (await labelCheck.count()) === 1 &&
    (await modal.locator("label", { hasText: /equipo con etiqueta roja, ilegible o sin etiqueta/i }).count()) >= 1;
  if (!result.labelIssueCheckSinglePresent) throw new Error(`El checkbox unico de etiqueta falta o esta duplicado en el paso Equipos: count=${await labelCheck.count()}`);

  await labelCheck.check(); await wait(page);
  result.labelIssueToggleWorks = (await labelCheck.isChecked()) === true;
  await labelCheck.uncheck(); await wait(page);
  if (!result.labelIssueToggleWorks || (await labelCheck.isChecked())) throw new Error(`El checkbox de etiqueta no activa/desactiva correctamente`);

  result.exceptionSectionStillAbsent =
    !/Motivo de excepción/i.test(equipmentStepText) &&
    (await modal.getByTestId("serie-exception-reason").count()) === 0;
  if (!result.exceptionSectionStillAbsent) throw new Error(`La caja "Motivo de excepción" reaparecio en el paso Equipos`);

  // El gate de motivo desapareció y el paso "Preguntas" se eliminó: Siguiente debe avanzar directo a Evidencia.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  result.advancedToQuestions = /Evidencia|Fotos obligatorias/i.test(await modal.innerText());
  if (!result.advancedToQuestions) throw new Error(`Sin el gate de motivo no avanzó al paso Evidencia. Texto: ${(await modal.innerText()).slice(-400)}`);

  // Evidencia: la foto tipo "Placa / serie" sigue siendo OBLIGATORIA para todo equipo (cara requerida),
  // igual que FRENTE y ATRÁS. Subir las 3 caras y avanzar al cierre.
  const files = evidenceTypes.map((type) => {
    const path = join(tmpdir(), `rec06-${type}-${id}.png`);
    writeFileSync(path, png1x1);
    return path;
  });
  // input[capture=...] coincide también con los 4 slots de cara (strict-mode violation): usar el multi-input único.
  await modal.getByTestId("evidence-files-input").setInputFiles(files);
  await modal.locator(".evidence-photo-card").nth(2).waitFor({ state: "visible", timeout: 30000 });
  for (let i = 0; i < evidenceTypes.length; i++) {
    await selectCustomModal(page, modal.locator(".evidence-photo-card").nth(i).getByTestId("equipment-modal-evidence-type"), { label: typeLabels[evidenceTypes[i]] });
    await wait(page);
  }
  await modal.getByText("Caras completas").waitFor({ state: "visible", timeout: 10000 });
  result.serialPlateEvidenceStillRequired = /Placa \/ serie/.test(await modal.innerText());
  if (!result.serialPlateEvidenceStillRequired) throw new Error(`La evidencia obligatoria "Placa / serie" ya no aparece como cara requerida`);

  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  if (!/Resumen de la recepción/.test(await modal.innerText())) throw new Error("No avanzó al paso Cierre con la evidencia completa");

  // Gate industrial en Cierre (paso Preguntas eliminado): todo item exige autorización de jefe.
  await modal.getByTestId("industrial-override-by").first().fill("Jefe QA");
  await modal.getByTestId("industrial-override-reason").first().fill(`Aprobado por QA ${id}`);
  await wait(page);

  await modal.getByTestId("equipment-modal-save").click();
  await modal.waitFor({ state: "hidden", timeout: 30000 });
  result.saved = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
