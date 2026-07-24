# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Clipse is a cross-device clipboard sharing app. A user owns named **clipboards**, each holding a stream of **clipboard data** entries that are either `text` or `image`. It is a two-part monorepo:

- `backend/` — FastAPI + SQLAlchemy (SQLite), cookie-based JWT auth.
- `frontend/` — Next.js 16 (App Router, JavaScript, React 19, Tailwind v4).

> The notification-service idea this repo once also housed was split out to `ark/` (gitignored), so Clipse is now a single-purpose clipboard app.

## Commands

### Backend (run from inside `backend/`)
The app imports as `from api...`, so uvicorn **must** be launched with `backend/` as the working directory.
```bash
cd backend
source .venv/bin/activate          # virtualenv lives at backend/.venv
pip install -r requirements.txt
python scripts/create_tables.py    # create SQLite tables (clipboard.db)
uvicorn main:app --reload          # serves on http://localhost:8000
```
`tests/test_auth.py` is a standalone script (uses `requests` against a live server), not a pytest suite. Run it with `python tests/test_auth.py` while the server is up.

### Frontend (run from inside `frontend/`)
```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```
Requires `frontend/.env.local` with `NEXT_PUBLIC_API_URL` pointing at the backend (e.g. `http://localhost:8000` locally; `/api/backend` on Vercel). The API is mounted at the **root** — there is no `/clipboard` path prefix.

## Architecture

### Backend
- Entry point `backend/main.py` builds the `FastAPI` app and configures CORS for `localhost:3000`. `backend/api/routers.py` mounts the clipboard router at the **root** (no prefix), so endpoints are `/auth/...`, `/clipboards/...`, `/images/{id}`, `/cron/cleanup`.
- The app lives in one package: `backend/api/clipboard/`, split into `routes.py` (HTTP layer) → `service.py` (DB/business logic) → `models.py` (SQLAlchemy tables) + `schemas.py` (Pydantic), plus `auth.py` and `emailer.py`.
- `backend/api/core/database.py` defines the SQLAlchemy `engine`, `SessionLocal`, and `Base`. There are no Alembic migrations wired up despite `alembic` being in requirements — schema is created by `scripts/create_tables.py` (or wiped/recreated by `scripts/reset_tables.py`).
- **Data model** (`clipboard/models.py`): `User` 1→N `Clipboard` 1→N `ClipboardData`; `User` 1→N `Device`. Registering a user auto-creates a clipboard named `"main"`. `ClipboardData.content` holds the text for text entries or the private blob pathname for images; image bytes are stored in Vercel Blob (private) and served back through the authenticated `GET /images/{id}` proxy. Entries carry a frozen `expires_at` for TTL; `GET /cron/cleanup` purges expired rows.

### Auth (cookie-based, important)
- Auth lives in `backend/api/clipboard/auth.py`. Login sets two **httponly** cookies, `access_token` and `refresh_token`, with `secure=True; samesite=none`. `get_current_user` reads the JWT from the `access_token` **cookie** (not the `Authorization` header), so all authenticated requests must send cookies.
- Email verification is **active**: `register_user` sets `is_verified=False`, `POST /auth/register` emails a verify link via `emailer.py` (Gmail SMTP, configured through `SMTP_*` env vars), and `GET /auth/verify` flips the flag then redirects to `{FRONTEND_URL}/login?verified=1`. `POST /auth/resend-verification` reissues the link. `authenticate_user` rejects unverified users. URL bases come from the `BACKEND_PUBLIC_URL` / `FRONTEND_URL` env vars. Setting `SKIP_EMAIL_VERIFICATION=true` (local/dev only; `run.sh` defaults it on) makes `register_user` create already-verified accounts and the register route skip the email send (response carries `verification_skipped: true`, and the frontend routes straight to `/login?registered=1`).
- Secret keys (`SECRET_KEY`, `REFRESH_SECRET_KEY`, etc.) are hardcoded in `auth.py` — replace with env-based config before any real deployment.

### Frontend
- `src/api/api.js` exports `apiFetch`, the single fetch wrapper. It always sends `credentials: "include"`; on a `401` it transparently POSTs `/auth/refresh` and retries once, redirecting to `/login` if refresh fails. Detects `FormData` bodies (used for image uploads) and skips the JSON content-type. `src/api/auth.js` and `src/api/clipboard.js` are thin per-endpoint wrappers over it.
- App Router with route groups: `(auth)` (login/register) and `(protected)` (dashboard, clipboards). `src/proxy.js` (Next.js proxy/middleware, Node runtime) gates `/dashboard` and `/clipboards` on the presence of the `access_token` cookie and bounces logged-in users away from `/login`/`/register`.
- Global state via React Context: `UserProvider` (`src/context/UserContext.js`, exposes `useUser`) and `ClipboardsProvider` (`src/context/ClipboardContext.js`, exposes `useClipboards`). Both fetch on mount and expose a `refresh()` to refetch. They wrap the `(protected)` layout.
- Path alias `@/*` → `./src/*` (`jsconfig.json`). The React Compiler is enabled in `next.config.mjs`. Styling is Tailwind v4 + `lucide-react` icons.

## Conventions
- Backend HTTP handlers stay thin; put DB queries and logic in the feature's `service.py` and convert ORM objects with their `to_dict()` / Pydantic schemas at the boundary.
- New authenticated endpoints take `current_user=Depends(auth.get_current_user)` and `db: Session = Depends(auth.get_db)`.
- New frontend backend calls go through `apiFetch` (not raw `fetch`) so cookie auth and the 401-refresh retry are applied.
