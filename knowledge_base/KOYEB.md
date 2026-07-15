# Koyeb Django deploy (alternative if Render asks for card)

**Why Koyeb:** works with Neon, free web service, Git deploy, custom domain later.
**Avoid PythonAnywhere free:** cannot connect to external Neon Postgres.

## Prep
1. Push repo to GitHub including `backend/Dockerfile`
2. Keep Neon `DATABASE_URL` ready

## Deploy steps
1. Sign up [https://app.koyeb.com](https://app.koyeb.com) (GitHub login)
2. **Create App** → **GitHub** → `TahaAbrar/Petrol-Pump`
3. Builder: **Dockerfile**
4. Dockerfile location: `backend/Dockerfile`
5. Work directory / context: `backend` (if asked)
6. Instance: **Free** / Nano free
7. Region: **Washington, D.C.** or Frankfurt (free only)
8. Exposed port: `8000`
9. Env vars (same as Render):

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Neon string |
| `DEBUG` | `False` |
| `USE_SQLITE` | `0` |
| `SERVE_MEDIA` | `True` |
| `SECRET_KEY` | long random |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | strong |
| `ADMIN_EMAIL` | your email |
| `ALLOWED_HOSTS` | `.koyeb.app` (plus custom domain later) |
| `CORS_ALLOWED_ORIGINS` | frontend URL later |

10. Deploy → wait for healthy
11. Open `https://YOUR-APP.koyeb.app/api/health/`
12. One-time seed via Koyeb console/exec if available, or temporarily change CMD to include `seed`

## Note
If Koyeb also asks card: it may be human-verify only. Otherwise put card on **Render Free** (already almost done) — still $0 if Free stays selected.
