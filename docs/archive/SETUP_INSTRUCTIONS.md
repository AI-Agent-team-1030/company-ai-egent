# セットアップ手順書

## 1. Supabase設定

### 1-1. ストレージポリシー修正

Supabase Dashboard → SQL Editor で以下のSQLを実行してください：

```sql
-- supabase/STORAGE_FIX.sql の内容を実行
```

このSQLは：
- 既存のストレージポリシーを全て削除
- documentsバケットの設定を更新（50MB制限、対応ファイル形式を指定）
- 全アクセスを許可する新しいポリシーを作成

### 1-2. 認証対応データベース設定

STORAGE_FIX.sqlの実行後、以下のSQLを実行してください：

```sql
-- supabase/AUTH_SETUP.sql の内容を実行
```

このSQLは：
- 既存テーブルに `user_id` カラムを追加
- Row Level Security (RLS) を有効化
- ユーザーごとのデータアクセスポリシーを作成
- ストレージもユーザーごとに分離

## 2. 機能概要

### 認証機能
- ✅ メールアドレス＆パスワードによるサインアップ/ログイン
- ✅ 自動ログアウト（セッション期限切れ時）
- ✅ ユーザーごとのデータ分離

### ドキュメント管理
- ✅ ファイルアップロード（PDF, Word, Excel, PowerPoint, CSV, TXT, Markdown, 画像）
- ✅ 自動テキスト抽出（OCR対応）
- ✅ 処理状況のリアルタイム表示
- ✅ ユーザーごとのドキュメント管理

### RAG (Retrieval Augmented Generation)
- ✅ アップロードされたドキュメントから自動で知識ベースを構築
- ✅ チャットでの質問に対して、関連ドキュメントを参照して回答
- ✅ 全文検索によるドキュメント検索

## 3. 使い方

### 3-1. 初回セットアップ

1. `http://localhost:3001/auth/signup` にアクセス
2. メールアドレスとパスワードを入力して登録
3. ログイン後、`/settings` でClaude API キーを設定

### 3-2. ドキュメントアップロード

1. `/knowledge` ページで「ドキュメント追加」ボタンをクリック
2. ファイルを選択（最大50MB）
3. アップロード → テキスト抽出の進捗が表示されます
4. 完了後、ドキュメント一覧に追加されます

### 3-3. チャットで質問

1. `/chat` ページで新しい会話を開始
2. 質問を入力すると、アップロードしたドキュメントを参照して回答します

## 4. 対応ファイル形式

| 形式 | 拡張子 | 処理方法 |
|------|--------|----------|
| PDF | .pdf | pdf-parse-fork |
| Word | .docx | mammoth |
| Excel | .xlsx, .xls | xlsx |
| PowerPoint | .pptx, .ppt | officeparser |
| CSV | .csv | csv-parse |
| テキスト | .txt, .md | 直接読み込み |
| 画像 | .png, .jpg, .gif, .webp | Tesseract.js (OCR) |

## 5. トラブルシューティング

### アップロードエラー「new row violates row-level security policy」

→ `supabase/STORAGE_FIX.sql` と `supabase/AUTH_SETUP.sql` を実行してください

### PDF処理エラー「pdfParse is not a function」

→ pdf-parse-forkがインストールされていることを確認してください
```bash
npm install pdf-parse-fork
```

### 認証エラー「Unauthorized」

→ ログアウトして再度ログインしてください

## 6. データベーススキーマ

### uploaded_documents
- `id`: UUID（主キー）
- `user_id`: UUID（ユーザーID）
- `filename`: TEXT（ストレージパス）
- `original_filename`: TEXT（元のファイル名）
- `file_type`: TEXT（MIMEタイプ）
- `file_size`: INTEGER（バイト）
- `storage_path`: TEXT（ストレージパス）
- `uploaded_at`: TIMESTAMPTZ（アップロード日時）
- `processed`: BOOLEAN（処理完了フラグ）
- `processed_at`: TIMESTAMPTZ（処理完了日時）

### document_chunks
- `id`: UUID（主キー）
- `document_id`: UUID（ドキュメントID）
- `chunk_index`: INTEGER（チャンクインデックス）
- `content`: TEXT（チャンク内容、2000文字）
- `created_at`: TIMESTAMPTZ（作成日時）

### chat_conversations
- `id`: UUID（主キー）
- `user_id`: UUID（ユーザーID）
- `title`: TEXT（会話タイトル）
- `created_at`: TIMESTAMPTZ（作成日時）
- `updated_at`: TIMESTAMPTZ（更新日時）

### chat_messages
- `id`: UUID（主キー）
- `conversation_id`: UUID（会話ID）
- `role`: TEXT（user/assistant）
- `content`: TEXT（メッセージ内容）
- `created_at`: TIMESTAMPTZ（作成日時）

### app_settings
- `id`: UUID（主キー）
- `user_id`: UUID（ユーザーID）
- `key`: TEXT（設定キー）
- `value`: TEXT（設定値）
- `created_at`: TIMESTAMPTZ（作成日時）
- `updated_at`: TIMESTAMPTZ（更新日時）

## 7. セキュリティ

- ✅ Row Level Security (RLS) により、ユーザーは自分のデータのみアクセス可能
- ✅ ストレージもユーザーIDでフォルダ分離
- ✅ APIリクエストには認証トークンが必要
- ✅ Claude API キーはデータベースに暗号化して保存（推奨）

## 8. 次のステップ

### 推奨改善
1. メール確認機能の有効化（Supabaseの設定）
2. パスワードリセット機能の実装
3. プロフィール編集機能
4. ドキュメントの全文検索UI
5. チャット履歴のエクスポート機能
