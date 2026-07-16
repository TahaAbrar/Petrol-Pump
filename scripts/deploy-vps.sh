#!/usr/bin/env bash
# Install / refresh production stack: gunicorn + frontend SSR + nginx (+ optional SSL)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
DOMAIN="${DOMAIN:-sukkagroupofcompanies.com}"
EMAIL="${CERTBOT_EMAIL:-admin@${DOMAIN}}"

echo "==> Installing gunicorn…"
"$BACKEND/venv/bin/pip" install -q 'gunicorn==23.0.0'

echo "==> Collecting Django static files…"
cd "$BACKEND"
"$BACKEND/venv/bin/python" manage.py collectstatic --noinput

echo "==> Building frontend (VITE_API_URL=https://${DOMAIN}/api)…"
cd "$ROOT"
VITE_API_URL="https://${DOMAIN}/api" npm run build

# Detect Node SSR entry after nitro node-server build
SSR_ENTRY=""
for cand in \
  "$ROOT/.output/server/index.mjs" \
  "$ROOT/dist/server/index.mjs" \
  "$ROOT/dist/server/index.js" \
  "$ROOT/dist/server/server.mjs" \
  "$ROOT/server/index.mjs"
do
  if [[ -f "$cand" ]]; then
    SSR_ENTRY="$cand"
    break
  fi
done
if [[ -z "$SSR_ENTRY" ]]; then
  echo "ERROR: could not find Node SSR entry after build. Listing dist:"
  find "$ROOT/dist" -maxdepth 3 -type f | head -50
  exit 1
fi
echo "    SSR entry: $SSR_ENTRY"

# Patch frontend unit with discovered entry
sed "s|ExecStart=.*|ExecStart=/usr/bin/node ${SSR_ENTRY}|" \
  "$ROOT/scripts/frontend.service" > /tmp/sukka-frontend.service

echo "==> Stopping any leftover runserver on :8000…"
pkill -f "manage.py runserver" 2>/dev/null || true
sleep 1

echo "==> Installing systemd units…"
cp "$ROOT/scripts/gunicorn.service" /etc/systemd/system/sukka-gunicorn.service
cp /tmp/sukka-frontend.service /etc/systemd/system/sukka-frontend.service
systemctl daemon-reload
systemctl enable --now sukka-gunicorn.service
systemctl enable --now sukka-frontend.service
systemctl restart sukka-gunicorn.service sukka-frontend.service

echo "==> Installing nginx site…"
cp "$ROOT/scripts/nginx-sukka.conf" /etc/nginx/sites-available/sukka
ln -sfn /etc/nginx/sites-available/sukka /etc/nginx/sites-enabled/sukka
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Health checks…"
sleep 2
curl -sS -o /dev/null -w "API local: %{http_code}\n" http://127.0.0.1:8000/api/ || true
curl -sS -o /dev/null -w "FE local: %{http_code}\n" http://127.0.0.1:8080/ || true
curl -sS -o /dev/null -w "Nginx Host: %{http_code}\n" -H "Host: ${DOMAIN}" http://127.0.0.1/ || true

echo ""
echo "==> SSL (certbot)…"
# Only works once public DNS A record points to THIS server (169.58.29.84)
if dig @8.8.8.8 +short "$DOMAIN" A 2>/dev/null | grep -q '169.58.29.84'; then
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect \
    && echo "SSL OK" \
    || echo "WARN: certbot failed — check DNS / ports 80+443"
else
  echo "SKIP SSL: DNS for $DOMAIN is NOT pointing to 169.58.29.84 yet."
  echo "  Current A records:"
  dig @8.8.8.8 +short "$DOMAIN" A 2>/dev/null || true
  echo "  After you change DNS → A → 169.58.29.84, run:"
  echo "    certbot --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos -m $EMAIL --redirect"
fi

echo ""
echo "✅ Deploy done"
echo "   Site:  http://${DOMAIN}/  (https after SSL)"
echo "   API:   http://${DOMAIN}/api/"
echo "   Admin: http://${DOMAIN}/admin/  (React)  |  /django-admin/ (Django)"
echo "   systemctl status sukka-gunicorn sukka-frontend nginx"
