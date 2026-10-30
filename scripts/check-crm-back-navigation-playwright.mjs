import { chromium } from "playwright";

const appUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiUrl = process.env.PW_API_BASE_URL || "http://localhost:8080";
let browser;

try {
    const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email: "admin@alfa.com", password: "1234" }),
    });
    if (!loginResponse.ok) throw new Error(`Login admin falló (${loginResponse.status}).`);
    const login = await loginResponse.json();
    const session = { ...login, expiresAt: Date.now() + login.expiresIn * 1000 };
    const headers = { Authorization: `Bearer ${login.accessToken}`, "X-Company-Id": "demo-company" };
    const [prospectResponse, clientResponse] = await Promise.all([
        fetch(`${apiUrl}/api/v1/crm/prospects?limit=1`, { headers }),
        fetch(`${apiUrl}/api/v1/crm/clients?limit=1`, { headers }),
    ]);
    const prospect = ((await prospectResponse.json()).items ?? [])[0];
    const client = ((await clientResponse.json()).items ?? [])[0];
    if (!prospect?.id || !client?.id) throw new Error("Se requieren un prospecto y un cliente para verificar Volver.");

    browser = await chromium.launch({ headless: false, slowMo: 150 });
    const page = await browser.newPage();
    await page.addInitScript(({ storedSession, storedApiUrl }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        localStorage.setItem("pika.apiBaseUrl", storedApiUrl);
    }, { storedSession: session, storedApiUrl: apiUrl });

    for (const route of ["/app/crm-prospectos", "/app/crm-clientes"]) {
        await page.goto(`${appUrl}${route}`, { waitUntil: "domcontentloaded" });
        await page.locator("button.pika-rail-back").click();
        await page.waitForURL(/\/app\/main-menu/);
    }

    await page.goto(`${appUrl}/app/crm-prospectos/${prospect.id}`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("back-btn").click();
    await page.waitForURL(/\/app\/crm-prospectos$/);

    await page.goto(`${appUrl}/app/crm-clientes/${client.id}`, { waitUntil: "domcontentloaded" });
    await page.locator('a[href="/app/crm-clientes"]').first().waitFor({ state: "visible" });
    await page.locator('a[href="/app/crm-clientes"]').first().click();
    await page.waitForURL(/\/app\/crm-clientes$/);
    console.log(JSON.stringify({ ok: true, headerDestination: "/app/main-menu", detailDestinations: ["/app/crm-prospectos", "/app/crm-clientes"] }));
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
