/**
 * ドキュメントリストコンポーネント
 *
 * ドキュメント一覧の表示と削除機能
 */

'use client'

import { motion } from 'framer-motion'
import { BookOpenIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import type { KnowledgeDocument, KnowledgeFolder } from '../types'

interface DocumentListProps {
  documents: KnowledgeDocument[]
  folders: KnowledgeFolder[]
  loading: boolean
  onDelete: (docId: string, geminiFileName?: string) => void
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

export function DocumentList({ documents, folders, loading, onDelete }: DocumentListProps) {
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
        <motion.div
          key={doc.id}
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
            <button
              onClick={() => onDelete(doc.id, doc.geminiFileName)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
