import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.PW_BASE_URL || "http://127.0.0.1:4200";
const timeoutMs = Number(process.env.PW_TIMEOUT_MS || "120000");
const headless = !["false", "0", "no"].includes((process.env.PW_HEADLESS || "true").toLowerCase());

const resolvedApiBaseUrl = (() => {
    if (process.env.PW_API_BASE_URL) {
        return process.env.PW_API_BASE_URL;
    }

    try {
        const parsed = new URL(baseUrl);
        if ((parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") && parsed.port !== "8080") {
            parsed.port = "8080";
            return parsed.origin;
        }
        return parsed.origin;
    } catch {
        return "http://127.0.0.1:8080";
    }
})();

const testId = Date.now();
const strongPassword = `Abc!${testId}xyZ`;
const updatedPassword = `Xyz!${testId}Ab9`;
const firstName = `PW${String(testId).slice(-4)}`;
const lastName = "AuthFlow";
const testEmail = `pw-auth-${testId}@prueba.com`;
const displayName = `PW User ${String(testId).slice(-6)}`;
const country = "Colombia";

const consoleErrors = [];
const pageErrors = [];

const result = {
    baseUrl,
    apiBaseUrl: resolvedApiBaseUrl,
    signupId: "",
    resetToken: "",
    checks: {
        backendRejectsInvalidSignup: false,
        frontendSignupValidation: false,
        signupCreatedViaUi: false,
        signupPersistedInApi: false,
        signupTypePersisted: false,
        onboardingSavedViaUi: false,
        onboardingPersistedInApi: false,
        forgotPasswordValidationFrontend: false,
        resetTokenGenerated: false,
        changePasswordValidationFrontend: false,
        passwordChangedViaUi: false,
        usedResetTokenRejected: false,
    },
    screenshotPath: "",
    consoleErrors,
    pageErrors,
};

let browser;

function resolveErrorMessage(error) {
    if (!error) {
        return "unknown error";
    }

    if (error instanceof Error) {
        return error.stack || error.message;
    }

    return String(error);
}

async function apiRequest(method, pathUrl, body) {
    const response = await fetch(`${resolvedApiBaseUrl}${pathUrl}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Company-Id": "demo-company",
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 204) {
        return null;
    }

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`API ${method} ${pathUrl} -> ${response.status}: ${text}`);
    }

    return response.json();
}

async function go(page, route) {
    await page.goto(`${baseUrl.replace(/\/$/, "")}${route}`, {
        waitUntil: "networkidle",
        timeout: timeoutMs,
    });
}

async function clickNextUntilOnboarding2(page) {
    const nextButton = page.locator("button.btn-next").first();

    for (let i = 0; i < 6; i += 1) {
        if (page.url().includes("/auth/onboarding2")) {
            return;
        }

        await nextButton.click();
        await page.waitForTimeout(350);
    }

    await page.waitForURL(/\/auth\/onboarding2/, { timeout: timeoutMs });
}

try {
    let backendRejected = false;
    try {
        await apiRequest("POST", "/api/v1/auth/signup", {
            firstName: "",
            lastName: "",
            email: "correo-invalido",
            countryCode: "57",
            phone: "abc",
            password: "123",
            confirmPassword: "123",
        });
    } catch (error) {
        if (String(error).includes("400")) {
            backendRejected = true;
        }
    }

    if (!backendRejected) {
        throw new Error("Backend no rechazo signup invalido.");
    }
    result.checks.backendRejectsInvalidSignup = true;

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ viewport: { width: 1600, height: 960 } });
    const page = await context.newPage();

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            consoleErrors.push(msg.text());
        }
    });
    page.on("pageerror", (error) => {
        pageErrors.push(error.stack || error.message || String(error));
    });

    await go(page, "/auth/signup");

    await page.getByRole("button", { name: /^Signup$/ }).click();
    const signupValidationVisible = await page.locator(".alert-danger").filter({ hasText: /revisa los campos/i }).first().isVisible().catch(() => false);
    if (!signupValidationVisible) {
        throw new Error("No se mostro validacion frontend en signup.");
    }
    result.checks.frontendSignupValidation = true;

    await page.fill("input[name='firstName']", firstName);
    await page.fill("input[name='lastName']", lastName);
    await page.fill("input[name='email']", testEmail);
    await page.selectOption("select[name='countryCode']", "+57");
    await page.fill("input[name='phone']", "3007778899");
    await page.fill("input[name='password']", strongPassword);
    await page.fill("input[name='confirmPassword']", strongPassword);
    await page.getByRole("button", { name: /^Signup$/ }).click();

    await page.waitForURL(/\/auth\/signup-success/, { timeout: timeoutMs });
    result.checks.signupCreatedViaUi = true;

    const signupIdFromUrl = new URL(page.url()).searchParams.get("signupId") || "";
    if (!signupIdFromUrl) {
        throw new Error("No se recibio signupId tras signup exitoso.");
    }
    result.signupId = signupIdFromUrl;

    const signupRecord = await apiRequest("GET", `/api/v1/auth/signup/${encodeURIComponent(signupIdFromUrl)}`, null);
    if (String(signupRecord.email || "").toLowerCase() !== testEmail.toLowerCase()) {
        throw new Error("El registro signup no coincide en backend.");
    }
    result.checks.signupPersistedInApi = true;

    await page.getByRole("button", { name: /Business/i }).click();
    await page.waitForURL(/\/auth\/onboarding/, { timeout: timeoutMs });

    const signupAfterType = await apiRequest("GET", `/api/v1/auth/signup/${encodeURIComponent(signupIdFromUrl)}`, null);
    if (String(signupAfterType.signupType || "") !== "Business") {
        throw new Error("No se persistio signupType=Business en backend.");
    }
    result.checks.signupTypePersisted = true;

    await page.fill("input[name='displayName']", displayName);
    await clickNextUntilOnboarding2(page);
    result.checks.onboardingSavedViaUi = true;

    await page.waitForSelector("input[name='country']", { timeout: timeoutMs });
    await page.fill("input[name='country']", country);
    await page.getByRole("button", { name: /Finalizar ahora/i }).click();

    await page.waitForURL(/\/auth\/(signin|onboarding2)|\/app\//, { timeout: timeoutMs });

    const onboardingRecord = await apiRequest("GET", `/api/v1/auth/onboarding/${encodeURIComponent(signupIdFromUrl)}`, null);
    if (String(onboardingRecord.displayName || "").trim() !== displayName.trim()) {
        throw new Error("DisplayName onboarding no coincide en backend.");
    }
    if (String(onboardingRecord.country || "").trim().toLowerCase() !== country.toLowerCase()) {
        throw new Error("Country onboarding no coincide en backend.");
    }
    if (!onboardingRecord.completedAt) {
        throw new Error("Onboarding no quedo marcado como completado en backend.");
    }
    result.checks.onboardingPersistedInApi = true;

    await go(page, "/auth/forgot-password");

    await page.fill("input[name='email']", "correo-invalido");
    await page.getByRole("button", { name: /Reset Now/i }).click();
    const forgotValidationVisible = await page.locator(".alert-danger").filter({ hasText: /correo valido/i }).first().isVisible().catch(() => false);
    if (!forgotValidationVisible) {
        throw new Error("No se mostro validacion frontend en forgot-password.");
    }
    result.checks.forgotPasswordValidationFrontend = true;

    await page.fill("input[name='email']", testEmail);
    await page.getByRole("button", { name: /Reset Now/i }).click();
    await page.waitForURL(/\/auth\/change-password/, { timeout: timeoutMs });

    const resetToken = new URL(page.url()).searchParams.get("token") || "";
    if (!resetToken) {
        throw new Error("No se recibio reset token tras forgot-password.");
    }
    result.resetToken = resetToken;
    result.checks.resetTokenGenerated = true;

    await page.fill("input[name='newPassword']", "1234");
    await page.fill("input[name='confirmPassword']", "1234");
    await page.getByRole("button", { name: /Change Now/i }).click();
    const changeValidationVisible = await page.locator(".alert-danger").filter({ hasText: /Revisa los campos de clave/i }).first().isVisible().catch(() => false);
    if (!changeValidationVisible) {
        throw new Error("No se mostro validacion frontend en change-password.");
    }
    result.checks.changePasswordValidationFrontend = true;

    await page.fill("input[name='newPassword']", updatedPassword);
    await page.fill("input[name='confirmPassword']", updatedPassword);
    await page.getByRole("button", { name: /Change Now/i }).click();
    await page.waitForURL(/\/auth\/signin/, { timeout: timeoutMs });
    result.checks.passwordChangedViaUi = true;

    let usedTokenRejected = false;
    try {
        await apiRequest("POST", "/api/v1/auth/change-password", {
            resetToken,
            newPassword: updatedPassword,
            confirmPassword: updatedPassword,
        });
    } catch (error) {
        if (String(error).includes("404")) {
            usedTokenRejected = true;
        }
    }
    if (!usedTokenRejected) {
        throw new Error("El backend acepto reutilizar token de reset ya usado.");
    }
    result.checks.usedResetTokenRejected = true;

    const screenshotPath = path.resolve("/tmp", `check-auth-flows-db-${testId}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.screenshotPath = screenshotPath;

    console.log("RESULT_JSON=" + JSON.stringify(result, null, 2));
} catch (error) {
    console.error("RESULT_JSON=" + JSON.stringify(result, null, 2));
    console.error("CHECK_ERROR=" + resolveErrorMessage(error));
    process.exitCode = 1;
} finally {
    if (browser) {
        await browser.close();
    }
}
