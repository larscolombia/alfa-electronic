/** COM-01 UI-only: advertir duplicado, cancelar y continuar explícitamente. */
import { chromium } from "playwright";
const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const stamp = Date.now(), suffix = String(stamp).slice(-8);
const a = `QA Dup A ${suffix}`, b = `QA Dup B ${suffix}`, email = `dup-${suffix}@alfa.local`;
const r = { case: "COM-01", frontendOnly: true, login: false, warning: false, cancelKeepsForm: false, explicitCreate: false, error: "" };
let browser;
const wait = (p) => p.waitForTimeout(500);
async function fill(p, name, value) { await p.locator(`input[name='${name}']`).fill(value); await wait(p); }
async function create(p, name, company) {
  await p.getByRole("button", { name: /Agregar Prospecto/i }).click(); await wait(p);
  await fill(p, "formNombre", name); await fill(p, "formCorreo", email); await fill(p, "formCompania", company);
  await p.getByTestId("prospect-save-btn").click(); await wait(p);
}
try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const p = await (await browser.newContext()).newPage();
  await p.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await p.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(p);
  await p.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(p);
  await p.locator("form.auth-form button[type='submit']").click(); await wait(p);
  await p.waitForURL((u) => u.href.includes("/app")); r.login = true;
  await p.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  await create(p, a, `Empresa ${suffix}`);
  await p.locator("tbody tr", { hasText: a }).waitFor({ state: "visible" });
  await create(p, b, `Empresa ${suffix} Norte`);
  const modal = p.locator(".modal", { hasText: "Posible duplicado detectado" });
  await modal.waitFor({ state: "visible" }); r.warning = true;
  await modal.getByRole("button", { name: "Cancelar", exact: true }).click(); await wait(p);
  r.cancelKeepsForm = await p.locator("input[name='formNombre']").isVisible();
  if (!r.cancelKeepsForm) throw new Error("Cancelar cerró el formulario: no permite corregir/reintentar.");
  await p.getByTestId("prospect-save-btn").click(); await wait(p);
  await modal.getByRole("button", { name: /Crear de todos modos/i }).click(); await wait(p);
  await p.locator("tbody tr", { hasText: b }).waitFor({ state: "visible" }); r.explicitCreate = true;
} catch (e) { r.error = String(e?.stack || e); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(r)); process.exit(r.error ? 1 : 0);
