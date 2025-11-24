# データベースセットアップ（簡易版）

## やること1つだけ！

### SQLファイルを実行する

1. **Supabaseを開く**
   - https://app.supabase.com
   - プロジェクト「uxidrfbshtdhcrlnlfza」を選択

2. **SQL Editorを開く**
   - 左メニューの「SQL Editor」をクリック
   - 「+ New query」をクリック

3. **SQLをコピペして実行**
   - 以下のファイルの内容を全てコピー：
     ```
     supabase/migrations/001_create_all_tables.sql
     ```
   - SQL Editorに貼り付け
   - 「Run」ボタンをクリック

4. **確認**
   - "Success. No rows returned" と表示されればOK
   - 左メニューの「Table Editor」で以下のテーブルが作成されていることを確認：
     - ✅ `knowledge` - ナレッジ保存用
     - ✅ `chat_conversations` - チャット会話履歴用
     - ✅ `chat_messages` - チャットメッセージ用
     - ✅ `app_settings` - APIキー保存用

---

## 作成されるテーブル

### 1. knowledge（ナレッジ）
- ナレッジの保存・検索・管理

### 2. chat_conversations（チャット会話）
- チャットセッションの管理

### 3. chat_messages（チャットメッセージ）
- ユーザーとAIのメッセージ履歴

### 4. app_settings（設定）
- Claude APIキーなどの設定保存
- UIから設定できるようにします

---

## 完了後

完了したら教えてください！次のAPI実装に進みます。
