-- =====================================================
-- 中小M&A模擬テスト Supabase Migration
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ユーザープロフィール
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 問題マスタ
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL CHECK (subject IN ('ma_practice', 'finance_tax', 'legal', 'ethics')),
  sub_category TEXT NOT NULL DEFAULT '',
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  contraindicated_option CHAR(1) CHECK (contraindicated_option IN ('a', 'b', 'c', 'd')),
  explanation TEXT,
  difficulty TEXT DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- テストセッション
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('exam', 'practice')),
  subject_filter TEXT,
  total_questions INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  time_limit_seconds INT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- 回答記録
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  question_order INT NOT NULL,
  selected_answer CHAR(1) CHECK (selected_answer IN ('a', 'b', 'c', 'd')),
  is_flagged BOOLEAN DEFAULT false,
  answered_at TIMESTAMPTZ
);

-- テスト結果
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_score INT NOT NULL,
  total_questions INT NOT NULL,
  ma_practice_score INT DEFAULT 0,
  ma_practice_total INT DEFAULT 0,
  finance_tax_score INT DEFAULT 0,
  finance_tax_total INT DEFAULT 0,
  legal_score INT DEFAULT 0,
  legal_total INT DEFAULT 0,
  ethics_score INT DEFAULT 0,
  ethics_total INT DEFAULT 0,
  contraindicated_count INT DEFAULT 0,
  is_passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_test_sessions_user ON test_sessions(user_id);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
CREATE INDEX idx_answers_session ON answers(session_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_test_results_session ON test_results(session_id);

-- =====================================================
-- Row Level Security
-- =====================================================

-- profiles: 自分のみ読み書き
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- questions: 全ユーザー読み取り可、管理者のみ書き込み
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- test_sessions: 自分のデータのみ
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON test_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON test_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON test_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- answers: セッション所有者のみ
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON answers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM test_sessions WHERE id = answers.session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own answers"
  ON answers FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM test_sessions WHERE id = answers.session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own answers"
  ON answers FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM test_sessions WHERE id = answers.session_id AND user_id = auth.uid())
  );

-- test_results: セッション所有者のみ
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON test_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM test_sessions WHERE id = test_results.session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own results"
  ON test_results FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM test_sessions WHERE id = test_results.session_id AND user_id = auth.uid())
  );

-- =====================================================
-- Auto-create profile on signup (trigger)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 問題フィードバック
-- =====================================================
CREATE TABLE question_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('error_in_question', 'error_in_answer', 'error_in_explanation', 'unclear', 'other')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_question ON question_feedback(question_id);
CREATE INDEX idx_feedback_user ON question_feedback(user_id);

ALTER TABLE question_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON question_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON question_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON question_feedback FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete feedback"
  ON question_feedback FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
