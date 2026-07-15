# Django API — for Koyeb / Docker hosts (root context = backend/)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Build-time only: no Neon needed for collectstatic
RUN SECRET_KEY=build-time-not-used DEBUG=False USE_SQLITE=1 \
    python manage.py collectstatic --noinput

EXPOSE 8000

CMD python manage.py migrate --noinput \
    && gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT} --workers 2 --timeout 120
