-- 知識ライブラリ用テーブル（既存DBに追加実行してください）

-- カテゴリ
CREATE TABLE learn_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 知識アイテム
CREATE TABLE learn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES learn_categories(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL DEFAULT '',
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  explanation TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_learn_items_category ON learn_items(category_id);

-- RLS
ALTER TABLE learn_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE learn_items ENABLE ROW LEVEL SECURITY;

-- 全ユーザー読み取り可
CREATE POLICY "Anyone can read learn_categories" ON learn_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read learn_items" ON learn_items FOR SELECT USING (true);

-- 管理者のみ書き込み
CREATE POLICY "Admins can insert learn_categories" ON learn_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update learn_categories" ON learn_categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete learn_categories" ON learn_categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert learn_items" ON learn_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update learn_items" ON learn_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete learn_items" ON learn_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
