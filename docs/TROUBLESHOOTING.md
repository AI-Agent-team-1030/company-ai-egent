# トラブルシューティングガイド

## 🚨 設定が保存されない問題

### 症状

- ユーザー名を入力して保存しても、リロードすると消える
- Claude APIキーを保存しても、反映されない
- 「保存しました」と表示されるが、実際には保存されていない

### 原因

`app_settings`テーブルにUNIQUE制約が設定されていないため、upsert（更新または挿入）が正しく動作していません。

### 解決方法

#### ステップ1: Supabase SQL Editorを開く

https://supabase.com/dashboard/ にアクセスして、プロジェクトを選択し、左メニューから「SQL Editor」を開きます。

#### ステップ2: FIX_CONSTRAINTS.sqlを実行

`supabase/FIX_CONSTRAINTS.sql` の内容を**全てコピー**して、SQL Editorに貼り付けて実行します。

このSQLは以下を実行します：
1. 既存の重複データを削除
2. UNIQUE制約を追加
3. インデックスを作成（パフォーマンス向上）
4. RLSポリシーを再作成
5. 結果を確認

#### ステップ3: 結果を確認

実行後、以下のような結果が表示されればOKです：
```
status: "FIX completed successfully! Settings can now be saved."
```

#### ステップ4: アプリケーションで動作確認

1. サーバーを再起動: `npm run dev`
2. 設定ページ（http://localhost:3000/settings）を開く
3. ユーザー名を入力して保存
4. **ページをリロード**
5. ユーザー名が残っていればOK！

---

## 🔐 認証関連の問題

### ログインできない

**メール確認が必要になっている場合:**

開発環境では、Supabaseのメール確認を無効にすることを推奨します：

1. Supabaseダッシュボード → Authentication → Providers
2. Email provider設定を開く
3. "Confirm email"のチェックを外す
4. Save

### セッションが切れる

ブラウザのCookieが有効になっていることを確認してください。

---

## 📁 ファイルアップロードの問題

### ファイルがアップロードできない

**Storage バケットの確認:**

1. Supabaseダッシュボード → Storage
2. `documents`バケットが存在するか確認
3. 存在しない場合は、`supabase/SETUP.sql`を再実行

**RLSポリシーの確認:**

Storageのポリシーが正しく設定されているか確認：

```sql
SELECT * FROM storage.policies WHERE bucket_id = 'documents';
```

---

## 🤖 Claude APIの問題

### Claude APIが応答しない

**APIキーの確認:**

1. 設定ページでClaude APIキーが正しく設定されているか確認
2. Anthropic Consoleでキーが有効か確認
3. APIキーの権限を確認

**エラーメッセージを確認:**

ブラウザの開発者ツール（F12）→ Consoleタブでエラーを確認

---

## 🗄️ データベース関連

### データが表示されない

**RLSポリシーの確認:**

```sql
-- supabase/CHECK_DATABASE.sql を実行
```

以下を確認：
- RLSが有効になっているか
- 適切なポリシーが存在するか
- ポリシーの条件が正しいか

### マイグレーションエラー

データベースを完全にリセットする場合：

1. Supabaseダッシュボード → Database → Tables
2. すべてのテーブルを削除
3. `supabase/SETUP.sql`を実行
4. `supabase/FIX_CONSTRAINTS.sql`を実行

---

## 🌐 ネットワーク関連

### CORSエラー

Next.jsのAPIルートを経由しているため、通常CORSエラーは発生しません。発生した場合は：

1. `.env`ファイルの設定を確認
2. Supabase URLが正しいか確認
3. ブラウザのキャッシュをクリア

---

## 📞 サポート

上記で解決しない場合は、以下の情報を提供してください：

1. `supabase/CHECK_DATABASE.sql`の実行結果
2. ブラウザコンソールのエラーメッセージ
3. サーバーログのエラーメッセージ
4. 再現手順
