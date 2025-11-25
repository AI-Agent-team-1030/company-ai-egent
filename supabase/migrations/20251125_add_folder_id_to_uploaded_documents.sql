-- uploaded_documentsテーブルにfolder_idカラムを追加するマイグレーション
-- knowledge_foldersテーブルを参照

-- 既存の外部キー制約を削除（存在する場合）
ALTER TABLE uploaded_documents DROP CONSTRAINT IF EXISTS uploaded_documents_folder_id_fkey;

-- folder_idカラムを追加（既に存在する場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploaded_documents' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE uploaded_documents
    ADD COLUMN folder_id UUID;
  END IF;
END $$;

-- knowledge_foldersテーブルへの外部キー制約を追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uploaded_documents_folder_id_fkey'
    AND table_name = 'uploaded_documents'
  ) THEN
    ALTER TABLE uploaded_documents
    ADD CONSTRAINT uploaded_documents_folder_id_fkey
    FOREIGN KEY (folder_id) REFERENCES knowledge_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_folder_id ON uploaded_documents(folder_id);

SELECT 'folder_idカラム追加完了（knowledge_foldersを参照）' AS status;
