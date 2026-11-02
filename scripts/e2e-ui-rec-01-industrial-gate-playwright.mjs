import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const wait = page => page.waitForTimeout(500);
// 2026-11-02 — El paso "Preguntas" desapareció del wizard: el gate industrial se valida ahora en
// Cierre (signatures), justo antes de las firmas. Guardar con gate vacío debe bloquear y, al llenar
// ambos campos, desbloquear el save. Evidencia por grid nueva (un input por cara obligatoria).
const pngPaths = ["front", "back", "serial-plate"].map(face => join(tmpdir(), `cara-rec01-${face}-${id}.png`));
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
for (const pngPath of pngPaths) writeFileSync(pngPath, Buffer.from(pngBase64, "base64"));

const result = { case: "REC-01", login: false, gateBoxVisible: false, nonIndustrialLabel: false, blockedByValidation: false, saved: false, error: "" };
let browser;
let modal;

try {
    browser = await chromium.launch({ headless: process.env.PW_HEADLESS !== "false", slowMo: Number(process.env.PW_SLOW_MO_MS || 0) });
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
    await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
    await page.locator("form.auth-form button[type='submit']").click();
    await page.waitForURL(url => url.href.includes("/app")); result.login = true;

    // Entrada por recepción directa (layout actual).
    await page.goto(`${base}/app/work-equipment-reception`, { waitUntil: "networkidle" });
    await page.getByTestId("work-equipment-create").click(); await wait(page);

    // El host <app-crm-prospect-equipment-modal> es inline 0x0: esperar el botón next del footer.
    modal = page.locator("app-crm-prospect-equipment-modal");
    await page.getByTestId("equipment-modal-next").waitFor({ state: "visible", timeout: 15000 });

    // Paso Recepción → Equipos. Item de perfil NO industrial y sin pregunta de costo en el wizard
    // (la respuesta nace en "No"), así que requiresIndustrialOverride(item) = true siempre.
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);
    await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" });
    for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

    // Equipos → Evidencia (el paso "Preguntas" ya no existe).
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);

    // Grid nueva de evidencia: un input por cara obligatoria.
    const faceSlotSuffixes = ["-face-front", "-face-back", "serial-plate"];
    for (let i = 0; i < pngPaths.length; i += 1) {
        await modal.locator(`input[type='file'][accept='image/*'][id$="${faceSlotSuffixes[i]}"]`).setInputFiles(pngPaths[i]);
        await wait(page);
    }

    // Evidencia → Cierre.
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);

    // El recuadro de bloqueo por filtro industrial debe estar a la vista en Cierre, con etiqueta "No industrial".
    result.gateBoxVisible = await modal.getByTestId("industrial-override-closure").first().isVisible().catch(() => false);
    result.nonIndustrialLabel = (await modal.innerText()).includes("No industrial");
    if (!result.gateBoxVisible || !result.nonIndustrialLabel) throw new Error(`El gate industrial no apareció en Cierre con etiqueta "No industrial": ${(await modal.innerText()).slice(-500)}`);

    // Guardar sin autorización de jefe debe bloquearse.
    await modal.getByTestId("equipment-modal-save").click(); await wait(page);
    const validationMessage = modal.getByTestId("equipment-modal-validation-message");
    result.blockedByValidation = (await validationMessage.isVisible().catch(() => false)) && /Falta autorización de jefe/i.test(await validationMessage.innerText());
    if (!result.blockedByValidation) throw new Error(`El gate industrial no bloqueó el guardado en Cierre: ${(await modal.innerText()).slice(-500)}`);

    // Llenar ambos campos libera el guardado.
    await modal.getByTestId("industrial-override-by").first().fill("Jefe QA");
    await modal.getByTestId("industrial-override-reason").first().fill(`Aprobado por QA ${id}`);
    await wait(page);
    await modal.getByTestId("equipment-modal-save").click();
    await modal.waitFor({ state: "hidden", timeout: 60000 });
    result.saved = true;
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
