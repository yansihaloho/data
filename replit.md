# Toto Macau Live

Website data hasil keluaran Toto Macau live, lengkap dengan analisa statistik dan prediksi AI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/toto-macau run dev` — run the frontend (port 23007)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/toto.ts` — DB schema: toto_results, predictions, nomor_taruhan
- `artifacts/api-server/src/routes/toto.ts` — Toto data routes
- `artifacts/api-server/src/routes/predictions.ts` — Prediction CRUD routes
- `artifacts/toto-macau/src/` — React frontend
- `artifacts/toto-macau/src/pages/` — All page components
- `artifacts/toto-macau/src/lib/classify.ts` — Ganjil/genap/besar/kecil logic
- `artifacts/toto-macau/src/lib/prediction-engine.ts` — AI prediction engine

## Architecture decisions

- Frontend forces dark mode via `document.documentElement.classList.add("dark")` in App.tsx
- Data is seeded on demand — POST /api/toto/refresh generates data for recent days
- Nomor taruhan stored as comma-separated string in single DB row
- 90 days of historical data pre-seeded at startup
- Draw schedule is hardcoded: 00:01, 13:00, 16:00, 19:00, 22:00, 23:00 WIB

## Product

- Live Toto Macau result display with 6 draw times per day
- Countdown timer to next draw
- Monthly history with expandable rows
- Statistical analysis pages (ganjil, genap, besar, kecil per angka/ekor)
- Analisa Harian — per-slot frequency analysis
- Prediksi AI — multi-algorithm prediction engine (Frequency, Momentum, Markov, Bayesian, Gap, Stats, Pattern, HotCold, Ensemble)
- Riwayat Prediksi — save and track prediction accuracy

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml
- After codegen, run `pnpm run typecheck:libs` before checking leaf package types
- The toto-macau frontend must be restarted after design/CSS changes
- POST /api/toto/refresh seeds dummy data for recent days (for development)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
