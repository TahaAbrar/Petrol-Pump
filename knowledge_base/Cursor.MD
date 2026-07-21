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
- Initialized via inline `<script>` in `__root.tsx` before hydration: adds `splash-active` only when splash not yet seen **and path is not `/admin`**, **removes** it when already seen or on admin. `html.splash-active` (in `styles.css`) hides `header`/`main`/`footer` and sets a dark body bg.
- **Admin bug (fixed 2026-07-19)**: AdminShell uses `<header>` + `<main>`. Visiting `/admin/*` without seeing public splash left `splash-active` on forever → blank admin content (sidebar still visible). Fix: skip/clear `splash-active` on admin in inline script + `RootComponent` `useEffect`.
- **Hydration-safe**: `SplashScreen` starts with `show=false` on SSR; `useLayoutEffect` syncs client state (no server/client mismatch). Failsafe timer + `pageshow` handler clear `splash-active` if stuck after reload/bfcache.

## 3. Admin panel (React, themed, animated)
- Routes (file-based, under `/admin`): … `admin.services.tsx`, `admin.events.tsx`, **`admin.videos.tsx`**, `admin.reviews.tsx`, `admin.account.tsx`, **`admin.about.tsx`**.
- `__root.tsx` hides public Navbar/Footer/Splash on `/admin/*` and mounts the sonner `<Toaster>` (success/error toasts on login + all saves).
- `src/components/admin/AdminShell.tsx` = sidebar layout + auth guard (`useRequireAdmin`). NAV includes **About Us** (`/admin/about`, Users icon) after Pages & Banners.
- Auth: token stored in localStorage (`tfs_admin_token`). Helpers in `src/lib/admin-auth.tsx`. API client in `src/lib/api.ts`.
- Admin can manage: site info/contact/socials, **map location**, page banners, home stats/why-us, **home features section** (eyebrow/title/subtitle + cards with icon/title/desc), **About Us** (dedicated admin — see below), **brand logo** (dashboard), **services** (+ **Feature toggle** → home), employees, events (+ **Feature toggle** → home), **featured videos** (home carousel below banner), reviews. Dashboard shows counts + banner status + **Brand logo** uploader.
- **Pages admin UX** (`admin.pages.tsx`): Banner is a selectable card with `SectionActionBar` (Edit / Undo). Edit mode supports multi banner images (`banner_images`), `banner_fields` flags, home stats add/remove (capped to max at edit entry), ColoredField text. Save uses `create_undo` + `undo_scope: "banner"` (+ `archive_banner_images` on image changes, then re-upload kept via `urlToFile` + new files). Home feature cards are selectable with Edit / Duplicate / Delete / Undo (`feature_card:{i}`). Page list filters out `about`, `about_story`, `about_leadership` (managed only in `/admin/about`).
- **About Us admin** (`admin.about.tsx`, 2026-07-21): Tabs Overview | Our Story | Leadership. Overview (`/pages/about/`): banner multi-upload + title/subtitle + RichTextEditor body. Our Story (`about_story`): banner + body RTE + story gallery (`story-images/` with captions/orders) + mission/vision in `extra`. Leadership (`about_leadership` banner optional) + CRUD `/about-people/?kind=leader|director` (FormData image; directors have `border_color`). Backend auto-creates page keys on Pages viewset `initial`.
- Legacy leadership phone/email in `PageContent.extra.leadership.people[]` may still exist on old data; public Leadership now uses `AboutPerson` via `/about-people/`.
- Clear custom logo: `PATCH /site/` with `{ "clear_logo": true }` (or `logo: null`).
- **Feature toggle**: same Switch on Services & Events admin lists. When ON, item appears in its own home section below Our Story (`FeaturedServicesSection` / `FeaturedEventsSection`). Both featured sections use a **one-row carousel**: 3 cards visible on desktop (2 tablet / 1 mobile); left/right arrows show **on hover** only when there are more items than visible.
- **Featured Videos**: model `FeaturedVideo`, admin `/admin/videos` with **↑↓ reorder** (sets play order on home). API `/featured-videos/`. Home carousel below hero — left/right arrows **appear only on hover** over the video.
- **Events**: gallery + hover slideshow + video file on detail. `GET /events/{slug}/`.
- **Services**: gallery + hover slideshow + related services. Public `/services`, `/services/$id`. Banner text uses `pt-28` so it sits below the fixed navbar.
- **Our Businesses / Home (2026-07-21 update):** Home shows **Our Businesses** cards below Our Story (same DB as `/businesses`). Home FAQ from `SiteSettings.faqs` (edit in Site Info). Why choose us + Location removed from home; each business page ends with Why choose us (`Business.why_us`) + Location map (`Business.address` / `maps_query`) + Get directions. Navbar Get Directions removed. Footer description = `SiteSettings.footer_description`; Open in Google Maps removed. **Footer Locations** = each business name + `Business.address` (from Site Info per-business locations). Site Info has no global Footer address field. Business admin: Why choose us + **icon_key / accent_color** (for About “consists of”). Migration `0013_footer_faqs_business_location`.

- **About Us redesign (2026-07-21):** Navbar **About Us** dropdown → Overview (`/about`), Our Story (`/about/our-story`), Leadership Overview (`/about/leadership`). Layout: `about.tsx` = `<Outlet />`, overview in `about.index.tsx` (nested child routes need Outlet or URL changes without page swap). Public:
  - Overview: banner + dots, About Us HTML body, “Sukka Group consists of” 2-col icon/name/short_description from businesses.
  - Our Story: banner + dots, rich body (H1/H2 + color), ordered captioned story images (left/center/right timeline), mission/vision.
  - Leadership: CEO/managers (2/row, odd centered) with Read more message; Board of Directors bordered boxes (image left, name/role/desc right).
  - Home hero: text **left**; clear banners (no bottom fog); multi-banner **dots**. Home Our Story teaser = first 6 story images + `line-clamp-6` body + Read more → `/about/our-story`.
  - **Navbar (2026-07-21):** Top of page = full-width fixed bar above banner — height `h-16` / `lg:h-[4.25rem]` matched by `main` `pt-16` / `lg:pt-[4.25rem]` (no gap, no bottom border when unscrolled). On scroll → floating rounded pill. Desktop: logo left, **nav centered**, red **Contact** button right → opens Contact popup (left: site email + per-business phones; right: required first/last name, email, Nature of Enquiry = business select, comment). Submit → `POST /api/contact/`. **Mobile/tablet (`<lg`):** hamburger + accordion About/Businesses + Contact. Admin: Site Info → Business locations → **Contact phone** per business (`Business.phone`). Migration **`0015_business_phone_contact_inquiry`**.
  - Admin `/admin/about` (Overview | Our Story | Leadership). Pages & Banners filters out about keys. API: `AboutStoryImage`, `AboutPerson`, page keys `about` / `about_story` / `about_leadership`, `/about-people/?kind=`, `story-images/` on pages. Migration **`0014_about_pages_story_leadership`**.

- **Our Businesses** (added 2026-07-21): Navbar hover dropdown → Overview + 4 business pages. Public `/businesses` (overview) and `/businesses/$slug`. Admin `/admin/businesses`. Models: `BusinessHub`, `BusinessHubBannerImage`, `Business`, `BusinessBannerImage`, `BusinessGalleryImage`, `BusinessTeamMember`. API: `/business-hub/`, `/business-hub/save/`, `/business-hub/banner-images/`, `/businesses/`, `/businesses/{slug}/` (+ banner/gallery/team actions). Overview page: banner slider + editable banner text/visibility (`banner_subtitle/title/body`, `banner_fields`), overview section (rich HTML + image), business cards with **Read more button → that business page**. Business page: banner slider (no “All businesses” back link) + editable banner text, section visibility/name via `section_meta` (`background` / **`investment`** / `overview` / `team`). **Content sections layout:** centered title + underline → centered long detail → bottom image row (`GalleryRowSlider`: 4 visible; if more than 4, auto-advance every 4s). Team grid unchanged. **Admin:** Only Banner shows Edit + 5‑min Undo; Team add/delete live in UI (backend re-fetches relations after mutate — fixes stale prefetch empty list); `RichTextEditor` height **300px**. Migration `0012_investment_history`.

## 4. Public site reads from the API
- `src/lib/content.ts` exposes react-query hooks (`useSiteContent`, `useReviews`, `useEmployees`, `useEvents`, `useServices`, `usePage`) that fetch from the API on every mount (`staleTime: 0`, `placeholderData` from static `site-data.ts` while loading). Public GETs use `auth: false` so admin login doesn't change public responses.
- After admin saves, call `refreshPublicContent(qc)` from `content.ts` to invalidate + refetch all public caches.
- Wired into: `index.tsx`, `about.tsx`, `services` routes, `events.tsx`, `events.$id.tsx`, `employees.$id.tsx`, `Navbar`, `Footer`. Page `title` / `subtitle` / `body` / `banner` (+ **`banner_images` slider**, 3s) from admin now render on the matching public pages via `BannerSlider`. Hero/page banners use a **light bottom fade only** (no heavy white fog) so photos stay sharp. About / Events / Services banners are near full-viewport (`h-[92svh]`). Per-field text colors from admin render via `ColoredText` on all wired sections (hero, stats, why-us, reviews, team, events, footer, etc.).
- Frontend API base URL: `VITE_API_URL` (defaults to `http://localhost:8000/api` only for local dev). **Production:** `.env.production` + `deploy-vps.sh` bake `https://sukkagroupofcompanies.com/api`. Never ship a build with localhost — browsers on the public site cannot reach the VPS loopback (symptoms: Network tab `http://localhost:8000/api/...` failed fetch). Runtime fallback in `api.ts` also uses `window.location.origin/api` when env is missing on a non-localhost host.

## 5. Backend / API (`backend/`)
- Models (`api/models.py`): `SiteSettings` (+ optional `logo`), `PageContent`, **`BannerImage`**, **`UndoSnapshot`**, `Employee`, `EventItem` + `EventImage` (+ `featured`), `ServiceItem` + `ServiceImage` (+ `featured`), **`FeaturedVideo`**, `Review`.
- Endpoints: … `site/` (supports logo upload + `clear_logo`), `pages/` (+ `banner-images/`, `undo/`), `events/`, `services/`, **`featured-videos/`**, `reviews/`, `dashboard/stats/`.
- Latest migration: `0015_business_phone_contact_inquiry` (per-business phone + ContactInquiry form).
- CORS via `django-cors-headers` (allows :8080). Settings are env-driven (`backend/.env`, loaded by a tiny built-in loader).
- **Media in production**: `backend/urls.py` always mounts `django.views.static.serve` for `/media/` (and `/static/`) because Django’s `static()` helper is a no-op when `DEBUG=False`. Nginx proxies `/media/` → gunicorn. Without this, live images/videos 404.
- `python manage.py seed` creates the **default admin (admin / admin123)** and imports all original content + images (incl. sample services: Premium Petrol, Diesel, EV Fast Charging, Air & Tyre Care). Also seeds a live `BannerImage` from each page’s primary `banner`.
- DB: **PostgreSQL** by default when `USE_SQLITE=0` in `backend/.env`. Set `USE_SQLITE=1` only for SQLite fallback.

### Backend local setup
- Project venv lives at `Petrol-Pump/venv/` (also usable: `backend/venv/`).
- Packages installed. Admin: `admin` / `admin123`.
- **Database: PostgreSQL (active)** — `petrolpump` / user `petrolpump` / pass `petrolpump` @ localhost:5432. `USE_SQLITE=0` in `backend/.env`.
- One-time setup: Postgres installed, cluster online on 5432, migrations applied, `scripts/sqlite_data_dump.json` loaded (2026-07-16).
- If `Connection refused` on 5432: Postgres stopped/missing → `systemctl start postgresql` (or reinstall via `apt install postgresql postgresql-contrib` then recreate user/db). After OS rebuild (2026-07-18): Postgres 17 reinstalled, migrations + dump reloaded, gunicorn/frontend units + SSL reissued.
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
**In DB (admin → API → SQLite/Postgres):** `SiteSettings` (incl. optional **`logo`**), `PageContent` (home/about/events/services banners + **`BannerImage` slides** + copy + about leadership people with phone/email + home stats/whyUs + **home `features` section** + optional `banner_fields`), **`UndoSnapshot`** (5‑min admin undo), `Employee`, `EventItem`/`EventImage` (+ featured), `ServiceItem`/`ServiceImage` (+ featured), `FeaturedVideo`, `Review`, Django admin user.
**Not in DB (code/assets only):** splash animation chrome, **default** logo assets under `src/assets` & favicons under `public`, feature icon set (lucide keys in `home-features-content.ts`), `site-data.ts` (API loading placeholder only).
**Uploads:** images/videos stored under `backend/media/` (filesystem), paths saved in DB fields (custom logo → `media/site/`; banner slides → `media/banners/`).

### Git / venv
- `venv/` must stay ignored. If it was committed earlier: `git rm -r --cached venv` then commit (local folder stays). Do not push the venv folder.

---

## 6. VPS production deploy (sukkagroupofcompanies.com)
Server IP: **169.58.29.84**. Same domain serves frontend + backend via nginx.

### Architecture
- **Frontend**: Nitro Node SSR on `127.0.0.1:8080` (`sukka-frontend.service`) — entry `.output/server/index.mjs`
- **Backend**: gunicorn on `127.0.0.1:8000` (`sukka-gunicorn.service`) — **Requires** `postgresql.service`; waits for `:5432` before start
- **Database**: PostgreSQL 17 (`postgresql.service`) — must stay enabled on boot
- **Watchdog**: `sukka-watchdog.timer` every ~2 min runs `scripts/ensure-live.sh` (recreates `/run/postgresql` if missing, starts crashed units, health-checks API/FE)
- **Nginx**: public `:80` (and `:443` after SSL)
  - `/api/`, `/media/`, `/static/`, `/django-admin/` → gunicorn
  - everything else → frontend SSR
- React admin: `https://DOMAIN/admin/` · Django admin: `/django-admin/`
- Build uses `nitro: { preset: "node-server" }` in `vite.config.ts` and `VITE_API_URL=https://DOMAIN/api`

**Important:** Closing Cursor / the project folder does **not** stop the live site. Production runs via **systemd**, independent of the IDE. If API shows no data, usually Postgres or gunicorn crashed — run `bash scripts/ensure-live.sh` or wait for the watchdog timer.

### One-shot deploy / refresh
```bash
cd /root/suka-petrol/Petrol-Pump
bash scripts/deploy-vps.sh
# optional: CERTBOT_EMAIL=you@email.com DOMAIN=sukkagroupofcompanies.com bash scripts/deploy-vps.sh
```
Deploy copies an HTTP-only nginx template, then **re-attaches Let's Encrypt SSL** if `/etc/letsencrypt/live/DOMAIN` exists (required — browsers use HSTS/HTTPS; without :443 the site shows `ERR_CONNECTION_REFUSED`). Fixed 2026-07-20 after a deploy wiped certbot's 443 block.

### Keep-alive / recovery
```bash
bash /root/suka-petrol/Petrol-Pump/scripts/ensure-live.sh
systemctl status sukka-gunicorn sukka-frontend postgresql nginx sukka-watchdog.timer
systemctl list-timers sukka-watchdog.timer
```

### SSL (Let’s Encrypt)
Installed **2026-07-16** for `sukkagroupofcompanies.com` + `www` (auto-renew via certbot timer). Expires ~2026-10-14.
HTTP → HTTPS redirect is on. Re-issue only if cert is gone:
```bash
certbot --nginx -d sukkagroupofcompanies.com -d www.sukkagroupofcompanies.com \
  --agree-tos -m admin@sukkagroupofcompanies.com --redirect
```
Live URLs: https://sukkagroupofcompanies.com/ · https://sukkagroupofcompanies.com/api/ · https://sukkagroupofcompanies.com/admin/

### Useful commands
```bash
systemctl status sukka-gunicorn sukka-frontend nginx
systemctl restart sukka-gunicorn sukka-frontend
journalctl -u sukka-gunicorn -u sukka-frontend -f
```

Config files in repo: `scripts/gunicorn.service`, `scripts/frontend.service`, `scripts/nginx-sukka.conf`, `scripts/deploy-vps.sh`.

---

## 7. Deploy note (legacy)
Render / Koyeb / Neon PaaS deploy files were removed. Keep `USE_SQLITE=0` and `POSTGRES_*` in `backend/.env`. Production also needs `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `DEBUG=False`.
