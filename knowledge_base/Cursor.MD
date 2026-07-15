# Petrol Pump — Agent Knowledge Base

Read this before making changes. Multiple agents work on this repo — keep it updated.

## Project shape
- **Frontend**: TanStack Start (React 19, SSR) + Vite, Tailwind v4, framer-motion, shadcn-style UI in `src/components/ui`. Dev server runs on **:8080**. Lovable-connected (don't rewrite pushed git history).
- **Backend**: Django 6 + Django REST Framework in `backend/`. App = `api`. Runs on **:8000**.

---

## 1. Logo (used everywhere)
- **Default**: orb (`src/assets/total-orb.png`) + **"Sukka PR"** wordmark via `src/components/Logo.tsx`.
- **Custom logo (optional)**: `SiteSettings.logo` ImageField (`upload_to="site/"`). Upload / replace / remove from **Admin → Dashboard → Brand logo**.
- When `logo` is set, Navbar, Footer, Splash, AdminShell, and Admin login all show that image. When empty / removed, frontend falls back to the default orb + "Sukka PR".
- Favicons in `public/` (`favicon.png`, `logo-192.png`, `logo-512.png`) stay as static assets (not swapped by custom logo).
- Legacy assets `total-logo.png` / `total-wordmark.png` are unused.

## 2. Splash animation (`src/components/SplashScreen.tsx`)
- Premium cinematic intro: dark gradient bg, drifting brand-color blobs, rotating ribbon rings, orbiting particles.
- **Default logo**: orb spins in from depth; **"Sukka PR"** wipe-reveals; shine sweep; tagline fades in (tagline from `SiteSettings`).
- **Custom logo**: same motion applied to the uploaded image (no separate wordmark).
- Shows once per browser session (sessionStorage key `total_splash_seen`, ~3.4s).
- Initialized via inline `<script>` in `__root.tsx` before hydration: adds `splash-active` only when splash not yet seen, **removes** it when already seen. `html.splash-active` (in `styles.css`) hides header/main/footer and sets a dark body bg.
- **Hydration-safe**: `SplashScreen` starts with `show=false` on SSR; `useLayoutEffect` syncs client state (no server/client mismatch). Failsafe timer + `pageshow` handler clear `splash-active` if stuck after reload/bfcache.

## 3. Admin panel (React, themed, animated)
- Routes (file-based, under `/admin`): … `admin.services.tsx`, `admin.events.tsx`, **`admin.videos.tsx`**, `admin.reviews.tsx`, `admin.account.tsx`.
- `__root.tsx` hides public Navbar/Footer/Splash on `/admin/*` and mounts the sonner `<Toaster>` (success/error toasts on login + all saves).
- `src/components/admin/AdminShell.tsx` = sidebar layout + auth guard (`useRequireAdmin`).
- Auth: token stored in localStorage (`tfs_admin_token`). Helpers in `src/lib/admin-auth.tsx`. API client in `src/lib/api.ts`.
- Admin can manage: site info/contact/socials, **map location**, page banners, home stats/why-us, **home features section** (eyebrow/title/subtitle + cards with icon/title/desc), about leadership (2 CEOs + Manager — name/role/quote/**phone**/**email** + portraits), **brand logo** (dashboard), **services** (+ **Feature toggle** → home), employees, events (+ **Feature toggle** → home), **featured videos** (home carousel below banner), reviews. Dashboard shows counts + banner status + **Brand logo** uploader.
- Leadership phone/email live in `PageContent.extra.leadership.people[]` (About page admin). Shown on public About `LeadershipSection` when set.
- Clear custom logo: `PATCH /site/` with `{ "clear_logo": true }` (or `logo: null`).
- **Feature toggle**: same Switch on Services & Events admin lists. When ON, item appears in its own home section below Our Story (`FeaturedServicesSection` / `FeaturedEventsSection`). Both featured sections use a **one-row carousel**: 3 cards visible on desktop (2 tablet / 1 mobile); left/right arrows show **on hover** only when there are more items than visible.
- **Featured Videos**: model `FeaturedVideo`, admin `/admin/videos` with **↑↓ reorder** (sets play order on home). API `/featured-videos/`. Home carousel below hero — left/right arrows **appear only on hover** over the video.
- **Events**: gallery + hover slideshow + video file on detail. `GET /events/{slug}/`.
- **Services**: gallery + hover slideshow + related services. Public `/services`, `/services/$id`. Banner text uses `pt-28` so it sits below the fixed navbar.

## 4. Public site reads from the API
- `src/lib/content.ts` exposes react-query hooks (`useSiteContent`, `useReviews`, `useEmployees`, `useEvents`, `useServices`, `usePage`) that fetch from the API on every mount (`staleTime: 0`, `placeholderData` from static `site-data.ts` while loading). Public GETs use `auth: false` so admin login doesn't change public responses.
- After admin saves, call `refreshPublicContent(qc)` from `content.ts` to invalidate + refetch all public caches.
- Wired into: `index.tsx`, `about.tsx`, `services` routes, `events.tsx`, `events.$id.tsx`, `employees.$id.tsx`, `Navbar`, `Footer`. Page `title` / `subtitle` / `body` / `banner` from admin now render on the matching public pages. Per-field text colors from admin render via `ColoredText` on all wired sections (hero, stats, why-us, reviews, team, events, footer, etc.).
- Frontend API base URL: `VITE_API_URL` (defaults to `http://localhost:8000/api`).

## 5. Backend / API (`backend/`)
- Models (`api/models.py`): `SiteSettings` (+ optional `logo`), `PageContent`, `Employee`, `EventItem` + `EventImage` (+ `featured`), `ServiceItem` + `ServiceImage` (+ `featured`), **`FeaturedVideo`**, `Review`.
- Endpoints: … `site/` (supports logo upload + `clear_logo`), `events/`, `services/`, **`featured-videos/`**, `reviews/`, `dashboard/stats/`.
- Latest migration: `0008_site_logo`.
- CORS via `django-cors-headers` (allows :8080). Settings are env-driven (`backend/.env`, loaded by a tiny built-in loader).
- `python manage.py seed` creates the **default admin (admin / admin123)** and imports all original content + images (incl. sample services: Premium Petrol, Diesel, EV Fast Charging, Air & Tyre Care).
- DB: **PostgreSQL** by default when `USE_SQLITE=0` in `backend/.env`. Set `USE_SQLITE=1` only for SQLite fallback.

### Backend local setup
- Project venv lives at `Petrol-Pump/venv/`.
- Packages installed. Admin: `admin` / `admin123`.
- **Database: PostgreSQL (active)** — `petrolpump` / user `petrolpump` / pass `petrolpump` @ localhost:5432. `USE_SQLITE=0` in `backend/.env`.
- One-time setup already run via `bash scripts/setup-postgres.sh` (tables migrated + SQLite dump loaded).
- Re-run the script only if DB is wiped; set `USE_SQLITE=1` only for an emergency SQLite fallback.

### Switching / (re)installing PostgreSQL
```bash
# From Petrol-Pump/ — will ask for your sudo password once
bash scripts/setup-postgres.sh

# Then restart backend
cd backend && ../venv/bin/python manage.py runserver 8000
```

Manual equivalent:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres psql -c "CREATE USER petrolpump WITH PASSWORD 'petrolpump';"
sudo -u postgres psql -c "CREATE DATABASE petrolpump OWNER petrolpump;"
sudo -u postgres psql -d petrolpump -c "GRANT ALL ON SCHEMA public TO petrolpump; ALTER SCHEMA public OWNER TO petrolpump;"
# set USE_SQLITE=0 in backend/.env
cd backend && ../venv/bin/python manage.py migrate && ../venv/bin/python manage.py seed
```

### Running everything
```bash
# Activate venv (from Petrol-Pump/)
source venv/bin/activate

# Backend
cd backend
../venv/bin/python manage.py migrate
../venv/bin/python manage.py runserver 8000

# Frontend (separate terminal)
npm run dev   # http://localhost:8080  (admin at /admin)
```

### If `ModuleNotFoundError: No module named 'django'`
Broken/empty venv — recreate and reinstall:
```bash
cd Petrol-Pump
rm -rf venv && python3 -m venv venv
./venv/bin/pip install -r backend/requirements.txt
```


### Data: what lives in the DB vs not
**In DB (admin → API → SQLite/Postgres):** `SiteSettings` (incl. optional **`logo`**), `PageContent` (home/about/events/services banners + copy + about leadership people with phone/email + home stats/whyUs + **home `features` section**), `Employee`, `EventItem`/`EventImage` (+ featured), `ServiceItem`/`ServiceImage` (+ featured), `FeaturedVideo`, `Review`, Django admin user.
**Not in DB (code/assets only):** splash animation chrome, **default** logo assets under `src/assets` & favicons under `public`, feature icon set (lucide keys in `home-features-content.ts`), `site-data.ts` (API loading placeholder only).
**Uploads:** images/videos stored under `backend/media/` (filesystem), paths saved in DB fields (custom logo → `media/site/`).

### Git / venv
- `venv/` must stay ignored. If it was committed earlier: `git rm -r --cached venv` then commit (local folder stays). Do not push the venv folder.

---

## 6. Deploy / go-live (free or low-cost — no paid VPS)

### What this project needs live
| Piece | Tech | Why it matters |
|--------|------|----------------|
| **Frontend** | TanStack Start (SSR) + Vite/Nitro | Not a plain static site — needs Node/SSR host (Cloudflare Pages fits Nitro default) |
| **Backend** | Django + DRF (`:8000`) | Always-on Python process; REST API + token auth admin |
| **DB** | PostgreSQL (or SQLite) | Admin content, reviews, services, etc. |
| **Media** | `backend/media/` on disk | Logo, galleries, videos — **lost on free PaaS redeploy** unless Cloudinary/S3 |
| **Domain** | User already has one | Point DNS A/CNAME to host |

Env must change for production (dashboard only — not hardcode domain in `.py`):
- Backend: `DEBUG=False`, `SECRET_KEY`, `DATABASE_URL` (Neon) or `POSTGRES_*`+SSL, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`
- Frontend build: `VITE_API_URL=https://api.yourdomain.com/api` (or `*.onrender.com/api` before domain)
- Prod packages: `gunicorn` + `whitenoise`; `backend/build.sh`; health at `/api/health/`
- Monorepo: Render Root Directory = `backend`; frontend = Cloudflare Pages same repo root `/`
- Domain: buy/connect AFTER free URLs work; domain goes in DNS + env vars only — see `knowledge_base/DEPLOY.md`

### Recommended free stack (best balance)
1. **DB → [Neon](https://neon.tech)** — free Postgres forever (better than Render free DB which expires ~30 days)
2. **Backend → [Render](https://render.com)** free Web Service — Django API (`api.yourdomain.com`)
3. **Frontend → [Cloudflare Pages](https://pages.cloudflare.com)** — free, custom domain, fits Nitro/Cloudflare target
4. **Media (optional but important) → [Cloudinary](https://cloudinary.com)** free — uploads survive redeploys
5. **DNS** — domain registrar: CNAME `www` / apex → Cloudflare; `api` → Render

### Limits to accept on free
- Render free **sleeps ~15 min** idle → first visitor waits ~30–60s (use free UptimeRobot ping every 10 min)
- Free **no persistent disk** → local `media/` wiped on redeploy unless Cloudinary
- Neon free has storage/compute caps — fine for this site size
- Change default admin password after first seed on live

### Alternate options
| Option | Cost | Notes |
|--------|------|--------|
| **Oracle Cloud Always Free ARM VM** | $0 forever | Real VPS feel; credit card for signup; more setup (nginx + gunicorn + certbot) |
| **Railway** | Free trial credits then pay | Simple deploy; not forever-free |
| **PythonAnywhere** | Free tier | Django OK; custom domain limited on free; media OK on their disk |
| **Fly.io** | Free allowance | Good; needs Dockerfile |
| Full static only | N/A | **Won’t work** — admin + API need Django |

### Deploy readiness checklist (code work before go-live)
- [x] Add `gunicorn`, `whitenoise` to `backend/requirements.txt`
- [x] Production settings: WhiteNoise, `CSRF_TRUSTED_ORIGINS`, secure cookies if HTTPS
- [x] Media: `SERVE_MEDIA=True` on free Render; seed copies from `src/assets` (re-run seed after wipe)
- [x] `render.yaml` — gunicorn start command
- [x] Frontend env example: `VITE_API_URL` (set on Cloudflare Pages build)
- [ ] User: CORS + ALLOWED_HOSTS + DNS with **real domain**
- [ ] User: never commit real `.env` / secrets

**Full start→end human checklist:** `knowledge_base/DEPLOY.md`

### Agent note
Guide user through DEPLOY.md; do not buy paid VPS. Stack = Neon + Render/Koyeb + Cloudflare Pages + domain DNS.
If Render asks for card on Free: prefer finishing Render with Free+$0 verify **or** switch to **Koyeb** (best free Django alternative that works with Neon; PythonAnywhere free cannot reach Neon Postgres).
