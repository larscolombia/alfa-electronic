/**
 * Runner visible y local del flujo extremo a extremo de un equipo.
 * No permite apuntar por accidente a un host remoto: el navegador abre la
 * aplicación local y conserva PW_HEADLESS=false salvo que se solicite lo
 * contrario de forma explícita.
 */
import { spawn } from "node:child_process";

const localUrl = (process.env.PW_BASE_URL || "http://127.0.0.1:4200").replace(/\/+$/, "");
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(?::\d+)?$/i.test(localUrl)) {
    throw new Error(`Este runner solo admite un host local; se recibió ${localUrl}.`);
}

const child = spawn(process.execPath, ["scripts/e2e-lars-t16-trazabilidad360-playwright.mjs"], {
    cwd: process.cwd(),
    env: {
        ...process.env,
        PW_BASE_URL: localUrl,
        PW_API_BASE_URL: process.env.PW_API_BASE_URL || "http://127.0.0.1:8080",
        PW_HEADLESS: process.env.PW_HEADLESS || "false",
        PW_ARTIFACTS_DIR: process.env.PW_ARTIFACTS_DIR || "playwright-artifacts/flujo-local",
    },
    stdio: "inherit",
});

child.on("exit", (code, signal) => {
    if (signal) {
        console.error(`E2E terminado por señal ${signal}.`);
        process.exitCode = 1;
        return;
    }
    process.exitCode = code || 0;
});
