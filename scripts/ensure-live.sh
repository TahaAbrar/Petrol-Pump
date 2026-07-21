#!/usr/bin/env bash
# Keep production stack alive — safe to run from cron / systemd timer / manually.
# Does NOT depend on Cursor / IDE being open.
set -euo pipefail

DOMAIN="${DOMAIN:-sukkagroupofcompanies.com}"
log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }

ensure_dir() {
  if [[ ! -d /run/postgresql ]]; then
    mkdir -p /run/postgresql
    chown postgres:postgres /run/postgresql
    chmod 2775 /run/postgresql
    log "recreated /run/postgresql"
  fi
}

ensure_unit() {
  local unit="$1"
  if ! systemctl is-enabled --quiet "$unit" 2>/dev/null; then
    systemctl enable "$unit" >/dev/null 2>&1 || true
    log "enabled $unit"
  fi
  if ! systemctl is-active --quiet "$unit"; then
    log "starting $unit (was not active)"
    systemctl start "$unit" || systemctl restart "$unit" || true
  fi
}

# 1) Postgres socket dir (tmpfs /run can be empty after some boots)
ensure_dir

# 2) Core services — always on boot + recover if crashed
ensure_unit postgresql
# Debian PG cluster unit (when present)
if systemctl list-unit-files 'postgresql@17-main.service' 2>/dev/null | grep -q postgresql@; then
  ensure_unit postgresql@17-main
fi
# If systemd says active but nothing listens on 5432, force cluster start
if ! (echo > /dev/tcp/127.0.0.1/5432) >/dev/null 2>&1; then
  log "Postgres port 5432 closed — starting cluster"
  pg_ctlcluster 17 main start 2>/dev/null || systemctl restart postgresql || true
  sleep 2
fi

ensure_unit nginx
ensure_unit sukka-gunicorn
ensure_unit sukka-frontend

# 3) Health checks — restart only the failing piece
code_api="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:8000/api/site/ 2>/dev/null || echo 000)"
if [[ "$code_api" != "200" ]]; then
  log "API unhealthy ($code_api) — restarting sukka-gunicorn (+ ensure postgres)"
  systemctl restart postgresql 2>/dev/null || true
  sleep 1
  systemctl restart sukka-gunicorn || true
  sleep 2
  code_api="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:8000/api/site/ 2>/dev/null || echo 000)"
  log "API after restart: $code_api"
fi

code_fe="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:8080/ 2>/dev/null || echo 000)"
if [[ "$code_fe" != "200" && "$code_fe" != "304" ]]; then
  log "Frontend unhealthy ($code_fe) — restarting sukka-frontend"
  systemctl restart sukka-frontend || true
  sleep 2
  code_fe="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 http://127.0.0.1:8080/ 2>/dev/null || echo 000)"
  log "FE after restart: $code_fe"
fi

# Kill accidental IDE/dev servers that steal ports (do not kill systemd units)
if pgrep -af 'manage.py runserver' >/dev/null 2>&1; then
  log "killing leftover manage.py runserver"
  pkill -f 'manage.py runserver' || true
fi

log "OK api=$code_api fe=$code_fe pg=$(systemctl is-active postgresql) guni=$(systemctl is-active sukka-gunicorn) fe_svc=$(systemctl is-active sukka-frontend) nginx=$(systemctl is-active nginx)"
