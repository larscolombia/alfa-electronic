import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env["APP_URL"] || "http://127.0.0.1:4200";
const browser = await chromium.launch({ headless: true });

async function audit(path, authenticated = false) {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    if (authenticated) {
        await page.addInitScript(() => {
            localStorage.setItem("pika.auth.session", JSON.stringify({
                accessToken: "ux-audit",
                tokenType: "Bearer",
                expiresIn: 3600,
                expiresAt: Date.now() + 3_600_000,
                user: { email: "qa@example.test", name: "QA UX", role: "admin" },
            }));
        });
        await page.route("**/api/**", (route) => route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "{}",
        }));
    }

    await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    const result = await page.evaluate(() => {
        const selects = [...document.querySelectorAll("select")];
        return {
            activeElement: document.activeElement?.id || document.activeElement?.tagName,
            enhanced: selects.filter((select) => select.dataset["choice"] === "active").length,
            liveRegion: !!document.querySelector('[aria-live="polite"]'),
            searchInputs: document.querySelectorAll(".choices input.choices__input--cloned").length,
            selects: selects.length,
            skipLink: !!document.querySelector(".app-skip-link"),
            unlabelled: selects.filter((select) => !select.getAttribute("aria-label") && !(select.id && document.querySelector(`label[for="${select.id}"]`))).length,
        };
    });

    assert.equal(pageErrors.length, 0, `${path}: errores de página: ${pageErrors.join("; ")}`);
    assert.equal(result.enhanced, result.selects, `${path}: hay selectores sin mejorar`);
    assert.equal(result.searchInputs, result.selects, `${path}: hay selectores sin buscador`);
    assert.equal(result.unlabelled, 0, `${path}: hay selectores sin nombre accesible`);
    assert.equal(result.skipLink, true, `${path}: falta salto al contenido`);
    assert.equal(result.liveRegion, true, `${path}: falta anuncio de navegación`);
    await page.close();
    return result;
}

try {
    const signup = await audit("/auth/signup");
    const dashboard = await audit("/app/dashboard", true);
    console.log(JSON.stringify({ signup, dashboard }, null, 2));
    console.log("OK: línea base UX verificada en rutas pública y protegida.");
} finally {
    await browser.close();
}
