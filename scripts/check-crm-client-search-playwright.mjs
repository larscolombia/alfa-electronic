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
    const clientsResponse = await fetch(`${apiUrl}/api/v1/crm/clients?limit=1`, { headers });
    const clients = (await clientsResponse.json()).items ?? [];
    if (clients.length === 0) throw new Error("No hay clientes para verificar la búsqueda.");
    const query = String(clients[0].company || clients[0].empresa || clients[0].name || clients[0].nombre).trim();

    browser = await chromium.launch({ headless: false, slowMo: 200 });
    const page = await browser.newPage();
    await page.addInitScript(({ storedSession, storedApiUrl }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(storedSession));
        localStorage.setItem("pika.apiBaseUrl", storedApiUrl);
    }, { storedSession: session, storedApiUrl: apiUrl });
    await page.goto(`${appUrl}/app/crm-clientes`, { waitUntil: "domcontentloaded" });

    const searchCard = page.getByTestId("clients-list-card");
    const formCard = page.getByTestId("client-form-card");
    const [searchBox, formBox] = await Promise.all([searchCard.boundingBox(), formCard.boundingBox()]);
    if (!searchBox || !formBox || Math.abs(searchBox.width - formBox.width) > 1) {
        throw new Error("Los acordeones de búsqueda y creación de clientes no tienen el mismo ancho.");
    }
    if (await searchCard.locator("table").count() !== 0) throw new Error("La lista heredada de clientes sigue renderizada.");

    await formCard.locator(":scope > summary").click();
    await page.waitForFunction(() => {
        const search = document.querySelector('[data-testid="clients-list-card"]');
        const form = document.querySelector('[data-testid="client-form-card"]');
        return search instanceof HTMLDetailsElement && form instanceof HTMLDetailsElement && !search.open && form.open;
    });
    await searchCard.locator(":scope > summary").click();
    await page.waitForFunction(() => {
        const search = document.querySelector('[data-testid="clients-list-card"]');
        const form = document.querySelector('[data-testid="client-form-card"]');
        return search instanceof HTMLDetailsElement && form instanceof HTMLDetailsElement && search.open && !form.open;
    });

    await page.getByTestId("clients-search").fill(query);
    const results = page.getByTestId("client-search-results");
    await results.waitFor({ state: "visible" });
    await results.getByRole("link").first().click();
    await page.waitForURL(/\/app\/crm-clientes\//);
    console.log(JSON.stringify({ ok: true, query, route: page.url(), width: searchBox.width }));
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
