import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-color px-4 h-14 flex items-center justify-between max-w-7xl mx-auto w-full">
        <span className="font-bold text-lg text-primary">M&A模擬テスト</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm rounded-lg border border-border-color hover:bg-bg-secondary transition-colors">
            ログイン
          </Link>
          <Link href="/signup" className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">
            新規登録
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            中小M&A資格試験<br />模擬テスト
          </h1>
          <p className="text-text-secondary text-lg">
            本番形式の模擬試験で実力を測り、科目別練習で弱点を克服。
            採点・解説・学習履歴で効率的に試験対策を進めましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-3 rounded-lg bg-primary text-white text-lg font-medium hover:bg-primary-hover transition-colors">
              無料で始める
            </Link>
            <Link href="/login" className="px-8 py-3 rounded-lg border border-border-color text-lg font-medium hover:bg-bg-secondary transition-colors">
              ログイン
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            <div className="p-6 rounded-xl bg-card-bg border border-border-color">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold mb-2">本番形式の模擬試験</h3>
              <p className="text-sm text-text-secondary">60問・120分のタイマー付き。科目別出題割合も本番に準拠。</p>
            </div>
            <div className="p-6 rounded-xl bg-card-bg border border-border-color">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">詳細な採点・分析</h3>
              <p className="text-sm text-text-secondary">科目別得点率、禁忌肢判定、合否判定をグラフで可視化。</p>
            </div>
            <div className="p-6 rounded-xl bg-card-bg border border-border-color">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold mb-2">効率的な復習</h3>
              <p className="text-sm text-text-secondary">間違えた問題だけを再出題。学習進捗も一目で確認。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
