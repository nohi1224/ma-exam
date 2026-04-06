'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { SUBJECT_LABELS, Subject } from '@/lib/database.types'

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  error_in_question: '問題文の誤り',
  error_in_answer: '正解・選択肢の誤り',
  error_in_explanation: '解説の不備・誤り',
  unclear: '問題文が分かりにくい',
  other: 'その他',
}

interface FeedbackItem {
  id: string
  feedback_type: string
  comment: string | null
  created_at: string
  question_id: string
  user_id: string
  question_text?: string
  question_subject?: string
  user_email?: string
}

export default function AdminFeedbackPage() {
  const supabase = createClient()
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeedbacks()
  }, [])

  async function loadFeedbacks() {
    const { data } = await supabase
      .from('question_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data && data.length > 0) {
      // Fetch question details
      const questionIds = [...new Set(data.map(f => f.question_id))]
      const { data: questions } = await supabase
        .from('questions')
        .select('id, question_text, subject')
        .in('id', questionIds)

      const qMap = new Map(questions?.map(q => [q.id, q]) || [])

      setFeedbacks(data.map(f => ({
        ...f,
        question_text: qMap.get(f.question_id)?.question_text || '(削除済み)',
        question_subject: qMap.get(f.question_id)?.subject || '',
      })))
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このフィードバックを削除しますか？')) return
    await supabase.from('question_feedback').delete().eq('id', id)
    setFeedbacks(feedbacks.filter(f => f.id !== id))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">フィードバック一覧</h1>
        <Link href="/admin/questions" className="text-sm text-primary hover:underline">← 問題管理</Link>
      </div>

      {feedbacks.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p>フィードバックはまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <div key={f.id} className="p-4 rounded-xl bg-card-bg border border-border-color">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      f.feedback_type.includes('error') ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                    }`}>
                      {FEEDBACK_TYPE_LABELS[f.feedback_type] || f.feedback_type}
                    </span>
                    {f.question_subject && (
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {SUBJECT_LABELS[f.question_subject as Subject] || f.question_subject}
                      </span>
                    )}
                    <span className="text-xs text-text-secondary">
                      {new Date(f.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary truncate mb-1">{f.question_text}</p>
                  {f.comment && (
                    <p className="text-sm bg-bg-secondary rounded p-2 mt-2">{f.comment}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="text-xs px-3 py-1 rounded border border-danger/30 text-danger hover:bg-danger/10 shrink-0"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
