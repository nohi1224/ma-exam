'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LEARN_CATEGORIES } from '@/lib/learn-data'
import { generateQuiz, generateAllCategoryQuiz, QuizQuestion } from '@/lib/learn-quiz'

export default function LearnQuizPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'
  const [selectedSlug, setSelectedSlug] = useState<string>(initialCategory)
  const [questionCount, setQuestionCount] = useState(10)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<{ correct: boolean; question: QuizQuestion; selected: number }[]>([])

  const startQuiz = () => {
    const q = selectedSlug === 'all'
      ? generateAllCategoryQuiz(questionCount)
      : generateQuiz(selectedSlug, questionCount)

    if (q.length === 0) {
      alert('問題を生成できませんでした')
      return
    }
    setQuestions(q)
    setCurrentIndex(0)
    setScore(0)
    setSelectedOption(null)
    setRevealed(false)
    setFinished(false)
    setStarted(true)
    setAnswers([])
  }

  const handleSelect = (index: number) => {
    if (revealed) return
    setSelectedOption(index)
    setRevealed(true)
    const isCorrect = index === questions[currentIndex].correctIndex
    if (isCorrect) setScore(s => s + 1)
    setAnswers(prev => [...prev, { correct: isCorrect, question: questions[currentIndex], selected: index }])
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedOption(null)
      setRevealed(false)
    } else {
      setFinished(true)
    }
  }

  // Start screen
  if (!started) {
    return (
      <div className="max-w-lg mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">知識テスト</h1>
          <Link href="/learn" className="text-sm text-primary hover:underline">← ライブラリ</Link>
        </div>

        <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">カテゴリを選択</label>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedSlug('all')}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedSlug === 'all' ? 'border-primary bg-primary/10' : 'border-border-color hover:border-primary/50'
                }`}
              >
                <div className="font-medium">全カテゴリ</div>
                <div className="text-xs text-text-secondary mt-0.5">全分野からランダム出題</div>
              </button>
              {LEARN_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedSlug(cat.slug)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedSlug === cat.slug ? 'border-primary bg-primary/10' : 'border-border-color hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{cat.icon} {cat.title}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">問題数</label>
            <div className="flex gap-3">
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`flex-1 py-2 rounded-lg border-2 font-medium transition-colors ${
                    questionCount === n ? 'border-primary bg-primary/10' : 'border-border-color hover:border-primary/50'
                  }`}
                >
                  {n}問
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium text-lg hover:bg-primary-hover transition-colors"
          >
            テスト開始
          </button>
        </div>
      </div>
    )
  }

  // Result screen
  if (finished) {
    const rate = Math.round((score / questions.length) * 100)
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">テスト結果</h1>

        <div className={`p-8 rounded-xl border-2 text-center ${
          rate >= 70 ? 'border-success bg-success/5' : 'border-danger bg-danger/5'
        }`}>
          <div className={`text-4xl font-bold ${rate >= 70 ? 'text-success' : 'text-danger'}`}>
            {rate}%
          </div>
          <div className="text-text-secondary mt-2">{score} / {questions.length} 問正解</div>
        </div>

        {/* Answers detail */}
        <div className="space-y-3">
          {answers.map((a, i) => (
            <div key={i} className={`p-4 rounded-xl border ${a.correct ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium">問{i + 1}. {a.question.section}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${a.correct ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  {a.correct ? '正解' : '不正解'}
                </span>
              </div>
              <p className="text-sm mb-2">{a.question.question}</p>
              <div className="space-y-1 text-sm">
                {a.question.options.map((opt, oi) => {
                  const isCorrectOpt = oi === a.question.correctIndex
                  const isSelectedOpt = oi === a.selected
                  return (
                    <div key={oi} className={`p-1.5 rounded ${
                      isCorrectOpt ? 'bg-success/10 font-medium' : isSelectedOpt && !isCorrectOpt ? 'bg-danger/10' : ''
                    }`}>
                      {String.fromCharCode(65 + oi)}. {opt}
                      {isCorrectOpt && ' ✓'}
                      {isSelectedOpt && !isCorrectOpt && ' ✗'}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => { setStarted(false); setFinished(false) }}
            className="flex-1 py-3 rounded-xl border border-border-color bg-card-bg hover:bg-bg-secondary transition-colors font-medium"
          >
            設定に戻る
          </button>
          <button
            onClick={startQuiz}
            className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors font-medium"
          >
            もう一度
          </button>
        </div>
      </div>
    )
  }

  // Quiz screen
  const current = questions[currentIndex]

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span>問 {currentIndex + 1} / {questions.length}</span>
        <span className="text-text-secondary">{current.category} / {current.section}</span>
      </div>
      <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-card-bg border border-border-color rounded-xl p-6 space-y-6">
        <p className="text-lg leading-relaxed">{current.question}</p>

        <div className="space-y-3">
          {current.options.map((option, i) => {
            let borderClass = 'border-border-color hover:border-primary/50'
            if (revealed) {
              if (i === current.correctIndex) borderClass = 'border-success bg-success/10'
              else if (i === selectedOption && i !== current.correctIndex) borderClass = 'border-danger bg-danger/10'
              else borderClass = 'border-border-color opacity-60'
            } else if (i === selectedOption) {
              borderClass = 'border-primary bg-primary/10'
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${borderClass}`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                {option}
                {revealed && i === current.correctIndex && ' ✓'}
                {revealed && i === selectedOption && i !== current.correctIndex && ' ✗'}
              </button>
            )
          })}
        </div>

        {revealed && (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
          >
            {currentIndex < questions.length - 1 ? '次の問題へ' : '結果を見る'}
          </button>
        )}
      </div>

      {/* Score indicator */}
      <div className="text-center text-sm text-text-secondary">
        現在のスコア: {score} / {currentIndex + (revealed ? 1 : 0)}
      </div>
    </div>
  )
}
