-- ============================================
-- データベースの状態を確認するSQL
-- ============================================
-- このSQLを実行して、データベースが正しく設定されているか確認できます

-- 1. テーブルの存在確認
SELECT
  'Tables' as check_category,
  table_name,
  'EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'app_settings',
    'knowledge_folders',
    'uploaded_documents',
    'document_chunks',
    'chat_conversations',
    'chat_messages'
  )
ORDER BY table_name;

-- 2. app_settingsテーブルの制約確認
SELECT
  'app_settings constraints' as check_category,
  constraint_name as name,
  constraint_type as status
FROM information_schema.table_constraints
WHERE table_name = 'app_settings'
ORDER BY constraint_type;

-- 3. app_settingsのRLSポリシー確認
SELECT
  'app_settings RLS policies' as check_category,
  policyname as name,
  cmd as status
FROM pg_policies
WHERE tablename = 'app_settings'
ORDER BY policyname;

-- 4. app_settingsのインデックス確認
SELECT
  'app_settings indexes' as check_category,
  indexname as name,
  indexdef as status
FROM pg_indexes
WHERE tablename = 'app_settings'
ORDER BY indexname;

-- 5. app_settingsテーブルのカラム確認
SELECT
  'app_settings columns' as check_category,
  column_name as name,
  data_type ||
  CASE
    WHEN is_nullable = 'NO' THEN ' NOT NULL'
    ELSE ''
  END as status
FROM information_schema.columns
WHERE table_name = 'app_settings'
ORDER BY ordinal_position;

-- 6. 現在のapp_settingsデータ確認（値は表示しない）
SELECT
  'app_settings data' as check_category,
  key as name,
  CASE
    WHEN value IS NOT NULL AND value != '' THEN 'HAS VALUE'
    ELSE 'EMPTY'
  END as status
FROM app_settings
WHERE user_id = auth.uid()
ORDER BY key;

-- 7. RLSが有効か確認
SELECT
  'RLS status' as check_category,
  tablename as name,
  CASE
    WHEN rowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'app_settings',
    'knowledge_folders',
    'uploaded_documents',
    'document_chunks',
    'chat_conversations',
    'chat_messages'
  )
ORDER BY tablename;

-- 完了メッセージ
SELECT '======================================' as result
UNION ALL
SELECT 'Database check completed!' as result
UNION ALL
SELECT '======================================' as result;
