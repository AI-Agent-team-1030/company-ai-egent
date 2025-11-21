-- ============================================
-- 設定保存の問題を修正するSQL
-- ============================================
-- このSQLをSupabase SQL Editorで実行してください

-- 1. 既存の重複データを確認
SELECT key, user_id, COUNT(*) as count
FROM app_settings
GROUP BY key, user_id
HAVING COUNT(*) > 1;

-- 2. 重複がある場合、古いレコードを削除（最新のものだけ残す）
DELETE FROM app_settings
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY key, user_id ORDER BY updated_at DESC) as rn
    FROM app_settings
  ) t
  WHERE rn > 1
);

-- 3. 既存のUNIQUE制約を削除（存在する場合）
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_key_user_id_key;

-- 4. UNIQUE制約を追加
ALTER TABLE app_settings ADD CONSTRAINT app_settings_key_user_id_key UNIQUE (key, user_id);

-- 5. インデックスを作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_app_settings_key_user_id ON app_settings(key, user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- 6. RLSポリシーを確認・修正
DROP POLICY IF EXISTS "Users can view their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON app_settings;

-- SELECT policy
CREATE POLICY "Users can view their own settings"
ON app_settings FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert their own settings"
ON app_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update their own settings"
ON app_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete their own settings"
ON app_settings FOR DELETE
USING (auth.uid() = user_id);

-- 7. 結果を確認
SELECT
  'UNIQUE constraint' as check_type,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'app_settings' AND constraint_type = 'UNIQUE'
UNION ALL
SELECT
  'RLS policies' as check_type,
  policyname as constraint_name,
  cmd as constraint_type
FROM pg_policies
WHERE tablename = 'app_settings'
UNION ALL
SELECT
  'Indexes' as check_type,
  indexname as constraint_name,
  '' as constraint_type
FROM pg_indexes
WHERE tablename = 'app_settings';

-- 完了メッセージ
SELECT 'FIX completed successfully! Settings can now be saved.' AS status;
