# 🚀 超シンプルセットアップ（2ステップのみ）

## ステップ1: SQLを実行

1. **Supabase SQL Editor**を開く
   - https://app.supabase.com
   - プロジェクト「uxidrfbshtdhcrlnlfza」を選択
   - 左メニュー「SQL Editor」をクリック

2. **SQLファイルをコピペして実行**
   ```bash
   # ファイルの場所
   supabase/setup_complete.sql
   ```
   - ファイルの内容を全てコピー
   - SQL Editorに貼り付け
   - 「Run」ボタンをクリック

3. **完了確認**
   - "Success. No rows returned" と表示されればOK

---

## ステップ2: Storageバケットを作成（手動）

**⚠️ これは必須です！SQLでは作成できません**

1. **Supabase Dashboard**で左メニュー「Storage」をクリック

2. **「New bucket」**ボタンをクリック

3. **設定**
   - Name: `documents` （必ずこの名前）
   - Public bucket: ❌ **チェックを外す**（プライベート）
   - File size limit: `52428800` （50MB）

4. **「Create bucket」**をクリック

---

## ✅ 完了！

これだけで全ての準備が完了します。

### 次にやること

1. http://localhost:3001/settings
   - Claude APIキーを設定

2. http://localhost:3001/knowledge
   - ファイルをアップロード

3. http://localhost:3001/chat
   - AIとチャット

---

## 🐛 トラブルシューティング

### Q: ファイルアップロードで「Bucket not found」エラー

**A:** ステップ2のStorageバケット作成を忘れています

1. Supabase Dashboard → Storage
2. 「documents」というバケットがあるか確認
3. なければ作成してください

---

これで完了です！
