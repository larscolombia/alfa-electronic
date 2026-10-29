import { chromium } from "playwright";

const base = "https://alfa.software.net.co";
const result = { base, checks: {}, errors: [] };

const response = await fetch(`${base}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
  body: JSON.stringify({ email: process.env.PW_ADMIN_EMAIL || "admin@alfa.com", password: process.env.PW_ADMIN_PASSWORD || "1234" }),
});
if (!response.ok) throw new Error(`Production login failed: ${response.status}`);
const session = await response.json();
session.expiresAt = Date.now() + Math.max(session.expiresIn, 1) * 1000;

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
await page.addInitScript(({ session, base }) => {
  localStorage.setItem("pika.auth.session", JSON.stringify(session));
  localStorage.setItem("pika.apiBaseUrl", base);
}, { session, base });
page.on("pageerror", (error) => result.errors.push(error.message));

try {
  await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
  const row = page.locator("tbody tr").first();
  await row.waitFor({ state: "visible", timeout: 30000 });
  await row.getByRole("button", { name: /^Acciones$/ }).click();
  await row.getByRole("button", { name: /Asociar equipo/i }).click();
  const modal = page.locator("app-crm-prospect-equipment-modal .modal-content").first();
  await modal.waitFor({ state: "visible", timeout: 15000 });

  result.checks.noNativeSelects = (await modal.locator("select").count()) === 0;
  result.checks.customSelectsPresent = (await modal.locator("app-crm-modal-select").count()) > 0;

  // 1. Intake method dropdown
  await modal.getByTestId("equipment-modal-intake-method").click();
  const menu = page.locator(".crm-modal-select-menu:visible").last();
  await menu.waitFor({ state: "visible", timeout: 5000 });
  result.checks.intakeMenuOpened = true;
  await menu.locator('[data-value="transportadora"]').click();
  await page.waitForTimeout(400);
  result.checks.transportadoraFields = await modal.locator("input[placeholder='Número de guía']").isVisible();

  // 2. Date-time picker
  await modal.getByTestId("equipment-modal-intake-received-at").click();
  const dtMenu = page.locator(".crm-modal-dt-menu:visible").last();
  await dtMenu.waitFor({ state: "visible", timeout: 5000 });
  result.checks.dateMenuOpened = true;
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  await dtMenu.locator(`[data-date="${key}"]`).click();
  await dtMenu.locator("[data-testid='dt-hour']").fill("09");
  await dtMenu.locator("[data-testid='dt-minute']").fill("30");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const dtLabel = await modal.getByTestId("equipment-modal-intake-received-at").innerText();
  result.checks.dateTimeValueSet = /09:30/.test(dtLabel);
  result.checks.dateTimeLabel = dtLabel.trim();

  // 3. Advance to equipment step and use registration-mode + service type
  await modal.locator("input[placeholder='Número de guía']").fill("GUIA-VERIFY");
  await modal.getByTestId("equipment-modal-next").click();
  await page.waitForTimeout(800);
  result.checks.validationAfterNext = (await modal.getByTestId("equipment-modal-validation-message").innerText().catch(() => "")).trim();
  await page.screenshot({ path: "/tmp/verify-after-next.png" });
  await page.waitForTimeout(600);
  await modal.getByTestId("equipment-modal-registration-mode-0").click();
  const menu2 = page.locator(".crm-modal-select-menu:visible").last();
  await menu2.locator('[data-value="manual"]').click();
  await page.waitForTimeout(400);
  result.checks.manualModeApplied = await modal.locator("input[placeholder='Familia libre']").isEditable();

  await modal.getByTestId("equipment-modal-service-type-0").click();
  const menu3 = page.locator(".crm-modal-select-menu:visible").last();
  const serviceCount = await menu3.locator(".crm-modal-select-option").count();
  result.checks.serviceMenuOptions = serviceCount;
  if (serviceCount > 1) {
    await menu3.locator(".crm-modal-select-option").nth(1).click();
    await page.waitForTimeout(300);
    result.checks.serviceSelected = (await modal.getByTestId("equipment-modal-service-type-0").innerText()).trim();
  }

  await page.screenshot({ path: "/tmp/verify-custom-selects.png" });
} catch (error) {
  result.errors.push(String(error?.stack || error));
  await page.screenshot({ path: "/tmp/verify-custom-selects-error.png" }).catch(() => {});
} finally {
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
process.exit(result.errors.length ? 1 : 0);
