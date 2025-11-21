# フォルダ機能のセットアップ手順

フォルダ機能を有効化するには、以下の手順を実行してください。

## 1. Supabaseでデータベースを更新

1. **Supabase Dashboard** を開く
   - https://uxidrfbshtdhcrlnlfza.supabase.co

2. **SQL Editor** に移動

3. **STORAGE_FIX.sql** を実行（まだの場合）
   - `supabase/STORAGE_FIX.sql` の内容を全てコピー
   - Run をクリック

4. **AUTH_SETUP.sql** を実行（まだの場合）
   - `supabase/AUTH_SETUP.sql` の内容を全てコピー
   - Run をクリック

5. **ADD_FOLDERS.sql** を実行
   - `supabase/ADD_FOLDERS.sql` の内容を全てコピー
   - Run をクリック

## 2. フォルダ機能について

### 実装済みの機能

#### バックエンド (API)
- ✅ フォルダテーブル (`knowledge_folders`) の作成
- ✅ フォルダ一覧取得 API (`GET /api/folders`)
- ✅ フォルダ作成 API (`POST /api/folders`)
- ✅ フォルダ名変更 API (`PUT /api/folders/[id]`)
- ✅ フォルダ削除 API (`DELETE /api/folders/[id]`)
- ✅ ドキュメントアップロード時にフォルダ指定機能

#### セキュリティ
- ✅ ユーザーごとのフォルダ分離 (RLS)
- ✅ フォルダ内にドキュメントがある場合は削除不可

### 次のステップ: UIの実装

フォルダ機能のUIを実装するには、`app/(app)/knowledge/page.tsx` を更新する必要があります。

#### 追加が必要な機能

1. **フォルダ一覧の表示**
   - フォルダアイコンとフォルダ名を表示
   - クリックでフォルダ内のドキュメントを表示

2. **フォルダ作成ボタン**
   - 「新しいフォルダ」ボタンを追加
   - モーダルでフォルダ名を入力

3. **フォルダごとのドキュメント表示**
   - フォルダで絞り込み
   - 「すべて」「フォルダなし」の選択肢

4. **ドキュメントアップロード時のフォルダ選択**
   - アップロード時に現在のフォルダに自動追加

5. **フォルダの右クリックメニュー**
   - 名前変更
   - 削除

## 3. 使い方（実装後）

1. **フォルダを作成**
   - 「新しいフォルダ」ボタンをクリック
   - フォルダ名を入力

2. **ドキュメントをアップロード**
   - フォルダを選択した状態でアップロード
   - 自動的にそのフォルダに保存される

3. **フォルダで整理**
   - 契約書、マニュアル、営業資料など、カテゴリーごとに分類
   - フォルダをクリックすると、そのフォルダ内のドキュメントのみ表示

## 4. 技術詳細

### データベーススキーマ

```sql
-- フォルダテーブル
knowledge_folders (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  parent_folder_id UUID REFERENCES knowledge_folders(id), -- 将来のネスト対応
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- ドキュメントテーブルに追加
uploaded_documents (
  ...
  folder_id UUID REFERENCES knowledge_folders(id)
)
```

### API エンドポイント

- `GET /api/folders` - フォルダ一覧
- `POST /api/folders` - フォルダ作成
- `PUT /api/folders/[id]` - フォルダ名変更
- `DELETE /api/folders/[id]` - フォルダ削除
- `POST /api/documents/upload` - folder_id パラメータ対応済み

## 5. 今後の拡張可能性

- **サブフォルダ** - `parent_folder_id` を使ってネスト構造を実装
- **フォルダの移動** - ドラッグ&ドロップでフォルダ間を移動
- **フォルダの色分け** - カテゴリーごとに色を設定
- **フォルダのお気に入り** - よく使うフォルダをピン留め
