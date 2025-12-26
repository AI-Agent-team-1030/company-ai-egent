/**
 * API型定義
 *
 * APIリクエスト/レスポンスの型を集約
 */

import { NextResponse } from 'next/server'
import type {
  Message,
  Document,
  Folder,
  Conversation,
  Citation,
  CompanyDriveConnection,
  DriveSyncStatus,
} from './index'

// ============================================
// 認証関連
// ============================================

export interface AuthResult {
  authorized: boolean
  userId?: string
  companyId?: string
  email?: string
  error?: NextResponse
}

// ============================================
// 共通レスポンス
// ============================================

export interface ApiSuccessResponse<T = unknown> {
  data: T
  message?: string
}

export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export interface ApiPaginatedResponse<T> {
  data: T[]
  count: number
  limit: number
  offset: number
}

// ============================================
// チャットAPI
// ============================================

export interface ChatMessageRequest {
  conversationId?: string
  message: string
  model?: string
  enableKnowledgeSearch?: boolean
}

export interface ChatMessageResponse {
  conversationId: string
  messageId: string
  content: string
  citations?: Citation[]
  model: string
}

export interface ConversationResponse {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface MessageResponse {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  createdAt: string
}

// ============================================
// ドキュメントAPI
// ============================================

export interface DocumentUploadRequest {
  file: File
  folderId?: string
}

export interface DocumentResponse {
  id: string
  fileName: string
  originalFileName: string
  geminiFileName: string
  storeName: string
  folderId: string | null
  createdAt: string
}

// ============================================
// フォルダAPI
// ============================================

export interface FolderCreateRequest {
  name: string
  parentFolderId?: string
}

export interface FolderUpdateRequest {
  name: string
}

export interface FolderResponse {
  id: string
  name: string
  companyId: string
  parentFolderId: string | null
  createdAt: string
  updatedAt: string
}

// ============================================
// ナレッジAPI
// ============================================

export interface KnowledgeCreateRequest {
  title: string
  content: string
  category: string
  department: string
  tags?: string[]
}

export interface KnowledgeUpdateRequest {
  title?: string
  content?: string
  category?: string
  department?: string
  tags?: string[]
}

export interface KnowledgeResponse {
  id: string
  title: string
  content: string
  category: string
  department: string
  tags: string[]
  createdAt: string
  updatedAt: string
  usageCount: number
}

// ============================================
// 設定API
// ============================================

export interface SettingsGetResponse {
  anthropic_api_key?: string
  openai_api_key?: string
  googleDriveToken?: string
  [key: string]: string | undefined
}

export interface SettingsUpdateRequest {
  key: string
  value: string
}

// ============================================
// 会社API
// ============================================

export interface CompanyResponse {
  id: string
  name: string
  driveConnection?: CompanyDriveConnection
  driveSyncStatus?: DriveSyncStatus
  createdAt: string
  updatedAt: string
}

export interface DriveConnectRequest {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  driveFolderId?: string
}

// ============================================
// Google Drive API
// ============================================

export interface DriveSearchRequest {
  accessToken: string
  query: string
  folderId?: string
}

export interface DriveSearchResponse {
  results: {
    id: string
    name: string
    content: string
    webViewLink?: string
  }[]
}
