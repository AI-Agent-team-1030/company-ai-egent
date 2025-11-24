# ドキュメントアップロード & RAG機能 セットアップ

## 🎯 実装内容

### 新機能
1. **ファイルアップロード** - PDF、テキスト、Markdown、Wordなどをアップロード
2. **自動テキスト抽出** - アップロードしたファイルからテキストを抽出
3. **RAG (Retrieval Augmented Generation)** - ドキュメントを参照しながらAIが回答

---

## 📊 新しいテーブル

### 1. `uploaded_documents`
- アップロードされたファイルの情報を保存

### 2. `document_chunks`
- ドキュメントを分割したチャンク（RAG用）
- 将来的にベクトル埋め込みを保存可能

---

## 🚀 セットアップ手順

### ステップ1: SQLを実行

1. Supabase SQL Editorを開く
2. 以下のファイルの内容を実行:
   ```
   supabase/migrations/002_add_document_upload.sql
   ```

**実行内容:**
- ✅ 既存のナレッジデータを削除
- ✅ `uploaded_documents` テーブル作成
- ✅ `document_chunks` テーブル作成

---

### ステップ2: Supabase Storageの設定

1. Supabase Dashboard → Storage を開く
2. 「New bucket」をクリック
3. 以下の設定で作成:
   - **Name**: `documents`
   - **Public**: OFF（プライベート）
   - **File size limit**: 50MB

---

## 📦 必要なパッケージ

```bash
npm install pdf-parse mammoth
```

- `pdf-parse`: PDFファイルからテキスト抽出
- `mammoth`: Word (.docx) ファイルからテキスト抽出

---

## 🎨 実装される機能

### 1. ナレッジページ (`/knowledge`)
- ✅ ファイルアップロードボタン
- ✅ アップロードしたドキュメント一覧
- ✅ ドキュメントの削除

### 2. チャットページ (`/chat`)
- ✅ 質問に関連するドキュメントを自動検索
- ✅ ドキュメントの内容を参照してClaude AIが回答
- ✅ 参照したドキュメントを表示

---

## 📁 対応ファイル形式

- ✅ PDF (`.pdf`)
- ✅ テキスト (`.txt`)
- ✅ Markdown (`.md`)
- ✅ Word (`.docx`)

---

## 🔄 処理フロー

1. **アップロード**
   - ユーザーがファイルをアップロード
   - Supabase Storageに保存
   - `uploaded_documents` テーブルに記録

2. **テキスト抽出**
   - ファイル形式に応じてテキストを抽出
   - 長いテキストは分割（チャンク化）
   - `document_chunks` テーブルに保存

3. **検索 & RAG**
   - ユーザーの質問からキーワード抽出
   - 関連するドキュメントチャンクを検索
   - チャンクの内容をClaude APIに渡す
   - Claude AIが回答を生成

---

## 🚧 今後の拡張（オプション）

### ベクトル検索の追加
Supabaseでpgvector拡張を有効にすれば、より高度な検索が可能：

1. **pgvectorを有効化**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **ベクトルインデックスを追加**
   ```sql
   CREATE INDEX idx_document_chunks_embedding
   ON document_chunks
   USING ivfflat (embedding vector_cosine_ops);
   ```

3. **OpenAI Embeddings APIを使用**
   - ドキュメントアップロード時に埋め込みを生成
   - セマンティック検索で関連ドキュメントを取得

---

最終更新: 2025-11-19
