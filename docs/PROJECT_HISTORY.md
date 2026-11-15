# PHENOL LMS — Project History & Work Log

**Project:** Phenol Academy LMS (single-teacher platform → multi-teacher platform)
**Owner:** Dr. Omar Magdi (super_admin, phenolvii@gmail.com)
**Stack:** Next.js 14 (App Router) + Supabase (PostgreSQL, Auth, RLS) + Tailwind
**Production:** Vercel (auto-deploy on push to `main`) — Supabase project `phenol-db` (FREE tier)
**Last updated:** 2026-11-15, repo state `491f55d` (migrations 000 → 013 all applied to production)

---

## 1. What this document is

A chronological record of every task requested from the assistant, the work delivered for
each request, the SQL migrations involved, the commits that carry them, and how each step
was verified against the live production database.

Rule of engagement throughout: the **user runs every migration manually** in the Supabase
SQL Editor (after a full backup, pasting the FULL file), and **pushes to GitHub happen only
on explicit per-push approval** — every push auto-deploys to production.

---

## 2. Platform snapshot

| Layer | Detail |
|---|---|
| Roles | `student` / `instructor` / `super_admin` (Dr. Omar Magdi only) |
| Isolation | Instructors see & manage **only their own** courses, students, waitlist, submissions, quizzes — enforced by RLS in the database, not by client code |
| Source of truth | Supabase PostgreSQL only. localStorage is a cache, never the source. Zero mock/fake data in production paths |
| Engineering rules | Documented in `GEMINI.md` (rules 1–11 + permanent errors log) |

---

## 3. Work log (chronological)

### Phase 1 — Faculty onboarding (Task 1) ✅

**Request:** Turn the single-teacher platform into a multi-teacher platform — new
instructors must be able to apply, and the director (super_admin) must review and approve
applications. Everything must persist in the database.

**Delivered:**
- **Migration 009** — faculty application flow (applied to production by user).
- Register page cleaned: a "join as instructor" application instead of faking accounts.
- `StudentProfileModal` — application submission flow.
- `SuperAdministrationView` — applications tab for the director to approve/reject.

**Result:** pushed and verified by the user on the live site.

---

### Phase 2 — Quiz security (task "أ") ✅

**Request:** Quizzes were running entirely on client-side mock data; secure them and make
real student attempts persist in the database.

**Delivered:**
- **Migration 010** — full quiz base schema (original migration 006 had **never been
  applied** — discovered by verifying against the live DB) + column-privilege security +
  RPCs: `get_course_quiz_metadata`, `get_quiz_questions`, `submit_quiz_attempt`.
- `src/lib/data/quizzes.ts` rewritten: no mocks, **the client never grades itself and
  never writes scores** — grading lives in the DB via RPCs.
- Quiz review page now uses RPC review data.

**Commits:** `7966ccc` — pushed. User ran migration 010 and confirmed it works.

---

### Phase 3 — Instructor quiz authoring ✅

**Request:** Let instructors create/edit/delete quizzes for **their own courses**.

**Delivered:**
- **Migration 011** — ownership-scoped RPCs: `list_instructor_quizzes`,
  `get_quiz_for_editing`, `save_quiz`, `delete_quiz`; quiz manage policy tightened from
  `is_admin()` to course ownership.
- `QuizEditorModal` (instructor quiz builder modal) + `AdminQuizzesTab` (list/edit/delete)
  wired into the dashboard Quizzes tab.

**Commits:** `bedf051`, `68a9db9` — pushed. User confirmed migrations 010 + 011 both ran
("الاتنين اشتغلو").

---

### Phase 4 — Database verification ✅

**Request:** One query to see the state of the whole database at a glance.

**Delivered:**
- `supabase/verify/check_database_state.sql` — checklist covering migrations 000→011 with
  an audit marker (`OK (through 011)`).
- User ran it: 38 rows, marker OK. Targeted SELECT-privilege check on `quizzes.questions`
  returned 0 rows — **fully secured** (an earlier "LEAKED" reading was a false positive;
  the query now filters `privilege_type='SELECT'` only).

**Commits:** `bc37f3a` — pushed (later superseded locally by `bc3733a`, see Phase 6 notes).

---

### Phase 5 — PHENOL_META cleanup (task "ب") ✅

**Request:** Course metadata (owner, approval status) was being smuggled inside
`<!--PHENOL_META:...-->` comments in the free-text description column — leaking to
students and duplicating native columns. Clean it.

**Delivered:**
- **Migration 012** — backfills the empty native columns from the meta comment, then
  strips the comments from every description (malformed-comment safe). Applied by user
  ("نفذت يعم كله تمام").
- `src/lib/courses-storage.ts` — saves now write a clean description + native ownership
  columns; legacy strip-on-read retained as a safety net.

**Commits:** `de7303c`, `1e1ae95` (errors-log rule 10) — pushed.

---

### Phase 6 — RLS isolation: waitlist + grading desk (task "ج") ✅

**Request:** Instructors must see and manage only their own courses' waitlist
applications and student submissions — enforced by the database itself. During
investigation, two bigger problems surfaced:

1. **The Grading Desk was 100% mock** — the `student_submissions` table existed with RLS,
   but no code read from or wrote to it; the whole screen ran on mock `SUBMISSIONS`.
2. **Waitlist was only UI-filtered** — every instructor received *every* application from
   the DB (an `admin all` policy) and filtering happened in the browser via fragile text
   matching.

**Delivered:**
- **Migration 013** (applied to production, 2026-11-15):
  - `course_id` column added to `student_submissions` (FK, ON DELETE CASCADE) and
    `waitlist_applications` (FK) + indexes.
  - Waitlist backfill: rows linked to a course **only when exactly one course matches**
    `target_course` text — no guessing on ambiguity; unlinked rows visible to the
    super_admin only.
  - `admin all` replaced with ownership-scoped policies on both tables (read / update /
    delete by `courses.owner_id = auth.uid()`), plus:
    - student insert policy: must be self, status `pending`, no grade/feedback, non-null
      `course_id`, and **actively enrolled** (`has_active_enrollment`).
    - `waitlist apply` (anon, pending, no notes) and `waitlist office register`
      (course owner, notes allowed) — the walk-in flow needed its own policy.
    - deletes: submissions → super_admin only; waitlist → owner or super_admin.
  - Legacy duplicate policy `submissions own read` (from migration 000) dropped — this
    produced **errors-log rule 11** (never stack duplicate policies; always verify the
    final `pg_policies` count).
- `src/app/dashboard/page.tsx`:
  - mock `SUBMISSIONS` / `WAITLIST_APPLICANTS` removed; both load **from the DB**, scoped
    by RLS (no client-side filtering trusted or needed).
  - `handleSaveGrade` — real DB update (grade, `dr_feedback`, status `graded`), with
    user-facing error reporting.
  - `handleStudentSubmit` — real DB insert with a **course picker**; enrollment is
    verified server-side by RLS.
  - `handleAddApplicant` — walk-in insert now links `course_id` at the DB level.
- `SubmitProblemSetModal` — new course selector (required).

**Verification by user:**
- `pg_policies` check: exactly **9 policies** — 4 on `student_submissions`, 5 on
  `waitlist_applications`, no leftovers. ✅

**Commits:** `00ef9dd` (task ج), `491f55d` (errors-log rule 11) — pushed 2026-11-15.

---

### Phase 7 — Docs & process rules ✅

Added to `GEMINI.md`'s permanent errors log during this cycle:

- **Rule 9** — never assume a migration was applied; verify against the live DB first
  (incident: 006 never ran → quizzes silently mocked).
- **Rule 10** — structured metadata lives only in dedicated columns, never free text
  (incident: PHENOL_META).
- **Rule 11** — never stack duplicate policies; drop every legacy policy a migration
  replaces and re-verify the count from `pg_policies`.

---

## 4. Production database state (as of 2026-11-15)

| Item | State |
|---|---|
| Migrations applied | 000 → 013 (all run manually by the owner, after backup) |
| `student_submissions` | 4 policies: delete admin / grade own course / own insert / read own or course owner |
| `waitlist_applications` | 5 policies: apply / delete scoped / manage scoped / office register / read scoped |
| Quizzes | Base schema + authoring RPCs live; questions column-secured (verified 0 SELECT leaks) |
| Courses | Clean descriptions; ownership in native columns only |
| Verification tool | `supabase/verify/check_database_state.sql` (currently covers through 011; update for 012/013 queued) |

---

## 5. Outstanding queue (agreed, not started)

| # | Task |
|---|---|
| **د** | `instructor_profiles` table — instructor directory read from the DB instead of localStorage |
| **هـ** | Clean up `StudentQuizzesTab` — the last mock-based surface (student Tasks tab does not yet show real DB submissions) |
| — | Extend `check_database_state.sql` to cover migrations 012/013 |

---

## 6. Reference

- **Engineering rules + permanent errors log:** `GEMINI.md`
- **Migrations:** `supabase/migrations/` (000–013, numbered, idempotent)
- **Verification queries:** `supabase/verify/check_database_state.sql`
- **Security docs:** `docs/SECURITY.md`, `docs/LEAK-PLAYBOOK.md`
