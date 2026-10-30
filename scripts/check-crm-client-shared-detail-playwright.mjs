import { chromium } from "playwright";

const appUrl = "http://localhost:4200";
const apiUrl = "http://localhost:8080";
const expectedTabs = ["Perfil", "Contactos relacionados", "Acciones comerciales", "Equipos", "Cotización", "Archivos", "Notas", "Sucursales", "Trazabilidad"];
let browser;

try {
    const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, { method: "POST", headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" }, body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }) });
    if (!loginResponse.ok) throw new Error(`Login admin falló (${loginResponse.status}).`);
    const login = await loginResponse.json();
    const clientsResponse = await fetch(`${apiUrl}/api/v1/crm/clients?limit=1`, { headers: { Authorization: `Bearer ${login.accessToken}`, "X-Company-Id": "demo-company" } });
    const clients = (await clientsResponse.json()).items ?? [];
    if (clients.length === 0) throw new Error("No hay clientes para verificar la ficha.");

    browser = await chromium.launch({ headless: false, slowMo: 180 });
    const page = await browser.newPage();
    await page.addInitScript(({ session, backendUrl }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(session));
        localStorage.setItem("pika.apiBaseUrl", backendUrl);
    }, { session: { ...login, expiresAt: Date.now() + login.expiresIn * 1000 }, backendUrl: apiUrl });
    await page.goto(`${appUrl}/app/crm-clientes/${clients[0].id}`, { waitUntil: "domcontentloaded" });
    console.log(`Ficha de cliente abierta: ${clients[0].id}`);
    await page.waitForTimeout(1000);
    const tabs = await page.locator("[role='tab']").allTextContents();
    const missing = expectedTabs.filter((label) => !tabs.includes(label));
    if (missing.length > 0) throw new Error(`Faltan pestañas de la ficha compartida: ${missing.join(", ")}. Visibles: ${tabs.join(", ")}`);
    console.log(JSON.stringify({ ok: true, clientId: clients[0].id, tabs: expectedTabs }));
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
