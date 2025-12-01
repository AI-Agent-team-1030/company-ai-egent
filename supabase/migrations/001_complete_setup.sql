-- ============================================
-- 社内ナレッジ検索くん セットアップ
-- ============================================

-- エクステンション
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- テーブル作成
-- ============================================

-- アプリケーション設定
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, user_id)
);

-- ナレッジベース
CREATE TABLE IF NOT EXISTS knowledge (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- プロファイル
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- チャット会話
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- チャットメッセージ
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  referenced_knowledge_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- フォルダ
CREATE TABLE IF NOT EXISTS knowledge_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES knowledge_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ドキュメント
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  folder_id UUID REFERENCES knowledge_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ドキュメントチャンク
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES uploaded_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- インデックス
-- ============================================

CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_department ON knowledge(department);
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_folder_id ON uploaded_documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_user_id ON knowledge_folders(user_id);

-- ============================================
-- ストレージ
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_upload" ON storage.objects;
CREATE POLICY "storage_upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_select" ON storage.objects;
CREATE POLICY "storage_select" ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_update" ON storage.objects;
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
CREATE POLICY "app_settings_select" ON app_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "app_settings_insert" ON app_settings;
CREATE POLICY "app_settings_insert" ON app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "app_settings_update" ON app_settings;
CREATE POLICY "app_settings_update" ON app_settings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "app_settings_delete" ON app_settings;
CREATE POLICY "app_settings_delete" ON app_settings FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "knowledge_select" ON knowledge;
CREATE POLICY "knowledge_select" ON knowledge FOR SELECT USING (true);
DROP POLICY IF EXISTS "knowledge_insert" ON knowledge;
CREATE POLICY "knowledge_insert" ON knowledge FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "knowledge_update" ON knowledge;
CREATE POLICY "knowledge_update" ON knowledge FOR UPDATE USING (auth.role() = 'authenticated');

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_select" ON chat_conversations;
CREATE POLICY "conversations_select" ON chat_conversations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "conversations_insert" ON chat_conversations;
CREATE POLICY "conversations_insert" ON chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "conversations_update" ON chat_conversations;
CREATE POLICY "conversations_update" ON chat_conversations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "conversations_delete" ON chat_conversations;
CREATE POLICY "conversations_delete" ON chat_conversations FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON chat_messages;
CREATE POLICY "messages_select" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid())
);
DROP POLICY IF EXISTS "messages_insert" ON chat_messages;
CREATE POLICY "messages_insert" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_conversations WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid())
);

ALTER TABLE knowledge_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "folders_select" ON knowledge_folders;
CREATE POLICY "folders_select" ON knowledge_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "folders_insert" ON knowledge_folders;
CREATE POLICY "folders_insert" ON knowledge_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "folders_update" ON knowledge_folders;
CREATE POLICY "folders_update" ON knowledge_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "folders_delete" ON knowledge_folders;
CREATE POLICY "folders_delete" ON knowledge_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_select" ON uploaded_documents;
CREATE POLICY "documents_select" ON uploaded_documents FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "documents_insert" ON uploaded_documents;
CREATE POLICY "documents_insert" ON uploaded_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "documents_update" ON uploaded_documents;
CREATE POLICY "documents_update" ON uploaded_documents FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "documents_delete" ON uploaded_documents;
CREATE POLICY "documents_delete" ON uploaded_documents FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chunks_select" ON document_chunks;
CREATE POLICY "chunks_select" ON document_chunks FOR SELECT USING (
  EXISTS (SELECT 1 FROM uploaded_documents WHERE uploaded_documents.id = document_chunks.document_id AND uploaded_documents.user_id = auth.uid())
);
DROP POLICY IF EXISTS "chunks_insert" ON document_chunks;
CREATE POLICY "chunks_insert" ON document_chunks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM uploaded_documents WHERE uploaded_documents.id = document_chunks.document_id AND uploaded_documents.user_id = auth.uid())
);

-- ============================================
-- 関数
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- トリガー
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_updated_at ON knowledge;
CREATE TRIGGER update_knowledge_updated_at
  BEFORE UPDATE ON knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON chat_conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_folders_updated_at ON knowledge_folders;
CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON knowledge_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
