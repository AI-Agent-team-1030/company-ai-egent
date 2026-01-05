/**
 * ドキュメントリストコンポーネント
 *
 * ドキュメント一覧の表示と削除機能
 * ドラッグ&ドロップでフォルダへ移動可能
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  DocumentTextIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import type { KnowledgeDocument, KnowledgeFolder } from '../types'

interface KnowledgeChunk {
  id: string
  content: string
  metadata: {
    documentId: string
    documentTitle: string
    chunkIndex: number
    totalChunks: number
  }
}

interface DocumentListProps {
  documents: KnowledgeDocument[]
  folders: KnowledgeFolder[]
  loading: boolean
  onDelete: (docId: string, geminiFileName?: string, storeName?: string) => void
  onMove?: (docId: string, folderId: string | null) => void
}

// ドキュメントプレビューモーダル
function DocumentPreviewModal({
  document,
  isOpen,
  onClose,
}: {
  document: KnowledgeDocument | null
  isOpen: boolean
  onClose: () => void
}) {
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // モーダルが開いたらチャンクを取得
  useEffect(() => {
    if (isOpen && document) {
      setLoading(true)
      setError(null)
      setChunks([])
      fetch(`/api/knowledge/chunks?documentId=${encodeURIComponent(document.id)}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error)
          } else {
            setChunks(data.chunks || [])
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [isOpen, document])

  if (!document) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />
          {/* モーダル */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[95%] max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* ヘッダー */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{document.originalFileName}</h3>
                    <p className="text-xs text-gray-500">
                      {chunks.length > 0 ? `${chunks.length} チャンクに分割済み` : '読み込み中...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <span className="ml-3 text-gray-600">読み込み中...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
                  エラー: {error}
                </div>
              ) : chunks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpenIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>チャンクが見つかりません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chunks.map((chunk, index) => (
                    <div
                      key={chunk.id}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          チャンク {index + 1} / {chunks.length}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-500">
                このドキュメントはAIチャットで検索可能です。各チャンクは類似度検索で参照されます。
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function getFileTypeIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext || '')) return '📝'
  if (['xls', 'xlsx'].includes(ext || '')) return '📊'
  if (['ppt', 'pptx'].includes(ext || '')) return '📽️'
  if (ext === 'csv') return '📈'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return '🖼️'
  if (['txt', 'md'].includes(ext || '')) return '📃'
  return '📁'
}

export function DocumentList({ documents, folders, loading, onDelete, onMove }: DocumentListProps) {
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null)

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData('documentId', docId)
    e.dataTransfer.effectAllowed = 'move'
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="text-gray-600 mt-4">読み込み中...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
        <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">ドキュメントがありません</h3>
        <p className="text-gray-600">ドキュメントをアップロードしてください</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, index) => (
        <div
          key={doc.id}
          draggable
          onDragStart={(e) => handleDragStart(e, doc.id)}
          className="cursor-grab active:cursor-grabbing"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl flex-shrink-0">{getFileTypeIcon(doc.originalFileName)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{doc.originalFileName}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="w-3 h-3" />
                      インデックス済み
                    </span>
                    {doc.id.startsWith('gemini-') && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">Gemini API</span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '日時不明'}
                    </span>
                    {doc.folderId && (
                      <>
                        <span>•</span>
                        <span>📁 {folders.find((f) => f.id === doc.folderId)?.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDocument(doc)
                  }}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  title="内容をプレビュー"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
                <div className="p-2 text-gray-400" title="ドラッグしてフォルダへ移動">
                  <ArrowsPointingOutIcon className="w-4 h-4" />
                </div>
                <button
                  onClick={() => onDelete(doc.id, doc.geminiFileName, doc.storeName)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ))}

      {/* ドキュメントプレビューモーダル */}
      <DocumentPreviewModal
        document={selectedDocument}
        isOpen={selectedDocument !== null}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  )
}
