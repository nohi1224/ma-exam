'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Answer, Question, AnswerChoice, SUBJECT_LABELS, Subject } from '@/lib/database.types'
import { calculateResults } from '@/lib/scoring'

interface AnswerWithQuestion extends Answer {
  question: Question
}

export default function ExamSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(7200) // 120 min
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (loading || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loading])

  async function loadSession() {
    const { data: session } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session || session.status === 'completed') {
      router.push(`/exam/${sessionId}/result`)
      return
    }

    // Calculate remaining time
    if (session.time_limit_seconds && session.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
      const remaining = Math.max(0, session.time_limit_seconds - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        handleSubmit()
        return
      }
    }

    const { data: answerRows } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_order', { ascending: true })

    if (!answerRows) return

    const questionIds = answerRows.map(a => a.question_id)
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds)

    if (!questions) return

    const questionsMap = new Map(questions.map(q => [q.id, q]))
    const merged = answerRows.map(a => ({
      ...a,
      question: questionsMap.get(a.question_id)!,
    })).filter(a => a.question)

    setAnswers(merged)
    setLoading(false)
  }

  const selectAnswer = async (choice: AnswerChoice) => {
    const answer = answers[currentIndex]
    const updated = [...answers]
    updated[currentIndex] = { ...answer, selected_answer: choice }
    setAnswers(updated)

    await supabase
      .from('answers')
      .update({ selected_answer: choice, answered_at: new Date().toISOString() })
      .eq('id', answer.id)
  }

  const toggleFlag = async () => {
    const answer = answers[currentIndex]
    const newFlag = !answer.is_flagged
    const updated = [...answers]
    updated[currentIndex] = { ...answer, is_flagged: newFlag }
    setAnswers(updated)

    await supabase
      .from('answers')
      .update({ is_flagged: newFlag })
      .eq('id', answer.id)
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    // Calculate results
    const results = calculateResults(sessionId, answers)

    await supabase.from('test_results').insert(results)
    await supabase
      .from('test_sessions')
      .update({ status: 'completed', finished_at: new Date().toISOString() })
      .eq('id', sessionId)

    router.push(`/exam/${sessionId}/result`)
  }, [answers, sessionId, submitting])

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">問題を読み込み中...</div>
  }

  const current = answers[currentIndex]
  const answeredCount = answers.filter(a => a.selected_answer).length
  const flaggedCount = answers.filter(a => a.is_flagged).length

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Timer bar */}
      <div className="sticky top-14 z-40 bg-card-bg border border-border-color rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span>問 {currentIndex + 1} / {answers.length}</span>
          <span className="text-text-secondary">回答済: {answeredCount}</span>
          <span className="text-warning">🚩 {flaggedCount}</span>
        </div>
        <div className={`font-mono text-lg font-bold ${timeLeft < 300 ? 'text-danger' : ''}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question */}
      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-6">
        <div>
          <div className="text-xs text-text-secondary mb-2">
            {SUBJECT_LABELS[current.question.subject as Subject]} / {current.question.sub_category}
          </div>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{current.question.question_text}</p>
        </div>

        <div className="space-y-3">
          {(['a', 'b', 'c', 'd'] as AnswerChoice[]).map((choice) => {
            const optionKey = `option_${choice}` as keyof Question
            const isSelected = current.selected_answer === choice
            return (
              <button
                key={choice}
                onClick={() => selectAnswer(choice)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border-color hover:border-primary/50'
                }`}
              >
                <span className="font-semibold mr-2">{choice.toUpperCase()}.</span>
                {current.question[optionKey] as string}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            onClick={toggleFlag}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              current.is_flagged
                ? 'border-warning bg-warning/10 text-warning'
                : 'border-border-color hover:border-warning'
            }`}
          >
            🚩 {current.is_flagged ? 'フラグ解除' : 'フラグ'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-lg border border-border-color hover:bg-bg-secondary disabled:opacity-30 transition-colors"
            >
              前へ
            </button>
            {currentIndex < answers.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={() => {
                  const unanswered = answers.filter(a => !a.selected_answer).length
                  if (unanswered > 0 && !confirm(`未回答が${unanswered}問あります。提出しますか？`)) return
                  handleSubmit()
                }}
                disabled={submitting}
                className="px-6 py-2 rounded-lg bg-success text-white hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {submitting ? '提出中...' : '提出する'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question navigator */}
      <div className="bg-card-bg border border-border-color rounded-xl p-4">
        <div className="text-sm text-text-secondary mb-3">問題一覧</div>
        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-2">
          {answers.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                i === currentIndex
                  ? 'bg-primary text-white'
                  : a.is_flagged
                  ? 'bg-warning/20 text-warning border border-warning'
                  : a.selected_answer
                  ? 'bg-success/20 text-success'
                  : 'bg-bg-secondary text-text-secondary'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/20 inline-block" /> 回答済</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/20 border border-warning inline-block" /> フラグ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-bg-secondary inline-block" /> 未回答</span>
        </div>
      </div>
    </div>
  )
}
