# PHASE 0 — Safety Net & Pre-Migration Checklist
**Project:** PHENOL LMS  
**Owner:** Dr. Omar Magdi (`phenolvii@gmail.com`)  
**Status:** Pre-flight Safety Checks (No Production Code Changes)

---

## 1. Database Full Backup (نسخة احتياطية لقاعدة البيانات)
Before applying any migrations or security hardening, ensure all live data (registered students, enrollments, courses, lessons) is safely backed up.

### Option A: Using `pg_dump` (Recommended if PostgreSQL client is installed)
1. Go to your Supabase Dashboard: **Project Settings** → **Database** → **Connection string** (URI).
2. Copy the URI (select **Direct connection** or **Session pooler**, port 5432 or 6543).
3. Run the following command in PowerShell:
   ```powershell
   pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.krzzaqhzlmfbjcjtkpax.supabase.co:5432/postgres" -F c -b -v -f "D:\phenol_db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"
   ```

### Option B: Exporting Tables directly from Supabase Dashboard
1. Open [Supabase Dashboard - Table Editor](https://supabase.com/dashboard/project/krzzaqhzlmfbjcjtkpax/editor).
2. For each table (`registered_students`, `course_enrollments`, `courses`, `lessons`, `waitlist_applications`, `student_submissions`):
   - Click on the table name.
   - Click **Export Data** → **Download CSV**.
   - Save these CSV files into a folder (e.g. `D:\phenol_db_tables_backup\`).

---

## 2. Export Admin Browser LocalStorage (تصدير بيانات المتصفح)
Because previous versions of the platform stored certain draft data or progress in `localStorage`, export it to prevent any loss:

1. Open your browser where you used the admin dashboard (`https://phenol-lms.vercel.app`).
2. Press **F12** (Developer Tools) → go to the **Application** tab (or **Storage** in Firefox).
3. In the left sidebar, expand **Local Storage** → click `https://phenol-lms.vercel.app`.
4. Check for any keys starting with `phenol_`:
   - `phenol_auth_user`
   - `phenol_custom_courses`
   - `phenol_custom_lessons`
   - `phenol_completed_lessons`
   - `phenol_user_referral_stats_*`
5. Right-click or copy their values into a safe text file (e.g., `D:\phenol_localstorage_backup.txt`).

---

## 3. Screenshot Deployed RLS Policies (توثيق سياسات الحماية الحالية)
1. In Supabase Dashboard, go to **Authentication** → **Policies** (or **Database** → **Policies**).
2. Take a quick screenshot of the active policies for all tables and save it.

---

## 4. Maintenance Window (فترة الصيانة)
- Schedule a brief 15–30 minute window where active students are advised that the platform is undergoing a scheduled security upgrade.
