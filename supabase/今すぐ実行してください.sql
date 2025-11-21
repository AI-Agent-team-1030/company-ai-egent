-- ============================================
-- 🚨 今すぐSupabaseで実行してください
-- ============================================
-- 重複レコードを削除してUNIQUE制約を追加します

-- 1. 現在の状態を確認
SELECT '========== 現在のデータ ==========' as status;
SELECT id, key, value, user_id, created_at, updated_at
FROM app_settings
ORDER BY key, created_at DESC;

-- 2. 重複レコードを削除（古いものを削除、最新だけ残す）
SELECT '========== 重複を削除中... ==========' as status;

DELETE FROM app_settings
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY key, user_id ORDER BY updated_at DESC NULLS LAST, created_at DESC) as rn
    FROM app_settings
  ) t
  WHERE rn > 1
);

-- 3. 削除後の状態を確認
SELECT '========== 削除後のデータ ==========' as status;
SELECT id, key, value, user_id, created_at, updated_at
FROM app_settings
ORDER BY key, created_at DESC;

-- 4. UNIQUE制約を追加
SELECT '========== UNIQUE制約を追加中... ==========' as status;

ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_key_user_id_key;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_key_user_id_key UNIQUE (key, user_id);

-- 5. インデックスを作成
CREATE INDEX IF NOT EXISTS idx_app_settings_key_user_id ON app_settings(key, user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- 6. 完了確認
SELECT '========== 完了！ ==========' as status;
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'app_settings' AND constraint_type = 'UNIQUE';

SELECT '✅ UNIQUE制約が追加されました！' as result;
