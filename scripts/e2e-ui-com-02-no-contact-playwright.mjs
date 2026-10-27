/** COM-02 UI-only: un lead sin contacto no puede guardar seguimiento. */
import { chromium } from "playwright";
const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const stamp = Date.now(), id = String(stamp).slice(-8), name = `QA Sin Contacto ${id}`;
const out = { case: "COM-02", frontendOnly: true, login: false, prospectCreated: false, blocked: false, error: "" };
let browser;
const pause = (p) => p.waitForTimeout(500);
try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const p = await (await browser.newContext({ viewport: { width: 1540, height: 980 } })).newPage();
  await p.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await p.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await pause(p);
  await p.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await pause(p);
  await p.locator("form.auth-form button[type='submit']").click(); await pause(p);
  await p.waitForURL((u) => u.href.includes("/app")); out.login = true;
  await p.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: /Agregar Prospecto/i }).click(); await pause(p);
  for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `sin-contacto-${id}@alfa.local`]]) {
    await p.locator(`input[name='${field}']`).fill(value); await pause(p);
  }
  await p.getByTestId("prospect-save-btn").click(); await pause(p);
  const row = p.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" }); out.prospectCreated = true;
  await row.getByRole("button", { name: /^Acciones$/ }).click(); await pause(p);
  await p.locator("ul.dropdown-menu.show a", { hasText: "Abrir ficha" }).click();
  await p.waitForURL(/\/app\/crm-prospectos\//);
  await p.getByRole("button", { name: "Acciones comerciales" }).click(); await pause(p);
  await p.getByRole("button", { name: /Nueva accion comercial/i }).click(); await pause(p);
  const modal = p.locator(".modal-dialog", { hasText: "Agregar Seguimiento" });
  await modal.locator("select.form-select").nth(1).selectOption({ index: 1 }); await pause(p);
  await modal.locator("input[type='date']").fill(new Date(Date.now() + 86400000).toISOString().slice(0,10)); await pause(p);
  await modal.locator("input[type='time']").fill("10:30"); await pause(p);
  await modal.getByTestId("commercial-action-save-btn").click(); await pause(p);
  const error = modal.getByText("Selecciona un contacto relacionado para la accion comercial.", { exact: true });
  out.blocked = await error.isVisible({ timeout: 10000 }).catch(() => false);
  if (!out.blocked) throw new Error("COM-02 no bloqueó ni explicó la ausencia de contacto relacionado.");
} catch (e) { out.error = String(e?.stack || e); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(out)); process.exit(out.error ? 1 : 0);
