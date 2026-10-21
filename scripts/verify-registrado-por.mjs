import { chromium } from "playwright";
const api = "http://127.0.0.1:8080";
const loginRes = await fetch(`${api}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
    body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
});
const session = await loginRes.json();
const userName = session.user?.name || "";
console.log("usuario sesion:", JSON.stringify(userName));
session.expiresAt = Date.now() + 3600_000;
const auth = { "Content-Type": "application/json", "X-Company-Id": "demo-company", Authorization: `Bearer ${session.accessToken}` };

const ts = Date.now();
const pr = await fetch(`${api}/api/v1/crm/prospects`, {
    method: "POST", headers: auth,
    body: JSON.stringify({ name: `ZRegPor-${ts}`, email: `zregpor${ts}@t.co`, mobile: "3000000000", company: "ZCorp" }),
});
const prospect = await pr.json();
// crear la accion comercial por API (como la hace la UI al guardar)
await fetch(`${api}/api/v1/crm/prospects/${prospect.id}/followups`, {
    method: "POST", headers: auth,
    body: JSON.stringify({ tipo: "Llamada", fecha: "2026-10-22", hora: "10:30", recordatorio: "", observacion: "verificacion registradoPor", estado: "Pendiente", registradoPor: userName }),
});

const browser = await chromium.launch({ headless: true, executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome" });
const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
await context.addInitScript(({ s, apiBase }) => {
    window.localStorage.setItem("pika.auth.session", JSON.stringify(s));
    window.localStorage.setItem("pika.apiBaseUrl", apiBase);
}, { s: session, apiBase: api });
const page = await context.newPage();
await page.goto(`http://127.0.0.1:4200/app/crm-prospectos/${prospect.id}`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForFunction(() => Array.from(document.querySelectorAll("button.nav-link")).some((n) => (n.textContent || "").trim() === "Contactos relacionados"), null, { timeout: 30000 });
await page.getByRole("button", { name: /Acciones comerciales/i }).first().click();
await page.waitForTimeout(1500);
const cell = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    const row = rows.find((r) => (r.textContent || "").includes("2026-10-22") || (r.textContent || "").includes("22/10/2026"));
    return row ? row.textContent.trim().replace(/\s+/g, " ") : null;
});
console.log("fila registrada:", cell);
console.log("incluye usuario?", cell ? cell.includes(userName) : "sin fila");
await page.screenshot({ path: "verify-registrado-por.png" });
await browser.close();
await fetch(`${api}/api/v1/crm/prospects/${prospect.id}`, { method: "DELETE", headers: auth });
console.log("limpieza OK");
