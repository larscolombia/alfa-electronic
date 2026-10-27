/**
 * COMPR-10 (UI): el recibo parcial visible aumenta stock sin cerrar el faltante.
 * Convención del badge: "<recibido>/<total>" (p.ej. "0/2" → "1/2") con leyenda
 * "Faltan N" mientras quede pendiente.
 *
 * El fixture (referencia + línea de compra de 2 unidades) se crea por API con
 * códigos únicos por corrida; la ACCIÓN (recibir 1 de 2) se ejercita por UI.
 * Antes el test tomaba la primera fila con "Faltan 2" de datos compartidos, lo
 * que lo hacía ambiguo ante líneas de otros casos/agentes (p.ej. una fila
 * ajena "2/3" también cumple "Faltan 1" y rompía la comparación del badge).
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";
import {
    apiLogin, createReference, findReference, createPurchaseLine, findPurchaseLine, setArtifactsDir,
} from "./e2e-compr-helpers.mjs";

const baseUrl = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const timeout = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "false").toLowerCase());
const slowMo = Number(process.env.PW_SLOW_MO_MS || "500");
const stamp = Date.now();
setArtifactsDir("playwright-artifacts/frontend-only");
const artifacts = path.resolve("playwright-artifacts/frontend-only");
const refCode = `UIPW-COMPR10-${stamp}`;
const totalQty = 2;

const result = { case: "COMPR-10", frontendOnly: true, login: false, pendingLineFound: false, partialReceiptRecorded: false, remainingVisible: false, before: "", after: "", data: { reference: refCode, totalQty }, error: "" };
let browser;

const pause = (page) => page.waitForTimeout(500);
async function capture(page, step) { await page.screenshot({ path: path.join(artifacts, `${stamp}-compr-10-${step}.png`), fullPage: true }); }

try {
    await fs.mkdir(artifacts, { recursive: true });

    // ── Fixture por API: línea propia de 2 unidades, pendiente 2 ("Faltan 2") ──
    const session = await apiLogin();
    const refRes = await createReference(session, refCode, { designation: `Línea UI COMPR-10 QA ${stamp % 100000}`, targetStock: totalQty });
    if (refRes.existed !== true && refRes.status !== 200 && refRes.status !== 201) {
        throw new Error(`No se pudo crear la referencia ${refCode} (HTTP ${refRes.status}).`);
    }
    await createPurchaseLine(session, { reference: refCode, component: "Repuesto UI COMPR-10", quantity: totalQty, requestReason: `Fixture UI COMPR-10 (${stamp})` });
    const seeded = await findPurchaseLine(session, refCode);
    if (!seeded || Number(seeded.quantity) !== totalQty || Number(seeded.receivedQuantity ?? 0) !== 0) {
        throw new Error(`Fixture inválido para ${refCode}: ${JSON.stringify(seeded).slice(0, 200)}.`);
    }

    browser = await chromium.launch({ headless, slowMo });
    const page = await (await browser.newContext({ viewport: { width: 1540, height: 980 } })).newPage();
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle", timeout });
    await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await pause(page);
    await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await pause(page);
    await page.locator("form.auth-form button[type='submit']").click(); await pause(page);
    await page.waitForURL((url) => url.href.includes("/app"), { timeout }); result.login = true;

    await page.goto(`${baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout });
    const table = page.getByTestId("purchase-lines-table");
    await table.waitFor({ state: "visible", timeout: 20000 });
    // Se requieren al menos dos unidades pendientes en la línea PROPIA del caso.
    const candidate = table.getByTestId("purchase-line-row").filter({ hasText: refCode }).first();
    if (!(await candidate.isVisible({ timeout: 20000 }).catch(() => false))) {
        throw new Error(`La línea propia ${refCode} no aparece en la tabla de entregas.`);
    }
    result.pendingLineFound = true;
    result.before = (await candidate.getByTestId("purchase-line-received").innerText()).trim();
    await capture(page, "01-linea-pendiente");
    await candidate.getByLabel("Cantidad recibida de esta linea").fill("1"); await pause(page);
    await candidate.getByTestId("receive-purchase-line").click(); await pause(page);

    // El badge de la MISMA línea debe pasar de 0/2 a 1/2 y seguir mostrando "Faltan 1".
    await candidate.getByText("Faltan 1", { exact: true }).waitFor({ state: "visible", timeout });
    result.after = (await candidate.getByTestId("purchase-line-received").innerText()).trim();
    result.partialReceiptRecorded = result.before === "0/2" && result.after === "1/2";
    result.remainingVisible = await candidate.getByText("Faltan 1", { exact: true }).isVisible();
    if (!result.partialReceiptRecorded || !result.remainingVisible) throw new Error(`Recibo parcial no consistente: ${result.before} -> ${result.after}`);

    // Verificación cruzada API: el stock acreditado es exactamente lo físico recibido.
    const stockAfter = Number((await findReference(session, refCode))?.currentStock ?? -1);
    result.stockAfterReceipt = stockAfter;
    if (stockAfter !== 1) throw new Error(`Stock acreditado ${stockAfter} (esperado exactamente 1).`);
    await capture(page, "02-recibo-parcial");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
await fs.writeFile(path.join(artifacts, `${stamp}-compr-10.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.error ? 1 : 0);
