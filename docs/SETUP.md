# セットアップガイド

## 📋 必要なもの

- Node.js 18以上
- npm または yarn
- Supabaseアカウント
- Claude APIキー

## 🚀 初期セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd 社内ナレッジ検索くん
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env`ファイルを作成して以下を設定：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Claude API設定
ANTHROPIC_API_KEY=your-claude-api-key
```

### 4. Supabaseデータベースのセットアップ

1. [Supabase](https://supabase.com)にログイン
2. プロジェクトを作成
3. SQL Editorを開く
4. `supabase/SETUP.sql`の内容を実行
5. `supabase/FIX_CONSTRAINTS.sql`の内容を実行

### 5. メール確認の無効化（開発環境）

開発環境では、メール確認を無効にすることを推奨します：

1. Supabaseダッシュボード → Authentication → Providers
2. Email provider設定を開く
3. "Confirm email"のチェックを外す
4. Save

### 6. アプリケーションの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 📝 初回ログイン

1. `/auth/signup`でアカウント作成
2. メール確認が無効な場合、そのままログイン可能
3. `/settings`でユーザー名とClaude APIキーを設定

## ⚙️ 設定項目

### ユーザー設定

- **ユーザー名**: チャットやダッシュボードで表示される名前
- **Claude APIキー**: AIチャット機能を使用するために必須

### データベース設定の確認

設定が正しく保存されない場合は、`supabase/CHECK_DATABASE.sql`を実行して状態を確認してください。

## 🔧 トラブルシューティング

一般的な問題と解決方法については、[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)を参照してください。
