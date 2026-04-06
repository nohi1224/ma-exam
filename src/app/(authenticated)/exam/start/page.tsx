'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Subject, SUBJECT_LABELS } from '@/lib/database.types'

// Exam distribution: M&A 35-40%, Finance 20-23%, Legal 17-18%, Ethics 25%
const EXAM_DISTRIBUTION: Record<Subject, number> = {
  ma_practice: 22,
  finance_tax: 13,
  legal: 10,
  ethics: 15,
}

export default function ExamStartPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const startExam = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch questions by subject with proper distribution
    const allQuestions: { id: string; subject: string }[] = []

    for (const [subject, count] of Object.entries(EXAM_DISTRIBUTION)) {
      const { data } = await supabase
        .from('questions')
        .select('id, subject')
        .eq('subject', subject)
        .limit(count * 3) // Fetch more to randomize

      if (data && data.length > 0) {
        // Shuffle and take required count
        const shuffled = data.sort(() => Math.random() - 0.5)
        allQuestions.push(...shuffled.slice(0, Math.min(count, data.length)))
      }
    }

    if (allQuestions.length === 0) {
      alert('問題が登録されていません。管理者に連絡してください。')
      setLoading(false)
      return
    }

    // Shuffle all questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        user_id: user.id,
        mode: 'exam',
        subject_filter: null,
        total_questions: shuffled.length,
        time_limit_seconds: 7200, // 120 minutes
        status: 'in_progress',
      })
      .select()
      .single()

    if (sessionError || !session) {
      alert('セッションの作成に失敗しました')
      setLoading(false)
      return
    }

    // Create answer records
    const answers = shuffled.map((q, i) => ({
      session_id: session.id,
      question_id: q.id,
      question_order: i + 1,
      selected_answer: null,
      is_flagged: false,
      answered_at: null,
    }))

    await supabase.from('answers').insert(answers)

    router.push(`/exam/${session.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">模擬試験</h1>

      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">試験概要</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border-color">
              <span className="text-text-secondary">設問数</span>
              <span className="font-medium">60問</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-color">
              <span className="text-text-secondary">試験時間</span>
              <span className="font-medium">120分</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-color">
              <span className="text-text-secondary">合格基準</span>
              <span className="font-medium">総得点70%以上 + 各科目50%以上</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">出題割合</h3>
          <div className="space-y-2">
            {(Object.entries(EXAM_DISTRIBUTION) as [Subject, number][]).map(([subject, count]) => (
              <div key={subject} className="flex justify-between text-sm py-1">
                <span>{SUBJECT_LABELS[subject]}</span>
                <span className="text-text-secondary">{count}問</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-sm">
          <p className="font-semibold text-warning mb-1">注意事項</p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            <li>制限時間終了時に自動で提出されます</li>
            <li>途中で中断した場合は再開できます</li>
            <li>倫理・行動規範科目には禁忌肢が含まれます</li>
            <li>禁忌肢を一定数以上選択すると不合格になります</li>
          </ul>
        </div>

        <button
          onClick={startExam}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary text-white font-medium text-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? '問題を準備中...' : '試験を開始する'}
        </button>
      </div>
    </div>
  )
}
