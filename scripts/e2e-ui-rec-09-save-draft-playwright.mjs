// 2026-11-01: 'expect' NO existe en el paquete 'playwright' (solo @playwright/test);
// se usa polling manual de isEnabled(), patrón rec-06/t02.
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
  // Form actual (2026-11): compania + NIT obligatorio (^\d+-\d+$) habilitan el guardar; ya no existe formNombre.
  await page.locator("input[name='formCompania']").fill(name);
  await page.locator("#prospect-nit").fill(`900${id.slice(0, 6)}-7`);
  await page.locator("input[name='formCorreo']").fill(`rec09-${id}@alfa.local`);
  const saveProspectBtn = page.getByTestId("prospect-save-btn");
  await saveProspectBtn.waitFor({ state: "visible", timeout: 15000 });
  {
    const t0 = Date.now();
    while (!(await saveProspectBtn.isEnabled().catch(() => false)) && Date.now() - t0 < 15000) await page.waitForTimeout(250);
  }
  await saveProspectBtn.click();
  // Modal de duplicado (solo si se re-ejecuta con el mismo nombre): confirmar y continuar.
  const duplicateButton = page.getByRole("button", { name: /Crear de todos modos/i }).first();
  if (await duplicateButton.isVisible({ timeout: 4000 }).catch(() => false)) await duplicateButton.click();

  // Entrada al wizard (UI actual 2026-11): NO existe "Acciones → Asociar equipo" sobre filas.
  // La recepción se crea desde /app/work-equipment-reception y el prospecto creado se
  // asocia por la combobox Empresa del paso 1 (catálogo Clientes + Prospectos).
  await page.goto(`${base}/app/work-equipment-reception`, { waitUntil: "networkidle" });
  await page.getByTestId("work-equipment-create").click(); await wait(page);
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await modal.getByTestId("equipment-modal-cancel").waitFor({ state: "visible", timeout: 15000 });

  // Paso 1 (Empresa): seleccionar el prospecto recién creado vía combobox.
  await modal.locator("[data-testid='equipment-modal-company-search']").fill(name); await wait(page);
  await modal.locator(".company-dropdown-item", { hasText: name }).first().click(); await wait(page);
  await page.locator("text=Empresa seleccionada:").first().waitFor({ state: "visible", timeout: 15000 });

  // Paso 2 (Equipos): marca/tipo/serie libres bastan para el borrador.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);

  // Paso Equipos: desde 2026-11 "Ruta de registro" no existe (eliminada BD+UI): marca/tipo/serie siempre se diligencian libres.
  // Sin fotos en todo el flujo.
  // Familia pasó a select de catálogo (no bloquea el borrador): marca/tipo/serie libres bastan para hasItemContent.
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Multímetro"], ["Serie o referencia visible", serie]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

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
  // UI actual (sin tabla de filas): buscar por nombre, abrir su card → /app/crm-prospectos/:id.
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  const searchInput = page.locator("#prospects-search").first();
  await searchInput.waitFor({ state: "visible", timeout: 15000 });
  await searchInput.fill(name); await wait(page);
  const card = page.locator("[data-testid='prospect-search-results'] .list-group-item", { hasText: name }).first();
  await card.waitFor({ state: "visible", timeout: 15000 });
  await card.click(); await wait(page);
  await page.waitForURL(url => /\/app\/crm-prospectos\//.test(url.href)); await wait(page);
  // 2026-11-01: el tab declara role="tab" en plantilla; getByRole('button') nunca lo resuelve.
  await page.getByRole("tab", { name: /^Equipos$/ }).first().click(); await wait(page);
  await page.locator("td", { hasText: serie }).first().waitFor({ state: "visible", timeout: 15000 });
  result.draftPersisted = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
