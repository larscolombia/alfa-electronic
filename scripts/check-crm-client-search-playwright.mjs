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
    const clientsResponse = await fetch(`${apiUrl}/api/v1/crm/clients?limit=500`, { headers });
    const clients = (await clientsResponse.json()).items ?? [];
    if (clients.length === 0) throw new Error("No hay clientes para verificar la búsqueda.");

    // Cliente deterministico con empresa + contacto + zona para validar el formato del listado:
    // negrita = empresa; debajo, zona · contacto.
    // Preferir uno con contacto DISTINTO de la empresa: ejercita el subtitle 'zona · contacto'
    // y la búsqueda por nombre sin caer en el caso degenerado nombre === empresa.
    const complete = (c) => String(c.empresa || "").trim() && String(c.nombre || "").trim() && String(c.zona || "").trim();
    const distinctContact = (c) => complete(c) && String(c.nombre).trim().toLowerCase() !== String(c.empresa).trim().toLowerCase();
    const target = clients.find(distinctContact) ?? clients.find(complete) ?? clients[0];
    const company = String(target.empresa || target.company || "").trim();
    const contactName = String(target.nombre || target.name || "").trim();
    const zone = String(target.zona || target.zone || "").trim();
    const query = company || contactName;

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

    // Formato del listado (peticion del dueño): negrita = empresa; debajo, zona y contacto.
    if (company) {
        const firstItem = results.getByRole("link").filter({ hasText: company }).first();
        await firstItem.waitFor({ state: "visible", timeout: 15000 });
        const titleText = String(await firstItem.locator("strong").textContent())?.trim() ?? "";
        if (titleText !== company) throw new Error(`Negrita del resultado debe ser la empresa '${company}', salió '${titleText}'.`);
        const subtitleText = String(await firstItem.locator("small.text-secondary").first().textContent())?.trim() ?? "";
        if (zone && !subtitleText.toLowerCase().includes(zone.toLowerCase())) throw new Error(`El subtitle debe incluir la zona '${zone}', salió '${subtitleText}'.`);
        if (contactName && company !== contactName && !subtitleText.includes(contactName)) {
            throw new Error(`El subtitle debe incluir el contacto '${contactName}' (no duplicado en negrita), salió '${subtitleText}'.`);
        }
    }

    // Búsqueda por nombre del contacto sigue encontrando al cliente (sin regredir index).
    if (contactName && contactName !== company) {
        await page.getByTestId("clients-search").fill("");
        await page.getByTestId("clients-search").press("Enter");
        await page.waitForTimeout(500);
        const nameBox = page.getByTestId("clients-search");
        await nameBox.fill(contactName);
        await results.first().waitFor({ state: "visible", timeout: 15000 });
        const linkByName = results.getByRole("link").first();
        const titleByName = String(await linkByName.locator("strong").textContent())?.trim() ?? "";
        if (!titleByName) throw new Error(`La búsqueda por nombre '${contactName}' no devolvió un resultado con negrita.`);
    }

    await results.getByRole("link").first().click();
    await page.waitForURL(/\/app\/crm-clientes\//);
    console.log(JSON.stringify({ ok: true, query, company, contactName, zone, route: page.url(), width: searchBox.width }));
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
