# Supabaseメール確認の無効化

## 🔴 問題

サインアップ時に「Database error saving new user」エラーが発生する場合、Supabaseでメール確認が有効になっている可能性があります。

## 💡 解決方法

Supabaseダッシュボードでメール確認を無効にします。

## 📋 手順

### 1. Supabaseダッシュボードにアクセス

https://supabase.com/dashboard

### 2. プロジェクトを選択

### 3. 左メニューから「Authentication」をクリック

### 4. 「Providers」タブをクリック

### 5. 「Email」を選択

### 6. 「Confirm email」をOFFにする

- スイッチを無効化します

### 7. 「Save」ボタンをクリック

---

## 🧪 テスト

1. ブラウザのキャッシュをクリア:
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

2. サインアップページにアクセス:
http://localhost:3002/auth/signup

3. 企業名、お名前、メールアドレス、パスワードを入力して登録

4. エラーが出ずに、チャットページにリダイレクトされれば成功！

---

## 📊 確認方法

コンソールで以下のログが表示されていれば正常に動作しています：

```
Starting signup process...
Signup result: { authData: {...}, authError: null }
User created: [user-id]
Normalizing company name: アドナス株式会社
Normalized name: あどなす
Searching for existing company...
Creating new company...
Company created: [company-id]
Creating profile for user: [user-id]
Profile created successfully
Signup complete! Redirecting to chat...
```

---

## ⚠️ トラブルシューティング

### エラー: "Database error saving new user"

**原因**: メール確認が有効になっている

**解決方法**: 上記の手順でメール確認を無効化

---

### エラー: "User already registered"

**原因**: 既にそのメールアドレスで登録されている

**解決方法**:
1. 古いユーザーを削除（`DELETE FROM auth.users;`）
2. または、ログインページからログイン

---

### エラー: "Profile creation error"

**原因**: `profiles`テーブルのRLSポリシーまたは外部キー制約の問題

**解決方法**:
```sql
-- プロフィールテーブルの状態を確認
SELECT * FROM profiles;

-- RLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## 🎯 推奨設定

開発環境では以下の設定を推奨します：

1. ✅ メール確認: **OFF**
2. ✅ 自動確認: **ON** （Supabase Settings > Auth > Email Auth Settings > Enable email confirmations: OFF）
3. ✅ パスワードの最小文字数: **6文字**
