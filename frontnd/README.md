# DawAI

DawAI is an intelligent disease surveillance and forecasting dashboard for
HIV, TB, and Malaria. It analyzes case patterns across Kenya's eight
regions, maps where disease activity is concentrated, and forecasts future
disease burden to help public health decision-makers spot rising trends
early.

Built with Next.js (App Router), Tailwind CSS, and JSON files as the data
store — no external database is used.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up for a new
account to reach the dashboard (Overview and Disease Forecast) — there are
no seeded accounts.

## Data

All application data lives in `src/data/` as JSON:

- `users.json` — registered accounts (created via Sign up, updated via
  Forgot password). Starts empty.
- `regions.json` / `diseases.json` — the eight Kenyan regions and the
  three tracked diseases (HIV, TB, Malaria).
- `disease-monthly-data.json` — monthly historical and forecasted case
  counts per disease/region.

`disease-monthly-data.json` is **synthetic demonstration data**, generated
by `scripts/generate-data.cjs` from generalized regional and seasonal
patterns (per the project proposal's synthetic-dataset methodology) — it
is not real hospital or surveillance data. Regenerate it at any time with:

```bash
node scripts/generate-data.cjs
```

## Auth

Email/password auth is implemented with hashed passwords (bcrypt) and a
signed JWT session cookie. Set a `SESSION_SECRET` environment variable in
production; a development fallback secret is used otherwise. "Continue
with Google" is present but intentionally inert — this environment has no
Google OAuth credentials configured, so it surfaces that rather than
faking a sign-in.
