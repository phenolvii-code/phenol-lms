import { supabase } from '@/lib/supabase';
import { ChemistryQuiz, Question } from '@/types/lms';

export interface QuizReviewItem {
  index: number;
  question_id: string;
  studentIndex: number | null;
  correctIndex: number | null;
  isCorrect: boolean;
  points: number;
  explanation: string;
}

export interface QuizSubmissionResult {
  submissionId?: string;
  quizId: string;
  courseId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  review: QuizReviewItem[];
}

/**
 * Maps a sanitized DB question (no answer key) to the frontend Question shape.
 * correctIndex is intentionally undefined — it is unknown until grading.
 */
function mapSanitizedQuestion(quest: any, idx: number): Question {
  return {
    id: quest.id || `q${idx}`,
    question: quest.text || quest.question || `Question ${idx + 1}`,
    molecularSnippet: quest.molecularSnippet,
    options: (quest.options || []).map((opt: any) =>
      typeof opt === 'string' ? opt : opt.text
    ),
    correctIndex: undefined,
    scientificExplanation: '',
  };
}

/**
 * Fetches quiz metadata for a course via the DB RPC (no answer keys ever).
 * Question counts come from the server; questions themselves are NOT included.
 */
export async function fetchCourseQuizzes(courseId: string): Promise<ChemistryQuiz[]> {
  const { data, error } = await supabase.rpc('get_course_quiz_metadata', {
    p_course_id: courseId,
  });

  if (error) {
    console.warn('Could not fetch quiz metadata:', error.message);
    return [];
  }

  return (data || []).map((q: any) => ({
    id: q.id,
    courseId,
    courseTitle: q.title,
    title: q.title,
    badge: 'Evaluation Quiz',
    durationMinutes: q.duration_minutes || 15,
    questionCount: q.question_count || 0,
    questions: [],
  }));
}

/**
 * Fetches a single quiz: metadata from the table, sanitized questions from
 * the RPC. Returns null when the quiz does not exist or the caller is not
 * enrolled in its course (the RPC raises 'not enrolled').
 */
export async function fetchQuizById(quizId: string): Promise<ChemistryQuiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, course_id, title, duration_minutes, passing_percentage')
    .eq('id', quizId)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: rawQuestions, error: questionsError } = await supabase.rpc(
    'get_quiz_questions',
    { p_quiz_id: quizId }
  );

  if (questionsError) {
    console.warn('Quiz questions access denied:', questionsError.message);
    return null;
  }

  const questions = ((rawQuestions as any[]) || []).map(mapSanitizedQuestion);

  return {
    id: data.id,
    courseId: data.course_id,
    courseTitle: data.title,
    title: data.title,
    badge: 'Evaluation Quiz',
    durationMinutes: data.duration_minutes || 15,
    questionCount: questions.length,
    questions,
  };
}

/**
 * Submits the attempt and lets the DATABASE grade it. The client never
 * computes or writes its own score — the RPC reads the private answer key,
 * grades, records the submission and returns the per-question review.
 */
export async function submitQuizAttempt(
  quiz: ChemistryQuiz,
  userAnswers: Record<number, number>
): Promise<QuizSubmissionResult> {
  // keys = question index (string), values = option index (string)
  const answers = Object.fromEntries(
    Object.entries(userAnswers).map(([k, v]) => [k, String(v)])
  );

  const { data, error } = await supabase.rpc('submit_quiz_attempt', {
    p_quiz_id: quiz.id,
    p_answers: answers,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = (data || {}) as any;

  return {
    submissionId: result.submission_id,
    quizId: quiz.id,
    courseId: result.course_id || quiz.courseId,
    score: Number(result.score) || 0,
    totalPoints: Number(result.total_points) || 0,
    percentage: Number(result.percentage) || 0,
    passed: Boolean(result.passed),
    review: (result.review || []).map((r: any) => ({
      index: r.index,
      question_id: r.question_id,
      studentIndex: r.student_index,
      correctIndex: r.correct_index,
      isCorrect: Boolean(r.is_correct),
      points: Number(r.points) || 0,
      explanation: r.explanation || '',
    })),
  };
}
