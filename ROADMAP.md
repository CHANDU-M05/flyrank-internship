# Roadmap — FlyRank Internship

Two tracks. Self-paced; no fixed deadlines. Order within each track follows brief prerequisites and portfolio logic. Cross-track work can proceed in parallel.

---

## Backend Engineering Track

### Phase 0 — Foundation ✅
- [x] Choose capstone sequence
- [x] Set up central `flyrank-internship` repository (planning index)
- [x] Establish repository isolation policy (capstone code = own repo)

---

### Capstone 01 — Embeddable Widget & Lead-Capture Platform ✅ Verified complete

**Repo:** [CHANDU-M05/flyrank-capstone-widgetplatform](https://github.com/CHANDU-M05/flyrank-capstone-widgetplatform)

Key engineering demonstrated:
- Public API design + CORS + body-size limiting
- Zod schema validation (clean 4xx, never 500)
- JWT auth + multi-tenant isolation (tenant_id scoped on every query)
- Rate limiting per IP+widget pair
- Two-provider geo fallback (never throws, submission always stored)
- Honeypot spam filter (silent 202)
- Safe side-effect isolation (notify failure doesn't block response)
- Raw SQL migrations, no ORM

---

### Capstone 02 — AI Image Understanding & Content Matching Engine 🔨 In progress

**Repo:** `flyrank-capstone-imagerelevance` *(local only — push to GitHub is next action)*

Builds on: structured AI output, embeddings, background jobs, eval-driven quality.

#### Phase 1 — Design (current)
- [x] Scaffold: `package.json`, `.env.example`, `.gitignore`, `docker-compose.yml`, `capstone.yaml`
- [ ] Write DESIGN.md: image metadata schema, DB design, matching strategy, guard rules
- [ ] Gather initial corpus: ≥40 images across ≥4 categories (Unsplash/Pexels, licensed)
- [ ] Commit design doc to repo
- [ ] Push repo to GitHub (public, `flyrank-capstone-imagerelevance`)
- [ ] Add GEMINI_API_KEY to local `.env`
- **Gate:** design doc committed and repo public

#### Phase 2 — Image Understanding Pipeline
- [ ] Vision classification job: send image to Gemini Flash, parse structured JSON response
- [ ] Zod schema validation on every vision response — invalid = flagged, never accepted
- [ ] Low-confidence threshold: flag items below `CONFIDENCE_THRESHOLD` for review
- [ ] Batch background job with retries (`INGEST_RETRY_MAX`)
- [ ] Per-call cost tracking (vision calls)
- [ ] DB migration: `images`, `image_metadata`, `job_runs`, `cost_log` tables
- [ ] `npm run ingest` processes all corpus images
- **Gate:** all images tagged, costs visible, at least one low-confidence item flagged

#### Phase 3 — Matching Engine
- [ ] Embedding generation for image captions + post content (Gemini `text-embedding-004`)
- [ ] Store embeddings as float arrays in Postgres
- [ ] Cosine similarity ranking: `GET /posts/:id/images`
- [ ] Mismatch guard: combine tag match + similarity threshold + confidence score
- [ ] Guard produces human-readable rejection explanation
- [ ] "No confident match" path when no candidate clears the bar
- [ ] Cost tracking for embedding calls
- **Gate:** fox post ranks fox first; guard rejects wolf with explanation

#### Phase 4 — Production Layer
- [ ] Review API: `POST /posts/:id/images/:imageId/approve`, `.../reject`
- [ ] `GET /posts/:id/images` returns guard decision + explanation per candidate
- [ ] Labeled eval set: ≥10 posts, each with one correct image identified
- [ ] `npm run eval` → reports top-1 precision
- [ ] README: architecture diagram, run steps, limitations, precision number
- [ ] EVIDENCE.md: all 6 acceptance probes filled
- [ ] BUILDLOG.md: AI usage log with honest failures
- **Gate:** eval precision measured, all evidence filled

---

### Capstone 03 — Usage Metering & Billing Engine

**Prerequisite:** Capstone 02 complete or parallel.

Key engineering to demonstrate:
- Usage event ingestion and quota enforcement
- Idempotency (retried events counted once)
- AI token pricing (cost tracking per tenant)
- Test-mode billing integration
- Signed + idempotent webhooks
- Tenant isolation

*Detailed phase plan: TBD after brief review.*

---

### Capstone 04 — Multi-Platform Social Campaign Publisher

**Prerequisite:** Capstone 03 or parallel.

Key engineering to demonstrate:
- Platform adapters (extensible)
- Content variants per platform
- Scheduler with retries and rate limiting
- Encrypted credential storage
- Signed webhooks
- Idempotent publishing (never double-post)
- Crash recovery

> ⚠️ Distinct from Capstone 05 — compare briefs before any implementation reuse.

*Detailed phase plan: TBD after brief review.*

---

### Capstone 05 — Social Media Studio

**Prerequisite:** Capstone 04 or parallel.

Key engineering to demonstrate:
- URL + Markdown ingestion
- Platform-specific AI content generation
- Human approval workflow
- Scheduler + publish history
- One real publishing target, two mock platforms
- Durable scheduling

> ⚠️ Distinct from Capstone 04 — compare briefs before any implementation reuse.

*Detailed phase plan: TBD after brief review.*

---

### Capstone 06 — Your 10x Solution

**Prerequisite:** All prior capstones or demonstrated equivalents.

Independently selected product idea. Constraints: feature limits, permitted substitutions, data model requirements, evidence requirements — all from the official brief.

*No plan until brief reviewed.*

---

### Backend Assignments

> ⚠️ Source not yet available. No assignment names or requirements have been verified.
> This section will be filled once official Backend assignment briefs are located.

*Assignments can be worked on in parallel with capstones at any point.*

---

## General AI Fluency Track

Self-paced. The capstone has Week 7 and Week 9 checkpoints as prerequisites.

### Weeks 1–4 — Foundation
1. What Are You Proving?
2. Draw the Path: Portfolio Sitemap + Toolkit
3. Frame It as Cases: Work That Speaks for Itself
4. The Through-Line: Map Content & CTAs

### Weeks 4–5 — Identity
5. Decide Once: Build Your Identity Kit
6. Kill Your Darlings: Curate Your Images
7. Three Roads: Choose Your Stack with AI

### Weeks 6–7 — Build begins (Week 7 checkpoint)
8. Empty but Live: Ship a Blank Page
9. Ship the Ugly One
10. Explain It Like You Built It
11. Open It on Your Phone

### Weeks 8–9 — Polish (Week 9 checkpoint)
12. Survive the Crit
13. Make It Do Something
14. Break Your Own Site
15. Plant Your Flag: Domain + Badge
16. The Plan to Keep Building

*(Possible 17th assignment — unverified. Preserved as gap until official confirmation.)*

### Week 10 — Capstone
**Send the Link: Launch, Demo & Story**
- Requires: Week 7 checkpoint ✓, Week 9 checkpoint ✓
- Deliverable: live portfolio site + demo recording + written story

---

## Recommended Next Actions (in order)

1. **Add `GEMINI_API_KEY` to `flyrank-capstone-imagerelevance/.env`** (from aistudio.google.com, free)
2. **Write `DESIGN.md`** for capstone 02 — schema, DB, guard rules, corpus plan
3. **Push `flyrank-capstone-imagerelevance` to GitHub** (public, per brief requirement)
4. **Source Backend assignment briefs** from the FlyRank portal — fill `ASSIGNMENT_INDEX.md`
5. **Source AI Fluency assignment briefs** — verify the 17th assignment, start Week 1
6. Continue capstone 02 Phase 2 once design is committed
