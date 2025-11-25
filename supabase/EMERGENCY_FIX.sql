-- ================================================
-- 緊急修正SQL
-- ================================================
-- auth.usersに関連する全ての問題を解決します
-- ================================================

-- ステップ1: auth.usersの全トリガーを削除
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth'
      AND event_object_table = 'users'
      AND trigger_name NOT LIKE 'pg_%'
      AND trigger_name NOT LIKE 'RI_%'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON auth.users CASCADE';
  END LOOP;
END $$;

-- ステップ2: profilesテーブルの全トリガーを削除
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table = 'profiles'
      AND trigger_name NOT LIKE 'pg_%'
      AND trigger_name NOT LIKE 'RI_%'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON profiles CASCADE';
  END LOOP;
END $$;

-- ステップ3: 既存の全ユーザーデータを削除
DELETE FROM profiles;
DELETE FROM auth.users;

-- ステップ4: profilesテーブルのRLSポリシーを全削除
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles CASCADE';
  END LOOP;
END $$;

-- ステップ5: companiesテーブルのRLSポリシーを全削除
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'companies'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON companies CASCADE';
  END LOOP;
END $$;

-- ステップ6: 全テーブルのRLSを完全に無効化
ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS knowledge_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS uploaded_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document_chunks DISABLE ROW LEVEL SECURITY;

-- ステップ7: 確認
SELECT 'トリガー削除完了' AS status;

SELECT
  event_object_table,
  COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND trigger_name NOT LIKE 'pg_%'
  AND trigger_name NOT LIKE 'RI_%'
GROUP BY event_object_table;

SELECT '全ユーザー削除完了' AS status;
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as remaining_profiles FROM profiles;

SELECT 'セットアップ完了！サインアップを試してください' AS final_status;
　