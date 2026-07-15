#!/usr/bin/env bash
# Install PostgreSQL, create petrolpump DB/user, then migrate + seed Django.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
VENV_PY="$ROOT/venv/bin/python"
DUMP="$ROOT/scripts/sqlite_data_dump.json"

echo "==> Installing PostgreSQL (needs your sudo password)…"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib

echo "==> Starting PostgreSQL…"
sudo service postgresql start || sudo systemctl start postgresql

echo "==> Creating role + database…"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='petrolpump'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER petrolpump WITH PASSWORD 'petrolpump';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='petrolpump'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE petrolpump OWNER petrolpump;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE petrolpump TO petrolpump;"
sudo -u postgres psql -d petrolpump -c "GRANT ALL ON SCHEMA public TO petrolpump;"
sudo -u postgres psql -d petrolpump -c "ALTER SCHEMA public OWNER TO petrolpump;"

echo "==> Switching backend/.env to PostgreSQL…"
if grep -q '^USE_SQLITE=' "$BACKEND/.env"; then
  sed -i 's/^USE_SQLITE=.*/USE_SQLITE=0/' "$BACKEND/.env"
else
  echo 'USE_SQLITE=0' >> "$BACKEND/.env"
fi

echo "==> Running migrations…"
cd "$BACKEND"
"$VENV_PY" manage.py migrate

echo "==> Loading data…"
if [[ -f "$DUMP" ]]; then
  # Prefer restoring the dump taken from your previous SQLite DB.
  "$VENV_PY" manage.py loaddata "$DUMP" && echo "Loaded SQLite dump." \
    || { echo "Dump load failed — seeding defaults instead…"; "$VENV_PY" manage.py seed; }
else
  "$VENV_PY" manage.py seed
fi

echo ""
echo "✅ PostgreSQL ready"
echo "   DB: petrolpump  USER: petrolpump  PASS: petrolpump  HOST: localhost:5432"
echo "   Restart backend:  cd backend && ../venv/bin/python manage.py runserver 8000"
echo "   Admin: admin / admin123"
