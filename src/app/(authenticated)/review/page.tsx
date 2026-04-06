'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Subject, SUBJECT_LABELS } from '@/lib/database.types'

export default function ReviewPage() {
  const router = useRouter()
  const supabase = createClient()
  const [wrongCounts, setWrongCounts] = useState<Record<Subject, number>>({
    ma_practice: 0, finance_tax: 0, legal: 0, ethics: 0,
  })
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all')

  useEffect(() => {
    loadWrongQuestions()
  }, [])

  async function loadWrongQuestions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get all completed sessions
    const { data: sessions } = await supabase
      .from('test_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!sessions || sessions.length === 0) {
      setLoading(false)
      return
    }

    // Get all wrong answers
    const { data: wrongAnswers } = await supabase
      .from('answers')
      .select('question_id')
      .in('session_id', sessions.map(s => s.id))
      .not('selected_answer', 'is', null)

    if (!wrongAnswers) {
      setLoading(false)
      return
    }

    // Get the questions and check which were wrong
    const questionIds = [...new Set(wrongAnswers.map(a => a.question_id))]
    if (questionIds.length === 0) {
      setLoading(false)
      return
    }

    // We need to check answers against correct answers
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('question_id, selected_answer')
      .in('session_id', sessions.map(s => s.id))
      .not('selected_answer', 'is', null)

    const { data: questions } = await supabase
      .from('questions')
      .select('id, subject, correct_answer')
      .in('id', questionIds)

    if (!allAnswers || !questions) {
      setLoading(false)
      return
    }

    const qMap = new Map(questions.map(q => [q.id, q]))
    const wrongIds = new Set<string>()

    for (const ans of allAnswers) {
      const q = qMap.get(ans.question_id)
      if (q && ans.selected_answer !== q.correct_answer) {
        wrongIds.add(ans.question_id)
      }
    }

    const counts: Record<Subject, number> = { ma_practice: 0, finance_tax: 0, legal: 0, ethics: 0 }
    for (const qid of wrongIds) {
      const q = qMap.get(qid)
      if (q) counts[q.subject as Subject]++
    }
    setWrongCounts(counts)
    setLoading(false)
  }

  const totalWrong = Object.values(wrongCounts).reduce((a, b) => a + b, 0)

  const startReview = async () => {
    setStarting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get completed sessions
    const { data: sessions } = await supabase
      .from('test_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!sessions) return

    const { data: allAnswers } = await supabase
      .from('answers')
      .select('question_id, selected_answer')
      .in('session_id', sessions.map(s => s.id))
      .not('selected_answer', 'is', null)

    if (!allAnswers) return

    const questionIds = [...new Set(allAnswers.map(a => a.question_id))]
    let query = supabase.from('questions').select('id, subject, correct_answer').in('id', questionIds)
    if (selectedSubject !== 'all') {
      query = query.eq('subject', selectedSubject)
    }
    const { data: questions } = await query

    if (!questions) return

    const qMap = new Map(questions.map(q => [q.id, q]))
    const wrongIds = new Set<string>()
    for (const ans of allAnswers) {
      const q = qMap.get(ans.question_id)
      if (q && ans.selected_answer !== q.correct_answer) wrongIds.add(ans.question_id)
    }

    const wrongQuestionIds = [...wrongIds].sort(() => Math.random() - 0.5).slice(0, 20)

    if (wrongQuestionIds.length === 0) {
      alert('復習する問題がありません')
      setStarting(false)
      return
    }

    const { data: session } = await supabase
      .from('test_sessions')
      .insert({
        user_id: user.id,
        mode: 'practice',
        subject_filter: selectedSubject === 'all' ? null : selectedSubject,
        total_questions: wrongQuestionIds.length,
        time_limit_seconds: null,
        status: 'in_progress',
      })
      .select()
      .single()

    if (!session) return

    const answerInserts = wrongQuestionIds.map((qid, i) => ({
      session_id: session.id,
      question_id: qid,
      question_order: i + 1,
      selected_answer: null,
      is_flagged: false,
      answered_at: null,
    }))

    await supabase.from('answers').insert(answerInserts)
    router.push(`/practice/${session.id}`)
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold">間違えた問題の復習</h1>

      {totalWrong === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg mb-2">間違えた問題はありません 🎉</p>
          <p>テストを受けて間違えた問題がここに表示されます。</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">間違えた問題数</h2>
            {(Object.entries(wrongCounts) as [Subject, number][]).map(([key, count]) => (
              <div key={key} className="flex justify-between text-sm">
                <span>{SUBJECT_LABELS[key]}</span>
                <span className={count > 0 ? 'text-danger font-medium' : 'text-text-secondary'}>{count}問</span>
              </div>
            ))}
            <div className="flex justify-between font-medium pt-2 border-t border-border-color">
              <span>合計</span>
              <span className="text-danger">{totalWrong}問</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">科目を絞り込み</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors ${
                  selectedSubject === 'all' ? 'border-primary bg-primary/10' : 'border-border-color'
                }`}
              >
                全科目
              </button>
              {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSubject(key)}
                  disabled={wrongCounts[key] === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors disabled:opacity-30 ${
                    selectedSubject === key ? 'border-primary bg-primary/10' : 'border-border-color'
                  }`}
                >
                  {label} ({wrongCounts[key]})
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startReview}
            disabled={starting}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium text-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {starting ? '準備中...' : '復習を開始する（最大20問）'}
          </button>
        </div>
      )}
    </div>
  )
}
