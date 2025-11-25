# 古いユーザーデータのクリーンアップ手順

## 🔴 問題

企業名機能を追加する前に登録したユーザーは、`profiles` テーブルにレコードがありません。
そのため、新しいログイン画面で企業名を入力してもログインできません。

## 💡 解決方法（3つの選択肢）

### 方法1: 古いユーザーにデフォルト企業を割り当てる（推奨）

**メリット**: ユーザーデータを残したまま、新しいスキーマに対応できる
**デメリット**: デフォルトの企業名「移行ユーザー」が作成される

#### 手順

1. **Supabaseダッシュボードにアクセス**
   https://supabase.com/dashboard

2. **SQL Editorを開く**

3. **以下のSQLを実行**

```sql
-- 1. デフォルト企業を作成
INSERT INTO companies (name, normalized_name)
VALUES ('移行ユーザー', 'いこうゆーざー')
ON CONFLICT (normalized_name) DO NOTHING;

-- 2. プロフィールがないユーザーにプロフィールを作成
INSERT INTO profiles (id, company_id, user_name)
SELECT
  u.id,
  (SELECT id FROM companies WHERE normalized_name = 'いこうゆーざー'),
  '移行ユーザー'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
```

4. **ログインテスト**
   - 企業名: `移行ユーザー`
   - メールアドレス: （既存のメールアドレス）
   - パスワード: （既存のパスワード）

---

### 方法2: プロフィールがないユーザーを削除する

**メリット**: クリーンな状態から始められる
**デメリット**: 古いユーザーは再登録が必要

#### 手順

1. **Supabaseダッシュボードにアクセス**

2. **SQL Editorで以下を実行**

```sql
-- プロフィールがないユーザーを削除
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

3. **再登録**
   - サインアップページから、企業名・お名前・メールアドレス・パスワードを入力して再登録

---

### 方法3: 全ユーザーを削除する（開発環境のみ）

**メリット**: 完全にリセットできる
**デメリット**: 全データが削除される

#### 手順

1. **Supabaseダッシュボードにアクセス**

2. **SQL Editorで以下を実行**

```sql
-- 全ユーザーを削除
DELETE FROM auth.users;
```

3. **再登録**
   - サインアップページから新規登録

---

## 📊 確認方法

### ユーザーの状態を確認

```sql
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN 'プロフィールなし' ELSE 'プロフィールあり' END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;
```

### 全ユーザーがプロフィールを持っているか確認

```sql
SELECT
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;
```

---

## ⚠️ 注意事項

- 本番環境では方法1（デフォルト企業を割り当て）を推奨します
- 開発環境では方法3（全削除）が最も簡単です
- SQLを実行する前に、必ず現在のユーザー数を確認してください

---

## 🎯 推奨フロー

1. まず確認SQLを実行して、古いユーザーが何人いるか確認
2. 開発環境なら方法3、本番環境なら方法1を選択
3. 実行後、再度確認SQLで全ユーザーがプロフィールを持っているか確認
4. ログインテストを実施
