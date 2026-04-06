'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { TestResult, Answer, Question, SUBJECT_LABELS, Subject, AnswerChoice } from '@/lib/database.types'
import { PASS_THRESHOLD, SUBJECT_MIN_THRESHOLD, MAX_CONTRAINDICATED } from '@/lib/scoring'
import FeedbackButton from '@/components/FeedbackButton'

interface AnswerWithQuestion extends Answer {
  question: Question
}

export default function ExamResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const supabase = createClient()
  const [result, setResult] = useState<TestResult | null>(null)
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadResult()
  }, [])

  async function loadResult() {
    const { data: resultData } = await supabase
      .from('test_results')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (resultData) setResult(resultData)

    const { data: answerRows } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_order', { ascending: true })

    if (answerRows) {
      const questionIds = answerRows.map(a => a.question_id)
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds)

      if (questions) {
        const qMap = new Map(questions.map(q => [q.id, q]))
        setAnswers(answerRows.map(a => ({ ...a, question: qMap.get(a.question_id)! })).filter(a => a.question))
      }
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  }

  if (!result) {
    return <div className="text-center py-20 text-text-secondary">結果が見つかりません</div>
  }

  const overallRate = Math.round((result.total_score / result.total_questions) * 100)

  const subjects: { key: Subject; score: number; total: number }[] = [
    { key: 'ma_practice', score: result.ma_practice_score, total: result.ma_practice_total },
    { key: 'finance_tax', score: result.finance_tax_score, total: result.finance_tax_total },
    { key: 'legal', score: result.legal_score, total: result.legal_total },
    { key: 'ethics', score: result.ethics_score, total: result.ethics_total },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">試験結果</h1>

      {/* Overall result */}
      <div className={`p-8 rounded-xl border-2 text-center ${
        result.is_passed ? 'border-success bg-success/5' : 'border-danger bg-danger/5'
      }`}>
        <div className={`text-5xl font-bold ${result.is_passed ? 'text-success' : 'text-danger'}`}>
          {result.is_passed ? '合格' : '不合格'}
        </div>
        <div className="text-3xl font-bold mt-4">{overallRate}%</div>
        <div className="text-text-secondary mt-1">
          {result.total_score} / {result.total_questions} 問正解
        </div>
        <div className="text-sm text-text-secondary mt-2">
          合格基準: {Math.round(PASS_THRESHOLD * 100)}%以上
        </div>
      </div>

      {/* Subject scores */}
      <div className="bg-card-bg border border-border-color rounded-xl p-6">
        <h2 className="font-semibold mb-4">科目別得点</h2>
        <div className="space-y-4">
          {subjects.map(({ key, score, total }) => {
            const rate = total > 0 ? Math.round((score / total) * 100) : 0
            const passed = total === 0 || rate >= SUBJECT_MIN_THRESHOLD * 100
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{SUBJECT_LABELS[key]}</span>
                  <span className={passed ? 'text-success' : 'text-danger'}>
                    {score}/{total} ({rate}%)
                  </span>
                </div>
                <div className="h-3 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${passed ? 'bg-success' : 'bg-danger'}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                {!passed && (
                  <div className="text-xs text-danger mt-1">
                    科目別最低基準（{Math.round(SUBJECT_MIN_THRESHOLD * 100)}%）未達
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Contraindicated */}
      <div className={`p-4 rounded-xl border ${
        result.contraindicated_count >= MAX_CONTRAINDICATED ? 'border-danger bg-danger/5' : 'border-border-color bg-card-bg'
      }`}>
        <div className="flex justify-between items-center">
          <span className="font-medium">禁忌肢の選択数</span>
          <span className={`text-lg font-bold ${
            result.contraindicated_count >= MAX_CONTRAINDICATED ? 'text-danger' : 'text-success'
          }`}>
            {result.contraindicated_count} / {MAX_CONTRAINDICATED}以上で不合格
          </span>
        </div>
      </div>

      {/* Detail toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-3 rounded-xl border border-border-color bg-card-bg hover:bg-bg-secondary transition-colors font-medium"
      >
        {showDetails ? '問題詳細を閉じる' : '問題ごとの詳細を見る'}
      </button>

      {/* Question details */}
      {showDetails && (
        <div className="space-y-4">
          {answers.map((a, i) => {
            const isCorrect = a.selected_answer === a.question.correct_answer
            const isContraindicated = a.question.contraindicated_option && a.selected_answer === a.question.contraindicated_option
            return (
              <div key={a.id} className={`p-4 rounded-xl border ${
                isCorrect ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium">問{i + 1}. {SUBJECT_LABELS[a.question.subject as Subject]}</span>
                  <div className="flex gap-2">
                    {isContraindicated && (
                      <span className="text-xs px-2 py-0.5 rounded bg-danger text-white">禁忌肢</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                      {isCorrect ? '正解' : '不正解'}
                    </span>
                  </div>
                </div>
                <p className="text-sm mb-3 whitespace-pre-wrap">{a.question.question_text}</p>
                <div className="space-y-1 text-sm">
                  {(['a', 'b', 'c', 'd'] as AnswerChoice[]).map((choice) => {
                    const optKey = `option_${choice}` as keyof Question
                    const isThisCorrect = choice === a.question.correct_answer
                    const isThisSelected = choice === a.selected_answer
                    const isThisContra = choice === a.question.contraindicated_option
                    return (
                      <div key={choice} className={`p-2 rounded ${
                        isThisCorrect ? 'bg-success/10 font-medium' : isThisSelected && !isThisCorrect ? 'bg-danger/10' : ''
                      }`}>
                        {choice.toUpperCase()}. {a.question[optKey] as string}
                        {isThisCorrect && ' ✓'}
                        {isThisSelected && !isThisCorrect && ' ✗'}
                        {isThisContra && ' ⚠️禁忌'}
                      </div>
                    )
                  })}
                </div>
                {a.question.explanation && (
                  <div className="mt-3 p-3 rounded bg-bg-secondary text-sm">
                    <span className="font-medium">解説: </span>{a.question.explanation}
                  </div>
                )}
                <div className="mt-3">
                  <FeedbackButton questionId={a.question.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-4">
        <Link href="/dashboard" className="flex-1 py-3 rounded-xl border border-border-color bg-card-bg text-center hover:bg-bg-secondary transition-colors">
          ダッシュボードへ
        </Link>
        <Link href="/exam/start" className="flex-1 py-3 rounded-xl bg-primary text-white text-center hover:bg-primary-hover transition-colors">
          もう一度受験する
        </Link>
      </div>
    </div>
  )
}
