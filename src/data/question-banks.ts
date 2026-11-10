export interface QuestionBankItem {
  id: string;
  number: number;
  topic?: string;
  question: string;
  molecularSnippet?: string;
  options: string[];
}

export interface CourseQuestionBank {
  courseId: string;
  courseTitle: string;
  courseCode: string;
  topics: string[];
  questions: QuestionBankItem[];
}

export const COURSE_QUESTION_BANKS: Record<string, CourseQuestionBank> = {
  'chem-ar-301': {
    courseId: 'chem-ar-301',
    courseTitle: 'Comprehensive Organic Chemistry (Public Secondary AR)',
    courseCode: 'ORG-301',
    topics: ['الهيدروكربونات الأليفاتية', 'مشتقات الهيدروكربونات', 'الكيمياء الحلقية والأروماتية'],
    questions: [
      {
        id: 'qb-ar-01',
        number: 1,
        topic: 'الهيدروكربونات الأليفاتية',
        question: 'ما هي الصيغة الجزيئية للألكان الحلقي المتماثل الذي يحتوي على 6 ذرات كربون في سلسلته المغلقة؟',
        molecularSnippet: 'CnH2n (Cycloalkane)',
        options: ['C6H14', 'C6H12', 'C6H10', 'C6H6'],
      },
      {
        id: 'qb-ar-02',
        number: 2,
        topic: 'الهيدروكربونات الأليفاتية',
        question: 'عند التقطير الجاف لملح أسيتات الصوديوم اللامائية مع الجير الصودي ينتج غاز:',
        molecularSnippet: 'CH3COONa + NaOH (CaO, Heat) → ?',
        options: ['غاز الميثان CH4', 'غاز الإيثان C2H6', 'غاز الإيثيلين C2H4', 'غاز الأسيتيلين C2H2'],
      },
      {
        id: 'qb-ar-03',
        number: 3,
        topic: 'مشتقات الهيدروكربونات',
        question: 'أي من الكحولات الآتية يعتبر كحولاً ثالثياً غير قابل للأكسدة بسهولة بالعوامل المؤكسدة المعتادة؟',
        molecularSnippet: 'R3C-OH (Tertiary Alcohol)',
        options: [
          '2-ميثيل-2-بروبانول',
          '1-بيوتانول',
          '2-بيوتانول',
          'الميثانول',
        ],
      },
      {
        id: 'qb-ar-04',
        number: 4,
        topic: 'الكيمياء الحلقية والأروماتية',
        question: 'عند تسخين الفينول مع مسحوق الخارصين (Zn) كعامل مختزل يحدث له اختزال وينتج:',
        molecularSnippet: 'C6H5OH + Zn (Heat) → ?',
        options: ['البنزين العطري C6H6', 'حمض البكريك', 'حمض البنزويك', 'الهكسان الحلقي'],
      },
      {
        id: 'qb-ar-05',
        number: 5,
        topic: 'الهيدروكربونات الأليفاتية',
        question: 'ما هو الناتج الرئيسي عند إضافة بروميد الهيدروجين HBr إلى البروبين وفقاً لقاعدة ماركونيكوف؟',
        molecularSnippet: 'CH3-CH=CH2 + HBr → ?',
        options: [
          '2-بروموبروبان',
          '1-بروموبروبان',
          '1,2-ثنائي بروموبروبان',
          'البروبان العادي',
        ],
      },
      {
        id: 'qb-ar-06',
        number: 6,
        topic: 'مشتقات الهيدروكربونات',
        question: 'يتفاعل الفينول مع هيدروكسيد الصوديوم بينما لا يتفاعل الإيثانول معه، والسبب العلمي لذلك هو:',
        molecularSnippet: 'C6H5OH + NaOH vs C2H5OH + NaOH',
        options: [
          'حلقة البنزين تسحب إلكترونات رابطة C-O فتزيد قطبية الرابطة O-H ويسهل انفصال البروتون.',
          'الإيثانول يحتوي على روابط هيدروجينية أقوى تعيق تفاعله مع القواعد.',
          'الفينول كحول أليفاتي أحادي الهيدروكسيل ذو كتلة جزيئية أكبر.',
          'حلقة البنزين تمنح إلكترونات لذرة الأكسجين فتضعف حمضيته.',
        ],
      },
      {
        id: 'qb-ar-07',
        number: 7,
        topic: 'الكيمياء الحلقية والأروماتية',
        question: 'عدد مولات الهيدروجين اللازمة لهدرجة مول واحد من البنزين العطري هدرجة تامة لتحويله إلى هكسان حلقي يساوي:',
        molecularSnippet: 'C6H6 + n H2 (Ni, P, Heat) → C6H12',
        options: ['3 مولات من H2', '1 مول من H2', '6 مولات من H2', '2 مول من H2'],
      },
      {
        id: 'qb-ar-08',
        number: 8,
        topic: 'الهيدروكربونات الأليفاتية',
        question: 'عند بلمرة غاز الأسيتيلين بلمرة حلقية ثلاثية في أنبوبة نيكل مسخنة لدرجة الاحمرار يتكون:',
        molecularSnippet: '3 C2H2 (Hot Ni Tube) → ?',
        options: [
          'البنزين العطري C6H6',
          'البولي إيثيلين',
          'التولوين C7H8',
          'النفثالين C10H8',
        ],
      },
    ],
  },
  'chem-en-301': {
    courseId: 'chem-en-301',
    courseTitle: 'Organic Chemistry & Reaction Mechanisms (Public Secondary EN)',
    courseCode: 'ORG-EN-301',
    topics: ['Aliphatic Hydrocarbons', 'Functional Groups', 'Aromatic Chemistry'],
    questions: [
      {
        id: 'qb-en-01',
        number: 1,
        topic: 'Aliphatic Hydrocarbons',
        question: 'What is the molecular formula of a saturated cycloalkane containing 6 carbon atoms?',
        molecularSnippet: 'CnH2n (Cycloalkane)',
        options: ['C6H14', 'C6H12', 'C6H10', 'C6H6'],
      },
      {
        id: 'qb-en-02',
        number: 2,
        topic: 'Aliphatic Hydrocarbons',
        question: 'Dry distillation of anhydrous sodium acetate with soda lime yields which gas as the principal product?',
        molecularSnippet: 'CH3COONa + NaOH (CaO, Heat) → ?',
        options: ['Methane (CH4)', 'Ethane (C2H6)', 'Ethylene (C2H4)', 'Acetylene (C2H2)'],
      },
      {
        id: 'qb-en-03',
        number: 3,
        topic: 'Functional Groups',
        question: 'Which of the following represents a tertiary alcohol that is resistant to oxidation under standard laboratory conditions?',
        molecularSnippet: 'R3C-OH (Tertiary)',
        options: [
          '2-Methylpropan-2-ol',
          'Butan-1-ol',
          'Butan-2-ol',
          'Methanol',
        ],
      },
      {
        id: 'qb-en-04',
        number: 4,
        topic: 'Aromatic Chemistry',
        question: 'Heating phenol vapor with zinc dust as a reducing agent produces:',
        molecularSnippet: 'C6H5OH + Zn (Heat) → ?',
        options: ['Benzene (C6H6)', 'Picric Acid', 'Benzoic Acid', 'Cyclohexane'],
      },
      {
        id: 'qb-en-05',
        number: 5,
        topic: 'Aliphatic Hydrocarbons',
        question: 'According to Markovnikov’s rule, the electrophilic addition of hydrogen bromide (HBr) to propene predominantly yields:',
        molecularSnippet: 'CH3-CH=CH2 + HBr → ?',
        options: [
          '2-Bromopropane',
          '1-Bromopropane',
          '1,2-Dibromopropane',
          'n-Propane',
        ],
      },
    ],
  },
};

/**
 * Returns question bank for a course or generates a standard editorial bank if not explicitly defined
 */
export function getCourseQuestionBank(courseId: string, courseTitle?: string, courseCode?: string): CourseQuestionBank {
  if (COURSE_QUESTION_BANKS[courseId]) {
    return COURSE_QUESTION_BANKS[courseId];
  }

  // Fallback to primary organic bank
  return {
    courseId,
    courseTitle: courseTitle || 'Course Question Bank',
    courseCode: courseCode || 'CHEM',
    topics: ['Fundamental Concepts', 'Reaction Mechanics', 'Analytical Diagnostics'],
    questions: COURSE_QUESTION_BANKS['chem-ar-301'].questions,
  };
}
