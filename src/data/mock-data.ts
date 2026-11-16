import {
  AcademicCategory,
  AcademicTrackCategory,
  AcademicTrackSlug,
  InstructorProfile,
  ChemistryCourse,
  ChemistryQuiz,
  StudentSubmission,
  WaitlistApplication,
  EnrolledStudent,
} from '@/types/lms';

export const ACADEMIC_TRACKS: AcademicTrackCategory[] = [
  {
    id: 'secondary-baccalaureate',
    name: 'Secondary & Baccalaureate',
    nameAr: 'Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠØ§ (Ø¹Ø±Ø¨ÙŠ ÙˆÙ„ØºØ§Øª)',
    description: 'The National Curriculum (Egyptian Public Secondary Arabic & Language Schools) and the French Baccalaureate. Systematic decomposition of physical sciences, chemistry, and mathematics from first principles.',
    badge: 'Secondary & Baccalaureate',
    romanNumeral: 'TRACK I',
    subjects: ['Chemistry', 'Physics', 'Biology', 'Mathematics'],
  },
  {
    id: 'igcse-alevels',
    name: 'IGCSE & A-Levels',
    nameAr: 'Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø¨Ø±ÙŠØ·Ø§Ù†ÙŠØ© Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© (Cambridge & Edexcel)',
    description: 'International British Curriculum (Cambridge Assessment, Pearson Edexcel & Oxford AQA). Complete syllabus deconstruction, past-paper forensics, and mark scheme precision.',
    badge: 'IGCSE â€¢ A-Levels',
    romanNumeral: 'TRACK II',
    subjects: ['Chemistry (0620/9701)', 'Physics', 'Biology', 'Pure Mathematics'],
  },
  {
    id: 'undergrads',
    name: 'Undergrads',
    nameAr: 'Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ Ø§Ù„ØªØ®ØµØµÙŠ (ØµÙŠØ¯Ù„Ø©ØŒ Ø·Ø¨ØŒ Ø¹Ù„ÙˆÙ…ØŒ Ù‡Ù†Ø¯Ø³Ø©)',
    description: 'Advanced undergraduate university modules for faculties of Pharmacy, Medicine, Science, and Engineering covering organic reaction mechanisms, spectroscopy, physical kinetics, and biochemistry.',
    badge: 'University Undergrads',
    romanNumeral: 'TRACK III',
    subjects: ['Organic Chemistry', 'Physical Chemistry', 'Pharmaceutical Chemistry', 'Spectroscopy'],
  },
  {
    id: 'public-courses',
    name: 'Public Courses',
    nameAr: 'Ø§Ù„Ù…Ø³Ø§Ù‚Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ù…ÙØªÙˆØ­Ø© Ù„Ù„Ø¬Ù…ÙŠØ¹',
    description: 'Open scientific masterclasses for scholars, educators, and lifelong learners. First-principles exploration of natural laws, epistemology, and foundational scientific cognition.',
    badge: 'Public Masterclasses',
    romanNumeral: 'TRACK IV',
    subjects: ['Scientific Thinking', 'Foundational Chemistry', 'Natural Philosophy'],
  },
];

export const normalizeTrackSlug = (cat: string): AcademicTrackSlug => {
  if (cat === 'thanaweya-arabic' || cat === 'thanaweya-languages' || cat === 'secondary-baccalaureate') {
    return 'secondary-baccalaureate';
  }
  if (cat === 'igcse-stem' || cat === 'igcse-alevels') {
    return 'igcse-alevels';
  }
  if (cat === 'university' || cat === 'undergrads') {
    return 'undergrads';
  }
  return 'public-courses';
};

export const INSTRUCTOR: InstructorProfile = {
  id: 'dr-omar-magdi',
  name: 'Dr. Omar Magdi',
  title: 'Academic Director & Senior Chemistry Fellow (PharmD)',
  bio: 'PharmD graduate and chemistry educator. Focused on first-principles causality, physical chemistry, reaction mechanisms, and intellectual scientific pedagogy.',
  avatar: '',
  specialization: 'Organic Reaction Mechanisms, Chemical Kinetics & Pharmaceutical Sciences',
  supervisionScope: 'Academic Director across All 4 Tracks',
  whatsapp: 'https://wa.me/201019688457',
  email: 'phenolvii@gmail.com',
  subjects: ['Organic Chemistry', 'Physical Chemistry', 'General Chemistry'],
  coursesCount: 3,
};

// Sync avatar from local storage cache if available
if (typeof window !== 'undefined') {
  const cachedAvatar = localStorage.getItem('phenol_global_instructor_avatar');
  if (cachedAvatar) {
    INSTRUCTOR.avatar = cachedAvatar;
  }
}

export const setGlobalInstructorAvatar = (newAvatar: string) => {
  if (!newAvatar) return;
  INSTRUCTOR.avatar = newAvatar;
  if (FACULTY_MEMBERS[0]) {
    FACULTY_MEMBERS[0].avatar = newAvatar;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('phenol_global_instructor_avatar', newAvatar);
    window.dispatchEvent(new Event('phenol_user_profile_updated'));
  }
};

export const FACULTY_MEMBERS: InstructorProfile[] = [
  INSTRUCTOR,
];

export const CHEMISTRY_COURSES: ChemistryCourse[] = [];

export const CHEMISTRY_QUIZZES: ChemistryQuiz[] = [
  {
    id: 'quiz-phenol-01',
    courseId: 'chem-ar-301',
    courseTitle: 'Comprehensive Organic Chemistry (Public Secondary AR)',
    title: 'Dr. Omar Magdi Diagnostic: Phenolic Acidity & Delocalization',
    badge: 'Mastery Challenge',
    durationMinutes: 15,
    questions: [
      {
        id: 'q1',
        question: 'What is the rigorous thermodynamic rationale for why phenol (Câ‚†Hâ‚…OH) exhibits substantially greater acidity than ethanol (Câ‚‚Hâ‚…OH)?',
        molecularSnippet: 'Câ‚†Hâ‚…Oâ» â†” Resonance Hybrid',
        options: [
          'The resulting phenoxide ion is stabilized by Ï€-electron delocalization across the aromatic ring carbons.',
          'Phenol has a higher molecular mass which mechanically facilitates proton release.',
          'The carbon-oxygen bond length in phenol is significantly longer and weaker than in ethanol.',
          'Stronger intermolecular hydrogen bonds exist between adjacent un-ionized phenol molecules.',
        ],
        correctIndex: 0,
        scientificExplanation: 'Upon proton dissociation, the phenoxide negative charge is delocalized over the ortho and para positions of the aromatic ring across contributing resonance canonicals. This thermodynamic stabilization drives the acid equilibrium forward (pKa ~ 9.95 vs 15.9 for ethanol).',
      },
      {
        id: 'q2',
        question: 'When neutral aqueous Ferric Chloride (FeClâ‚ƒ) is added to an unknown sample of phenol in the laboratory, what characteristic observation confirms its presence?',
        molecularSnippet: 'FeClâ‚ƒ + Phenol â†’ [Complex] ?',
        options: [
          'A white precipitate forms that rapidly redissolves in dilute mineral acids.',
          'A distinctive deep violet coloration appears due to coordination complex formation.',
          'Evolution of effervescent hydrogen gas that ignites with a characteristic pop.',
          'No visible change occurs because phenol is inert toward transition metal salts.',
        ],
        correctIndex: 1,
        scientificExplanation: 'FeClâ‚ƒ serves as a diagnostic qualitative test for phenolic compounds through the formation of the octahedral coordination complex [Fe(OCâ‚†Hâ‚…)â‚†]Â³â», producing a characteristic intense violet chromophore.',
      },
      {
        id: 'q3',
        question: 'Which of the following compounds is the predominant product formed upon exhaustive nitration of phenol with concentrated HNOâ‚ƒ in the presence of concentrated Hâ‚‚SOâ‚„ under heat?',
        molecularSnippet: 'Câ‚†Hâ‚…OH + conc. HNOâ‚ƒ / Hâ‚‚SOâ‚„ â†’ ?',
        options: [
          '2,4,6-Trinitrophenol (Picric Acid)',
          'Meta-nitrophenol only',
          'Sodium benzoate with water vapor',
          'Nitrobenzene with loss of the phenolic hydroxyl group',
        ],
        correctIndex: 0,
        scientificExplanation: 'The phenolic hydroxyl group is strongly activating and ortho/para-directing through oxygen lone-pair resonance donation. Under forcing nitration conditions, all three activated positions are substituted, yielding 2,4,6-trinitrophenol (picric acid).',
      },
    ],
  },
];


// Clean Real Arrays: Empty or live-populated by real applications and submissions
export const SUBMISSIONS: StudentSubmission[] = [];

export const WAITLIST_APPLICANTS: WaitlistApplication[] = [];

export const ENROLLED_STUDENTS: EnrolledStudent[] = [];
