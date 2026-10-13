import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const defaultToken = process.env.PW_ESTIMATE_TOKEN || "84e76b4670627b4c147a1b418270560a";
const targetPath = process.env.PW_TARGET_PATH || `/estimate/${defaultToken}`;
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "60000");
const fullUrl = `${baseUrl.replace(/\/$/, "")}${targetPath}`;

const consoleErrors = [];
const pageErrors = [];

const result = {
    fullUrl,
    finalUrl: "",
    status: null,
    hasEstimateTitle: false,
    hasMetaTable: false,
    hasActionButtons: false,
    modalOpened: false,
    signatureConfirmed: false,
    hasDecisionChip: false,
    decisionLabel: "",
    bodyPreview: "",
    visibleTextLength: 0,
    consoleErrors,
    pageErrors,
    screenshotPath: "",
};

let browser;

function extractTokenFromPath(pathValue) {
    const match = pathValue.match(/\/estimate\/([^/?#]+)/i);
    return match?.[1] || "";
}

try {
    browser = await chromium.launch({ headless: true });

    const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            consoleErrors.push(msg.text());
        }
    });

    page.on("pageerror", (error) => {
        pageErrors.push(error.stack || error.message || String(error));
    });

    const response = await page.goto(fullUrl, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });

    result.status = response ? response.status() : null;
    result.finalUrl = page.url();

    const token = extractTokenFromPath(targetPath) || defaultToken;

    // Reset quote decision state so the approval flow can always be tested.
    await page.evaluate((activeToken) => {
        const key = "adminux.crm.quote.public-previews";
        const rawValue = window.localStorage.getItem(key);
        if (!rawValue) {
            return;
        }

        try {
            const parsed = JSON.parse(rawValue);
            if (parsed && typeof parsed === "object" && parsed[activeToken]) {
                parsed[activeToken].estadoCliente = "Pendiente";
                delete parsed[activeToken].fechaDecision;
                delete parsed[activeToken].firmadoPor;
                delete parsed[activeToken].firmanteCorreo;
                delete parsed[activeToken].lugarFirma;
                delete parsed[activeToken].firmaBase64;
                window.localStorage.setItem(key, JSON.stringify(parsed));
            }
        } catch {
            // noop
        }
    }, token);

    await page.reload({ waitUntil: "networkidle", timeout: timeoutMs });
    await page.waitForTimeout(500);

    result.hasEstimateTitle = (await page.getByText("ESTIMACION", { exact: true }).count()) > 0;
    result.hasMetaTable = (await page.getByText("Numero de Presupuesto", { exact: true }).count()) > 0;

    const hasAcceptButton = (await page.getByRole("button", { name: "Aceptar" }).count()) > 0;
    const hasRejectButton = (await page.getByRole("button", { name: "Rechazar" }).count()) > 0;
    result.hasActionButtons = hasAcceptButton && hasRejectButton;

    if (hasAcceptButton) {
        await page.getByRole("button", { name: "Aceptar" }).click();
        await page.waitForSelector(".modal.show", { timeout: timeoutMs });
        result.modalOpened = true;

        await page.fill('input[name="sigNombre"]', "Juan");
        await page.fill('input[name="sigApellido"]', "Avila");
        await page.fill('input[name="sigCorreo"]', "juan.avila@webbo.com.co");
        await page.fill('input[name="sigLugar"]', "Bogota");

        const signatureCanvas = page.locator("canvas.signature-canvas").first();
        const box = await signatureCanvas.boundingBox();

        if (!box) {
            throw new Error("No se pudo obtener el canvas de firma.");
        }

        await page.mouse.move(box.x + 30, box.y + 80);
        await page.mouse.down();
        await page.mouse.move(box.x + 120, box.y + 65);
        await page.mouse.move(box.x + 220, box.y + 95);
        await page.mouse.up();

        await page.getByRole("button", { name: "Firmar" }).click();
        await page.waitForSelector("text=Cotizacion aprobada por", { timeout: timeoutMs });

        result.signatureConfirmed = true;
    }

    const decisionChip = page.locator(".decision-chip").first();
    result.hasDecisionChip = (await decisionChip.count()) > 0;
    if (result.hasDecisionChip) {
        result.decisionLabel = ((await decisionChip.innerText()) || "").trim();
    }

    const metrics = await page.evaluate(() => ({
        visibleTextLength: (document.body?.innerText || "").trim().length,
        bodyPreview: (document.body?.innerText || "").trim().slice(0, 360),
    }));

    result.visibleTextLength = metrics.visibleTextLength;
    result.bodyPreview = metrics.bodyPreview;

    const screenshotPath = path.join(process.cwd(), "playwright-estimate-check.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    const isBroken =
        pageErrors.length > 0 ||
        !result.hasEstimateTitle ||
        !result.hasMetaTable ||
        !result.hasActionButtons ||
        !result.modalOpened ||
        !result.signatureConfirmed ||
        !result.hasDecisionChip ||
        !/APROBADA/i.test(result.decisionLabel);

    if (isBroken) {
        console.error("PLAYWRIGHT_ESTIMATE_CHECK_FAILED");
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
    } else {
        console.log("PLAYWRIGHT_ESTIMATE_CHECK_OK");
        console.log(JSON.stringify(result, null, 2));
    }
} catch (error) {
    console.error("PLAYWRIGHT_ESTIMATE_CHECK_ERROR");
    console.error(String(error?.stack || error));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
