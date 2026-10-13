import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "https://alfa.software.net.co";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());
const userEmail = process.env.PW_USER_EMAIL || "admin@alfa.com";
const userPassword = process.env.PW_USER_PASSWORD || "1234";
const companyId = process.env.PW_COMPANY_ID || "demo-company";
const artifactsDir = process.env.PW_ARTIFACTS_DIR || "playwright-artifacts";

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
const apiBaseUrl = (() => {
  if (process.env.PW_API_BASE_URL) {
    return String(process.env.PW_API_BASE_URL).replace(/\/+$/, "");
  }

  const parsed = new URL(normalizedBaseUrl);
  return parsed.origin;
})();

const result = {
  baseUrl: normalizedBaseUrl,
  apiBaseUrl,
  checks: {
    loggedIn: false,
    boardLoaded: false,
    diagnosticoCardOpened: false,
    diagnosisBlockVisible: false,
    closeBlockedWhenInvalid: false,
    closeMovedToPorCotizar: false,
    boardAudienceTecnicoHidesClosed: false,
    boardAudienceTodosShowsClosed: false,
    boardAudienceAdministrativoShowsClosed: false,
    persistedAfterReload: false,
    diagnosisSealPersisted: false,
  },
  shortCode: "",
  detailTitle: "",
  activeStatusText: "",
  diagnosisClosedAt: "",
  diagnosisClosedBy: "",
  errorMessage: "",
  successMessage: "",
  screenshotPath: "",
  error: "",
};

let browser;

function assertOrThrow(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function login() {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Company-Id": companyId,
    },
    body: JSON.stringify({ email: userEmail, password: userPassword }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`login failed ${response.status}: ${body}`);
  }

  const payload = await response.json();
  return {
    ...payload,
    expiresAt: Date.now() + Math.max(Number(payload.expiresIn || 3600), 1) * 1000,
  };
}

async function clickAudienceChip(page, label) {
  const chip = page.locator(".board-audience-chip", { hasText: label }).first();
  await chip.waitFor({ state: "visible", timeout: timeoutMs });
  await chip.click();
  await page.waitForTimeout(300);
}

function cardByShortCode(page, shortCode) {
  return page.locator(".project-drag-item", { hasText: shortCode }).first();
}

try {
  const session = await login();
  result.checks.loggedIn = true;

  browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1540, height: 980 } });

  await context.addInitScript(
    ({ authSession, apiBase }) => {
      window.localStorage.setItem("pika.auth.session", JSON.stringify(authSession));
      window.localStorage.setItem("pika.apiBaseUrl", apiBase);
    },
    {
      authSession: session,
      apiBase: apiBaseUrl,
    },
  );

  const page = await context.newPage();
  await page.goto(`${normalizedBaseUrl}/app/work-projects`, {
    waitUntil: "domcontentloaded",
    timeout: timeoutMs,
  });

  await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
  result.checks.boardLoaded = true;

  const diagnosticoCard = page.locator('[data-column-id="diagnostico"] .project-drag-item').first();
  await diagnosticoCard.waitFor({ state: "visible", timeout: timeoutMs });
  await diagnosticoCard.click();

  await page.waitForSelector(".project-detail-dialog", { state: "visible", timeout: timeoutMs });
  await page.waitForFunction(
    () => Boolean(document.querySelector(".project-detail-dialog__title")?.textContent?.trim()),
    { timeout: timeoutMs },
  );

  result.detailTitle = String(await page.locator(".project-detail-dialog__title").first().innerText()).trim();
  result.shortCode = String(await page.locator(".project-detail-dialog__eyebrow").first().innerText()).trim();
  result.checks.diagnosticoCardOpened = Boolean(result.detailTitle);

  const diagnosisHeading = page.locator("h5", { hasText: "Diagnostico (Posicion 0)" }).first();
  await diagnosisHeading.waitFor({ state: "visible", timeout: timeoutMs });
  result.checks.diagnosisBlockVisible = true;

  const closeDiagnosisButton = page.getByRole("button", { name: "Cerrar diagnostico" }).first();
  await closeDiagnosisButton.waitFor({ state: "visible", timeout: timeoutMs });

  await closeDiagnosisButton.click();
  const validationError = page.locator(".project-detail-dialog__feedback.text-danger").first();
  await validationError.waitFor({ state: "visible", timeout: timeoutMs });
  result.errorMessage = String(await validationError.textContent()).trim();
  result.checks.closeBlockedWhenInvalid = result.errorMessage.toLowerCase().includes("no se puede cerrar diagnostico");

  const faultIdentifiedSwitch = page
    .locator("label.project-switch", { hasText: "Falla identificada" })
    .locator("input[type='checkbox']")
    .first();
  await faultIdentifiedSwitch.check();

  const diagnosticMemo = page
    .locator("label.project-detail-field", { has: page.locator("span.project-detail-field__label", { hasText: "Memo diagnostico" }) })
    .locator("textarea")
    .first();
  const diagnosticMemoValue = (await diagnosticMemo.inputValue()).trim();
  if (!diagnosticMemoValue) {
    await diagnosticMemo.fill("Diagnostico tecnico completado con hallazgos iniciales.");
  }

  const estimatedHoursInput = page
    .locator("label.project-detail-field", { has: page.locator("span.project-detail-field__label", { hasText: "Horas hombre estimadas" }) })
    .locator("input")
    .first();
  await estimatedHoursInput.fill("6");

  const partsBudgetUsdInput = page
    .locator(".project-detail-field", { has: page.locator("span.project-detail-field__label", { hasText: "Presupuesto repuestos (USD)" }) })
    .locator("input")
    .first();
  await partsBudgetUsdInput.fill("150");

  await closeDiagnosisButton.click();
  await page.waitForTimeout(4500);

  const footerFeedback = page.locator(".project-detail-dialog__footer").first();
  result.successMessage = String(await footerFeedback.textContent()).trim();

  await page.getByRole("button", { name: "Cancelar" }).first().click();
  await page.waitForSelector(".project-detail-dialog", { state: "hidden", timeout: timeoutMs });

  assertOrThrow(Boolean(result.shortCode), "No se pudo capturar el shortCode del proyecto para validar filtros.");

  await clickAudienceChip(page, "Todos");
  const projectCardToReopen = cardByShortCode(page, result.shortCode);
  await projectCardToReopen.first().waitFor({ state: "visible", timeout: timeoutMs });
  await projectCardToReopen.first().click();
  await page.waitForSelector(".project-detail-dialog", { state: "visible", timeout: timeoutMs });

  const activeStatusText = String(await page.locator('.status-chip.is-active').first().textContent().catch(() => '')).trim();
  result.activeStatusText = activeStatusText;
  result.checks.closeMovedToPorCotizar = activeStatusText.toLowerCase().includes('por cotizar');

  await page.getByRole("button", { name: "Cancelar" }).first().click();
  await page.waitForSelector(".project-detail-dialog", { state: "hidden", timeout: timeoutMs });

  await clickAudienceChip(page, "Tecnico");
  const hiddenInTecnico = await cardByShortCode(page, result.shortCode).count();
  result.checks.boardAudienceTecnicoHidesClosed = hiddenInTecnico === 0;

  await clickAudienceChip(page, "Todos");
  const visibleInTodos = await cardByShortCode(page, result.shortCode).count();
  result.checks.boardAudienceTodosShowsClosed = visibleInTodos > 0;

  await clickAudienceChip(page, "Administrativo");
  const visibleInAdministrativo = await cardByShortCode(page, result.shortCode).count();
  result.checks.boardAudienceAdministrativoShowsClosed = visibleInAdministrativo > 0;

  await clickAudienceChip(page, "Todos");
  await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForSelector(".kanban-board", { timeout: timeoutMs });
  const visibleAfterReload = await cardByShortCode(page, result.shortCode).count();
  result.checks.persistedAfterReload = visibleAfterReload > 0;

  const persistedSeal = await page.evaluate((shortCode) => {
    try {
      const raw = window.localStorage.getItem('lars.projects.items.v3');
      if (!raw) {
        return { closedAt: '', closedBy: '' };
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return { closedAt: '', closedBy: '' };
      }

      const project = parsed.find((item) => {
        const code = String(item?.properties?.shortCode || '').trim();
        return code === shortCode;
      });

      return {
        closedAt: String(project?.properties?.diagnosisClosedAt || '').trim(),
        closedBy: String(project?.properties?.diagnosisClosedBy || '').trim(),
      };
    } catch {
      return { closedAt: '', closedBy: '' };
    }
  }, result.shortCode);

  result.diagnosisClosedAt = persistedSeal.closedAt;
  result.diagnosisClosedBy = persistedSeal.closedBy;
  result.checks.diagnosisSealPersisted = Boolean(persistedSeal.closedAt && persistedSeal.closedBy);

  const screenshotPath = path.resolve(artifactsDir, `work-projects-diagnostico-ok-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  result.screenshotPath = screenshotPath;

  const failed = Object.values(result.checks).some((value) => !value);
  if (failed) {
    console.error("PLAYWRIGHT_WORK_PROJECTS_DIAGNOSTICO_FAILED");
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.log("PLAYWRIGHT_WORK_PROJECTS_DIAGNOSTICO_OK");
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  result.error = String(error?.stack || error);

  try {
    if (browser?.contexts()?.[0]?.pages()?.[0]) {
      const screenshotPath = path.resolve(artifactsDir, `work-projects-diagnostico-fail-${Date.now()}.png`);
      await browser.contexts()[0].pages()[0].screenshot({ path: screenshotPath, fullPage: true });
      result.screenshotPath = screenshotPath;
    }
  } catch {
    // ignore screenshot failure
  }

  console.error("PLAYWRIGHT_WORK_PROJECTS_DIAGNOSTICO_ERROR");
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close();
  }
}
