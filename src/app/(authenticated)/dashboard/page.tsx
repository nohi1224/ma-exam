'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { TestResult, TestSession, SUBJECT_LABELS, Subject } from '@/lib/database.types'

export default function DashboardPage() {
  const supabase = createClient()
  const [recentResults, setRecentResults] = useState<(TestResult & { session: TestSession })[]>([])
  const [stats, setStats] = useState({ totalTests: 0, avgScore: 0, passRate: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Recent results
    const { data: sessions } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('finished_at', { ascending: false })
      .limit(5)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      const { data: results } = await supabase
        .from('test_results')
        .select('*')
        .in('session_id', sessionIds)

      if (results) {
        const merged = results.map(r => ({
          ...r,
          session: sessions.find(s => s.id === r.session_id)!,
        }))
        setRecentResults(merged)

        const totalTests = results.length
        const avgScore = totalTests > 0
          ? results.reduce((sum, r) => sum + (r.total_score / r.total_questions) * 100, 0) / totalTests
          : 0
        const passRate = totalTests > 0
          ? (results.filter(r => r.is_passed).length / totalTests) * 100
          : 0
        setStats({ totalTests, avgScore: Math.round(avgScore), passRate: Math.round(passRate) })
      }
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/exam/start" className="p-6 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors">
          <div className="text-2xl mb-2">📝</div>
          <div className="font-semibold">模擬試験を受ける</div>
          <div className="text-sm opacity-80 mt-1">60問・120分の本番形式</div>
        </Link>
        <Link href="/practice/start" className="p-6 rounded-xl bg-card-bg border border-border-color hover:border-primary transition-colors">
          <div className="text-2xl mb-2">💪</div>
          <div className="font-semibold">科目別練習</div>
          <div className="text-sm text-text-secondary mt-1">科目を選んで練習</div>
        </Link>
        <Link href="/review" className="p-6 rounded-xl bg-card-bg border border-border-color hover:border-primary transition-colors">
          <div className="text-2xl mb-2">🔄</div>
          <div className="font-semibold">間違えた問題を復習</div>
          <div className="text-sm text-text-secondary mt-1">弱点を克服</div>
        </Link>
        <Link href="/history" className="p-6 rounded-xl bg-card-bg border border-border-color hover:border-primary transition-colors">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold">学習履歴</div>
          <div className="text-sm text-text-secondary mt-1">過去の成績を確認</div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-card-bg border border-border-color">
          <div className="text-sm text-text-secondary">受験回数</div>
          <div className="text-3xl font-bold mt-1">{stats.totalTests}</div>
        </div>
        <div className="p-6 rounded-xl bg-card-bg border border-border-color">
          <div className="text-sm text-text-secondary">平均得点率</div>
          <div className="text-3xl font-bold mt-1">{stats.avgScore}%</div>
        </div>
        <div className="p-6 rounded-xl bg-card-bg border border-border-color">
          <div className="text-sm text-text-secondary">合格率</div>
          <div className="text-3xl font-bold mt-1">{stats.passRate}%</div>
        </div>
      </div>

      {/* Recent results */}
      {recentResults.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">最近のテスト結果</h2>
          <div className="space-y-3">
            {recentResults.map((result) => (
              <Link
                key={result.id}
                href={`/history/${result.session_id}`}
                className="block p-4 rounded-xl bg-card-bg border border-border-color hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {result.session.mode === 'exam' ? '模擬試験' : `練習（${SUBJECT_LABELS[result.session.subject_filter as Subject] || '全科目'}）`}
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      {new Date(result.session.finished_at!).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${result.is_passed ? 'text-success' : 'text-danger'}`}>
                      {Math.round((result.total_score / result.total_questions) * 100)}%
                    </div>
                    <div className={`text-sm ${result.is_passed ? 'text-success' : 'text-danger'}`}>
                      {result.is_passed ? '合格' : '不合格'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentResults.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-lg mb-2">まだテスト結果がありません</p>
          <p>模擬試験または科目別練習を始めてみましょう！</p>
        </div>
      )}
    </div>
  )
}
