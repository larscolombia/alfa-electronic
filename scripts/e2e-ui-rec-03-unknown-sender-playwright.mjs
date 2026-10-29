import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const name = `QA REC03 ${id}`;
const wait = page => page.waitForTimeout(500);
const result = {
    case: "REC-03",
    login: false,
    warningVisible: false,
    noteVisible: false,
    responsibleVisible: false,
    technicianDisabled: false,
    technicianHintVisible: false,
    industrialGatePassed: false,
    facesReady: false,
    saved: false,
    error: "",
};
let browser;
let modal;

const PNG_1X1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const FACE_LABELS = ["Cara frente", "Cara atrás", "Cara izquierda", "Cara derecha"];
const facePaths = FACE_LABELS.map((label, i) => {
    const path = `/tmp/rec03-face-${id}-${i}.png`;
    writeFileSync(path, Buffer.from(PNG_1X1, "base64"));
    return path;
});

try {
    browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${base}/auth/signin`, { waitUntil: "networkidle" });
    await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
    await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
    await page.locator("form.auth-form button[type='submit']").click();
    await page.waitForURL(url => url.href.includes("/app")); result.login = true;
    await page.goto(`${base}/app/crm-prospectos`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
    for (const [field, value] of [["formNombre", name], ["formCompania", `Empresa ${id}`], ["formCorreo", `rec03-${id}@alfa.local`]]) await page.locator(`input[name='${field}']`).fill(value);
    await page.getByTestId("prospect-save-btn").click();
    const row = page.locator("tbody tr", { hasText: name }).first(); await row.waitFor({ state: "visible" });
    await row.getByRole("button", { name: /^Acciones$/ }).click();
    await row.getByRole("button", { name: /Asociar equipo/i }).click(); await wait(page);
    modal = page.locator("app-crm-prospect-equipment-modal");

    // Paso Recepción: activar "No se identifica remitente".
    await modal.getByTestId("sender-unknown-check").check(); await wait(page);
    result.warningVisible = await modal.getByTestId("sender-unknown-warning").isVisible();
    result.noteVisible = await modal.getByTestId("custody-incident-note").isVisible();
    result.responsibleVisible = await modal.getByText("Responsable que registra la incidencia").isVisible();
    await modal.getByTestId("custody-incident-note").fill(`Equipo llegó sin datos de remitente. Empaque cerrado. ${id}`);
    if (!result.warningVisible || !result.noteVisible || !result.responsibleVisible) {
        throw new Error("El warning / nota / responsable de incidencia de custodia no apareció");
    }
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);

    // Paso Equipos: técnico bloqueado + equipo manual.
    result.technicianDisabled = await modal.getByTestId("equipment-modal-technician-0").isDisabled().catch(() => false);
    result.technicianHintVisible = await modal.getByTestId("technician-assignment-blocked").isVisible();
    if (!result.technicianDisabled || !result.technicianHintVisible) {
        throw new Error("La asignación de técnico no quedó bloqueada con su hint");
    }
    await selectCustomModal(page, modal.locator("[data-testid^='equipment-modal-registration-mode-']").first(), "manual");
    for (const [placeholder, value] of [["Familia libre", "Control"], ["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);

    // Paso Preguntas: costo > 2M = Sí (evita el gate REC-01) y se descarta
    // falla de software = Sí (evita el ack de sospecha de software).
    const costSwitch = modal.locator("input[id$='-costAboveTwoMillion']");
    if (!(await costSwitch.isChecked())) await costSwitch.check();
    const softwareSwitch = modal.locator("input[id$='-softwareIssueRuledOut']");
    if (!(await softwareSwitch.isChecked())) await softwareSwitch.check();
    await wait(page);
    result.industrialGatePassed = true;
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);

    // Paso Evidencia: 4 fotos de caras obligatorias.
    await modal.locator("input[type='file'][multiple]").setInputFiles(facePaths);
    await modal.locator(".evidence-photo-card").nth(3).waitFor({ state: "visible", timeout: 30000 }); await wait(page);
    for (let i = 0; i < FACE_LABELS.length; i += 1) {
        await selectCustomModal(page, modal.locator(".evidence-photo-card").nth(i).getByTestId("equipment-modal-evidence-type"), { label: FACE_LABELS[i] }); await wait(page);
    }
    result.facesReady = true;
    await modal.getByTestId("equipment-modal-next").click(); await wait(page);

    // Paso Cierre: guardar (upsert + finalize). El modal se destruye al cerrar.
    await modal.getByTestId("equipment-modal-save").click();
    await page.waitForSelector("app-crm-prospect-equipment-modal", { state: "detached", timeout: 60000 });
    result.saved = true;
} catch (error) {
    result.error = String(error?.stack || error);
    try {
        if (modal) {
            result.debugStepText = (await modal.locator(".wizard-step.active").innerText()).slice(0, 300);
            result.debugFileInputs = await modal.locator("input[type='file']").evaluateAll(inputs => inputs.map(i => ({ accept: i.getAttribute("accept"), multiple: i.hasAttribute("multiple"), testid: i.getAttribute("data-testid") })));
            result.debugValidation = await modal.locator("[data-testid='equipment-modal-validation-message']").innerText().catch(() => "");
        }
    } catch { /* ignore debug errors */ }
}
finally { if (browser) await browser.close(); }
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
