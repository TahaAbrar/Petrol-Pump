# Petrol Pump — Agent Knowledge Base

Read this before making changes. Multiple agents work on this repo — keep it updated.

## Project shape
- **Frontend**: TanStack Start (React 19, SSR) + Vite, Tailwind v4, framer-motion, shadcn-style UI in `src/components/ui`. Dev server runs on **:8080**. Lovable-connected (don't rewrite pushed git history).
- **Backend**: Django 6 + Django REST Framework in `backend/`. App = `api`. Runs on **:8000**.

---

## 1. Logo (used everywhere)
- Source logo had a black background. Transparent PNGs were generated into `src/assets/`:
  - `total-logo.png` (full lockup), `total-orb.png` (just the mark), `total-wordmark.png` ("TOTAL" text).
  - Favicons in `public/`: `favicon.png`, `logo-192.png`, `logo-512.png` (referenced in `__root.tsx` head).
- `src/components/Logo.tsx` imports `@/assets/total-logo.png` and is used by Navbar, Footer, AdminShell.
- The transparent PNGs were made with Pillow (helper script was removed after use). To regenerate, recrop from the source with Pillow and the same thresholds (alpha ramp 28–72).

## 2. Splash animation (`src/components/SplashScreen.tsx`)
- Premium cinematic intro: dark gradient bg, drifting brand-color blobs, rotating ribbon rings, orbiting particles. The **orb** spins in from depth (scale/rotate) and locks; then the **wordmark** wipe-reveals; shine sweep; tagline fades in.
- Shows once per browser session (sessionStorage key `total_splash_seen`, ~3.4s).
- Initialized via inline `<script>` in `__root.tsx` before hydration: adds `splash-active` only when splash not yet seen, **removes** it when already seen. `html.splash-active` (in `styles.css`) hides header/main/footer and sets a dark body bg.
- **Hydration-safe**: `SplashScreen` starts with `show=false` on SSR; `useLayoutEffect` syncs client state (no server/client mismatch). Failsafe timer + `pageshow` handler clear `splash-active` if stuck after reload/bfcache.

## 3. Admin panel (React, themed, animated)
- Routes (file-based, under `/admin`): `admin.index.tsx` (redirect), `admin.login.tsx`, `admin.dashboard.tsx`, `admin.site.tsx`, `admin.pages.tsx`, `admin.employees.tsx`, `admin.events.tsx`, `admin.reviews.tsx`, **`admin.account.tsx`** (update username/email/password).
- `__root.tsx` hides public Navbar/Footer/Splash on `/admin/*` and mounts the sonner `<Toaster>` (success/error toasts on login + all saves).
- `src/components/admin/AdminShell.tsx` = sidebar layout + auth guard (`useRequireAdmin`).
- Auth: token stored in localStorage (`tfs_admin_token`). Helpers in `src/lib/admin-auth.tsx`. API client in `src/lib/api.ts`.
- Admin can manage: site info/contact/socials, **map location** (`maps_query` with live preview), page banners + titles + body, **home** stats/why-us boxes, **about** our-story + leadership boxes (no raw JSON), employees (with photo upload), events (with image upload), reviews (add/edit/delete/approve). Dashboard shows counts + banner status.
- **Text colors**: banner text only (subtitle, title, body) in **Pages & Banners** via `ColoredField`.
- **Events**: multiple gallery images (`EventImage` model), hover slideshow on event cards (2s), gallery on detail page, **video file upload** (not URL) shown at bottom of detail page. API supports slug or numeric id lookup. `GET /events/{slug}/` for public detail via `useEvent(slug)`.
- **Admin account**: `PATCH /api/auth/credentials/` — change username, email, password (saved to Django user in DB).
- **Contact page removed** from public site (nav, footer, sitemap, admin pages tab). Contact info remains in footer via site settings.
- **About page** `PageContent` also has `story_image` + `founder_image` (uploaded in admin → Pages → about). Shown on home Our Story preview and About Leadership section.

## 4. Public site reads from the API
- `src/lib/content.ts` exposes react-query hooks (`useSiteContent`, `useReviews`, `useEmployees`, `useEvents`, `usePage`) that fetch from the API on every mount (`staleTime: 0`, `placeholderData` from static `site-data.ts` while loading). Public GETs use `auth: false` so admin login doesn't change public responses.
- After admin saves, call `refreshPublicContent(qc)` from `content.ts` to invalidate + refetch all public caches.
- Wired into: `index.tsx`, `about.tsx`, `events.tsx`, `events.$id.tsx`, `employees.$id.tsx`, `Navbar`, `Footer`. Page `title` / `subtitle` / `body` / `banner` from admin now render on the matching public pages. Per-field text colors from admin render via `ColoredText` on all wired sections (hero, stats, why-us, reviews, team, events, footer, etc.).
- Frontend API base URL: `VITE_API_URL` (defaults to `http://localhost:8000/api`).

## 5. Backend / API (`backend/`)
- Models (`api/models.py`): `SiteSettings` (singleton), `PageContent`, `Employee`, `EventItem` + **`EventImage`** gallery, `Review`. `EventItem.video` = uploaded file (replaces old `video_url`). Images via `ImageField` / `FileField` → `backend/media/`.
- Endpoints: `auth/login/`, `auth/logout/`, `auth/me/`, **`auth/credentials/`** (PATCH), `site/`, `pages/<key>/`, `employees/`, `events/` (+ `POST events/{id}/gallery/`, `DELETE events/{id}/gallery/{image_id}/`), `reviews/`, `dashboard/stats/`.
- CORS via `django-cors-headers` (allows :8080). Settings are env-driven (`backend/.env`, loaded by a tiny built-in loader).
- `python manage.py seed` creates the **default admin (admin / admin123)** and imports all original content + images.
- DB: **PostgreSQL by default**; `USE_SQLITE=1` in `backend/.env` is currently ON so it runs with zero setup. JSONField list fields (e.g. employee `responsibilities`) are saved as JSON, and images are uploaded via a **separate multipart PATCH** (so JSON + file never collide).

### Running everything
```bash
# Backend
cd backend
../venv/bin/python manage.py migrate
../venv/bin/python manage.py seed
../venv/bin/python manage.py runserver 8000

# Frontend (separate terminal)
npm run dev   # http://localhost:8080  (admin at /admin)
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
