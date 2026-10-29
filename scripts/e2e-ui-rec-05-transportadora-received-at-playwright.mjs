import { chromium } from "playwright";
import { selectCustomModal, setCustomModalDateTime } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC05 ${id}`;
const wait = p => p.waitForTimeout(500);
const result = { case: "REC-05", login: false, alertVisible: false, nextBlocked: false, alertCleared: false, advanced: false, error: "" };
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
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec05-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
  await page.getByTestId("prospect-save-btn").click();
  const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);

  const modal = page.locator("app-crm-prospect-equipment-modal");
  await selectCustomModal(page, modal.getByTestId("equipment-modal-intake-method"), "transportadora"); await wait(page);
  await modal.locator("input[placeholder='Ej: Coordinadora']").fill("Transportadora QA");
  await modal.locator("input[placeholder='Número de guía']").fill(`GUIA-${id}`); await wait(page);

  // Ruta bloqueada: transportadora + guía sin fecha de recepción física
  result.alertVisible = await modal.getByTestId("intake-received-at-required").isVisible();
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const validationText = await modal.getByTestId("equipment-modal-validation-message").innerText();
  const stillOnReception = await modal.getByTestId("intake-received-at-required").isVisible();
  const onEquipmentStep = await modal.locator("[data-testid^='equipment-modal-registration-mode-']").first().isVisible().catch(() => false);
  result.nextBlocked = stillOnReception && /transportadora exige/i.test(validationText) && !onEquipmentStep;
  if (!result.alertVisible || !result.nextBlocked) throw new Error(`Ruta bloqueada falló: alert=${result.alertVisible} blocked=${result.nextBlocked} validation="${validationText}"`);

  // Ruta desbloqueada: llenar datetime-local y avanzar al paso Equipos
  await setCustomModalDateTime(page, modal.getByTestId("equipment-modal-intake-received-at"), "2026-10-26T09:30"); await wait(page);
  result.alertCleared = !(await modal.getByTestId("intake-received-at-required").isVisible().catch(() => false));
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  await modal.locator("[data-testid^='equipment-modal-registration-mode-']").first().waitFor({ state: "visible", timeout: 5000 });
  result.advanced = true;
  if (!result.alertCleared || !result.advanced) throw new Error(`Ruta desbloqueada falló: cleared=${result.alertCleared} advanced=${result.advanced}`);
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
