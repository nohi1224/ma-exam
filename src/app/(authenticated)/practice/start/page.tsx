'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Subject, SUBJECT_LABELS } from '@/lib/database.types'

export default function PracticeStartPage() {
  const router = useRouter()
  const supabase = createClient()
  const [subject, setSubject] = useState<Subject>('ma_practice')
  const [questionCount, setQuestionCount] = useState(10)
  const [loading, setLoading] = useState(false)

  const startPractice = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('subject', subject)
      .limit(questionCount * 3)

    if (!questions || questions.length === 0) {
      alert('この科目の問題がまだ登録されていません。')
      setLoading(false)
      return
    }

    const shuffled = questions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(questionCount, questions.length))

    const { data: session, error } = await supabase
      .from('test_sessions')
      .insert({
        user_id: user.id,
        mode: 'practice',
        subject_filter: subject,
        total_questions: selected.length,
        time_limit_seconds: null,
        status: 'in_progress',
      })
      .select()
      .single()

    if (error || !session) {
      alert('セッション作成に失敗しました')
      setLoading(false)
      return
    }

    const answers = selected.map((q, i) => ({
      session_id: session.id,
      question_id: q.id,
      question_order: i + 1,
      selected_answer: null,
      is_flagged: false,
      answered_at: null,
    }))

    await supabase.from('answers').insert(answers)
    router.push(`/practice/${session.id}`)
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold">科目別練習</h1>

      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">科目を選択</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSubject(key)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  subject === key ? 'border-primary bg-primary/10' : 'border-border-color hover:border-primary/50'
                }`}
              >
                <div className="font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">問題数</label>
          <div className="flex gap-3">
            {[10, 20, 50].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`flex-1 py-2 rounded-lg border-2 font-medium transition-colors ${
                  questionCount === count ? 'border-primary bg-primary/10' : 'border-border-color hover:border-primary/50'
                }`}
              >
                {count}問
              </button>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-4 text-sm text-text-secondary">
          <p>練習モードでは1問ごとに正解と解説が表示されます。タイマーはありません。</p>
        </div>

        <button
          onClick={startPractice}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary text-white font-medium text-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? '準備中...' : '練習を開始する'}
        </button>
      </div>
    </div>
  )
}
