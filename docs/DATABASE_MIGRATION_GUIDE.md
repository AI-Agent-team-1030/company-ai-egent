# データベースマイグレーションガイド

## 📋 今回のセットアップ手順

### ステップ1: SQLを実行

1. **Supabaseダッシュボードにアクセス**
   https://supabase.com/dashboard

2. **プロジェクトを選択**

3. **SQL Editorを開く**

4. **`supabase/migrations/000_COMPLETE_RESET.sql` の内容を全てコピー**

5. **ペーストして「Run」をクリック**

6. **「セットアップ完了！」と表示されればOK**

### ステップ2: Supabase認証設定

1. **Authentication** → **Settings**

2. 以下を設定：
   - ✅ **Enable email confirmations**: **OFF**
   - ✅ **Enable signup**: **ON**
   - ✅ **Minimum password length**: **6**

3. **Save**をクリック

### ステップ3: ブラウザで確認

1. http://localhost:3003/auth/signup にアクセス

2. 新規登録を試す：
   - 企業名: アドナス株式会社
   - お名前: 黒崎優斗
   - メールアドレス: test@example.com
   - パスワード: 123456

3. 成功したら設定完了！

---

## 🔄 今後のマイグレーション方法

### パターン1: 新しいカラムを追加する場合

**例**: `profiles`テーブルに `phone_number` を追加

```sql
-- 新しいカラムを追加（既存データは保持される）
ALTER TABLE profiles
ADD COLUMN phone_number TEXT;

-- インデックスを追加（必要に応じて）
CREATE INDEX idx_profiles_phone ON profiles(phone_number);

-- 確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';
```

### パターン2: 既存カラムを変更する場合

**例**: `user_name`をNOT NULLにする

```sql
-- 1. まず既存のNULLデータを確認
SELECT COUNT(*) FROM profiles WHERE user_name IS NULL;

-- 2. NULLデータがある場合は、デフォルト値を設定
UPDATE profiles
SET user_name = '名前未設定'
WHERE user_name IS NULL;

-- 3. NOT NULL制約を追加
ALTER TABLE profiles
ALTER COLUMN user_name SET NOT NULL;
```

### パターン3: 新しいテーブルを追加する場合

**例**: `notifications`テーブルを追加

```sql
-- 新しいテーブルを作成
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- RLSを設定（開発中は無効化してもOK）
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

### パターン4: 既存データを更新する場合

**例**: 全ユーザーにデフォルト設定を追加

```sql
-- 既存の全ユーザーにデフォルト設定を追加
INSERT INTO app_settings (user_id, key, value)
SELECT
  id as user_id,
  'default_theme' as key,
  'light' as value
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM app_settings
  WHERE app_settings.user_id = auth.users.id
    AND app_settings.key = 'default_theme'
);

-- 確認
SELECT COUNT(*) FROM app_settings WHERE key = 'default_theme';
```

---

## ⚠️ マイグレーション時の注意点

### 1. バックアップを取る

重要なマイグレーション前に、必ずデータをエクスポート：

```sql
-- 特定のテーブルをCSVでエクスポート（Supabaseダッシュボード）
-- Table Editor → テーブル選択 → Export to CSV
```

### 2. テスト環境で試す

本番環境で実行する前に、必ず開発環境で試してください。

### 3. トランザクションを使う

複数のSQLを実行する場合は、トランザクションで囲む：

```sql
BEGIN;

-- マイグレーションSQLをここに書く
ALTER TABLE ...;
UPDATE ...;

-- 問題なければコミット
COMMIT;

-- 問題があればロールバック
-- ROLLBACK;
```

### 4. 段階的に実行

大きなマイグレーションは、小さく分けて実行：

```sql
-- ❌ 一度に全部やらない
ALTER TABLE profiles ADD COLUMN phone TEXT;
ALTER TABLE profiles ADD COLUMN address TEXT;
ALTER TABLE profiles ADD COLUMN birthday DATE;

-- ✅ 1つずつ実行して確認
ALTER TABLE profiles ADD COLUMN phone TEXT;
-- 確認
SELECT * FROM profiles LIMIT 1;

-- 次のカラム
ALTER TABLE profiles ADD COLUMN address TEXT;
-- 確認
SELECT * FROM profiles LIMIT 1;
```

---

## 🚨 よくある問題と解決方法

### 問題1: 外部キー制約エラー

**エラー**: `violates foreign key constraint`

**原因**: 参照先のデータが存在しない

**解決方法**:
```sql
-- 参照先のデータを先に作成
INSERT INTO companies (name, normalized_name)
VALUES ('新しい会社', 'あたらしいかいしゃ');

-- その後、参照するデータを作成
INSERT INTO profiles (id, company_id, user_name)
VALUES (...);
```

### 問題2: カラムが既に存在する

**エラー**: `column "xxx" already exists`

**解決方法**:
```sql
-- カラムが存在しない場合のみ追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT;
  END IF;
END $$;
```

### 問題3: NOT NULL制約エラー

**エラー**: `violates not null constraint`

**解決方法**:
```sql
-- 既存のNULLデータにデフォルト値を設定してから制約を追加
UPDATE profiles SET user_name = '名前未設定' WHERE user_name IS NULL;
ALTER TABLE profiles ALTER COLUMN user_name SET NOT NULL;
```

---

## 📊 マイグレーション履歴の管理

### マイグレーションファイルの命名規則

```
000_COMPLETE_RESET.sql         # 完全リセット（初回のみ）
001_add_notifications.sql      # 通知機能追加
002_add_phone_to_profiles.sql  # プロフィールに電話番号追加
003_update_user_roles.sql      # ユーザーロール更新
```

### マイグレーション記録テーブル

```sql
-- マイグレーション履歴を記録するテーブル（オプション）
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  description TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- マイグレーション実行後に記録
INSERT INTO schema_migrations (version, description)
VALUES ('001', '通知機能追加');
```

---

## 🎯 ベストプラクティス

1. ✅ **小さく頻繁にマイグレーション**
   - 大きな変更を一度に行わない
   - 1つの機能ごとにマイグレーション

2. ✅ **ロールバック計画を立てる**
   - 失敗時の復元方法を事前に考える

3. ✅ **本番環境は慎重に**
   - 必ずバックアップを取る
   - メンテナンス時間を設定

4. ✅ **ドキュメントを残す**
   - なぜその変更をしたのか記録
   - 将来の自分や他の開発者のため

---

## 📝 マイグレーションチェックリスト

実行前に確認：

- [ ] バックアップを取った
- [ ] テスト環境で動作確認した
- [ ] ロールバック手順を確認した
- [ ] 既存データへの影響を確認した
- [ ] インデックスが必要か検討した
- [ ] RLSポリシーを確認した
- [ ] 実行時間を見積もった（大量データの場合）

実行後に確認：

- [ ] エラーが出なかった
- [ ] データが正しく変更された
- [ ] アプリケーションが動作する
- [ ] パフォーマンスに問題がない
- [ ] マイグレーション履歴を記録した
