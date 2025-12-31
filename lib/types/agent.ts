/**
 * エージェント関連の型定義
 *
 * サブエージェント機能のコア型を定義
 */

// ============================================
// ツール定義
// ============================================

/**
 * エージェントが使用可能なツール
 */
export type AgentTool =
  | 'knowledge_search'    // ナレッジベース検索（Gemini File Search）
  | 'drive_search'        // Google Drive検索
  | 'web_search'          // Web検索
  | 'document_generate'   // フォーマット済み文書生成
  | 'api_call'            // 外部API呼び出し
  | 'code_execute'        // コード実行（サンドボックス）

/**
 * ツールのメタデータ
 */
export interface AgentToolInfo {
  id: AgentTool
  name: string
  description: string
  icon: string
  isAvailable: boolean  // 現在利用可能かどうか
}

/**
 * 利用可能なツールの定義
 */
export const AGENT_TOOLS: AgentToolInfo[] = [
  {
    id: 'knowledge_search',
    name: 'ナレッジ検索',
    description: '社内ナレッジベースを検索して関連情報を取得',
    icon: 'DocumentMagnifyingGlassIcon',
    isAvailable: true,
  },
  {
    id: 'drive_search',
    name: 'Google Drive検索',
    description: '接続されたGoogle Driveから関連ファイルを検索',
    icon: 'CloudIcon',
    isAvailable: true,
  },
  {
    id: 'web_search',
    name: 'Web検索',
    description: 'インターネットで最新情報を検索',
    icon: 'GlobeAltIcon',
    isAvailable: true,
  },
  {
    id: 'document_generate',
    name: '文書生成',
    description: 'フォーマットされたビジネス文書を生成',
    icon: 'DocumentTextIcon',
    isAvailable: true,
  },
  {
    id: 'api_call',
    name: '外部API呼び出し',
    description: '外部サービスのAPIを呼び出して連携',
    icon: 'ArrowsRightLeftIcon',
    isAvailable: false,  // 将来実装
  },
  {
    id: 'code_execute',
    name: 'コード実行',
    description: 'サンドボックス環境でコードを実行',
    icon: 'CodeBracketIcon',
    isAvailable: false,  // 将来実装
  },
]

// ============================================
// モデル定義
// ============================================

/**
 * 利用可能なAIモデル
 */
export type AgentModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-exp-1206'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001'
  | 'gpt-5.1'
  | 'auto'  // 自動選択（デフォルト: Gemini）

/**
 * モデルのメタデータ
 */
export interface AgentModelInfo {
  id: AgentModel
  name: string
  provider: 'gemini' | 'anthropic' | 'openai' | 'auto'
  description: string
  requiresApiKey: boolean
}

/**
 * 利用可能なモデルの定義
 */
export const AGENT_MODELS: AgentModelInfo[] = [
  {
    id: 'auto',
    name: '自動選択',
    provider: 'auto',
    description: 'タスクに最適なモデルを自動選択',
    requiresApiKey: false,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    description: '高度な推論と長文処理に最適',
    requiresApiKey: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: '高速レスポンスに最適',
    requiresApiKey: false,
  },
  {
    id: 'gemini-exp-1206',
    name: 'Gemini 3',
    provider: 'gemini',
    description: '最新の実験モデル',
    requiresApiKey: false,
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'バランスの取れた高性能モデル',
    requiresApiKey: true,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: '高速・低コストモデル',
    requiresApiKey: true,
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openai',
    description: 'OpenAIの最新モデル',
    requiresApiKey: true,
  },
]

// ============================================
// カテゴリ定義
// ============================================

/**
 * エージェントカテゴリ
 */
export interface AgentCategory {
  id: string
  name: string
  icon?: string
  color?: string
}

/**
 * 利用可能なカテゴリの定義
 */
export const AGENT_CATEGORIES: AgentCategory[] = [
  { id: 'all', name: 'すべて' },
  { id: '汎用', name: '汎用', icon: 'SparklesIcon', color: 'blue' },
  { id: '文書作成', name: '文書作成', icon: 'DocumentTextIcon', color: 'green' },
  { id: 'リサーチ', name: 'リサーチ', icon: 'MagnifyingGlassIcon', color: 'purple' },
  { id: 'サポート', name: 'サポート', icon: 'ChatBubbleLeftRightIcon', color: 'orange' },
  { id: '開発', name: '開発', icon: 'CodeBracketIcon', color: 'gray' },
  { id: '営業', name: '営業', icon: 'PresentationChartLineIcon', color: 'red' },
  { id: 'マーケティング', name: 'マーケティング', icon: 'MegaphoneIcon', color: 'pink' },
  { id: 'カスタム', name: 'カスタム', icon: 'WrenchScrewdriverIcon', color: 'yellow' },
]

// ============================================
// エージェント定義
// ============================================

/**
 * エージェント定義
 */
export interface Agent {
  id: string
  name: string
  description: string
  category: string
  systemPrompt: string

  // 設定
  tools: AgentTool[]
  model: AgentModel
  maxTokens?: number
  temperature?: number

  // メタデータ
  isBuiltIn: boolean         // 組み込みエージェント
  isShared: boolean          // 企業共有
  createdBy?: string         // 作成者ID
  createdByName?: string     // 作成者名
  createdAt: Date
  updatedAt: Date

  // カスタマイズ
  icon?: string              // カスタムアイコン名
  color?: string             // テーマカラー
  tags?: string[]            // 検索用タグ
  usageCount?: number        // 使用回数
}

/**
 * エージェント作成/更新用の入力型
 */
export interface AgentInput {
  name: string
  description: string
  category: string
  systemPrompt: string
  tools: AgentTool[]
  model: AgentModel
  maxTokens?: number
  temperature?: number
  isShared?: boolean
  icon?: string
  color?: string
  tags?: string[]
}

// ============================================
// 実行関連の型
// ============================================

/**
 * エージェント実行ステータス
 */
export type AgentExecutionStatus =
  | 'pending'      // 待機中
  | 'running'      // 実行中
  | 'completed'    // 完了
  | 'failed'       // 失敗
  | 'cancelled'    // キャンセル

/**
 * ツール実行ステップ
 */
export type AgentExecutionStep =
  | 'analyzing'           // 質問分析中
  | 'knowledge_searching' // ナレッジ検索中
  | 'drive_searching'     // Drive検索中
  | 'web_searching'       // Web検索中
  | 'generating'          // 応答生成中
  | 'formatting'          // フォーマット中

/**
 * ツール実行結果
 */
export interface ToolExecutionResult {
  tool: AgentTool
  status: 'success' | 'failed' | 'skipped'
  result?: unknown
  error?: string
  executionTimeMs: number
}

/**
 * 引用情報（ナレッジ検索結果）
 */
export interface AgentCitation {
  title: string
  content: string
  source: string
  sourceType: 'knowledge' | 'drive' | 'web'
  url?: string
  relevanceScore?: number
}

/**
 * エージェント実行コンテキスト
 */
export interface AgentExecutionContext {
  agentId: string
  taskId: string
  userMessage: string
  conversationId?: string

  // 実行設定（オーバーライド可能）
  enabledTools: AgentTool[]
  model: AgentModel
  systemPrompt: string
  maxTokens?: number
  temperature?: number

  // ツール実行結果
  toolResults: ToolExecutionResult[]
  citations: AgentCitation[]
}

/**
 * エージェント実行結果
 */
export interface AgentExecutionResult {
  taskId: string
  agentId: string
  agentName: string
  status: AgentExecutionStatus

  // 結果
  response?: string
  citations?: AgentCitation[]
  toolResults?: ToolExecutionResult[]

  // メトリクス
  startedAt: Date
  completedAt?: Date
  totalTokensUsed?: number
  error?: string
}

// ============================================
// 並列実行関連の型
// ============================================

/**
 * 並列実行タスク
 */
export interface AgentTask {
  id: string
  agentId: string
  agentName: string
  message: string
  status: AgentExecutionStatus
  currentStep?: AgentExecutionStep
  priority: number
  queuedAt: Date
  startedAt?: Date
  completedAt?: Date
  result?: AgentExecutionResult
}

/**
 * 並列実行キュー設定
 */
export interface AgentExecutionQueueConfig {
  maxConcurrent: number      // 最大並列数（デフォルト: 3）
  timeoutMs: number          // タイムアウト（デフォルト: 60000）
}

/**
 * 並列実行キュー状態
 */
export interface AgentExecutionQueueState {
  config: AgentExecutionQueueConfig
  tasks: AgentTask[]
  runningCount: number
  completedCount: number
  failedCount: number
}

// ============================================
// SSEイベント型
// ============================================

/**
 * SSEイベントの基本型
 */
export interface AgentSSEEvent {
  type: string
  timestamp: number
}

/**
 * ステータス更新イベント
 */
export interface AgentStatusEvent extends AgentSSEEvent {
  type: 'status'
  status: AgentExecutionStatus
  step?: AgentExecutionStep
  message?: string
}

/**
 * ツール結果イベント
 */
export interface AgentToolResultEvent extends AgentSSEEvent {
  type: 'tool_result'
  tool: AgentTool
  status: 'success' | 'failed'
  results?: unknown
  error?: string
}

/**
 * コンテンツストリームイベント
 */
export interface AgentContentEvent extends AgentSSEEvent {
  type: 'content'
  text: string
  isPartial: boolean
}

/**
 * 完了イベント
 */
export interface AgentCompleteEvent extends AgentSSEEvent {
  type: 'complete'
  result: AgentExecutionResult
}

/**
 * エラーイベント
 */
export interface AgentErrorEvent extends AgentSSEEvent {
  type: 'error'
  error: string
  code?: string
}

/**
 * 並列実行タスク開始イベント
 */
export interface AgentTaskStartedEvent extends AgentSSEEvent {
  type: 'task_started'
  taskId: string
  agentId: string
  agentName: string
}

/**
 * 並列実行タスク進捗イベント
 */
export interface AgentTaskProgressEvent extends AgentSSEEvent {
  type: 'task_progress'
  taskId: string
  step: AgentExecutionStep
}

/**
 * 並列実行タスク完了イベント
 */
export interface AgentTaskCompletedEvent extends AgentSSEEvent {
  type: 'task_completed'
  taskId: string
  result: AgentExecutionResult
}

/**
 * 全タスク完了イベント
 */
export interface AgentAllCompletedEvent extends AgentSSEEvent {
  type: 'all_completed'
  results: AgentExecutionResult[]
  totalTimeMs: number
}

/**
 * SSEイベントのユニオン型
 */
export type AgentSSEEventType =
  | AgentStatusEvent
  | AgentToolResultEvent
  | AgentContentEvent
  | AgentCompleteEvent
  | AgentErrorEvent
  | AgentTaskStartedEvent
  | AgentTaskProgressEvent
  | AgentTaskCompletedEvent
  | AgentAllCompletedEvent

// ============================================
// API リクエスト/レスポンス型
// ============================================

/**
 * エージェント実行リクエスト
 */
export interface AgentExecuteRequest {
  agentId: string
  message: string
  conversationId?: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  overrides?: {
    model?: AgentModel
    tools?: AgentTool[]
    temperature?: number
    maxTokens?: number
  }
}

/**
 * 並列実行リクエスト
 */
export interface AgentParallelRequest {
  tasks: Array<{
    agentId: string
    message: string
    priority?: number
  }>
  maxConcurrent?: number
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

/**
 * エージェント生成リクエスト（AI自動生成）
 */
export interface AgentGenerateRequest {
  description: string
}

/**
 * エージェント生成レスポンス
 */
export interface AgentGenerateResponse {
  name: string
  category: string
  description: string
  systemPrompt: string
  tools: AgentTool[]
  model: AgentModel
}
