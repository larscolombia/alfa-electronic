/** COMPR-08: el BOM descargado desde UI sólo contiene Número de parte y Cantidad. */
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";
import * as XLSX from "xlsx";

const baseUrl = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const timeout = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "false").toLowerCase());
const slowMo = Number(process.env.PW_SLOW_MO_MS || "500");
const stamp = Date.now();
const artifacts = path.resolve("playwright-artifacts/frontend-only");
const result = { case: "COMPR-08", frontendOnly: true, login: false, linesAvailable: false, bomDownloaded: false, columnsValid: false, rowsValid: false, filename: "", columns: [], error: "" };
let browser;

async function pause(page) { await page.waitForTimeout(500); }
async function click(page, locator) { await locator.click(); await pause(page); }
async function capture(page, step) { await page.screenshot({ path: path.join(artifacts, `${stamp}-compr-08-${step}.png`), fullPage: true }); }

try {
    await fs.mkdir(artifacts, { recursive: true });
    browser = await chromium.launch({ headless, slowMo });
    const page = await (await browser.newContext({ viewport: { width: 1540, height: 980 }, acceptDownloads: true })).newPage();
    await page.goto(`${baseUrl}/auth/signin`, { waitUntil: "networkidle", timeout });
    await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await pause(page);
    await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await pause(page);
    await click(page, page.locator("form.auth-form button[type='submit']"));
    await page.waitForURL((url) => url.href.includes("/app"), { timeout }); result.login = true;

    await page.goto(`${baseUrl}/app/inventory-orders`, { waitUntil: "networkidle", timeout });
    const rows = page.getByTestId("purchase-line-row");
    result.linesAvailable = await rows.first().isVisible({ timeout: 20000 }).catch(() => false);
    if (!result.linesAvailable) throw new Error("La UI no muestra líneas de compra; no hay insumo visual para generar BOM.");
    // Una línea recibida al 100 % no debe producir BOM. Elegimos en la tabla
    // visible una que muestre el faltante y esté APROBADA (COMPR-01: solo las
    // líneas con OC validada se exportan al proveedor; si el proveedor elegido
    // solo tiene pendientes/rechazadas la app avisa y no descarga nada), y
    // luego aplicamos su proveedor.
    const pendingCandidates = rows.filter({ hasText: "Faltan" });
    const candidateCount = await pendingCandidates.count();
    let pendingSupplier = "";
    for (let i = 0; i < candidateCount; i++) {
        const candidate = pendingCandidates.nth(i);
        const approval = (await candidate.getByTestId("purchase-line-approval").innerText().catch(() => "")).trim().toLowerCase();
        if (approval !== "aprobada") continue;
        const supplier = (await candidate.locator("td").nth(8).innerText()).trim();
        if (supplier && supplier !== "--") { pendingSupplier = supplier; break; }
    }
    if (!pendingSupplier) {
        throw new Error("No hay línea visible con faltante y aprobada (OC validada); UI no ofrece un BOM comprable para COMPR-08.");
    }
    const supplier = page.locator("#line-supplier-filter");
    await supplier.selectOption({ label: pendingSupplier }); await pause(page);
    await capture(page, "01-lineas-filtradas");

    const button = page.getByTestId("download-purchase-lines-bom");
    await button.waitFor({ state: "visible", timeout });
    const downloadPromise = page.waitForEvent("download", { timeout });
    await click(page, button);
    const download = await downloadPromise;
    const saved = path.join(artifacts, `${stamp}-${download.suggestedFilename()}`);
    await download.saveAs(saved);
    result.bomDownloaded = true; result.filename = path.basename(saved);

    const book = XLSX.read(await fs.readFile(saved));
    const sheet = book.Sheets[book.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const header = data[0] || [];
    result.columns = header;
    result.columnsValid = header.length === 2 && header[0] === "Número de parte" && header[1] === "Cantidad";
    result.rowsValid = data.slice(1).length > 0 && data.slice(1).every((row) => String(row[0]).trim() && Number(row[1]) > 0);
    if (!result.columnsValid || !result.rowsValid) throw new Error(`BOM inválido: ${JSON.stringify({ header, rows: data.slice(1, 4) })}`);
    await capture(page, "02-bom-descargado");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
await fs.writeFile(path.join(artifacts, `${stamp}-compr-08.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.error ? 1 : 0);
