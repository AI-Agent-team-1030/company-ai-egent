# データベースセットアップ手順

## 📋 概要

Supabaseでナレッジ機能用のデータベーステーブルを作成します。

---

## 🗄️ テーブル構造

### `knowledge` テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 主キー（自動生成） |
| title | TEXT | ナレッジのタイトル |
| content | TEXT | ナレッジの内容 |
| category | TEXT | カテゴリー（営業ノウハウ、人事・採用など） |
| department | TEXT | 部門（sales, hr, csなど） |
| tags | TEXT[] | タグの配列 |
| created_at | TIMESTAMPTZ | 作成日時（自動設定） |
| updated_at | TIMESTAMPTZ | 更新日時（自動更新） |
| usage_count | INTEGER | 使用回数 |
| helpful | INTEGER | 役に立った数 |
| rating | DECIMAL(3,1) | 評価（0.0〜5.0） |

---

## 🚀 セットアップ手順

### ステップ1: Supabase SQL Editorにアクセス

1. https://app.supabase.com にアクセス
2. プロジェクト「uxidrfbshtdhcrlnlfza」を選択
3. 左サイドバーの **SQL Editor** をクリック

---

### ステップ2: SQLファイルの内容をコピー

`supabase/migrations/001_create_knowledge_table.sql` の内容をすべてコピーします。

または、以下のコマンドで内容を表示できます：

```bash
cat supabase/migrations/001_create_knowledge_table.sql
```

---

### ステップ3: SQLを実行

1. SQL Editorで **+ New query** をクリック
2. コピーしたSQLを貼り付け
3. 右下の **Run** ボタン（または `Cmd + Enter`）をクリック

---

### ステップ4: 実行結果の確認

**Success. No rows returned** と表示されればOKです。

---

### ステップ5: テーブルの確認

1. 左サイドバーの **Table Editor** をクリック
2. `knowledge` テーブルが作成されていることを確認
3. サンプルデータ3件が挿入されていることを確認

---

## ✅ 作成される内容

### テーブル
- ✅ `knowledge` テーブル

### インデックス（高速検索用）
- ✅ カテゴリー別検索
- ✅ 部門別検索
- ✅ 日時順ソート
- ✅ 人気順ソート
- ✅ 評価順ソート
- ✅ タグ検索（GINインデックス）
- ✅ 全文検索（GINインデックス）

### トリガー
- ✅ 更新日時の自動更新

### RLS（Row Level Security）
- ✅ 全ユーザーが読み取り可能
- ✅ 全ユーザーが作成・更新・削除可能

**注：本番環境では認証機能を追加して、適切なアクセス制御を設定してください**

### サンプルデータ
- ✅ 3件のサンプルナレッジ

---

## 🧪 動作確認

SQL Editorで以下のクエリを実行して、データが正しく挿入されているか確認します：

```sql
SELECT * FROM knowledge;
```

3件のデータが表示されればOKです。

---

## 🎯 次のステップ

データベースのセットアップが完了したら、次に進みます：

1. ✅ Supabaseプロジェクトのセットアップ
2. ✅ データベーススキーマの作成
3. ⏭️ **ナレッジCRUD APIの実装**

---

## 🛠️ トラブルシューティング

### エラー: "relation already exists"

既にテーブルが存在している場合、以下のSQLで削除してから再実行してください：

```sql
DROP TABLE IF EXISTS knowledge CASCADE;
```

その後、再度 `001_create_knowledge_table.sql` を実行します。

---

### データをリセットしたい場合

```sql
TRUNCATE TABLE knowledge RESTART IDENTITY;
```

その後、サンプルデータのINSERT文だけを再実行します。

---

最終更新: 2025-11-19
