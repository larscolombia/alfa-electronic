/**
 * COM-06 — Seguimiento comercial sin depender de API de prueba.
 * La creación, navegación, persistencia tras recarga y comprobación son UI.
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const timeout = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "false").toLowerCase());
const slowMo = Number(process.env.PW_SLOW_MO_MS || "500");
const stamp = Date.now();
const prospect = `QA Seguimiento UI ${stamp}`;
const email = `qa-followup-${stamp}@alfa.local`;
const artifacts = path.resolve("playwright-artifacts/frontend-only");
const result = { case: "COM-06", frontendOnly: true, login: false, prospectCreated: false, followupPersists: false, screenshots: [], error: "" };
let browser;

async function wait(page) { await page.waitForTimeout(500); }
async function click(page, locator) { await locator.click(); await wait(page); }
async function fill(page, locator, value) { await locator.fill(value); await wait(page); }
async function capture(page, step) {
    const file = path.join(artifacts, `${stamp}-com-06-${step}.png`);
    await page.screenshot({ path: file, fullPage: true });
    result.screenshots.push(file);
}

try {
    await fs.mkdir(artifacts, { recursive: true });
    browser = await chromium.launch({ headless, slowMo });
    const page = await (await browser.newContext({ viewport: { width: 1540, height: 980 } })).newPage();

    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle", timeout });
    await fill(page, page.locator("#emailadd"), process.env.PW_USER_EMAIL || "admin@alfa.com");
    await fill(page, page.locator("#passwd"), process.env.PW_USER_PASSWORD || "1234");
    await click(page, page.locator("form.auth-form button[type='submit']"));
    await page.waitForURL((url) => url.href.includes("/app"), { timeout });
    result.login = true;
    await capture(page, "01-login");

    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "networkidle", timeout });
    await click(page, page.getByRole("button", { name: /Agregar Prospecto/i }));
    await fill(page, page.locator("input[name='formNombre']"), prospect);
    await fill(page, page.locator("input[name='formCompania']"), prospect);
    await fill(page, page.locator("input[name='formCorreo']"), email);
    await fill(page, page.locator("input[name='formNit']"), `901${String(stamp).slice(-6)}-1`);
    await fill(page, page.locator("input[name='formMovil']"), "3005550123");
    await fill(page, page.locator("input[name='formPais']"), "Colombia");
    await fill(page, page.locator("input[name='formCiudad']"), "Bogota");
    await capture(page, "02-prospecto-formulario");
    await click(page, page.getByTestId("prospect-save-btn"));
    await page.locator("tbody tr", { hasText: prospect }).waitFor({ state: "visible", timeout });
    result.prospectCreated = true;
    await capture(page, "03-prospecto-listado");

    const row = page.locator("tbody tr", { hasText: prospect }).first();
    await click(page, row.getByRole("button", { name: /^Acciones$/ }));
    await click(page, page.locator("ul.dropdown-menu.show a.dropdown-item", { hasText: "Abrir ficha" }));
    await page.waitForURL(/\/app\/crm-prospectos\/[^/?#]+$/, { timeout });
    // COM-02 exige un contacto real como responsable del seguimiento: el
    // prospecto solo ya no es un interlocutor válido para agendar la visita.
    const contactName = `Responsable COM-06 ${stamp}`;
    await click(page, page.getByRole("button", { name: "Contactos relacionados" }));
    await click(page, page.getByRole("button", { name: /Agregar contacto/i }));
    const contactModal = page.locator(".modal-dialog", { hasText: "Agregar contacto" });
    await contactModal.waitFor({ state: "visible", timeout });
    await fill(page, contactModal.locator("input").nth(0), contactName);
    await fill(page, contactModal.locator("input").nth(1), "Gerente de mantenimiento");
    await fill(page, contactModal.locator("input[type='email']"), `qa-contact-${stamp}@alfa.local`);
    await click(page, contactModal.locator(".modal-footer button.btn-theme"));
    await page.locator("tbody tr", { hasText: contactName }).waitFor({ state: "visible", timeout });
    await capture(page, "03b-contacto-responsable");

    await click(page, page.getByRole("button", { name: "Acciones comerciales" }));
    await click(page, page.getByRole("button", { name: /Nueva accion comercial/i }));
    const modal = page.locator(".modal-dialog", { hasText: "Agregar Seguimiento" });
    await modal.waitFor({ state: "visible", timeout });
    await modal.locator("select.form-select").nth(0).selectOption({ label: `${contactName} (Contacto)` });
    await modal.locator("select.form-select").nth(1).selectOption({ label: "Visita presencial" });
    await wait(page);
    await fill(page, modal.locator("input[type='date']"), new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    await fill(page, modal.locator("input[type='time']"), "10:30");
    await fill(page, modal.locator("textarea"), `Seguimiento COM-06 ${stamp}`);
    await capture(page, "04-seguimiento-formulario");
    await click(page, modal.getByTestId("commercial-action-save-btn"));
    await click(page, modal.locator(".modal-footer button.btn-link", { hasText: "Cerrar" }));
    const followupRow = page.locator("tbody tr", { hasText: "Visita presencial" }).filter({ hasText: contactName });
    await followupRow.waitFor({ state: "visible", timeout });
    await page.reload({ waitUntil: "networkidle", timeout });
    const persistedRow = page.locator("tbody tr", { hasText: `Seguimiento COM-06 ${stamp}` }).filter({ hasText: contactName });
    await persistedRow.waitFor({ state: "visible", timeout });
    result.followupPersists = true;
    await capture(page, "05-seguimiento-persistido");
} catch (error) {
    result.error = String(error?.stack || error);
    const page = browser?.contexts()?.[0]?.pages()?.[0];
    if (page) await capture(page, "99-error").catch(() => {});
} finally {
    if (browser) await browser.close();
}
await fs.writeFile(path.join(artifacts, `${stamp}-com-06.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.error || !result.followupPersists ? 1 : 0);
