import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const wait = page => page.waitForTimeout(500);
const result = { case: "LOG-01", frontendOnly: true, login: false, formOpened: false, blocked: false, error: "" };
let browser;
try {
  browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true; await wait(page);
  await page.goto(`${base}/app/remissions`, { waitUntil: "networkidle" });
  await page.getByTestId("create-remission-btn").click(); await wait(page); result.formOpened = true;
  await page.getByTestId("remission-client").fill(`LOG01 QA ${Date.now()}`); await wait(page);
  await page.getByTestId("remission-contact-name").fill("Contacto QA"); await wait(page);
  await page.locator("button").filter({ hasText: "Guardar" }).last().click(); await wait(page);
  const block = page.getByTestId("remission-save-block");
  await block.waitFor({ state: "visible" });
  result.blocked = /equipo|listo|técnic|remisi[oó]n/i.test(await block.innerText());
  if (!result.blocked) throw new Error(`Bloqueo inesperado: ${await block.innerText()}`);
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
