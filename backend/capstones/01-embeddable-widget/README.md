# Embeddable Widget & Lead-Capture Platform

A backend that lets a customer define a widget (signup form / CTA / contact
form), hand out a one-line `<script>` tag, and safely receive submissions
from public websites — validated, rate-limited, spam-filtered, geo-enriched,
and viewable in a dashboard.

FlyRank Internship · Backend Track · Capstone.

## Architecture

```
Widget Owner (authenticated, JWT)
  -> /auth, /widgets (CRUD), /dashboard
  -> Postgres (tenant_id scoped on every query)

Customer Website (any origin)
  <script src=".../widget.js?id=123">
  -> GET /widgets/:id/config   (public, cached 60s, open CORS)
  -> renders a form client-side

Website Visitor (any origin)
  -> POST /submissions          (public, open CORS)
     1. 20kb body limit + zod validation      -> clean 4xx, never 500
     2. honeypot check                        -> silently drop bots
     3. rate limit (per IP + widget)           -> 429 under burst
     4. geo enrichment: provider A -> B -> none (never throws)
     5. store submission
     6. safe notify side effect (failure logged, response unaffected)
```

See [DESIGN.md](./DESIGN.md) for the full data model and API surface.

## Stack
Node.js + Express, PostgreSQL (via Docker), no ORM (raw SQL + a tiny
migration runner), `zod` for validation, `express-rate-limit`, JWT auth.

## Setup (clean machine)

```bash
git clone <this repo>
cd flyrank-capstone-widgetplatform
cp .env.example .env          # defaults work as-is for local dev
docker compose up -d          # starts Postgres on :5432
npm install
npm run migrate               # creates tables
npm run seed                  # creates a demo tenant + widget, prints login + embed snippet
npm start                     # API on http://localhost:3000
```

In a second terminal, serve the test "customer site" from a different origin:

```bash
npx serve test-site -l 5500
```

Open `http://localhost:5500`, replace `REPLACE_WITH_WIDGET_ID` in
`test-site/index.html` with the widget id printed by `npm run seed`, reload,
and the widget should render and accept a submission — proving the
cross-origin path end to end.

Demo login (from seed): `demo@flyrank.test` / `demo1234`.

## Proving the hardening (matches the capstone's acceptance probes)
- **Malformed/oversized payload** → `curl -X POST .../submissions -d '{"bad":true}'` → clean 4xx JSON.
- **Rate limit** → fire >20 requests/min at `/submissions` for one widget → `429`s appear, other widgets unaffected.
- **Geo fallback** → set `MOCK_GEO_A_DOWN=true` in `.env`, restart, submit → stored with `geo_provider: "B"`. Set `MOCK_GEO_ALL_DOWN=true` → stored with `geo_provider: null`.
- **Safe side effect** → set `NOTIFY_SHOULD_FAIL=true` → submission still returns `201`, `notify_status` is `"failed"`.
- **Honeypot** → POST with a non-empty `website` field → `202`, nothing stored.

Full proof transcripts live in [EVIDENCE.md](./EVIDENCE.md).

## Limitations (honest, as required)
- No production bundle minification — `public/widget.js` is served as-is.
- Dashboard is API-only (JSON), no frontend UI — this is a backend capstone.
- Email/webhook side effect is a console log, not real SMTP (by design — see
  the brief's $0 stack).
- No background-job queue yet for the notify step; it runs inline but is
  failure-isolated. Listed as a stretch goal, not core scope.
