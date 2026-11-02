import { chromium } from "playwright";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const wait = page => page.waitForTimeout(500);
// 2026-11-01 — Migrado al layout actual: el modal "Asociar equipo" se abre desde
// /app/work-equipment-reception (ya no existe la acción por fila en /crm-prospectos).
const result = { case: "REC-01", login: false, gateBoxVisible: false, nonIndustrialLabel: false, blockedByValidation: false, error: "" };
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

    // Paso Recepción → Equipos. Equipo de perfil NO industrial y costo por defecto "No" (<= 2M):
    // las booleans nacen en "No" (buildDefaultAnswers), así que requiresIndustrialOverride(item) = true.
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);
    await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" });
    for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);

    // Paso Preguntas: el recuadro de bloqueo por filtro industrial debe estar a la vista.
    result.gateBoxVisible = await modal.getByText("Bloqueo por filtro industrial", { exact: false }).first().isVisible().catch(() => false);
    result.nonIndustrialLabel = (await modal.innerText()).includes("No industrial");
    if (!result.gateBoxVisible || !result.nonIndustrialLabel) throw new Error(`El recuadro de filtro industrial no apareció con etiqueta "No industrial": ${(await modal.innerText()).slice(-500)}`);

    // Salir del paso sin autorización de jefe debe bloquear el avance.
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);
    const validationMessage = modal.getByTestId("equipment-modal-validation-message");
    result.blockedByValidation = (await validationMessage.isVisible().catch(() => false)) && /Falta autorización de jefe/i.test(await validationMessage.innerText());
    if (!result.blockedByValidation) throw new Error(`No bloqueó el filtro industrial al salir de Preguntas: ${(await modal.innerText()).slice(-500)}`);
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
