-- RLSポリシーの修正

-- 1. 既存のポリシーを全削除
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

-- 2. RLSを一時的に無効化（テスト用）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 3. テーブルの状態を確認
SELECT 'profiles RLS' as table_name, relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'profiles'
UNION ALL
SELECT 'companies RLS' as table_name, relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'companies';

-- これで一旦RLSが無効化されます
-- サインアップをテストしてください
-- うまくいったら、次のステップでRLSを再度有効化します
