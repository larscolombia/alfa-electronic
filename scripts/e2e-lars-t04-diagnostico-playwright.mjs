/**
 * e2e-lars-t04 — TAREA t04: DIAGNÓSTICO TÉCNICO (rol Técnico)
 *
 * Flujo: login Técnico (sufijo t04) → caso propio en kanban (setup admin vía API)
 * → tarjeta en Diagnóstico → checklist + memo diagnóstico + % reparabilidad 85
 * + horas estimadas 6 → validación de cierre → caso pasa a 'Por cotizar' y el
 * memo queda visible para el siguiente actor.
 */
import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium } from "playwright";

const baseUrl = (process.env.PW_BASE_URL || "https://alfa.software.net.co").replace(/\/+$/, "");
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";
const apiBaseUrl = new URL(baseUrl).origin;

const now = Date.now();
const techEmail = `pw-tecnico-t04@alfa.local`;
const techName = "Tecnico PW T04";
const techPassword = "Alfa2026!Pw";
const projectId = `pw-t04-${now}`;
const shortCode = `PW-T04-${now}`;
const memoText = `Memo diagnostico t04 ${now}: falla en fuente de poder, reparabilidad estimada 85%, se requieren repuestos.`;

const result = {
  test: "e2e-lars-t04-diagnostico",
  baseUrl,
  checks: {
    adminLoggedIn: false,
    techUserReady: false,
    techLoggedIn: false,
    caseCreated: false,
    boardLoaded: false,
    cardOpened: false,
    diagnosisBlockVisible: false,
    closeBlockedWhenInvalid: false,
    checklistFilled: false,
    memoAndFieldsFilled: false,
    closeSuccess: false,
    movedToPorCotizar: false,
    audienceTecnicoHidesClosed: false,
    audienceAdministrativoShowsClosed: false,
    persistedAfterReload: false,
    memoVisibleForNextActor: false,
    apiStatusPorCotizar: false,
  },
  codes: { projectId, shortCode },
  messages: { closeError: "", closeSuccess: "" },
  memoPersisted: "",
  consoleErrors: [],
  pageErrors: [],
  screenshots: [],
  error: "",
};

let browser;
let adminSession;
let techSession;

const shot = async (page, label) => {
  const p = path.resolve(artifactsDir, `e2e-lars-t04-${label}-${Date.now()}.png`);
  await page.screenshot({ path: p, fullPage: true });
  result.screenshots.push(p);
  return p;
};

async function login(email, password) {
  const r = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Company-Id": companyId },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`login ${email} failed ${r.status}: ${await r.text()}`);
  const payload = await r.json();
  return { ...payload, expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000 };
}

const headers = (session) => ({
  "Content-Type": "application/json",
  "X-Company-Id": companyId,
  Authorization: `Bearer ${session.accessToken}`,
});

async function ensureTechnician() {
  const r = await fetch(`${apiBaseUrl}/api/v1/users`, {
    method: "POST",
    headers: headers(adminSession),
    body: JSON.stringify({ email: techEmail, password: techPassword, confirmPassword: techPassword, name: techName, role: "Técnico" }),
  });
  return r.status === 201 || r.status === 200 || r.status === 409;
}

async function createCase() {
  const r = await fetch(`${apiBaseUrl}/api/v1/projects`, {
    method: "POST",
    headers: headers(adminSession),
    body: JSON.stringify({
      id: projectId,
      status: "diagnostico",
      properties: {
        shortCode,
        title: `Diagnostico E2E t04 ${now}`,
        assignee: techName,
        clientName: "Cliente E2E t04",
        equipmentName: "Equipo PW-T04",
        equipmentFailureDescription: "No enciende",
        createdBy: techName,
      },
    }),
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}

const fieldInput = (page, label) =>
  page.locator(".project-detail-field", { has: page.locator("span.project-detail-field__label", { hasText: label }) }).locator("input, textarea").first();

const cardByShortCode = (page, code) => page.locator(".project-drag-item", { hasText: code }).first();

async function setRangeValue(page, value) {
  const range = page.locator(".progress-editor input[type='range']").first();
  await range.evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

try {
  adminSession = await login("admin@alfa.com", "1234");
  result.checks.adminLoggedIn = true;

  result.checks.techUserReady = await ensureTechnician();
  techSession = await login(techEmail, techPassword);
  result.checks.techLoggedIn = true;

  const created = await createCase();
  result.checks.caseCreated = created.ok;
  if (!created.ok) result.messages.createCase = `status ${created.status}: ${JSON.stringify(created.body)}`;

  await fs.mkdir(artifactsDir, { recursive: true });
  browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });
  await context.addInitScript(
    ({ authSession, apiBase }) => {
      window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
      window.localStorage.setItem("pika.apiBaseUrl", apiBase);
    },
    { authSession: techSession, apiBase: apiBaseUrl },
  );

  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error" && result.consoleErrors.length < 20) result.consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => { if (result.pageErrors.length < 20) result.pageErrors.push(String(e?.message || e)); });

  await page.goto(`${baseUrl}/app/work-projects`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
  result.checks.boardLoaded = true;
  await shot(page, "01-board-loaded");

  const card = page.locator('[data-column-id="diagnostico"] .project-drag-item', { hasText: shortCode }).first();
  await card.waitFor({ state: "visible", timeout: timeoutMs });
  await card.click();
  await page.waitForSelector(".project-detail-dialog", { state: "visible", timeout: timeoutMs });
  result.checks.cardOpened = true;

  await page.locator("h5", { hasText: "Diagnostico (Posicion 0)" }).first().waitFor({ state: "visible", timeout: timeoutMs });
  result.checks.diagnosisBlockVisible = true;

  const closeBtn = page.getByRole("button", { name: "Cerrar diagnostico" }).first();
  await closeBtn.click();
  const err = page.locator(".project-detail-dialog__feedback.text-danger").first();
  await err.waitFor({ state: "visible", timeout: timeoutMs });
  result.messages.closeError = (await err.textContent()).trim();
  result.checks.closeBlockedWhenInvalid = result.messages.closeError.toLowerCase().includes("no se puede cerrar diagnostico");
  await shot(page, "02-close-blocked-validation");

  for (const label of ["Equipo desarmado", "Prueba estatica realizada", "Prueba de encendido realizada", "Falla identificada"]) {
    const sw = page.locator("label.project-switch", { hasText: label }).first();
    const input = sw.locator("input[type='checkbox']");
    if (!(await input.isChecked())) {
      await sw.click({ force: true });
    }
  }
  await fieldInput(page, "Memo diagnostico").fill(memoText);
  if (await page.getByText("Memo reparacion / intervencion", { exact: true }).count()) {
    throw new Error("El memo de reparación no debe ser visible durante la etapa Diagnóstico.");
  }
  await fieldInput(page, "Horas hombre estimadas").fill("6");
  await fieldInput(page, "Presupuesto repuestos (USD)").fill("150");
  await setRangeValue(page, 85);
  await page
    .locator(".project-detail-field", { has: page.locator("span.project-detail-field__label", { hasText: "Prueba de cierre" }) })
    .locator("select")
    .first()
    .selectOption({ label: "Laboratorio parcial" });
  result.checks.checklistFilled = true;
  result.checks.memoAndFieldsFilled = (await fieldInput(page, "Horas hombre estimadas").inputValue()) === "6";
  await shot(page, "03-diagnosis-form-filled");

  await closeBtn.click();
  const okMsg = page.locator(".project-detail-dialog__feedback.text-success").first();
  await okMsg.waitFor({ state: "visible", timeout: timeoutMs });
  result.messages.closeSuccess = (await okMsg.textContent()).trim();
  result.checks.closeSuccess = result.messages.closeSuccess.toLowerCase().includes("por cotizar");
  await shot(page, "04-diagnosis-closed");

  await page.getByRole("button", { name: "Cancelar" }).first().click();
  await page.waitForSelector(".project-detail-dialog", { state: "hidden", timeout: timeoutMs });

  const inDiagnostico = await page.locator('[data-column-id="diagnostico"] .project-drag-item', { hasText: shortCode }).count();
  const inPorCotizar = await page.locator('[data-column-id="por-cotizar"] .project-drag-item', { hasText: shortCode }).count();
  result.checks.movedToPorCotizar = inDiagnostico === 0 && inPorCotizar > 0;
  await shot(page, "05-board-por-cotizar");

  const chip = (label) => page.locator(".board-audience-chip", { hasText: label }).first();
  await chip("Tecnico").click();
  await page.waitForTimeout(400);
  result.checks.audienceTecnicoHidesClosed = (await cardByShortCode(page, shortCode).count()) === 0;

  await chip("Administrativo").click();
  await page.waitForTimeout(400);
  result.checks.audienceAdministrativoShowsClosed = (await cardByShortCode(page, shortCode).count()) > 0;

  await chip("Todos").click();
  await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
  result.checks.persistedAfterReload = (await cardByShortCode(page, shortCode).count()) > 0;

  await cardByShortCode(page, shortCode).first().click();
  await page.waitForSelector(".project-detail-dialog", { state: "visible", timeout: timeoutMs });
  result.memoPersisted = (await fieldInput(page, "Memo diagnostico").inputValue()).trim();
  result.checks.memoVisibleForNextActor = result.memoPersisted.includes(memoText.slice(0, 40));
  await shot(page, "06-memo-visible-next-actor");

  const apiProject = await fetch(`${apiBaseUrl}/api/v1/projects/${encodeURIComponent(projectId)}`, { headers: headers(adminSession) });
  if (apiProject.ok) {
    const p = await apiProject.json();
    result.codes.apiStatus = p.status;
    result.codes.apiShortCode = p.properties?.shortCode || "";
    result.codes.diagnosisClosedBy = p.properties?.diagnosisClosedAt ? (p.properties?.diagnosisClosedBy || "") : "";
    result.codes.repairabilityPercent = p.properties?.repairabilityPercent;
    result.codes.estimatedHours = p.properties?.estimatedHours;
    result.checks.apiStatusPorCotizar = p.status === "por-cotizar" && Boolean(p.properties?.diagnosisClosedAt);
  }

  try {
    await page.getByRole("button", { name: "Cancelar" }).first().click({ timeout: 10000 });
  } catch {
    // Cierre del dialog no es parte de los checks; la navegacion SPA puede no completar.
  }

  const failed = Object.entries(result.checks).filter(([, v]) => !v);
  const out = path.resolve(artifactsDir, `e2e-lars-t04-results-${now}.json`);
  await fs.writeFile(out, JSON.stringify(result, null, 2));

  if (failed.length) {
    console.error("E2E_LARS_T04_FAILED: " + failed.map(([k]) => k).join(", "));
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.log("E2E_LARS_T04_OK");
    console.log(JSON.stringify(result, null, 2));
  }
  console.log("RESULTS_JSON: " + out);
} catch (error) {
  result.error = String(error?.stack || error);
  try {
    const pg = browser?.contexts()?.[0]?.pages()?.[0];
    if (pg) await shot(pg, "fail");
  } catch {}
  console.error("E2E_LARS_T04_ERROR");
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
