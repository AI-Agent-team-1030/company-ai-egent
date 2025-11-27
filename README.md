# 法人AIエージェントシステム

Next.js 14で構築された、マルチテナント対応の社内AIポータルサイトです。

**Version 2.0 - Firebase + Gemini AI統合版**

企業ごとにナレッジを蓄積し、Gemini AIが社内情報に基づいて質問に答える、シンプルで使いやすい社内ポータルサイトです。

## コンセプト

- 企業ごとに独立したナレッジベース
- Gemini AI File Searchによる高精度なドキュメント検索
- シンプルで使いやすいインターフェース

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envにFirebaseとGemini APIの設定を記入

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 環境変数

`.env`ファイルに以下を設定：

```env
# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini AI設定
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

## 搭載機能

### 1. AIチャット
社内のことを質問したら答えてくれる

- Gemini 2.5 Proによる高品質な回答生成
- ナレッジ検索トグルでFile Search ON/OFF切り替え
- 会話履歴の保存と管理
- 企業ごとに独立したチャット履歴

### 2. ナレッジボックス
社員がナレッジを上げて共有

- Gemini AI File Searchによるドキュメントインデックス化
- フォルダーによる整理
- PDF, Word, Excel, CSV, テキストファイル対応
- 企業ごとに独立したナレッジベース
- アップロード後、チャットで自動的に検索可能

### 3. 設定
ユーザー設定とAIモデル管理

- プロフィール管理
- AIモデルの選択（企業単位で設定可能）
- 通知設定

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **アニメーション**: Framer Motion
- **アイコン**: Heroicons
- **状態管理**: Zustand, React Context

### バックエンド
- **認証**: Firebase Authentication
- **データベース**: Cloud Firestore
- **AI**: Gemini 2.5 Pro (Google AI)
- **ドキュメント検索**: Gemini File Search API

### セキュリティ
- Firebase Security Rules
- 企業ごとのデータ分離（companyId）
- Row Level Security相当の実装

## Firestoreデータ構造

```
profiles/{userId}
  - companyId: string
  - companyName: string
  - email: string
  - role: string

companies/{companyId}
  - name: string
  - aiSettings: object

conversations/{conversationId}
  - userId: string
  - title: string
  - createdAt: timestamp
  - updatedAt: timestamp
  └── messages/{messageId}
      - role: 'user' | 'assistant'
      - content: string
      - citations: array
      - createdAt: timestamp

documents/{documentId}
  - companyId: string
  - userId: string
  - fileName: string
  - originalFileName: string
  - geminiFileName: string
  - folderId: string | null
  - createdAt: timestamp

folders/{folderId}
  - companyId: string
  - userId: string
  - name: string
  - parentFolderId: string | null
  - createdAt: timestamp

fileSearchStores/{storeId}
  - companyId: string
  - userId: string
  - storeName: string
  - displayName: string
  - createdAt: timestamp
```

## 使い方

1. **企業名・メール・パスワードでログイン**
   - 同じ企業名のユーザーはナレッジを共有

2. **ナレッジボックスにドキュメントをアップロード**
   - Gemini AIが自動でインデックス化

3. **チャットでナレッジ検索をONにして質問**
   - AIが社内ドキュメントを参照して回答

4. **必要に応じて新しいナレッジを追加**
   - 組織の知識が蓄積されていく

## Firestore Security Rules

Firebase Consoleで以下のルールを設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証済みユーザーのみアクセス可能
    function isAuthenticated() {
      return request.auth != null;
    }

    // ユーザー自身のプロフィールのみ
    match /profiles/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }

    // 会社情報
    match /companies/{companyId} {
      allow read, update: if isAuthenticated();
      allow create: if isAuthenticated();
    }

    // 会話
    match /conversations/{conversationId} {
      allow read, write: if isAuthenticated();
      match /messages/{messageId} {
        allow read, write, delete: if isAuthenticated();
      }
    }

    // ドキュメント
    match /documents/{documentId} {
      allow read, write: if isAuthenticated();
    }

    // フォルダ
    match /folders/{folderId} {
      allow read, write: if isAuthenticated();
    }

    // File Search Stores
    match /fileSearchStores/{storeId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

## デプロイ（Vercel）

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

## ライセンス

MIT
