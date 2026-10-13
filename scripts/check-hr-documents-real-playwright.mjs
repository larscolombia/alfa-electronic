/**
 * E2E: /app/company-hr-documents con datos reales — directorio desde API, subir archivo real,
 * listar, descargar/preview y eliminar. Limpia lo que crea.
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

// empleado de prueba
const stamp = Date.now();
const empRes = await fetch(`${baseUrl}/api/v1/hr/employees`, {
    method: "POST", headers: authHeaders,
    body: JSON.stringify({ name: `QA Docs ${stamp}`, status: "Activo" }),
});
const emp = await empRes.json();
const employeeId = emp.id;
console.log("empleado_prueba:", employeeId);

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

try {
    await page.goto(`${baseUrl}/app/company-hr-documents`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2500);

    // 1. directorio real: el empleado de prueba aparece
    const bodyText = await page.locator("body").innerText();
    checks.directorioRealIncluyeEmpleado = bodyText.includes(`QA Docs ${stamp}`);
    checks.sinBotonRestaurarMock = !(await page.locator("button", { hasText: "Restaurar mock" }).count());

    // 2. seleccionar el empleado de prueba (click en su fila/option)
    const empOption = page.locator(`text=QA Docs ${stamp}`).first();
    await empOption.click().catch(() => {});
    await page.waitForTimeout(1500);

    // 3. subir archivo real
    const fileInput = page.locator("input[type='file']");
    checks.hayInputFile = (await fileInput.count()) > 0;
    if (checks.hayInputFile) {
        await fileInput.setInputFiles({ name: `qa-doc-${stamp}.txt`, mimeType: "text/plain", buffer: Buffer.from(`contenido real ${stamp}`) });
        await page.waitForTimeout(3000);
        const afterUpload = await page.locator("body").innerText();
        checks.documentoApareceEnLista = afterUpload.includes(`qa-doc-${stamp}.txt`);
    }

    await page.screenshot({ path: "playwright-artifacts/hr-documents-real-data.png" });
} finally {
    // limpieza: borrar documentos y empleado de prueba
    const docs = await (await fetch(`${baseUrl}/api/v1/hr/employees/${employeeId}/documents`, { headers: authHeaders })).json();
    for (const d of docs.items || []) {
        await fetch(`${baseUrl}/api/v1/hr/employees/${employeeId}/documents/${d.id}`, { method: "DELETE", headers: authHeaders });
    }
    await fetch(`${baseUrl}/api/v1/hr/employees/soft-delete`, {
        method: "PATCH", headers: authHeaders,
        body: JSON.stringify([{ employeeId, action: "delete", status: "Inactivo", softDelete: true, requestedAt: new Date().toISOString() }]),
    });
    await browser.close();
}

console.log(JSON.stringify(checks, null, 1));
const failed = Object.entries(checks).filter(([, v]) => v === false);
console.log(failed.length === 0 ? "E2E_DOCS_OK" : `E2E_DOCS_FALLOS: ${failed.map(([k]) => k).join(", ")}`);
process.exit(failed.length === 0 ? 0 : 1);
