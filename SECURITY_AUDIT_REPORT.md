# セキュリティ監査レポート

調査日: 2025-12-30

## 概要

本レポートは、アプリケーション全体のセキュリティと動作の問題点を洗い出した結果をまとめたものです。

---

## 1. 重大な問題 (要修正)

### 1.1 API `/api/drive/search` - 認証チェックなし

**ファイル:** `app/api/drive/search/route.ts`

**問題:**
- このAPIルートは認証チェックを全く行っていない
- `accessToken` はリクエストボディから受け取るが、ユーザーの認証状態を確認していない
- 悪意のあるユーザーがaccessTokenを取得した場合、認証なしでドライブ検索ができる

**リスク:** 高

**修正案:**
```typescript
import { requireFirebaseAuth } from '@/lib/firebase-api-auth'

export async function POST(request: NextRequest) {
  // 認証チェックを追加
  const auth = await requireFirebaseAuth(request)
  if (!auth.authorized) return auth.error!

  // 既存の処理...
}
```

---

### 1.2 API `/api/generate-template` - 認証チェックなし

**ファイル:** `app/api/generate-template/route.ts`

**問題:**
- このAPIルートも認証チェックを行っていない
- 誰でもプロンプトテンプレートを生成できてしまう
- APIキー（Gemini）を消費される可能性がある

**リスク:** 中

**修正案:**
```typescript
import { requireFirebaseAuth } from '@/lib/firebase-api-auth'

export async function POST(request: NextRequest) {
  const auth = await requireFirebaseAuth(request)
  if (!auth.authorized) return auth.error!

  // 既存の処理...
}
```

---

### 1.3 チャットでのDrive検索呼び出し - 認証ヘッダーなし

**ファイル:** `app/(app)/chat/hooks/useChat.ts` (行339-348)

**問題:**
- `/api/drive/search` を呼び出す際に認証ヘッダー(Authorization: Bearer)を送信していない
- サーバー側で認証を追加した場合、このクライアントコードも修正が必要

**現在のコード:**
```typescript
fetch('/api/drive/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: companyDriveConnection.accessToken,
    query: query,
    folderId: companyDriveConnection.driveFolderId,
  }),
})
```

**修正案:**
```typescript
// Firebase IDトークンを取得して送信
const idToken = await user?.getIdToken()
fetch('/api/drive/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({...}),
})
```

---

## 2. 中程度の問題 (推奨修正)

### 2.1 ProtectedRoute - プロフィール検証なし

**ファイル:** `components/ProtectedRoute.tsx`

**問題:**
- ユーザーが認証されていることだけをチェック
- `profile` が存在するか、`companyId` が正しいかはチェックしていない
- プロフィール作成に失敗したユーザーがアプリにアクセスできてしまう

**現在のコード:**
```typescript
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (!loading && !user) {
    router.push('/auth/login')
  }
  // profile の検証がない
}
```

**修正案:**
```typescript
export function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (!loading && !user) {
    router.push('/auth/login')
  }

  // profileの検証を追加
  if (!loading && user && !profile?.companyId) {
    router.push('/auth/complete-profile') // または適切なエラーページ
  }
}
```

---

### 2.2 Firestoreクライアント関数 - ユーザーID検証なし

**ファイル:** `lib/firestore-chat.ts`

**問題:**
以下の関数は、IDだけで操作を行い、クライアント側でユーザーIDやcompanyIDのチェックをしていない:

| 関数名 | パラメータ | 問題点 |
|--------|-----------|--------|
| `getConversation()` | conversationId | ユーザーID検証なし |
| `deleteConversation()` | conversationId | ユーザーID検証なし |
| `updateConversationTitle()` | conversationId | ユーザーID検証なし |
| `updateFolder()` | folderId | companyID検証なし |
| `deleteFolder()` | folderId | companyID検証なし |
| `deleteDocument()` | documentId | companyID検証なし |

**軽減要因:**
- Firestoreセキュリティルールで保護されているため、実際にはアクセス拒否される
- ただし、UXが悪い（エラーメッセージがユーザーに分かりにくい）

**修正案（オプション）:**
クライアント側でも事前にチェックを行い、より良いエラーメッセージを表示する

---

## 3. 軽微な問題 (検討事項)

### 3.1 settings/page.tsx - APIキーの表示方法

**ファイル:** `app/(app)/settings/page.tsx` (行170)

**現状:**
```typescript
keys[provider.settingKey] = `${keyValue.substring(0, 8)}${'*'.repeat(20)}${keyValue.substring(keyValue.length - 4)}`
```

**問題:**
- APIキーの最初の8文字と最後の4文字が表示される
- これにより、一部のAPIキー形式では推測の手がかりになる可能性

**推奨:**
- 最初の4-6文字と最後の2-4文字程度に制限
- または「設定済み」のみ表示

---

### 3.2 Googleドライブトークン - sessionStorageの使用

**ファイル:** `lib/firebase-auth.ts` (行148)

**現状:**
```typescript
sessionStorage.setItem('google_drive_token', accessToken)
```

**評価:**
- `sessionStorage` はタブごとに独立しているため、複数タブ問題は発生しない
- タブを閉じるとトークンが消えるため、セキュリティ上は適切
- **問題なし** (現状維持で可)

---

## 4. エッジケース（異常系動作）

### 4.1 プロフィールが存在しないユーザー

**シナリオ:**
1. ユーザーがFirebase Authで認証される
2. Firestoreへのプロフィール作成が失敗（ネットワークエラー等）
3. ユーザーは認証済みだが、profile = null

**現在の動作:**
- チャットページ: `profile?.companyId` が undefined → ナレッジ検索ができない
- 設定ページ: 企業名が表示されない
- ナレッジページ: ドキュメント一覧が取得できない

**推奨対応:**
- ProtectedRoute でprofile存在チェック
- プロフィール未完了時は専用ページにリダイレクト

---

### 4.2 複数タブでの同時操作

**修正済み項目:**
- `localStorage` の `company_id` 問題 → **修正完了**

**残存リスク:**
- 同一ブラウザで異なるアカウントにログインした場合、Firebase Authの状態が共有される
- これはFirebaseの仕様であり、完全な対策は困難

---

### 4.3 アクセストークン有効期限切れ

**シナリオ:**
1. Googleドライブに接続
2. 1時間後（トークン有効期限）
3. ドライブ検索を実行 → 失敗

**現在の動作:**
- エラーが発生するが、ユーザーには分かりにくいメッセージ

**推奨対応:**
- トークンリフレッシュの実装
- または、有効期限切れ時に再接続を促すUI

---

### 4.4 無効なconversationIdへのアクセス

**シナリオ:**
1. URLパラメータ `?id=invalid_id` で直接アクセス
2. 存在しない会話ID

**現在の動作:**
- `loadExistingConversation` でメッセージが0件 → resetChat() → `/chat` にリダイレクト
- **適切に処理されている** ✓

---

### 4.5 他ユーザーの会話IDへのアクセス

**シナリオ:**
1. ユーザーAの会話ID (`conv_A`) を知っているユーザーB
2. ユーザーBが `?id=conv_A` でアクセス

**現在の動作:**
- Firestoreセキュリティルールにより拒否される
- ただし、エラーメッセージがユーザーに分かりにくい（コンソールエラー）

**推奨対応:**
- より分かりやすいエラーハンドリング

---

## 5. 認証済みAPI一覧

| APIルート | 認証 | 備考 |
|----------|------|------|
| `/api/simple-agent` | ✓ あり | `requireFirebaseAuth` 使用 |
| `/api/market-analysis` | ✓ あり | `requireFirebaseAuth` 使用 |
| `/api/generate-tasks` | ✓ あり | `requireFirebaseAuth` 使用 |
| `/api/drive/search` | ✗ なし | **要修正** |
| `/api/generate-template` | ✗ なし | **要修正** |

---

## 6. Firestoreセキュリティルール評価

**ファイル:** `firestore.rules`

| コレクション | ルール | 評価 |
|-------------|--------|------|
| conversations | userId一致チェック | ✓ 適切 |
| messages | 親会話のuserId一致チェック | ✓ 適切 |
| documents | companyId一致チェック | ✓ 適切 |
| folders | companyId一致チェック | ✓ 適切 |
| fileSearchStores | companyId一致チェック | ✓ 適切 |
| profiles | uid一致チェック | ✓ 適切 |
| companies | 認証済み読み取り可 | ✓ 適切 |
| companies/promptTemplates | companyId一致チェック | ✓ 適切 |

**総評:** Firestoreセキュリティルールは適切に設計されている

---

## 7. 修正優先度

### 高優先度 (すぐに修正)
1. `/api/drive/search` に認証チェック追加
2. `/api/generate-template` に認証チェック追加
3. useChat.ts のfetch呼び出しに認証ヘッダー追加

### 中優先度 (早めに修正)
4. ProtectedRoute にprofile検証追加
5. 残りのAPIルートの認証状態確認

### 低優先度 (検討)
6. APIキー表示のマスク範囲調整
7. クライアント側のエラーハンドリング改善

---

## 8. まとめ

- **修正済み:** localStorage による複数タブ問題
- **要修正:** 2つのAPIルートの認証チェック
- **Firestoreルール:** 適切に設計されている
- **全体評価:** 基本的なセキュリティは確保されているが、一部のAPIルートに認証漏れがある
とにかく、その、何やろうな、えっと、Googleドライブとかの検索とか、テンプレート生成は別にやってもいいかなって感じです。 で、えっと、ユーザー認証のみで、いや、そうやな。 なんか、ちゃんと企業名とユーザーの名前、名前っていうか、その、あれかな。

その、登録したらちゃんと名前入れる瞬間欲しいよね。 ログインの時に。 あるっけ。 なかったら入れるようにしてほしい。 忘れちゃった。 で、あとは、ドライブのアクセストークン切れるのちょっと辛いかなっていうところと、あとはその、入れてるナレッジ、PDFとかやったら、そのPDFがバーって開くようにしたいねんな。

別タブで。 別タブで開くようにしたくて、内容どんなんか書かれてるかみたいな、その、ページ数とかも多分あると思う。 と思うから、そのページ数のところが、ベースで全部がバーンって開くようにしてほしいのと、あとはその、ナレッジってところ。

ナレッジちゃうわ。 えっと、会話で最後バーンって出てくるURLとかあるけど、そこはちょっとあの、量が多くなりすぎるから、もうちょっとこう、出てくるものは省略してほしい。 で、URLとかにしておいてピッと押したら、URLのやつは別タブでURL開くがいいです。

お願いします。