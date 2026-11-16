/**
 * PHENOL ACADEMY - Course Question Banks (DB-driven)
 * Source of truth: the `question_bank_items` table (migration 017), gated by
 * RLS exactly like the booklets: course owner / super_admin / ACTIVE-enrolled
 * students only. There is NO fallback content — a course with no published
 * bank gets an empty bank (never another course's questions).
 */

import { supabase } from '@/lib/supabase';

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

/**
 * Fetches the question bank of ONE course from the database.
 * Returns an empty bank when the course has none (or when RLS blocks the
 * caller — non-enrolled users simply see an empty bank).
 */
export async function fetchCourseQuestionBank(
  courseId: string,
  courseTitle?: string,
  courseCode?: string
): Promise<CourseQuestionBank> {
  const bank: CourseQuestionBank = {
    courseId,
    courseTitle: courseTitle || 'Course Question Bank',
    courseCode: courseCode || 'CHEM',
    topics: [],
    questions: [],
  };

  if (!courseId) return bank;

  try {
    const { data, error } = await supabase
      .from('question_bank_items')
      .select('id, number, topic, question, molecular_snippet, options')
      .eq('course_id', courseId)
      .order('number', { ascending: true });

    if (error || !data) return bank;

    bank.questions = data.map((row: any) => ({
      id: row.id,
      number: row.number,
      topic: row.topic || undefined,
      question: row.question,
      molecularSnippet: row.molecular_snippet || undefined,
      options: Array.isArray(row.options) ? row.options : [],
    }));

    // Distinct topic list, in first-appearance order (for the filter bar).
    bank.topics = Array.from(
      new Set(bank.questions.map((q) => q.topic).filter((t): t is string => !!t))
    );
  } catch (err) {
    console.warn('Notice fetching question bank:', err);
  }

  return bank;
}
