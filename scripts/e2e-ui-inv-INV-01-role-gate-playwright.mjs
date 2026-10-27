import { chromium } from "playwright";

// INV-01: puerta de rol — el tecnico no puede crear fichas ni ajustar/crear
// entradas de stock. Admin crea una referencia de prueba; el tecnico ve el
// aviso de rol bloqueado y su "Solicitar aprobacion" de entrada es rechazada
// por el backend (403) con el mensaje de rol no autorizado.

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const ref = `qa-inv-01-${id}`;
const designation = `Ficha QA INV01 ${id}`;
const adminEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const adminPassword = process.env.PW_USER_PASSWORD || "1234";
const wait = p => p.waitForTimeout(500);
const result = {
  case: "INV-01",
  reference: ref,
  adminLogin: false,
  referenceCreated: false,
  techLogin: false,
  roleHintOnStock: false,
  roleHintOnMovements: false,
  approvalButtonUsed: false,
  roleRejectedAlert: false,
  roleRejectedText: "",
  error: "",
};
let browser;

async function login(page, email, password) {
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(email); await wait(page);
  await page.locator("#passwd").fill(password); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app"));
}

async function createReferenceAsAdmin(page) {
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(ref);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(designation);
  await page.locator("label", { hasText: "Stock minimo" }).locator("..").locator("input[type='number']").fill("0");
  await page.getByRole("button", { name: "Crear ficha" }).click();

  const successAlert = page.locator("[data-testid='inv-feedback-alert']");
  const duplicatePanel = page.locator("[data-testid='inv-duplicate-warning']");
  const outcome = await Promise.race([
    successAlert.waitFor({ state: "visible", timeout: 20000 }).then(() => "success"),
    duplicatePanel.waitFor({ state: "visible", timeout: 20000 }).then(() => "duplicate"),
  ]).catch(() => "none");

  if (outcome === "duplicate") {
    await page.locator("[data-testid='inv-force-reason']").fill(`QA INV-01 ${id}: referencia de prueba unica por corrida`);
    await page.locator("[data-testid='inv-force-create-btn']").click();
    await successAlert.waitFor({ state: "visible", timeout: 20000 });
  } else if (outcome !== "success") {
    throw new Error("La creacion de la ficha no produjo feedback de exito ni panel de duplicado.");
  }

  const text = await successAlert.innerText();
  if (!text.includes(ref)) throw new Error(`El feedback no confirma la ficha ${ref}: ${text.trim()}`);
}

async function assertRoleHint(page, flag) {
  const hint = page.locator("[data-testid='inv-role-blocked-hint']");
  await hint.waitFor({ state: "visible", timeout: 15000 });
  result[flag] = true;
}

async function technicianEntryRejected(page) {
  await page.goto(`${base}/app/inventory-movements`, { waitUntil: "networkidle" });
  await assertRoleHint(page, "roleHintOnMovements");
  await page.locator("select:has(option[value='entrada'])").selectOption("entrada"); await wait(page);
  await page.locator(`select:has(option[value='${ref}'])`).selectOption(ref); await wait(page);
  const formCard = page.locator(".card", { hasText: "Nuevo movimiento" }).first();
  await formCard.locator("input[type='number']").fill("1");
  await formCard.locator("input[placeholder='Explica por que se hace el movimiento']").fill(`Entrada de prueba INV-01 ${id}`);
  await page.getByRole("button", { name: "Solicitar aprobacion" }).click();
  result.approvalButtonUsed = true; await wait(page);

  const alert = page.locator("[data-testid='inv-role-rejected-alert']");
  await alert.waitFor({ state: "visible", timeout: 20000 });
  const text = await alert.innerText();
  result.roleRejectedText = text.replace(/\s+/g, " ").trim().slice(0, 200);
  result.roleRejectedAlert = text.includes("rol tecnico no autorizado para crear fichas o ajustar stock");
  if (!result.roleRejectedAlert) throw new Error(`Alerta de rol sin el mensaje esperado: ${result.roleRejectedText}`);
}

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });

  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await login(adminPage, adminEmail, adminPassword);
  result.adminLogin = true;
  await createReferenceAsAdmin(adminPage);
  result.referenceCreated = true;
  await adminCtx.close();

  const techCtx = await browser.newContext();
  const techPage = await techCtx.newPage();
  await login(techPage, "tecnico@alfa.com", "1234");
  result.techLogin = true;
  await techPage.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await assertRoleHint(techPage, "roleHintOnStock");
  await technicianEntryRejected(techPage);
  await techCtx.close();
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
