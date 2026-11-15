# PHENOL ACADEMY - WORKSPACE ENGINEERING & DATABASE RULES

## 1. Absolute Database-First Rule (NO UI-Only Modifications)
- **EVERY SINGLE MODIFICATION** (role changes, course approvals, rejections, student enrollments, course creations, deletions, profile updates, avatar changes, instructor reviews) **MUST IMMEDIATELY PERSIST TO SUPABASE POSTGRESQL**.
- **NEVER** implement or leave any state change as a client-only or `localStorage`-only simulation.
- `localStorage` is strictly an offline cache or transient optimistic UI aid; it is **NEVER** the source of truth.
- Every action must execute real Supabase SQL mutations (`.insert()`, `.update()`, `.delete()`, `.rpc()`) with real error handling.

## 2. Multi-Teacher Isolation & Platform Hierarchy
- **Dr. Omar Magdi (`phenolvii@gmail.com`)** is the sole platform director and **`super_admin`**.
- Instructors **ONLY** manage and see their own courses, their own waitlists, and students enrolled in their courses.
- Course deletions, password resets, and course approvals/rejections are restricted exclusively to `super_admin`.
- In database queries, remember the schema design:
  - `profiles` table stores: `id (uuid)`, `role (text)`, `created_at`. It does NOT have `email` or `name` columns.
  - `registered_students` table stores: `id`, `name`, `email`, `phone`, `academic_code`, `academic_track`, `role`.
  - When updating roles, update BOTH `profiles` (by `id`) AND `registered_students` (by `email`/`id`).

## 3. Persistent Errors Fixed & Never To Be Repeated
1. **Never use static mock arrays** (like `FACULTY_MEMBERS`) to render platform dashboards or rosters. Always dynamically aggregate real users and instructors from the database.
2. **Never leave orphan role updates**: When switching user roles between student and instructor, update both `profiles` and `registered_students` tables in Supabase and trigger live UI event dispatchers.
3. **Never allow instructors to self-approve courses or hijack course ownership**: Database triggers (`trg_courses_immutability`) and Supabase RPCs (`set_course_approval`) must enforce that only `super_admin` can approve/reject courses.
4. **Zero Fake Reviews**: Production databases and UI must contain zero fake seed testimonials. Only real enrolled students can submit evaluations.
5. **Course Scoping**: Every instructor dashboard query must filter by `c.instructor_email` or `c.owner_id`.
6. **Never trust signup metadata for roles** (fixed 2026-11-15, Migration 009): any new auth account is created as `student` — always. Instructor status is granted ONLY via `decide_instructor_request()` by the super_admin. Client-sent `role`/`account_type` in signup metadata must be ignored forever.
7. **Never write profile/enrollment rows from the client** (fixed 2026-11-15): the register page must NOT upsert `profiles`/`registered_students` or generate academic codes client-side — the DB trigger (`handle_new_auth_user`) is the single source.
8. **Never paste partial SQL migrations into Supabase** (incident 2026-11-15): always paste the FULL migration file and verify the first line is the migration header before running.
9. **Never assume a migration was applied — verify against the live DB first** (incident 2026-11-15): migration 006 had never been run in production; the entire quiz feature was silently running on client-side mock data and quiz attempts never persisted. Before writing or running any migration that depends on tables/functions, verify they exist (`information_schema.tables` / `pg_proc`) on THAT project, and prefer migrations that create-or-verify their own prerequisites.
