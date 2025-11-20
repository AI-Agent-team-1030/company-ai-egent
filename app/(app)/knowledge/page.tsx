'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { apiGet, apiRequest, apiDelete } from '@/lib/api-client'

interface Document {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  uploaded_at: string
  processed: boolean
  processed_at: string | null
}

interface ProcessingStatus {
  [key: string]: {
    status: 'uploading' | 'extracting' | 'completed' | 'error'
    message: string
    progress: number
  }
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({})

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await apiGet('/api/documents')
      if (!response.ok) throw new Error('Failed to fetch documents')

      const result = await response.json()
      setDocuments(result.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const tempId = `temp-${Date.now()}`
    setUploading(true)
    setError(null)

    // アップロード中の状態を表示
    setProcessingStatus((prev) => ({
      ...prev,
      [tempId]: {
        status: 'uploading',
        message: `${file.name} をアップロード中...`,
        progress: 30,
      },
    }))

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiRequest('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const newDocument = await response.json()

      // テキスト抽出中の状態を表示
      setProcessingStatus((prev) => ({
        ...prev,
        [tempId]: {
          status: 'extracting',
          message: 'テキストを抽出中...',
          progress: 60,
        },
      }))

      setDocuments((prev) => [newDocument, ...prev])

      // 処理完了を待つ（ポーリング）
      let attempts = 0
      const checkProcessing = setInterval(async () => {
        attempts++
        const checkResponse = await apiGet('/api/documents')
        const result = await checkResponse.json()
        const doc = result.data.find((d: Document) => d.id === newDocument.id)

        if (doc?.processed || attempts > 30) {
          clearInterval(checkProcessing)

          // 完了状態を表示
          setProcessingStatus((prev) => ({
            ...prev,
            [tempId]: {
              status: 'completed',
              message: '処理完了！',
              progress: 100,
            },
          }))

          // 3秒後にステータスを削除
          setTimeout(() => {
            setProcessingStatus((prev) => {
              const { [tempId]: _, ...rest } = prev
              return rest
            })
          }, 3000)

          // ドキュメントリストを更新
          fetchDocuments()
        }
      }, 2000)

      // ファイル入力をリセット
      e.target.value = ''
    } catch (err: any) {
      setError(err.message)

      // エラー状態を表示
      setProcessingStatus((prev) => ({
        ...prev,
        [tempId]: {
          status: 'error',
          message: `エラー: ${err.message}`,
          progress: 0,
        },
      }))

      // 5秒後にエラー表示を削除
      setTimeout(() => {
        setProcessingStatus((prev) => {
          const { [tempId]: _, ...rest } = prev
          return rest
        })
      }, 5000)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このドキュメントを削除しますか？')) return

    try {
      const response = await apiDelete(`/api/documents/${id}`)

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊'
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️'
    if (fileType.includes('csv')) return '📈'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('text')) return '📃'
    return '📁'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ナレッジベース</h1>
          <p className="text-gray-600">ドキュメントをアップロードして、AIが参照できるようにします</p>
        </div>
        <label className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold cursor-pointer">
          <CloudArrowUpIcon className="w-5 h-5" />
          {uploading ? 'アップロード中...' : 'ドキュメント追加'}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.docx,.xlsx,.xls,.pptx,.ppt,.csv,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Processing Status */}
      {Object.keys(processingStatus).length > 0 && (
        <div className="mb-6 space-y-3">
          {Object.entries(processingStatus).map(([id, status]) => (
            <div
              key={id}
              className={`rounded-lg p-4 ${
                status.status === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : status.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className={`text-sm font-medium ${
                    status.status === 'error'
                      ? 'text-red-800'
                      : status.status === 'completed'
                      ? 'text-green-800'
                      : 'text-blue-800'
                  }`}
                >
                  {status.message}
                </p>
                <span
                  className={`text-xs font-bold ${
                    status.status === 'error'
                      ? 'text-red-600'
                      : status.status === 'completed'
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`}
                >
                  {status.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status.status === 'error'
                      ? 'bg-red-600'
                      : status.status === 'completed'
                      ? 'bg-green-600'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">
            <strong>エラー:</strong> {error}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">総ドキュメント数</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '-' : documents.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">処理済み</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '-' : documents.filter((d) => d.processed).length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">処理中</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? '-' : documents.filter((d) => !d.processed).length}
          </p>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>対応形式:</strong> PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, テキスト (.txt), Markdown (.md), 画像 (.png, .jpg, .gif)
          <br />
          <strong>最大サイズ:</strong> 50MB
          <br />
          <strong>使い方:</strong> ドキュメントをアップロードすると、自動的にテキストが抽出されます（画像はOCR処理）。チャットで質問すると、AIが関連するドキュメントを参照して回答します。
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-600 mt-4">読み込み中...</p>
        </div>
      )}

      {/* Document List */}
      {!loading && (
        <div className="space-y-4">
          {documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-lg border border-gray-200"
            >
              <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">ドキュメントがありません</h3>
              <p className="text-gray-600 mb-4">最初のドキュメントをアップロードしてください</p>
            </motion.div>
          ) : (
            documents.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{getFileTypeIcon(doc.file_type)}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {doc.original_filename}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString('ja-JP')}</span>
                        <span>•</span>
                        {doc.processed ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            処理済み
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <ClockIcon className="w-4 h-4" />
                            処理中...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
