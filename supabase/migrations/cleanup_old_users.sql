-- 古いユーザーデータのクリーンアップ
-- このSQLは、profilesテーブルにレコードがない古いユーザーを削除します

-- 実行前の確認: 古いユーザー数を確認
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN 'プロフィールなし' ELSE 'プロフィールあり' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;

-- ===========================================
-- オプション1: プロフィールがないユーザーを削除
-- ===========================================
-- 注意: このSQLを実行すると、古いユーザーのデータが完全に削除されます
-- 削除されたユーザーは再登録が必要になります

-- 実行する場合は、以下のコメントを外してください
-- DELETE FROM auth.users
-- WHERE id NOT IN (SELECT id FROM profiles);

-- ===========================================
-- オプション2: 全ユーザーを削除（開発環境のみ）
-- ===========================================
-- 注意: 全てのユーザーとデータが削除されます

-- 実行する場合は、以下のコメントを外してください
-- DELETE FROM auth.users;

-- ===========================================
-- オプション3: 古いユーザーにデフォルト企業を割り当て
-- ===========================================
-- 既存ユーザーを削除せず、デフォルトの企業とプロフィールを作成します

-- 1. デフォルト企業を作成（既に存在する場合はスキップ）
INSERT INTO companies (name, normalized_name)
VALUES ('移行ユーザー', 'いこうゆーざー')
ON CONFLICT (normalized_name) DO NOTHING;

-- 2. プロフィールがないユーザーに対してプロフィールを作成
INSERT INTO profiles (id, company_id, user_name)
SELECT
  u.id,
  (SELECT id FROM companies WHERE normalized_name = 'いこうゆーざー'),
  '移行ユーザー'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 確認: 全ユーザーがプロフィールを持っているか確認
SELECT
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;
