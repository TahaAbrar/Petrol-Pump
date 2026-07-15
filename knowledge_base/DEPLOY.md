# Domain & monorepo deploy (Render + Cloudflare)

## Same repo = frontend + backend — kya karna hai?

Ek hi GitHub repo theek hai. Render pe **sirf backend** deploy hota hai:

| Platform | Same repo? | Root Directory | Kya chalega |
|----------|------------|----------------|-------------|
| **Render** Web Service | Haan | `backend` | Django API only |
| **Cloudflare Pages** | Haan | `/` (repo root) | Frontend website |

Render ko mat bolo poora repo Python treat kare — **Root Directory = `backend`** zaroori hai (`render.yaml` mein pehle se set).

---

## Domain kab buy karni hai?

**Pehle deploy, baad mein domain** — recommended order:

1. Neon + Render → API live on `https://something.onrender.com`
2. Cloudflare Pages → site on `https://something.pages.dev`
3. Dono chal rahe hon → **phir** domain kharido / connect karo
4. Domain sirf DNS + env vars mein aati hai — **code files mein domain hardcode nahi**

Domain pehle bhi le sakte ho, lekin wait mat karo deploy ke liye.

---

## Domain / URLs kahan lagti hain? (NO code hardcode)

Domain **kisi `.py` / `.tsx` file mein nahi likhte**. Sirf:

### A) Render → Environment (backend)
| Env var | Example |
|---------|---------|
| `DATABASE_URL` | Neon connection string |
| `ALLOWED_HOSTS` | `api.yourdomain.com,.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://www.yourdomain.com,https://yourdomain.com` (pehle: `https://xxx.pages.dev`) |
| `CSRF_TRUSTED_ORIGINS` | same HTTPS origins + `https://api.yourdomain.com` |
| `ADMIN_PASSWORD` | strong password |
| `SECRET_KEY` | auto-generate OK |

Code already auto-adds `RENDER_EXTERNAL_HOSTNAME`.

### B) Cloudflare Pages → Environment (frontend build)
| Env var | Example |
|---------|---------|
| `VITE_API_URL` | Pehle: `https://YOUR-API.onrender.com/api` — baad mein: `https://api.yourdomain.com/api` |

File for local only: root `.env` / `.env.example` (`VITE_API_URL`). Production pe dashboard.

### C) DNS (Cloudflare DNS dashboard — not a repo file)
| Record | Name | Target |
|--------|------|--------|
| CNAME | `api` | `YOUR-SERVICE.onrender.com` |
| Pages custom domain | `www` + apex | Cloudflare Pages |

### D) Optional docs only
- `backend/.env.example` — examples
- `knowledge_base/DEPLOY.md` — checklist
- Domain kabhi `settings.py` mein mat likho

---

## Render pe exact clicks (monorepo)

1. New → **Web Service** → GitHub repo select  
2. **Root Directory:** `backend`  
3. Runtime: Python  
4. Build: `chmod +x ./build.sh && ./build.sh`  
5. Start: `python manage.py migrate --noinput && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120`  
6. Env: `DATABASE_URL`, `ADMIN_PASSWORD`, CORS origins (frontend URL)  
7. Deploy → Shell: `python manage.py seed` (ek baar)  
8. Test: `https://xxx.onrender.com/api/health/` → `{"status":"ok"}`

Frontend is service pe mat lagao.

---

## Production backend hardening (done)

- gunicorn + whitenoise + `build.sh` + `runtime.txt`
- `DATABASE_URL` + Neon SSL
- Auto `ALLOWED_HOSTS` from Render hostname
- `/api/health/` for health checks
- Migrate on start (free tier safe)
- Safer static storage (no Manifest break)
- Logging to stdout
