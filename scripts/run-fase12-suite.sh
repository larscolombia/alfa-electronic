#!/usr/bin/env bash
# Suite Playwright de edge cases Compras/Repuestos (Fase 1 + Fase 2).
# Cada caso arranca desde el login por UI, con pausa de 0.3 s entre interacciones.
# Compatible con bash 3.2 (macOS): sin arrays asociativos ni `declare -A`.
# Uso:
#   npm run test:e2e-fase12-suite                 # corre la lista completa
#   bash scripts/run-fase12-suite.sh <script> [..]  # corre solo los indicados
set -u

cd "$(dirname "$0")/.." || exit 1

if [ "$#" -gt 0 ]; then
  CASES=("$@")
else
  CASES=(
    "scripts/e2e-fase1-tec07-compr03-playwright.mjs"
    "scripts/e2e-fase1-cot08-validacion-playwright.mjs"
    "scripts/e2e-fase1-compr07-bom-consolidado-playwright.mjs"
    "scripts/e2e-fase1-compr05-envio-lote-playwright.mjs"
    "scripts/e2e-fase2-compr04-10-recibo-parcial-playwright.mjs"
    "scripts/e2e-fase2-compr11-recibo-completo-playwright.mjs"
    "scripts/e2e-compr01-sin-oc-no-se-exporta-playwright.mjs"
    "scripts/e2e-compr02-stock-a-reparacion-playwright.mjs"
  )
fi

PASS=0
FAIL=0
RESULTS=""

for script in "${CASES[@]}"; do
  name="$(basename "$script")"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "▶ EJECUTANDO: $name"
  echo "═══════════════════════════════════════════════════════════════"
  if [ ! -f "$script" ]; then
    RESULTS="${RESULTS}⚠️  FALTA ARCHIVO   ${name}"$'\n'
    FAIL=$((FAIL + 1))
    continue
  fi
  if node "$script"; then
    RESULTS="${RESULTS}✅ PASÓ        ${name}"$'\n'
    PASS=$((PASS + 1))
  else
    RESULTS="${RESULTS}❌ FALLÓ       ${name}"$'\n'
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "════════════════ SUITE FASE 1/2 — RESUMEN ════════════════"
printf '%s' "$RESULTS"
echo "─────────────────────────────────────────────────────────────"
echo "  Totales: ✅ $PASS   ❌ $FAIL   (de ${#CASES[@]} casos)"
echo "  Artefactos: playwright-artifacts/fase12/ (JSON + screenshots por paso)"
if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
