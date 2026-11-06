export type ViewMode = 'STUDENT' | 'INSTRUCTOR';

export interface InstructorProfile {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  lecturesCount: number;
}

export interface ChemistryLesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'lab' | 'pdf';
  completed?: boolean;
  videoDurationSeconds?: number;
  summary: string;
  keyFormulas?: string[];
  pdfNotesUrl?: string;
}

export interface ChemistryCourse {
  id: string;
  code: string;
  title: string;
  subTitle: string;
  description: string;
  level: 'تأسيسي' | 'متقدم' | 'جامعي ومكثف';
  molecularFormula?: string;
  thumbnail: string;
  totalHours: string;
  lessons: ChemistryLesson[];
  colorAccent: string;
  accentBg: string;
  enrolledStudentsCount: number;
  rating: number;
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
  pages: number;
  size: string;
  downloads: number;
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
