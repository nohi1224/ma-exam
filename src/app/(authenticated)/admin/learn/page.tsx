'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Category {
  id: string
  slug: string
  title: string
  icon: string
  description: string
  sort_order: number
  item_count?: number
}

interface Item {
  id: string
  category_id: string
  section: string
  label: string
  value: string
  note: string
  explanation: string
  sort_order: number
}

export default function AdminLearnPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  // Category form
  const [showCatForm, setShowCatForm] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [catForm, setCatForm] = useState({ slug: '', title: '', icon: '', description: '', sort_order: 0 })

  // Item form
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({ section: '', label: '', value: '', note: '', explanation: '', sort_order: 0 })

  useEffect(() => { loadCategories() }, [])
  useEffect(() => { if (selectedCatId) loadItems(selectedCatId) }, [selectedCatId])

  async function loadCategories() {
    const { data } = await supabase.from('learn_categories').select('*').order('sort_order')
    if (data) {
      // Count items per category
      const { data: itemCounts } = await supabase.from('learn_items').select('category_id')
      const counts = new Map<string, number>()
      itemCounts?.forEach(i => counts.set(i.category_id, (counts.get(i.category_id) || 0) + 1))
      setCategories(data.map(c => ({ ...c, item_count: counts.get(c.id) || 0 })))
    }
    setLoading(false)
  }

  async function loadItems(categoryId: string) {
    const { data } = await supabase.from('learn_items').select('*').eq('category_id', categoryId).order('sort_order')
    if (data) setItems(data)
  }

  // Category CRUD
  const saveCat = async () => {
    if (!catForm.title || !catForm.slug) { alert('タイトルとスラッグは必須です'); return }
    if (editingCatId) {
      await supabase.from('learn_categories').update(catForm).eq('id', editingCatId)
    } else {
      await supabase.from('learn_categories').insert(catForm)
    }
    setShowCatForm(false); setEditingCatId(null)
    setCatForm({ slug: '', title: '', icon: '', description: '', sort_order: 0 })
    loadCategories()
  }

  const editCat = (c: Category) => {
    setCatForm({ slug: c.slug, title: c.title, icon: c.icon, description: c.description, sort_order: c.sort_order })
    setEditingCatId(c.id); setShowCatForm(true)
  }

  const deleteCat = async (id: string) => {
    if (!confirm('このカテゴリと全アイテムを削除しますか？')) return
    await supabase.from('learn_categories').delete().eq('id', id)
    if (selectedCatId === id) { setSelectedCatId(null); setItems([]) }
    loadCategories()
  }

  // Item CRUD
  const saveItem = async () => {
    if (!itemForm.label || !itemForm.value) { alert('項目名と数値は必須です'); return }
    if (editingItemId) {
      await supabase.from('learn_items').update({ ...itemForm, category_id: selectedCatId }).eq('id', editingItemId)
    } else {
      await supabase.from('learn_items').insert({ ...itemForm, category_id: selectedCatId })
    }
    setShowItemForm(false); setEditingItemId(null)
    setItemForm({ section: '', label: '', value: '', note: '', explanation: '', sort_order: 0 })
    loadItems(selectedCatId!)
    loadCategories()
  }

  const editItem = (item: Item) => {
    setItemForm({ section: item.section, label: item.label, value: item.value, note: item.note, explanation: item.explanation, sort_order: item.sort_order })
    setEditingItemId(item.id); setShowItemForm(true)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('learn_items').delete().eq('id', id)
    loadItems(selectedCatId!)
    loadCategories()
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-text-secondary">読み込み中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">知識ライブラリ管理</h1>
        <div className="flex gap-3">
          <Link href="/admin/learn/import" className="px-4 py-2 rounded-lg border border-border-color hover:bg-bg-secondary transition-colors text-sm">
            一括インポート
          </Link>
          <button onClick={() => { setShowCatForm(true); setEditingCatId(null); setCatForm({ slug: '', title: '', icon: '', description: '', sort_order: categories.length }) }}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover transition-colors">
            カテゴリ追加
          </button>
        </div>
      </div>

      {/* Category form */}
      {showCatForm && (
        <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{editingCatId ? 'カテゴリ編集' : 'カテゴリ追加'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">タイトル</label>
              <input value={catForm.title} onChange={e => setCatForm({ ...catForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">スラッグ（URL用）</label>
              <input value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" placeholder="e.g. social-insurance" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">アイコン</label>
              <input value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" placeholder="e.g. 🏥" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">並び順</label>
              <input type="number" value={catForm.sort_order} onChange={e => setCatForm({ ...catForm, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">説明</label>
            <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" />
          </div>
          <div className="flex gap-3">
            <button onClick={saveCat} className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">{editingCatId ? '更新' : '作成'}</button>
            <button onClick={() => { setShowCatForm(false); setEditingCatId(null) }} className="px-6 py-2 rounded-lg border border-border-color hover:bg-bg-secondary transition-colors">キャンセル</button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(c => (
          <div key={c.id} className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedCatId === c.id ? 'border-primary bg-primary/5' : 'border-border-color bg-card-bg hover:border-primary/50'}`}
            onClick={() => setSelectedCatId(c.id)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{c.icon} {c.title}</div>
                <div className="text-xs text-text-secondary mt-1">{c.item_count || 0}項目</div>
              </div>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); editCat(c) }} className="text-xs px-2 py-1 rounded border border-border-color hover:bg-bg-secondary">編集</button>
                <button onClick={(e) => { e.stopPropagation(); deleteCat(c.id) }} className="text-xs px-2 py-1 rounded border border-danger/30 text-danger hover:bg-danger/10">削除</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Items for selected category */}
      {selectedCatId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {categories.find(c => c.id === selectedCatId)?.icon} {categories.find(c => c.id === selectedCatId)?.title} のアイテム
            </h2>
            <button onClick={() => { setShowItemForm(true); setEditingItemId(null); setItemForm({ section: '', label: '', value: '', note: '', explanation: '', sort_order: items.length }) }}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover transition-colors">
              アイテム追加
            </button>
          </div>

          {/* Item form */}
          {showItemForm && (
            <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">{editingItemId ? 'アイテム編集' : 'アイテム追加'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">セクション名</label>
                  <input value={itemForm.section} onChange={e => setItemForm({ ...itemForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" placeholder="e.g. 狭義の社会保険" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">並び順</label>
                  <input type="number" value={itemForm.sort_order} onChange={e => setItemForm({ ...itemForm, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">項目名</label>
                <input value={itemForm.label} onChange={e => setItemForm({ ...itemForm, label: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">数値・目安</label>
                <input value={itemForm.value} onChange={e => setItemForm({ ...itemForm, value: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">備考</label>
                <input value={itemForm.note} onChange={e => setItemForm({ ...itemForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">解説文</label>
                <textarea value={itemForm.explanation} onChange={e => setItemForm({ ...itemForm, explanation: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border-color bg-background" placeholder="M&A実務でどのように使われるか、なぜ重要かを解説..." />
              </div>
              <div className="flex gap-3">
                <button onClick={saveItem} className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">{editingItemId ? '更新' : '作成'}</button>
                <button onClick={() => { setShowItemForm(false); setEditingItemId(null) }} className="px-6 py-2 rounded-lg border border-border-color hover:bg-bg-secondary transition-colors">キャンセル</button>
              </div>
            </div>
          )}

          {/* Items list */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">アイテムがまだありません</div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-card-bg border border-border-color">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                        <span className="px-2 py-0.5 rounded bg-bg-secondary">{item.section || '(セクションなし)'}</span>
                        <span>#{item.sort_order}</span>
                      </div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-sm text-primary font-semibold">{item.value}</div>
                      {item.note && <div className="text-xs text-text-secondary mt-1">{item.note}</div>}
                      {item.explanation && (
                        <div className="text-xs text-text-secondary mt-1 p-2 bg-bg-secondary rounded">
                          解説: {item.explanation.slice(0, 100)}{item.explanation.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => editItem(item)} className="text-xs px-2 py-1 rounded border border-border-color hover:bg-bg-secondary">編集</button>
                      <button onClick={() => deleteItem(item.id)} className="text-xs px-2 py-1 rounded border border-danger/30 text-danger hover:bg-danger/10">削除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
