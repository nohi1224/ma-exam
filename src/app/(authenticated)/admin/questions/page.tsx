'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Question, Subject, SUBJECT_LABELS, DIFFICULTY_LABELS, Difficulty, AnswerChoice, SUB_CATEGORIES } from '@/lib/database.types'

export default function AdminQuestionsPage() {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [filter, setFilter] = useState<Subject | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const emptyQuestion = {
    subject: 'ma_practice' as Subject,
    sub_category: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a' as AnswerChoice,
    contraindicated_option: null as AnswerChoice | null,
    explanation: '',
    difficulty: 'normal' as Difficulty,
  }

  const [form, setForm] = useState(emptyQuestion)

  useEffect(() => {
    loadQuestions()
  }, [filter])

  async function loadQuestions() {
    let query = supabase.from('questions').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('subject', filter)
    const { data } = await query.limit(200)
    if (data) setQuestions(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      alert('必須項目を入力してください')
      return
    }

    if (editingId) {
      await supabase.from('questions').update(form).eq('id', editingId)
    } else {
      await supabase.from('questions').insert(form)
    }

    setEditingId(null)
    setShowCreate(false)
    setForm(emptyQuestion)
    loadQuestions()
  }

  const handleEdit = (q: Question) => {
    setForm({
      subject: q.subject,
      sub_category: q.sub_category,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      contraindicated_option: q.contraindicated_option,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
    })
    setEditingId(q.id)
    setShowCreate(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この問題を削除しますか？')) return
    await supabase.from('questions').delete().eq('id', id)
    loadQuestions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">問題管理</h1>
        <div className="flex gap-3">
          <Link href="/admin/feedback" className="px-4 py-2 rounded-lg border border-warning/30 text-warning hover:bg-warning/10 transition-colors text-sm">
            フィードバック
          </Link>
          <Link href="/admin/import" className="px-4 py-2 rounded-lg border border-border-color hover:bg-bg-secondary transition-colors text-sm">
            一括インポート
          </Link>
          <button
            onClick={() => { setShowCreate(true); setEditingId(null); setForm(emptyQuestion) }}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover transition-colors"
          >
            新規作成
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm border-2 ${filter === 'all' ? 'border-primary bg-primary/10' : 'border-border-color'}`}>
          全て ({questions.length})
        </button>
        {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-lg text-sm border-2 ${filter === key ? 'border-primary bg-primary/10' : 'border-border-color'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Create/Edit form */}
      {showCreate && (
        <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{editingId ? '問題を編集' : '新規問題作成'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">科目</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value as Subject, sub_category: '' })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
              >
                {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">中項目</label>
              <select
                value={form.sub_category}
                onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
              >
                <option value="">選択してください</option>
                {SUB_CATEGORIES[form.subject].map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">難易度</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
              >
                {(Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">問題文</label>
            <textarea
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['a', 'b', 'c', 'd'] as AnswerChoice[]).map((choice) => (
              <div key={choice}>
                <label className="block text-sm font-medium mb-1">選択肢 {choice.toUpperCase()}</label>
                <input
                  value={form[`option_${choice}` as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [`option_${choice}`]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">正解</label>
              <select
                value={form.correct_answer}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value as AnswerChoice })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
              >
                {(['a', 'b', 'c', 'd'] as AnswerChoice[]).map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">禁忌肢（任意）</label>
              <select
                value={form.contraindicated_option || ''}
                onChange={(e) => setForm({ ...form, contraindicated_option: e.target.value ? e.target.value as AnswerChoice : null })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
              >
                <option value="">なし</option>
                {(['a', 'b', 'c', 'd'] as AnswerChoice[]).map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">解説</label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-background"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">
              {editingId ? '更新' : '作成'}
            </button>
            <button onClick={() => { setShowCreate(false); setEditingId(null) }} className="px-6 py-2 rounded-lg border border-border-color hover:bg-bg-secondary transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="text-center py-10 text-text-secondary">読み込み中...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10 text-text-secondary">問題がまだ登録されていません</div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="p-4 rounded-xl bg-card-bg border border-border-color">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">{SUBJECT_LABELS[q.subject]}</span>
                    <span>{q.sub_category}</span>
                    <span className="px-2 py-0.5 rounded bg-bg-secondary">{DIFFICULTY_LABELS[q.difficulty]}</span>
                    {q.contraindicated_option && <span className="px-2 py-0.5 rounded bg-danger/10 text-danger">禁忌肢あり</span>}
                  </div>
                  <p className="text-sm truncate">{q.question_text}</p>
                  <div className="text-xs text-text-secondary mt-1">正解: {q.correct_answer.toUpperCase()}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(q)} className="text-xs px-3 py-1 rounded border border-border-color hover:bg-bg-secondary">編集</button>
                  <button onClick={() => handleDelete(q.id)} className="text-xs px-3 py-1 rounded border border-danger/30 text-danger hover:bg-danger/10">削除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
