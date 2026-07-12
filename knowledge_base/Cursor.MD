# Petrol Pump — Agent Knowledge Base

Read this before making changes. Multiple agents work on this repo — keep it updated.

## Project shape
- **Frontend**: TanStack Start (React 19, SSR) + Vite, Tailwind v4, framer-motion, shadcn-style UI in `src/components/ui`. Dev server runs on **:8080**. Lovable-connected (don't rewrite pushed git history).
- **Backend**: Django 6 + Django REST Framework in `backend/`. App = `api`. Runs on **:8000**.

---

## 1. Logo (used everywhere)
- Brand wordmark text is **Sukka PR** (replaced baked-in "TOTAL" image text). Orb mark unchanged.
- Assets in `src/assets/`: `total-orb.png` (mark used live), `total-logo.png` / `total-wordmark.png` (legacy; no longer rendered).
- Favicons in `public/`: `favicon.png`, `logo-192.png`, `logo-512.png` (referenced in `__root.tsx` head).
- `src/components/Logo.tsx` = orb + "Sukka PR" text; used by Navbar, Footer, AdminShell.
- Splash + admin login also show orb + "Sukka PR" (not the old TOTAL wordmark PNG).

## 2. Splash animation (`src/components/SplashScreen.tsx`)
- Premium cinematic intro: dark gradient bg, drifting brand-color blobs, rotating ribbon rings, orbiting particles. The **orb** spins in from depth (scale/rotate) and locks; then the **"Sukka PR"** wordmark wipe-reveals; shine sweep; tagline fades in.
- Shows once per browser session (sessionStorage key `total_splash_seen`, ~3.4s).
- Initialized via inline `<script>` in `__root.tsx` before hydration: adds `splash-active` only when splash not yet seen, **removes** it when already seen. `html.splash-active` (in `styles.css`) hides header/main/footer and sets a dark body bg.
- **Hydration-safe**: `SplashScreen` starts with `show=false` on SSR; `useLayoutEffect` syncs client state (no server/client mismatch). Failsafe timer + `pageshow` handler clear `splash-active` if stuck after reload/bfcache.

## 3. Admin panel (React, themed, animated)
- Routes (file-based, under `/admin`): … `admin.services.tsx`, `admin.events.tsx`, **`admin.videos.tsx`**, `admin.reviews.tsx`, `admin.account.tsx`.
- `__root.tsx` hides public Navbar/Footer/Splash on `/admin/*` and mounts the sonner `<Toaster>` (success/error toasts on login + all saves).
- `src/components/admin/AdminShell.tsx` = sidebar layout + auth guard (`useRequireAdmin`).
- Auth: token stored in localStorage (`tfs_admin_token`). Helpers in `src/lib/admin-auth.tsx`. API client in `src/lib/api.ts`.
- Admin can manage: site info/contact/socials, **map location**, page banners, home stats/why-us, about leadership (2 CEOs + Manager), **services** (+ **Feature toggle** → home), employees, events (+ **Feature toggle** → home), **featured videos** (home carousel below banner), reviews. Dashboard shows counts + banner status.
- **Feature toggle**: same Switch on Services & Events admin lists. When ON, item appears in its own home section below Our Story (`FeaturedServicesSection` / `FeaturedEventsSection`).
- **Featured Videos**: model `FeaturedVideo`, admin `/admin/videos` with **↑↓ reorder** (sets play order on home). API `/featured-videos/`. Home carousel below hero — left/right arrows **appear only on hover** over the video.
- **Events**: gallery + hover slideshow + video file on detail. `GET /events/{slug}/`.
- **Services**: gallery + hover slideshow + related services. Public `/services`, `/services/$id`. Banner text uses `pt-28` so it sits below the fixed navbar.

## 4. Public site reads from the API
- `src/lib/content.ts` exposes react-query hooks (`useSiteContent`, `useReviews`, `useEmployees`, `useEvents`, `useServices`, `usePage`) that fetch from the API on every mount (`staleTime: 0`, `placeholderData` from static `site-data.ts` while loading). Public GETs use `auth: false` so admin login doesn't change public responses.
- After admin saves, call `refreshPublicContent(qc)` from `content.ts` to invalidate + refetch all public caches.
- Wired into: `index.tsx`, `about.tsx`, `services` routes, `events.tsx`, `events.$id.tsx`, `employees.$id.tsx`, `Navbar`, `Footer`. Page `title` / `subtitle` / `body` / `banner` from admin now render on the matching public pages. Per-field text colors from admin render via `ColoredText` on all wired sections (hero, stats, why-us, reviews, team, events, footer, etc.).
- Frontend API base URL: `VITE_API_URL` (defaults to `http://localhost:8000/api`).

## 5. Backend / API (`backend/`)
- Models (`api/models.py`): `SiteSettings`, `PageContent`, `Employee`, `EventItem` + `EventImage` (+ `featured`), `ServiceItem` + `ServiceImage` (+ `featured`), **`FeaturedVideo`**, `Review`.
- Endpoints: … `events/`, `services/`, **`featured-videos/`**, `reviews/`, `dashboard/stats/`.
- CORS via `django-cors-headers` (allows :8080). Settings are env-driven (`backend/.env`, loaded by a tiny built-in loader).
- `python manage.py seed` creates the **default admin (admin / admin123)** and imports all original content + images (incl. sample services: Premium Petrol, Diesel, EV Fast Charging, Air & Tyre Care).
- DB: **PostgreSQL by default**; `USE_SQLITE=1` in `backend/.env` is currently ON so it runs with zero setup. JSONField list fields (e.g. employee `responsibilities`, service `highlights`) are saved as JSON, and images are uploaded via a **separate multipart PATCH** (so JSON + file never collide).

### Backend local setup (done)
- `backend/.env` created with `USE_SQLITE=1` (no Postgres needed for local).
- `backend/requirements.txt` pins: Django 6.0.6, DRF, cors-headers, psycopg[binary], Pillow.
- Project venv lives at `Petrol-Pump/venv/` (recreated if shebang path breaks after folder moves).
- Packages installed; migrate + seed already run. Admin: `admin` / `admin123`.

### Running everything
```bash
# Activate venv (from Petrol-Pump/)
source venv/bin/activate

# Backend
cd backend
../venv/bin/python manage.py migrate
../venv/bin/python manage.py seed
../venv/bin/python manage.py runserver 8000
# or after activate: python manage.py runserver 8000

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

### Switching to real PostgreSQL (needs sudo once)
```bash
sudo apt install -y postgresql
sudo -u postgres psql -c "CREATE USER petrolpump WITH PASSWORD 'petrolpump';"
sudo -u postgres psql -c "CREATE DATABASE petrolpump OWNER petrolpump;"
# then set USE_SQLITE=0 in backend/.env and re-run migrate + seed
```

### Gotchas
- `vite.config.ts` ignores `venv/`, `backend/`, `__pycache__/` from the dev watcher (they used to spam reloads).
- `routeTree.gen.ts` is auto-generated by the router plugin while `npm run dev` runs — new `admin.*` routes need the dev server running once to register types.
- Background processes don't persist between agent tool calls; run servers in your own terminals.
