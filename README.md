# UTARCH — Uyen Ton Portfolio

Full-stack portfolio site with a public blueprint aesthetic and an admin CMS.

## Stack

- **Frontend:** React + Vite (`artifacts/portfolio`) → Vercel
- **API:** Express 5 (`artifacts/api-server`) → Vercel Serverless Function
- **DB:** PostgreSQL + Drizzle (`lib/db`) → Neon
- **Auth:** bcrypt + express-session (Postgres-backed)

## Quick start (local)

```bash
pnpm --filter @workspace/db push
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/portfolio dev
```
