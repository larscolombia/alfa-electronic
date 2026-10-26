/** COMPR-10: el recibo parcial visible aumenta stock sin cerrar el faltante. */
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const timeout = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "false").toLowerCase());
const slowMo = Number(process.env.PW_SLOW_MO_MS || "500");
const stamp = Date.now();
const artifacts = path.resolve("playwright-artifacts/frontend-only");
const result = { case: "COMPR-10", frontendOnly: true, login: false, pendingLineFound: false, partialReceiptRecorded: false, remainingVisible: false, before: "", after: "", error: "" };
let browser;

const pause = (page) => page.waitForTimeout(500);
async function capture(page, step) { await page.screenshot({ path: path.join(artifacts, `${stamp}-compr-10-${step}.png`), fullPage: true }); }

try {
    await fs.mkdir(artifacts, { recursive: true });
    browser = await chromium.launch({ headless, slowMo });
    const page = await (await browser.newContext({ viewport: { width: 1540, height: 980 } })).newPage();
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle", timeout });
    await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await pause(page);
    await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await pause(page);
    await page.locator("form.auth-form button[type='submit']").click(); await pause(page);
    await page.waitForURL((url) => url.href.includes("/app"), { timeout }); result.login = true;

    await page.goto(`${baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout });
    const rows = page.getByTestId("purchase-line-row");
    await rows.first().waitFor({ state: "visible", timeout: 20000 });
    // Se requiere al menos dos unidades pendientes para demostrar un recibo parcial.
    const candidate = rows.filter({ hasText: "Faltan 2" }).first();
    if (!(await candidate.isVisible({ timeout: 10000 }).catch(() => false))) {
        throw new Error("La UI no tiene una línea con al menos dos unidades pendientes para comprobar un recibo parcial.");
    }
    result.pendingLineFound = true;
    result.before = (await candidate.getByTestId("purchase-line-received").innerText()).trim();
    await capture(page, "01-linea-pendiente");
    await candidate.getByLabel("Cantidad recibida de esta linea").fill("1"); await pause(page);
    await candidate.getByTestId("receive-purchase-line").click(); await pause(page);
    await page.getByTestId("purchase-line-row").filter({ hasText: "Faltan 1" }).first().waitFor({ state: "visible", timeout });
    const updated = page.getByTestId("purchase-line-row").filter({ hasText: "Faltan 1" }).first();
    result.after = (await updated.getByTestId("purchase-line-received").innerText()).trim();
    result.partialReceiptRecorded = result.before === "0/2" && result.after === "1/2";
    result.remainingVisible = await updated.getByText("Faltan 1", { exact: true }).isVisible();
    if (!result.partialReceiptRecorded || !result.remainingVisible) throw new Error(`Recibo parcial no consistente: ${result.before} -> ${result.after}`);
    await capture(page, "02-recibo-parcial");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
await fs.writeFile(path.join(artifacts, `${stamp}-compr-10.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.error ? 1 : 0);
