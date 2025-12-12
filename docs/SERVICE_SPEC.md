# 法人AIナレッジ検索・チャットシステム - サービス仕様書

> 他社比較・企画検討用ドキュメント

---

## 1. サービス概要

| 項目 | 内容 |
|---|---|
| サービス名 | 法人AIナレッジ検索・チャットシステム |
| 種別 | 企業向けAIチャット・ナレッジ管理SaaS |
| プラットフォーム | Webアプリケーション |
| 対応デバイス | PC / タブレット / スマートフォン |

---

## 2. 主要機能一覧

### コア機能

| 機能 | 説明 | 対応状況 |
|---|---|---|
| AIチャット | 複数AIプロバイダー対応のチャット機能 | ✅ |
| ナレッジ検索（RAG） | 社内文書からの自動検索・回答生成 | ✅ |
| ドキュメント管理 | フォルダ階層型ドキュメント管理 | ✅ |
| Google Drive連携 | Driveファイル自動同期・検索 | ✅ |
| 引用表示 | 回答時に参照元ドキュメントを表示 | ✅ |
| 会話履歴管理 | 過去の会話の保存・検索・削除 | ✅ |

### 拡張機能

| 機能 | 説明 | 対応状況 |
|---|---|---|
| 市場分析 | AIによる市場分析レポート生成 | ✅ |
| タスク自動生成 | AIによるタスク提案 | ✅ |
| エージェント実行 | シンプルなAIエージェント機能 | ✅ |

---

## 3. 対応AIモデル

### Gemini（Google）- 標準搭載

> APIキー不要・追加料金なしで利用可能

| モデル名 | 用途 | 特徴 |
|---|---|---|
| `gemini-2.5-pro` | ファイル検索・高精度処理 | 最新の高性能モデル |
| `gemini-2.5-flash` | 高速処理 | 低レイテンシ・コスト効率 |
| `gemini-2.0-flash` | クエリ生成 | 軽量・高速 |
| `gemini-exp-1206` | 実験的処理 | 最新実験モデル |

### Claude（Anthropic）- ユーザーAPIキー必要

| モデル名 | 用途 | 特徴 |
|---|---|---|
| `claude-sonnet-4-5-20250929` | 高精度タスク | 最新Sonnetモデル |
| `claude-haiku-4-5-20251001` | 軽量タスク | 高速・低コスト |
| `claude-3-7-sonnet-20250219` | ナレッジ判定 | バランス型 |
| `claude-3-5-haiku-20241022` | 軽量判定 | 超高速 |

### GPT（OpenAI）- ユーザーAPIキー必要

| モデル名 | 用途 | 特徴 |
|---|---|---|
| `gpt-5.1` | 汎用タスク | 最新GPTモデル |
| `gpt-4o` | チャット・分析 | マルチモーダル対応 |
| `gpt-5.1-mini` | 軽量処理 | コスト効率 |

---

## 4. 対応ファイル形式

### ドキュメント

| 形式 | 拡張子 | 処理エンジン | OCR対応 |
|---|---|---|---|
| PDF | `.pdf` | pdf-parse-fork | - |
| Word | `.docx` | mammoth | - |
| テキスト | `.txt` | 直接読み込み | - |
| Markdown | `.md` | 直接読み込み | - |

### 表計算・データ

| 形式 | 拡張子 | 処理エンジン |
|---|---|---|
| Excel | `.xlsx` | xlsx |
| CSV | `.csv` | csv-parse |
| JSON | `.json` | 直接パース |

### プレゼンテーション

| 形式 | 拡張子 | 処理エンジン |
|---|---|---|
| PowerPoint | `.pptx` | officeparser |

### 画像（OCR対応）

| 形式 | 拡張子 | 処理エンジン |
|---|---|---|
| PNG | `.png` | tesseract.js |
| JPEG | `.jpg`, `.jpeg` | tesseract.js |
| その他画像 | 各種 | tesseract.js |

### Google Workspace形式

| 形式 | 変換先 | 処理方法 |
|---|---|---|
| Google Docs | PDF/テキスト | Google API変換 |
| Google Sheets | CSV/Excel | Google API変換 |
| Google Slides | PDF | Google API変換 |

---

## 5. 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js | 14.0.4 | Reactフレームワーク |
| React | 18.2.0 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Tailwind CSS | 3.3.0 | スタイリング |
| Framer Motion | 10.16.16 | アニメーション |
| Zustand | 4.4.7 | 状態管理 |
| React Markdown | 10.1.0 | Markdown表示 |
| Heroicons | 2.1.1 | アイコン |

### バックエンド

| 技術 | 用途 |
|---|---|
| Next.js API Routes | サーバーレスAPI |
| Firebase Admin SDK 13.6.0 | サーバー側Firebase操作 |

### AI/LLM SDK

| SDK | バージョン | 対応モデル |
|---|---|---|
| @anthropic-ai/sdk | 0.68.0 | Claude全モデル |
| @google/genai | 1.30.0 | Gemini（新SDK） |
| @google/generative-ai | 0.24.1 | Gemini（レガシー） |
| openai | 6.9.1 | GPT全モデル |

### データベース・ストレージ

| サービス | 用途 | 詳細 |
|---|---|---|
| Firebase Authentication | ユーザー認証 | メール/パスワード + Google OAuth |
| Cloud Firestore | メインDB | 会話、設定、同期状態 |
| Supabase Database | ドキュメントDB | ドキュメント・チャンク保存 |
| Supabase Storage | ファイルストレージ | アップロードファイル保存 |
| Gemini File Search | ベクトル検索 | ナレッジ検索基盤 |

### インフラ・デプロイ

| サービス | 用途 |
|---|---|
| Google Cloud Run | アプリケーションホスティング |
| Cloud Build | CI/CDパイプライン |
| Firebase Hosting | （オプション）静的ホスティング |

---

## 6. ナレッジ検索（RAG）仕様

### 検索エンジン

| 項目 | 仕様 |
|---|---|
| 基盤技術 | Gemini File Search API |
| 検索方式 | セマンティック（意味）検索 |
| 埋め込みモデル | Gemini内蔵ベクトル化 |
| インデックス | File SearchStore |

### テキスト処理

| 項目 | 仕様 |
|---|---|
| チャンクサイズ | 2,000文字 |
| オーバーラップ | あり |
| 前処理 | 形式別テキスト抽出 |

### 引用機能

| 項目 | 仕様 |
|---|---|
| 引用表示 | 自動引用情報生成 |
| ソース表示 | ファイル名・該当箇所 |
| 信頼性スコア | あり |

---

## 7. 認証・セキュリティ

### 認証方式

| 方式 | 詳細 |
|---|---|
| メール/パスワード | Firebase Authentication |
| Google OAuth | Google Drive連携用（drive.readonly スコープ） |
| メール確認 | 必須（verify-email） |

### データ保護

| 項目 | 仕様 |
|---|---|
| APIキー暗号化 | AES-256-CBC |
| 暗号化キー長 | 32バイト |
| 通信暗号化 | HTTPS（TLS 1.3） |

### アクセス制御

| 項目 | 仕様 |
|---|---|
| ルート保護 | ProtectedRouteコンポーネント |
| API認証 | Bearer Token |
| レート制限 | 分析API等に適用 |

---

## 8. Google Drive連携仕様

### 同期機能

| 項目 | 仕様 |
|---|---|
| 同期方式 | 差分同期（syncedFileIds管理） |
| 同期対象 | 指定フォルダ内全ファイル（再帰） |
| 自動変換 | Google形式→標準形式 |

### 対応MIMEタイプ

```
# Google Workspace形式
application/vnd.google-apps.document
application/vnd.google-apps.spreadsheet
application/vnd.google-apps.presentation

# 標準形式
application/pdf
text/plain
text/csv
text/markdown
application/json

# Office形式
application/vnd.openxmlformats-officedocument.wordprocessingml.document
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### 同期状態管理

```typescript
interface DriveSyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error'
  totalFiles: number
  syncedFiles: number
  syncedFileIds: string[]
  lastSyncAt: Date
  errorMessage?: string
}
```

---

## 9. API仕様

### エンドポイント一覧

| カテゴリ | エンドポイント | メソッド | 機能 |
|---|---|---|---|
| **チャット** | `/api/chat/conversations` | GET/POST | 会話一覧取得・新規作成 |
| | `/api/chat/conversations/[id]` | GET/DELETE | 会話取得・削除 |
| | `/api/chat/messages` | POST | メッセージ送信（AI応答含む） |
| **ナレッジ** | `/api/knowledge` | GET/POST | ナレッジ検索・作成 |
| | `/api/knowledge/[id]` | GET/DELETE | ナレッジ取得・削除 |
| | `/api/knowledge/[id]/use` | POST | 使用トラッキング |
| **ドキュメント** | `/api/documents` | GET | ドキュメント一覧 |
| | `/api/documents/[id]` | GET/DELETE | ドキュメント取得・削除 |
| | `/api/documents/upload` | POST | ファイルアップロード |
| **フォルダ** | `/api/folders` | GET/POST | フォルダ一覧・作成 |
| | `/api/folders/[id]` | PUT/DELETE | フォルダ編集・削除 |
| **Drive** | `/api/drive/search` | GET | Drive内検索 |
| | `/api/drive/sync` | POST/GET | 同期開始・状態確認 |
| **会社・設定** | `/api/company` | GET/POST | 会社情報管理 |
| | `/api/company/drive` | GET/POST | Drive接続情報管理 |
| | `/api/settings` | POST | ユーザー設定保存 |
| **分析** | `/api/market-analysis` | POST | 市場分析 |
| | `/api/simple-agent` | POST | エージェント実行 |
| | `/api/generate-tasks` | POST | タスク自動生成 |

### API総数: 約20エンドポイント

---

## 10. 処理フロー

### チャット送信フロー

```
1. ユーザーがメッセージ入力
   ↓
2. メッセージ検証（conversation_id, content）
   ↓
3. ユーザーメッセージをデータベースに保存
   ↓
4. ナレッジ必要性判定（AIで自動判定）
   ↓
5. [必要な場合] ドキュメント検索 → コンテキスト構築
   ↓
6. 選択プロバイダーのAPI呼び出し
   （Claude / GPT / Gemini）
   ↓
7. AIレスポンス取得
   ↓
8. メッセージをデータベースに保存
   ↓
9. 会話のupdated_at更新
   ↓
10. レスポンス返却（usedKnowledgeフラグ含む）
```

### ドキュメントアップロードフロー

```
1. ファイル選択
   ↓
2. ファイルバリデーション（形式・サイズ）
   ↓
3. Supabase Storageにアップロード
   ↓
4. データベースに記録
   ↓
5. バックグラウンド処理開始
   ├─ PDF: pdf-parse-fork
   ├─ Word: mammoth
   ├─ Excel: xlsx
   ├─ PowerPoint: officeparser
   ├─ 画像: tesseract.js (OCR)
   └─ その他: テキスト抽出
   ↓
6. テキストをチャンク分割（2,000文字）
   ↓
7. チャンクをデータベース保存
   ↓
8. ドキュメントをprocessed=trueに更新
```

### Google Drive同期フロー

```
1. ユーザーがDrive接続
   ↓
2. Google認証（OAuth 2.0）
   ↓
3. アクセストークン取得・保存
   ↓
4. 同期開始リクエスト
   ↓
5. Drive内全ファイル取得（再帰的）
   ↓
6. サポートされたファイルのみ抽出
   ↓
7. ファイル形式変換（Google形式→標準形式）
   ↓
8. Gemini APIへアップロード
   ↓
9. File SearchStoreへインポート
   ↓
10. 同期状態をFirestoreに保存
   ↓
11. 引用情報で自動参照可能に
```

---

## 11. 他社比較ポイント

### 強み

| ポイント | 詳細 |
|---|---|
| **マルチAI対応** | Claude, GPT, Gemini 3社のAIモデルに対応 |
| **Gemini標準搭載** | 追加APIキーなしで即座に利用可能 |
| **豊富なファイル形式** | OCR含む10種類以上のファイル形式に対応 |
| **Google Drive連携** | 企業のGoogle Workspace環境と直接連携 |
| **引用機能** | 回答の信頼性を担保する参照元表示 |
| **日本語対応** | 完全日本語UI・日本企業向け設計 |

### 技術的優位性

| ポイント | 詳細 |
|---|---|
| **最新SDK使用** | 各AI SDKが2024-2025年の最新版 |
| **Gemini File Search** | Google最新のRAG基盤を採用 |
| **サーバーレス** | Cloud Runによるスケーラブル・低コスト運用 |
| **ハイブリッドDB** | Firebase + Supabaseの最適組み合わせ |
| **型安全** | TypeScript完全対応 |

### 差別化要素

| 競合との比較 | 本サービス | 一般的な競合 |
|---|---|---|
| AIモデル選択 | 3社対応（ユーザー選択可） | 1社固定が多い |
| 標準AIモデル | Gemini無料提供 | 従量課金のみ |
| Google連携 | Drive完全統合 | 手動アップロードのみ |
| OCR | tesseract.js内蔵 | オプション/別料金 |
| 引用表示 | 自動生成 | なし/簡易的 |

---

## 12. システム要件

### 推奨ブラウザ

| ブラウザ | バージョン |
|---|---|
| Google Chrome | 最新版 |
| Microsoft Edge | 最新版 |
| Firefox | 最新版 |
| Safari | 最新版 |

### 必要なアカウント

| サービス | 必須/任意 | 用途 |
|---|---|---|
| メールアドレス | 必須 | ユーザー登録 |
| Googleアカウント | 任意 | Drive連携 |
| Claude APIキー | 任意 | Claudeモデル使用 |
| OpenAI APIキー | 任意 | GPTモデル使用 |

---

## 13. 依存パッケージ一覧

### 本番依存関係（dependencies）

```json
{
  "@anthropic-ai/sdk": "0.68.0",
  "@google/genai": "1.30.0",
  "@google/generative-ai": "0.24.1",
  "@heroicons/react": "2.1.1",
  "@supabase/supabase-js": "2.83.0",
  "csv-parse": "6.1.0",
  "date-fns": "3.0.6",
  "firebase": "12.6.0",
  "firebase-admin": "13.6.0",
  "framer-motion": "10.16.16",
  "mammoth": "1.11.0",
  "next": "14.0.4",
  "officeparser": "5.2.2",
  "openai": "6.9.1",
  "pdf-parse-fork": "1.2.0",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "react-markdown": "10.1.0",
  "remark-gfm": "4.0.1",
  "tesseract.js": "6.0.1",
  "xlsx": "0.18.5",
  "zustand": "4.4.7"
}
```

### 開発依存関係（devDependencies）

```json
{
  "@types/node": "20",
  "@types/react": "18",
  "@types/react-dom": "18",
  "autoprefixer": "10.0.1",
  "postcss": "8",
  "tailwindcss": "3.3.0",
  "typescript": "5"
}
```

---

## 14. プロジェクト構造

```
/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── page.tsx                # ホームページ
│   ├── auth/
│   │   ├── login/page.tsx      # ログイン
│   │   ├── signup/page.tsx     # サインアップ
│   │   └── verify-email/page.tsx # メール確認
│   ├── privacy/page.tsx        # プライバシーポリシー
│   ├── (app)/                  # 保護されたルート
│   │   ├── layout.tsx
│   │   ├── chat/page.tsx       # AIチャット
│   │   ├── knowledge/page.tsx  # ナレッジ管理
│   │   └── settings/page.tsx   # 設定
│   └── api/                    # APIエンドポイント（約20個）
│       ├── chat/
│       ├── knowledge/
│       ├── documents/
│       ├── folders/
│       ├── drive/
│       ├── company/
│       └── [分析API]
├── lib/                        # ユーティリティ（15ファイル）
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── firebase-auth.ts
│   ├── supabase.ts
│   ├── supabase-server.ts
│   ├── ai-providers.ts
│   ├── gemini-file-search.ts
│   ├── google-drive.ts
│   ├── drive-sync.ts
│   ├── firestore-chat.ts
│   ├── encryption.ts
│   ├── api-auth.ts
│   ├── rate-limit.ts
│   └── api-client.ts
├── components/
│   ├── ui/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── GoogleDrivePicker.tsx
│   ├── ProtectedRoute.tsx
│   ├── TaskModal.tsx
│   └── dashboard/
│       └── StatsCard.tsx
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 更新履歴

| 日付 | バージョン | 内容 |
|---|---|---|
| 2025-12-12 | 1.0.0 | 初版作成 |

---

*このドキュメントは他社比較・企画検討用に作成されました。*
