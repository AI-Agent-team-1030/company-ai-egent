/**
 * ナレッジページの型定義
 */

export interface KnowledgeDocument {
  id: string
  fileName: string
  originalFileName: string
  geminiFileName: string
  storeName: string
  folderId: string | null
  createdAt: Date
}

export interface KnowledgeFolder {
  id: string
  name: string
  companyId: string
  parentFolderId: string | null
}

export interface FileSearchStore {
  id: string
  storeName: string
  displayName: string
}

export interface ProcessingStatus {
  [key: string]: {
    status: 'uploading' | 'processing' | 'completed' | 'error'
    message: string
    progress: number
  }
}
