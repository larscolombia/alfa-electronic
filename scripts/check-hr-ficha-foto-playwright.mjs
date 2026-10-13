/**
 * E2E: la foto del empleado en profile-professional — seleccionar archivo cambia el preview,
 * se guarda con "Actualizar empleado" y persiste tras recargar. Limpia lo que crea.
 */
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
    body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
});
const session = await loginResponse.json();
const token = session.token || session.accessToken;
const authHeaders = { "Content-Type": "application/json", "X-Company-Id": "demo-company", Authorization: `Bearer ${token}` };

const stamp = Date.now();
const emp = await (await fetch(`${baseUrl}/api/v1/hr/employees`, {
    method: "POST", headers: authHeaders,
    body: JSON.stringify({ name: `QA Foto ${stamp}`, status: "Activo" }),
})).json();
const employeeId = emp.id;
console.log("empleado_prueba:", employeeId);

// PNG 1x1 rojo
const pngB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const checks = {};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
await context.addInitScript(
    ([s, api]) => {
        window.localStorage.setItem("pika.auth.session", JSON.stringify(s));
        window.localStorage.setItem("pika.apiBaseUrl", api);
    },
    [{ ...session, expiresAt: Date.now() + 3600 * 1000 }, baseUrl],
);
const page = await context.newPage();
const url = `${baseUrl}/app/profile-professional?source=hr-employees&employeeId=${employeeId}`;

try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);

    const img = page.locator("img[alt='Foto del trabajador']");
    const srcAntes = await img.getAttribute("src");

    await page.locator("input#employeePhotoInput").setInputFiles({
        name: "foto.png", mimeType: "image/png", buffer: Buffer.from(pngB64, "base64"),
    });
    await page.waitForTimeout(1500);
    const srcPreview = await img.getAttribute("src");
    checks.previewCambiaADataUrl = typeof srcPreview === "string" && srcPreview.startsWith("data:image/") && srcPreview !== srcAntes;

    await page.locator("button", { hasText: "Actualizar empleado" }).click();
    await page.waitForTimeout(3000);
    const alerts = await page.locator(".alert-success").allTextContents();
    checks.guardadoOk = alerts.some((t) => t.includes("actualizado"));

    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    const srcDespues = await img.getAttribute("src");
    checks.fotoPersisteTrasRecarga = typeof srcDespues === "string" && srcDespues.startsWith("data:image/");

    await page.screenshot({ path: "playwright-artifacts/hr-ficha-foto-persiste.png" });
} finally {
    await fetch(`${baseUrl}/api/v1/hr/employees/soft-delete`, {
        method: "PATCH", headers: authHeaders,
        body: JSON.stringify([{ employeeId, action: "delete", status: "Inactivo", softDelete: true, requestedAt: new Date().toISOString() }]),
    });
    await browser.close();
}

console.log(JSON.stringify(checks, null, 1));
const failed = Object.entries(checks).filter(([, v]) => v === false);
console.log(failed.length === 0 ? "E2E_FOTO_OK" : `E2E_FOTO_FALLOS: ${failed.map(([k]) => k).join(", ")}`);
process.exit(failed.length === 0 ? 0 : 1);
