# Decisions Log

Significant decisions made during the internship, with rationale. Preserved so future-me (or an evaluator) can understand why things are the way they are.

---

## D-001 — Repository Isolation Policy

**Decision:** Each capstone lives in its own public GitHub repository. The `flyrank-internship` repo is a planning index only — no capstone source code.

**Rationale:** All capstone briefs explicitly require a dedicated public repo "from day one." Mixing capstone code into a monorepo would: (a) violate the brief's ground rule, (b) confuse commit history across projects, (c) make evaluator access harder. Local nesting under `backend/capstones/` is for navigation convenience only; each subfolder is its own git repo with its own remote.

**Status:** Established. Applied from capstone 01 onward.

---

## D-002 — Node.js + Express for Backend Capstones

**Decision:** Use Node.js + Express for backend capstone implementations (at least through capstone 02).

**Rationale:** Already proven in capstone 01 (all acceptance probes passed). No context-switching cost. The stack aligns with FlyRank's listed "JavaScript or Python" option. Python + FastAPI is still an option for future capstones if a specific brief favors it.

**Status:** Applied for capstones 01 and 02.

---

## D-003 — Gemini Flash Free Tier for AI Capstone

**Decision:** Use Gemini Flash (cloud, free tier via Google AI Studio) for vision and embeddings in capstone 02 rather than local Ollama.

**Rationale:** Gemini Flash's free tier covers vision + embeddings with no credit card. Local Ollama has not been verified as working in this environment. The brief's free-path rule: "Do not make the project dependent on a local model runtime that has not been proven to work." API key available from aistudio.google.com.

**Constraint:** API key must stay in `.env` only; never commit it.

**Status:** Decided. Key not yet added to `.env`.

---

## D-004 — Port 5434 for Capstone 02 Database

**Decision:** Docker Compose for the image-relevance capstone maps host port 5434:5432.

**Rationale:** Port 5432 is occupied by the system's native PostgreSQL. Port 5433 is occupied by the capstone 01 Docker container. 5434 is the next available port and avoids all conflicts.

**Status:** Applied in `flyrank-capstone-imagerelevance/docker-compose.yml`.

---

## D-005 — AI Image Capstone Is Capstone 02 (Not Numbered with Original Sequence)

**Decision:** The "AI Image Understanding & Content Matching Engine" brief is registered as **Backend Capstone 02** in this index, shifting the original capstone 02–05 numbering by one.

**Rationale:** The original `README.md` and directory structure listed only five capstones (01–05). The master plan brief explicitly requires six entries, inserting the AI Image capstone as a distinct item. The AI Image capstone was chosen next (after capstone 01), and local work has already begun on `flyrank-capstone-imagerelevance`. The remaining capstones (Usage Metering, Social Publisher, Social Studio, 10x) become 03–06.

**Open question:** Whether the FlyRank portal lists the AI Image capstone in a specific numbered slot, or whether it is a freestanding optional capstone. Verify from portal when possible.

**Status:** Applied in all index files. Local folders `02-usage-metering-billing` through `05-10x-solution` retain their original names; they represent the remaining capstones pending renumbering confirmation.

---

## D-006 — No Frontend Required for Backend Capstones

**Decision:** Backend capstones implement API endpoints only; no frontend build.

**Rationale:** The briefs are explicit: "Dashboard is API-only (JSON), no frontend UI — this is a backend capstone." Reviewer verification happens via curl/Postman, not a browser UI.

**Status:** Applied. Capstone 01 delivered API-only. Same approach for capstone 02.

---

## Open Questions

| ID | Question | Impact | Resolution path |
|---|---|---|---|
| Q-001 | Does the FlyRank portal assign a specific number to the AI Image capstone? | Affects folder naming and index numbering | Check portal capstone page |
| Q-002 | What is the full list of Backend regular assignments? | Cannot fill Backend assignment index | Locate portal assignment list |
| Q-003 | Is there a 17th AI Fluency assignment? | Index may be incomplete | Check portal for complete list |
| Q-004 | Are capstones 04 and 05 (Social Publisher and Social Studio) truly distinct briefs? | Implementation reuse may be inappropriate | Read both briefs side by side |
