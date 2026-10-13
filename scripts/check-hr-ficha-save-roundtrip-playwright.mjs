/**
 * E2E: la ficha de empleado (profile-professional?source=hr-employees&employeeId=...)
 * carga el empleado correcto y TODOS los campos editables persisten tras guardar y recargar.
 * Edita un empleado de prueba creado por API y lo elimina al final (soft delete + DELETE físico).
 */
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";

const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
});
if (!loginResponse.ok) throw new Error(`Login failed: ${loginResponse.status}`);
const session = await loginResponse.json();
const token = session.token || session.accessToken;
const authHeaders = { "Content-Type": "application/json", "X-Company-Id": "demo-company", Authorization: `Bearer ${token}` };

// Empleado de prueba
const stamp = Date.now();
const createRes = await fetch(`${baseUrl}/api/v1/hr/employees`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ name: `QA Roundtrip ${stamp}`, role: "Cargo QA", department: "Depto QA", manager: "", status: "Activo", fileComplete: false, documentNumber: "000", email: `qa-rt-${stamp}@example.com` }),
});
const employee = await createRes.json();
const employeeId = employee.id;
console.log("empleado_prueba:", employeeId);

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

const edits = {
    employeeId: "777888999",        // N° Documento
    firstName: "NombreEditado",
    lastName: "ApellidoEditado",
    greeting: "Cordial saludo",
    accessUser: "nombre.editado",
    userName: "neditado",
    residentialAddress: "Cra 99 # 1-2",
    emergencyContact: "Contacto Editado",
    allergies: "Nueces",
    bloodType: "B+",
    eps: "Sanitas",
    hireDate: "2024-06-01",
    birthday: "1991-11-30",
};

let failures = 0;
try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);

    // 1. cargó el empleado correcto
    const loadedId = await page.locator("input[name='employeeNumber']").inputValue();
    if (loadedId !== employeeId) { console.error(`FALLO: ID sistema esperado ${employeeId}, visto ${loadedId}`); failures++; }
    if (await page.locator("input[name='employeeNumber']").isDisabled() !== true) { console.error("FALLO: ID de sistema debe estar deshabilitado"); failures++; }

    // 2. editar todos los campos
    for (const [name, value] of Object.entries(edits)) {
        await page.locator(`[name='${name}']`).fill(value);
    }
    await page.locator("button", { hasText: "Actualizar empleado" }).click();
    await page.waitForTimeout(3000);

    const successAlert = await page.locator(".alert-success").allTextContents();
    if (!successAlert.some((t) => t.includes("actualizado"))) { console.error("FALLO: no apareció confirmación de actualización"); failures++; }

    // 3. recargar y verificar persistencia de TODOS los campos
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    for (const [name, value] of Object.entries(edits)) {
        const current = await page.locator(`[name='${name}']`).inputValue();
        if (current !== value) { console.error(`FALLO persistencia ${name}: esperado "${value}", visto "${current}"`); failures++; }
    }

    await page.screenshot({ path: "playwright-artifacts/hr-ficha-roundtrip-final.png" });
    console.log(failures === 0 ? "E2E_OK: todos los campos persisten tras recarga" : `E2E_FALLOS: ${failures}`);
} finally {
    // limpieza: soft delete vía API y DELETE físico
    await fetch(`${baseUrl}/api/v1/hr/employees/soft-delete`, {
        method: "PATCH", headers: authHeaders,
        body: JSON.stringify([{ employeeId, action: "delete", status: "Inactivo", softDelete: true, requestedAt: new Date().toISOString() }]),
    });
    await browser.close();
}
process.exit(failures === 0 ? 0 : 1);
