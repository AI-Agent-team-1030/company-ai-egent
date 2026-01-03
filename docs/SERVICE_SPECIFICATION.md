# 社内ナレッジ検索くん - サービス仕様書

**Version 2.0 - Firebase + Gemini AI + マルチエージェント統合版**

> このドキュメントは、本サービスの全体像を他のAIシステムやエンジニアに正確に伝えるために作成されました。

---

## 1. サービス概要

### 1.1 コンセプト

「社内ナレッジ検索くん」は、企業向けのマルチテナント対応AIポータルサイトです。企業ごとに独立したナレッジベースを構築し、Gemini AIを活用して社内情報に基づく高精度な質問応答を実現します。

### 1.2 主要価値提案

| 価値 | 説明 |
|------|------|
| **企業単位のデータ分離** | `companyId`による完全なマルチテナント分離 |
| **AIによる知識活用** | Gemini File Searchによるセマンティック検索 |
| **マルチエージェント** | タスクに応じた専門エージェントの自動生成・実行 |
| **外部連携** | Google Drive / OneDrive統合による既存資産活用 |
| **マルチAIプロバイダー** | Gemini / Claude / GPT の切り替え対応 |

---

## 2. 技術スタック

### 2.1 フロントエンド

```
Framework:     Next.js 14 (App Router)
Language:      TypeScript
Styling:       Tailwind CSS
Animation:     Framer Motion
Icons:         Heroicons
State:         Zustand + React Context
Markdown:      react-markdown + remark-gfm
```

### 2.2 バックエンド・インフラ

```
認証:          Firebase Authentication
データベース:   Cloud Firestore
ストレージ:     Firebase Storage
AI (標準):      Gemini 2.5 Pro / Flash (Google AI)
AI (オプション): Claude (Anthropic) / GPT (OpenAI)
検索:          Gemini File Search API
ホスティング:   Vercel
```

### 2.3 主要依存パッケージ

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| `@google/genai` | ^1.30.0 | Gemini AI SDK |
| `@anthropic-ai/sdk` | ^0.68.0 | Claude API |
| `openai` | ^6.9.1 | OpenAI API |
| `firebase` | ^12.6.0 | Firebase Client SDK |
| `firebase-admin` | ^13.6.0 | Firebase Admin SDK |
| `@azure/msal-browser` | ^4.27.0 | Azure AD/OneDrive認証 |
| `pdf-parse-fork` | ^1.2.0 | PDF解析 |
| `mammoth` | ^1.11.0 | Word文書解析 |
| `xlsx` | ^0.18.5 | Excel解析 |

---

## 3. アーキテクチャ

### 3.1 ディレクトリ構造

```
/
├── app/                          # Next.js App Router
│   ├── (app)/                    # 認証済みユーザー用ページ
│   │   ├── chat/                 # AIチャット機能
│   │   │   ├── components/       # ChatInput, MessageList, AgentSelector等
│   │   │   ├── hooks/            # useChat, useAgentExecution等
│   │   │   └── page.tsx
│   │   ├── knowledge/            # ナレッジ管理
│   │   │   ├── components/       # DocumentList, FolderList等
│   │   │   ├── hooks/            # useDocuments等
│   │   │   └── page.tsx
│   │   ├── settings/             # 設定
│   │   │   ├── components/       # AgentManager, TemplateManager等
│   │   │   └── page.tsx
│   │   ├── agent-dashboard/      # マルチエージェント実行画面
│   │   ├── agent-builder/        # エージェント作成画面
│   │   ├── agents/               # エージェント一覧
│   │   └── layout.tsx            # サイドバー・ヘッダー含むレイアウト
│   ├── api/                      # API Routes
│   │   ├── agent/
│   │   │   ├── execute/          # エージェント実行 (SSE)
│   │   │   ├── orchestrate/      # マルチエージェントオーケストレーション
│   │   │   ├── parallel/         # 並列実行
│   │   │   └── router/           # 動的エージェントルーティング
│   │   ├── drive/search/         # Google Drive検索
│   │   ├── onedrive/search/      # OneDrive検索
│   │   ├── web/search/           # Web検索
│   │   ├── generate-agent/       # AIによるエージェント自動生成
│   │   ├── generate-template/    # テンプレート生成
│   │   └── generate-tasks/       # タスク分解
│   ├── auth/                     # 認証ページ
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify-email/
│   └── layout.tsx                # ルートレイアウト
├── components/                   # 共有UIコンポーネント
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── GoogleDrivePicker.tsx
│   ├── ProtectedRoute.tsx
│   └── ChatSidePanel.tsx
├── contexts/                     # React Context
│   ├── AuthContext.tsx           # 認証状態管理
│   └── ChatPanelContext.tsx
├── lib/                          # ビジネスロジック・ユーティリティ
│   ├── ai-providers.ts           # マルチAIプロバイダー統合
│   ├── agent-router.ts           # 動的エージェント生成
│   ├── agent-tools.ts            # ツール実行ロジック
│   ├── built-in-agents.ts        # 組み込みエージェント定義
│   ├── firebase.ts               # Firebase初期化
│   ├── firebase-auth.ts          # 認証ヘルパー
│   ├── firebase-admin.ts         # Admin SDK
│   ├── firestore-chat.ts         # チャット・ドキュメントCRUD
│   ├── firestore-agents.ts       # エージェントCRUD
│   ├── firestore-templates.ts    # テンプレートCRUD
│   ├── gemini-file-search.ts     # Gemini File Search統合
│   ├── google-drive.ts           # Google Drive API
│   ├── msal-config.ts            # Azure AD設定
│   ├── logger.ts                 # 構造化ロギング
│   ├── rate-limit.ts             # レート制限
│   └── types/
│       ├── index.ts              # 共通型定義
│       └── agent.ts              # エージェント関連型
└── public/                       # 静的ファイル
```

### 3.2 データフロー

```
[ユーザー入力]
     ↓
[ChatInput] → useChat hook
     ↓
[エージェント選択] (optional)
     ↓
┌─────────────────────────────────────────┐
│        /api/agent/execute (SSE)          │
│  1. 認証チェック                          │
│  2. エージェント設定取得                   │
│  3. ツール実行 (並列)                      │
│     - knowledge_search → Gemini File Search
│     - drive_search → Google Drive API    │
│     - web_search → Gemini Grounding      │
│  4. コンテキスト統合                       │
│  5. AI応答生成                            │
│  6. SSEストリーミング                      │
└─────────────────────────────────────────┘
     ↓
[MessageList] → 引用表示
     ↓
[Firestore保存] → conversations/{id}/messages
```

---

## 4. 主要機能詳細

### 4.1 AIチャット機能

#### 4.1.1 基本チャット

```typescript
// lib/gemini-file-search.ts
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ナレッジ検索なしの通常チャット
async function chat(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt?: string,
  model?: string  // default: gemini-2.5-pro
): Promise<{ answer: string; error: string | null }>
```

#### 4.1.2 ナレッジ検索付きチャット

高精度RAG (Retrieval-Augmented Generation) 実装:

1. **Query Rewriting**: ユーザー質問を検索用クエリに最適化
2. **Multi-Query Search**: 複数の視点からのクエリで網羅性向上
3. **HyDE (Hypothetical Document Embeddings)**: 仮想回答を検索クエリとして使用
4. **Reranking**: 関連性スコアによる結果の再順位付け

```typescript
// lib/gemini-file-search.ts

// 検索クエリ生成
async function generateSearchQuery(
  apiKey: string,
  userQuestion: string,
  conversationHistory: ChatMessage[]
): Promise<{ query: string; queries: string[]; error: string | null }>

// 高精度検索
async function advancedKnowledgeSearch(
  apiKey: string,
  storeNames: string[],
  originalQuestion: string,
  queries: string[]
): Promise<{ citations: Citation[]; error: string | null }>
```

#### 4.1.3 サポートAIモデル

| Provider | モデル | 説明 | APIキー要否 |
|----------|--------|------|-------------|
| **Gemini** | gemini-2.5-pro | 高度な推論・長文 | 環境変数（標準） |
| **Gemini** | gemini-2.5-flash | 高速レスポンス | 環境変数（標準） |
| **Gemini** | gemini-exp-1206 | 実験モデル | 環境変数（標準） |
| **Claude** | claude-sonnet-4.5 | バランス型 | ユーザー設定 |
| **Claude** | claude-haiku-4.5 | 高速・低コスト | ユーザー設定 |
| **GPT** | gpt-5.1 | OpenAI最新 | ユーザー設定 |

### 4.2 ナレッジ管理機能

#### 4.2.1 ドキュメントアップロード

```typescript
// 対応ファイル形式
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        // .xlsx
  'text/csv',
  'text/plain',
  'text/markdown'
]

// アップロードフロー
1. Firebase Storageにファイル保存
2. Gemini File Storage にアップロード
3. File Search Store にインポート
4. Firestoreにメタデータ保存
```

#### 4.2.2 フォルダ管理

- 階層構造対応 (`parentFolderId`)
- フォルダ単位でのドキュメント整理
- フォルダ削除時のドキュメント移動

### 4.3 マルチエージェント機能

#### 4.3.1 エージェント定義

```typescript
// lib/types/agent.ts
interface Agent {
  id: string
  name: string
  description: string
  category: string  // 汎用 | 文書作成 | リサーチ | サポート | 開発 | 営業 | マーケティング
  systemPrompt: string

  // 設定
  tools: AgentTool[]
  model: AgentModel
  maxTokens?: number
  temperature?: number

  // メタデータ
  isBuiltIn: boolean      // 組み込みエージェント
  isShared: boolean       // 企業共有
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

type AgentTool =
  | 'knowledge_search'    // ナレッジベース検索
  | 'drive_search'        // Google Drive検索
  | 'web_search'          // Web検索
  | 'document_generate'   // 文書生成
  | 'api_call'            // 外部API（将来）
  | 'code_execute'        // コード実行（将来）
```

#### 4.3.2 組み込みエージェント

| ID | 名前 | カテゴリ | ツール | モデル |
|----|------|----------|--------|--------|
| general-assistant | 汎用アシスタント | 汎用 | knowledge, drive | auto |
| document-writer | 文書作成エージェント | 文書作成 | knowledge, document | gemini-2.5-pro |
| research-analyst | リサーチアナリスト | リサーチ | knowledge, drive, web | gemini-2.5-pro |
| customer-support | カスタマーサポート | サポート | knowledge | gemini-2.5-flash |
| code-reviewer | コードレビュアー | 開発 | knowledge, code | claude-sonnet-4.5 |
| sales-assistant | 営業支援エージェント | 営業 | knowledge, drive, document | gemini-2.5-pro |
| marketing-assistant | マーケティングエージェント | マーケティング | knowledge, drive, web, document | gemini-2.5-pro |
| meeting-minutes | 議事録作成エージェント | 業務効率化 | knowledge, document | gemini-2.5-flash |

#### 4.3.3 エージェント実行フロー

```
[ユーザーメッセージ]
        ↓
[/api/agent/execute]
        ↓
┌───────────────────────┐
│  SSE Event: status    │ → "analyzing" (質問分析中)
└───────────────────────┘
        ↓
┌───────────────────────┐
│  ツール実行 (並列)     │
│  - knowledge_search   │ → SSE Event: tool_result
│  - drive_search       │ → SSE Event: tool_result
│  - web_search         │ → SSE Event: tool_result
└───────────────────────┘
        ↓
┌───────────────────────┐
│  SSE Event: status    │ → "generating" (回答生成中)
└───────────────────────┘
        ↓
┌───────────────────────┐
│  SSE Event: content   │ → AI応答テキスト
└───────────────────────┘
        ↓
┌───────────────────────┐
│  SSE Event: complete  │ → 完了結果 + 引用情報
└───────────────────────┘
```

#### 4.3.4 マルチエージェントオーケストレーション

複雑なタスクを複数のエージェントで協調処理:

```typescript
// /api/agent/orchestrate
interface OrchestrationPlan {
  taskAnalysis: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: AgentPlan[]
  synthesisPrompt: string  // 結果統合用
}

interface AgentPlan {
  name: string
  role: string
  systemPrompt: string
  tools: AgentTool[]
  dependsOn?: string[]  // 依存するエージェント
  priority: number      // 実行優先度
}
```

### 4.4 外部サービス連携

#### 4.4.1 Google Drive連携

```typescript
// lib/firestore-chat.ts
interface CompanyDriveConnection {
  isConnected: boolean
  connectedBy?: string
  connectedByEmail?: string
  connectedAt?: Date
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
  driveFolderId?: string
}
```

- OAuth 2.0によるアクセストークン管理
- 会社単位での共有（一人が接続すれば全員利用可能）
- 特定フォルダ限定検索オプション

#### 4.4.2 OneDrive / SharePoint連携

```typescript
// lib/msal-config.ts
// Azure AD認証設定
const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`
  }
}
```

- MSAL.js による Azure AD認証
- OneDrive / SharePoint Online対応

---

## 5. データモデル (Firestore)

### 5.1 コレクション構造

```
firestore/
├── profiles/{userId}
│   ├── userName: string
│   ├── companyId: string
│   ├── companyName: string
│   ├── anthropic_api_key?: string (暗号化)
│   ├── openai_api_key?: string (暗号化)
│   └── agents/{agentId}              # 個人エージェント (サブコレクション)
│       ├── name: string
│       ├── description: string
│       ├── category: string
│       ├── systemPrompt: string
│       ├── tools: AgentTool[]
│       ├── model: AgentModel
│       ├── usageCount: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── companies/{companyId}
│   ├── name: string
│   ├── aiSettings?: CompanyAISettings
│   ├── driveConnection?: CompanyDriveConnection
│   ├── driveSyncStatus?: DriveSyncStatus
│   ├── onedriveConnection?: CompanyOnedriveConnection
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── agents/{agentId}              # 企業共有エージェント (サブコレクション)
│       ├── name: string
│       ├── description: string
│       ├── category: string
│       ├── systemPrompt: string
│       ├── tools: AgentTool[]
│       ├── model: AgentModel
│       ├── createdBy: string
│       ├── createdByName: string
│       ├── usageCount: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── conversations/{conversationId}
│   ├── userId: string
│   ├── title: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── messages/{messageId}          # サブコレクション
│       ├── role: 'user' | 'assistant'
│       ├── content: string
│       ├── citations?: Citation[]
│       └── createdAt: timestamp
│
├── documents/{documentId}
│   ├── userId: string
│   ├── companyId: string
│   ├── fileName: string
│   ├── originalFileName: string
│   ├── geminiFileName: string        # Gemini Storage上のファイル名
│   ├── storeName: string             # File Search Store名
│   ├── folderId: string | null
│   ├── fileUrl?: string
│   ├── mimeType?: string
│   └── createdAt: timestamp
│
├── folders/{folderId}
│   ├── userId: string
│   ├── companyId: string
│   ├── name: string
│   ├── parentFolderId: string | null
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── fileSearchStores/{storeId}
│   ├── userId: string
│   ├── companyId: string
│   ├── storeName: string             # Gemini API上のストア名
│   ├── displayName: string
│   └── createdAt: timestamp
│
└── promptTemplates/{templateId}
    ├── userId: string
    ├── companyId: string
    ├── name: string
    ├── category: string
    ├── description: string
    ├── prompt: string
    ├── isShared: boolean
    ├── createdBy?: string
    ├── createdByName?: string
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

### 5.2 主要な型定義

```typescript
// lib/types/index.ts

interface Citation {
  title: string
  text: string
  uri?: string
  source: 'knowledge' | 'drive' | 'onedrive' | 'web'
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  citations?: Citation[]
  model?: string
}

interface CompanyAISettings {
  enabledProviders: string[]
  enabledModels: Record<string, string[]>
  defaultProvider: string
  defaultModel: string
}

interface DriveSyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error'
  lastSyncAt?: Date
  totalFiles: number
  syncedFiles: number
  driveStoreName?: string
  syncedFileIds: string[]
  errorMessage?: string
}
```

---

## 6. API エンドポイント

### 6.1 エージェント関連

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/agent/execute` | POST | エージェント実行 (SSE) |
| `/api/agent/orchestrate` | POST | マルチエージェントオーケストレーション |
| `/api/agent/parallel` | POST | 並列エージェント実行 |
| `/api/agent/router` | POST | 動的エージェントルーティング |
| `/api/generate-agent` | POST | AIによるエージェント自動生成 |

### 6.2 検索関連

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/drive/search` | POST | Google Drive検索 |
| `/api/onedrive/search` | POST | OneDrive検索 |
| `/api/web/search` | POST | Web検索 |

### 6.3 その他

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/generate-template` | POST | テンプレート生成 |
| `/api/generate-tasks` | POST | タスク分解 |
| `/api/market-analysis` | POST | 市場分析 |
| `/api/simple-agent` | POST | シンプルエージェント |

---

## 7. 認証・セキュリティ

### 7.1 認証フロー

```
1. Firebase Authentication (Email/Password)
2. AuthContext でセッション管理
3. API Routes で Firebase Admin SDK による認証チェック
4. Firestore Security Rules による細粒度アクセス制御
```

### 7.2 API認証

```typescript
// lib/firebase-api-auth.ts
async function requireFirebaseAuth(req: NextRequest): Promise<{
  authorized: boolean
  userId?: string
  companyId?: string
  error?: NextResponse
}>
```

### 7.3 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証チェック関数
    function isAuthenticated() {
      return request.auth != null;
    }

    // ユーザープロフィール: 本人のみ
    match /profiles/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;

      // 個人エージェント
      match /agents/{agentId} {
        allow read, write: if isAuthenticated() && request.auth.uid == userId;
      }
    }

    // 会社情報: 認証済みユーザー
    match /companies/{companyId} {
      allow read, update: if isAuthenticated();
      allow create: if isAuthenticated();

      // 企業共有エージェント
      match /agents/{agentId} {
        allow read, write: if isAuthenticated();
      }
    }

    // 会話・メッセージ: 認証済みユーザー
    match /conversations/{conversationId} {
      allow read, write: if isAuthenticated();
      match /messages/{messageId} {
        allow read, write, delete: if isAuthenticated();
      }
    }

    // ドキュメント・フォルダ: 認証済みユーザー
    match /documents/{documentId} {
      allow read, write: if isAuthenticated();
    }
    match /folders/{folderId} {
      allow read, write: if isAuthenticated();
    }

    // File Search Stores: 認証済みユーザー
    match /fileSearchStores/{storeId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

### 7.4 レート制限

```typescript
// lib/rate-limit.ts
// 厳格なレート制限: 60リクエスト/分
function checkStrictRateLimit(req: NextRequest): {
  allowed: boolean
  error?: NextResponse
}
```

---

## 8. 環境変数

### 8.1 必須設定

```env
# Firebase設定
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (サーバーサイド)
FIREBASE_SERVICE_ACCOUNT=       # JSON文字列

# Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=     # クライアント用
GEMINI_API_KEY=                  # サーバー用
```

### 8.2 オプション設定

```env
# Azure AD (OneDrive連携)
NEXT_PUBLIC_AZURE_CLIENT_ID=
NEXT_PUBLIC_AZURE_TENANT_ID=

# Google OAuth (Drive連携)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 追加AIプロバイダー (サーバーサイド)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

## 9. 開発・デプロイ

### 9.1 ローカル開発

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .env を編集

# 開発サーバー起動
npm run dev

# クリーンビルド
npm run dev:clean
```

### 9.2 ビルド・デプロイ

```bash
# ビルド
npm run build

# Lint
npm run lint

# 本番起動
npm start
```

### 9.3 Vercelデプロイ

1. GitHubにプッシュ
2. Vercelでプロジェクトインポート
3. 環境変数設定
4. デプロイ

---

## 10. 今後の拡張計画

### 10.1 実装予定機能

| 機能 | 説明 | 優先度 |
|------|------|--------|
| API Call Tool | 外部APIとの連携 | 中 |
| Code Execute Tool | サンドボックスコード実行 | 中 |
| 音声入力 | Whisper API連携 | 低 |
| 画像認識 | Gemini Vision連携 | 低 |

### 10.2 アーキテクチャ改善案

- Edge Functions への移行検討
- Redis によるセッション・キャッシュ管理
- WebSocket によるリアルタイム協調編集

---

## 11. トラブルシューティング

### 11.1 よくある問題

| 問題 | 原因 | 解決策 |
|------|------|--------|
| Firestore index エラー | インデックス未作成 | Firebase Console でインデックス作成 |
| Gemini API エラー | APIキー無効 or クォータ超過 | キー確認・クォータ確認 |
| Drive検索が動かない | トークン期限切れ | 再接続 |
| エージェントが見つからない | IDミスマッチ | 組み込み・企業・個人の順で検索確認 |

### 11.2 ログ確認

```typescript
// lib/logger.ts
// 各モジュール用のロガー
const authLogger = logger.child({ module: 'auth' })
const apiLogger = logger.child({ module: 'api' })
const geminiLogger = logger.child({ module: 'gemini' })
const firestoreLogger = logger.child({ module: 'firestore' })
const aiLogger = logger.child({ module: 'ai' })
```

---

## 付録A: 型定義インポートガイド

```typescript
// 共通型
import { Message, Citation, Document, Folder, Company } from '@/lib/types'

// エージェント型
import {
  Agent,
  AgentTool,
  AgentModel,
  AgentExecutionResult,
  AgentSSEEventType
} from '@/lib/types/agent'

// AI プロバイダー
import { AIProvider, chat, ALL_MODELS } from '@/lib/ai-providers'

// Firestore操作
import {
  getConversations,
  createConversation,
  addMessage,
  getDocuments,
  saveUploadedDocument
} from '@/lib/firestore-chat'

// エージェント操作
import {
  getAllAgents,
  getAgentById,
  createAgent
} from '@/lib/firestore-agents'

// Gemini File Search
import {
  createFileSearchStore,
  uploadFile,
  queryWithFileSearch,
  advancedKnowledgeSearch
} from '@/lib/gemini-file-search'
```

---

**ドキュメント更新日**: 2026-01-02
**対象バージョン**: 2.0.0
