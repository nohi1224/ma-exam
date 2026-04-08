'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface LearnCategory {
  id: string
  slug: string
  title: string
  icon: string
  description: string
  sort_order: number
}

export default function LearnPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<LearnCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('learn_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setCategories(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">M&A知識ライブラリ</h1>
        <p className="text-text-secondary mt-2">IT・Web・ベンチャー領域のM&Aに関する実務数値・指標をカテゴリ別にまとめています。</p>
      </div>

      {/* Quiz CTA */}
      <Link
        href="/learn/quiz"
        className="block p-6 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">知識テストに挑戦する</div>
            <div className="text-sm opacity-80 mt-1">カテゴリを選んで、数値・指標の知識をテスト。全カテゴリ横断も可能。</div>
          </div>
          <div className="text-3xl">📝</div>
        </div>
      </Link>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p>カテゴリがまだ登録されていません。</p>
          <Link href="/admin/learn" className="text-primary hover:underline mt-2 inline-block">管理画面で追加</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/learn/${cat.slug}`}
              className="p-5 rounded-xl bg-card-bg border border-border-color hover:border-primary transition-colors"
            >
              <div className="text-2xl mb-3">{cat.icon}</div>
              <h2 className="font-semibold mb-1">{cat.title}</h2>
              <p className="text-sm text-text-secondary">{cat.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
