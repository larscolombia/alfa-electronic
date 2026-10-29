import { chromium } from "playwright";

const base = (process.env.PW_BASE_URL || "http://127.0.0.1:4201").replace(/\/$/, "");
const headless = process.env.PW_HEADLESS !== "false";
const intervalMs = 5_000;
const views = [
  { path: "/app/crm-prospectos", durationMs: 75_000, label: "CRM" },
  { path: "/app/work-projects", durationMs: 150_000, label: "Proyecto", openFirstProject: true },
];

const browser = await chromium.launch({ headless });
const context = await browser.newContext();
const page = await context.newPage();
const pageErrors = [];
let catalogRequests = 0;
page.on("pageerror", error => pageErrors.push(error.message));
page.on("request", request => {
  if (request.url().includes("/api/v1/equipment-catalog")) catalogRequests++;
});

async function responsive(label) {
  const probe = page.evaluate(() => ({
    title: document.title,
    path: location.pathname,
    now: performance.now(),
    visible: Boolean(document.body?.textContent?.trim()),
  }));
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label}: el hilo de la página no respondió en 8 segundos`)), 8_000);
  });
  const result = await Promise.race([probe, timeout]);
  if (!result.visible) throw new Error(`${label}: página vacía`);
  return result;
}

try {
  await page.goto(`${base}/auth/signin`, { waitUntil: "domcontentloaded" });
  if (await page.locator("#emailadd").waitFor({ state: "visible", timeout: 15_000 }).then(() => true).catch(() => false)) {
    await page.locator("#emailadd").fill(process.env.PW_USER_EMAIL || "admin@alfa.com");
    await page.locator("#passwd").fill(process.env.PW_USER_PASSWORD || "1234");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL(/\/app\//);
  }

  for (const view of views) {
    await page.goto(`${base}${view.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2_000);
    if (view.openFirstProject) {
      const compactToggle = page.locator(".compact-mode-toggle input[type=checkbox]").first();
      if (await compactToggle.isChecked().catch(() => false)) await compactToggle.uncheck();
      const card = page.locator(".project-card").first();
      await card.waitFor({ state: "visible", timeout: 20_000 });
      await card.click();
      await page.locator(".project-detail-dialog").waitFor({ state: "visible" });
    }
    const initial = await responsive(view.label);
    if (!initial.path.startsWith(view.path)) throw new Error(`${view.label}: redirección inesperada a ${initial.path}`);
    const samples = Math.ceil(view.durationMs / intervalMs);
    for (let index = 0; index < samples; index++) {
      await page.waitForTimeout(intervalMs);
      await responsive(view.label);
      if ((index + 1) % 6 === 0) console.log(`${view.label}: ${(index + 1) * 5}s, responde`);
    }
  }

  if (pageErrors.length) throw new Error(`Errores JS: ${pageErrors.slice(0, 3).join(" | ")}`);
  if (catalogRequests > 8) throw new Error(`Carga repetida del catálogo: ${catalogRequests} solicitudes`);
  console.log(`FRONTEND_IDLE_SUCCESS catalogRequests=${catalogRequests}`);
} finally {
  await browser.close({ reason: "Prueba de estabilidad completada" });
}
