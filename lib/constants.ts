/**
 * 定数定義
 *
 * アプリケーション全体で使用されるマジックナンバーや設定値を集約
 */

// ============================================
// タイピングエフェクト
// ============================================

export const TYPING = {
  /** 1フレームあたりの文字数 */
  CHARS_PER_FRAME: 2,
  /** タイピング速度（ミリ秒） */
  SPEED_MS: 30,
} as const

// ============================================
// Gemini API制限
// ============================================

export const GEMINI_LIMITS = {
  /** 1クエリあたりの最大ストア数 */
  MAX_STORES_PER_QUERY: 5,
  /** 表示する最大引用数 */
  MAX_CITATIONS_DISPLAYED: 5,
  /** マルチクエリの最大数 */
  MAX_MULTI_QUERIES: 3,
} as const

// ============================================
// 会話・履歴
// ============================================

export const CONVERSATION = {
  /** 取得する会話履歴の最大数 */
  MAX_FETCH_LIMIT: 50,
  /** クエリ生成時に参照する直近の履歴数 */
  HISTORY_CONTEXT_LIMIT: 10,
} as const

// ============================================
// UI - テキストエリア
// ============================================

export const TEXTAREA = {
  /** 最小高さ（px） */
  MIN_HEIGHT: 44,
  /** 最大高さ（px） */
  MAX_HEIGHT: 200,
} as const

// ============================================
// UI - サイドバー
// ============================================

export const SIDEBAR = {
  /** 最小幅（px） */
  MIN_WIDTH: 200,
  /** 最大幅（px） */
  MAX_WIDTH: 500,
  /** デフォルト幅（px） */
  DEFAULT_WIDTH: 256,
  /** モバイル時の幅（px） */
  MOBILE_WIDTH: 280,
  /** 折りたたみ時の幅（px） */
  COLLAPSED_WIDTH: 80,
} as const

// ============================================
// ファイルアップロード
// ============================================

export const FILE_UPLOAD = {
  /** 最大ファイルサイズ（バイト）: 50MB */
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
  /** 許可されるMIMEタイプ */
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
  ],
  /** 許可される拡張子 */
  ALLOWED_EXTENSIONS: [
    '.pdf',
    '.txt',
    '.md',
    '.docx',
    '.xlsx',
    '.xls',
    '.pptx',
    '.ppt',
    '.csv',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
  ],
} as const

// ============================================
// トースト・通知
// ============================================

export const TOAST = {
  /** 表示時間（ミリ秒） */
  DURATION_MS: 3000,
  /** エラー時の表示時間（ミリ秒） */
  ERROR_DURATION_MS: 5000,
} as const

// ============================================
// レート制限
// ============================================

export const RATE_LIMIT = {
  /** 通常APIの制限（リクエスト/分） */
  DEFAULT_LIMIT: 60,
  /** 厳格な制限（AI API用、リクエスト/分） */
  STRICT_LIMIT: 10,
  /** ウィンドウサイズ（ミリ秒）: 1分 */
  WINDOW_MS: 60 * 1000,
} as const

// ============================================
// ページネーション
// ============================================

export const PAGINATION = {
  /** デフォルトの取得件数 */
  DEFAULT_LIMIT: 50,
  /** 最大取得件数 */
  MAX_LIMIT: 100,
} as const

// ============================================
// AI モデル
// ============================================

export const AI_MODELS = {
  /** デフォルトモデル */
  DEFAULT: 'gemini-2.5-pro',
  /** ファイル検索用モデル */
  FILE_SEARCH: 'gemini-2.5-pro',
  /** クエリ生成用モデル（軽量） */
  QUERY_GENERATION: 'gemini-2.0-flash',
  /** 再ランキング用モデル（軽量） */
  RERANKING: 'gemini-2.0-flash',
} as const

// ============================================
// API エンドポイント
// ============================================

export const API_ENDPOINTS = {
  CHAT_MESSAGES: '/api/chat/messages',
  CHAT_CONVERSATIONS: '/api/chat/conversations',
  DOCUMENTS: '/api/documents',
  DOCUMENTS_UPLOAD: '/api/documents/upload',
  FOLDERS: '/api/folders',
  KNOWLEDGE: '/api/knowledge',
  SETTINGS: '/api/settings',
  COMPANY: '/api/company',
  DRIVE_SEARCH: '/api/drive/search',
} as const

// ============================================
// 外部API URL
// ============================================

export const EXTERNAL_API = {
  ANTHROPIC: 'https://api.anthropic.com/v1/messages',
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  GEMINI_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
  GOOGLE_DRIVE: 'https://www.googleapis.com/drive/v3',
} as const

// ============================================
// ストレージキー
// ============================================

export const STORAGE_KEYS = {
  COMPANY_ID: 'company_id',
  COMPANY_NAME: 'company_name',
} as const
