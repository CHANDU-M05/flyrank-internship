# Design — Embeddable Widget & Lead-Capture Platform

## Problem
Let a tenant (widget owner) create embeddable form widgets, hand them a one-line
`<script>` tag, and safely receive submissions from public websites we don't
control — validated, rate-limited, spam-filtered, geo-enriched, and shown back
to the owner in a dashboard.

## Data model
- **tenants** — the widget owners (email/password auth).
- **widgets** — belongs to a tenant. Type, title, description, `fields` (JSONB
  array of `{name, label, type, required}`), `button_text`, `display` (JSONB),
  `bundle_version` (bumped on every edit).
- **submissions** — belongs to a widget *and* a tenant (denormalized
  `tenant_id` so every query can filter on it directly, no join required for
  isolation). Stores the validated field data, IP, geo (country/city/which
  provider answered), and the notify side-effect's outcome.

Every `widgets` and `submissions` row carries `tenant_id`; every query in
`routes/widgets.js` and `routes/dashboard.js` filters on
`tenant_id = req.tenantId` from the JWT. That's the entire isolation boundary
— enforced in one place (`middleware/auth.js`), not re-derived per route.

## The three request paths
1. **Owner (authenticated)** — `/auth`, `/widgets`, `/dashboard`. CORS
   restricted to known admin origins (`PUBLIC_ALLOWED_ORIGINS`).
2. **Customer website (any origin, cached)** — `GET /widget.js` (long cache,
   versioned) and `GET /widgets/:id/config` (short cache). CORS open — this
   is a public product, not a private API.
3. **Website visitor (any origin, protected)** — `POST /submissions`. Open
   CORS, but hardened: 20kb body limit → zod validation → honeypot check →
   rate limit (per IP+widget) → geo enrichment (never throws) → store → safe
   notify (failure recorded, never blocks the response).

## API surface (summary)
- `POST /auth/register`, `POST /auth/login`
- `GET/POST /widgets`, `GET/PUT/DELETE /widgets/:id` (auth required)
- `GET /widget.js`, `GET /widgets/:id/config`, `POST /submissions` (public)
- `GET /dashboard/submissions`, `GET /dashboard/stats` (auth required)

## Explicit non-goal
No real hosting, CDN, or custom domain for the "customer site" — it's a
plain HTML file served from a second local port. No drag-and-drop
widget-builder UI; the widget UI is a minimal unstyled form. No queue/worker
process for the notify side effect in the core scope — it runs inline but is
failure-isolated; a background job is a stretch goal, not core.
