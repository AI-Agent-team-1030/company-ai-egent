-- ================================================
-- 完全リセット＆再構築SQL
-- ================================================
-- このSQLは全てのデータを削除し、ゼロから構築します
--
-- 実行手順:
-- 1. Supabaseダッシュボード → SQL Editor
-- 2. このSQLを全てコピー＆ペースト
-- 3. Runをクリック
-- ================================================

-- ================================================
-- ステップ1: 既存の全テーブルを削除
-- ================================================

DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS uploaded_documents CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS knowledge_items CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- 既存の関数も削除
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS normalize_company_name(TEXT) CASCADE;

-- auth.usersも削除（ユーザーデータを完全にクリア）
DELETE FROM auth.users;

-- ================================================
-- ステップ2: 拡張機能の有効化
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================
-- ステップ3: テーブル作成
-- ================================================

-- 3-1. 企業テーブル（最初に作成）
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  normalized_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE companies IS '企業テーブル';
COMMENT ON COLUMN companies.normalized_name IS '正規化された企業名（検索用）';

-- 3-2. プロフィールテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'ユーザープロフィールテーブル';

-- 3-3. アプリケーション設定テーブル
CREATE TABLE app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, user_id)
);

-- 3-4. フォルダーテーブル
CREATE TABLE folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('chat', 'knowledge', 'document')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3-5. ナレッジベーステーブル
CREATE TABLE knowledge_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3-6. チャット会話テーブル
CREATE TABLE chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3-7. チャットメッセージテーブル
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  referenced_knowledge_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3-8. アップロードドキュメントテーブル
CREATE TABLE uploaded_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3-9. ドキュメントチャンクテーブル
CREATE TABLE document_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ステップ4: インデックス作成
-- ================================================

-- companies
CREATE INDEX idx_companies_normalized_name ON companies(normalized_name);

-- profiles
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_user_id ON profiles(id);

-- app_settings
CREATE INDEX idx_app_settings_user_id ON app_settings(user_id);
CREATE INDEX idx_app_settings_key ON app_settings(key);

-- folders
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_company_id ON folders(company_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_type ON folders(type);

-- knowledge_items
CREATE INDEX idx_knowledge_items_user_id ON knowledge_items(user_id);
CREATE INDEX idx_knowledge_items_company_id ON knowledge_items(company_id);
CREATE INDEX idx_knowledge_items_folder_id ON knowledge_items(folder_id);
CREATE INDEX idx_knowledge_items_created_at ON knowledge_items(created_at DESC);

-- chat_conversations
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_company_id ON chat_conversations(company_id);
CREATE INDEX idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);

-- chat_messages
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_company_id ON chat_messages(company_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- uploaded_documents
CREATE INDEX idx_uploaded_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX idx_uploaded_documents_processed ON uploaded_documents(processed);
CREATE INDEX idx_uploaded_documents_created_at ON uploaded_documents(created_at DESC);

-- document_chunks
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_content ON document_chunks USING GIN(to_tsvector('english', content));

-- ================================================
-- ステップ5: RLS（Row Level Security）無効化（開発用）
-- ================================================
-- 開発中は一旦RLSを無効化します
-- 本番環境では後でRLSを有効化してください

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;

-- ================================================
-- ステップ6: 便利な関数を作成
-- ================================================

-- 6-1. 企業名の正規化関数
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

-- 6-2. updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ステップ7: トリガー作成
-- ================================================

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_items_updated_at
  BEFORE UPDATE ON knowledge_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ステップ8: 開発用デモデータ（オプション）
-- ================================================

-- デモ企業を作成
INSERT INTO companies (name, normalized_name)
VALUES ('デモ株式会社', 'でも')
ON CONFLICT (normalized_name) DO NOTHING;

-- ================================================
-- 完了確認
-- ================================================

SELECT 'セットアップ完了！' AS status;

-- テーブル一覧を表示
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
