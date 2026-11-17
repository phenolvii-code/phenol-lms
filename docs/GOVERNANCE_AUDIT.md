# PHENOL ACADEMY — Centralized Governance Audit (Phase 0)

**Status: APPROVED · Migration 020 WRITTEN (not yet applied to the live DB) · STOP after 020 per approval.**
Date: 2026-11-17 · Baseline: migrations 000→019 live · GitHub `50b1456` · Companion to `EXPANSION_TECHNICAL_AUDIT.md`
Implementation record for 020: section 12 below.

---

## 1. Existing role architecture (verified in code)

| Store | Values | Guard |
|---|---|---|
| `profiles.role` | `student`, `instructor`, `super_admin` | CHECK constraint (007) |
| `registered_students.role` | same, uppercase on read | synced by RPCs (018/019) |
| Role changes | only via `admin_set_user_role` (019) — super_admin-only, founder protected, syncs directory | `trg_protect_profiles_role` blocks direct UPDATE |

**Conflict 1 (resolved by design):** CHECK constraints must be extended to accept
`secretary` (lowercase, consistent with existing values). Additive constraint change — no
data loss. Both stores + `admin_set_user_role` whitelist must learn the new role together.

**Conflict 2 (verified decision):** `o.magdi777@gmail.com` becomes the first secretary,
promoted via extended `admin_set_user_role`. Secretaries get NO instructor directory row
(019's directory sync must skip secretary, not just backfill instructors).

## 2. Current authorization implementation (verified)

- Pattern since 013/014: `is_super_admin()` + `owns_course()` + `has_active_enrollment()`
  in security-definer RPCs. `is_admin()` is retired (014); **zero new policies may trust it**.
- 018 re-gated the dangerous RPCs. Verified enroll path: `admin_enroll_student` = **super_admin OR course owner** → instructors CAN self-enroll students today.
- `decide_instructor_request` (009/019): super_admin-only → matches the brief (secretary
  never approves instructors). No change needed.

**Conflict 3 (the brief's premise, confirmed true):** instructor enrollment rights must be
REVOKED and replaced with a request workflow. This changes instructor-UI behavior — the
enrollment RPC re-gate and the UI change must ship in the SAME push (rule 1: no broken
windows). Instructor's waitlist tab becomes "request enrollment → secretary queue".

## 3. Existing course management (verified)

- `courses.approval_status` = `PENDING | APPROVED | REJECTED` (007, default PENDING) + `is_published` boolean + index on approval_status.
- **Decision — map, don't duplicate:** the brief's 6 statuses (DRAFT…ARCHIVED) map onto the
  existing two columns: DRAFT = PENDING + unpublished; APPROVED = approval_status APPROVED;
  PUBLISHED = APPROVED + published; UNPUBLISHED = published→false; ARCHIVED = new nullable
  `archived_at` timestamp only if actually needed. No new status column, no migration churn.

## 4. Existing payment & subscription architecture (verified: NONE)

Zero payment tables/columns/gateways (double-verified in the expansion audit). `course_enrollments.status`
is the de-facto subscription state (PENDING/ACTIVE/REJECTED) with no monetary value.
**Everything in brief §6 is greenfield** — and the brief's unified-transaction design slots
directly into the planned `payments` table from the expansion audit (method list now adds
`kashier`).

## 5. Required changes (migration plan — next free number 020)

| Migration | Content |
|---|---|
| **020_rbac_secretary** | CHECK constraints (+`secretary` both stores) · `is_secretary()` helper (definer) · extend `admin_set_user_role` (+secretary, skip directory sync) · extend role-sync triggers |
| **021_financial_foundation** | `platform_settings` (key/value: default_platform_commission_pct, currency) · `courses.price` + `courses.subscription_months` · instructor commission override column · `payments` (student, course, instructor, method ∈ kashier/cash/instapay/vodafone_cash, gross_amount, currency, status ∈ PENDING/UNDER_REVIEW/VERIFIED/FAILED/REFUNDED/CANCELLED, reference, collected_at, verified_by, verified_at, **commission snapshot + price snapshot**, enrollment link) · idempotency unique key (course, student, reference) against duplicate processing |
| **022_audit_logs** | `audit_logs` (actor, actor_role, action, entity, entity_id, prev_state jsonb, new_state jsonb, note, metadata) · INSERT-only policy · trigger blocking UPDATE/DELETE for everyone · read = super_admin only |
| **023_enrollment_governance** | re-gate `admin_enroll_student` (secretary OR super_admin — instructor right revoked) · `enrollment_requests` queue (student-initiated or instructor-initiated, secretary processes) · payment-verified activation rule: ACTIVE requires a VERIFIED payment or explicit `manual_waiver` record — never a client redirect |
| **024_course_governance** | secretary course lifecycle RPCs (create/edit/assign/approve/publish/unpublish) with super_admin override preserved · pricing history log table |
| **025_settlements** | `instructor_settlements` (period, amounts from VERIFIED payments, status) · ledger RPCs read-only for instructor |
| **026_private_services** | `private_services` (instructor, name, price, duration) · `private_bookings` (student, service, status, payment link) — instructor proposes, secretary commercializes |

Every migration: RLS with the standing helpers, + verify-script audit in
`check_database_state.sql`, + backup-before-run, + idempotent.

## 6. Commission model (per user decision)

- NOT a flat 20%. `platform_settings.default_commission_pct` exists as fallback only.
- Per-instructor override column (set by super_admin only) — secretary cannot change it.
- Course-level override only if ever explicitly needed (add later, avoid premature columns).
- **Snapshot rule:** every payment row stores the pct + amounts used at transaction time;
  later policy changes never rewrite history (brief §6.1 hard rule).

## 7. Revenue share math (verified against brief §6.3 example)

Stored at insert/verification time per payment:
`platform_amount = gross × pct / 100 · instructor_amount = gross − platform_amount − (processing_fee if method = kashier)`.
Processing fee is recorded, not estimated: for Kashier = actual 2.75% + 3 EGP from the
gateway response; for cash = 0. Refunds generate an explicit reversal row (never edit the
original).

## 8. Migration risks

1. **Constraint widening** (020): additive; existing rows unaffected. Low risk.
2. **Instructor enrollment revocation** (023): behavior change visible to instructors →
   ship with UI change in same push; announce in-app note.
3. **SECRETARY in `registered_students.role`**: the roster role parser (007/008) maps
   uppercase roles; must add SECRETARY mapping or roster rows would degrade to student.
4. **Zero payments data**: all financial UIs render explicit empty states (no fabricated
   zeros) until real records exist — carried from the expansion audit.
5. **Free-tier growth**: audit_logs grows fast → lean rows, jsonb metadata, retention note.

## 9. Recommended implementation sequence (user delegated ordering)

| Phase | Delivers | New role impact |
|---|---|---|
| **1** (020–022) | RBAC + financial foundation + audit log | secretary exists, no workflows yet |
| **2** (023–024) | centralized enrollment + course governance + request workflow | secretary can operate |
| **3** | Secretary dashboard (daily queues) | secretary productive |
| **4** (025) | ledgers, super-admin financial overview, settlements | money visible truthfully |
| **5** (026) | audit-log viewer + private services | full governance |
| **6** | Kashier sandbox → live (server-only keys, signed webhooks) | online card payments |
| after | AI / whiteboard / live sessions (first expansion brief) | — |

## 10. Security considerations (non-negotiables carried into build)

- All permission checks server-side (RLS + definer RPCs); frontend hiding is cosmetic only.
- `is_admin()` never trusted; secretary = explicit allow-list, never a blanket admin grant.
- Payment verification: manual → secretary-reviewed evidence; Kashier → signature-verified
  webhook from server route (keys in Vercel env only). Client redirect never activates.
- Historical financial rows immutable (no UPDATE policy on payments after VERIFIED;
  corrections via reversal/adjustment rows).
- audit_logs append-only, tamper-protected at DB level.
- Founder protection rules (007/019) extend to the new role logic.
- Race conditions: payment verification uses row-level status transitions
  (PENDING→UNDER_REVIEW→VERIFIED) inside a single UPDATE ... WHERE status = expected, so a
  double-submit cannot double-activate.

## 11. Verification tasks before/during build

- Confirm exact Kashier merchant terms in writing before live keys (free test account first).
- Confirm `registered_students.role` CHECK/parse behavior for SECRETARY (008 parser).
- Confirm no other RPC reads `admin_enroll_student` with instructor assumptions (grep at 023 time).

---

## 12. Migration 020 — implementation record (`020_rbac_secretary.sql`)

**Scope honored:** role creation ONLY. No permissions granted, no account promoted, no
enrollment behavior touched (that is 023 with its own approval), no push/deploy.

### 12.1 Pre-implementation re-audit (verified in code, not memory)

| Path | Current behavior | 020 impact |
|---|---|---|
| `profiles_role_check` (007) | CHECK (student, instructor, super_admin) | widened additively (+secretary) |
| `registered_students.role` | free text, uppercase (NO constraint) | no change needed |
| `admin_set_user_role` (019) | super_admin gate, founder protected, whitelist (student, instructor), directory publish/unpublish | full rewrite, same signature/gate; whitelist +secretary; directory: secretary handled by the ELSE branch (unpublish, never create) |
| `handle_new_auth_user` (009) | new accounts always student (metadata never trusted); **latent bug found: profiles ON CONFLICT branch force-set role='student' on any existing row** | conflict branch now preserves existing super_admin/instructor/secretary; anti-escalation intent unchanged |
| `trg_protect_profiles_role` (007) | only is_super_admin() can change roles; founder cannot be demoted | unchanged — secretary cannot self-change roles |
| `owns_course()` (007f) | requires explicit `role = 'instructor'` | unchanged — secretaries cannot own courses or enroll via 018's owner path |
| `admin_enroll_student` (018) | super_admin OR owns_course | unchanged (revocation is 023's job) |
| `decide_instructor_request` (009/019) | super_admin-only | unchanged — secretaries cannot approve instructors |
| `is_admin()` (007f, retired) | instructor OR super_admin | secretary deliberately NOT added |

**Bypass scan result:** no alternative RPC or DB operation lets a secretary act as
instructor/super_admin. `is_secretary()` grants nothing by itself; 020 leaves ZERO
policies and ZERO RPCs referencing it (asserted by tests A7/A8).

### 12.2 What the migration changes (4 objects, zero data writes)

1. `profiles_role_check` → four roles.
2. `is_secretary()` — pure role check, STABLE, SECURITY DEFINER, revoked from public.
3. `admin_set_user_role(text,text)` — whitelist (student, instructor, secretary);
   super_admin stays non-assignable (founder-anchored); directory logic treats
   secretary like student (no faculty-directory row, ever).
4. `handle_new_auth_user` — role-preservation fix on the conflict branch.

**No `role='secretary'` write exists anywhere in the file** (asserted by test A3:
the function body mentions 'secretary' exactly once — the whitelist).

### 12.3 Verification artifacts

- `supabase/verify/check_database_state.sql`: + function is_secretary; + audits 6d–6h
  (constraint, RPC whitelist+gate, signup preservation, directory cleanliness,
  secretary-count); marker now "OK (through 020)".
- **Checklist correction (post-run):** the live run exposed a checklist authoring error
  from the 017-era commit — it demanded a policy "submissions grade own course" that
  never existed in ANY migration (quiz submissions are RPC-only writes by design,
  010: no INSERT/UPDATE/DELETE policies). Fixed: phantom entry + a duplicate row
  removed; replaced with a truthful design audit 6i (quiz_submissions must have
  exactly ONE policy — the SELECT one). Not a platform regression; nothing on the
  live DB was wrong.
- `supabase/verify/020_role_matrix_test.sql`: Part A = 10 DB-level assertions
  (PASS-only); Part B = 12 manual app-level matrix steps covering super admin /
  secretary / instructor / student / escalation paths (B1–B12). Test-fix after first
  live run: A1's regex now dollar-quoted (double-quoted string parsed as identifier →
  SQLSTATE 42703) and A3's assertion label single-quoted.

### 12.4 Runbook (user actions, in order)

1. Full DB backup.
2. SQL Editor → paste `020_rbac_secretary.sql` → Run.
3. `check_database_state.sql` → every row OK, marker "OK (through 020)".
4. `020_role_matrix_test.sql` Part A → all PASS (A9 informational count = 0).
5. **Manual promotion**: the current dashboard role-toggle only offers
   instructor/student (src/app/dashboard/page.tsx handleToggleUserRole), so the
   promotion runs in SQL Editor as the owner: a single transaction that
   momentarily disables the role-protection trigger, sets BOTH stores
   (profiles + registered_students), and re-enables the trigger before commit
   (zero exposure window - the lock blocks concurrent writes). Calling
   `admin_set_user_role` directly from SQL Editor does NOT work: `is_super_admin()`
   needs the caller's JWT, which the editor session does not have.
   After promotion, re-run Part A (A9 = 1) + Part B matrix.
6. Part A again (A9 count = 1) + Part B matrix steps.
7. Report results before 021 is written.

**UI backlog (Phase 3):** add "secretary" to the dashboard role-change UI and
remove the client-side direct-table fallback in handleToggleUserRole (the RPC
is the only sanctioned writer).

### 12.5 Known/accepted behavior for the interim window (until Phase 3)

A promoted secretary logging into the dashboard sees the student-style dashboard
(there is no secretary tab yet). That is expected and non-breaking; the secretary
operational dashboard arrives with Phase 3 (023/024 + UI).

---

## 13. Migration 021 — implementation record (`021_financial_foundation.sql`)

**Scope honored:** schema foundation ONLY. Zero payments rows, zero prices, zero
commissions created — everything starts EMPTY (truthful empty states until real data).

### 13.1 Objects created (all additive — nothing dropped, nothing rewritten)

| Object | Purpose | Key rules |
|---|---|---|
| `platform_settings` | configurable financial policies (brief §6.3: never hardcoded) | read: super_admin + secretary · manage: super_admin only · seeded with exactly 2 keys (idempotent, never overwrites): `default_platform_commission_pct = '20'` (FALLBACK only — real model is per-instructor overrides, user decision), `platform_currency = 'EGP'` |
| `courses.price` + `currency` + `subscription_months` (default 12) | centralized pricing | all NULL/default — no fabricated prices |
| `profiles.platform_commission_pct` (0–100, nullable) | per-instructor override — "different from mister to mister" | `trg_profiles_protect_commission`: only super_admin can change it (instructors can update their own profile row since 014 — this closes that door for money) |
| `payments` | unified ledger, one structure for cash/instapay/vodafone_cash/other/kashier (brief §6.2) | 6 statuses · snapshots per row (price, pct, platform/instructor amounts, processing fee) · NO client write policies (RPC/webhook-only, quiz_submissions pattern) · read: own student / course owner / super_admin |
| `idx_payments_reference_idempotency` | duplicate-payment protection (brief §11) | unique (course, student_email, reference) where reference not null |
| `trg_payments_guard` | financial immutability at DB level, for EVERY writer | entity/money columns immutable post-insert (wrong amount → CANCEL + new row, never edit history) · legal transitions only: PENDING→UNDER_REVIEW/FAILED/CANCELLED; UNDER_REVIEW→VERIFIED/FAILED/CANCELLED; VERIFIED→REFUNDED · VERIFIED requires verified_by + verified_at (no blind confirmation) · terminal rows frozen (corrections = reversal rows) |
| `trg_courses_pricing_guard` | pricing is centralized | instructors CANNOT price courses (brief §2); on instructor course INSERT price forced null; secretary branch dormant until her 024 RPCs (no course UPDATE policy exists for her yet) |

### 13.2 Refund model (brief §6.2 + §C financial corrections)

`VERIFIED → REFUNDED` is the single legal exit from a verified row (with verified_by
set). All other corrections = new documented reversal/adjustment rows — original
history is never edited.

### 13.3 What is intentionally NOT here (later migrations)

- No payment-recording/verification RPCs (023 — secretary workflows).
- No pricing history log (024 — course governance).
- No settlements/ledger aggregation (025).
- No Kashier integration (Phase 6) — `method='kashier'` rows arrive from the signed webhook.

### 13.4 Verification artifacts

- `check_database_state.sql`: + tables (payments, platform_settings), + functions
  (3 guards), + policies (payments read, settings read/manage), + audits 6j (J1–J6:
  write-policy count, immutability binding, pricing/commission guards, settings
  seeded, columns exist, TRUTH check showing ledger/price/commission counts),
  marker "OK (through 021)".
- `021_financial_foundation_test.sql`: Part B = 10 assertions; Part C = manual
  matrix (C1–C8) covering super admin / instructor / student / secretary paths,
  including the two hard denials instructors must get: self-commission and
  course pricing.

### 13.5 Runbook (user actions, in order)

1. Full DB backup.
2. SQL Editor → paste `021_financial_foundation.sql` → Run.
3. `check_database_state.sql` → all OK incl. FINANCE rows, marker "OK (through 021)".
4. `021_financial_foundation_test.sql` → all PASS (B9 informational = 0).
5. Part C manual steps (C2/C3/C4 are the security proofs).
6. Setting real instructor commissions can wait for the super-admin UI (023+);
   nothing depends on it yet. If wanted now: momentary-trigger-off transaction
   pattern (same as the secretary promotion).
7. STOP — 022 awaits review of 021 results.

### 13.6 Verification result (2026-11-17, applied by owner)

- `check_database_state.sql`: ALL OK — marker "OK (through 021)"; FINANCE audits
  J1–J6 OK; truth state: **0 payments, 0 priced courses, 0 commission overrides**
  (nothing fabricated).
- `021_financial_foundation_test.sql` Part B: **B1–B10 all PASS** (B9 = 0).
- Secretary state: 1 (o.magdi777) — awaiting 023 workflows.
- Commissions deliberately unset until the super-admin UI workflow (023+).

---

## 14. Migration 022 — implementation record (`022_audit_logs.sql`)

**Scope honored:** audit infrastructure ONLY. The ledger starts EMPTY (zero
fabricated history). Zero rewrites of any existing function/policy/trigger.

### 14.1 Objects created (all additive)

| Object | Purpose | Key rules |
|---|---|---|
| `audit_logs` | append-only action ledger for all governance decisions (brief §7) | actor SNAPSHOT (id/email/role frozen at write time — later role changes never rewrite history) · dot-notation actions (`role.change`, `payment.verify`, …) · entity ref + summary + jsonb details + reason note · source ∈ manual/rpc/trigger/webhook/system |
| read policy `audit logs read super_admin` | who can SEE the log | super_admin ONLY — not even the secretary (her own actions are in it) |
| NO client write policies | who can WRITE | nobody client-side — rows arrive via definer paths only (quiz_submissions pattern) |
| `trg_audit_logs_guard` | tamper-proofing at DB level | BEFORE UPDATE OR DELETE raises for EVERYONE — super_admin, maintenance SQL, even definer functions (triggers fire inside them). There is no edit/erase path to history anywhere. |
| `log_academy_action()` | structured logging RPC | allow-list gate: super_admin OR `is_secretary()` only (`is_admin()` never trusted) · validates action/source · snapshots actor role at write time · granted to authenticated only |
| `trg_audit_role_change` on profiles | automatic capture, day one | AFTER UPDATE OF role → logs `role.change` with old→new + target email · fires for `admin_set_user_role` and ANY other path, with ZERO rewrite of existing functions · audit insert shares the transaction: if the audit write fails, the role change rolls back — the ledger never silently misses a change |

### 14.2 Design notes

- The SQL Editor (postgres, no JWT) logs role changes with a null actor — the
  event itself is always recorded; that is accepted by design (Part C of the
  test documents it).
- Retention: nothing is ever deleted (that is the point). Archival, if ever
  needed, is a future decision — never a delete.
- Later migrations (023 payment verification, 024 pricing, 025 settlements,
  026 private services, Kashier webhook) write into this ledger via their own
  definer paths / `log_academy_action`.

### 14.3 What is intentionally NOT here

- No UI viewer (026 delivers the super-admin audit-log viewer).
- No hooks added to existing RPC bodies (the profiles trigger captures role
  changes without touching them; other flows get wired when 023+ rebuilds them).

### 14.4 Verification artifacts

- `check_database_state.sql`: + table/function/policy entries, + audits 6k
  (K1–K5: policy count, guard binding, role-trigger binding, definer RPC,
  TRUTH row-count check), marker "OK (through 022)".
- `022_audit_logs_test.sql`: Part A = 9 assertions (A8 informational: ledger
  starts empty); Part B manual matrix (B1/B2 = tamper refusals from the SQL
  Editor itself; B3/B4/B5 = instructor/student read + write denials);
  Part C optional live role-change proof via the trigger-off dance WITHOUT
  disabling the audit trigger.

### 14.5 Runbook (user actions, in order)

1. Full DB backup.
2. SQL Editor → paste `022_audit_logs.sql` → Run.
3. `check_database_state.sql` → all OK incl. AUDIT AUDIT rows, marker
   "OK (through 022)".
4. `022_audit_logs_test.sql` → all PASS (A8 informational = 0/empty).
5. Part B manual proofs — B1/B2 are the strongest: the SQL Editor itself must
   be refused when trying to edit history.
6. Part C optional (live role-change audit proof).
7. STOP — 023 awaits review of 022 results.

### 14.6 Verification result (2026-11-17, applied by owner)

- `check_database_state.sql`: ALL OK — marker "OK (through 022)"; AUDIT AUDIT
  rows K1–K5 OK; ledger state: **0 rows (empty as designed)**.
- `022_audit_logs_test.sql`: A1–A9 all PASS after one test-file correction
  (A2 compared `pg_policies.cmd` lowercase — pg stores it UPPERCASE; same
  false-FAIL class as the constraint-text lesson. Fixed in test commit).

### 14.7 Addendum 022b — statement-level tamper guard (live-tested gap)

During the owner's manual Part-B proof, `UPDATE public.audit_logs SET ...` /
`DELETE FROM public.audit_logs` returned "Success. No rows returned" — the table
was EMPTY, so the row-level trigger never fired (normal SQL semantics, not a
hole). To make the guarantee self-evident at the command level, addendum
`022b_audit_logs_statement_guard.sql` adds `trg_audit_logs_guard_statement`
(BEFORE UPDATE OR DELETE FOR EACH STATEMENT): every UPDATE/DELETE attempt on
`audit_logs` is now refused for EVERYONE even when the table is empty or the
WHERE clause matches nothing. Row-level guard stays as the second layer.
Verification updated: check script K2 + function row, test A3 now requires both
guards.

### 14.8 Verification result — 022b (2026-11-17, applied by owner)

- `check_database_state.sql`: ALL OK — guards row reads "migration 022/022b";
  `trg_audit_logs_guard_statement` present; marker "OK (through 022)"; ledger
  still **0 rows (empty as designed)**.
- LIVE TAMPER PROOF (owner, SQL Editor): `DELETE FROM public.audit_logs;` →
  **refused**: `ERROR P0001: audit_logs: history is immutable - DELETE is
  forbidden for everyone (append-only ledger)` — raised by
  `trg_audit_logs_guard_statement()` line 7 (visible in the error CONTEXT).
  022 CLOSED. 023 awaits owner approval.

---

## 15. Migration 023 — implementation record (`023_centralized_enrollment_payments.sql`)

**Scope honored:** enrollment governance + payment office RPCs. Zero payments
rows created, zero forced enrollments — nothing fabricated. The instructor
UI re-gating ships in the SAME cycle (build green) so no button calls an RPC
it can no longer call.

### 15.1 DB changes

| Change | Before | After |
|---|---|---|
| `admin_enroll_student` | super_admin OR `owns_course()` (instructor) | super_admin OR `is_secretary()` — instructor branch REMOVED + audit `enrollment.direct` |
| `set_enrollment_status` | super_admin OR `owns_course()` (instructor) | super_admin OR `is_secretary()` + audit `enrollment.status` |
| `record_payment()` (NEW) | — | office-only RPC: resolves price snapshot + commission pct (owner override → settings FALLBACK) + platform/instructor amounts + fee AT INSERT; status PENDING; duplicate references refused (021 idempotency index, friendly error); audit `payment.record` |
| `set_payment_status()` (NEW) | — | office-only RPC; mirrors the 021 transition guard for friendly errors; VERIFIED stamps `verified_by`+`verified_at` (no blind confirmation) and **AUTO-ACTIVATES the enrollment** (subscription gate); REFUNDED requires a written note; audit `payment.status` |
| `waive_enrollment_payment()` (NEW) | — | office-only RPC; manual-waiver path, mandatory written reason; audit `enrollment.waiver` |
| Enrollment queue | — | NO new table: the brief's `enrollment_requests` maps onto the existing `course_enrollments` PENDING flow via `request_enrollment` (000/001) |

### 15.2 UI changes (same cycle, build green)

- `AdminRosterTab.tsx`: "Enroll in Course" + revoke ✕ + "Activate Access Now"
  render for super_admin only; instructors see read-only views with muted
  "Office-managed" markers (no more buttons that would now 403).
- `dashboard/page.tsx`: `handleDirectEnrollSubmit` / `handleApproveEnrollment`
  / `handleRevokeEnrollment` guarded to `isSuperAdminUser`;
  `CourseStudentsModal` receives `canManageEnrollments={isSuperAdminUser}`.
- `CourseStudentsModal.tsx`: Activate/Revoke buttons gated behind
  `canManageEnrollments`; instructors see "Office-Managed" labels.
- Instructor CONTENT powers (lessons/quizzes, still `owns_course`) untouched.

### 15.3 Subscription gate model

Access activation paths now: (a) VERIFIED payment → auto-activate;
(b) explicit audited waiver; (c) founder/secretary direct enroll (audited).
The referral reward logic is preserved in all three paths.

### 15.4 Verification artifacts

- `check_database_state.sql`: + functions (record_payment, set_payment_status,
  waive_enrollment_payment), + audits 6l (L1–L4: office gates without
  owns_course, audit actions present, subscription gate, TRUTH state),
  marker "OK (through 023)".
- `023_centralized_enrollment_payments_test.sql`: Part A = A1–A10 single query;
  Part B manual matrix (instructor refusals B1/B2, super-admin still works B3,
  office payment flow B4, duplicate protection B5, waiver B6).

### 15.5 Runbook (user actions, in order)

1. Full DB backup.
2. SQL Editor → paste `023_centralized_enrollment_payments.sql` → Run.
3. `check_database_state.sql` → all OK incl. GOVERNANCE rows, marker
   "OK (through 023)".
4. `023_centralized_enrollment_payments_test.sql` → all PASS (A9 informational).
5. Part B manual matrix (B1/B2 instructor refusals are the security proofs).
6. The UI re-gating is committed locally — it goes LIVE only with the next
   approved push; until then instructors may still see buttons that now
   refuse at the DB level (fail-closed, never fail-open).
7. STOP — 024 awaits review of 023 results.

### 15.6 Verification result (2026-11-17, applied by owner)

- `check_database_state.sql`: ALL OK — marker "OK (through 023)"; GOVERNANCE
  audits L1–L4 OK; truth state: 0 payments, 0 audit rows.
- `023_..._test.sql` Part A: **A1–A10 all PASS** (A9 informational = 0/0).
- Part B status: B4–B6 (payment flow) deferred by design — the RPCs are gated
  and audited but no UI calls them yet; they get their live proof with the
  first REAL payment via the 024/025 office screens. B1–B3 live proofs remain
  available to the owner anytime.

