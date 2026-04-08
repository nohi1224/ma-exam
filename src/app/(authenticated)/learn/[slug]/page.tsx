'use client'

import { use } from 'react'
import Link from 'next/link'
import { LEARN_CATEGORIES } from '@/lib/learn-data'

export default function LearnCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const category = LEARN_CATEGORIES.find((c) => c.slug === slug)

  if (!category) {
    return (
      <div className="text-center py-20 text-text-secondary">
        <p className="text-lg mb-4">カテゴリが見つかりません</p>
        <Link href="/learn" className="text-primary hover:underline">← 一覧に戻る</Link>
      </div>
    )
  }

  // Navigation between categories
  const currentIndex = LEARN_CATEGORIES.findIndex((c) => c.slug === slug)
  const prev = currentIndex > 0 ? LEARN_CATEGORIES[currentIndex - 1] : null
  const next = currentIndex < LEARN_CATEGORIES.length - 1 ? LEARN_CATEGORIES[currentIndex + 1] : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/learn" className="text-sm text-primary hover:underline">← M&A知識ライブラリ</Link>
      </div>

      <div>
        <div className="text-3xl mb-2">{category.icon}</div>
        <h1 className="text-2xl font-bold">{category.title}</h1>
        <p className="text-text-secondary mt-2">{category.description}</p>
      </div>

      {category.sections.map((section, si) => (
        <section key={si} className="bg-card-bg border border-border-color rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-color bg-bg-secondary">
            <h2 className="font-semibold">{section.title}</h2>
          </div>
          <div className="divide-y divide-border-color">
            {section.rows.map((row, ri) => (
              <div key={ri} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                <div className="sm:w-2/5 font-medium text-sm">{row.label}</div>
                <div className="sm:w-1/4 text-primary font-semibold text-sm">{row.value}</div>
                <div className="sm:w-1/3 text-text-secondary text-xs">{row.note}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Prev / Next navigation */}
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
