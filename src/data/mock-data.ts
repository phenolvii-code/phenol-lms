import {
  AcademicCategory,
  AcademicTrackCategory,
  InstructorProfile,
  ChemistryCourse,
  ChemistryQuiz,
  Booklet,
  StudentSubmission,
  WaitlistApplication,
  EnrolledStudent,
  TimelinePost,
} from '@/types/lms';

export const ACADEMIC_TRACKS: AcademicTrackCategory[] = [
  {
    id: 'thanaweya-arabic',
    name: 'Public Secondary AR',
    nameAr: 'Public Secondary AR',
    description: 'The complete Egyptian Public Secondary Chemistry curriculum in Arabic, deconstructing organic mechanisms, physical equilibria, and electrochemistry from first principles.',
    badge: 'Public Secondary AR',
  },
  {
    id: 'thanaweya-languages',
    name: 'Public Secondary EN',
    nameAr: 'Public Secondary EN',
    description: 'Egyptian Public Secondary Chemistry curriculum taught in English for experimental and language schools, with structured focus on conceptual problem solving and ministerial exam mastery.',
    badge: 'Public Secondary EN',
  },
  {
    id: 'igcse-stem',
    name: 'IGCSE & A-Level Chemistry',
    nameAr: 'IGCSE & A-Level (Cambridge & Edexcel)',
    description: 'International British Curriculum (Cambridge & Pearson Edexcel IGCSE, AS & A2 Level Chemistry), covering theoretical depth, reaction mechanisms, and past paper analytics.',
    badge: 'IGCSE • A-Level Chemistry',
  },
  {
    id: 'university',
    name: 'University Chemistry',
    nameAr: 'University Chemistry (Undergraduate)',
    description: 'Advanced undergraduate university modules for faculties of Pharmacy, Medicine, Science, and Engineering covering organic reaction mechanisms, spectroscopy, and physical kinetics.',
    badge: 'University Chemistry',
  },
];

export const INSTRUCTOR: InstructorProfile = {
  name: 'Dr. Omar Magdi',
  title: 'Academic Director & Senior Chemistry Fellow',
  bio: 'Specialist in organic reaction mechanisms and physical chemistry. Dedicated to demystifying the discipline through first-principles pedagogy, causal logic, and the Feynman technique.',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  specialization: 'Organic Reaction Mechanisms, Chemical Kinetics & Spectroscopy',
  supervisionScope: 'Direct Academic Mentorship across 4 Core Tracks',
};

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
        question: 'What is the rigorous thermodynamic rationale for why phenol (C₆H₅OH) exhibits substantially greater acidity than ethanol (C₂H₅OH)?',
        molecularSnippet: 'C₆H₅O⁻ ↔ Resonance Hybrid',
        options: [
          'The resulting phenoxide ion is stabilized by π-electron delocalization across the aromatic ring carbons.',
          'Phenol has a higher molecular mass which mechanically facilitates proton release.',
          'The carbon-oxygen bond length in phenol is significantly longer and weaker than in ethanol.',
          'Stronger intermolecular hydrogen bonds exist between adjacent un-ionized phenol molecules.',
        ],
        correctIndex: 0,
        scientificExplanation: 'Upon proton dissociation, the phenoxide negative charge is delocalized over the ortho and para positions of the aromatic ring across contributing resonance canonicals. This thermodynamic stabilization drives the acid equilibrium forward (pKa ~ 9.95 vs 15.9 for ethanol).',
      },
      {
        id: 'q2',
        question: 'When neutral aqueous Ferric Chloride (FeCl₃) is added to an unknown sample of phenol in the laboratory, what characteristic observation confirms its presence?',
        molecularSnippet: 'FeCl₃ + Phenol → [Complex] ?',
        options: [
          'A white precipitate forms that rapidly redissolves in dilute mineral acids.',
          'A distinctive deep violet coloration appears due to coordination complex formation.',
          'Evolution of effervescent hydrogen gas that ignites with a characteristic pop.',
          'No visible change occurs because phenol is inert toward transition metal salts.',
        ],
        correctIndex: 1,
        scientificExplanation: 'FeCl₃ serves as a diagnostic qualitative test for phenolic compounds through the formation of the octahedral coordination complex [Fe(OC₆H₅)₆]³⁻, producing a characteristic intense violet chromophore.',
      },
      {
        id: 'q3',
        question: 'Which of the following compounds is the predominant product formed upon exhaustive nitration of phenol with concentrated HNO₃ in the presence of concentrated H₂SO₄ under heat?',
        molecularSnippet: 'C₆H₅OH + conc. HNO₃ / H₂SO₄ → ?',
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

export const BOOKLETS: Booklet[] = [
  {
    id: 'book-1',
    title: 'Atlas of Organic Reaction Mechanisms — Dr. Omar Magdi',
    courseName: 'Organic Chemistry',
    category: 'thanaweya-arabic',
    pages: 72,
    size: '14.2 MB',
    edition: '2026/2027 Academic Edition',
    description: 'Illustrated hand-annotated mechanistic guide detailing electron pushing, curved-arrow conventions, and transition state geometries for all aromatic pathways.',
  },
  {
    id: 'book-2',
    title: 'Physical Equilibrium: High-Difficulty Analytical Problem Sets',
    courseName: 'Physical Chemistry',
    category: 'thanaweya-languages',
    pages: 54,
    size: '9.8 MB',
    edition: '2026/2027 Academic Edition',
    description: 'Curated compilation of 150 non-routine multi-concept equilibrium challenges with step-by-step thermodynamic derivations.',
  },
  {
    id: 'book-3',
    title: 'Cambridge & Edexcel A-Level Chemistry Revision Dossier',
    courseName: 'IGCSE & A-Level',
    category: 'igcse-stem',
    pages: 60,
    size: '11.5 MB',
    edition: 'Cambridge 9701 & Edexcel IAL',
    description: 'Comprehensive syllabus map covering Paper 2 and Paper 4 past paper mechanistic problems, synthetic routes, and organic identification schemes.',
  },
  {
    id: 'book-4',
    title: 'Spectroscopic Elucidation & Molecular Symmetry Manual',
    courseName: 'University Chemistry',
    category: 'university',
    pages: 48,
    size: '8.4 MB',
    edition: 'Pharmacy & Science Edition',
    description: 'University laboratory reference detailing ¹H-NMR and ¹³C-NMR chemical shift correlations, coupling constant calculations, and infrared absorption tables.',
  },
];

// Clean Real Arrays: Empty or live-populated by real applications and submissions
export const SUBMISSIONS: StudentSubmission[] = [];

export const WAITLIST_APPLICANTS: WaitlistApplication[] = [];

export const ENROLLED_STUDENTS: EnrolledStudent[] = [];

export const INITIAL_TIMELINE_POSTS: TimelinePost[] = [];
