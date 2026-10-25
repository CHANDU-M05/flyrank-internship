# Build Log — AI usage

Honest record of where AI (Claude) helped, where it was wrong, and what was
changed. Perfection isn't graded here; honesty is.

## Phase 1 — Design
- AI scaffolded the initial repo structure, DESIGN.md, and required capstone
  files (capstone.yaml, EVIDENCE.md template, .env.example) based on the
  capstone brief.
- **To do:** review the data model and non-goal against your own judgment —
  adjust before treating this as final.

## Phase 2 — Hardened submission path
- AI wrote the initial implementation of: JWT auth, tenant-scoped widget
  CRUD, the public config/widget.js/submissions routes, the geo fallback
  service, the safe-notify wrapper, and the client-side widget script.
- **To do once you run it:** actually exercise every path yourself (CORS
  preflight in a real browser, rate-limit burst, both geo mock toggles,
  notify failure toggle, honeypot). Note here anything that didn't work as
  written, and what you changed to fix it — that's the part evaluators
  actually check you can explain.

## Phase 3 — Delivery, dashboard & proof

Evidence run completed 2026-09-20. Findings:

- **Route order bug (caught during evidence run):** The public router was
  originally mounted *after* the admin `/widgets` router. Express matched
  `GET /widgets/:id/config` against the admin router first, hit `requireAuth`,
  and returned a false 401 on a route that's meant to be public. Fixed by
  mounting `publicRoutes` before `widgetRoutes` in `src/index.js`. The comment
  in the file explains why the order matters.

- **Provider B rate-limit during geo probe:** While running the
  `MOCK_GEO_A_DOWN=true` test, ipapi.co (provider B) responded with HTTP 429
  — a real rate-limit, not a mock. This is actually stronger evidence than a
  clean pass would be: it shows the full fallback chain (`A down → B attempted
  → B also rate-limited → geo=null`) and proves the submission was still stored
  with HTTP 201. The behavior is exactly what the code promises: geo enrichment
  is best-effort, never a blocker. Provider A (ip-api.com) confirmed live and
  returning correct data for 8.8.8.8 independently.

- **Honeypot log confirmed:** Server printed `[spam] honeypot triggered for
  widget ...` and returned 202 with nothing stored — bot gets no signal.

- **All 13 EVIDENCE.md checks filled** with real curl transcripts and DB output.

## Lines you should be able to explain

- **`keyGenerator` in `middleware/rateLimit.js`** — why `IP + widgetId`, not
  just IP: a shared office/NAT IP shouldn't let one user's burst block everyone
  else's submissions to all widgets, and a single widget shouldn't be
  rate-limited by traffic to a different widget on the same account.

- **The provider-fallback try/catch nesting in `services/geo.js`** — outer
  catch falls to provider B, inner catch falls to `{country:null,...}`. The
  function is typed to never throw so the caller (`routes/public.js`) never
  needs to handle a geo error — geo failure is invisible to the HTTP response.

- **The loopback guard in `enrichIp`** (`127.x`, `::1`) — skips the real geo
  call for local dev submissions so you don't burn free-tier rate limits on
  localhost traffic or get confusing nulls that look like provider failures.

- **Tenant scoping pattern in `routes/widgets.js` and `routes/dashboard.js`** —
  every query appends `AND tenant_id = $N` using the JWT-decoded tenant ID, so
  even a valid token from another tenant returns 404, not 403. Leaking "this
  resource exists but you can't see it" is a separate info-leak; 404 avoids it.
