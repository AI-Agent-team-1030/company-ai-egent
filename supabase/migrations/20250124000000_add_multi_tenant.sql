-- マルチテナント対応: 企業ごとのデータ分離
-- Version: 2.0
-- Date: 2025-01-24

-- =====================================
-- 1. 企業テーブル
-- =====================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                          -- 表示用企業名（例: ABC株式会社）
  normalized_name TEXT UNIQUE NOT NULL,        -- 正規化された企業名（検索用）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_companies_normalized_name ON companies(normalized_name);

-- =====================================
-- 2. プロフィールテーブル
-- =====================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_name TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_user_id ON profiles(id);

-- =====================================
-- 3. 既存テーブルに企業IDを追加
-- =====================================

-- knowledge_items テーブルが存在する場合のみ company_id を追加
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_items') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'knowledge_items' AND column_name = 'company_id') THEN
      ALTER TABLE knowledge_items ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_knowledge_items_company_id ON knowledge_items(company_id);
    END IF;
  END IF;
END $$;

-- chat_conversations テーブルが存在する場合のみ company_id を追加
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'company_id') THEN
      ALTER TABLE chat_conversations ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_chat_conversations_company_id ON chat_conversations(company_id);
    END IF;
  END IF;
END $$;

-- chat_messages テーブルが存在する場合のみ company_id を追加
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'company_id') THEN
      ALTER TABLE chat_messages ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_chat_messages_company_id ON chat_messages(company_id);
    END IF;
  END IF;
END $$;

-- folders テーブルが存在する場合のみ company_id を追加
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'folders') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'folders' AND column_name = 'company_id') THEN
      ALTER TABLE folders ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
      CREATE INDEX idx_folders_company_id ON folders(company_id);
    END IF;
  END IF;
END $$;

-- =====================================
-- 4. RLS (Row Level Security) ポリシー
-- =====================================

-- companies テーブルのRLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company"
ON companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- profiles テーブルのRLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- knowledge_items のRLSポリシーを更新
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_items')
     AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'knowledge_items' AND column_name = 'company_id') THEN

    DROP POLICY IF EXISTS "Users can view their own knowledge items" ON knowledge_items;
    DROP POLICY IF EXISTS "Users can create knowledge items" ON knowledge_items;
    DROP POLICY IF EXISTS "Users can update their own knowledge items" ON knowledge_items;
    DROP POLICY IF EXISTS "Users can delete their own knowledge items" ON knowledge_items;
    DROP POLICY IF EXISTS "Users can view knowledge items in their company" ON knowledge_items;
    DROP POLICY IF EXISTS "Users can create knowledge items in their company" ON knowledge_items;

    CREATE POLICY "Users can view knowledge items in their company"
    ON knowledge_items FOR SELECT
    USING (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    );

    CREATE POLICY "Users can create knowledge items in their company"
    ON knowledge_items FOR INSERT
    WITH CHECK (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND user_id = auth.uid()
    );

    CREATE POLICY "Users can update their own knowledge items"
    ON knowledge_items FOR UPDATE
    USING (user_id = auth.uid());

    CREATE POLICY "Users can delete their own knowledge items"
    ON knowledge_items FOR DELETE
    USING (user_id = auth.uid());
  END IF;
END $$;

-- chat_conversations のRLSポリシーを更新
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_conversations')
     AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'company_id') THEN

    DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can delete own conversations" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can view conversations in their company" ON chat_conversations;
    DROP POLICY IF EXISTS "Users can create conversations in their company" ON chat_conversations;

    CREATE POLICY "Users can view conversations in their company"
    ON chat_conversations FOR SELECT
    USING (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND user_id = auth.uid()
    );

    CREATE POLICY "Users can create conversations in their company"
    ON chat_conversations FOR INSERT
    WITH CHECK (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND user_id = auth.uid()
    );

    CREATE POLICY "Users can update own conversations"
    ON chat_conversations FOR UPDATE
    USING (user_id = auth.uid());

    CREATE POLICY "Users can delete own conversations"
    ON chat_conversations FOR DELETE
    USING (user_id = auth.uid());
  END IF;
END $$;

-- chat_messages のRLSポリシーを更新
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages')
     AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'company_id') THEN

    DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can create messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can view messages in their company" ON chat_messages;
    DROP POLICY IF EXISTS "Users can create messages in their company" ON chat_messages;

    CREATE POLICY "Users can view messages in their company"
    ON chat_messages FOR SELECT
    USING (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND user_id = auth.uid()
    );

    CREATE POLICY "Users can create messages in their company"
    ON chat_messages FOR INSERT
    WITH CHECK (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND user_id = auth.uid()
    );
  END IF;
END $$;

-- folders のRLSポリシーを更新
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'folders')
     AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'folders' AND column_name = 'company_id') THEN

    DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
    DROP POLICY IF EXISTS "Users can create folders" ON folders;
    DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
    DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;
    DROP POLICY IF EXISTS "Users can view folders in their company" ON folders;
    DROP POLICY IF EXISTS "Users can create folders in their company" ON folders;

    CREATE POLICY "Users can view folders in their company"
    ON folders FOR SELECT
    USING (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND user_id = auth.uid()
    );

    CREATE POLICY "Users can create folders in their company"
    ON folders FOR INSERT
    WITH CHECK (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
      AND user_id = auth.uid()
    );

    CREATE POLICY "Users can update their own folders"
    ON folders FOR UPDATE
    USING (user_id = auth.uid());

    CREATE POLICY "Users can delete their own folders"
    ON folders FOR DELETE
    USING (user_id = auth.uid());
  END IF;
END $$;

-- =====================================
-- 5. 関数: 企業名の正規化
-- =====================================

CREATE OR REPLACE FUNCTION normalize_company_name(company_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(company_name, '株式会社|（株）|\(株\)|有限会社|合同会社', '', 'gi'),
        '\s+', '', 'g'
      ),
      '[　]', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================
-- 6. サンプルデータ（開発用）
-- =====================================

-- 開発用の企業を1つ作成
INSERT INTO companies (name, normalized_name)
VALUES ('デモ株式会社', 'でも')
ON CONFLICT (normalized_name) DO NOTHING;

-- =====================================
-- 完了
-- =====================================

COMMENT ON TABLE companies IS '企業テーブル: 各企業の情報を管理';
COMMENT ON TABLE profiles IS 'プロフィールテーブル: ユーザーと企業の紐付け';
COMMENT ON COLUMN companies.normalized_name IS '正規化された企業名（検索・照合用）';
