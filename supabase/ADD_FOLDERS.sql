-- ============================================
-- フォルダ機能の追加
-- ============================================

-- Step 1: フォルダテーブルを作成
CREATE TABLE IF NOT EXISTS knowledge_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES knowledge_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_user_id ON knowledge_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_parent ON knowledge_folders(parent_folder_id);

-- Step 2: uploaded_documentsテーブルにfolder_idカラムを追加
ALTER TABLE uploaded_documents
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES knowledge_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_uploaded_documents_folder_id ON uploaded_documents(folder_id);

-- Step 3: RLSを有効化
ALTER TABLE knowledge_folders ENABLE ROW LEVEL SECURITY;

-- Step 4: RLSポリシーを作成
DROP POLICY IF EXISTS "Users can view their own folders" ON knowledge_folders;
CREATE POLICY "Users can view their own folders"
ON knowledge_folders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own folders" ON knowledge_folders;
CREATE POLICY "Users can insert their own folders"
ON knowledge_folders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own folders" ON knowledge_folders;
CREATE POLICY "Users can update their own folders"
ON knowledge_folders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own folders" ON knowledge_folders;
CREATE POLICY "Users can delete their own folders"
ON knowledge_folders FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: 更新トリガーを作成
DROP TRIGGER IF EXISTS update_knowledge_folders_updated_at ON knowledge_folders;
CREATE TRIGGER update_knowledge_folders_updated_at
  BEFORE UPDATE ON knowledge_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 完了！
