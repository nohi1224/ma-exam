'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface ImportQuestion {
  subject: string
  sub_category: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  contraindicated_option?: string | null
  explanation?: string
  difficulty?: string
}

export default function AdminImportPage() {
  const supabase = createClient()
  const [jsonText, setJsonText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setJsonText(ev.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImporting(true)
    setResult(null)

    let questions: ImportQuestion[]
    try {
      questions = JSON.parse(jsonText)
      if (!Array.isArray(questions)) throw new Error('配列形式のJSONを入力してください')
    } catch (e) {
      setResult({ success: 0, errors: [`JSONの解析に失敗しました: ${(e as Error).message}`] })
      setImporting(false)
      return
    }

    const errors: string[] = []
    let success = 0
    const validSubjects = ['ma_practice', 'finance_tax', 'legal', 'ethics']
    const validAnswers = ['a', 'b', 'c', 'd']
    const validDifficulties = ['easy', 'normal', 'hard']

    // Process in batches of 50
    const batchSize = 50
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      const validBatch = []

      for (let j = 0; j < batch.length; j++) {
        const q = batch[j]
        const idx = i + j + 1

        if (!validSubjects.includes(q.subject)) {
          errors.push(`問題${idx}: 無効な科目 "${q.subject}"`)
          continue
        }
        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
          errors.push(`問題${idx}: 必須項目が不足`)
          continue
        }
        if (!validAnswers.includes(q.correct_answer)) {
          errors.push(`問題${idx}: 無効な正解 "${q.correct_answer}"`)
          continue
        }

        validBatch.push({
          subject: q.subject,
          sub_category: q.sub_category || '',
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          contraindicated_option: q.contraindicated_option && validAnswers.includes(q.contraindicated_option) ? q.contraindicated_option : null,
          explanation: q.explanation || null,
          difficulty: q.difficulty && validDifficulties.includes(q.difficulty) ? q.difficulty : 'normal',
        })
      }

      if (validBatch.length > 0) {
        const { error } = await supabase.from('questions').insert(validBatch)
        if (error) {
          errors.push(`バッチ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        } else {
          success += validBatch.length
        }
      }
    }

    setResult({ success, errors })
    setImporting(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">問題一括インポート</h1>
        <Link href="/admin/questions" className="text-sm text-primary hover:underline">← 問題管理</Link>
      </div>

      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">JSONファイルをアップロード</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm border border-border-color rounded-lg p-2 bg-background"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">または直接JSON入力</label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
            placeholder={`[
  {
    "subject": "ma_practice",
    "sub_category": "M&A実務の基礎",
    "question_text": "問題文...",
    "option_a": "選択肢A",
    "option_b": "選択肢B",
    "option_c": "選択肢C",
    "option_d": "選択肢D",
    "correct_answer": "a",
    "contraindicated_option": null,
    "explanation": "解説文...",
    "difficulty": "normal"
  }
]`}
            className="w-full px-3 py-2 rounded-lg border border-border-color bg-background font-mono text-sm"
          />
        </div>

        <button
          onClick={handleImport}
          disabled={importing || !jsonText.trim()}
          className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {importing ? 'インポート中...' : 'インポート実行'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${result.errors.length > 0 ? 'bg-warning/10 border border-warning/30' : 'bg-success/10 border border-success/30'}`}>
            <p className="font-medium">{result.success}問をインポートしました</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-danger">{result.errors.length}件のエラー:</p>
                <ul className="text-sm text-text-secondary mt-1 space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {result.errors.length > 10 && <li>...他 {result.errors.length - 10}件</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Format reference */}
      <div className="bg-card-bg border border-border-color rounded-xl p-6">
        <h2 className="font-semibold mb-3">JSON形式の仕様</h2>
        <div className="text-sm space-y-2 text-text-secondary">
          <p><code className="bg-bg-secondary px-1 rounded">subject</code>: <code>ma_practice</code>, <code>finance_tax</code>, <code>legal</code>, <code>ethics</code></p>
          <p><code className="bg-bg-secondary px-1 rounded">correct_answer</code>: <code>a</code>, <code>b</code>, <code>c</code>, <code>d</code></p>
          <p><code className="bg-bg-secondary px-1 rounded">contraindicated_option</code>: <code>a</code>〜<code>d</code> または <code>null</code>（禁忌肢がない場合）</p>
          <p><code className="bg-bg-secondary px-1 rounded">difficulty</code>: <code>easy</code>, <code>normal</code>, <code>hard</code>（省略時: normal）</p>
        </div>
      </div>
    </div>
  )
}
