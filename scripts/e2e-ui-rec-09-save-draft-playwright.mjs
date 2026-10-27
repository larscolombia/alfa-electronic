import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC09 ${id}`;
const serie = `SER-${id}`;
const wait = p => p.waitForTimeout(500);
const result = {
  case: "REC-09",
  login: false,
  reachedClosureWithoutPhotos: false,
  fullSaveBlocked: false,
  offerVisible: false,
  messageMentionsFaces: false,
  draftSaved: false,
  modalOpenAfterDraft: false,
  modalClosedAfterCancel: false,
  draftPersisted: false,
  error: "",
};
let browser;

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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec09-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Equipos: modo manual + datos del equipo (sin fotos en todo el flujo).
  await modal.locator("select[data-testid^='equipment-modal-registration-mode-']").first().selectOption("manual");
  for (const [placeholder, value] of [["Familia libre", "Instrumento"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Multímetro"], ["Serie o referencia visible", serie]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

  // Paso Preguntas: costo > 2M = Sí (libera gate REC-01) y software descartado = Sí.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.locator("input[id$='-costAboveTwoMillion']").check(); await wait(page);
  await modal.locator("input[id$='-softwareIssueRuledOut']").check(); await wait(page);

  // Paso Evidencia: SIN subir ninguna foto. Con la regla REC-09 el aviso no bloquea el avance.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Cierre: el botón de borrador solo existe aquí; llegamos sin fotos.
  const saveDraftBtn = modal.getByTestId("equipment-modal-save-draft");
  await saveDraftBtn.waitFor({ state: "visible", timeout: 15000 });
  result.reachedClosureWithoutPhotos = true;

  // Guardar completo debe bloquearse por caras faltantes (oferta de borrador o mensaje).
  await modal.getByTestId("equipment-modal-save").click(); await wait(page);
  const offer = modal.getByTestId("finalize-faces-missing-offer");
  result.offerVisible = await offer.isVisible().catch(() => false);
  const validationText = await modal.getByTestId("equipment-modal-validation-message").innerText().catch(() => "");
  result.messageMentionsFaces = /cara/i.test(validationText);
  result.fullSaveBlocked = (result.offerVisible || result.messageMentionsFaces) && (await modal.count()) === 1;
  if (!result.fullSaveBlocked) throw new Error(`Guardar completo no se bloqueó por caras faltantes (offer=${result.offerVisible}, msg="${validationText}")`);

  // Guardar borrador: solo upsert, alerta de éxito y el modal sigue abierto.
  await saveDraftBtn.click(); await wait(page);
  await modal.getByTestId("save-draft-success").waitFor({ state: "visible", timeout: 15000 });
  result.draftSaved = true;
  result.modalOpenAfterDraft = (await modal.count()) === 1;
  if (!result.modalOpenAfterDraft) throw new Error("El modal se cerró al guardar el borrador; se esperaba que siguiera abierto");

  // Cerrar el modal con Cancelar: el host se destruye sin error.
  await modal.getByTestId("equipment-modal-cancel").click();
  await modal.waitFor({ state: "hidden", timeout: 15000 });
  result.modalClosedAfterCancel = true;

  // Persistencia: reabrir la ficha del prospecto y verificar el equipo en la pestaña Equipos.
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  const rowAgain = page.locator("tbody tr", { hasText: name }).first(); await rowAgain.waitFor({ state: "visible" });
  await rowAgain.getByRole("button", { name: /^Acciones$/ }).click();
  await rowAgain.getByRole("link", { name: /Abrir ficha/i }).click();
  await page.waitForURL(url => /\/app\/crm-prospectos\//.test(url.href)); await wait(page);
  await page.getByRole("button", { name: /^Equipos$/ }).click(); await wait(page);
  await page.locator("td", { hasText: serie }).first().waitFor({ state: "visible", timeout: 15000 });
  result.draftPersisted = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
