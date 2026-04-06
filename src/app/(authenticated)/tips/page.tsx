'use client'

export default function TipsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">試験攻略のコツ</h1>

      {/* 配点を意識した優先順位 */}
      <section className="bg-card-bg border border-border-color rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">1. 配点を意識した優先順位</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color">
                <th className="text-left py-2 pr-4">科目</th>
                <th className="text-left py-2 pr-4">出題割合</th>
                <th className="text-left py-2">戦略</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-color">
                <td className="py-2 pr-4 font-medium">M&A実務</td>
                <td className="py-2 pr-4">35〜40%（21〜24問）</td>
                <td className="py-2"><span className="text-primary font-medium">最重要。</span>ここで稼ぐのが合格の鍵</td>
              </tr>
              <tr className="border-b border-border-color">
                <td className="py-2 pr-4 font-medium">倫理・行動規範</td>
                <td className="py-2 pr-4">25%（15問）</td>
                <td className="py-2"><span className="text-danger font-medium">禁忌肢に注意。</span>確実に取る</td>
              </tr>
              <tr className="border-b border-border-color">
                <td className="py-2 pr-4 font-medium">財務・税務</td>
                <td className="py-2 pr-4">20〜23%（12〜14問）</td>
                <td className="py-2">計算問題は練習あるのみ</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">法務</td>
                <td className="py-2 pr-4">17〜18%（10〜11問）</td>
                <td className="py-2">契約条項の用語を正確に覚える</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 禁忌肢 */}
      <section className="bg-danger/5 border border-danger/30 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">2. 禁忌肢が最大のリスク</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-danger shrink-0">&#x26A0;</span>
            <span>倫理・行動規範科目に<strong>禁忌肢</strong>が複数設定されている</span>
          </li>
          <li className="flex gap-2">
            <span className="text-danger shrink-0">&#x26A0;</span>
            <span><strong>一定数の禁忌肢を選ぶとそれだけで不合格</strong>（他がどんなに良くても）</span>
          </li>
          <li className="flex gap-2">
            <span className="text-danger shrink-0">&#x26A0;</span>
            <span>禁忌肢は「明らかにガイドラインに違反する行為」</span>
          </li>
        </ul>
        <div className="bg-card-bg border border-border-color rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium">見分け方のポイント</p>
          <p className="text-text-secondary">迷ったら<strong>「依頼者の利益より自社の利益を優先する選択肢」は絶対に選ばない</strong></p>
          <ul className="text-text-secondary space-y-1 list-disc list-inside">
            <li>「成約を優先して情報を隠す」→ 禁忌肢</li>
            <li>「報酬のために問題を依頼者に伝えない」→ 禁忌肢</li>
            <li>「利害関係を開示せずにマッチングを進める」→ 禁忌肢</li>
          </ul>
        </div>
      </section>

      {/* 科目別最低基準 */}
      <section className="bg-warning/5 border border-warning/30 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">3. 科目別最低基準（50%）に注意</h2>
        <p className="text-sm">総合点が70%以上でも、<strong>1科目でも50%を切ると不合格</strong>になります。</p>
        <p className="text-sm text-text-secondary">苦手科目を放置しないこと。特に法務・財務は捨て科目にしないよう注意しましょう。</p>
      </section>

      {/* 科目別の頻出テーマ */}
      <section className="bg-card-bg border border-border-color rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold">4. 科目別の頻出テーマ</h2>

        <div className="space-y-2">
          <h3 className="font-medium text-primary">M&A実務 — プロセスの順序を正確に覚える</h3>
          <div className="bg-bg-secondary rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">M&Aプロセスの流れ（必ず覚える）</p>
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {['事前相談', 'NDA', 'アドバイザリー契約', 'バリュエーション', 'マッチング', '基本合意', 'DD', '最終契約', 'クロージング', 'PMI'].map((step, i) => (
                <span key={step}>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">{step}</span>
                  {i < 9 && <span className="mx-0.5">→</span>}
                </span>
              ))}
            </div>
          </div>
          <ul className="text-sm text-text-secondary list-disc list-inside">
            <li>株式譲渡 vs 事業譲渡の違い（鉄板の出題テーマ）</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-primary">財務・税務 — 計算問題のパターンを押さえる</h3>
          <div className="bg-bg-secondary rounded-lg p-4 text-sm space-y-2 font-mono">
            <p><span className="text-text-secondary">FCF</span> = 営業利益 x (1-税率) + 減価償却費 - 設備投資 - 運転資本増加</p>
            <p><span className="text-text-secondary">DCF</span> = FCF &divide; WACC（永続の場合）</p>
            <p><span className="text-text-secondary">EBITDA</span> = 営業利益 + 減価償却費</p>
            <p><span className="text-text-secondary">運転資本</span> = 売上債権 + 棚卸資産 - 仕入債務</p>
          </div>
          <ul className="text-sm text-text-secondary list-disc list-inside">
            <li>個人の株式譲渡益は約20%（申告分離課税）</li>
            <li>法人の株式譲渡益は約30%（法人税・総合課税）</li>
            <li>事業譲渡ののれんは税務上5年均等償却</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-primary">法務 — 契約用語を正確に</h3>
          <div className="bg-bg-secondary rounded-lg p-4 text-sm space-y-1">
            <p><strong>表明保証</strong> + <strong>補償（インデムニティ）</strong>はセットで出題</p>
            <p><strong>コベナンツ</strong> = 契約〜クロージング間の遵守事項</p>
            <p><strong>MAC条項</strong> = 重大な悪影響で取引中止可能</p>
            <p><strong>COC条項</strong> = 支配権変動で契約解除可能</p>
          </div>
          <ul className="text-sm text-text-secondary list-disc list-inside">
            <li>基本合意書で法的拘束力を持つのは「独占交渉権・秘密保持」</li>
            <li>事業譲渡には株主総会の特別決議が必要</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-primary">倫理・行動規範 — 中小M&Aガイドラインが全て</h3>
          <ul className="text-sm text-text-secondary list-disc list-inside space-y-1">
            <li><strong>善管注意義務</strong> = 依頼者の利益を最優先</li>
            <li><strong>利益相反</strong>は必ず開示する</li>
            <li>士業の独占業務に踏み込まない（弁護士法72条、税理士法52条）</li>
            <li>セカンドオピニオンの取得を妨げない</li>
            <li>M&A以外の選択肢も含めて情報提供する</li>
          </ul>
        </div>
      </section>

      {/* 時間配分 */}
      <section className="bg-card-bg border border-border-color rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">5. 時間配分（120分 / 60問）</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">2分</div>
            <div className="text-sm text-text-secondary mt-1">1問あたりの目安</div>
          </div>
          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="text-2xl font-bold text-warning">10分</div>
            <div className="text-sm text-text-secondary mt-1">見直し時間を確保</div>
          </div>
          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="text-2xl font-bold text-success">🚩</div>
            <div className="text-sm text-text-secondary mt-1">迷ったらフラグで飛ばす</div>
          </div>
        </div>
        <ul className="text-sm text-text-secondary list-disc list-inside space-y-1">
          <li>迷う問題はフラグを付けて飛ばし、最後に見直す</li>
          <li>計算問題に時間を取られすぎない</li>
          <li>全問解き終えてから見直す余裕を作る</li>
        </ul>
      </section>

      {/* 学習法 */}
      <section className="bg-primary/5 border border-primary/30 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">6. このアプリでの効率的な学習法</h2>
        <div className="space-y-3">
          {[
            { step: 'Step 1', title: '科目別練習で全科目を一通り解く', desc: '各科目の出題傾向と自分の弱点を把握する', href: '/practice/start' },
            { step: 'Step 2', title: '間違えた問題を復習で繰り返す', desc: '同じ間違いを繰り返さないことが合格への近道', href: '/review' },
            { step: 'Step 3', title: '模擬試験で時間配分を練習', desc: '本番と同じ60問・120分で通しで解く', href: '/exam/start' },
            { step: 'Step 4', title: 'ダッシュボードで科目別正答率を確認', desc: '弱点科目を重点的に対策する', href: '/dashboard' },
          ].map(({ step, title, desc, href }) => (
            <a key={step} href={href} className="flex items-start gap-4 p-4 rounded-lg bg-card-bg border border-border-color hover:border-primary transition-colors">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded shrink-0">{step}</span>
              <div>
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-text-secondary mt-0.5">{desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
