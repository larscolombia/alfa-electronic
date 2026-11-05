/** Unit tests for the printable equipment QR payload. */
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/app/pages/app/crm/equipment-qr-payload.util.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { buildEquipmentQrPayload } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

let failures = 0;
const check = (name, actual, expected) => {
    if (actual === expected) console.log(`PASS ${name}`);
    else {
        failures += 1;
        console.error(`FAIL ${name}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
    }
};

const payload = buildEquipmentQrPayload({
    equipmentCode: " CO-2611-0030 ",
    receptionDate: "2026-11-05T13:30:00.000Z",
    companyName: " Alfa Electrónicos ",
    identification: " 900123456-7 ",
    description: " PLC Siemens S7-1200 ",
});

check(
    "codifica solo los cinco valores solicitados, sin títulos ni identificadores internos",
    payload,
    "CO-2611-0030\n2026-11-05\nAlfa Electrónicos\n900123456-7\nPLC Siemens S7-1200",
);
check("mantiene las cinco líneas aun cuando falte un valor", buildEquipmentQrPayload({ equipmentCode: "CO-1" }).split("\n").length, 5);

if (failures) process.exit(1);
