"""
Django settings for the Total Fuel Station backend.
Production-oriented: env-driven, Render/Neon friendly.
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import unquote, urlparse

BASE_DIR = Path(__file__).resolve().parent.parent


# --- Minimal .env loader (no extra dependency) -----------------------------
def _load_env():
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


_load_env()


def env(key, default=None):
    return os.environ.get(key, default)


def env_bool(key, default=False):
    return env(key, str(default)).lower() in ("1", "true", "yes", "on")


def _csv(key, default=""):
    return [p.strip() for p in env(key, default).split(",") if p.strip()]


# ---------------------------------------------------------------------------
# Render sets RENDER=true. Prefer production defaults there.
ON_RENDER = env_bool("RENDER", False) or bool(env("RENDER_EXTERNAL_HOSTNAME"))

SECRET_KEY = env(
    "SECRET_KEY",
    "django-insecure-)1$d%d6pgwm*3f1@skk6uw!s*2f3vysgn5%cz6t1+9v^@e+66u",
)

# Local default True; on Render default False (override only if you set DEBUG=True).
if ON_RENDER:
    DEBUG = env_bool("DEBUG", False)
else:
    DEBUG = env_bool("DEBUG", True)

ALLOWED_HOSTS = _csv("ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0")
# Render injects this hostname — include so first deploy works before custom domain.
_render_host = env("RENDER_EXTERNAL_HOSTNAME")
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)
if ON_RENDER and ".onrender.com" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(".onrender.com")

if ON_RENDER and SECRET_KEY.startswith("django-insecure"):
    raise RuntimeError(
        "Set a strong SECRET_KEY env var on Render (do not use the insecure local default)."
    )


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    # local
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"


def _database_from_url(url: str) -> dict:
    """Parse postgres URL (Neon / Render style) into Django DATABASES entry."""
    parsed = urlparse(url)
    if parsed.scheme not in ("postgres", "postgresql"):
        raise ValueError(f"Unsupported DATABASE_URL scheme: {parsed.scheme}")
    name = parsed.path.lstrip("/") or "postgres"
    opts: dict = {}
    if parsed.query:
        from urllib.parse import parse_qs

        q = {k: v[-1] for k, v in parse_qs(parsed.query).items()}
        if "sslmode" in q:
            opts["sslmode"] = q["sslmode"]
    # Neon (and most cloud Postgres) require TLS
    if "sslmode" not in opts:
        opts["sslmode"] = "require"
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(name),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or 5432),
        "OPTIONS": opts,
        "CONN_MAX_AGE": 60,
    }


# Database — prefer DATABASE_URL (Neon dashboard copy-paste), else POSTGRES_* vars.
_database_url = env("DATABASE_URL")
if env_bool("USE_SQLITE", False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
elif _database_url:
    DATABASES = {"default": _database_from_url(_database_url)}
else:
    _pg_opts = {}
    # Neon / cloud hosts almost always need SSL even with discrete env vars
    _host = env("POSTGRES_HOST", "localhost")
    if _host not in ("localhost", "127.0.0.1") or env_bool("POSTGRES_SSL", False):
        _pg_opts["sslmode"] = env("POSTGRES_SSLMODE", "require")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB", "petrolpump"),
            "USER": env("POSTGRES_USER", "petrolpump"),
            "PASSWORD": env("POSTGRES_PASSWORD", "petrolpump"),
            "HOST": _host,
            "PORT": env("POSTGRES_PORT", "5432"),
            "OPTIONS": _pg_opts,
            "CONN_MAX_AGE": 60,
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# CompressedStaticFilesStorage avoids ManifestMissing issues on lean API deploys.
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Free hosts (Render) have no persistent disk — media resets on redeploy.
SERVE_MEDIA = env_bool("SERVE_MEDIA", True)

# Admin uploads (videos) — default 50MB; raise via env if needed
DATA_UPLOAD_MAX_MEMORY_SIZE = int(env("DATA_UPLOAD_MAX_MEMORY_SIZE", str(50 * 1024 * 1024)))
FILE_UPLOAD_MAX_MEMORY_SIZE = int(env("FILE_UPLOAD_MAX_MEMORY_SIZE", str(50 * 1024 * 1024)))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CSRF_TRUSTED_ORIGINS = _csv("CSRF_TRUSTED_ORIGINS", "")
# Allow the Render URL for Django admin until custom domain is attached
_render_url = env("RENDER_EXTERNAL_URL")
if _render_url and _render_url.rstrip("/") not in CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS.append(_render_url.rstrip("/"))

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
}


CORS_ALLOWED_ORIGINS = _csv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000",
)
CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL_ORIGINS", DEBUG and not ON_RENDER)
CORS_ALLOW_CREDENTIALS = True

# Logging to stdout so Render dashboard shows errors
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}
