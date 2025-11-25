-- ナレッジフォルダとドキュメントアップロードの修正
-- Supabase SQL Editorで実行してください

-- 1. knowledge_foldersテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS knowledge_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES knowledge_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLSを無効化
ALTER TABLE knowledge_folders DISABLE ROW LEVEL SECURITY;

-- 3. インデックスを作成
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_user_id ON knowledge_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_parent_folder_id ON knowledge_folders(parent_folder_id);

-- 4. uploaded_documentsの既存の外部キー制約を削除（エラーを無視）
ALTER TABLE uploaded_documents DROP CONSTRAINT IF EXISTS uploaded_documents_folder_id_fkey;

-- 5. folder_idカラムを追加（存在しない場合）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploaded_documents' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE uploaded_documents ADD COLUMN folder_id UUID;
  END IF;
END $$;

-- 6. knowledge_foldersへの外部キー制約を追加
ALTER TABLE uploaded_documents
ADD CONSTRAINT uploaded_documents_folder_id_fkey
FOREIGN KEY (folder_id) REFERENCES knowledge_folders(id) ON DELETE SET NULL;

-- 7. インデックスを作成
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_folder_id ON uploaded_documents(folder_id);

SELECT '修正完了！ドキュメントのアップロードが可能になりました' AS status;
