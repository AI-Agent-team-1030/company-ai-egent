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
  XMarkIcon,
  EyeIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { apiGet, apiRequest, apiDelete } from '@/lib/api-client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Folder {
  id: string
  name: string
  user_id: string
  parent_folder_id: string | null
  created_at: string
  updated_at: string
}

interface Document {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  uploaded_at: string
  processed: boolean
  processed_at: string | null
  folder_id: string | null
}

interface ProcessingStatus {
  [key: string]: {
    status: 'uploading' | 'extracting' | 'completed' | 'error'
    message: string
    progress: number
  }
}

interface DocumentDetail {
  document: Document
  chunks: Array<{ id: string; content: string; chunk_index: number }>
  fullText: string
  markdown: string
}

export default function KnowledgePage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({})
  const [selectedDocument, setSelectedDocument] = useState<DocumentDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)

  useEffect(() => {
    fetchFolders()
    fetchDocuments()
  }, [])

  const fetchFolders = async () => {
    try {
      const response = await apiGet('/api/folders')
      if (!response.ok) throw new Error('Failed to fetch folders')

      const result = await response.json()
      setFolders(result.data || [])
    } catch (err: any) {
      console.error('Error fetching folders:', err)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await apiRequest('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      })

      if (!response.ok) throw new Error('Failed to create folder')

      const newFolder = await response.json()
      setFolders((prev) => [...prev, newFolder])
      setNewFolderName('')
      setShowCreateFolder(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return

    try {
      const response = await apiRequest(`/api/folders/${editingFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      })

      if (!response.ok) throw new Error('Failed to update folder')

      const updatedFolder = await response.json()
      setFolders((prev) => prev.map((f) => (f.id === updatedFolder.id ? updatedFolder : f)))
      setEditingFolder(null)
      setNewFolderName('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('このフォルダを削除しますか？')) return

    try {
      const response = await apiDelete(`/api/folders/${folderId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setFolders((prev) => prev.filter((f) => f.id !== folderId))
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null)
      }
    } catch (err: any) {
      setError(err.message)
      alert(err.message)
    }
  }

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
      if (selectedFolderId) {
        formData.append('folder_id', selectedFolderId)
      }

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

  const handleViewDocument = async (doc: Document) => {
    if (!doc.processed) {
      alert('このドキュメントはまだ処理中です')
      return
    }

    setLoadingDetail(true)
    try {
      const response = await apiGet(`/api/documents/${doc.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch document details')
      }

      const detail: DocumentDetail = await response.json()
      setSelectedDocument(detail)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingDetail(false)
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
      if (selectedDocument?.document.id === id) {
        setSelectedDocument(null)
      }
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
          <p className="text-gray-600">
            ドキュメントをアップロードして、AIが参照できるようにします
            {selectedFolderId && (
              <span className="ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded">
                📁 {folders.find((f) => f.id === selectedFolderId)?.name || 'フォルダ'} に保存されます
              </span>
            )}
          </p>
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

      {/* Folders Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">フォルダ</h2>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            新しいフォルダ
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* All Documents */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
              selectedFolderId === null
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            <FolderOpenIcon className="w-5 h-5" />
            <span className="font-medium">すべて</span>
            <span className="text-xs opacity-75">({documents.length})</span>
          </button>

          {/* Folders */}
          {folders.map((folder) => {
            const folderDocs = documents.filter((d) => d.folder_id === folder.id)
            return (
              <div key={folder.id} className="relative group">
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
                    selectedFolderId === folder.id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <FolderIcon className="w-5 h-5" />
                  <span className="font-medium">{folder.name}</span>
                  <span className="text-xs opacity-75">({folderDocs.length})</span>
                </button>

                {/* Folder actions */}
                <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingFolder(folder)
                      setNewFolderName(folder.name)
                    }}
                    className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <PencilIcon className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(folder.id)
                    }}
                    className="p-1.5 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
          {(() => {
            const filteredDocuments = selectedFolderId
              ? documents.filter((d) => d.folder_id === selectedFolderId)
              : documents

            if (filteredDocuments.length === 0) {
              return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-lg border border-gray-200"
            >
              <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">ドキュメントがありません</h3>
              <p className="text-gray-600 mb-4">
                {selectedFolderId ? 'このフォルダにはドキュメントがありません' : '最初のドキュメントをアップロードしてください'}
              </p>
            </motion.div>
              )
            }

            return filteredDocuments.map((doc, index) => (
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
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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
                      {doc.processed && (
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                          <EyeIcon className="w-4 h-4" />
                          内容を表示
                        </button>
                      )}
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
          })()}
        </div>
      )}

      {/* Create/Edit Folder Modal */}
      <AnimatePresence>
        {(showCreateFolder || editingFolder) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateFolder(false)
              setEditingFolder(null)
              setNewFolderName('')
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingFolder ? 'フォルダ名を変更' : '新しいフォルダ'}
              </h2>

              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    editingFolder ? handleUpdateFolder() : handleCreateFolder()
                  }
                }}
                placeholder="フォルダ名を入力"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateFolder(false)
                    setEditingFolder(null)
                    setNewFolderName('')
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {editingFolder ? '変更' : '作成'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Detail Modal */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getFileTypeIcon(selectedDocument.document.file_type)}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedDocument.document.original_filename}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(selectedDocument.document.file_size)} • {selectedDocument.chunks.length} チャンク
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedDocument.markdown}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
                <p className="text-xs text-gray-600 text-center">
                  このドキュメントはマークダウン形式に自動変換されています
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Detail Overlay */}
      {loadingDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-900 font-medium">読み込み中...</p>
          </div>
        </div>
      )}
    </div>
  )
}
