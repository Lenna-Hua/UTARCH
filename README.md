# UTARCH — Uyen Ton Portfolio

Full-stack portfolio site with a public blueprint aesthetic and an admin CMS.

## Stack

- **Frontend:** React + Vite (`artifacts/portfolio`) → Vercel
- **API:** Express 5 (`artifacts/api-server`) → Render
- **DB:** PostgreSQL + Drizzle (`lib/db`) → Neon
- **Auth:** bcrypt + express-session (Postgres-backed)

## Quick start (local)

```bash
pnpm --filter @workspace/db push
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/portfolio dev
```

Optional frontend env (`artifacts/portfolio/.env`): `VITE_API_URL=http://localhost:8080`
## Admin

- URL: `/admin/login`
- Bootstrap with `ADMIN_PASSWORD` env (only used when no password hash exists yet)
- Change password later in **Settings** (min 12 characters)

## Deploy

