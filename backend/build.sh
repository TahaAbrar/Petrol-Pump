#!/usr/bin/env bash
# Used by Render buildCommand. Run from backend/ (rootDir).
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
