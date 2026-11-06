import { InstructorProfile, ChemistryCourse, ChemistryQuiz, Booklet, StudentSubmission } from '@/types/lms';

export const INSTRUCTOR: InstructorProfile = {
  name: 'Dr. Omar Magdi',
  title: 'د. عمر مجدي',
  bio: 'محاضر وباحث في الكيمياء العضوية والصيدلانية. مكرس لتبسيط أعقد المفاهيم الكيميائية وتحويلها إلى فهم منطقي ممتع بعيداً عن الحفظ التلقائي.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  rating: 4.98,
  studentsCount: 3840,
  coursesCount: 4,
  lecturesCount: 48,
};

export const CHEMISTRY_COURSES: ChemistryCourse[] = [
  {
    id: 'chem-org-01',
    code: 'CHEM 301',
    title: 'الكيمياء العضوية والأروماتية المتقدمة',
    subTitle: 'من ميكانزمات التهجين إلى مشتقات الفينول والبنزين',
    description: 'كورس تفصيلي احترافي يفكك ميكانيكية التفاعلات العضوية، استقرار الرنين في حلقة البنزين، خواص الفينولات المميزة، وتفاعلات الاستبدال الإلكتروفيلي.',
    level: 'متقدم',
    molecularFormula: 'C₆H₅OH',
    thumbnail: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=80',
    totalHours: '24 ساعة تدريبية',
    enrolledStudentsCount: 1420,
    rating: 4.99,
    colorAccent: '#821b32',
    accentBg: 'bg-burgundy-950',
    lessons: [
      {
        id: 'les-org-1',
        title: 'بنية حلقة البنزين وظاهرة الرنين (Resonance Stabilization)',
        duration: '48 دقيقة',
        type: 'video',
        completed: true,
        summary: 'دراسة توزيع سحابة إلكترونات باي في حلقة البنزين وكيف تمنح المركبات الأروماتية استقراراً غير عادي مقارنة بالألكينات.',
        keyFormulas: ['ΔH_hydrogenation = -208 kJ/mol', 'Hückel Rule: (4n + 2) π electrons'],
      },
      {
        id: 'les-org-2',
        title: 'الفينول: الخصائص الحامضية وتأثير مجموعة الهيدروكسيل (-OH)',
        duration: '55 دقيقة',
        type: 'video',
        completed: true,
        summary: 'لماذا يعتبر الفينول أكثر حامضية بملايين المرات من الكحولات العادية؟ تحليل استقرار أيون الفينوكسيد عبر 4 أشكال رنينية.',
        keyFormulas: ['pKa (Phenol) = 9.95 vs pKa (Ethanol) = 15.9', 'C₆H₅OH + NaOH ⇌ C₆H₅O⁻Na⁺ + H₂O'],
      },
      {
        id: 'les-org-3',
        title: 'تفاعلات الاستبدال الأروماتي الإلكتروفيلي (EAS Mechanics)',
        duration: '62 دقيقة',
        type: 'video',
        completed: false,
        summary: 'توجيه المجموعات (Ortho/Para vs Meta) وتطبيقات النترتة والهلجنة وسلفنة الفينول وتكوين حمض البكريك.',
        keyFormulas: ['C₆H₅OH + 3HNO₃ → 2,4,6-(NO₂)₃-C₆H₂-OH + 3H₂O'],
      },
      {
        id: 'les-org-4',
        title: 'المعمل الافتراضي: التمييز النوعي بين الفينول والكحولات',
        duration: '35 دقيقة',
        type: 'lab',
        completed: false,
        summary: 'اختبار كلوريد الحديديك FeCl₃ وظهور المعقد البنفسجي، وتفاعل ماء البروم لترسيب 2,4,6-ثلاثي بروموفينول الأبيض.',
        keyFormulas: ['FeCl₃ + 6 C₆H₅OH → [Fe(OC₆H₅)₆]³⁻ + 3 H⁺ + 3 Cl⁻'],
      },
    ],
  },
  {
    id: 'chem-phys-02',
    code: 'CHEM 202',
    title: 'الكيمياء الفيزيائية والاتزان الديناميكي',
    subTitle: 'قاعدة لوشاتيليه، ثابت الاتزان، وحسابات الطاقة الحرة',
    description: 'تأسيس فلسفي ورياضي دقيق لمفاهيم الاتزان الكيميائي، سرعة التفاعلات، العوامل المؤثرة على موضع الاتزان، وحسابات Kc و Kp مع أفكار المسائل غير التقليدية.',
    level: 'تأسيسي',
    molecularFormula: 'ΔG° = -RT ln K',
    thumbnail: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?w=800&auto=format&fit=crop&q=80',
    totalHours: '18 ساعة تدريبية',
    enrolledStudentsCount: 980,
    rating: 4.95,
    colorAccent: '#63471f',
    accentBg: 'bg-gold-950',
    lessons: [
      {
        id: 'les-phys-1',
        title: 'طبيعة الاتزان الكيميائي الديناميكي وتساوي السرعات',
        duration: '42 دقيقة',
        type: 'video',
        completed: true,
        summary: 'الفرق بين التفاعلات التامة والانعكاسية وتفسير ثبات تركيزات المتفاعلات والنواتج رياضياً.',
      },
      {
        id: 'les-phys-2',
        title: 'قاعدة لوشاتيليه تحت مجهر التطبيق العملي',
        duration: '50 دقيقة',
        type: 'video',
        completed: false,
        summary: 'تأثير تغير الضغط، الحجم، درجة الحرارة، وإضافة العوامل الحفازة على موضع الاتزان وقيمة الثابت.',
      },
    ],
  },
  {
    id: 'chem-bio-03',
    code: 'CHEM 401',
    title: 'الكيمياء الحيوية والإنزيمات والبروتينات',
    subTitle: 'الأسس الكيميائية للحياة والتحفيز الحيوي',
    description: 'دراسة التركيب الجزيئي للأحماض الأمينية والروابط الببتيدية، ديناميكية المواقع النشطة للإنزيمات، وتأثير المثبطات التنافسية وغير التنافسية.',
    level: 'جامعي ومكثف',
    molecularFormula: 'R-CH(NH₂)COOH',
    thumbnail: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
    totalHours: '20 ساعة تدريبية',
    enrolledStudentsCount: 840,
    rating: 4.97,
    colorAccent: '#821b32',
    accentBg: 'bg-burgundy-950',
    lessons: [
      {
        id: 'les-bio-1',
        title: 'كيمياء الأحماض الأمينية ونقاط التعادل الكهربي (pI)',
        duration: '52 دقيقة',
        type: 'video',
        completed: false,
        summary: 'الخصائص الأمفوتيرية للأحماض الأمينية وحساب نقطة تساوي الشحنات الكهربائية.',
      },
    ],
  },
  {
    id: 'chem-sol-04',
    code: 'CHEM 101',
    title: 'كيمياء المحاليل والأحماض والاتزان الأيوني',
    subTitle: 'حسابات الأس الهيدروجيني pH والمحاليل المنظمة Buffer Solutions',
    description: 'شرح مبسط ووافٍ لنظريات أرهينيوس وبرونستد-لوري ولويس، معايرات الأحماض والقواعد، وحسابات التأين للرواسب Ksp.',
    level: 'تأسيسي',
    molecularFormula: 'pH + pOH = 14',
    thumbnail: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&auto=format&fit=crop&q=80',
    totalHours: '16 ساعة تدريبية',
    enrolledStudentsCount: 1650,
    rating: 4.98,
    colorAccent: '#63471f',
    accentBg: 'bg-gold-950',
    lessons: [
      {
        id: 'les-sol-1',
        title: 'الأس الهيدروجيني وحسابات الأحماض والقواعد القوية والضعيفة',
        duration: '45 دقيقة',
        type: 'video',
        completed: true,
        summary: 'قوانين التخفيف لأستفالد وكيفية حل مسائل المعايرة دون أخطاء في الوحدات.',
      },
    ],
  },
];

export const CHEMISTRY_QUIZZES: ChemistryQuiz[] = [
  {
    id: 'quiz-phenol-01',
    courseId: 'chem-org-01',
    courseTitle: 'الكيمياء العضوية والأروماتية المتقدمة',
    title: 'اختبار د. عمر مجدي التقييمي: حامضية وتفاعلات الفينول ومشتقاته',
    badge: 'تحدي المتفوقين',
    durationMinutes: 15,
    questions: [
      {
        id: 'q1',
        question: 'ما هو التفسير العلمي الكيميائي لكون الفينول (C₆H₅OH) أعلى حامضية بكثير من الإيثانول (C₂H₅OH)؟',
        molecularSnippet: 'C₆H₅O⁻ ↔ Resonance Hybrid',
        options: [
          'لأن أيون الفينوكسيد الناتج يتم استقراره بالرنين لتشتت الشحنة السالبة على ذرات كربون حلقة البنزين',
          'لأن الوزن الجزيئي للفينول أعلى بكثير من الإيثانول مما يسهل خروج البروتون',
          'لأن الرابطة بين الكربون والأكسجين في الفينول أطول وأضعف منها في الإيثانول',
          'بسبب وجود روابط هيدروجينية أقوى بين جزيئات الفينول وبعضها'
        ],
        correctIndex: 0,
        scientificExplanation: 'عند فقد الفينول لبروتون (H⁺)، تتشتت الشحنة السالبة على الأكسجين فوق حلقة البنزين عبر 4 تراكيب رنينية متعاقبة، مما يجعل أيون الفينوكسيد مستقراً جداً ويدفع الاتزان نحو التأين، على عكس أيون الإيثوكسيد غير المستقر.'
      },
      {
        id: 'q2',
        question: 'عند إضافة محلول كلوريد الحديد الثلاثي (FeCl₃) إلى عينة مجهولة من الفينول في المعمل، ما الملاحظة المميزة؟',
        molecularSnippet: 'FeCl₃ + Phenol → [Complex] ?',
        options: [
          'يتكون راسب أبيض يذوب في الأحماض المخففة',
          'يظهر لون بنفسجي مميز نتيجة تكوين معقد كيميائي تناسقي من الفينوكسيد والحديد',
          'يتصاعد غاز الهيدروجين الذي يشتعل بفرقعة',
          'لا يحدث أي تغير لوني لأن الفينول خامل تجاه أملاح الحديد'
        ],
        correctIndex: 1,
        scientificExplanation: 'يعتبر اختبار كلوريد الحديديك FeCl₃ اختباراً نوعياً كلاسيكياً للفينولات؛ إذ يتكون معقد تناسقي بنفسجي غامق [Fe(OC₆H₅)₆]³⁻، بينما لا تعطي الكحولات الأليفاتية هذا التفاعل.'
      },
      {
        id: 'q3',
        question: 'أي من البدائل التالية يمثل الناتج الرئيسي لتفاعل نترتة الفينول باستخدام حمض نيتريك مركز في وجود حمض كبريتيك مركز ساخن؟',
        molecularSnippet: 'C₆H₅OH + conc. HNO₃ / H₂SO₄ → ?',
        options: [
          '2,4,6-ثلاثي نيتروفينول (المعروف تجارياً بحمض البكريك)',
          'ميتا-نيتروفينول فقط',
          'بنزوات الصوديوم وبخار ماء',
          'نيتروبنزين بدون مجموعة هيدروكسيل'
        ],
        correctIndex: 0,
        scientificExplanation: 'مجموعة الهيدروكسيل (-OH) هي مجموعة منشطة بقوة وموجهة للموضعين أورثو وبارا. بالحمض المركز والحرارة، تدخل 3 مجموعات نيترو لتكوين 2,4,6-Trinitrophenol (حمض البكريك المستخدم في الحروق والمتفجرات).'
      }
    ]
  }
];

export const BOOKLETS: Booklet[] = [
  {
    id: 'book-1',
    title: 'أطلس الميكانزمات العضوية الشامل - د. عمر مجدي',
    courseName: 'الكيمياء العضوية',
    pages: 72,
    size: '14.2 MB',
    downloads: 2840,
    description: 'دليل بخط اليد ورسومات دقيقة بالألوان لجميع ميكانزمات تفاعلات البنزين، الفينول، الكحولات، والإيثرات.',
  },
  {
    id: 'book-2',
    title: 'مذكرة الاتزان الكيميائي ومسائل التفوق والقدرات العليا',
    courseName: 'الكيمياء الفيزيائية',
    pages: 54,
    size: '9.8 MB',
    downloads: 1950,
    description: 'تجميعة لـ 150 مسألة نموذجية مع خطوات الحل النموذجية والرسوم البيانية وتطبيقات لوشاتيليه.',
  },
  {
    id: 'book-3',
    title: 'كتيب الكيمياء التحليلية والمعايرة وتجارب المعمل',
    courseName: 'كيمياء المحاليل',
    pages: 40,
    size: '6.5 MB',
    downloads: 1680,
    description: 'شرح لألوان الأدلة والكواشف وحسابات الـ pH والمحاليل المنظمة بأسلوب مصفوفات ومخططات تدفق.',
  },
];

export const SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub-01',
    studentName: 'يوسف أحمد عبد المنعم',
    studentCode: 'PHN-2026-904',
    taskTitle: 'رسم الأشكال الرنينية لأيون الفينوكسيد واستنتاج موضع الهجوم الإلكتروفيلي',
    submittedAt: 'اليوم، 14:20',
    solutionNotes: 'قمت برسم التراكيب الأربعة وتوضيح تركز الكثافة الإلكترونية على ذرتي الأورثو وذرة البارا، ومرفق ملف الرسم التوضيحي بدقة عالية.',
    grade: 20,
    maxGrade: 20,
    drFeedback: 'رسم استثنائي يا يوسف! استيعابك لتشتت الشحنة والروابط المزدوجة رائع جداً، استمر.',
    status: 'graded',
  },
  {
    id: 'sub-02',
    studentName: 'سلمى خالد النميري',
    studentCode: 'PHN-2026-812',
    taskTitle: 'حساب ثابت حاصل الإذابة Ksp لمحلول هيدروكسيد المغنسيوم',
    submittedAt: 'أمس، 21:05',
    solutionNotes: 'تم تطبيق معادلة التفكك وحساب تركيز أيونات الهيدروكسيل عند درجة حرارة الغرفة مع الأخذ في الاعتبار الأيون المشترك.',
    maxGrade: 20,
    status: 'pending',
  },
  {
    id: 'sub-03',
    studentName: 'محمد طارق الباز',
    studentCode: 'PHN-2026-745',
    taskTitle: 'تفسير انحراف تفاعل هابر-بوش نحو النواتج مع تغير الضغط والحرارة',
    submittedAt: 'أمس، 18:30',
    solutionNotes: 'شرحت أثر نقصان عدد المولات الغازية وسبب تفضيل درجات الحرارة المعتدلة مع الضغط العالي صناعياً.',
    grade: 19,
    maxGrade: 20,
    drFeedback: 'إجابة ممتازة منضبطة بالقوانين الديناميكية الحرارية.',
    status: 'graded',
  },
];
