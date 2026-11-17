# PHENOL LMS — Project History & Work Log

**Project:** Phenol Academy LMS (single-teacher platform → multi-teacher platform)
**Owner:** Dr. Omar Magdi (super_admin, phenolvii@gmail.com)
**Stack:** Next.js 14 (App Router) + Supabase (PostgreSQL, Auth, RLS) + Tailwind
**Production:** Vercel (auto-deploy on push to `main`) — Supabase project `phenol-db` (FREE tier)
**Last updated:** 2026-11-16, repo state `d05f65e` (migrations 000 → 017; 017 run/confirm by user)

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
| Engineering rules | Documented in `GEMINI.md` (rules 1–14 + permanent errors log) |

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
    enforced server-side by the student-insert RLS policy (must be actively enrolled).

**Commits:** `b83a5c3`, `633b07f` (docs) — pushed / local-only respectively. User confirmed
migration 013 applied ("تمام يدم").

---

### Phase 7 — Retire the legacy "admin all" policies (task 014) ✅

**Request (from Claude-pack findings, adopted):** migration 013 retired "admin all" only on
the two tables it touched — the same wide-grant policy stayed live on **11 other tables**
(profiles, registered_students, course_enrollments, lesson_assets, lessons, courses,
lesson_progress, lesson_comments, media_access_log, user_sessions, referrals). This
produced **GEMINI.md errors-log rule 12** (audits must cover EVERY table).

**Delivered:**
- **Migration 014** (`014_retire_admin_all.sql`, applied by user) — dropped "admin all" on
  all 11 tables; ownership-scoped policies everywhere; `office_register_student` RPC
  replaces client-side upserts with fake ids; course insert tightened to
  `owner_id = auth.uid()`.
- User verified: `select ... where policyname in ('admin all','super admin all')` → **0 rows**.

**Commits:** `a1eea23` + rule 12 (`1db0455`) — pushed.

---

### Phase 8 — Paid booklets moved to gated private storage (task 5) ✅

**Request:** The 3 study dossiers were plain files in `public/booklets` — free for anyone
to download. The owner confirmed booklets are **PAID material** → gate them.

**Delivered:**
- **Migration 015** (`015_booklets_private.sql`, applied by user) — private storage bucket
  `booklets`, `booklets` table + RLS (read = owner / super_admin / ACTIVE-enrolled student;
  manage = owner / super_admin), `can_download_booklet` security-definer helper
  (re-verifies enrollment server-side), 3 seeded rows with `course_id` NULL on purpose
  (the only platform course is NOT their course — super_admin-only until their course
  launches).
- `public/booklets` deleted from the repo; mock `BOOKLETS` array deleted;
  `BookletsView` rewritten to download via **5-minute signed URLs**.
- User uploaded the real PDFs to the bucket (copies kept at
  `C:\Users\lenovo\OneDrive\Desktop\phenol-booklets-upload`).

**Commits:** `5f1d035` — pushed. ⚠️ This commit carried an encoding casualty, fixed in
Phase 10 (see errors-log rule 13).

---

### Phase 9 — Hero emblem polish ✅

**Delivered:** brand emblem enlarged 96 → 120px, background tile removed.

**Commits:** `e54f247` — pushed.

---

### Phase 10 — Faculty directory + student quizzes become real (tasks "د" + "هـ") ✅

**Request:** after 014 the public faculty page degraded (it assembled instructors in the
browser from localStorage + broad scans of `registered_students`/`profiles`, which RLS now
blocks), and the student Quizzes tab was still mock (answer key shipped in the browser
bundle, client-side grading).

**Delivered:**
- **Migration 016** (`016_instructor_profiles.sql`, applied by user, amended once):
  - `instructor_profiles` table (name/email/whatsapp/avatar/title/bio/specialization/
    `is_published`); published rows public-read, unpublished = owner + super_admin,
    owners manage their own row.
  - **Backfill from BOTH role stores** — first version read only `profiles.role='instructor'`
    and missed instructors promoted only in `registered_students` ("Test",
    "D. Khaled Biologist"); amended with a second backfill joining
    `auth.users ON u.id::text = rs.id` (fake `stu-...` ids excluded by uuid regex).
    User confirmed: **4 rows, all published** (Dr. Omar Magdi, Phenol, Test,
    D. Khaled Biologist).
  - `decide_instructor_request` upgraded: approving a faculty application now
    auto-creates/updates the directory row from the application data.
- `src/lib/data/instructors.ts` rewritten: DB-driven (`instructor_profiles` published +
  course ownership columns as safety net); the SEED hardcodes removed;
  localStorage = cache only (rule 1).
- `StudentQuizzesTab.tsx` rewritten: real quizzes of the student's ACTIVE courses via
  `get_course_quiz_metadata`, "Start" opens the real exam room
  `/courses/[id]/quizzes/[quizId]`; dashboard mock quiz state deleted.
- **Mojibake incident:** removing the mock `BOOKLETS` in Phase 8 was done with a
  PowerShell `Get-Content | Set-Content` pipeline that re-decoded the UTF-8 source as
  ANSI, corrupting 4 Arabic `nameAr` strings — shipped to production in `5f1d035`.
  Fixed by restoring `mock-data.ts` from git history and redoing the removal with the
  edit tool / explicit UTF-8 .NET I/O. Produced **errors-log rules 13 + 14**.

**Commits:** `1cd6b46` (د + هـ), `27effef` (mojibake fix) — pushed together on approval
(`06ba0f0  main -> main`).

---

### Phase 11 — Question banks become gated DB content (017) + keepalive (T9) ✅

**Delivered:**
- **Migration 017** (`017_question_banks.sql`) — `question_bank_items` table with RLS
  mirroring the booklets pattern (read = owner / super_admin / ACTIVE enrollment). The
  hardcoded 13-question bundle deleted; the dangerous fallback that served the same
  Arabic organic questions on EVERY course is gone (empty bank + empty-state UI instead).
  Old content preserved in `supabase/optional/seed_question_bank.sql` — runs manually
  after replacing `<<COURSE_ID>>` (course ids are never guessed).
- **T9 keepalive** — GitHub Action `supabase-keepalive` pings the public
  `instructor_profiles` endpoint every 2 days so the FREE-tier project is never paused
  for inactivity. Pushed as code hit GitHub's `workflow`-scope restriction, so the file
  was added manually via the GitHub web UI; repo secrets `SUPABASE_URL` +
  `SUPABASE_ANON_KEY` (publishable key) configured by the user; **manual run returned
  green**.
- `supabase/verify/check_database_state.sql` extended to cover 000→017 (tables,
  functions, policies incl. storage, "admin all" gone, private booklets bucket,
  audit marker through 017).

**Commits:** `7f68121` amended to `d05f65e` (workflow file excluded from git) — pushed
(`06ba0f0..d05f65e main -> main`).

---

## 4. Remaining backlog

1. Seed the 13 practice questions to a real course (`supabase/optional/seed_question_bank.sql`).
2. Re-link booklets `course_id` when their course launches.
3. Refresh the personal snapshot `D:\phenol-lms.zip` (done below in Phase 11 wrap-up).
4. Supabase anon/publishable keys policy migration — keys now shown as `sb_publishable_*`;
   the keepalive workflow uses the publishable key (legacy JWT `anon` still valid).

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

## 2026-11-17 â€” Phase 0: Expansion technical audit (LOCAL-ONLY)
- Expansion brief received (instructor analytics, student dashboard, super-admin analytics, AI assistant, whiteboard, live sessions).
- Wrote docs/EXPANSION_TECHNICAL_AUDIT.md (Phase 0 audit ONLY - no structural code changes).
- Critical finding verified by code+migration scan: ZERO payment infrastructure (no payments table, no price, no gateway) -> recommend payments table + manual real transactions + platform_settings + courses.price; financial dashboards show explicit empty state until real records exist.
- Feasibility: Gemini API verified via local SDK skill; NotebookLM not feasible (no public API known); Excalidraw (MIT) preferred over tldraw (commercial license); Jitsi links + manual recording workflow; GA4 for visitors.
- Next migration 020 (data foundation). Awaiting architectural approval before any implementation.


## 2026-11-17 â€” Phase 0: Centralized governance audit (LOCAL-ONLY)
- Governance brief received: 4 roles (super_admin/secretary/instructor/student), centralized enrollment, unified payments, instructor ledgers, audit log, Kashier.
- Verified in code: admin_enroll_student (018) = super_admin OR course owner -> instructors CAN self-enroll today; brief's "replace instructor-controlled enrollment" premise is accurate.
- Wrote docs/GOVERNANCE_AUDIT.md: migration plan 020-026 (rbac_secretary, financial_foundation, audit_logs, enrollment_governance, course_governance, settlements, private_services).
- User decisions: secretary = o.magdi777@gmail.com (more later); commission per-instructor (not flat 20%); phase order delegated to assistant.
- Key rules: is_secretary() allow-list (never is_admin), payment/price snapshot per transaction, audit_logs append-only with tamper trigger, no destructive deletion (deactivate instead), Kashier sandbox-first with server-only keys.
- Awaiting approval of migration plan before writing 020.


## 2026-11-17 â€” Migration 020 implemented (RBAC secretary, NOT yet applied/pushed)
- Approval received: Migration 020 ONLY, stop after, no push/deploy.
- Pre-implementation re-audit done in code: owns_course requires instructor role (secretary cannot bypass), decide_instructor_request super_admin-only, admin_enroll_student untouched, trg_protect_profiles_role unchanged. Latent bug found: 009 signup-trigger conflict branch force-downgraded existing profile roles to student -> 020 preserves super_admin/instructor/secretary.
- 020_rbac_secretary.sql: profiles_role_check widened (+secretary), is_secretary() helper (pure role check, grants nothing), admin_set_user_role rewritten (whitelist +secretary, directory treats secretary like student), handle_new_auth_user role-preservation fix. ZERO writes with role='secretary' (no auto-promotion; test A3 asserts 'secretary' appears exactly once in the function body).
- Verification: check_database_state.sql + audits 6d-6h + marker through 020; NEW supabase/verify/020_role_matrix_test.sql (Part A: 10 DB assertions; Part B: 12-step manual app matrix B1-B12).
- Interim behavior: promoted secretary sees student-style dashboard until Phase 3.
- Next (blocked on 020 review): 021 financial foundation.

## 2026-11-17 — 020 verification round 1: checklist authoring error corrected (LOCAL-ONLY)
- Live verify run: every 020 audit OK (constraint, whitelist+gate, signup preservation, no secretary directory row, secretary count = 0). Schema marker OK (through 020).
- One MISSING row exposed: "quiz_submissions -> submissions grade own course" — traced to a 017-era checklist authoring error: that policy never existed in ANY migration (quiz submissions are RPC-only writes by design, migration 010). NOT a platform regression; live DB is correct.
- Fixed checklist: phantom entry + duplicate "submissions read own or course owner" row removed; new truthful design audit 6i added (quiz_submissions must have exactly ONE policy: the SELECT one).
- Fixed 020_role_matrix_test.sql: A1 regex dollar-quoted (was double-quoted -> SQLSTATE 42703 "column does not exist") and A3 label single-quoted. Both bugs were in the TEST file only, not in migration 020.

## 2026-11-17 â€” 020 verification round 2: A1 fixed + promotion runbook (LOCAL-ONLY)
- Full matrix run: A2-A10 all PASS (A9 = 0). A1 false-FAIL explained: pg_get_constraintdef() renders IN-lists in internal "= ANY (ARRAY[...])" form; rigid regex replaced with ilike-all-four-roles check.
- Live finding: dashboard role toggle (handleToggleUserRole) only offers instructor/student -> secretary promotion needs SQL Editor (admin_set_user_role from the editor fails is_super_admin() because there is no JWT there).
- Promotion runbook: single transaction - disable trg_profiles_protect_role, update BOTH stores (profiles + registered_students = SECRETARY), re-enable trigger before commit (lock blocks concurrent writes = zero exposure window).
- UI backlog added to Phase 3: secretary option in role UI + remove client-side direct-table fallback in handleToggleUserRole.


## 2026-11-17 â€” 020 VERIFIED & PUSHED (code commits only)
- Part A re-run: 10/10 PASS (A9 = 1 after promotion; A1 false-FAIL root-caused to pg_get_constraintdef rendering IN-lists as = ANY (ARRAY[...]); test made format-agnostic via ilike-all-four).
- Part B matrix: user confirmed all pass. Live console evidence: secretary got 400 forbidden on admin_set_user_role ("only academy founder (super_admin) can change user roles"), decide_instructor_request ("only the academy director can decide faculty applications"), admin_enroll_student ("only the director or the course owner can enroll directly"). B3 confirmed: secretary sees student-style dashboard (interim, expected).
- Secretary promoted: o.magdi777@gmail.com (secretary / SECRETARY in both stores) via owner-run transaction (trigger disable/update/enable inside one transaction).
- Note: o.magdi777 retains a pre-existing ACTIVE enrollment in Organic Chemistry 3 - harmless (student-side access, unrelated to admin powers).
- Pre-existing UI bug fixed + PUSHED: All Accounts table showed only students; instructor rows appeared minutes late (studentDirectory memo depended only on [enrollments] while roster sync mutates the module store afterwards). Fix: rosterVersion state bumped after sync + on roster events -> memo recomputes immediately; role check made case-insensitive. Build green, commit 11307ce.
- Push approved by user ("Ø§Ø¹Ù…Ù„ push"): docs commit stripped (b11a80d), code pushed, docs re-committed locally.
- NEXT: Migration 021 (financial foundation: platform_settings, courses.price, instructor commission override, payments with snapshots, idempotency key) - awaits user go.


## 2026-11-17 â€” Migration 021 written (financial foundation, NOT yet applied)
- User approved start ("Ø§Ø¨Ø¯Ø§ ÙŠØ¨ÙˆÙŠØ§") after 020 verified + pushed.
- 021_financial_foundation.sql: platform_settings (2 seeded keys: default commission FALLBACK 20% + EGP currency; never overwrites), courses.price/currency/subscription_months (all null/default - zero fabricated prices), profiles.platform_commission_pct (per-instructor override, super-admin-only via new trigger - closes the 014 own-row-update door for money), payments unified ledger (6 statuses, 5 methods, per-row snapshots of price/pct/amounts/fee, NO client write policies, read = own student/course owner/super admin, reference idempotency unique index), trg_payments_guard (money columns immutable post-insert; legal transitions only PENDING->UNDER_REVIEW/FAILED/CANCELLED, UNDER_REVIEW->VERIFIED/..., VERIFIED->REFUNDED; VERIFIED requires verified_by+verified_at; terminal rows frozen), trg_courses_pricing_guard (instructors cannot price; secretary branch dormant until 024 RPCs).
- Verification: check_database_state.sql + FINANCE audits J1-J6 (incl. truth check: payments/priced-courses/commission counts) + marker through 021; NEW 021_financial_foundation_test.sql (Part B: 10 assertions; Part C: manual matrix C1-C8 - instructor self-commission and self-pricing must be forbidden).
- Deliberately deferred: payment RPCs (023), pricing history (024), settlements (025), Kashier webhook (Phase 6).
- STOP after 021 per workflow; awaits user run + review before 022.


## 2026-11-17 â€” Migration 021 applied & VERIFIED (local; not pushed)
- Owner ran 021 after backup. check_database_state.sql: ALL OK, marker OK (through 021). FINANCE audits J1-J6 OK.
- Truth state: 0 payments / 0 priced courses / 0 commission overrides (nothing fabricated).
- 021 test file: B1-B10 all PASS.
- Pending from matrix: Part C manual proofs (C2 self-commission forbidden, C3 self-pricing forbidden, C4 direct payments insert denied) - owner may run anytime; the DB-level guards are already bound and audited.
- Commissions unset by design until super-admin UI workflow (023+).
- NEXT: 022 audit_logs (append-only, tamper trigger) - awaits user approval.


## 2026-11-17 â€” Migration 022 written (audit_logs, NOT yet applied)
- User approved ("Ø®Ø´ Ø¹Ø§Ù„Ù„ÙŠ Ø¨Ø¹Ø¯Ù‡ Ø´ÙƒÙ„Ùƒ ÙØ§Ù‡Ù…") + requested resumption file first.
- docs/WORK_STATE.md created (resumption file: facts, task list, rules, migration pattern, git dance, architecture facts, files map, resume checklist) - committed into the local docs commit (4ef16e9), code commit re-created as 9b12ea7.
- 022_audit_logs.sql: audit_logs append-only ledger (actor snapshot id/email/role frozen at write time; dot-notation action; entity ref; summary; jsonb details; note; source manual/rpc/trigger/webhook/system) - read policy super_admin ONLY (secretary excluded - her own actions are in the log), NO client write policies, trg_audit_logs_guard forbids UPDATE/DELETE for EVERYONE (super_admin, maintenance SQL, definer functions - triggers fire inside them), log_academy_action RPC (allow-list super_admin OR is_secretary, validates action/source, definer), trg_audit_role_change on profiles (AFTER UPDATE OF role - automatic day-one capture of role changes incl. admin_set_user_role with ZERO rewrite of existing RPCs; audit insert shares the transaction - audit failure rolls back the change).
- Verification: check_database_state.sql + AUDIT AUDIT audits K1-K5 + marker through 022; 022_audit_logs_test.sql (Part A: A1-A9 single query; Part B manual: B1/B2 SQL Editor tamper refusals, B3-B5 instructor/student denials; Part C optional live role-change proof without disabling the audit trigger).
- Deliberately NOT here: UI viewer (026), hooks into existing RPC bodies (profile trigger covers role changes; other flows wired in 023+ rebuilds).
- STOP after 022 per workflow; awaits user run + review before 023.


## 2026-11-17 â€” 022 verified A1-A9 PASS; live Part-B proof exposed empty-table nuance -> addendum 022b
- Owner applied 022: check_database_state ALL OK, marker OK (through 022), ledger 0 rows.
- Test run: A1-A9 PASS after fixing A2 false-FAIL (pg_policies.cmd is UPPERCASE; compared lowercase - same class as constraint-text lesson). Fix commit 1f013be.
- Owner's manual tamper proof (UPDATE/DELETE on empty audit_logs) returned "Success. No rows returned" - row-level trigger never fires on zero rows (normal SQL semantics, NOT a hole).
- Addendum 022b_audit_logs_statement_guard.sql: trg_audit_logs_guard_statement (BEFORE UPDATE OR DELETE FOR EACH STATEMENT) - refuses every UPDATE/DELETE for everyone even on an EMPTY table. Row guard stays as 2nd layer. Marker comment updated.
- Verification updated: check script (function row + K2 requires both guards), test A3 requires both guards, Part B notes the empty-table refusal.
- Awaiting: owner runs 022b -> re-runs B1/B2 (must be REFUSED now) -> re-run check + test -> then 022 is closed and 023 starts on approval.


## 2026-11-17 - 022 CLOSED (022b live tamper proof succeeded)
- Owner applied 022b. check_database_state: ALL OK, guards row "migration 022/022b", marker OK (through 022), ledger 0 rows.
- LIVE PROOF: DELETE FROM public.audit_logs refused with P0001 by trg_audit_logs_guard_statement (line 7) - screenshot confirmed.
- docs updated: GOVERNANCE_AUDIT 14.8 + WORK_STATE (022 closed, next 023 awaits approval).

## 2026-11-17 - Migration 023 written (centralized enrollment + payment RPCs, NOT yet applied)
- User approved ('نفذ') after 022 closed.
- 023_centralized_enrollment_payments.sql: admin_enroll_student + set_enrollment_status re-gated to super_admin OR is_secretary (instructor owns_course branch REMOVED) + audit rows (enrollment.direct / enrollment.status); record_payment RPC (office-only; resolves price snapshot + commission pct owner-override->settings-fallback + platform/instructor amounts + fee AT INSERT; PENDING; duplicate reference friendly refusal); set_payment_status RPC (mirrors 021 transitions; VERIFIED stamps verified_by/at AND auto-activates enrollment = subscription gate; REFUNDED requires note; audit payment.status); waive_enrollment_payment RPC (mandatory reason; audit enrollment.waiver). NO new queue table - course_enrollments PENDING flow via request_enrollment covers it.
- UI re-gating SAME CYCLE (build green): AdminRosterTab enroll/revoke/activate buttons super-admin-only with 'Office-managed' markers; dashboard handlers guarded isSuperAdminUser; CourseStudentsModal canManageEnrollments prop. Instructor content powers (owns_course for lessons/quizzes) untouched.
- Verification: check script 6l audits L1-L4 + marker through 023; 023 test file A1-A10 + manual matrix B1-B7.
- NEXT: owner runs 023 after backup; then 024 (course governance + pricing UI) awaits review.

## 2026-11-17 - 023 applied & VERIFIED
- Owner ran 023 after backup. check_database_state: ALL OK, marker OK (through 023), GOVERNANCE audits L1-L4 OK, truth state 0 payments / 0 audit rows.
- 023 test: A1-A10 all PASS.
- B4-B6 (payment flow) deferred by design - RPCs gated + audited but no UI calls them yet; live proof comes with first real payment via 024/025 office screens. B1-B3 live proofs available anytime.
- NEXT: 024 (course governance + pricing UI + payment office screens) - awaits owner approval.
