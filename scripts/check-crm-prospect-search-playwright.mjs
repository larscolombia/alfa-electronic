import { chromium } from "playwright";

const appUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiUrl = process.env.PW_API_BASE_URL || "http://localhost:8080";
const credentials = { email: "admin@alfa.com", password: "1234" };

let browser;
let apiHeaders = null;
let seededProspectId = null;

async function api(pathname, options = {}) {
    const response = await fetch(`${apiUrl}${pathname}`, { headers: apiHeaders, ...options });
    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`API ${options.method || "GET"} ${pathname} falló (${response.status}): ${body.slice(0, 300)}`);
    }
    return response.status === 204 ? null : response.json();
}

try {
    const loginResponse = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify(credentials),
    });
    if (!loginResponse.ok) throw new Error(`Login admin falló (${loginResponse.status}).`);
    const login = await loginResponse.json();
    const session = { ...login, expiresAt: Date.now() + login.expiresIn * 1000 };
    apiHeaders = { Authorization: `Bearer ${login.accessToken}`, "X-Company-Id": "demo-company" };

    // Prospecto deterministico con empresa + contacto DISTINTO + zona para validar el formato del listado:
    // negrita = empresa; debajo, zona/ciudad y nombre del contacto. Si ya existe una fila asi,
    // se reutiliza (no ensuciamos datos); si no, se siembra por API y se limpia al terminar.
    const prospects = ((await api("/api/v1/crm/prospects?limit=500")).items ?? []).map((p) => ({
        name: String(p.name || "").trim(),
        company: String(p.company || "").trim(),
        zone: String(p.zone || "").trim(),
        city: String(p.city || "").trim(),
    }));
    const complete = (p) => p.company && p.name && (p.zone || p.city);
    const distinctContact = (p) => complete(p) && p.name.toLowerCase() !== p.company.toLowerCase();
    let target = prospects.find(distinctContact) ?? prospects.find(complete) ?? null;

    if (!target) {
        const suffix = Date.now();
        target = {
            name: `Contacto Seed ${suffix}`,
            company: `Empresa Seed Busqueda ${suffix}`,
            zone: `ZonaSeed ${suffix}`,
            city: "",
        };
        const created = await api("/api/v1/crm/prospects", {
            method: "POST",
            headers: { ...apiHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ name: target.name, company: target.company, zone: target.zone }),
        });
        seededProspectId = String(created?.id || "");
        if (!seededProspectId) throw new Error("El prospecto sembrado no devolvio id; no se podra limpiar.");
    }

    const company = target.company;
    const contactName = target.name;
    const locacion = target.zone || target.city; // El backend usa zona principal, ciudad como fallback.

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

    await page.getByTestId("prospects-search").fill(company);
    const results = page.getByTestId("prospect-search-results");
    await results.waitFor({ state: "visible" });

    // Formato del listado (peticion del dueño): negrita = empresa; debajo, zona/ciudad y contacto.
    if (company) {
        const firstItem = results.getByRole("link").filter({ hasText: company }).first();
        await firstItem.waitFor({ state: "visible", timeout: 15000 });
        const titleText = String(await firstItem.locator("strong").textContent())?.trim() ?? "";
        if (titleText !== company) throw new Error(`Negrita del resultado debe ser la empresa '${company}', salió '${titleText}'.`);
        const subtitleText = String(await firstItem.locator("small.text-secondary").first().textContent())?.trim() ?? "";
        if (locacion && !subtitleText.toLowerCase().includes(locacion.toLowerCase())) throw new Error(`El subtitle debe incluir la zona/ciudad '${locacion}', salió '${subtitleText}'.`);
        if (contactName && contactName !== company && !subtitleText.includes(contactName)) {
            throw new Error(`El subtitle debe incluir el contacto '${contactName}' (no duplicado en negrita), salió '${subtitleText}'.`);
        }
    }

    // Búsqueda por nombre del contacto sigue encontrando al prospecto (sin regredir index).
    if (contactName && contactName !== company) {
        const nameBox = page.getByTestId("prospects-search");
        await nameBox.fill("");
        await nameBox.press("Enter");
        await page.waitForTimeout(500);
        await nameBox.fill(contactName);
        await results.first().waitFor({ state: "visible", timeout: 15000 });
        const titleByName = String(await results.getByRole("link").first().locator("strong").textContent())?.trim() ?? "";
        if (!titleByName) throw new Error(`La búsqueda por nombre '${contactName}' no devolvió un resultado con negrita.`);
    }

    await results.getByRole("link").first().click();
    await page.waitForURL(/\/app\/crm-prospectos\//);
    console.log(JSON.stringify({ ok: true, seeded: Boolean(seededProspectId), company, contactName, locacion, route: page.url() }));
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
    if (seededProspectId && apiHeaders) {
        try {
            const cleanup = await fetch(`${apiUrl}/api/v1/crm/prospects/${seededProspectId}`, { method: "DELETE", headers: apiHeaders });
            console.log(JSON.stringify({ cleanedUp: cleanup.status === 204, seededProspectId }));
        } catch (cleanupError) {
            console.error(`No se pudo limpiar el prospecto sembrado ${seededProspectId}:`, cleanupError instanceof Error ? cleanupError.message : String(cleanupError));
        }
    }
}
