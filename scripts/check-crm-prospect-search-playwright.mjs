import { chromium } from "playwright";

const appUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiUrl = process.env.PW_API_BASE_URL || "http://localhost:8080";
const credentials = { email: "admin@alfa.com", password: "1234" };
let browser;

try {
    const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify(credentials),
    });
    if (!loginResponse.ok) throw new Error(`Login admin falló (${loginResponse.status}).`);
    const login = await loginResponse.json();
    const session = { ...login, expiresAt: Date.now() + login.expiresIn * 1000 };
    const headers = { Authorization: `Bearer ${login.accessToken}`, "X-Company-Id": "demo-company" };
    const prospectsResponse = await fetch(`${apiUrl}/api/v1/crm/prospects?limit=1`, { headers });
    const prospects = (await prospectsResponse.json()).items ?? [];
    if (prospects.length === 0) throw new Error("No hay prospectos para verificar la búsqueda.");
    const query = String(prospects[0].company || prospects[0].name).trim();

    browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.addInitScript(({ storedSession, storedApiUrl }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        localStorage.setItem("pika.apiBaseUrl", storedApiUrl);
    }, { storedSession: session, storedApiUrl: apiUrl });
    await page.goto(`${appUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded" });

    const accordions = page.locator("#main-content > details");
    const searchCard = accordions.nth(0);
    const formCard = accordions.nth(1);
    await formCard.locator(":scope > summary").click();
    await page.waitForFunction(() => {
        const cards = document.querySelectorAll("#main-content > details");
        return cards.length >= 2 && cards[0] instanceof HTMLDetailsElement && cards[1] instanceof HTMLDetailsElement && !cards[0].open && cards[1].open;
    });
    await searchCard.locator(":scope > summary").click();
    await page.waitForFunction(() => {
        const cards = document.querySelectorAll("#main-content > details");
        return cards.length >= 2 && cards[0] instanceof HTMLDetailsElement && cards[1] instanceof HTMLDetailsElement && cards[0].open && !cards[1].open;
    });

    await page.getByTestId("prospects-search").fill(query);
    const results = page.getByTestId("prospect-search-results");
    await results.waitFor({ state: "visible" });
    const firstResult = results.getByRole("link").first();
    await firstResult.click();
    await page.waitForURL(/\/app\/crm-prospectos\//);
    console.log(JSON.stringify({ ok: true, query, route: page.url() }));
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
