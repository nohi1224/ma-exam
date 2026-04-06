export type Subject = 'ma_practice' | 'finance_tax' | 'legal' | 'ethics'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type AnswerChoice = 'a' | 'b' | 'c' | 'd'
export type TestMode = 'exam' | 'practice'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

export const SUBJECT_LABELS: Record<Subject, string> = {
  ma_practice: 'M&A実務',
  finance_tax: '財務・税務',
  legal: '法務',
  ethics: '倫理・行動規範',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '易',
  normal: '普通',
  hard: '難',
}

export const SUB_CATEGORIES: Record<Subject, string[]> = {
  ma_practice: [
    'M&A実務の基礎',
    '事前相談',
    '秘密保持契約',
    'アドバイザリー（仲介・FA）契約',
    'バリュエーション',
    'マッチング',
    '意向表明／基本合意',
    'DD（全体、個別）',
    '最終契約',
    'クロージング',
    'クロージング後（PMI）',
    '中小M&A市場動向',
    '中小企業政策',
  ],
  finance_tax: [
    '財務基礎',
    'スキームの初期的な検討（財務上の留意事項）',
    'バリュエーション',
    '財務DD',
    '最終契約',
    '税務基礎',
    'スキームの初期的な検討（税務上の留意事項）',
    '税務DD',
    '最終契約（税務）',
  ],
  legal: [
    '法務基礎（関連法令の基本）',
    '秘密保持契約',
    'アドバイザリー（仲介・FA）契約',
    '意向表明／基本合意',
    '最終契約',
    'クロージング',
    'リスク／係争',
  ],
  ethics: [
    '使命',
    '仲介・FAの選定等',
    '基本原則',
    '善管注意義務・職業倫理',
    '広告・営業',
    '品位',
    '法令等の遵守',
    '不適切な個人・組織、反社等との関係',
    '情報管理',
    'その他禁止行為',
    '支援機関向けの基本姿勢',
  ],
}

export interface Question {
  id: string
  subject: Subject
  sub_category: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: AnswerChoice
  contraindicated_option: AnswerChoice | null
  explanation: string | null
  difficulty: Difficulty
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  is_admin: boolean
  created_at: string
}

export interface TestSession {
  id: string
  user_id: string
  mode: TestMode
  subject_filter: Subject | null
  total_questions: number
  started_at: string
  finished_at: string | null
  time_limit_seconds: number | null
  status: SessionStatus
}

export interface Answer {
  id: string
  session_id: string
  question_id: string
  question_order: number
  selected_answer: AnswerChoice | null
  is_flagged: boolean
  answered_at: string | null
}

export interface TestResult {
  id: string
  session_id: string
  total_score: number
  total_questions: number
  ma_practice_score: number
  ma_practice_total: number
  finance_tax_score: number
  finance_tax_total: number
  legal_score: number
  legal_total: number
  ethics_score: number
  ethics_total: number
  contraindicated_count: number
  is_passed: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at'>
        Update: Partial<Omit<Question, 'id' | 'created_at'>>
        Relationships: []
      }
      test_sessions: {
        Row: TestSession
        Insert: Omit<TestSession, 'id' | 'started_at'>
        Update: Partial<Omit<TestSession, 'id' | 'started_at'>>
        Relationships: []
      }
      answers: {
        Row: Answer
        Insert: Omit<Answer, 'id'>
        Update: Partial<Omit<Answer, 'id'>>
        Relationships: []
      }
      test_results: {
        Row: TestResult
        Insert: Omit<TestResult, 'id' | 'created_at'>
        Update: Partial<Omit<TestResult, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
