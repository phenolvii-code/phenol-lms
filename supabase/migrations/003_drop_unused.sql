-- ==============================================================================
-- PHENOL ACADEMY LMS - Migration 003: Drop Unused Artifacts
-- Target: Drop dead timeline schema and obsolete prototype tables.
-- Execution: Run in Supabase SQL Editor AFTER verified database backup.
-- ==============================================================================

-- 1. Drop unused Timeline tables and constraints
DROP TABLE IF EXISTS public.timeline_comments CASCADE;
DROP TABLE IF EXISTS public.timeline_posts CASCADE;

-- 2. Drop obsolete prototype RPCs or helper functions if present
DROP FUNCTION IF EXISTS public.get_timeline_feed CASCADE;

-- 3. Audit comment
COMMENT ON SCHEMA public IS 'PHENOL LMS Schema - Migrations 001_security, 002_admin_enroll, 003_drop_unused applied';
