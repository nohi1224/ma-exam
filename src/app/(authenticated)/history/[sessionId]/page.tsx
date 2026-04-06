'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { TestResult, TestSession, Answer, Question, SUBJECT_LABELS, Subject, AnswerChoice } from '@/lib/database.types'
import { PASS_THRESHOLD, SUBJECT_MIN_THRESHOLD, MAX_CONTRAINDICATED } from '@/lib/scoring'

interface AnswerWithQuestion extends Answer {
  question: Question
}

export default function HistoryDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const supabase = createClient()
  const [result, setResult] = useState<TestResult | null>(null)
  const [session, setSession] = useState<TestSession | null>(null)
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [sessionRes, resultRes, answersRes] = await Promise.all([
      supabase.from('test_sessions').select('*').eq('id', sessionId).single(),
      supabase.from('test_results').select('*').eq('session_id', sessionId).single(),
      supabase.from('answers').select('*').eq('session_id', sessionId).order('question_order', { ascending: true }),
    ])

    if (sessionRes.data) setSession(sessionRes.data)
    if (resultRes.data) setResult(resultRes.data)

    if (answersRes.data) {
      const qIds = answersRes.data.map(a => a.question_id)
      const { data: questions } = await supabase.from('questions').select('*').in('id', qIds)
      if (questions) {
        const qMap = new Map(questions.map(q => [q.id, q]))
        setAnswers(answersRes.data.map(a => ({ ...a, question: qMap.get(a.question_id)! })).filter(a => a.question))
      }
    }
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  if (!result || !session) return <div className="text-center py-20 text-text-secondary">結果が見つかりません</div>

  const overallRate = Math.round((result.total_score / result.total_questions) * 100)
  const subjects: { key: Subject; score: number; total: number }[] = [
    { key: 'ma_practice', score: result.ma_practice_score, total: result.ma_practice_total },
    { key: 'finance_tax', score: result.finance_tax_score, total: result.finance_tax_total },
    { key: 'legal', score: result.legal_score, total: result.legal_total },
    { key: 'ethics', score: result.ethics_score, total: result.ethics_total },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">結果詳細</h1>
        <Link href="/history" className="text-sm text-primary hover:underline">← 履歴一覧</Link>
      </div>

      <div className="text-sm text-text-secondary">
        {session.mode === 'exam' ? '模擬試験' : `練習（${SUBJECT_LABELS[session.subject_filter as Subject] || '全科目'}）`}
        {' | '}
        {new Date(session.finished_at!).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Score summary */}
      <div className={`p-6 rounded-xl border-2 text-center ${result.is_passed ? 'border-success bg-success/5' : 'border-danger bg-danger/5'}`}>
        <div className={`text-4xl font-bold ${result.is_passed ? 'text-success' : 'text-danger'}`}>
          {result.is_passed ? '合格' : '不合格'} — {overallRate}%
        </div>
        <div className="text-text-secondary mt-2">{result.total_score} / {result.total_questions} 問正解</div>
      </div>

      {/* Subject breakdown */}
      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">科目別得点</h2>
        {subjects.map(({ key, score, total }) => {
          if (total === 0) return null
          const rate = Math.round((score / total) * 100)
          const passed = rate >= SUBJECT_MIN_THRESHOLD * 100
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span>{SUBJECT_LABELS[key]}</span>
                <span className={passed ? 'text-success' : 'text-danger'}>{score}/{total} ({rate}%)</span>
              </div>
              <div className="h-3 bg-bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${passed ? 'bg-success' : 'bg-danger'}`} style={{ width: `${rate}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Questions */}
      <h2 className="font-semibold text-lg">問題ごとの結果</h2>
      <div className="space-y-3">
        {answers.map((a, i) => {
          const isCorrect = a.selected_answer === a.question.correct_answer
          return (
            <div key={a.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">問{i + 1}. {SUBJECT_LABELS[a.question.subject as Subject]}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  {isCorrect ? '正解' : '不正解'}
                </span>
              </div>
              <p className="text-sm mb-2 whitespace-pre-wrap">{a.question.question_text}</p>
              <div className="text-sm space-y-1">
                {(['a', 'b', 'c', 'd'] as AnswerChoice[]).map((c) => {
                  const optKey = `option_${c}` as keyof Question
                  const isC = c === a.question.correct_answer
                  const isS = c === a.selected_answer
                  return (
                    <div key={c} className={`p-1.5 rounded ${isC ? 'bg-success/10' : isS && !isC ? 'bg-danger/10' : ''}`}>
                      {c.toUpperCase()}. {a.question[optKey] as string}
                      {isC && ' ✓'}{isS && !isC && ' ✗'}
                    </div>
                  )
                })}
              </div>
              {a.question.explanation && (
                <div className="mt-2 p-2 rounded bg-bg-secondary text-sm">解説: {a.question.explanation}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
