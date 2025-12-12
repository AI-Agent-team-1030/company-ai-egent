'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilIcon,
  CloudIcon,
} from '@heroicons/react/24/outline'
import GoogleDrivePicker from '@/components/ui/GoogleDrivePicker'
import { DriveFile, downloadGoogleFile } from '@/lib/google-drive'
import { getGoogleDriveToken } from '@/lib/firebase-auth'
import { useAuth } from '@/contexts/AuthContext'
import {
  saveFileSearchStore,
  getCompanyFileSearchStores,
  saveUploadedDocument,
  getDocuments,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  deleteDocument,
} from '@/lib/firestore-chat'
import {
  createFileSearchStore,
  uploadFile,
  importFileToStore,
  listFiles,
  deleteFile as deleteGeminiFile,
  FileInfo,
} from '@/lib/gemini-file-search'
import { BUILT_IN_GEMINI_API_KEY } from '@/lib/ai-providers'

interface Document {
  id: string
  fileName: string
  originalFileName: string
  geminiFileName: string
  storeName: string
  folderId: string | null
  createdAt: Date
}

interface Folder {
  id: string
  name: string
  companyId: string
  parentFolderId: string | null
}

interface StoreInfo {
  id: string
  storeName: string
  displayName: string
}

interface ProcessingStatus {
  [key: string]: {
    status: 'uploading' | 'processing' | 'completed' | 'error'
    message: string
    progress: number
  }
}

export default function KnowledgePage() {
  const { user, profile } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [geminiFiles, setGeminiFiles] = useState<FileInfo[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({})

  // フォルダモーダル
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [folderName, setFolderName] = useState('')

  // Googleドライブ
  const [showDrivePicker, setShowDrivePicker] = useState(false)
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false)

  // Googleドライブ接続状態を確認
  useEffect(() => {
    const token = getGoogleDriveToken()
    setIsGoogleDriveConnected(!!token)
  }, [])

  useEffect(() => {
    if (profile?.companyId) {
      fetchData()
    }
  }, [profile?.companyId])

  const fetchData = async () => {
    if (!profile?.companyId) {
      console.log('[Knowledge] No companyId in profile:', profile)
      return
    }
    console.log('[Knowledge] Fetching data for companyId:', profile.companyId)
    setLoading(true)
    try {
      // FirestoreとGemini APIの両方からデータを取得
      const apiKey = BUILT_IN_GEMINI_API_KEY
      const [storesData, docsData, foldersData, geminiFilesResult] = await Promise.all([
        getCompanyFileSearchStores(profile.companyId),
        getDocuments(profile.companyId),
        getFolders(profile.companyId),
        apiKey ? listFiles(apiKey) : { files: [], error: null },
      ])
      console.log('[Knowledge] Fetched:', {
        stores: storesData.length,
        docs: docsData.length,
        folders: foldersData.length,
        geminiFiles: geminiFilesResult.files.length
      })

      setStores(storesData.map((s: any) => ({
        id: s.id,
        storeName: s.storeName,
        displayName: s.displayName,
      })))

      setDocuments(docsData.map((d: any) => ({
        id: d.id,
        fileName: d.fileName,
        originalFileName: d.originalFileName,
        geminiFileName: d.geminiFileName,
        storeName: d.storeName,
        folderId: d.folderId || null,
        createdAt: d.createdAt,
      })))

      setFolders(foldersData.map((f: any) => ({
        id: f.id,
        name: f.name,
        companyId: f.companyId,
        parentFolderId: f.parentFolderId,
      })))

      // Geminiファイルを設定（ACTIVEのもののみ）
      if (!geminiFilesResult.error) {
        setGeminiFiles(geminiFilesResult.files.filter(f => f.state === 'ACTIVE'))
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !user || !profile?.companyId) return

    try {
      const result = await createFolder(user.uid, profile.companyId, folderName.trim())
      setFolders(prev => [...prev, { ...result, companyId: profile.companyId, parentFolderId: null }])
      setFolderName('')
      setShowFolderModal(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !folderName.trim()) return

    try {
      await updateFolder(editingFolder.id, folderName.trim())
      setFolders(prev => prev.map(f => f.id === editingFolder.id ? { ...f, name: folderName.trim() } : f))
      setEditingFolder(null)
      setFolderName('')
      setShowFolderModal(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    const folderDocs = documents.filter(d => d.folderId === folderId)
    if (folderDocs.length > 0) {
      alert('フォルダ内にドキュメントがあるため削除できません。先にドキュメントを削除してください。')
      return
    }
    if (!confirm('このフォルダを削除しますか？')) return

    try {
      await deleteFolder(folderId)
      setFolders(prev => prev.filter(f => f.id !== folderId))
      if (selectedFolderId === folderId) setSelectedFolderId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteDocument = async (docId: string, geminiFileName?: string) => {
    if (!confirm('このドキュメントを削除しますか？')) return

    try {
      const apiKey = BUILT_IN_GEMINI_API_KEY

      // Geminiのみのファイル（Firestoreに未登録）
      if (docId.startsWith('gemini-') && geminiFileName && apiKey) {
        const result = await deleteGeminiFile(apiKey, geminiFileName)
        if (result.error) throw new Error(result.error)
        setGeminiFiles(prev => prev.filter(f => f.name !== geminiFileName))
      } else {
        // Firestoreに登録されているファイル
        // まずGeminiからも削除を試みる
        if (geminiFileName && apiKey) {
          await deleteGeminiFile(apiKey, geminiFileName).catch(() => {})
        }
        await deleteDocument(docId)
        setDocuments(prev => prev.filter(d => d.id !== docId))
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Googleドライブからインポート
  const handleDriveImport = async (files: DriveFile[]) => {
    setShowDrivePicker(false)
    if (!user || !profile?.companyId || files.length === 0) return

    setUploading(true)
    setError(null)

    for (const driveFile of files) {
      const tempId = `drive-${driveFile.id}-${Date.now()}`

      setProcessingStatus((prev) => ({
        ...prev,
        [tempId]: {
          status: 'uploading',
          message: `${driveFile.name} をダウンロード中...`,
          progress: 10,
        },
      }))

      try {
        const apiKey = BUILT_IN_GEMINI_API_KEY
        if (!apiKey) throw new Error('Gemini APIキーが設定されていません')

        // Googleドライブからダウンロード
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'processing', message: `${driveFile.name} をダウンロード中...`, progress: 20 },
        }))

        const { blob, fileName } = await downloadGoogleFile(driveFile)

        // ストアが存在しない場合は作成
        let storeName = stores[0]?.storeName
        if (!storeName) {
          setProcessingStatus((prev) => ({
            ...prev,
            [tempId]: { status: 'processing', message: 'ナレッジストアを作成中...', progress: 30 },
          }))

          const storeResult = await createFileSearchStore(apiKey, `${profile.companyName || 'Company'} Knowledge`)
          if (storeResult.error) throw new Error(storeResult.error)
          storeName = storeResult.storeName

          await saveFileSearchStore(user.uid, profile.companyId, storeName, `${profile.companyName || 'Company'} Knowledge`)
          setStores(prev => [...prev, { id: Date.now().toString(), storeName, displayName: `${profile.companyName || 'Company'} Knowledge` }])
        }

        // ファイルをGeminiにアップロード
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'processing', message: `${fileName} をGemini AIにアップロード中...`, progress: 50 },
        }))

        const fileBuffer = await blob.arrayBuffer()
        const uploadResult = await uploadFile(apiKey, new Uint8Array(fileBuffer), fileName, blob.type || 'application/octet-stream')
        if (uploadResult.error) throw new Error(uploadResult.error)

        // ストアにインポート
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'processing', message: 'インデックス作成中...', progress: 70 },
        }))

        const importResult = await importFileToStore(apiKey, storeName, uploadResult.fileName)
        if (importResult.error) throw new Error(importResult.error)

        // Firestoreに保存
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'processing', message: '保存中...', progress: 90 },
        }))

        await saveUploadedDocument(
          user.uid,
          profile.companyId,
          fileName,
          driveFile.name,
          uploadResult.fileName,
          storeName,
          selectedFolderId
        )

        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'completed', message: `${driveFile.name} 完了！`, progress: 100 },
        }))

        setTimeout(() => {
          setProcessingStatus((prev) => {
            const { [tempId]: _, ...rest } = prev
            return rest
          })
        }, 3000)
      } catch (err: any) {
        setError(err.message)
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'error', message: `エラー: ${err.message}`, progress: 0 },
        }))

        setTimeout(() => {
          setProcessingStatus((prev) => {
            const { [tempId]: _, ...rest } = prev
            return rest
          })
        }, 5000)
      }
    }

    await fetchData()
    setUploading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user || !profile?.companyId) return

    const fileArray = Array.from(files)
    setUploading(true)
    setError(null)

    // 最初にストアを確認・作成
    let storeName = stores[0]?.storeName
    const apiKey = BUILT_IN_GEMINI_API_KEY
    if (!apiKey) {
      setError('Gemini APIキーが設定されていません')
      setUploading(false)
      return
    }

    if (!storeName) {
      try {
        const storeResult = await createFileSearchStore(apiKey, `${profile.companyName || 'Company'} Knowledge`)
        if (storeResult.error) throw new Error(storeResult.error)
        storeName = storeResult.storeName

        await saveFileSearchStore(user.uid, profile.companyId, storeName, `${profile.companyName || 'Company'} Knowledge`)
        setStores(prev => [...prev, { id: Date.now().toString(), storeName, displayName: `${profile.companyName || 'Company'} Knowledge` }])
      } catch (err: any) {
        setError(err.message)
        setUploading(false)
        return
      }
    }

    // 各ファイルを処理
    for (const file of fileArray) {
      const tempId = `temp-${Date.now()}-${file.name}`

      setProcessingStatus((prev) => ({
        ...prev,
        [tempId]: {
          status: 'uploading',
          message: `${file.name} をアップロード中...`,
          progress: 20,
        },
      }))

      try {
        // ファイルをGeminiにアップロード
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'processing', message: `${file.name} をGemini AIにアップロード中...`, progress: 50 },
        }))

        const fileBuffer = await file.arrayBuffer()
        const uploadResult = await uploadFile(apiKey, new Uint8Array(fileBuffer), file.name, file.type)
        if (uploadResult.error) throw new Error(uploadResult.error)

        // ストアにインポート
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'processing', message: `${file.name} のインデックス作成中...`, progress: 70 },
        }))

        const importResult = await importFileToStore(apiKey, storeName, uploadResult.fileName)
        if (importResult.error) throw new Error(importResult.error)

        // Firestoreに保存
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'processing', message: `${file.name} を保存中...`, progress: 90 },
        }))

        await saveUploadedDocument(
          user.uid,
          profile.companyId,
          file.name,
          file.name,
          uploadResult.fileName,
          storeName,
          selectedFolderId
        )

        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'completed', message: `${file.name} 完了！`, progress: 100 },
        }))

        setTimeout(() => {
          setProcessingStatus((prev) => {
            const { [tempId]: _, ...rest } = prev
            return rest
          })
        }, 3000)
      } catch (err: any) {
        setError(err.message)
        setProcessingStatus((prev) => ({
          ...prev,
          [tempId]: { status: 'error', message: `${file.name}: ${err.message}`, progress: 0 },
        }))

        setTimeout(() => {
          setProcessingStatus((prev) => {
            const { [tempId]: _, ...rest } = prev
            return rest
          })
        }, 5000)
      }
    }

    await fetchData()
    e.target.value = ''
    setUploading(false)
  }

  const getFileTypeIcon = (fileName: string) => {
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

  // FirestoreドキュメントとGeminiファイルをマージ
  // Firestoreにあるものは優先、Geminiにのみあるものも表示
  const mergedDocuments = (() => {
    // Firestoreに登録されているGeminiファイル名のセット
    const firestoreGeminiNames = new Set(documents.map(d => d.geminiFileName))

    // Geminiにのみ存在するファイル（Firestoreに未登録）
    const geminiOnlyDocs: Document[] = geminiFiles
      .filter(f => !firestoreGeminiNames.has(f.name))
      .map(f => ({
        id: `gemini-${f.name}`,
        fileName: f.displayName || f.name,
        originalFileName: f.displayName || f.name,
        geminiFileName: f.name,
        storeName: '',
        folderId: null,
        createdAt: f.createTime ? new Date(f.createTime) : new Date(),
      }))

    return [...documents, ...geminiOnlyDocs]
  })()

  const filteredDocuments = selectedFolderId
    ? mergedDocuments.filter(d => d.folderId === selectedFolderId)
    : mergedDocuments

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">ナレッジボックス</h1>
          <p className="text-sm md:text-base text-gray-600">
            ドキュメントをアップロードすると、チャットで自動検索されます
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Googleドライブからインポート */}
          {isGoogleDriveConnected && (
            <button
              onClick={() => setShowDrivePicker(true)}
              disabled={uploading}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm md:text-base w-full sm:w-auto disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <CloudIcon className="w-5 h-5" />
              Googleドライブから
            </button>
          )}

          {/* 直接アップロード */}
          <label className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold cursor-pointer text-sm md:text-base w-full sm:w-auto">
            <CloudArrowUpIcon className="w-5 h-5" />
            {uploading ? 'アップロード中...' : 'ドキュメント追加'}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.docx,.xlsx,.xls,.pptx,.ppt,.csv,.png,.jpg,.jpeg,.gif,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
              multiple
            />
          </label>
        </div>
      </div>

      {/* Googleドライブ未接続の案内 */}
      {!isGoogleDriveConnected && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CloudIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Googleドライブ連携</p>
              <p className="text-sm text-blue-600">設定からGoogleドライブを接続すると、ドライブからファイルを直接インポートできます</p>
            </div>
          </div>
          <a
            href="/settings"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
          >
            設定を開く
          </a>
        </div>
      )}

      {/* Processing Status */}
      {Object.keys(processingStatus).length > 0 && (
        <div className="mb-6 space-y-3">
          {Object.entries(processingStatus).map(([id, status]) => (
            <div
              key={id}
              className={`rounded-lg p-4 ${
                status.status === 'error' ? 'bg-red-50 border border-red-200' :
                status.status === 'completed' ? 'bg-green-50 border border-green-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${
                  status.status === 'error' ? 'text-red-800' :
                  status.status === 'completed' ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {status.message}
                </p>
                <span className={`text-xs font-bold ${
                  status.status === 'error' ? 'text-red-600' :
                  status.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {status.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    status.status === 'error' ? 'bg-red-600' :
                    status.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm"><strong>エラー:</strong> {error}</p>
        </div>
      )}

      {/* Folders */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">フォルダ</h2>
          <button
            onClick={() => { setShowFolderModal(true); setEditingFolder(null); setFolderName(''); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            新規フォルダ
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {/* All */}
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
            <span className="text-xs opacity-75">({mergedDocuments.length})</span>
          </button>

          {folders.map((folder) => {
            const count = documents.filter(d => d.folderId === folder.id).length
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
                  <span className="text-xs opacity-75">({count})</span>
                </button>

                <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setFolderName(folder.name); setShowFolderModal(true); }}
                    className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <PencilIcon className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                    className="p-1.5 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    <TrashIcon className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {selectedFolderId && (
          <p className="text-sm text-gray-500 mt-2">
            📁 「{folders.find(f => f.id === selectedFolderId)?.name}」に保存されます
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">ドキュメント数</p>
          <p className="text-2xl font-bold text-gray-900">{mergedDocuments.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">フォルダ数</p>
          <p className="text-2xl font-bold text-gray-900">{folders.length}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-gray-600 mt-4">読み込み中...</p>
        </div>
      )}

      {/* Documents */}
      {!loading && (
        <div className="space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">ドキュメントがありません</h3>
              <p className="text-gray-600">ドキュメントをアップロードしてください</p>
            </div>
          ) : (
            filteredDocuments.map((doc, index) => (
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
                        <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }) : '日時不明'}</span>
                        {doc.folderId && (
                          <>
                            <span>•</span>
                            <span>📁 {folders.find(f => f.id === doc.folderId)?.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.geminiFileName)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFolderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingFolder ? 'フォルダ名を変更' : '新しいフォルダ'}
              </h2>

              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') editingFolder ? handleUpdateFolder() : handleCreateFolder() }}
                placeholder="フォルダ名"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
                autoFocus
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                  disabled={!folderName.trim()}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:bg-gray-300"
                >
                  {editingFolder ? '変更' : '作成'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Drive Picker */}
      <AnimatePresence>
        {showDrivePicker && (
          <GoogleDrivePicker
            onSelect={handleDriveImport}
            onClose={() => setShowDrivePicker(false)}
            multiSelect={true}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
