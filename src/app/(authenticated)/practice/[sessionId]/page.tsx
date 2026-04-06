'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Answer, Question, AnswerChoice, SUBJECT_LABELS, Subject } from '@/lib/database.types'
import { calculateResults } from '@/lib/scoring'

interface AnswerWithQuestion extends Answer {
  question: Question
}

export default function PracticeSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {
    const { data: session } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session || session.status === 'completed') {
      router.push(`/history/${sessionId}`)
      return
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

    const qMap = new Map(questions.map(q => [q.id, q]))
    setAnswers(answerRows.map(a => ({ ...a, question: qMap.get(a.question_id)! })).filter(a => a.question))
    setLoading(false)
  }

  const selectAnswer = async (choice: AnswerChoice) => {
    if (revealed) return
    const answer = answers[currentIndex]
    const updated = [...answers]
    updated[currentIndex] = { ...answer, selected_answer: choice }
    setAnswers(updated)

    await supabase
      .from('answers')
      .update({ selected_answer: choice, answered_at: new Date().toISOString() })
      .eq('id', answer.id)

    setRevealed(true)
  }

  const nextQuestion = async () => {
    if (currentIndex < answers.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setRevealed(false)
    } else {
      // Finish
      const results = calculateResults(sessionId, answers)
      await supabase.from('test_results').insert(results)
      await supabase
        .from('test_sessions')
        .update({ status: 'completed', finished_at: new Date().toISOString() })
        .eq('id', sessionId)
      router.push(`/history/${sessionId}`)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  }

  const current = answers[currentIndex]
  const isCorrect = current.selected_answer === current.question.correct_answer

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span>問 {currentIndex + 1} / {answers.length}</span>
        <span className="text-text-secondary">
          {SUBJECT_LABELS[current.question.subject as Subject]}
        </span>
      </div>
      <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / answers.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-6">
        <div>
          <div className="text-xs text-text-secondary mb-2">{current.question.sub_category}</div>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{current.question.question_text}</p>
        </div>

        <div className="space-y-3">
          {(['a', 'b', 'c', 'd'] as AnswerChoice[]).map((choice) => {
            const optKey = `option_${choice}` as keyof Question
            const isSelected = current.selected_answer === choice
            const isThisCorrect = choice === current.question.correct_answer
            const isThisContra = choice === current.question.contraindicated_option

            let borderClass = 'border-border-color hover:border-primary/50'
            if (revealed) {
              if (isThisCorrect) borderClass = 'border-success bg-success/10'
              else if (isSelected && !isThisCorrect) borderClass = 'border-danger bg-danger/10'
              else borderClass = 'border-border-color opacity-60'
            } else if (isSelected) {
              borderClass = 'border-primary bg-primary/10'
            }

            return (
              <button
                key={choice}
                onClick={() => selectAnswer(choice)}
                disabled={revealed}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${borderClass}`}
              >
                <span className="font-semibold mr-2">{choice.toUpperCase()}.</span>
                {current.question[optKey] as string}
                {revealed && isThisCorrect && ' ✓'}
                {revealed && isSelected && !isThisCorrect && ' ✗'}
                {revealed && isThisContra && ' ⚠️禁忌'}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div className="space-y-3">
            <div className={`p-4 rounded-lg ${isCorrect ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              <span className="font-bold">{isCorrect ? '正解！' : '不正解'}</span>
              <span className="ml-2">正解: {current.question.correct_answer.toUpperCase()}</span>
            </div>
            {current.question.explanation && (
              <div className="p-4 rounded-lg bg-bg-secondary text-sm">
                <span className="font-medium">解説: </span>{current.question.explanation}
              </div>
            )}
            <button
              onClick={nextQuestion}
              className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
            >
              {currentIndex < answers.length - 1 ? '次の問題へ' : '結果を見る'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
