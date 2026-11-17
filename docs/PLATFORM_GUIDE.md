# PHENOL ACADEMY LMS — Platform Guide

**A complete, detailed description of what the platform is, how it is built, and how it works.**

| | |
|---|---|
| Product | Phenol Academy — a multi-teacher chemistry-education platform |
| Owner / Director | Dr. Omar Magdi (`phenolvii@gmail.com`) — `super_admin` |
| Stack | Next.js 14 (App Router) + Supabase (PostgreSQL, Auth, Storage, RLS) + Tailwind CSS |
| Hosting | Vercel (auto-deploys on every push to `main`) |
| Database | Supabase project `phenol-db` (phenolvii-code org, FREE tier) |
| Engineering rules | `GEMINI.md` — rules 1–14 + permanent errors log |
| Work history | `docs/PROJECT_HISTORY.md` (phases 1–11) |

---

## 1. What the platform is

Phenol Academy started as a single-teacher website (a catalogue + static content) and was
rebuilt into a **real multi-teacher LMS**:

- **Students** register, request enrollment in courses, watch lessons, take timed
  database-graded quizzes, submit assignments to a grading desk, download paid booklets,
  and browse a real faculty directory.
- **Instructors** apply for a teaching chair (application → director approval), then
  manage **only their own** courses, students, waitlist, quizzes and grading.
- **The director** (`super_admin`) sees and controls everything: approvals, enrollments,
  role changes, password resets, applications, and the platform catalogue.

The single most important design decision, enforced everywhere:

> **The database is the only source of truth. localStorage is a cache. Zero mock data in
> production paths. The client never grades itself and never writes scores.**

---

## 2. Architecture at a glance

```
┌────────────────────────────── Browser (Next.js 14) ─────────────────────────────┐
│  Public site (marketing, faculty, tracks)  ·  Course pages  ·  Dashboard        │
│  Auth (login/register/reset)               ·  Exam room  ·  Booklets           │
└──────────────┬─────────────────────────────────────────────────┬───────────────┘
               │ Supabase JS client (anon key + user session)     │
┌──────────────▼─────────────────────────────────────────────────▼───────────────┐
│                        Supabase (PostgreSQL + Auth + Storage)                   │
│  RLS on EVERY table          Security-definer RPCs        Private buckets      │
│  (users can only touch       (enrollment checks, quiz     (booklets: signed     │
│   their own rows)             grading in the database)     5-min URLs)          │
└─────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
        Vercel production (auto-deploy from GitHub `main`)
        + GitHub Action "supabase-keepalive" (pings DB every 2 days so the
          FREE-tier project is never paused for inactivity)
```

**Key principle:** access control lives in the **database** (RLS + RPCs), not in
React code. The frontend renders what the database permits; it never *decides* who
may see or change what.

---

## 3. Roles & hierarchy

| Role | Lives in | Capabilities |
|---|---|---|
| `student` | `profiles.role` + `registered_students.role` | Register, request enrollment (per course), lessons, quizzes (graded by DB), submissions, booklets for enrolled courses, notifications, referral points |
| `instructor` | both role stores | Everything above + their own courses/lessons/quizzes/waitlist/grading desk + faculty directory profile row |
| `super_admin` | `phenolvii@gmail.com` only (checked by `is_super_admin()`) | Everything: approve/reject courses, decide instructor applications, enroll students, reset passwords, manage all booklets, publish/unpublish directory profiles |

Two role stores exist (`profiles` and `registered_students`) — **every role change
updates BOTH** (platform rule, enforced by the application flows and migration 009's
`decide_instructor_request`).

---

## 4. Security model (how the database defends itself)

1. **RLS everywhere.** Every table has Row Level Security enabled. Legacy wide-grant
   policies ("admin all") were fully retired in migration 014 — verified with a
   whole-schema `pg_policies` audit (GEMINI.md rule 12).
2. **`is_admin()` is dead as a trust anchor.** The legacy helper returns TRUE for ANY
   instructor, so migration 018 retired every remaining `is_admin()`-based policy and
   re-gated the dangerous RPCs to `is_super_admin()` or the specific course owner:
   `admin_set_student_password`, `admin_enroll_student`, `set_enrollment_status`,
   `notify_course_students`, `get_lesson_media`, `get_quiz_questions`, notifications,
   quiz results, reviews, the lecture-notes bucket and courses insert. A standing
   audit in `check_database_state.sql` fails if any policy ever trusts `is_admin()`
   again (0 rows = OK).
3. **Answer keys never reach the browser.** `quizzes.questions` (which contains the
   correct options) is readable by **no client role** — only the security-definer RPCs
   read it. `information_schema.column_privileges` is audited for this in
   `supabase/verify/check_database_state.sql`.
4. **Grading is server-side.** `submit_quiz_attempt` receives only the student's
   choices; the score, pass/fail decision and per-question feedback are computed inside
   the database and stored in `quiz_submissions`.
5. **Enrollment re-verified server-side.** Paid material (booklets, question banks) and
   quiz access are gated by `has_active_enrollment()` — a security-definer function —
   so a patched frontend gains nothing.
6. **Private storage.** The `booklets` bucket is private; downloads go through
   short-lived (5-minute) signed URLs whose policy calls `can_download_booklet()`
   (owner / super_admin / actively enrolled student only).
7. **Reviews carry no identities.** The old public `USING(true)` read on
   `instructor_reviews` (which leaked reviewer emails to anonymous visitors) was
   removed in 018. Public display goes through the PII-free RPCs `get_review_stats()`
   and `get_instructor_reviews()` — no reviewer emails or academic codes ever reach
   any browser. Inserts stay gated by real ACTIVE enrollment.
8. **Signup is database-driven and merges walk-ins.** `handle_new_auth_user` creates
   the profile row and academic code (client-sent role metadata is ignored, rule 6/7),
   and since 018 it **merges office walk-in roster rows into the real account** when a
   student signs up with the same email — fixing the old "student profile not found"
   dead-end. Instructor status is granted ONLY by `decide_instructor_request()`
   (super_admin-only RPC).
9. **Immutability triggers.** `trg_courses_immutability` / `trg_protect_course_fields`
   stop instructors from self-approving or hijacking course ownership;
   `trg_protect_profiles_role` guards role escalation.
10. **No embedded metadata.** Free-text fields carry prose only (migration 012 killed the
    `<!--PHENOL_META:...-->` hack).
11. **Destructive actions are RPC-gated.** `admin_delete_student_account` (018,
    super_admin-only) replaced the client-side direct table deletes — deleting a
    student account is a server operation now.

---

## 5. Database — 21 tables, grouped by domain

**Identity & access**
| Table | Purpose |
|---|---|
| `profiles` | `id` (= auth.users id), `role` — the authoritative role store |
| `registered_students` | student roster: name, email, phone, academic_code, academic_track, role |
| `user_sessions` | session tracking (login/device audit) |
| `media_access_log` | audit trail of lesson-media access |

**Courses & content**
| Table | Purpose |
|---|---|
| `courses` | catalogue + ownership columns (`owner_id`, `instructor_*`, approval status) |
| `lessons` | lessons inside a course |
| `lesson_assets` | per-lesson media (video URLs, PDFs) — read via `get_lesson_media` |
| `lesson_progress` | per-student per-lesson progress |
| `lesson_comments` | Q&A/comments under lessons |

**Admissions**
| Table | Purpose |
|---|---|
| `course_enrollments` | per student × course: PENDING / ACTIVE / REJECTED |
| `waitlist_applications` | applications incl. office walk-ins (`office_register_student`) |
| `instructor_requests` | faculty applications → `decide_instructor_request` |

**Assessment**
| Table | Purpose |
|---|---|
| `quizzes` | quiz metadata; `questions` column (with the key) client-invisible |
| `quiz_submissions` | attempts: choices, score, percentage, passed, per-question review |
| `student_submissions` | assignment desk: file/text submissions, grade + `dr_feedback` |
| `question_bank_items` | practice MCQs per course (017); RLS = paid material |

**Paid content & directory**
| Table | Purpose |
|---|---|
| `booklets` | paid dossier metadata → private bucket objects |
| `instructor_profiles` | public faculty directory rows (`is_published`) (016) |
| `instructor_reviews` | student reviews of instructors (real enrollments only) |
| `student_notifications` | in-platform notification feed |
| `referrals` | share-and-earn referral graph (referrer → referred, unique) |

**Key server functions** (all security-definer where they touch other users' rows):
`is_super_admin`, `is_instructor`, `owns_course`, `has_active_enrollment`,
`handle_new_auth_user`, `generate_academic_code`, `request_enrollment`,
`set_enrollment_status`, `admin_enroll_student`, `admin_set_student_password`,
`set_course_approval`, `office_register_student`, `submit_instructor_request`,
`decide_instructor_request`, `get_lesson_media`, `get_course_quiz_metadata`,
`get_quiz_questions`, `submit_quiz_attempt`, `list_instructor_quizzes`,
`get_quiz_for_editing`, `save_quiz`, `delete_quiz`, `can_download_booklet`,
`register_session`, `check_session`, `notify_course_students`,
`handle_new_lesson_notification`, `get_review_stats`, `get_instructor_reviews`,
`admin_delete_student_account`, plus the protection triggers
(`trg_protect_course_fields`, `trg_protect_profiles_role`).

---

## 6. The product surfaces

### Visual tour (live production screenshots — `docs/screenshots/`)

| | |
|---|---|
| ![Home — hero & academic tracks](screenshots/01-home-hero.jpeg) |
| **Home (`/`)** — hero, slogan "To Understand Is To Master", and the four academic tracks. The track cards ARE the course catalogue entry point: `/courses` intentionally redirects to `/#tracks`. |
| ![Faculty directory](screenshots/02-faculty-directory.jpeg) |
| **Faculty directory (`/faculty`)** — built entirely from `instructor_profiles` (published rows only), with ratings from the PII-free `get_review_stats` RPC. |
| ![Instructor profile](screenshots/03-faculty-instructor-profile.jpeg) |
| **Instructor profile (`/faculty/[id]`)** — directory row detail: title, discipline scope, reviews (fetched PII-free), and owned-courses count. |
| ![Track page](screenshots/04-track-page.jpeg) |
| **Track page (`/tracks/[slug]`)** — the four tracks with Arabic subtitles read from real data; lists the courses inside the track. |
| ![Course page](screenshots/05-course-page.jpeg) |
| **Course page (`/courses/[id]`)** — header with supervision line, enrollment-state-driven action ("Request Course Activation Now"), Share & Earn, and the three tabs: Course Lectures · Timed Quizzes · Question Bank. |
| ![Register](screenshots/06-register.jpeg) |
| **Register (`/register`)** — Google sign-up or the application form; the DB trigger creates profile + academic code (and merges walk-in roster rows, migration 018). |
| ![Login](screenshots/07-login.jpeg) |
| **Login (`/login`)** — credentials or Google; sessions recorded in `user_sessions`. |

*Dashboard screenshots (student / instructor / super-admin views) require an
authenticated session and are not included yet.*

### Public site (no auth needed)
- **Home / Academy / Method / Philosophy / Matrix / Problem-Solving / About / Terms / Privacy** — the academic marketing content.
- **Tracks** (`/tracks/[slug]`) — the four academic tracks with Arabic subtitles read from real data.
- **Faculty** (`/faculty`, `/faculty/[id]`) — directory built from `instructor_profiles`
  (published rows, DB-driven) with course ownership counts; instructor detail pages.
- **Courses** (`/courses`) — the catalogue of approved courses.

### Auth
- **Register** — creates an auth user; the DB trigger creates the profile + academic
  code. Includes the "join as instructor" application flow (`submit_instructor_request`).
- **Login / Reset password** — session recorded in `user_sessions`.

### Course page (`/courses/[id]`)
- Three tabs: **Course Lectures** · **Timed Quizzes** · **Question Bank**.
- Enrollment states drive the header: ACTIVE → "Begin Syllabus"; PENDING → "awaiting
  review"; otherwise → "Request Course Activation".
- Question Bank is DB content gated by RLS — non-enrolled visitors simply see an empty
  bank (never another course's content — the old hardcoded fallback is gone, 017).
- Share & Earn (referral) modal. Rewards ladder: 50 pts = Bronze Ambassador badge,
  100 pts = 50% tuition coupon on one course, **200 pts (top) = 50% tuition coupon on
  two courses** — platform referrals redeem on any two Academy courses, course-link
  referrals redeem on two courses from that instructor. Redemption is currently manual
  (through the director); a DB-backed coupon system is in the backlog.

### Lesson room (`/courses/[id]/lessons/[lessonId]`)
- Video + PDF assets via `get_lesson_media` (logged to `media_access_log`), progress
  tracking, lesson comments/Q&A, notifications to enrolled students on new lessons.

### Exam room (`/courses/[id]/quizzes/[quizId]`)
- Questions fetched one-by-one via `get_quiz_questions` (no answer key in the payload),
  timed per `duration_minutes`, submitted to `submit_quiz_attempt` → server-side score,
  pass/fail, and per-question explanations on the review screen.

### Dashboard (`/dashboard`) — role-aware
- **Student:** my courses, my quiz results (DB review data), submissions desk, tasks,
  notifications, booklets (signed-URL downloads), real evaluation-quizzes tab (016-era
  task "هـ").
- **Instructor:** my courses (ownership-scoped), my students (via enrollments),
  waitlist for my courses, grading desk (grade + feedback → DB), quiz authoring
  (create/edit/delete via ownership-scoped RPCs), directory profile row.
- **Super admin (Dr. Omar):** everything + applications tab (approve faculty →
  auto-creates directory row), enroll students, set passwords, approve/reject courses,
  manage all booklets, publish/unpublish instructors.

### Booklets (`/booklets` UI in dashboard)
- Paid dossiers; covers/metadata from the `booklets` table, files from the private
  bucket via 5-minute signed URLs; download eligibility re-checked server-side.

---

## 7. Frontend structure

```
src/
├── app/                    # App Router pages
│   ├── (public)  about · academy · faculty/[id] · matrix · method · philosophy
│   │             problem-solving · privacy · terms · tracks/[slug]
│   ├── auth      login · register · reset-password
│   ├── courses/  [id] · [id]/lessons/[lessonId] · [id]/quizzes/[quizId]
│   ├── dashboard/          # role-aware single page + tabs
│   └── ... (home)
├── components/
│   ├── academy · home · layout · brand · ui     # public site & design system
│   ├── courses (share modal, question-bank view, …)
│   ├── dashboard/admin (super admin panels, modals)
│   ├── dashboard/student (quizzes tab, booklets, notifications…)
│   ├── auth · profile · notifications · booklets · video
├── lib/
│   ├── auth/useCurrentUser.ts · session-tracker.ts
│   ├── data/   # THE DB ACCESS LAYER: courses · enrollments · quizzes ·
│   │           # instructors · students · comments · progress · reviews ·
│   │           # notifications · referrals  (all real Supabase calls)
│   └── supabase/  # client factory + env wiring
├── data/      # deprecated mock arrays being retired one by one
└── types/lms.ts   # shared domain types
```

Naming conventions: design tokens like `burgundy-*`, `ivory-*`, `charcoal-*`,
`hairline`; fonts `font-display` / `font-formula` / `font-sans`. UI is **English-only**;
Arabic appears in content data (track subtitles, question text).

**localStorage policy:** `phenol_*` keys are caches (last sync of instructors, courses,
avatars). Every load re-syncs from the database; the cache is never trusted over a live
read.

---

## 8. Migration ledger (000 → 018, all applied to production)

| # | File | What it did |
|---|---|---|
| 000 | master_setup | core schema: profiles, roster, referrals, lessons assets, progress, comments, sessions, media log + RLS baseline |
| 001 | security | hardening: session checks, own-row policies, trigger protection |
| 002 | admin_enroll | office enrollment RPCs (admin_enroll_student, set passwords) |
| 003 | drop_unused | removed unused objects |
| 004 | admin_reset_password | super-admin password resets |
| 005 | notifications | student_notifications + lesson-announcement trigger |
| 006 | quizzes | quiz base schema (⚠ was never applied in production — 010 recreated it; documented in GEMINI.md rule 9) |
| 007 | multi_teacher | instructor columns on courses, ownership functions (fixed by 007_fixed) |
| 008 | fix_instructor_registration_trigger | signup trigger corrected |
| 009 | instructor_requests | faculty application flow + `decide_instructor_request` |
| 010 | quiz_security | real quiz schema + RPCs; `quizzes.questions` made client-invisible |
| 011 | quiz_authoring | ownership-scoped authoring RPCs (list/edit/save/delete) |
| 012 | phenol_meta_cleanup | killed `<!--PHENOL_META-->` metadata-in-description hack |
| 013 | rls_isolation | submissions + waitlist: ownership-scoped RLS, `course_id` FKs, walk-in flow |
| 014 | retire_admin_all | "admin all" retired on 11 tables; `office_register_student` RPC |
| 015 | booklets_private | private `booklets` bucket + table + RLS + `can_download_booklet` |
| 016 | instructor_profiles | real faculty directory table + dual-store backfill + auto-directory on approval |
| 017 | question_banks | `question_bank_items` with paid-material RLS; mock bundle retired |
| 018 | instructor_isolation_final | every remaining `is_admin()` trust retired (RPCs re-gated to super_admin/course owner, notifications + quiz results re-scoped, reviews made PII-free via RPCs, lecture-notes bucket ownership-based, courses insert owner-only); signup trigger MERGES walk-in roster rows into real accounts + one-time legacy `stu-%` merge; `admin_delete_student_account` RPC; lesson-notification Arabic mojibake fixed |

---

## 9. Operations

- **Deploy:** push to GitHub `main` → Vercel auto-deploys. Pushes happen ONLY on
  explicit user approval (one approval per push).
- **Migrations:** the assistant writes SQL; the user takes a full backup, pastes the
  FULL file into the Supabase SQL Editor, runs it, and verifies (rule 8/9). The
  assistant never assumes a migration ran.
- **Verification:** `supabase/verify/check_database_state.sql` — one-glance checklist
  covering tables, functions, triggers, exact policy names, storage policies, the
  answer-key column lock, the "admin all" absence, the standing **no-`is_admin()`-in-
  any-policy** audit (0 rows = OK), the private booklets bucket, and an audit marker
  through 018.
- **Keepalive:** GitHub Action `supabase-keepalive` (workflow file added via GitHub UI)
  pings the public `instructor_profiles` endpoint every 2 days using repo secrets
  `SUPABASE_URL` + `SUPABASE_ANON_KEY` (publishable key) — prevents FREE-tier pause.
- **Local snapshots:** `D:\phenol-lms.zip` = full repo incl. `.git` + docs
  (excludes `node_modules`/`.next`), refreshed on request. `PROJECT_HISTORY.md` is
  committed locally but never pushed.

---

## 10. Engineering rules (the constitution — `GEMINI.md`)

1. Database-first: every change persists to Supabase immediately.
2. Multi-teacher isolation; only Dr. Omar is super_admin.
3. Errors log (rules 1–14): no mock arrays, no orphan role updates, no self-approval,
   zero fake reviews, course scoping, DB-driven signup, full-file migrations, verify
   before assuming, no metadata in free text, no duplicate policies, whole-schema
   audits, no PowerShell-pipeline edits (mojibake), never build+dev simultaneously.

---

## 11. Current state & known backlog

**State:** migrations 000→018 applied; faculty directory live with 4 published
instructors; booklets gated (course_id NULL = super_admin-only until their course
launches); question banks DB-driven (seed optional); keepalive running; the live
`pg_policies` audit shows **0 policies trusting `is_admin()`**. Student-facing copy
is Academy-wide (welcome banner, register note, course share message, referral
rewards — the single-teacher chemistry-era phrasing was retired).

**Backlog:**
1. Seed the 13 preserved practice questions to a real course
   (`supabase/optional/seed_question_bank.sql`, replace `<<COURSE_ID>>`).
2. Link booklets to their course when it launches (set `course_id`).
3. Instructor-facing UI for editing their directory profile row (RLS already allows it).
4. Instructor-facing UI for authoring question-bank items (table + RLS already ready).
5. DB-backed referral coupon system (rewards are display-copy today; redemption is
   manual through the director).
6. Dead-code/hygiene cleanup: leftover `phenol_user_role_*` / `phenol_registered_students`
   localStorage reads and the remaining `select('*')` calls (hygiene, not security).
