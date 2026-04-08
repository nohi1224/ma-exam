'use client'

import Link from 'next/link'

const CATEGORIES = [
  {
    slug: 'social-insurance',
    title: '社会保険料率',
    description: '健康保険・厚生年金・雇用保険・労災保険の料率と会社負担の目安',
    icon: '🏥',
  },
  {
    slug: 'valuation',
    title: 'バリュエーション指標',
    description: 'EBITDAマルチプル・SaaS指標・EBITDA正規化調整の実務数値',
    icon: '📈',
  },
  {
    slug: 'labor-cost',
    title: '人件費・賃金関連',
    description: '賃上げ率・IT人材年収・採用コスト・退職率等の人事関連数値',
    icon: '💰',
  },
  {
    slug: 'inventory',
    title: '棚卸資産・在庫評価',
    description: 'EC事業の在庫評価掛目・回転率・返品率等の在庫関連指標',
    icon: '📦',
  },
  {
    slug: 'tax',
    title: '税率・税務',
    description: '法人税・消費税・株式譲渡税・印紙税等のM&A関連税務数値',
    icon: '🧾',
  },
  {
    slug: 'ec-it-kpi',
    title: 'EC・IT事業KPI',
    description: 'CVR・LTV・チャーンレート・NRR等のEC/SaaS/メディア事業指標',
    icon: '🎯',
  },
  {
    slug: 'contract-legal',
    title: 'M&A契約・法務',
    description: '補償条項の相場・競業避止義務・仲介手数料・プロセス所要期間',
    icon: '📋',
  },
  {
    slug: 'platform-fees',
    title: 'プラットフォーム手数料',
    description: 'Amazon・Shopify・楽天等のEC/決済/広告/物流の手数料一覧',
    icon: '🛒',
  },
  {
    slug: 'other-numbers',
    title: 'その他重要数値',
    description: 'WACC・会社法手続・下請法・個人情報保護法・インボイス制度',
    icon: '📊',
  },
]

export default function LearnPage() {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/learn/${cat.slug}`}
            className="p-5 rounded-xl bg-card-bg border border-border-color hover:border-primary transition-colors"
          >
            <div className="text-2xl mb-3">{cat.icon}</div>
            <h2 className="font-semibold mb-1">{cat.title}</h2>
            <p className="text-sm text-text-secondary">{cat.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
