'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface LearnCategory {
  id: string
  slug: string
  title: string
  icon: string
  description: string
}

interface LearnItem {
  id: string
  section: string
  label: string
  value: string
  note: string
  explanation: string
  sort_order: number
}

export default function LearnCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const supabase = createClient()
  const [category, setCategory] = useState<LearnCategory | null>(null)
  const [items, setItems] = useState<LearnItem[]>([])
  const [allCategories, setAllCategories] = useState<LearnCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [slug])

  async function loadData() {
    setLoading(true)
    const [catRes, allCatRes] = await Promise.all([
      supabase.from('learn_categories').select('*').eq('slug', slug).single(),
      supabase.from('learn_categories').select('*').order('sort_order', { ascending: true }),
    ])

    if (catRes.data) {
      setCategory(catRes.data)
      const { data: itemsData } = await supabase
        .from('learn_items')
        .select('*')
        .eq('category_id', catRes.data.id)
        .order('sort_order', { ascending: true })
      if (itemsData) setItems(itemsData)
    }
    if (allCatRes.data) setAllCategories(allCatRes.data)
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>
  }

  if (!category) {
    return (
      <div className="text-center py-20 text-text-secondary">
        <p className="text-lg mb-4">カテゴリが見つかりません</p>
        <Link href="/learn" className="text-primary hover:underline">← 一覧に戻る</Link>
      </div>
    )
  }

  // Group items by section
  const sections = new Map<string, LearnItem[]>()
  for (const item of items) {
    const key = item.section || '一般'
    if (!sections.has(key)) sections.set(key, [])
    sections.get(key)!.push(item)
  }

  // Prev/Next navigation
  const currentIndex = allCategories.findIndex(c => c.slug === slug)
  const prev = currentIndex > 0 ? allCategories[currentIndex - 1] : null
  const next = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/learn" className="text-sm text-primary hover:underline">← M&A知識ライブラリ</Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-3xl mb-2">{category.icon}</div>
          <h1 className="text-2xl font-bold">{category.title}</h1>
          <p className="text-text-secondary mt-2">{category.description}</p>
        </div>
        <Link
          href={`/learn/quiz?category=${slug}`}
          className="shrink-0 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          このカテゴリをテスト
        </Link>
      </div>

      {[...sections.entries()].map(([sectionTitle, sectionItems]) => (
        <section key={sectionTitle} className="bg-card-bg border border-border-color rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-color bg-bg-secondary">
            <h2 className="font-semibold">{sectionTitle}</h2>
          </div>
          <div className="divide-y divide-border-color">
            {sectionItems.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div
                  className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="sm:w-2/5 font-medium text-sm">{item.label}</div>
                  <div className="sm:w-1/4 text-primary font-semibold text-sm">{item.value}</div>
                  <div className="sm:w-1/3 text-text-secondary text-xs flex items-start justify-between gap-2">
                    <span>{item.note}</span>
                    {item.explanation && (
                      <span className="text-primary shrink-0">{expandedId === item.id ? '▲' : '▼'}</span>
                    )}
                  </div>
                </div>
                {expandedId === item.id && item.explanation && (
                  <div className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm leading-relaxed">
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Prev / Next */}
      <div className="flex gap-4 pt-4">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="flex-1 p-4 rounded-xl border border-border-color bg-card-bg hover:border-primary transition-colors">
            <div className="text-xs text-text-secondary">← 前のカテゴリ</div>
            <div className="font-medium text-sm mt-1">{prev.icon} {prev.title}</div>
          </Link>
        ) : <div className="flex-1" />}
        {next ? (
          <Link href={`/learn/${next.slug}`} className="flex-1 p-4 rounded-xl border border-border-color bg-card-bg hover:border-primary transition-colors text-right">
            <div className="text-xs text-text-secondary">次のカテゴリ →</div>
            <div className="font-medium text-sm mt-1">{next.title} {next.icon}</div>
          </Link>
        ) : <div className="flex-1" />}
      </div>
    </div>
  )
}
