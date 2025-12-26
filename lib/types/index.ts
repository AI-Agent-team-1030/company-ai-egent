/**
 * 共通型定義
 *
 * アプリケーション全体で使用される型を集約
 */

// ============================================
// ユーザー・認証関連
// ============================================

export interface UserProfile {
  userName: string
  companyId: string
  companyName: string
  anthropic_api_key?: string
  openai_api_key?: string
  googleDriveToken?: string
}

// ============================================
// チャット・メッセージ関連
// ============================================

export interface Citation {
  title: string
  text: string
  uri?: string
  source: 'knowledge' | 'drive'
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  citations?: Citation[]
  alternatives?: string[]
  currentAlternativeIndex?: number
  model?: string
  showCitations?: boolean
}

export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ============================================
// ドキュメント・フォルダ関連
// ============================================

export interface Document {
  id: string
  userId?: string
  companyId: string
  fileName: string
  originalFileName: string
  geminiFileName: string
  storeName: string
  folderId: string | null
  createdAt: Date
}

export interface Folder {
  id: string
  userId?: string
  companyId: string
  name: string
  parentFolderId: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface FileSearchStore {
  id: string
  userId?: string
  companyId: string
  storeName: string
  displayName: string
  createdAt?: Date
}

// ============================================
// Google Drive関連
// ============================================

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  thumbnailLink?: string
  iconLink?: string
  webViewLink?: string
}

export interface SharedDrive {
  id: string
  name: string
  kind: string
}

export interface CompanyDriveConnection {
  isConnected: boolean
  connectedBy?: string
  connectedByEmail?: string
  connectedAt?: Date
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
  driveFolderId?: string
}

export interface DriveSyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error'
  lastSyncAt?: Date
  totalFiles: number
  syncedFiles: number
  driveStoreName?: string
  syncedFileIds: string[]
  errorMessage?: string
}

// ============================================
// AI・プロバイダー関連
// ============================================

export type AIProvider = 'anthropic' | 'openai' | 'gemini'

export interface AIProviderConfig {
  id: AIProvider
  name: string
  displayName: string
  models: AIModel[]
  settingKey: string
  isBuiltIn?: boolean
}

export interface AIModel {
  id: string
  name: string
}

export interface ModelOption {
  id: string
  name: string
  provider: AIProvider
  providerName: string
}

export interface ChatResponse {
  content: string
  error: string | null
}

// ============================================
// ナレッジ検索関連
// ============================================

export interface StoreInfo {
  name: string
  displayName: string
  createTime: string
}

export interface FileInfo {
  name: string
  displayName: string
  mimeType: string
  sizeBytes: string
  createTime: string
  state: string
}

export interface SearchQueryResult {
  query: string
  queries: string[]
  error: string | null
}

export interface KnowledgeSearchResult {
  citations: Citation[]
  error: string | null
}

export interface FileSearchResult {
  answer: string
  citations: Citation[]
  error: string | null
}

// ============================================
// 会社関連
// ============================================

export interface Company {
  id: string
  name: string
  driveConnection?: CompanyDriveConnection
  driveSyncStatus?: DriveSyncStatus
  aiSettings?: CompanyAISettings
  createdAt?: Date
  updatedAt?: Date
}

export interface CompanyAISettings {
  enabledProviders: string[]
  enabledModels: Record<string, string[]>
  defaultProvider: string
  defaultModel: string
}

// ============================================
// UI状態関連
// ============================================

export interface ProcessingStatus {
  status: 'uploading' | 'processing' | 'completed' | 'error'
  message: string
  progress: number
}

export type ProcessingStatusMap = Record<string, ProcessingStatus>

// ============================================
// API関連（共通）
// ============================================

export interface PaginationParams {
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  limit: number
  offset: number
}
