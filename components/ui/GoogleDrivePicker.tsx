'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  listDriveFiles,
  DriveFile,
  getFileIcon,
  formatFileSize,
  getFileType,
} from '@/lib/google-drive'
import {
  XMarkIcon,
  ArrowLeftIcon,
  FolderIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

interface Props {
  onSelect: (files: DriveFile[]) => void
  onClose: () => void
  multiSelect?: boolean
}

interface FolderPath {
  id: string
  name: string
}

export default function GoogleDrivePicker({ onSelect, onClose, multiSelect = true }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Map<string, DriveFile>>(new Map())
  const [folderStack, setFolderStack] = useState<FolderPath[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()

  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : undefined

  useEffect(() => {
    loadFiles()
  }, [currentFolderId])

  const loadFiles = async (pageToken?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await listDriveFiles(currentFolderId, pageToken)
      if (pageToken) {
        setFiles(prev => [...prev, ...result.files])
      } else {
        setFiles(result.files)
      }
      setNextPageToken(result.nextPageToken)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleFileClick = (file: DriveFile) => {
    const fileType = getFileType(file.mimeType)

    if (fileType === 'folder') {
      // フォルダに入る
      setFolderStack([...folderStack, { id: file.id, name: file.name }])
      setFiles([])
    } else {
      // ファイルを選択/解除
      const newSelected = new Map(selectedFiles)
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id)
      } else {
        if (!multiSelect) {
          newSelected.clear()
        }
        newSelected.set(file.id, file)
      }
      setSelectedFiles(newSelected)
    }
  }

  const handleBack = () => {
    const newStack = [...folderStack]
    newStack.pop()
    setFolderStack(newStack)
    setFiles([])
  }

  const handleConfirm = () => {
    const selected = Array.from(selectedFiles.values())
    onSelect(selected)
  }

  const handleLoadMore = () => {
    if (nextPageToken) {
      loadFiles(nextPageToken)
    }
  }

  // サポートされているファイルタイプかチェック
  const isSupportedFile = (mimeType: string): boolean => {
    const type = getFileType(mimeType)
    return type !== 'folder' // フォルダ以外はすべて選択可能
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* モーダル */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {folderStack.length > 0 && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Googleドライブから選択
              </h2>
              <p className="text-sm text-gray-500">
                {folderStack.length > 0
                  ? folderStack.map(f => f.name).join(' / ')
                  : 'マイドライブ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* ファイル一覧 */}
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => loadFiles()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                再試行
              </button>
            </div>
          ) : loading && files.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full mx-auto mb-4" />
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ファイルがありません</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2">
                {files.map(file => {
                  const fileType = getFileType(file.mimeType)
                  const isFolder = fileType === 'folder'
                  const isSelected = selectedFiles.has(file.id)
                  const isSupported = isSupportedFile(file.mimeType)

                  return (
                    <div
                      key={file.id}
                      onClick={() => handleFileClick(file)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      } ${!isSupported && !isFolder ? 'opacity-50' : ''}`}
                    >
                      {/* アイコン */}
                      <span className="text-2xl flex-shrink-0">
                        {getFileIcon(file.mimeType)}
                      </span>

                      {/* ファイル情報 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                          {file.modifiedTime && (
                            <span className="ml-2">
                              {new Date(file.modifiedTime).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* 選択チェック */}
                      {!isFolder && (
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="w-4 h-4 text-white" />
                          )}
                        </div>
                      )}

                      {/* フォルダ矢印 */}
                      {isFolder && (
                        <span className="text-gray-400 flex-shrink-0">→</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* もっと読み込む */}
              {nextPageToken && (
                <div className="text-center mt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    {loading ? '読み込み中...' : 'もっと見る'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedFiles.size > 0
              ? `${selectedFiles.size}件選択中`
              : 'ファイルを選択してください'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.size === 0}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              インポート ({selectedFiles.size})
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
