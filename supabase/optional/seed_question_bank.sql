-- ==============================================================================
-- PHENOL ACADEMY LMS - OPTIONAL seed: the original hardcoded question bank
-- ==============================================================================
-- The old browser-bundle file (src/data/question-banks.ts) held 13 practice
-- questions (8 Arabic + 5 English) keyed to MOCK course ids ('chem-ar-301',
-- 'chem-en-301') that do NOT exist in the database. Migration 017 created the
-- real `question_bank_items` table but seeds NOTHING — course ids are never
-- guessed.
--
-- HOW TO USE (super_admin only):
--   1. Find the real course id you want to attach the questions to:
--        select id, title, code from public.courses order by created_at;
--   2. Replace BOTH <<COURSE_ID>> placeholders below with that id.
--   3. Run this file in the SQL Editor.
--
-- NOTE: RLS on question_bank_items allows only the course owner,
-- the super_admin, and ACTIVE-enrolled students to read these rows.
-- ==============================================================================

-- Arabic bank (originally keyed to the mock id 'chem-ar-301')
INSERT INTO public.question_bank_items (course_id, number, topic, question, molecular_snippet, options)
VALUES
  ('<<COURSE_ID>>', 1, 'الهيدروكربونات الأليفاتية',
   'ما هي الصيغة الجزيئية للألكان الحلقي المتماثل الذي يحتوي على 6 ذرات كربون في سلسلته المغلقة؟',
   'CnH2n (Cycloalkane)',
   '["C6H14","C6H12","C6H10","C6H6"]'::jsonb),
  ('<<COURSE_ID>>', 2, 'الهيدروكربونات الأليفاتية',
   'عند التقطير الجاف لملح أسيتات الصوديوم اللامائية مع الجير الصودي ينتج غاز:',
   'CH3COONa + NaOH (CaO, Heat) → ?',
   '["غاز الميثان CH4","غاز الإيثان C2H6","غاز الإيثيلين C2H4","غاز الأسيتيلين C2H2"]'::jsonb),
  ('<<COURSE_ID>>', 3, 'مشتقات الهيدروكربونات',
   'أي من الكحولات الآتية يعتبر كحولاً ثالثياً غير قابل للأكسدة بسهولة بالعوامل المؤكسدة المعتادة؟',
   'R3C-OH (Tertiary Alcohol)',
   '["2-ميثيل-2-بروبانول","1-بيوتانول","2-بيوتانول","الميثانول"]'::jsonb),
  ('<<COURSE_ID>>', 4, 'الكيمياء الحلقية والأروماتية',
   'عند تسخين الفينول مع مسحوق الخارصين (Zn) كعامل مختزل يحدث له اختزال وينتج:',
   'C6H5OH + Zn (Heat) → ?',
   '["البنزين العطري C6H6","حمض البكريك","حمض البنزويك","الهكسان الحلقي"]'::jsonb),
  ('<<COURSE_ID>>', 5, 'الهيدروكربونات الأليفاتية',
   'ما هو الناتج الرئيسي عند إضافة بروميد الهيدروجين HBr إلى البروبين وفقاً لقاعدة ماركونيكوف؟',
   'CH3-CH=CH2 + HBr → ?',
   '["2-بروموبروبان","1-بروموبروبان","1,2-ثنائي بروموبروبان","البروبان العادي"]'::jsonb),
  ('<<COURSE_ID>>', 6, 'مشتقات الهيدروكربونات',
   'يتفاعل الفينول مع هيدروكسيد الصوديوم بينما لا يتفاعل الإيثانول معه، والسبب العلمي لذلك هو:',
   'C6H5OH + NaOH vs C2H5OH + NaOH',
   '["حلقة البنزين تسحب إلكترونات رابطة C-O فتزيد قطبية الرابطة O-H ويسهل انفصال البروتون.","الإيثانول يحتوي على روابط هيدروجينية أقوى تعيق تفاعله مع القواعد.","الفينول كحول أليفاتي أحادي الهيدروكسيل ذو كتلة جزيئية أكبر.","حلقة البنزين تمنح إلكترونات لذرة الأكسجين فتضعف حمضيته."]'::jsonb),
  ('<<COURSE_ID>>', 7, 'الكيمياء الحلقية والأروماتية',
   'عدد مولات الهيدروجين اللازمة لهدرجة مول واحد من البنزين العطري هدرجة تامة لتحويله إلى هكسان حلقي يساوي:',
   'C6H6 + n H2 (Ni, P, Heat) → C6H12',
   '["3 مولات من H2","1 مول من H2","6 مولات من H2","2 مول من H2"]'::jsonb),
  ('<<COURSE_ID>>', 8, 'الهيدروكربونات الأليفاتية',
   'عند بلمرة غاز الأسيتيلين بلمرة حلقية ثلاثية في أنبوبة نيكل مسخنة لدرجة الاحمرار يتكون:',
   '3 C2H2 (Hot Ni Tube) → ?',
   '["البنزين العطري C6H6","البولي إيثيلين","التولوين C7H8","النفثالين C10H8"]'::jsonb)
ON CONFLICT (course_id, number) DO NOTHING;

-- English bank (originally keyed to the mock id 'chem-en-301')
INSERT INTO public.question_bank_items (course_id, number, topic, question, molecular_snippet, options)
VALUES
  ('<<COURSE_ID>>', 1, 'Aliphatic Hydrocarbons',
   'What is the molecular formula of a saturated cycloalkane containing 6 carbon atoms?',
   'CnH2n (Cycloalkane)',
   '["C6H14","C6H12","C6H10","C6H6"]'::jsonb),
  ('<<COURSE_ID>>', 2, 'Aliphatic Hydrocarbons',
   'Dry distillation of anhydrous sodium acetate with soda lime yields which gas as the principal product?',
   'CH3COONa + NaOH (CaO, Heat) → ?',
   '["Methane (CH4)","Ethane (C2H6)","Ethylene (C2H4)","Acetylene (C2H2)"]'::jsonb),
  ('<<COURSE_ID>>', 3, 'Functional Groups',
   'Which of the following represents a tertiary alcohol that is resistant to oxidation under standard laboratory conditions?',
   'R3C-OH (Tertiary)',
   '["2-Methylpropan-2-ol","Butan-1-ol","Butan-2-ol","Methanol"]'::jsonb),
  ('<<COURSE_ID>>', 4, 'Aromatic Chemistry',
   'Heating phenol vapor with zinc dust as a reducing agent produces:',
   'C6H5OH + Zn (Heat) → ?',
   '["Benzene (C6H6)","Picric Acid","Benzoic Acid","Cyclohexane"]'::jsonb),
  ('<<COURSE_ID>>', 5, 'Aliphatic Hydrocarbons',
   'According to Markovnikov''s rule, the electrophilic addition of hydrogen bromide (HBr) to propene predominantly yields:',
   'CH3-CH=CH2 + HBr → ?',
   '["2-Bromopropane","1-Bromopropane","1,2-Dibromopropane","n-Propane"]'::jsonb)
ON CONFLICT (course_id, number) DO NOTHING;
