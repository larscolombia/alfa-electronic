#!/usr/bin/env bash
# Suite Playwright de edge cases Compras/Repuestos (Fase 1 + Fase 2).
# Cada caso arranca desde el login por UI, con pausa de 0.3 s entre interacciones.
# Uso: npm run test:e2e-fase12-suite   (o bash scripts/run-fase12-suite.sh)
set -u

cd "$(dirname "$0")/.." || exit 1

CASES=(
  "scripts/e2e-fase1-tec07-compr03-playwright.mjs"
  "scripts/e2e-fase1-cot08-validacion-playwright.mjs"
  "scripts/e2e-fase1-compr07-bom-consolidado-playwright.mjs"
  "scripts/e2e-fase1-compr05-envio-lote-playwright.mjs"
  "scripts/e2e-fase2-compr04-10-recibo-parcial-playwright.mjs"
  "scripts/e2e-fase2-compr11-recibo-completo-playwright.mjs"
)

declare -A STATUS
PASS=0
FAIL=0

for script in "${CASES[@]}"; do
  name="$(basename "$script")"
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "▶ EJECUTANDO: $name"
  echo "═══════════════════════════════════════════════════════════════"
  if node "$script"; then
    STATUS[$name]="✅ PASÓ"
    PASS=$((PASS + 1))
  else
    STATUS[$name]="❌ FALLÓ"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "════════════════ SUITE FASE 1/2 — RESUMEN ════════════════"
for script in "${CASES[@]}"; do
  name="$(basename "$script")"
  echo "  ${STATUS[$name]:-❓ SIN EJECUTAR}  $name"
done
echo "─────────────────────────────────────────────────────────────"
echo "  Totales: ✅ $PASS   ❌ $FAIL   (de ${#CASES[@]} casos)"
echo "  Artefactos: playwright-artifacts/fase12/ (JSON + screenshots por paso)"
if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
