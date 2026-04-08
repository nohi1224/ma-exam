'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminLearnImportPage() {
  const supabase = createClient()
  const [jsonText, setJsonText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ categories: number; items: number; errors: string[] } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJsonText(ev.target?.result as string)
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    setResult(null)
    const errors: string[] = []
    let catCount = 0
    let itemCount = 0

    try {
      const data = JSON.parse(jsonText)
      const categories = data.categories || []
      const items = data.items || []

      // Import categories
      for (const cat of categories) {
        const { error } = await supabase.from('learn_categories').upsert(
          { slug: cat.slug, title: cat.title, icon: cat.icon || '', description: cat.description || '', sort_order: cat.sort_order || 0 },
          { onConflict: 'slug' }
        )
        if (error) errors.push(`カテゴリ「${cat.title}」: ${error.message}`)
        else catCount++
      }

      // Fetch category IDs by slug
      const { data: catRows } = await supabase.from('learn_categories').select('id, slug')
      const slugToId = new Map(catRows?.map(c => [c.slug, c.id]) || [])

      // Import items in batches
      const batchSize = 50
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize).map((item: { category_slug: string; section?: string; label: string; value: string; note?: string; explanation?: string; sort_order?: number }) => {
          const catId = slugToId.get(item.category_slug)
          if (!catId) {
            errors.push(`アイテム「${item.label}」: カテゴリ「${item.category_slug}」が見つかりません`)
            return null
          }
          return {
            category_id: catId,
            section: item.section || '',
            label: item.label,
            value: item.value,
            note: item.note || '',
            explanation: item.explanation || '',
            sort_order: item.sort_order || 0,
          }
        }).filter(Boolean)

        if (batch.length > 0) {
          const { error } = await supabase.from('learn_items').insert(batch)
          if (error) errors.push(`バッチ${Math.floor(i / batchSize) + 1}: ${error.message}`)
          else itemCount += batch.length
        }
      }
    } catch (e) {
      errors.push(`JSONの解析に失敗: ${(e as Error).message}`)
    }

    setResult({ categories: catCount, items: itemCount, errors })
    setImporting(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">知識データ一括インポート</h1>
        <Link href="/admin/learn" className="text-sm text-primary hover:underline">← 知識管理</Link>
      </div>

      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">JSONファイルをアップロード</label>
          <input type="file" accept=".json" onChange={handleFileUpload}
            className="block w-full text-sm border border-border-color rounded-lg p-2 bg-background" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">または直接JSON入力</label>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} rows={12}
            placeholder={`{
  "categories": [
    { "slug": "example", "title": "タイトル", "icon": "📊", "description": "説明", "sort_order": 0 }
  ],
  "items": [
    { "category_slug": "example", "section": "セクション名", "label": "項目名", "value": "数値", "note": "備考", "explanation": "解説文", "sort_order": 0 }
  ]
}`}
            className="w-full px-3 py-2 rounded-lg border border-border-color bg-background font-mono text-sm" />
        </div>

        <button onClick={handleImport} disabled={importing || !jsonText.trim()}
          className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors disabled:opacity-50">
          {importing ? 'インポート中...' : 'インポート実行'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${result.errors.length > 0 ? 'bg-warning/10 border border-warning/30' : 'bg-success/10 border border-success/30'}`}>
            <p className="font-medium">カテゴリ {result.categories}件、アイテム {result.items}件をインポートしました</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-danger">{result.errors.length}件のエラー:</p>
                <ul className="text-sm text-text-secondary mt-1 space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => <li key={i}>• {err}</li>)}
                  {result.errors.length > 10 && <li>...他 {result.errors.length - 10}件</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
