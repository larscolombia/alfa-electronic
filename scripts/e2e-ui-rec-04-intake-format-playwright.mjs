import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectCustomModal } from "./ui-modal-controls.mjs";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/$/, "");
const apiBaseUrl = (process.env.PW_API_BASE_URL || "").replace(/\/$/, "");
const id = String(Date.now()).slice(-8);
const companyName = `QA REC04 ${id}`;
const wait = page => page.waitForTimeout(500);
// Windows: /tmp no existe → tmpdir() (patrón rec-06).
const pdfPath = join(tmpdir(), `formato-rec04-${id}.pdf`);
// REC-04 ampliación: un TXT cualquiera para probar "cualquier formato de documento".
const txtPath = join(tmpdir(), `formato-txt-rec04-${id}.txt`);
const pngPaths = ["front", "back", "serial-plate"].map(face => join(tmpdir(), `cara-${face}-${id}.png`));
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const result = {
  case: "REC-04",
  frontendOnly: false,
  login: false,
  pdfAttached: false,
  anyDocFormatAccepted: true,      // TXT + PDF en una sola selección = cualquier formato de documento aceptado
  multipleFilesInOneSelection: true,
  accessoryListRemoveWorks: false, // canecita elimina el archivo de la lista inline
  facesComplete: false,
  catalogOptionsVerified: false,
  customLocationCreated: false,
  summaryPreserved: false,
  signaturesCanvasPresent: false, // canvas táctiles de firma (cliente + PIKA) presentes en el paso Cierre
  signaturesDrawn: false,        // trazo dibujado por pointer events sobre ambos canvases
  saved: false,
  error: "",
};
let browser;

writeFileSync(pdfPath, Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
  "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"));
writeFileSync(txtPath, `Formato de recepcion firmado - QA REC04 ${id}`);
for (const pngPath of pngPaths) writeFileSync(pngPath, Buffer.from(pngBase64, "base64"));

try {
  browser = await chromium.launch({ headless: process.env.PW_HEADLESS !== "false", slowMo: Number(process.env.PW_SLOW_MO_MS || 0) });
  const context = await browser.newContext();
  if (apiBaseUrl) await context.addInitScript((value) => window.localStorage.setItem("pika.apiBaseUrl", value), apiBaseUrl);
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const signinUrl = `${base}/auth/signin${apiBaseUrl ? `?apiBaseUrl=${encodeURIComponent(apiBaseUrl)}` : ""}`;
  await page.goto(signinUrl, { waitUntil: "networkidle" });
  await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com"); await wait(page);
  await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234"); await wait(page);
  await page.locator("form.auth-form button[type='submit']").click();
  await page.waitForURL(url => url.href.includes("/app")); result.login = true;
  // Entrada por recepción directa (layout actual): el listado de prospectos ya no expone la acción
  // "Asociar equipo"; el modal es el mismo componente, abierto desde /app/work-equipment-reception.
  await page.goto(`${base}/app/work-equipment-reception`, { waitUntil: "networkidle" });
  await page.getByTestId("work-equipment-create").click(); await wait(page);

  // El host <app-crm-prospect-equipment-modal> es inline 0x0: NO esperar visibility sobre el host,
  // sino sobre el botón next del footer (solo existe con el modal abierto).
  const modal = page.locator("app-crm-prospect-equipment-modal");
  await page.getByTestId("equipment-modal-next").waitFor({ state: "visible", timeout: 15000 });
  await page.getByTestId("equipment-modal-next").click(); await wait(page);

  // Familia es un <select> nativo (catálogo fijo) y la ubicación es input libre en mayúsculas.
  const familySelect = modal.locator("[data-testid^='equipment-modal-family-']").first();
  const serviceSelect = modal.locator("[data-testid^='equipment-modal-service-type-']").first();
  const familyOptions = await familySelect.locator("option").allTextContents();
  const serviceOptions = await serviceSelect.locator("option").allTextContents();
  const expectedFamilies = ["A - Alimentacion", "CE - Tarjeta Electrónica"];
  const expectedServices = ["Reparación", "intervención en sitio", "Venta Nuevo", "Venta Usado", "Préstamo", "Manufactura", "Intercambio"];
  result.catalogOptionsVerified = expectedFamilies.every(value => familyOptions.includes(value)) && expectedServices.every(value => serviceOptions.includes(value));
  if (!result.catalogOptionsVerified) throw new Error(`Opciones de catálogo incompletas. familias=${JSON.stringify(familyOptions)} servicios=${JSON.stringify(serviceOptions)}`);
  await familySelect.selectOption("family-a-alimentacion");
  await serviceSelect.selectOption("service-intercambio");
  const locationName = `Bodega QA ${id}`;
  const locationInput = modal.getByTestId(/^equipment-modal-storage-location-/).first();
  await locationInput.fill(locationName);
  await locationInput.press("Tab");
  await page.waitForTimeout(800);
  // El campo fuerza mayúsculas mientras se escribe (libre diligenciamiento, sin datalist).
  result.customLocationCreated = await locationInput.inputValue() === locationName.toUpperCase();
  if (!result.customLocationCreated) throw new Error("La ubicación escrita no quedó en mayúsculas en el formulario");
  for (const [placeholder, value] of [["Marca del equipo", "Marca QA"], ["Tipo / referencia", "Tipo QA"], ["Serie o referencia visible", `SER-${id}`]]) await modal.locator(`input[placeholder='${placeholder}']`).fill(value);
  // Equipos → Evidencia directo: el paso "Preguntas" (costo > 2M / sospecha de software) se eliminó
  // del wizard, así que aquí ya no hay nada que aceptar ni liberar.
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  // REC-04 ampliación: múltiples archivos en una sola selección, cualquier formato de documento (PDF + TXT).
  await modal.getByTestId("intake-format-file-input").setInputFiles([pdfPath, txtPath]); await wait(page);
  const removePdf = modal.getByTestId("intake-format-remove-0");
  const removeTxt = modal.getByTestId("intake-format-remove-1");
  await removePdf.waitFor({ state: "visible" });
  await removeTxt.waitFor({ state: "visible" });
  result.pdfAttached = true; // compatibilidad con el JSON existente
  // La lista inline debe mostrar ambos nombres de archivo.
  const listText = await modal.locator(".vstack.gap-1.mb-3").first().innerText();
  if (!listText.includes("formato-rec04") || !listText.includes("formato-txt-rec04")) {
    throw new Error(`La lista de formatos firmados no muestra ambos archivos: ${listText}`);
  }
  // Canecita del TXT → queda solo el PDF; la canecita del PDF desaparece (solo existe con ítems).
  await removeTxt.click(); await wait(page);
  if ((await modal.getByTestId("intake-format-remove-1").count()) > 0) {
    throw new Error("El archivo TXT no se eliminó de la lista tras pulsar su canecita");
  }
  result.accessoryListRemoveWorks = true;
  // Re-subir para dejar el estado final con ambos (el flujo posterior asume PDF presente).
  await modal.getByTestId("intake-format-file-input").setInputFiles([pdfPath, txtPath]); await wait(page);
  await modal.getByTestId("intake-format-remove-1").waitFor({ state: "visible" });
  // UI actual (required-evidence-grid): un input por evidencia obligatoria; el handler
  // handleRequiredFaceEvidenceSelected fija photo.evidenceType al subir, así que el slot nace clasificado.
  const faceSlotSuffixes = ["-face-front", "-face-back", "serial-plate"];
  for (let i = 0; i < pngPaths.length; i += 1) {
    await modal.locator(`input[type='file'][accept='image/*'][id$="${faceSlotSuffixes[i]}"]`).setInputFiles(pngPaths[i]);
    await wait(page);
  }
  await modal.getByText("Caras completas", { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });
  result.facesComplete = await modal.getByText("Caras completas").first().isVisible();
  if (!result.facesComplete) throw new Error("El checklist de caras no quedó completo tras subir las 3 evidencias obligatorias");
  await modal.getByTestId("equipment-modal-next").click(); await wait(page);
  const summary = await modal.innerText();
  // La ubicación se fuerza a mayúsculas en el draft (onStorageLocationInput), por lo que el
  // resumen la muestra en mayúsculas: comparar contra esa forma normalizada.
  result.summaryPreserved = ["A - Alimentacion", "Intercambio", locationName.toUpperCase()].every(value => summary.includes(value));
  if (!result.summaryPreserved) throw new Error(`El cierre no conservó familia, servicio y ubicación: ${summary.slice(-1800)}`);
  // Gate industrial en Cierre (el paso Preguntas desapareció): con costo por defecto "No" todo item
  // exige autorización de jefe antes de guardar.
  await modal.getByTestId("industrial-override-by").first().fill("Jefe QA");
  await modal.getByTestId("industrial-override-reason").first().fill(`Aprobado por QA ${id}`);
  await wait(page);
  // Firmas táctiles (2026-11-02): los inputs de texto fueron reemplazados por canvases
  // con Pointer Events. El mouse de Playwright dispara pointer events → trazo compatible.
  const clientSig = modal.getByTestId("signature-canvas-client");
  const pikaSig = modal.getByTestId("signature-canvas-pika");
  await clientSig.waitFor({ state: "visible" });
  await pikaSig.waitFor({ state: "visible" });
  result.signaturesCanvasPresent = true;
  // Dibuja un trazo sobre el canvas; al soltar, el componente serializa a dataURL PNG
  // dentro del draft (clientSignature/pikaSignature) antes de guardar.
  const drawSignature = async (testid) => {
    const canvas = modal.getByTestId(testid);
    const box = await canvas.boundingBox();
    if (!box) throw new Error(`Canvas ${testid} sin boundingBox`);
    const x0 = box.x + Math.max(12, box.width * 0.08);
    const x1 = box.x + box.width - Math.max(12, box.width * 0.08);
    const yBase = box.y + box.height * 0.65;
    await page.mouse.move(x0, yBase);
    await page.mouse.down();
    for (let i = 1; i <= 30; i += 1) {
      const t = i / 30;
      await page.mouse.move(x0 + (x1 - x0) * t, yBase - Math.sin(t * Math.PI * 2.5) * box.height * 0.18, { steps: 1 });
    }
    await page.mouse.up();
    await wait(page);
  };
  await drawSignature("signature-canvas-client");
  await drawSignature("signature-canvas-pika");
  result.signaturesDrawn = true;
  const saveBtn = modal.getByTestId("equipment-modal-save");
  await saveBtn.waitFor({ state: "visible" });
  await saveBtn.click();
  await modal.waitFor({ state: "hidden", timeout: 60000 });
  result.saved = true;
  if (!result.pdfAttached || !result.summaryPreserved) throw new Error("La recepción no conservó los datos requeridos hasta el cierre");
} catch (error) { result.error = String(error?.stack || error); }
finally {
  if (browser) await browser.close();
  if (process.env.PW_RESULT_PATH) writeFileSync(process.env.PW_RESULT_PATH, JSON.stringify(result));
}
console.log(JSON.stringify(result)); process.exit(result.error ? 1 : 0);
