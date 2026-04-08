export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  category: string
  section: string
}

interface LearnItem {
  label: string
  value: string
  section: string
  category_title?: string
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateQuestionsFromItems(
  items: LearnItem[],
  categoryTitle: string
): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const validItems = items.filter(r => r.value && r.value !== '—' && r.value !== '個別に判定')

  for (const item of validItems) {
    const otherValues = validItems
      .filter(r => r.label !== item.label && r.value !== item.value)
      .map(r => r.value)

    if (otherValues.length >= 3) {
      const distractors = shuffleArray(otherValues).slice(0, 3)
      const options = shuffleArray([item.value, ...distractors])
      questions.push({
        question: `「${item.label}」の数値・目安はどれか。`,
        options,
        correctIndex: options.indexOf(item.value),
        category: item.category_title || categoryTitle,
        section: item.section,
      })
    }

    const otherLabels = validItems
      .filter(r => r.label !== item.label && r.value !== item.value)
      .map(r => r.label)

    if (otherLabels.length >= 3) {
      const distractors = shuffleArray(otherLabels).slice(0, 3)
      const options = shuffleArray([item.label, ...distractors])
      questions.push({
        question: `「${item.value}」に該当する項目はどれか。`,
        options,
        correctIndex: options.indexOf(item.label),
        category: item.category_title || categoryTitle,
        section: item.section,
      })
    }
  }

  return shuffleArray(questions)
}
