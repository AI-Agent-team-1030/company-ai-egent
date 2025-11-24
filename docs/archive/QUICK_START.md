# クイックスタート手順

## 現在の状況
設定が保存できない問題は、データベースのUNIQUE制約が正しく設定されていないことが原因です。

## 修正手順（3ステップ）

### ステップ1: データベース修正（Supabaseで実行）

Supabaseの**SQL Editor**を開いて、以下のSQLを実行してください：

```sql
-- UNIQUE制約を確実に追加
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_key_user_id_key;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_key_user_id_key UNIQUE (key, user_id);
SELECT 'UNIQUE constraint added successfully' AS status;
```

実行後、`UNIQUE constraint added successfully`というメッセージが表示されればOKです。

### ステップ2: サーバー起動

ターミナルで以下を実行：

```bash
cd "/Users/kurosakiyuto/法人AI素案"
npm run dev
```

### ステップ3: 動作確認

ブラウザで `http://localhost:3000` を開いて以下を確認：

#### 1. 設定ページ (http://localhost:3000/settings)
- [ ] ユーザー名を入力して「名前を保存」をクリック
- [ ] 「保存しました」と表示される
- [ ] ページをリロードしても名前が残っている

#### 2. Claude APIキーを設定
- [ ] APIキーを入力して「APIキーを保存」をクリック
- [ ] 「保存しました」と表示される
- [ ] ページをリロードしても「設定済み」と表示される

#### 3. ナレッジベース (http://localhost:3000/knowledge)
- [ ] フォルダーが作成できる
- [ ] ドキュメントがアップロードできる
- [ ] フォルダーにドキュメントが表示される

#### 4. チャット (http://localhost:3000/chat)
- [ ] 新しい会話を作成できる
- [ ] メッセージを送信できる
- [ ] AIが応答する
- [ ] ナレッジベースの内容を参照した回答が返る

## トラブルシューティング

### エラーが出る場合
1. すべてのターミナルで実行中のサーバーを停止（Ctrl+Cを押す）
2. キャッシュを削除: `rm -rf .next`
3. サーバーを再起動: `npm run dev`

### それでも保存できない場合
- Supabaseでステップ1のSQLが正しく実行されたか確認してください
- SQL Editorで以下のクエリを実行して制約の存在を確認：
  ```sql
  SELECT constraint_name, constraint_type
  FROM information_schema.table_constraints
  WHERE table_name = 'app_settings';
  ```
- `app_settings_key_user_id_key` という名前のUNIQUE制約が表示されればOKです

## 完了！
すべてのチェックボックスにチェックが入れば、システムは正常に動作しています。
