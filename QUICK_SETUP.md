# 🚀 クイックセットアップ（5分で完了）

## 📋 やること（3ステップのみ）

### ステップ1: SQLを実行（2分）

1. Supabaseダッシュボードを開く
   👉 https://supabase.com/dashboard

2. プロジェクトを選択 → **SQL Editor** をクリック

3. **`supabase/migrations/000_COMPLETE_RESET.sql`** を開く

4. 全てコピー → SQL Editorにペースト → **Run** をクリック

5. 「セットアップ完了！」と表示されればOK ✅

---

### ステップ2: メール確認を無効化（1分）

1. Supabaseダッシュボード → **Authentication** → **Settings**

2. 以下を設定：
   - ❌ **Enable email confirmations** → **OFF**
   - ✅ **Enable signup** → **ON**

3. **Save** をクリック

---

### ステップ3: 動作確認（2分）

1. ブラウザで http://localhost:3003/auth/signup を開く

2. 登録してみる：
   - 企業名: `アドナス株式会社`
   - お名前: `黒崎優斗`
   - メールアドレス: `test@example.com`
   - パスワード: `123456`

3. チャットページにリダイレクトされれば成功！ 🎉

---

## 🆘 うまくいかない場合

### エラー: "Database error saving new user"

👉 **ステップ2のメール確認設定を再確認してください**

### エラー: "User already registered"

👉 **Supabase SQL Editorで以下を実行**:
```sql
DELETE FROM auth.users;
```

その後、もう一度登録を試してください。

### その他のエラー

👉 ブラウザのコンソール（F12）を開いて、エラーメッセージを確認してください。

---

## 📚 詳細ドキュメント

- マイグレーション方法: `docs/DATABASE_MIGRATION_GUIDE.md`
- 古いユーザーの対応: `docs/OLD_USER_CLEANUP.md`
- トラブルシューティング: `docs/TROUBLESHOOTING.md`

---

**これで完了です！** 🎊
