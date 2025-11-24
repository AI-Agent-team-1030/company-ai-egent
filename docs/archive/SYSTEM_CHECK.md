# システム全体チェックリスト

## 実行手順

### 1. データベース修正（必須）
Supabaseの SQL Editorで以下のSQLを実行してください:

```sql
-- UNIQUE制約を確実に追加
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_key_user_id_key;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_key_user_id_key UNIQUE (key, user_id);
SELECT 'UNIQUE constraint added successfully' AS status;
```

### 2. サーバー再起動
```bash
cd "/Users/kurosakiyuto/法人AI素案"
rm -rf .next
npm run dev
```

### 3. 動作確認

#### 設定ページ (http://localhost:3000/settings)
- [ ] ページが表示される
- [ ] ユーザー名が入力・保存できる
- [ ] Claude APIキーが入力・保存できる
- [ ] 保存後リロードしても設定が残っている

#### ナレッジベース (http://localhost:3000/knowledge)
- [ ] ページが表示される
- [ ] ドキュメント一覧が表示される
- [ ] フォルダーが作成できる
- [ ] フォルダーに名前を付けられる
- [ ] ドキュメントをアップロードできる
- [ ] ドキュメントを削除できる

#### チャット (http://localhost:3000/chat)
- [ ] ページが表示される
- [ ] 新しい会話を作成できる
- [ ] メッセージを送信できる
- [ ] AIが応答する
- [ ] ナレッジベースの内容を参照した回答が返る

## 現在の問題と修正内容

### ✅ 修正済み
1. **RLS認証問題** - すべてのAPIエンドポイントで認証済みSupabaseクライアントを使用
2. **フォルダーAPI** - GET/POST/PUT/DELETEすべて実装
3. **ドキュメントAPI** - 取得・削除機能を修正
4. **設定API 404エラー** - 設定が見つからない場合はnullを返すように修正
5. **チャットRAG** - ナレッジベースから情報を取得してAIに渡す

### ⚠️ 要確認
1. **UNIQUE制約** - `app_settings`テーブルのUNIQUE制約が正しく設定されているか
   - 修正: `FIX_CONSTRAINTS.sql`を実行

2. **設定保存** - upsertが正しく動作するか
   - 原因: UNIQUE制約が存在しない可能性
   - 対策: 上記SQLで制約を追加

## APIエンドポイント一覧

### 認証
- [x] すべて認証済みSupabaseクライアント使用

### 設定 (/api/settings)
- [x] GET - 設定取得（404の代わりにnull返却）
- [x] POST - 設定保存（upsert）
- [x] DELETE - 設定削除

### フォルダー (/api/folders)
- [x] GET - フォルダー一覧
- [x] POST - フォルダー作成
- [x] PUT /api/folders/[id] - フォルダー名変更
- [x] DELETE /api/folders/[id] - フォルダー削除

### ドキュメント (/api/documents)
- [x] GET - ドキュメント一覧
- [x] POST /api/documents/upload - アップロード
- [x] GET /api/documents/[id] - 詳細取得
- [x] DELETE /api/documents/[id] - 削除

### チャット (/api/chat)
- [x] GET /api/chat/conversations - 会話一覧
- [x] POST /api/chat/conversations - 会話作成
- [x] POST /api/chat/messages - メッセージ送信（RAG機能付き）

## データベーステーブル

### app_settings
```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(key, user_id) -- ← これが重要！
);
```

### uploaded_documents
```sql
CREATE TABLE uploaded_documents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  folder_id UUID REFERENCES knowledge_folders(id),
  created_at TIMESTAMPTZ
);
```

### knowledge_folders
```sql
CREATE TABLE knowledge_folders (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  parent_folder_id UUID REFERENCES knowledge_folders(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## 次のステップ

1. **FIX_CONSTRAINTS.sqlを実行**
2. **サーバー再起動**
3. **設定ページで保存テスト**
4. **ナレッジベースでドキュメント確認**
5. **チャットでRAG機能テスト**

すべて動作したら完了です！
