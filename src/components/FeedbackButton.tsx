'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const FEEDBACK_TYPES = [
  { value: 'error_in_question', label: '問題文に誤りがある' },
  { value: 'error_in_answer', label: '正解・選択肢に誤りがある' },
  { value: 'error_in_explanation', label: '解説が不十分・誤りがある' },
  { value: 'unclear', label: '問題文が分かりにくい' },
  { value: 'other', label: 'その他' },
] as const

interface FeedbackButtonProps {
  questionId: string
}

export default function FeedbackButton({ questionId }: FeedbackButtonProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [feedbackType, setFeedbackType] = useState<string>('error_in_question')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('question_feedback').insert({
      question_id: questionId,
      user_id: user.id,
      feedback_type: feedbackType,
      comment: comment || null,
    })

    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => {
      setOpen(false)
      setSubmitted(false)
      setComment('')
      setFeedbackType('error_in_question')
    }, 1500)
  }

  if (submitted) {
    return (
      <div className="text-sm text-success font-medium py-1">
        報告を送信しました。ありがとうございます。
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
      >
        <span>&#x1F6A9;</span> 問題を報告
      </button>
    )
  }

  return (
    <div className="border border-border-color rounded-lg p-4 space-y-3 bg-bg-secondary">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">問題の報告</span>
        <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-foreground text-sm">
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {FEEDBACK_TYPES.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="feedback_type"
              value={value}
              checked={feedbackType === value}
              onChange={() => setFeedbackType(value)}
              className="accent-primary"
            />
            {label}
          </label>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="詳細を記入（任意）"
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-border-color bg-background text-sm"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {submitting ? '送信中...' : '送信'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 rounded-lg border border-border-color text-sm hover:bg-card-bg transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
