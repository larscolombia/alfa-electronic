import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://localhost:4200";
const apiBaseUrl = process.env.PW_API_BASE_URL || "http://localhost:8080";
const email = "admin@alfa.com";
const password = "1234";
let browser;

try {
    const loginResponse = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company" },
        body: JSON.stringify({ email, password }),
    });
    if (!loginResponse.ok) throw new Error(`No se pudo iniciar sesión como admin (${loginResponse.status}).`);
    const login = await loginResponse.json();
    const session = { ...login, expiresAt: Date.now() + login.expiresIn * 1000 };

    browser = await chromium.launch({ headless: false, slowMo: 250 });
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log("Inicio de sesión de QA: admin@alfa.com");
    const expected = String(session?.user?.name || session?.user?.email || "").trim();
    if (!expected) throw new Error("La sesión autenticada no incluye nombre ni correo de usuario.");

    await page.addInitScript(({ authenticatedSession, apiUrl }) => {
        localStorage.setItem("pika.auth.session", JSON.stringify(authenticatedSession));
        localStorage.setItem("pika.apiBaseUrl", apiUrl);
    }, { authenticatedSession: session, apiUrl: apiBaseUrl });
    await page.goto(`${baseUrl}/app/crm-prospectos`, { waitUntil: "domcontentloaded" });
    console.log("Ruta de prospectos abierta");
    await page.getByRole("button", { name: /Agregar Prospecto/i }).click();
    console.log("Formulario de prospecto abierto");

    const owner = page.locator("#prospect-owner");
    await owner.waitFor({ state: "attached" });
    await page.waitForTimeout(1500);

    const value = await owner.inputValue();
    const options = await owner.locator("option").allTextContents();
    const visibleValue = await owner.evaluate((select) =>
        select.closest(".choices")?.querySelector(".choices__item--selectable")?.textContent?.trim() || "",
    );
    console.log(JSON.stringify({ expected, value, visibleValue, options }));
    if (value !== expected) {
        throw new Error(`Empleado responsable esperado: ${expected}; recibido: ${value || "(vacío)"}`);
    }
    if (visibleValue !== expected) {
        throw new Error(`El selector visible muestra ${visibleValue || "(vacío)"} en vez de ${expected}.`);
    }
    console.log(JSON.stringify({ ok: true, expected, value }));
} catch (error) {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
} finally {
    await browser?.close();
}
