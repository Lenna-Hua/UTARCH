# UTARCH — Uyen Ton Portfolio

Full-stack portfolio site with a public blueprint aesthetic and an admin CMS.

## Stack

- **Frontend:** React + Vite (`artifacts/portfolio`) → Vercel
- **API:** Express 5 (`artifacts/api-server`) → Render
- **DB:** PostgreSQL + Drizzle (`lib/db`) → Neon
- **Auth:** bcrypt + express-session (Postgres-backed)

## Quick start (local)

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD, Cloudinary keys
pnpm --filter @workspace/db push
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/portfolio dev
```

Local Vite proxies `/api` to the API (default `http://127.0.0.1:8080`). Leave `VITE_API_URL` unset locally so session cookies stay same-origin. Set `VITE_API_URL` only for split deploys (e.g. Vercel → Render).
## Admin

- URL: `/admin/login`
- Bootstrap with `ADMIN_PASSWORD` env (only used when no password hash exists yet)
- Change password later in **Settings** (min 12 characters)

## Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md).

## Security notes

- Production requires `SESSION_SECRET` and `CORS_ORIGIN`
- Login is rate-limited (10 attempts / 15 min)
- Uploads allowlist: JPEG, PNG, WebP, GIF, PDF
- Uploads use Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
