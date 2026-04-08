import { LEARN_CATEGORIES, LearnCategory, DataSection } from './learn-data'

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  category: string
  section: string
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateQuestionsFromSection(
  category: LearnCategory,
  section: DataSection
): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const rows = section.rows.filter(r => r.value && r.value !== '—' && r.value !== '個別に判定')

  for (const row of rows) {
    // Type 1: "〇〇の数値は？"
    const otherValues = rows
      .filter(r => r.label !== row.label && r.value !== row.value)
      .map(r => r.value)

    if (otherValues.length >= 3) {
      const distractors = shuffleArray(otherValues).slice(0, 3)
      const options = shuffleArray([row.value, ...distractors])
      questions.push({
        question: `「${row.label}」の数値・目安はどれか。`,
        options,
        correctIndex: options.indexOf(row.value),
        category: category.title,
        section: section.title,
      })
    }

    // Type 2: "この数値はどの項目？"
    const otherLabels = rows
      .filter(r => r.label !== row.label && r.value !== row.value)
      .map(r => r.label)

    if (otherLabels.length >= 3) {
      const distractors = shuffleArray(otherLabels).slice(0, 3)
      const options = shuffleArray([row.label, ...distractors])
      questions.push({
        question: `「${row.value}」に該当する項目はどれか。`,
        options,
        correctIndex: options.indexOf(row.label),
        category: category.title,
        section: section.title,
      })
    }
  }

  return questions
}

export function generateQuiz(slug: string, count: number = 10): QuizQuestion[] {
  const category = LEARN_CATEGORIES.find(c => c.slug === slug)
  if (!category) return []

  const allQuestions: QuizQuestion[] = []
  for (const section of category.sections) {
    allQuestions.push(...generateQuestionsFromSection(category, section))
  }

  return shuffleArray(allQuestions).slice(0, Math.min(count, allQuestions.length))
}

export function generateAllCategoryQuiz(count: number = 20): QuizQuestion[] {
  const allQuestions: QuizQuestion[] = []
  for (const category of LEARN_CATEGORIES) {
    for (const section of category.sections) {
      allQuestions.push(...generateQuestionsFromSection(category, section))
    }
  }
  return shuffleArray(allQuestions).slice(0, Math.min(count, allQuestions.length))
}
