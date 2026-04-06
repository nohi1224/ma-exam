'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { TestResult, TestSession, SUBJECT_LABELS, Subject } from '@/lib/database.types'

interface ResultWithSession extends TestResult {
  session: TestSession
}

export default function HistoryPage() {
  const supabase = createClient()
  const [results, setResults] = useState<ResultWithSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: sessions } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('finished_at', { ascending: false })

    if (!sessions || sessions.length === 0) {
      setLoading(false)
      return
    }

    const { data: resultRows } = await supabase
      .from('test_results')
      .select('*')
      .in('session_id', sessions.map(s => s.id))

    if (resultRows) {
      const sessionMap = new Map(sessions.map(s => [s.id, s]))
      setResults(
        resultRows
          .map(r => ({ ...r, session: sessionMap.get(r.session_id)! }))
          .filter(r => r.session)
          .sort((a, b) => new Date(b.session.finished_at!).getTime() - new Date(a.session.finished_at!).getTime())
      )
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">学習履歴</h1>

      {results.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-lg mb-2">まだテスト結果がありません</p>
          <div className="flex gap-4 justify-center mt-4">
            <Link href="/exam/start" className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">模擬試験</Link>
            <Link href="/practice/start" className="px-6 py-2 rounded-lg border border-border-color hover:bg-bg-secondary transition-colors">練習</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const rate = Math.round((r.total_score / r.total_questions) * 100)
            return (
              <Link
                key={r.id}
                href={`/history/${r.session_id}`}
                className="block p-5 rounded-xl bg-card-bg border border-border-color hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {r.session.mode === 'exam' ? '模擬試験' : `練習（${SUBJECT_LABELS[r.session.subject_filter as Subject] || '全科目'}）`}
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      {new Date(r.session.finished_at!).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {r.total_score}/{r.total_questions}問正解
                      {r.contraindicated_count > 0 && ` | 禁忌肢: ${r.contraindicated_count}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${r.is_passed ? 'text-success' : 'text-danger'}`}>
                      {rate}%
                    </div>
                    <div className={`text-sm ${r.is_passed ? 'text-success' : 'text-danger'}`}>
                      {r.is_passed ? '合格' : '不合格'}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
