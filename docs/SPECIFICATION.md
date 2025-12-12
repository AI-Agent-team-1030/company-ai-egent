# 社内ナレッジ検索くん 仕様書

## プロジェクト概要

### システム名
社内ナレッジ検索くん

### 目的
複数のAIエージェントが連携し、企業の経営判断から各部門への指示展開、タスク実行までを支援する統合AIシステム

### 対象ユーザー
- 経営者
- 部門責任者
- 一般社員

---

## デザインコンセプト

**白黒ベースのミニマルデザイン**
- シンプルで洗練されたUI
- 黒と白を基調としたモノクロームパレット
- 直感的で使いやすいインターフェース
- スムーズなアニメーションとマイクロインタラクション

---

## 主な機能

### 1. AIチャット
- マルチAIプロバイダー対応（Gemini / Claude / GPT）
- ナレッジベースを参照した回答生成（RAG）
- 会話履歴の保存と検索
- 引用情報の表示（ソース別色分け）
- タイピングエフェクト

### 2. ナレッジベース
- 組織の知識を蓄積・共有
- フォルダー階層での整理
- ドキュメントのアップロード（PDF, Word, Excel, CSV, PowerPoint, 画像）
- Gemini File Searchによるセマンティック検索
- AIチャットでの自動参照

### 3. Google Drive連携
- OAuth認証でドライブ接続
- ドライブ内ファイルの自動検索
- 会社レベルでの共有（全社員が利用可能）
- Google Docs/Sheets/Slidesの変換対応
- 差分同期機能

### 4. ドキュメント管理
- 複数形式のファイルアップロード
- 自動テキスト抽出
- OCR（画像内テキスト認識）
- チャンク分割・インデックス化

### 5. 設定
- プロフィール管理
- ユーザー名の設定
- APIキーの管理（Claude, OpenAI）
- Google Drive接続管理

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js | 14.0.4 | Reactフレームワーク（App Router） |
| React | 18.2.0 | UIライブラリ |
| TypeScript | 5.x | 型安全な開発 |
| Tailwind CSS | 3.3.0 | スタイリング |
| Framer Motion | 10.16.16 | アニメーション |
| Heroicons | 2.1.1 | アイコン |
| Zustand | 4.4.7 | 状態管理 |
| date-fns | 3.0.6 | 日付処理 |
| react-markdown | 10.1.0 | Markdown表示 |
| remark-gfm | 4.0.1 | GitHub Flavored Markdown |

### バックエンド
| 技術 | 用途 |
|------|------|
| Next.js API Routes | サーバーレスAPI |
| Firebase Admin SDK 13.6.0 | サーバー側Firebase操作 |

### AI/LLM
| SDK | バージョン | 対応モデル |
|------|-----------|-----------|
| @google/genai | 1.30.0 | Gemini 2.5 Pro/Flash |
| @google/generative-ai | 0.24.1 | Gemini（レガシー） |
| @anthropic-ai/sdk | 0.68.0 | Claude Sonnet/Haiku 4.5 |
| openai | 6.9.1 | GPT-5.1/4o |

### データベース・認証
| サービス | 用途 |
|---------|------|
| Firebase Authentication | ユーザー認証（メール/パスワード + Google OAuth） |
| Cloud Firestore | メインデータベース |
| Supabase | ドキュメント・チャンク保存 |
| Supabase Storage | ファイルストレージ |
| Gemini File Search | ベクトル検索・ナレッジ検索 |

### ファイル処理
| ライブラリ | バージョン | 対応形式 |
|-----------|-----------|---------|
| pdf-parse-fork | 1.2.0 | PDF |
| mammoth | 1.11.0 | Word (.docx) |
| xlsx | 0.18.5 | Excel (.xlsx) |
| officeparser | 5.2.2 | PowerPoint (.pptx) |
| csv-parse | 6.1.0 | CSV |
| tesseract.js | 6.0.1 | 画像OCR |

### インフラ
| サービス | 用途 |
|---------|------|
| Google Cloud Run | アプリケーションホスティング |
| Cloud Build | CI/CDパイプライン |

---

## 対応AIモデル

### Gemini（標準搭載・APIキー不要）
| モデル | 用途 |
|--------|------|
| gemini-2.5-pro | ファイル検索・高精度処理 |
| gemini-2.5-flash | 高速処理 |
| gemini-2.0-flash | クエリ生成 |
| gemini-exp-1206 | 実験的処理 |

### Claude（APIキー必要）
| モデル | 用途 |
|--------|------|
| claude-sonnet-4-5-20250929 | 高精度タスク |
| claude-haiku-4-5-20251001 | 軽量タスク |
| claude-3-7-sonnet-20250219 | ナレッジ判定 |
| claude-3-5-haiku-20241022 | 軽量判定 |

### GPT（APIキー必要）
| モデル | 用途 |
|--------|------|
| gpt-5.1 | 汎用タスク |
| gpt-4o | チャット・分析 |
| gpt-5.1-mini | 軽量処理 |

---

## データベース設計

### Firebase Firestore コレクション

#### conversations
チャット会話
- title: 会話タイトル
- userId: ユーザーID
- companyId: 会社ID
- createdAt: 作成日時
- updatedAt: 更新日時

#### conversations/{id}/messages
チャットメッセージ（サブコレクション）
- role: user / assistant / system
- content: メッセージ内容
- model: 使用AIモデル
- citations: 引用情報
- createdAt: 作成日時

#### documents
アップロードドキュメント
- name: ファイル名
- type: ファイルタイプ
- size: ファイルサイズ
- userId: ユーザーID
- companyId: 会社ID
- processed: 処理完了フラグ

#### fileSearchStores
Gemini File SearchStore情報
- storeId: Store ID
- companyId: 会社ID
- fileCount: ファイル数

#### folders
フォルダ構造
- name: フォルダ名
- parentId: 親フォルダID
- userId: ユーザーID
- companyId: 会社ID

#### companies
会社情報
- name: 会社名
- createdAt: 作成日時

#### companies/{id}/aiSettings
AI設定（サブコレクション）
- claudeApiKey: Claude APIキー（暗号化）
- openaiApiKey: OpenAI APIキー（暗号化）

#### companies/{id}/driveConnection
Drive接続情報（サブコレクション）
- accessToken: アクセストークン
- refreshToken: リフレッシュトークン
- connectedAt: 接続日時

#### companies/{id}/driveSyncStatus
Drive同期状態（サブコレクション）
- status: idle / syncing / completed / error
- totalFiles: 総ファイル数
- syncedFiles: 同期済みファイル数
- lastSyncAt: 最終同期日時

#### profiles
ユーザープロフィール
- displayName: 表示名
- email: メールアドレス
- companyId: 会社ID

### Supabase テーブル

#### uploaded_documents
アップロードファイル情報

#### document_chunks
テキストチャンク

#### chat_conversations
チャット会話

#### chat_messages
チャットメッセージ

#### app_settings
ユーザー設定

#### knowledge
ナレッジベース

---

## セキュリティ仕様

### 認証
- Firebase Authenticationによるメール/パスワード認証
- Google OAuth（Drive連携用）
- セッション管理

### データ保護
- Firestoreセキュリティルール（企業別データ分離）
- APIキーのAES-256-CBC暗号化
- HTTPS通信（TLS 1.3）

### アクセス制御
- ProtectedRouteによるルート保護
- Bearer Token認証
- レート制限

### Firestoreセキュリティルール
```javascript
// プロフィール: 本人のみアクセス可能
match /profiles/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// 会話: 認証ユーザーのみ
match /conversations/{conversationId} {
  allow read, write: if request.auth != null;
}

// ドキュメント: 認証ユーザーのみ
match /documents/{docId} {
  allow read, write: if request.auth != null;
}
```

---

## UI/UX仕様

### レスポンシブデザイン
- デスクトップファースト
- タブレット対応
- モバイル対応

### アクセシビリティ
- セマンティックHTML
- キーボードナビゲーション
- ARIA属性

### パフォーマンス
- コード分割
- 画像最適化
- レイジーローディング

---

## API仕様

### エンドポイント一覧

| カテゴリ | エンドポイント | メソッド | 機能 |
|---------|---------------|---------|------|
| チャット | /api/chat/conversations | GET/POST | 会話一覧・作成 |
| | /api/chat/conversations/[id] | GET/DELETE | 会話取得・削除 |
| | /api/chat/messages | POST | メッセージ送信 |
| ナレッジ | /api/knowledge | GET/POST | ナレッジ検索・作成 |
| | /api/knowledge/[id] | GET/DELETE | ナレッジ取得・削除 |
| ドキュメント | /api/documents | GET | ドキュメント一覧 |
| | /api/documents/upload | POST | アップロード |
| フォルダ | /api/folders | GET/POST | フォルダ一覧・作成 |
| Drive | /api/drive/search | GET | Drive検索 |
| | /api/drive/sync | POST/GET | 同期開始・状態確認 |
| 会社 | /api/company | GET/POST | 会社情報管理 |
| | /api/company/drive | GET/POST | Drive接続管理 |
| 設定 | /api/settings | POST | 設定保存 |
| 分析 | /api/market-analysis | POST | 市場分析 |
| | /api/simple-agent | POST | エージェント実行 |
| | /api/generate-tasks | POST | タスク生成 |

---

## 制限事項

| 項目 | 制限 |
|------|------|
| ファイルサイズ | 最大50MB/ファイル |
| チャンクサイズ | 2,000文字 |
| ドライブ検索結果 | 最大10件 |
| AIトークン | 最大4096トークン/回答 |

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2025-12-12 | 3.0 | 最新技術スタック・機能で全面更新 |
| 2025-11-27 | 2.0 | 機能追加 |
| 2025-11-23 | 1.0 | 初版作成 |
