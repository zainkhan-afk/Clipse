# Clipse

Clipse is a minimal, cross-device clipboard that keeps your text and images in sync
across every device you sign in on. Copy something on your phone and paste it on your
laptop moments later — no emailing yourself links or pinging a chat just to move a
snippet between screens. Content is organized into named **clipboards** (e.g. `work`,
`phone`, `scratch`), each holding a running stream of **text or image** entries. Any
clipboard can be given a time-to-live so its entries expire on their own — handy for
one-time codes and anything you'd rather not leave lying around.

Portfolio project: **FastAPI** backend + **Next.js** frontend, cookie-based JWT auth.

**Live demo:** https://clipse-app.vercel.app

## Features

- Named clipboards, each a stream of text/image entries
- Optional per-clipboard TTL — entries auto-expire
- Accounts with email verification, password reset, and a settings page
- Light / dark / system themes, mobile-friendly

## Stack

- **Backend:** FastAPI + SQLAlchemy (SQLite locally, Postgres-ready), JWT in httpOnly cookies
- **Frontend:** Next.js 16 (App Router, JavaScript), React 19, Tailwind v4

## Run locally

**Prerequisites:** Python 3.10+ and Node 20+.

**1. Backend** — from `backend/`:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/create_tables.py      # creates clipboard.db
SKIP_EMAIL_VERIFICATION=true uvicorn main:app --reload   # http://localhost:8000
```

**2. Frontend** — from `frontend/` in a second terminal:

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev                          # http://localhost:3000
```

Open **http://localhost:3000**.

> Tip: after the one-time installs above, `./run.sh` from the repo root starts both at once.

## First login

The commands above set `SKIP_EMAIL_VERIFICATION=true`, so new accounts are created
already verified — just register and sign in, no SMTP needed. (`./run.sh` sets this for
you too.)

To exercise the real email flow, set `SMTP_USER` and `SMTP_PASS` (a Gmail address +
[app password](https://support.google.com/accounts/answer/185833)) and start the backend
with `SKIP_EMAIL_VERIFICATION=false`.

## Configuration

The backend reads config from environment variables, with safe local fallbacks where possible:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres URL (defaults to local SQLite) |
| `SECRET_KEY`, `REFRESH_SECRET_KEY`, `EMAIL_VERIFY_SECRET_KEY`, `PASSWORD_RESET_SECRET_KEY` | JWT signing — set strong values in production |
| `SMTP_USER`, `SMTP_PASS` | Email sending (verification, password reset) |
| `SKIP_EMAIL_VERIFICATION` | Set `true` locally to create verified accounts and skip the verification email |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token — required to send **images** (text works without it) |

Text sharing works with zero extra config; email and image upload need the vars above.

Architecture and deployment notes live in [`CLAUDE.md`](CLAUDE.md).

## License

MIT — see [`LICENSE`](LICENSE).
