-- ストレージポリシーの修正スクリプト
-- エラーが発生した場合の修正用

-- ===================================
-- 既存ポリシーの完全削除
-- ===================================

DO $$
BEGIN
  -- storage.objects の全ポリシーを削除
  DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

  -- 古い名前のポリシーも削除（念のため）
  DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;
  DROP POLICY IF EXISTS "Public access" ON storage.objects;

  RAISE NOTICE 'All existing policies dropped successfully';
END $$;

-- ===================================
-- documentsバケットの再作成
-- ===================================

-- バケットを一旦削除（データも削除されるので注意）
-- DELETE FROM storage.buckets WHERE id = 'documents';

-- バケットを作成（存在しない場合のみ）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===================================
-- 新しいポリシーの作成
-- ===================================

-- INSERT (アップロード) ポリシー
-- ファイルパスの形式: {user_id}/{timestamp}_{filename}
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- SELECT (閲覧・ダウンロード) ポリシー
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE (更新) ポリシー
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE (削除) ポリシー
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ===================================
-- 動作確認クエリ
-- ===================================

-- バケット設定の確認
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'documents';

-- ポリシーの確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%documents%'
ORDER BY policyname;

-- ===================================
-- トラブルシューティング
-- ===================================

-- もしエラーが出る場合は、以下を試してください：
--
-- 1. RLSが有効になっているか確認
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage';
--
-- 2. ポリシーが正しく作成されているか確認
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
--
-- 3. バケットが存在するか確認
-- SELECT * FROM storage.buckets WHERE id = 'documents';
--
-- 4. 手動でテストアップロード
-- INSERT INTO storage.objects (bucket_id, name, owner)
-- VALUES ('documents', '{your_user_id}/test.txt', '{your_user_id}');
