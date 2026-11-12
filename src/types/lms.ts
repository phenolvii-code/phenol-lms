export type ViewMode = 'STUDENT' | 'INSTRUCTOR';

export type AcademicTrackSlug =
  | 'secondary-baccalaureate'
  | 'igcse-alevels'
  | 'undergrads'
  | 'public-courses';

export type AcademicCategory =
  | AcademicTrackSlug
  // Legacy aliases for backward compatibility
  | 'thanaweya-arabic'
  | 'thanaweya-languages'
  | 'igcse-stem'
  | 'university';

export interface AcademicTrackCategory {
  id: AcademicTrackSlug;
  name: string;
  nameAr: string;
  description: string;
  badge: string;
  romanNumeral: string;
  subjects: string[];
}

export interface InstructorProfile {
  id?: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  specialization: string;
  supervisionScope: string;
  whatsapp?: string;
  email?: string;
  subjects?: string[];
  coursesCount?: number;
}

export interface LectureTimestamp {
  timeSeconds: number;
  timeLabel: string;
  title: string;
}

// Admin editor input only - never exposed on client lesson objects
export interface AdminLessonInput {
  videoUrl?: string;
  pdfNotesUrl?: string;
}

export interface ChemistryLesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'lab' | 'pdf';
  completed?: boolean;
  videoProvider?: 'youtube' | 'vimeo' | 'bunny' | 'direct' | 'auto';
  summary: string;
  keyFormulas?: string[];
  pdfNotesName?: string;
  timestamps?: LectureTimestamp[];
}

export interface ChemistryCourse {
  id: string;
  code: string;
  title: string;
  subTitle: string;
  description: string;
  category: AcademicCategory;
  categoryName: string;
  trackSlug?: AcademicTrackSlug;
  subject?: string;
  instructorId?: string;
  instructorName?: string;
  instructorTitle?: string;
  instructorAvatar?: string;
  instructorWhatsapp?: string;
  level: string;
  molecularFormula?: string;
  thumbnail: string;
  totalHours?: string;
  lessons: ChemistryLesson[];
  colorAccent: string;
  accentBg: string;
}

export interface Question {
  id: string;
  question: string;
  molecularSnippet?: string;
  options: string[];
  correctIndex: number;
  scientificExplanation: string;
}

export interface ChemistryQuiz {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  badge: string;
  durationMinutes: number;
  questions: Question[];
}

export interface Booklet {
  id: string;
  title: string;
  courseName: string;
  category?: AcademicCategory;
  pages: number;
  size: string;
  edition: string;
  description: string;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentCode: string;
  taskTitle: string;
  submittedAt: string;
  solutionNotes: string;
  grade?: number;
  maxGrade: number;
  drFeedback?: string;
  status: 'graded' | 'pending';
}

export interface WaitlistApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  academicTrack: string;
  targetCourse: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'contacted' | 'declined';
  notes?: string;
}

export interface EnrolledStudent {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  trackCode: string;
  enrolledAt: string;
  progressPercent: number;
  averageGrade: number;
  status: 'active' | 'probation' | 'completed';
}
