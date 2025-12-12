# トラブルシューティングガイド

## 🚨 設定が保存されない問題

### 症状

- ユーザー名を入力して保存しても、リロードすると消える
- Claude APIキーを保存しても、反映されない
- 「保存しました」と表示されるが、実際には保存されていない

### 原因

`app_settings`テーブルにUNIQUE制約が設定されていないため、upsert（更新または挿入）が正しく動作していません。

### 解決方法

#### ステップ1: Supabase SQL Editorを開く

https://supabase.com/dashboard/ にアクセスして、プロジェクトを選択し、左メニューから「SQL Editor」を開きます。

#### ステップ2: FIX_CONSTRAINTS.sqlを実行

`supabase/FIX_CONSTRAINTS.sql` の内容を**全てコピー**して、SQL Editorに貼り付けて実行します。

このSQLは以下を実行します：
1. 既存の重複データを削除
2. UNIQUE制約を追加
3. インデックスを作成（パフォーマンス向上）
4. RLSポリシーを再作成
5. 結果を確認

#### ステップ3: 結果を確認

実行後、以下のような結果が表示されればOKです：
```
status: "FIX completed successfully! Settings can now be saved."
```

#### ステップ4: アプリケーションで動作確認

1. サーバーを再起動: `npm run dev`
2. 設定ページ（http://localhost:3000/settings）を開く
3. ユーザー名を入力して保存
4. **ページをリロード**
5. ユーザー名が残っていればOK！

---

## 🔐 認証関連の問題

### ログインできない

**メール確認が必要になっている場合:**

開発環境では、Supabaseのメール確認を無効にすることを推奨します：

1. Supabaseダッシュボード → Authentication → Providers
2. Email provider設定を開く
3. "Confirm email"のチェックを外す
4. Save

### セッションが切れる

ブラウザのCookieが有効になっていることを確認してください。

---

## 📁 ファイルアップロードの問題

### ファイルがアップロードできない

**Storage バケットの確認:**

1. Supabaseダッシュボード → Storage
2. `documents`バケットが存在するか確認
3. 存在しない場合は、`supabase/SETUP.sql`を再実行

**RLSポリシーの確認:**

Storageのポリシーが正しく設定されているか確認：

```sql
SELECT * FROM storage.policies WHERE bucket_id = 'documents';
```

---

## 🤖 Claude APIの問題

### Claude APIが応答しない

**APIキーの確認:**

1. 設定ページでClaude APIキーが正しく設定されているか確認
2. Anthropic Consoleでキーが有効か確認
3. APIキーの権限を確認

**エラーメッセージを確認:**

ブラウザの開発者ツール（F12）→ Consoleタブでエラーを確認

---

## 🗄️ データベース関連

### データが表示されない

**RLSポリシーの確認:**

```sql
-- supabase/CHECK_DATABASE.sql を実行
```

以下を確認：
- RLSが有効になっているか
- 適切なポリシーが存在するか
- ポリシーの条件が正しいか

### マイグレーションエラー

データベースを完全にリセットする場合：

1. Supabaseダッシュボード → Database → Tables
2. すべてのテーブルを削除
3. `supabase/SETUP.sql`を実行
4. `supabase/FIX_CONSTRAINTS.sql`を実行

---

## 🌐 ネットワーク関連

### CORSエラー

Next.jsのAPIルートを経由しているため、通常CORSエラーは発生しません。発生した場合は：

1. `.env`ファイルの設定を確認
2. Supabase URLが正しいか確認
3. ブラウザのキャッシュをクリア

---

## 📞 サポート

上記で解決しない場合は、以下の情報を提供してください：

1. `supabase/CHECK_DATABASE.sql`の実行結果
2. ブラウザコンソールのエラーメッセージ
3. サーバーログのエラーメッセージ
4. 再現手順
# Google Drive連携 トラブルシューティング記録

## 概要
会社レベルのGoogleドライブ連携機能を実装した際に発生したエラーと解決方法の記録。

---

## エラー1: ログインできない（Firestoreパーミッションエラー）

### 症状
- ログイン画面で「データベースへのアクセス権限がありません。管理者に連絡してください」と表示
- コンソールに `Missing or insufficient permissions` エラー

### 原因
Firestoreのセキュリティルールが設定されていない、または公開されていなかった。

### 解決方法
Firebase Console → Firestore Database → ルール で以下を設定して「公開」:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /companies/{companyId} {
      allow read, write: if request.auth != null;
    }
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null;
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    match /documents/{docId} {
      allow read, write: if request.auth != null;
    }
    match /folders/{folderId} {
      allow read, write: if request.auth != null;
    }
    match /fileSearchStores/{storeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 重要なポイント
- ルールを編集しただけでは適用されない
- **「公開」ボタンを押して初めて有効になる**

---

## エラー2: ポップアップがブロックされました

### 症状
- 設定画面で「会社のGoogleドライブに接続」ボタンをクリック
- 「ポップアップがブロックされました。ポップアップを許可してください」と表示

### 原因
Google OAuth認証でポップアップ方式（`signInWithPopup`）を使用していたが、ブラウザがポップアップをブロックした。

### 試した解決方法

#### 試行1: リダイレクト方式に変更（失敗）
```typescript
// 変更前
const result = await signInWithPopup(auth, googleProvider)

// 変更後
await signInWithRedirect(auth, googleProvider)
// 戻ってきたら
const result = await getRedirectResult(auth)
```

**結果**: リダイレクト方式では `getRedirectResult` から OAuth アクセストークンが取得できなかった。Firebaseの制限。

#### 試行2: ポップアップ方式に戻す（成功）
ポップアップ方式に戻し、ユーザーにポップアップを許可するよう案内する方針に変更。

### 最終的な解決方法
1. ポップアップ方式を使用
2. ポップアップがブロックされた場合はエラーメッセージを表示
3. ユーザーはブラウザのアドレスバー右側のポップアップブロックアイコンをクリックして許可

### コード（最終版）
```typescript
// lib/firebase-auth.ts
export async function linkGoogleDrive(): Promise<{
  accessToken: string | null
  error: any
}> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return { accessToken: null, error: { message: 'ログインしていません' } }
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken || null

    if (accessToken) {
      sessionStorage.setItem('google_drive_token', accessToken)
    }

    return { accessToken, error: null }
  } catch (error: any) {
    return { accessToken: null, error: { message: getGoogleErrorMessage(error.code) } }
  }
}
```

---

## エラー3: アクセストークンの取得に失敗しました

### 症状
- Google認証のリダイレクト後、「アクセストークンの取得に失敗しました」と表示
- コンソールに `[Drive] No access token received` ログ

### 原因
Firebaseの `signInWithRedirect` + `getRedirectResult` の組み合わせでは、OAuth アクセストークンが返されないことがある。特に既にログインしているユーザーの場合。

### 解決方法
ポップアップ方式（`signInWithPopup`）を使用する。ポップアップ方式では `GoogleAuthProvider.credentialFromResult(result)` からアクセストークンを確実に取得できる。

---

## エラー4: 本番環境でのみエラーが発生

### 症状
- ローカル（localhost:3000）では動作する
- 本番環境（Vercel）では動作しない

### 考えられる原因と確認事項

#### 1. Firebase Authorized Domains
Firebase Console → Authentication → Settings → Authorized domains に本番ドメインが追加されているか確認:
- `company-ai-egent.vercel.app`

#### 2. Google Cloud OAuth リダイレクトURI
Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs に以下が追加されているか確認:
- `https://company-ai-egent.vercel.app/__/auth/handler`

#### 3. Vercel環境変数
Vercelダッシュボード → Settings → Environment Variables に以下が設定されているか確認:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## UI/UXの改善

### 問題
リダイレクト認証後、成功/失敗がUIに表示されず、ユーザーが結果を確認できなかった。

### 解決方法
1. 処理中の状態を表示（スピナー + 「Google認証を処理中...」）
2. 成功時に緑色で「Googleドライブに接続しました！」と表示
3. 失敗時に赤色でエラーメッセージを表示
4. コンソールにデバッグログを出力（`[Drive]` プレフィックス）

---

## 学んだこと

1. **Firebaseルールは「公開」しないと適用されない**
2. **リダイレクト方式ではOAuthアクセストークンが取得できないことがある**
3. **本番環境では必ずドメイン設定を確認する**
   - Firebase Authorized Domains
   - Google Cloud OAuth リダイレクトURI
   - Vercel環境変数
4. **UIフィードバックは必須** - 処理中、成功、失敗の状態を明確に表示する
5. **デバッグログを入れておくと問題特定が楽** - `console.log('[機能名]', ...)` 形式で統一

---

## 関連ファイル
- `lib/firebase-auth.ts` - Google認証関連の関数
- `app/(app)/settings/page.tsx` - 設定画面（ドライブ連携UI）
- `lib/firestore-chat.ts` - Firestore操作（会社のドライブ接続情報保存）
- `app/api/drive/search/route.ts` - ドライブ検索API
