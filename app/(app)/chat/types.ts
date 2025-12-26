/**
 * チャット関連の型定義
 */

import type { Citation } from '@/lib/gemini-file-search'

export interface ChatMessage {
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

export interface ChatState {
  conversationId: string | null
  messages: ChatMessage[]
  input: string
  isProcessing: boolean
  error: string | null
  isKnowledgeSearchEnabled: boolean
  currentAiMessageId: string | null
  isTyping: boolean
  selectedModel: string
}

export interface ApiKeys {
  anthropic: string
  openai: string
}

// Firestore からのデータ型
export interface FileSearchStore {
  storeName?: string
  [key: string]: unknown
}

export interface DocumentData {
  geminiFileName?: string
  originalFileName?: string
  [key: string]: unknown
}

export interface LoadedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  citations?: Array<{
    source?: string
    [key: string]: unknown
  }>
  provider?: string
}

export interface DriveSearchResult {
  title?: string
  snippet?: string
  url?: string
  [key: string]: unknown
}
