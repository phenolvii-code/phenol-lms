-- ============================================================================
-- PHENOL Academic Platform — Supabase Production Schema
-- Designed for Dr. Omar Magdi
-- 4 Core Tracks: Thanaweya Arabic, Thanaweya Languages, IGCSE & STEM, University
-- ============================================================================

-- 1. WAITLIST & ADMISSION APPLICATIONS
CREATE TABLE IF NOT EXISTS public.waitlist_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    academic_track TEXT NOT NULL,
    target_course TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'contacted', 'declined')),
    notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.waitlist_applications ENABLE ROW LEVEL SECURITY;

-- Allow public admission form submissions
CREATE POLICY "Allow public insert to waitlist_applications"
ON public.waitlist_applications
FOR INSERT
WITH CHECK (true);

-- Allow authenticated reads / admin reads
CREATE POLICY "Allow authenticated read waitlist_applications"
ON public.waitlist_applications
FOR SELECT
USING (true);

-- Allow authenticated updates
CREATE POLICY "Allow authenticated update waitlist_applications"
ON public.waitlist_applications
FOR UPDATE
USING (true);


-- 2. ACADEMIC COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    sub_title TEXT,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('thanaweya-arabic', 'thanaweya-languages', 'igcse-stem', 'university')),
    category_name TEXT NOT NULL,
    level TEXT NOT NULL,
    molecular_formula TEXT,
    thumbnail TEXT,
    total_hours TEXT,
    color_accent TEXT DEFAULT '#641C32',
    accent_bg TEXT DEFAULT 'bg-burgundy-950',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write courses" ON public.courses FOR ALL USING (true);


-- 3. LESSON MODULES TABLE
CREATE TABLE IF NOT EXISTS public.lessons (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration TEXT NOT NULL,
    type TEXT DEFAULT 'video' CHECK (type IN ('video', 'lab', 'pdf')),
    summary TEXT,
    key_formulas TEXT[],
    video_url TEXT,
    pdf_notes_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write lessons" ON public.lessons FOR ALL USING (true);


-- 4. STUDENT PROBLEM SET SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    student_code TEXT NOT NULL,
    task_title TEXT NOT NULL,
    solution_notes TEXT NOT NULL,
    grade NUMERIC,
    max_grade NUMERIC DEFAULT 20,
    dr_feedback TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert student_submissions" ON public.student_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read student_submissions" ON public.student_submissions FOR SELECT USING (true);
CREATE POLICY "Allow public update student_submissions" ON public.student_submissions FOR UPDATE USING (true);


-- 5. ENROLLED STUDENTS COHORT ROSTER
CREATE TABLE IF NOT EXISTS public.enrolled_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    track_code TEXT NOT NULL,
    progress_percent NUMERIC DEFAULT 0,
    average_grade NUMERIC DEFAULT 100,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'probation', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.enrolled_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read enrolled_students" ON public.enrolled_students FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write enrolled_students" ON public.enrolled_students FOR ALL USING (true);


-- ============================================================================
-- SEED INITIAL COURSES (The 4 Real Tracks)
-- ============================================================================

INSERT INTO public.courses (id, code, title, sub_title, description, category, category_name, level, molecular_formula, thumbnail, total_hours)
VALUES
-- Track 1: Thanaweya Amma (Arabic)
('chem-ar-301', 'CHEM-AR 301', 'الكيمياء العضوية الشاملة للثانوية العامة', 'الهيدروكربونات، مشتقات الهيدروكربونات، واستقرار أيون الفينوكسيد بالرنين', 'منهج الكيمياء العضوية للصف الثالث الثانوي مبني على الفهم الفيزيائي لحركة الإلكترونات وقواعد التسمية بنظام الأيوباك وميكانزمات التفاعل خطوة بخطوة.', 'thanaweya-arabic', 'ثانوية عامة عربي', 'الصف الثالث الثانوي', 'C₆H₅OH / IUPAC', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80', '36 ساعة تدريسية'),
('chem-ar-201', 'CHEM-AR 201', 'الاتزان الكيميائي والكيمياء الكهربية', 'قاعدة لوشاتيليه، ثابت الاتزان Kc و Kp، وحسابات القوة الدافعة الكهربية emf', 'تأصيل رياضي ومفاهيمي دقيق لقوانين الاتزان الكيميائي والأيوني، مع دراسة تفصيلية للخلايا الجلفانية والإلكتروليتية وتطبيقات قوانين فاراداي.', 'thanaweya-arabic', 'ثانوية عامة عربي', 'الصف الثالث الثانوي', 'Kc = [Products] / [Reactants]', 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?w=800&auto=format&fit=crop&q=80', '28 ساعة تدريسية'),

-- Track 2: Thanaweya Amma (Languages)
('chem-lang-301', 'CHEM-LANG 301', 'Organic Chemistry & Reaction Mechanisms (Languages)', 'Hydrocarbons, Functional Derivatives & Phenol Resonance Pathways', 'The official Egyptian National Languages curriculum delivered in English with rigorous focus on electron pushing, IUPAC naming conventions, and phenolic acidity stabilization.', 'thanaweya-languages', 'Thanaweya Amma (Languages)', 'Secondary 3 (Languages)', 'C₆H₅OH', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80', '36 Academic Hours'),
('chem-lang-201', 'CHEM-LANG 201', 'Equilibrium, Reaction Kinetics & Electrochemistry (Languages)', 'Le Chatelier Principle, Ionic Equilibria & Galvanic / Electrolytic Cells', 'Mathematical and conceptual mastery of dynamic equilibria, buffer systems, pH derivations, and electrochemical cell potentials.', 'thanaweya-languages', 'Thanaweya Amma (Languages)', 'Secondary 3 (Languages)', 'ΔG° = -nFE°', 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&auto=format&fit=crop&q=80', '28 Academic Hours'),

-- Track 3: IGCSE & A-Level / STEM
('chem-ig-301', 'CHEM-IG 301', 'Cambridge & Edexcel IGCSE / A-Level Organic Chemistry', 'AS & A2 Syllabus: Reaction Mechanisms, Optical Isomerism & Arenes', 'Targeted preparation for Cambridge (9701) and Edexcel International A-Level Chemistry syllabi, focusing on curved-arrow mechanisms and synthesis pathways.', 'igcse-stem', 'IGCSE & A-Level / STEM', 'Cambridge / Edexcel (AS & A2)', 'C₆H₅OH / R-OH', 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80', '40 Academic Hours'),
('chem-stem-201', 'CHEM-STEM 201', 'STEM Physical Chemistry, Thermodynamics & Kinetics', 'Rate Laws, Arrhenius Activation Energy & Chemical Energetics', 'Advanced course tailored for STEM school scholars and competitive Olympiad candidates seeking first-principles derivations and non-routine problem sets.', 'igcse-stem', 'IGCSE & A-Level / STEM', 'STEM & Advanced A-Level', 'k = A e^(-Ea/RT)', 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?w=800&auto=format&fit=crop&q=80', '30 Academic Hours'),

-- Track 4: University Chemistry
('chem-uni-401', 'CHEM-UNI 401', 'Advanced Organic Mechanisms & Spectroscopy', 'Faculties of Pharmacy & Science: Retrosynthesis, NMR, IR & Reaction Pathways', 'Undergraduate-level analysis of organic synthesis, aromatic substitution mechanisms, pericyclic reactions, and structural elucidation using NMR and IR.', 'university', 'University Chemistry', 'Undergraduate (Pharmacy / Science)', '¹H-NMR / ¹³C-NMR', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80', '32 Lecture Hours'),
('chem-uni-402', 'CHEM-UNI 402', 'Biochemistry, Metabolic Pathways & Enzyme Kinetics', 'Faculties of Medicine & Pharmacy: Bioenergetics & Michaelis-Menten Kinetics', 'Molecular analysis of amino acid stereochemistry, peptide conformation, enzyme active-site catalysis, and competitive versus non-competitive inhibition models.', 'university', 'University Chemistry', 'Undergraduate (Medicine / Pharmacy)', 'V₀ = (Vmax [S]) / (Km + [S])', 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80', '30 Lecture Hours')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    sub_title = EXCLUDED.sub_title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    category_name = EXCLUDED.category_name,
    level = EXCLUDED.level,
    molecular_formula = EXCLUDED.molecular_formula,
    total_hours = EXCLUDED.total_hours;
