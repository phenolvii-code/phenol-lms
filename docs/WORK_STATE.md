# PHENOL ACADEMY — WORK STATE & RESUMPTION FILE
**Purpose: read this file FIRST in any new session to resume work with zero context loss.**
Last updated: 2026-11-17 (after migration 022 + 022b verified & CLOSED) · Maintained by the AI agent + owner

---

## 1. WHERE THE WORK IS (project facts)

| Item | Value |
|---|---|
| Local repo | `D:\phenol-lms-git` (Next.js 14 App Router + Supabase + Tailwind) |
| Personal snapshot | `D:\phenol-lms.zip` (refresh after every milestone) |
| Remote | GitHub → auto-deploys to Vercel (project: phenol-lms.vercel.app) |
| Supabase project | `krzzaqhzlmfbjcjtkpax.supabase.co` (org: phenolvii-code's Org, project phenol-db, FREE tier) |
| Publishable key (for live REST checks) | `sb_publishable_xF0aO99PJsEsh65KA1dAjQ_fmo5otP3` |
| DB migrations applied LIVE | **000 → 023** (owner applies each one manually after backup) |
| Next free migration number | **024** |
| Production (GitHub/Vercel) | `7b16dfb` (code only) |
| Local git structure | `[docs commit (LOCAL-ONLY, never pushed)] → [code commits]` on top of remote head |
| Owner | Dr. Omar Magdi — founder/super_admin, email `phenolvii@gmail.com` (untouchable in all logic) |
| Secretary | `o.magdi777@gmail.com` — promoted to role `secretary` (verified live) |

## 2. THE TASK LIST (in execution order)

### Active project: Centralized Governance (approved brief + GOVERNANCE_AUDIT.md)
- [x] **020** RBAC secretary role — applied, verified (10/10 PASS), pushed
- [x] **021** Financial foundation — applied, verified (B1–B10 PASS)
- [x] **022** `audit_logs` — applied + verified: A1–A9 PASS; live tamper proof done (DELETE refused by statement guard 022b even on empty table). **CLOSED.**
- [x] **023** Centralized enrollment + payment RPCs — **applied + verified live (A1–A10 PASS, check ALL OK, marker through 023)**. UI re-gating committed locally (build green) — goes live with next approved push. **CLOSED on the DB side.**
- [ ] **024** Course governance: secretary lifecycle RPCs (create/edit/assign/approve/publish/unpublish) + pricing history log + pricing UI (secretary sets price within limits; super admin override) + payment-recording office screens (first real exercise of record_payment/set_payment_status). **← NEXT (awaits owner approval)**
- [ ] **024** Course governance: secretary lifecycle RPCs (create/edit/assign/approve/publish/unpublish) + pricing history log + pricing UI (secretary sets price within limits; super admin override)
- [ ] **025** Settlements + instructor ledger (read-only for instructor) + super-admin financial overview UI
- [ ] **026** Private services module (instructor proposes → secretary commercializes → booking → revenue share) + audit-log viewer UI
- [ ] **Phase 6 (finance)** Kashier integration: free test/sandbox first → confirm merchant terms in writing → server-only route handlers + signature-verified webhooks → never trust client redirect
- [ ] After governance: AI assistant (Gemini, server-only), whiteboard (Excalidraw), live sessions (Jitsi links + manual recording workflow) — see `docs/EXPANSION_TECHNICAL_AUDIT.md`

### Small pending items (backlog)
- [ ] 021 test Part C manual proofs (C2 self-commission forbidden, C3 self-pricing forbidden, C4 direct payments insert denied) — owner may run anytime
- [ ] Legacy WhatsApp cleanup: `update public.instructor_profiles set whatsapp = null where whatsapp !~ '^[0-9+\-\s]{7,}$'` (owner hasn't run; "Phenol" row has placeholder text)
- [ ] Phase-3 UI backlog: secretary option in the dashboard role-change UI + remove client-side direct-table fallback in `handleToggleUserRole` (dashboard/page.tsx ~line 709)
- [ ] Dead-code hygiene: `phenol_user_role_*` localStorage reads, `phenol_registered_students` localStorage duplication, remaining `select('*')` calls
- [ ] DB-backed referral coupon system (referral rewards toned down in copy)

## 3. HOW THE AGENT WORKS (rules — never violate)

### Hard rules (from GEMINI.md + expansion/governance briefs)
1. NEVER break existing functionality; never delete features/data without explicit authorization.
2. NEVER use mock/fabricated data (especially financial) — financial dashboards show explicit empty states, not zeros-as-data.
3. NEVER trust `is_admin()` in any policy/RPC/trigger — use `is_super_admin()`, `owns_course()`, `has_active_enrollment()`, `is_secretary()` (secretary = explicit allow-list).
4. API keys/secrets NEVER in client code — server-only route handlers, keys in Vercel env.
5. NEVER push to GitHub without the owner's explicit per-push approval ("اعمل push").
6. NEVER apply migrations yourself — the owner runs them in Supabase SQL Editor after backup.
7. STOP after each migration: report + await review/approval before writing the next one.
8. Document every architectural decision; migrations are idempotent and preserve data.
9. No paid third-party without documented costs; verify vendor claims at build time (websearch works in this environment).
10. User communicates in Egyptian Arabic — respond in Egyptian Arabic. Platform UI/docs in English.

### Migration pattern (every migration, same discipline)
1. Re-audit the relevant live code paths FIRST (grep/read migrations + src, never from memory).
2. Write `supabase/migrations/0XX_name.sql`: idempotent, additive, RLS on every new table with the standing helpers, audit marker comment on schema (`...Migrations through 0XX...`).
3. Extend `supabase/verify/check_database_state.sql`: new tables/functions/policies + standing audits + bump the AUDIT MARKER chain (top = newest).
4. Write `supabase/verify/0XX_name_test.sql`: **ONE union-all query** (Supabase SQL Editor shows only the LAST statement's result — batch of separate SELECTs only shows the last row) + Part B/C manual app matrix.
5. Put the migration in the owner's Clipboard (PowerShell: `Get-Content ... -Raw | Set-Clipboard`), owner: Backup → paste → Run → verify → report.
6. Update `docs/GOVERNANCE_AUDIT.md` (implementation record section) + `docs/PROJECT_HISTORY.md`.
7. Commits: docs = ONE local-only commit (amended or recreated); code = separate commit(s) containing ONLY `supabase/*` or `src/*` files (never docs/). NEVER put docs changes in a code commit.

### The git docs-dance (LOCAL-ONLY docs, push workflow)
Local history shape: `[docs commit] → [code commits]` (docs commit is BELOW code commits, or HEAD when no new code).
- To update docs when docs commit is NOT HEAD: `git reset --soft HEAD~2; git restore --staged .; git add <docs files>; git commit -m "<docs msg>"; git add <code files>; git commit -m "<code msg>"` — verify code commit contains NO docs files (`git show --stat HEAD`).
- Push (only on explicit approval): backup `docs/*.md` + `GEMINI.md` to `C:\Users\lenovo\AppData\Local\Temp\opencode\docs-backup\` → `git rebase --onto origin/main <docs-commit-hash> main` (drops docs commit; docs files vanish from disk) → `git push origin main` → restore docs from backup → re-commit docs locally → verify `git cat-file -e origin/main:docs/PLATFORM_GUIDE.md` FAILS (= absent, good) → refresh `D:\phenol-lms.zip`.
- `git add` targeted files only — never `git add -A`.

### Verification habits
- After any SQL change: owner runs `check_database_state.sql` → EVERY row OK + marker "OK (through 0XX)".
- Role/security changes: run the migration's test file (Part A = DB assertions, all PASS).
- Live REST checks via browser execute tool or fetch with the publishable key.
- SQL Editor runs as `postgres` WITHOUT a JWT: `is_super_admin()` = false there — direct calls to gated RPCs fail. Owner-level data changes (role promotion, commission set, pricing) use the momentary-trigger-off transaction pattern:
  ```sql
  begin;
  alter table <table> disable trigger <trigger>;
  <updates in BOTH dual stores when roles are involved>;
  alter table <table> enable trigger <trigger>;
  commit;
  ```

### Environment notes
- Windows + PowerShell; `npm` needs `cmd /c "npm run build"` (execution policy blocks npm.ps1).
- Web search IS available in this environment (used for Kashier/payment-gateway research).
- Gemini skill loaded: current models `gemini-3.8-flash` etc., `@google/genai` — never legacy 1.5/2.x names.
- Build check after any src change: green build required before commit.
- Refresh `D:\phenol-lms.zip` after milestones (robocopy staging → ZipFile::CreateFromDirectory, exclude node_modules/.next).

## 4. KEY ARCHITECTURE FACTS (verified in code)

- Dual identity stores: `profiles.role` (lowercase: student/instructor/super_admin/secretary) AND `registered_students.role` (UPPERCASE, free text, no constraint) — keep BOTH in sync via RPCs only.
- Role changes: only `admin_set_user_role(text,text)` (super_admin gate, founder protected, whitelist student/instructor/secretary, syncs instructor directory: publish on instructor, unpublish otherwise). Signup trigger `handle_new_auth_user`: every NEW account = student; conflict branch preserves existing elevated roles (020 fix).
- Enrollment today: `admin_enroll_student` = super_admin OR `owns_course()` (instructor) → 023 will revoke the instructor branch (ship UI change together).
- Course approval: `approval_status` PENDING/APPROVED/REJECTED + `is_published` boolean (007/018). The governance brief's 6 statuses MAP onto these — no new status column needed.
- Payments (021): unified ledger, 6 statuses, per-row snapshots (price/pct/amounts/fee), immutable money columns + legal transitions enforced by `trg_payments_guard`, idempotency unique index on (course, student_email, reference), ZERO client write policies. `platform_settings`: default commission FALLBACK 20% + currency EGP. Per-instructor override: `profiles.platform_commission_pct` (super-admin-only via trigger). Pricing: `courses.price/currency/subscription_months` (all unset) + `trg_courses_pricing_guard` (instructor blocked; secretary allowed at trigger level but dormant until 024 RPCs).
- Finance truth state (live): 0 payments, 0 priced courses, 0 commission overrides — everything starts EMPTY on purpose.
- Instructor directory: `instructor_profiles` (public read = published rows only) — secretaries never get rows.
- Known verified live state: 5 published instructors; one legacy placeholder whatsapp on "Phenol" row (cleanup SQL in backlog).
- Admin "All Accounts" table bug (fixed 7b16dfb): roster sync mutates a module-level store; the accounts memo needed a `rosterVersion` bump to recompute immediately.

## 5. KEY FILES MAP

| File | Role |
|---|---|
| `supabase/migrations/000…021_*.sql` | applied migrations (next: 022) |
| `supabase/verify/check_database_state.sql` | master checklist (run after EVERY migration) |
| `supabase/verify/020_role_matrix_test.sql`, `021_financial_foundation_test.sql` | per-migration tests |
| `docs/GOVERNANCE_AUDIT.md` | governance Phase-0 audit + implementation records (§12 = 020, §13 = 021) |
| `docs/EXPANSION_TECHNICAL_AUDIT.md` | expansion Phase-0 audit (dashboards/AI/whiteboard/live) |
| `docs/PLATFORM_GUIDE.md`, `docs/PROJECT_HISTORY.md`, `GEMINI.md` | LOCAL-ONLY docs (never push) |
| `src/components/dashboard/admin/SuperAdministrationView.tsx` | super-admin cockpit (extension target) |
| `src/lib/data/instructors.ts` | sync pattern (single-flight + TTL — reference for new data modules) |
| `src/lib/enrollment-storage.ts` | roster/aggregation store (source of the accounts table) |
| `src/app/dashboard/page.tsx` | role-aware dashboard + `handleToggleUserRole` (~709) |
| `src/lib/student-code.ts` | YouTube/Vimeo embeds (recording-upload flow already works) |

## 6. RESUME CHECKLIST (new session)

1. Read this file + `docs/PROJECT_HISTORY.md` tail + `docs/GOVERNANCE_AUDIT.md` latest section.
2. `git -C D:\phenol-lms-git log --oneline -5` + `git status --short` (expect clean; docs commit local-only).
3. Confirm live marker: owner runs `check_database_state.sql` (expect "OK (through 021)").
4. Next task: **022 audit_logs** — await owner approval, then follow the migration pattern (§3).
5. Communication: Egyptian Arabic. Push only on explicit approval. STOP after each migration.
