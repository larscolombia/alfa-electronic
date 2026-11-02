import { chromium } from "playwright";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const wait = page => page.waitForTimeout(500);
// 2026-11-01 — Migrado al layout actual (entrada por /app/work-equipment-reception) y
// extendido para verificar el breadcrumb de warnings en el header del modal ("Sin remisión").
const result = { case: "REC-02", login: false, warningVisible: false, headerChipSinRemision: false, canContinue: false, error: "" };
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

    // Paso Recepción → Equipos. Se llena el mínimo para que el item cuente como "meaningful"
    // pero "Remisión del cliente / guía" se deja VACÍA: esa es la condición bajo prueba.
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);
    await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-family-']").first(), { label: "CE - Tarjeta Electrónica" });
    for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);

    // Aserción 1: el warning inline de formato/remisión pendiente es visible en la celda.
    result.warningVisible = await modal.getByTestId("missing-intake-format-warning").isVisible().catch(() => false);

    // Aserción 2 (breadcrumb nuevo): el chip "Sin remisión" aparece en el header, junto al título.
    const headerChip = modal.locator(".modal-header .equipment-warning-list .warning-chip", { hasText: "Sin remisión" });
    result.headerChipSinRemision = await headerChip.first().isVisible().catch(() => false);

    // Aserción 3: la advertencia no bloquea — se puede continuar a Preguntas.
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);
    result.canContinue = /Preguntas por equipo/.test(await modal.innerText());
    if (!result.warningVisible) throw new Error(`El warning "Formato/remisión pendiente" no apareció en el paso Equipos: ${(await modal.innerText()).slice(-500)}`);
    if (!result.headerChipSinRemision) throw new Error('El chip "Sin remisión" no aparece en el breadcrumb del header del modal');
    if (!result.canContinue) throw new Error("La recepción sin formato fue bloqueada indebidamente: debía poder continuar a Preguntas");
} catch (error) { result.error = String(error?.stack || error); }
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
