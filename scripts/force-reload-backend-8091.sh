#!/usr/bin/env bash
set -euo pipefail

cd /var/www/alfa.software.net.co/backend

go build -o bin/alfa-backend ./cmd/server

oldpid=$(ss -lptn 'sport = :8091' | sed -n 's/.*pid=\([0-9]\+\),.*/\1/p' | head -n 1 || true)
echo "OLD_PID=${oldpid:-none}"
if [[ -n "${oldpid:-}" ]]; then
  kill -9 "$oldpid" || true
fi

DB_URL=$(grep '^DATABASE_URL=' .env | cut -d= -f2-)
JWT_SECRET_VALUE=$(grep '^JWT_SECRET=' .env | cut -d= -f2-)
API_KEY_VALUE=$(grep '^API_KEY=' .env | cut -d= -f2- || true)
DEEPSEEK_API_URL_VALUE=$(grep '^DEEPSEEK_API_URL=' .env | cut -d= -f2- || true)
DEEPSEEK_MODEL_VALUE=$(grep '^DEEPSEEK_MODEL=' .env | cut -d= -f2- || true)

PORT=8091 \
DATABASE_URL="$DB_URL" \
JWT_SECRET="$JWT_SECRET_VALUE" \
API_KEY="$API_KEY_VALUE" \
DEEPSEEK_API_URL="$DEEPSEEK_API_URL_VALUE" \
DEEPSEEK_MODEL="$DEEPSEEK_MODEL_VALUE" \
nohup /var/www/alfa.software.net.co/backend/bin/alfa-backend > /tmp/alfa-backend-8091.log 2>&1 &
newpid=$!
echo "NEW_PID=${newpid}"

for _ in $(seq 1 100); do
  if curl -sS http://127.0.0.1:8091/health >/dev/null 2>&1; then
    break
  fi
done

ss -lptn 'sport = :8091' || true
