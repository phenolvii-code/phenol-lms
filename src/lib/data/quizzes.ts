import { supabase } from '@/lib/supabase';
import { CHEMISTRY_QUIZZES } from '@/data/mock-data';
import { ChemistryQuiz } from '@/types/lms';

export interface QuizSubmissionResult {
  id?: string;
  quizId: string;
  courseId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string>;
  submittedAt: string;
}

/**
 * Fetches all interactive quizzes for a given course from Supabase (fallback to local mock data)
 */
export async function fetchCourseQuizzes(courseId: string): Promise<ChemistryQuiz[]> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((q) => ({
        id: q.id,
        courseId: q.course_id,
        courseTitle: q.title,
        title: q.title,
        badge: 'Evaluation Quiz',
        durationMinutes: q.duration_minutes || 15,
        questions: (q.questions || []).map((quest: any) => ({
          id: quest.id,
          question: quest.text || quest.question,
          molecularSnippet: quest.molecularSnippet,
          options: (quest.options || []).map((opt: any) =>
            typeof opt === 'string' ? opt : opt.text
          ),
          correctIndex:
            typeof quest.correctIndex === 'number'
              ? quest.correctIndex
              : (quest.options || []).findIndex(
                  (opt: any) => opt.id === quest.correct_option_id
                ),
          scientificExplanation:
            quest.explanation || quest.scientificExplanation || '',
        })),
      }));
    }
  } catch (err) {
    console.warn('Could not fetch quizzes from Supabase, using standard mocks:', err);
  }

  // Fallback to mock quizzes
  const filtered = CHEMISTRY_QUIZZES.filter(
    (q) => q.courseId === courseId || courseId.includes('301') || courseId.includes('org')
  );

  return filtered.length > 0 ? filtered : CHEMISTRY_QUIZZES;
}

/**
 * Fetches a single quiz by ID
 */
export async function fetchQuizById(quizId: string): Promise<ChemistryQuiz | null> {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        courseId: data.course_id,
        courseTitle: data.title,
        title: data.title,
        badge: 'Evaluation Quiz',
        durationMinutes: data.duration_minutes || 15,
        questions: (data.questions || []).map((quest: any) => ({
          id: quest.id,
          question: quest.text || quest.question,
          molecularSnippet: quest.molecularSnippet,
          options: (quest.options || []).map((opt: any) =>
            typeof opt === 'string' ? opt : opt.text
          ),
          correctIndex:
            typeof quest.correctIndex === 'number'
              ? quest.correctIndex
              : (quest.options || []).findIndex(
                  (opt: any) => opt.id === quest.correct_option_id
                ),
          scientificExplanation:
            quest.explanation || quest.scientificExplanation || '',
        })),
      };
    }
  } catch {
    // ignore
  }

  return CHEMISTRY_QUIZZES.find((q) => q.id === quizId) || CHEMISTRY_QUIZZES[0] || null;
}

/**
 * Evaluates and records a quiz attempt in Supabase
 */
export async function submitQuizAttempt(
  quiz: ChemistryQuiz,
  userAnswers: Record<number, number>
): Promise<QuizSubmissionResult> {
  const totalQuestions = quiz.questions.length;
  let correctCount = 0;

  quiz.questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctIndex) {
      correctCount += 1;
    }
  });

  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = percentage >= 60;
  const pointsPerQuestion = 5;
  const totalPoints = totalQuestions * pointsPerQuestion;
  const score = correctCount * pointsPerQuestion;

  const result: QuizSubmissionResult = {
    quizId: quiz.id,
    courseId: quiz.courseId,
    studentId: 'guest',
    score,
    totalPoints,
    percentage,
    passed,
    answers: Object.fromEntries(
      Object.entries(userAnswers).map(([k, v]) => [k, String(v)])
    ),
    submittedAt: new Date().toISOString(),
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      result.studentId = user.id;

      await supabase.from('quiz_submissions').insert({
        quiz_id: quiz.id,
        course_id: quiz.courseId,
        student_id: user.id,
        student_email: user.email,
        student_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        answers: result.answers,
        score,
        total_points: totalPoints,
        percentage,
        passed,
      });
    }
  } catch (err) {
    console.error('Error saving quiz submission:', err);
  }

  return result;
}
