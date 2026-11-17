# PHENOL ACADEMY — LMS Expansion Technical Audit (Phase 0)

**Status: AUDIT ONLY — no structural changes made. Awaiting architectural approval.**
Date: 2026-11-17 · Baseline: migrations 000→019 applied live · GitHub `50b1456`

---

## 1. Current architecture overview

Full details: `docs/PLATFORM_GUIDE.md`. Summary of what matters for the expansion:

- **Next.js 14 App Router + Supabase (PostgreSQL, Auth, Storage, RLS) + Tailwind**, deployed on
  Vercel (auto-deploy from `main`). One dashboard page (`/dashboard`) that is role-aware
  (student / instructor / super_admin tabs).
- **Access control lives in the database**: RLS on every table + security-definer RPCs
  (`is_super_admin()`, `owns_course()`, `has_active_enrollment()`). `is_admin()` is retired
  as a trust anchor (019-era standing audit in `supabase/verify/check_database_state.sql`).
- **The DB is the only source of truth**; localStorage is a cache (GEMINI.md rules 1–14).
- Client data access is centralized in `src/lib/data/*` modules (courses, enrollments,
  quizzes, instructors, students, comments, progress, reviews, notifications, referrals).
- Migrations are numbered and applied manually by the owner after backup; the next free
  number is **020**.

## 2. Existing features that can be reused (do NOT rebuild)

| Requested capability | Already exists | Gap |
|---|---|---|
| Instructor course dashboards | Instructor dashboard tabs: my courses, my students (via enrollments), waitlist, grading desk, quiz authoring | Aggregated metrics (progress %, averages, at-risk lists), financial section |
| Student dashboard | My courses, real quiz-results tab, submissions desk, tasks tab, notifications, booklets | Progress %, performance analytics, schedule, learning-time metrics |
| Super admin dashboard | Tabs: accounts, approvals, tracks, instructors, applications (+ enrollments, passwords, course approval, booklet management) | Platform-level growth/financial analytics, global search, settings |
| Analytics raw material | `lesson_progress` (per student × lesson), `quiz_submissions` (scores, %, passed, per-question review), `student_submissions` (assignments + grades + feedback), `media_access_log` (lesson access events), `course_enrollments` (status timeline), `user_sessions` (logins) | No aggregation layer; "time spent" and "attendance" are not first-class metrics yet |
| Video hosting | `lesson_assets.video_url` accepts YouTube/Vimeo/direct embeds (`src/lib/student-code.ts` parses them); videos served through `get_lesson_media` RPC | Nothing to build for "upload recording to the course" — the lesson flow already supports it |
| AI material inputs | Lecture PDFs already live in the private `booklets`/lecture-notes buckets; question banks exist (017) | Generation pipeline, storage of AI outputs |

## 3. Current database entities & relationships (21 tables)

```
profiles (id = auth.users.id, role)
registered_students (roster: name/email/phone/code/track/role)  ← both stores kept in sync
user_sessions · media_access_log
courses (owner_id, instructor_id/email/name/avatar, approval status)
  └── lessons ─── lesson_assets (video_url, pdf_notes_path)
        ├── lesson_progress (student × lesson)
        ├── lesson_comments
        └── course_enrollments (student × course: PENDING/ACTIVE/REJECTED, approved_at)
waitlist_applications · instructor_requests (→ decide_instructor_request → directory row, 016+019)
quizzes (questions client-invisible) → quiz_submissions (server-graded)
student_submissions (assignment desk: file/text, grade, dr_feedback)
question_bank_items (017) · booklets (private bucket, 015)
instructor_profiles (public directory, 016; rows follow role changes, 019)
instructor_reviews (PII-free display RPCs, 018) · student_notifications · referrals
```

**Hard rule for the expansion:** every new table gets RLS with the same helpers
(`is_super_admin()`, `owns_course()`, `has_active_enrollment()`), and the verify script
gets a new standing audit per migration.

## 4. Existing authentication & role permissions

- Roles live in `profiles.role` AND `registered_students.role` (dual-store, both updated
  by RPCs; `admin_set_user_role` is super_admin-only and now keeps the directory in sync).
- Identity merge: signup trigger merges walk-in roster rows (018).
- Session tracking exists (`user_sessions`).
- All destructive/broad actions are super_admin- or course-owner-gated RPCs (014–019).
  **The expansion must follow the same pattern — no policy may trust `is_admin()`.**

## 5. Current course & quiz infrastructure

- Courses → lessons → assets; enrollment-gated media via `get_lesson_media` (rate-limited,
  logged); quizzes are DB-graded (`submit_quiz_attempt`), answer keys never reach the client
  (010), authoring via ownership-scoped RPCs (011).
- **This satisfies the security core of every new feature.** Analytics only need to AGGREGATE
  these tables — never loosen them.

## 6. Subscription & payment infrastructure — ⚠️ CRITICAL FINDING

**There is none.** Verified by full-code + migration scan:

- No payments/transactions table. No `price`/`amount`/`currency` column anywhere.
- No payment gateway integration (Stripe/PayPal/Fawry/InstaPay — zero references).
- `course_enrollments` is a status record (PENDING/ACTIVE/REJECTED) with no monetary value.
- Enrollment today = office-managed (walk-in office registration, manual approval, free
  activation) — consistent with the current business model (WhatsApp + office payment).

**Consequence:** every requested financial number (instructor revenue, monthly revenue,
revenue by course, refunds, commissions) **has no source of truth today**. Per rule 5 of the
expansion brief ("never display fabricated analytics") the platform CANNOT show any revenue
until real payment records exist. The only honest options:

| Option | What it means |
|---|---|
| **A (recommended first)** | `payments` table + super_admin/instructor-entered transaction records (cash, bank transfer, Vodafone Cash — the way money actually moves today), each linked to student × course × amount × method × date + receipt reference |
| B (later) | Real gateway integration (needs a provider decision + fees — must be documented per rule 8) |
| Either way | `course_prices` (or price column on courses) + configurable `platform_settings` (commission %, currency) — never hardcoded |

Until payments exist, financial dashboards must render an explicit "no payment records yet"
state — not zeros, not estimates.

## 7. Required database changes (proposed, pending approval — starts at migration 020)

| Domain | New tables/columns | Notes |
|---|---|---|
| Money | `payments` (id, student, course, instructor owner, amount, currency, method, status, paid_at, reference, entered_by) · `platform_settings` (key/value: commission %, currency) · `courses.price` | Backfill NOTHING — payments start empty (truthful) |
| Tasks & schedule | `instructor_tasks` (title, course, assignee student?, due, status) · `instructor_schedule_events` (type: lesson/exam/deadline/reminder, start/end) · student-side equivalents or shared `tasks` with `audience` | RLS: own rows / own-course students |
| Learning telemetry | `learning_events` (student, course, lesson, event: view/complete/duration, seconds, occurred_at) — or extend `lesson_progress` with accumulated seconds | Distinguishes **attendance (live sessions) ≠ consumption (events) ≠ completion (progress)** |
| AI | `ai_generations` (user, role, course?, lesson?, kind, prompt ref, output jsonb, status, tokens_in/out, provider, model, cost_estimate) | Instructor outputs get review→publish workflow before students see them |
| Whiteboard | `whiteboards` (id, course?, live_session?, owner, title, content jsonb, updated_at) | Content snapshots in DB; PNG/PDF export client-side |
| Live sessions | `live_sessions` (course, instructor, title, starts_at, provider, join_url, recording_url?) · optional `live_session_attendance` | Recording URL becomes a normal lesson asset (reuse lesson flow) |
| Analytics layer | SQL views / RPCs over existing tables (per-course progress %, score averages, at-risk lists) + indexes on FK/date columns | Aggregation in DB (rule: client never computes platform data) |

RLS + `check_database_state.sql` audits for ALL of the above, every migration.

## 8. Required new modules & services (frontend)

- `src/lib/data/`: `payments.ts`, `tasks.ts`, `schedule.ts`, `analytics.ts` (RPC-only),
  `ai.ts`, `whiteboards.ts`, `live-sessions.ts` — same pattern as existing modules.
- `src/app/api/ai/*` route handlers — **server-only** (API key never reaches the client;
  rule 7). Provider-agnostic adapter interface: `generate(content, kind, schema)` with
  structured-output validation + usage logging to `ai_generations`.
- New dashboard tabs (reuse existing tab pattern, design tokens `burgundy/ivory/charcoal`,
  `font-display/formula/sans`); charts: consider a small, license-clean chart lib (e.g.
  Recharts, MIT) — decision deferred to implementation phase (rule 9).

## 9. Third-party integrations & feasibility (confidence-tagged)

| Integration | Verdict | Basis |
|---|---|---|
| **Gemini API** (AI assistant) | ✅ **Fully supported** | Verified in this environment via documented SDK (`@google/genai`, current models incl. `gemini-3.8-flash`, structured output, document processing, file inputs, embeddings). Server-side only. Free tier exists — **exact rate limits/pricing to be confirmed at build time** (web search unavailable in this session). |
| NotebookLM | ❌ **Not currently feasible** | No public API is known as of last verified knowledge; the brief itself warns not to assume one. Re-verify before any commitment. |
| **Excalidraw** (whiteboard) | ✅ Fully supported *(high confidence, license to re-confirm at build)* | MIT-licensed npm package; export to PNG; persistence is custom (our DB). Real-time multiplayer needs extra infra (defer or self-host collab later). |
| tldraw (alternative) | ⚠️ Supported with limitations | Source-available; **commercial production use requires a paid business license** (re-verify exact terms at build). Prefer Excalidraw unless licensing changes. |
| **Jitsi** (live sessions) | ✅ Supported with limitations | Free public rooms / self-host; embeddable; no reliable server-side recording on the free path. |
| Google Meet / Zoom (live) | ⚠️ Supported with limitations | Programmatic session creation + cloud recording require paid Workspace/Zoom plans (to be verified). Practical: instructor shares the link (any provider), records locally or via provider. |
| Recording workflow (8.4) | ✅ **Fully supported by existing architecture** | "Record → edit → upload" lands in the existing `lesson_assets` flow; YouTube-unlisted embeds are already supported today (`student-code.ts`). No new infra needed. |
| Google Analytics 4 | ✅ Supported with limitations | Free; standard snippet. Distinguishes visitors vs registered/active users — but be explicit: GA measures visitors, the DB measures authenticated activity. Consent/privacy notice update needed (privacy page exists). |
| Payments gateway | ⏸️ Deferred | Needs a business decision; any fees must be documented (rule 8). Option A (manual records) removes the blocker. |

*Web search was unavailable during this audit session; every "re-confirm at build" item gets a
verification task before its phase starts.*

## 10. Infrastructure requirements

- **Supabase FREE tier is the binding constraint**: ~500 MB DB, 1 GB storage, paused
  project risk (keepalive already exists). Analytics events and AI outputs must be lean
  (jsonb, retention rules like the existing media_access_log cleanup).
- Vercel free: AI route handlers are serverless — fine; long AI jobs should use async
  patterns (the new Interactions API supports background execution) rather than long
  HTTP waits.
- No new paid services are introduced by this plan (rule 8): Gemini free tier +
  Excalidraw (MIT) + Jitsi links + manual recording workflow.

## 11. Technical risks

1. **Financial fabrication risk** — highest; mitigated by "payments-first, empty states until real data".
2. **RLS mistakes on new tables** — mitigated by the standing audit + the 014–019 pattern.
3. **Free-tier DB growth from analytics events** — mitigated by lean event design + retention.
4. **AI key leakage** — server-only route handlers, key in Vercel env, never in client bundles.
5. **Bundle bloat** (whiteboard, charts) — dynamic imports, whiteboard isolated on its own route.
6. **Dual role-store drift** — new flows must continue updating BOTH stores via RPCs.
7. **Vendor lock-in (AI)** — provider-agnostic adapter + prompts stored as data, outputs as jsonb.

## 12. What can be shipped immediately vs needs decisions

| Ready to build (no blockers) | Needs your decision |
|---|---|
| Payments table + manual transaction entry (Option A) | Payment gateway provider (later) |
| Tasks & schedule tables + instructor/student UI | Commission % (config default 0) |
| Analytics RPCs/views over existing data | Whiteboard engine final choice (Excalidraw recommended) |
| Instructor course/student analytics UI | GA4 property + privacy-page consent wording |
| Student progress/performance UI | AI model + budget per generation |
| Gemini adapter + instructor AI workspace | NotebookLM — dropped unless a public API appears |
| Live sessions (Jitsi link + schedule + attendance) | Self-hosted Jitsi vs public rooms |
| Whiteboard save/load/export | Real-time multiplayer infra (deferred) |

## 13. Recommended implementation order (adjusted from the brief)

| Phase | Content | Depends on | Size |
|---|---|---|---|
| **1. Data foundation** | migrations 020+: payments + prices + settings, tasks/schedule, learning events, analytics RPCs + indexes | — | M |
| **2. Instructor dashboard** | course/student analytics (real data), student profiles, tasks + calendar, financial tab (real or explicit-empty) | 1 | L |
| **3. Student dashboard** | progress %, performance analytics, schedule/tasks, learning activity | 1 | M |
| **4. Super admin** | platform overview, growth (DB + GA4), financial overview (requires Phase-1 payments), global management polish | 1–3 | M |
| **5. AI system** | provider adapter, instructor workspace (review→publish), student assistant, usage/cost logging | — (parallelizable) | L |
| **6. Whiteboard** | Excalidraw integration, save/reopen/export, course association; multiplayer deferred | — | M |
| **7. Live sessions** | schedule + Jitsi links + attendance + recording→lesson upload flow | — | S–M |

Phases 5–7 are largely independent of 1–4 and can interleave after Phase 1 if priorities shift.

## 14. Estimated complexity

- **Small:** student dashboard extensions, live-session scheduling, whiteboard persistence.
- **Medium:** analytics RPC layer, super admin analytics, whiteboard integration, GA4.
- **Large:** payments lifecycle (trust + correctness), AI adapter + workflows, instructor
  dashboard breadth.
- **Hardest correctness risk:** anything financial — needs its own migration, audit queries
  and test pass before any dashboard reads it.
