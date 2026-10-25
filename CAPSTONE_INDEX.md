# Capstone Index — Backend Track

Six capstones identified from official FlyRank internship materials. Each lives in its own public GitHub repository. This file is the authoritative index; implementation details live in each capstone's own repo.

> Status key: `Not started` · `In progress` · `Blocked` · `Verified complete`

---

## Capstone 01 — Embeddable Widget & Lead-Capture Platform

| Field | Value |
|---|---|
| Status | **Verified complete** |
| Repository | [CHANDU-M05/flyrank-capstone-widgetplatform](https://github.com/CHANDU-M05/flyrank-capstone-widgetplatform) |
| Submission | Submitted via portal 2026-09-20 |
| Stack | Node.js + Express, PostgreSQL (Docker), JWT, Zod, express-rate-limit |

**Focus:** Embeddable widget served via `<script>` tag, public submission API with CORS, zod validation, rate limiting (per IP+widget), honeypot spam filter, two-provider geolocation fallback, safe side effects (notify can fail without blocking submission), dashboard with tenant isolation.

**All 13 EVIDENCE.md acceptance probes passed** with real curl transcripts.

**BUILDLOG highlight:** Route-order bug (public router mounted after admin router, causing false 401s on public config endpoint) caught and fixed during evidence run. Provider B (ipapi.co) rate-limited during geo fallback probe — submission still stored successfully, proving the resilience claim.

---

## Capstone 02 — AI Image Understanding & Content Matching Engine

| Field | Value |
|---|---|
| Status | **In progress — Phase 1** |
| Repository | [CHANDU-M05/flyrank-capstone-imagerelevance](https://github.com/CHANDU-M05/flyrank-capstone-imagerelevance) *(not yet pushed)* |
| Stack | Node.js + Express, Gemini Flash (vision + embeddings), PostgreSQL (Docker), Zod |

**Focus:** Vision AI classifies images into schema-validated structured metadata. Embeddings match image descriptions to blog post content semantically. Mismatch guard rejects unsuitable pairings with human-readable explanations. Background batch job with retries and per-call cost tracking. Review API for approve/reject. Labeled eval set and measured top-1 precision.

**Scope (from brief):**
- ≥40 images, ≥4 categories
- ≥10 labeled posts for the eval set
- One vision model + one embedding model
- No frontend required

**Key acceptance probes:**
1. Batch job → every image schema-valid; low-confidence items flagged
2. Red-fox post → fox ranks first, wolf/dog rank lower
3. Wolf forced as fox-post candidate → guard rejects with category-mismatch explanation
4. Post with no suitable image → "no confident match" + reasons
5. Eval script → top-1 precision reported
6. Cost log → every AI call attributed

**Phase gate (current):** Design doc committed to repo.

**Missing:** GEMINI_API_KEY not yet set in `.env`. Repo not yet pushed to GitHub.

---

## Capstone 03 — Usage Metering & Billing Engine

| Field | Value |
|---|---|
| Status | **Not started** |
| Repository | `flyrank-capstone-usagemetering` *(not created)* |
| Source | Brief not yet reviewed in this session |

**Focus (from master plan):** Usage events, quotas, idempotency, AI token pricing, test-mode billing integration, signed and idempotent webhooks, tenant isolation.

**Prerequisite:** Capstone 02 complete or parallel.

---

## Capstone 04 — Multi-Platform Social Campaign Publisher

| Field | Value |
|---|---|
| Status | **Not started** |
| Repository | `flyrank-capstone-socialpublisher` *(not created)* |
| Source | Brief not yet reviewed in this session |

**Focus (from master plan):** Platform adapters, content variants, scheduling, retries, rate limits, encrypted tokens, signed webhooks, idempotent publishing, crash recovery.

> ⚠️ **Not the same as Capstone 05.** Compare specifications before considering implementation reuse.

---

## Capstone 05 — Social Media Studio

| Field | Value |
|---|---|
| Status | **Not started** |
| Repository | `flyrank-capstone-socialstudio` *(not created)* |
| Source | Brief not yet reviewed in this session |

**Focus (from master plan):** URL/Markdown ingestion, platform-specific content generation, human approval, scheduling, publish history, one real free publishing target, two mock platforms, durable scheduling.

> ⚠️ **Not the same as Capstone 04.** The two social publishing capstones have distinct specifications.

---

## Capstone 06 — Your 10x Solution

| Field | Value |
|---|---|
| Status | **Not started** |
| Repository | `flyrank-capstone-10x` *(not created)* |
| Source | Brief not yet reviewed in this session |

**Focus (from master plan):** Independently selected product idea. Must apply the required core engineering concepts. Has explicit constraints: feature limits, permitted substitutions, data model requirements, evidence requirements.

---

## Repository Isolation Policy

> Why capstone code is never in this repo.

Every capstone brief requires a **dedicated public GitHub repository from day one**. This is not optional — evaluators access the submitted repo URL directly. Nesting capstone code inside this `flyrank-internship` repository would violate the brief's ground rule and obscure commit history.

This `flyrank-internship` repo serves as the **portfolio index**: it holds briefs, design notes, assignment deliverables, evidence links, and submission records — never implementation code.

The local directory structure (`backend/capstones/01-embeddable-widget/`, etc.) is a convenience for local navigation only. What is pushed and submitted for each capstone is that subfolder's own repo with its own remote.
