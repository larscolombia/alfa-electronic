import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const employeeId = process.env.PW_EMPLOYEE_ID || "EMP-007";

const consoleErrors = [];
const failedRequests = [];

const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
});
if (!loginResponse.ok) throw new Error(`Login failed: ${loginResponse.status}`);
const session = await loginResponse.json();
const storedSession = { ...session, expiresAt: Date.now() + 3600 * 1000 };

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } });
await context.addInitScript(
    ([s, api]) => {
        window.localStorage.setItem("pika.auth.session", JSON.stringify(s));
        window.localStorage.setItem("pika.apiBaseUrl", api);
    },
    [storedSession, baseUrl],
);
const page = await context.newPage();
page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
page.on("response", (res) => { if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`); });

const url = `${baseUrl}/app/profile-professional?source=hr-employees&employeeId=${employeeId}`;
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);

// 1. ¿Qué alerta/estado muestra?
const alerts = await page.locator(".alert").allTextContents();
const buttons = await page.locator("button:visible").allTextContents();

// 2. Estado de los inputs clave
const docInput = page.locator("input[name='employeeId']");
const numInput = page.locator("input[name='employeeNumber']");
const nameInput = page.locator("input[name='firstName']");
const docDisabled = await docInput.isDisabled().catch(() => "no existe");
const numDisabled = await numInput.isDisabled().catch(() => "no existe");
const docValue = await docInput.inputValue().catch(() => "no existe");
const numValue = await numInput.inputValue().catch(() => "no existe");
const nameValue = await nameInput.inputValue().catch(() => "no existe");

// 3. Intentar escribir en N° Documento y en Nombre
let typingWorks = "n/a";
try {
    await docInput.click({ timeout: 3000 });
    await docInput.fill("999888777");
    typingWorks = await docInput.inputValue();
} catch (e) {
    typingWorks = `FALLO: ${e.message.split("\n")[0]}`;
}

// 4. Estado del botón Actualizar
const saveBtn = page.locator("button", { hasText: "Actualizar empleado" });
const saveDisabled = await saveBtn.isDisabled().catch(() => "no existe");

await page.screenshot({ path: "playwright-artifacts/hr-ficha-emp007-diagnosis.png", fullPage: false });

console.log(JSON.stringify({
    alerts, buttons, docDisabled, numDisabled, docValue, numValue, nameValue,
    typingWorks, saveDisabled, consoleErrors: consoleErrors.slice(0, 5),
    failedRequests: failedRequests.slice(0, 8),
}, null, 2));

await browser.close();
