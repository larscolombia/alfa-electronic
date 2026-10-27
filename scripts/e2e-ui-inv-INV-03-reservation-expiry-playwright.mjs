import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const ref = `qa-inv-03-${id}`;
const wait = (page) => page.waitForTimeout(500);
const result = {
  case: "INV-03",
  login: false,
  referenceCreated: false,
  stockEntered: false,
  reservationCreated: false,
  expiredBadge: false,
  renewedFeedback: false,
  renewedBadgeActive: false,
  releasedFeedback: false,
  error: "",
};
let browser;

try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();

  // ─── LOGIN (UI) ────────────────────────────────────────────────────────────
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL((url) => url.href.includes("/app")); result.login = true;

  // ─── (1) CREAR REFERENCIA qa-inv-03-* (tab Alta de ficha nueva) ────────────
  await page.goto(`${base}/app/inventory-stock`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Alta de ficha nueva/i }).click(); await wait(page);
  await page.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await page.locator("input[placeholder='Ej: Amplificador operacional']").fill(`Reserva politica QA ${id}`);
  await page.locator("input[type='number'][min='0']").fill("0");
  await page.getByRole("button", { name: /^Crear ficha$/ }).click(); await wait(page);
  await page.locator("[data-testid='inv-feedback-alert']").waitFor({ state: "visible", timeout: 10000 });
  result.referenceCreated = true;

  // ─── (1b) ENTRADA DE STOCK: 10 unidades ────────────────────────────────────
  await page.getByRole("button", { name: /Entrada a stock existente/i }).click(); await wait(page);
  const tabsCard = page.locator("div.card", { hasText: "Alta de ficha nueva" }).first();
  await tabsCard.locator("select.form-select").first().selectOption(ref); await wait(page);
  await page.locator("input[type='number'][min='1']").fill("10"); await wait(page);
  await page.getByRole("button", { name: /^Registrar entrada$/ }).click(); await wait(page);
  await page.locator("[data-testid='inv-feedback-alert']").waitFor({ state: "visible", timeout: 10000 });
  await wait(page); await wait(page);
  result.stockEntered = true;

  // ─── (2) CREAR RESERVA DE 3 UNIDADES ───────────────────────────────────────
  await page.goto(`${base}/app/inventory-reservations`, { waitUntil: "networkidle" });
  const newCard = page.locator("div.card", { hasText: "Nueva reserva" }).first();
  await newCard.locator("input[placeholder='Ej: LM324N']").fill(ref); await wait(page);
  await newCard.locator("input[type='number']").fill("3"); await wait(page);
  await newCard.locator("select[name='reservationAssignedTo']").selectOption({ index: 1 }); await wait(page);
  await newCard.locator("input[placeholder*='Reparacion urgente']").fill(`Prueba INV-03 ${id}`); await wait(page);
  await newCard.getByRole("button", { name: /^Crear reserva$/ }).click();
  await page.locator("[data-testid='inv-reservations-feedback']").waitFor({ state: "visible", timeout: 10000 });
  await wait(page);

  const row = page.locator("tr[data-testid^='reservation-row-']", { hasText: ref }).first();
  await row.waitFor({ state: "visible", timeout: 10000 });
  const reservationId = (await row.getAttribute("data-testid")).replace("reservation-row-", "");
  result.reservationCreated = true;
  const badge = page.locator(`[data-testid='reservation-status-${reservationId}']`);

  // ─── (3) FORZAR VENCIMIENTO: politica a 0 dias + recarga ───────────────────
  const policyCard = page.locator("div.card", { hasText: "Politica de reservas" }).first();
  await policyCard.locator("input[type='number']").fill("0"); await wait(page);
  await policyCard.getByRole("button", { name: /Aplicar politica/i }).click();
  await page.locator("div.alert", { hasText: /Politica de reserva actualizada a 0/ }).waitFor({ state: "visible", timeout: 10000 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.locator(`[data-testid='reservation-status-${reservationId}']`).waitFor({ state: "visible", timeout: 10000 });
  result.expiredBadge = (await badge.innerText()).trim() === "vencida";
  if (!result.expiredBadge) throw new Error(`Badge tras forzar vencimiento: "${await badge.innerText()}"`);

  // ─── (4) RENOVAR: restaurar politica a 5, renovar y verificar ──────────────
  const policyCard2 = page.locator("div.card", { hasText: "Politica de reservas" }).first();
  await policyCard2.locator("input[type='number']").fill("5"); await wait(page);
  await policyCard2.getByRole("button", { name: /Aplicar politica/i }).click();
  await page.locator("div.alert", { hasText: /Politica de reserva actualizada a 5/ }).waitFor({ state: "visible", timeout: 10000 });
  await wait(page);
  await page.locator(`[data-testid='reservation-renew-${reservationId}']`).click();
  const renewed = page.locator(`[data-testid='reservation-renewed-${reservationId}']`);
  await renewed.waitFor({ state: "visible", timeout: 10000 });
  const renewedText = await renewed.innerText();
  result.renewedFeedback = /Nueva fecha de vencimiento/i.test(renewedText);
  if (!result.renewedFeedback) throw new Error(`Feedback de renovacion sin fecha: ${renewedText}`);
  await wait(page); await wait(page);
  result.renewedBadgeActive = (await badge.innerText()).trim() === "activa";
  if (!result.renewedBadgeActive) throw new Error(`Badge tras renovar: "${await badge.innerText()}"`);

  // ─── (5) SEGUNDO VENCIMIENTO + LIBERACION ──────────────────────────────────
  const policyCard3 = page.locator("div.card", { hasText: "Politica de reservas" }).first();
  await policyCard3.locator("input[type='number']").fill("0"); await wait(page);
  await policyCard3.getByRole("button", { name: /Aplicar politica/i }).click();
  await page.locator("div.alert", { hasText: /Politica de reserva actualizada a 0/ }).waitFor({ state: "visible", timeout: 10000 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.locator(`[data-testid='reservation-status-${reservationId}']`).waitFor({ state: "visible", timeout: 10000 });
  if ((await badge.innerText()).trim() !== "vencida") throw new Error(`Badge previo a liberar: "${await badge.innerText()}"`);
  await page.locator(`[data-testid='reservation-release-${reservationId}']`).click();
  const released = page.locator(`[data-testid='reservation-released-${reservationId}']`);
  await released.waitFor({ state: "visible", timeout: 10000 });
  result.releasedFeedback = /liberad|disponible/i.test(await released.innerText());
  if (!result.releasedFeedback) throw new Error(`Feedback de liberacion inesperado: ${await released.innerText()}`);

  // ─── LIMPIEZA: dejar la politica en 5 dias para el resto de pruebas ────────
  const policyCard4 = page.locator("div.card", { hasText: "Politica de reservas" }).first();
  await policyCard4.locator("input[type='number']").fill("5"); await wait(page);
  await policyCard4.getByRole("button", { name: /Aplicar politica/i }).click();
  await page.locator("div.alert", { hasText: /Politica de reserva actualizada a 5/ }).waitFor({ state: "visible", timeout: 10000 });
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
