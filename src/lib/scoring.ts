import { Answer, Question, Subject, TestResult } from './database.types'

interface AnswerWithQuestion extends Answer {
  question: Question
}

const PASS_THRESHOLD = 0.7
const SUBJECT_MIN_THRESHOLD = 0.5
const MAX_CONTRAINDICATED = 2

export function calculateResults(
  sessionId: string,
  answersWithQuestions: AnswerWithQuestion[]
): Omit<TestResult, 'id' | 'created_at'> {
  const subjectScores: Record<Subject, { score: number; total: number }> = {
    ma_practice: { score: 0, total: 0 },
    finance_tax: { score: 0, total: 0 },
    legal: { score: 0, total: 0 },
    ethics: { score: 0, total: 0 },
  }

  let totalScore = 0
  let contraindicatedCount = 0

  for (const aw of answersWithQuestions) {
    const { question, selected_answer } = aw
    const subject = question.subject as Subject
    subjectScores[subject].total++

    if (selected_answer === question.correct_answer) {
      totalScore++
      subjectScores[subject].score++
    }

    // Check contraindicated option
    if (
      question.contraindicated_option &&
      selected_answer === question.contraindicated_option
    ) {
      contraindicatedCount++
    }
  }

  const totalQuestions = answersWithQuestions.length
  const overallRate = totalQuestions > 0 ? totalScore / totalQuestions : 0

  // Check subject minimums
  const allSubjectsPassed = Object.values(subjectScores).every(
    (s) => s.total === 0 || s.score / s.total >= SUBJECT_MIN_THRESHOLD
  )

  const isPassed =
    overallRate >= PASS_THRESHOLD &&
    allSubjectsPassed &&
    contraindicatedCount < MAX_CONTRAINDICATED

  return {
    session_id: sessionId,
    total_score: totalScore,
    total_questions: totalQuestions,
    ma_practice_score: subjectScores.ma_practice.score,
    ma_practice_total: subjectScores.ma_practice.total,
    finance_tax_score: subjectScores.finance_tax.score,
    finance_tax_total: subjectScores.finance_tax.total,
    legal_score: subjectScores.legal.score,
    legal_total: subjectScores.legal.total,
    ethics_score: subjectScores.ethics.score,
    ethics_total: subjectScores.ethics.total,
    contraindicated_count: contraindicatedCount,
    is_passed: isPassed,
  }
}

export { PASS_THRESHOLD, SUBJECT_MIN_THRESHOLD, MAX_CONTRAINDICATED }
