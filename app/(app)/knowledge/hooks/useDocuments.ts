/**
 * ドキュメント管理フック
 *
 * ドキュメントとフォルダの CRUD 操作、ファイルアップロード処理を担当
 * アップロードはバックグラウンドで実行し、UIをブロックしない
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DriveFile, downloadGoogleFile, setDriveAccessToken } from '@/lib/google-drive'
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
  updateDocumentFolder,
  getCompanyDriveConnection,
  CompanyDriveConnection,
  uploadFileToStorage,
  uploadBufferToStorage,
} from '@/lib/firestore-chat'
import {
  createFileSearchStore,
  uploadFile,
  importFileToStore,
  deleteFileCompletely,
  createGeminiClient,
} from '@/lib/gemini-file-search'
// indexDocument と deleteDocumentIndex は API経由で使用
import { BUILT_IN_GEMINI_API_KEY } from '@/lib/ai-providers'
import { knowledgeLogger } from '@/lib/logger'
import { useBackgroundTaskStore } from '@/stores/backgroundTaskStore'
import type {
  KnowledgeDocument,
  KnowledgeFolder,
  FileSearchStore,
  ProcessingStatus,
} from '../types'

export function useDocuments() {
  const { user, profile } = useAuth()
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [folders, setFolders] = useState<KnowledgeFolder[]>([])
  const [stores, setStores] = useState<FileSearchStore[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({})
  const [companyDriveConnection, setCompanyDriveConnection] =
    useState<CompanyDriveConnection | null>(null)

  // バックグラウンドタスク管理
  const storesRef = useRef<FileSearchStore[]>([])

  // storeの関数を直接取得（クロージャ問題を回避）
  const getTaskActions = () => useBackgroundTaskStore.getState()

  // 会社レベルのGoogleドライブ接続状態を確認
  useEffect(() => {
    const loadDriveConnection = async () => {
      if (!profile?.companyId) return
      try {
        const connection = await getCompanyDriveConnection(profile.companyId)
        setCompanyDriveConnection(connection)
        if (connection?.accessToken) {
          setDriveAccessToken(connection.accessToken)
        }
        knowledgeLogger.debug(
          'Drive connection:',
          connection?.isConnected ? 'Connected' : 'Not connected'
        )
      } catch (err) {
        knowledgeLogger.error('Failed to load drive connection:', err)
      }
    }
    loadDriveConnection()
  }, [profile?.companyId])

  useEffect(() => {
    if (profile?.companyId) {
      fetchData()
    }
  }, [profile?.companyId])

  const fetchData = useCallback(async () => {
    if (!profile?.companyId) {
      knowledgeLogger.debug('No companyId in profile:', profile)
      return
    }
    knowledgeLogger.debug('Fetching data for companyId:', profile.companyId)
    setLoading(true)
    try {
      const [storesData, docsData, foldersData] = await Promise.all([
        getCompanyFileSearchStores(profile.companyId),
        getDocuments(profile.companyId),
        getFolders(profile.companyId),
      ])

      setStores(
        storesData.map((s: any) => ({
          id: s.id,
          storeName: s.storeName,
          displayName: s.displayName,
        }))
      )

      setDocuments(
        docsData.map((d: any) => ({
          id: d.id,
          fileName: d.fileName,
          originalFileName: d.originalFileName,
          geminiFileName: d.geminiFileName,
          storeName: d.storeName,
          folderId: d.folderId || null,
          createdAt: d.createdAt,
        }))
      )

      setFolders(
        foldersData.map((f: any) => ({
          id: f.id,
          name: f.name,
          companyId: f.companyId,
          parentFolderId: f.parentFolderId,
        }))
      )

      // storesをrefにも保存（バックグラウンド処理用）
      storesRef.current = storesData.map((s: any) => ({
        id: s.id,
        storeName: s.storeName,
        displayName: s.displayName,
      }))
    } catch (err: any) {
      knowledgeLogger.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [profile?.companyId])

  const handleCreateFolder = useCallback(
    async (folderName: string) => {
      if (!folderName.trim() || !user || !profile?.companyId) return

      try {
        const result = await createFolder(user.uid, profile.companyId, folderName.trim())
        setFolders((prev) => [
          ...prev,
          { ...result, companyId: profile.companyId, parentFolderId: null },
        ])
        return true
      } catch (err: any) {
        setError(err.message)
        return false
      }
    },
    [user, profile?.companyId]
  )

  const handleUpdateFolder = useCallback(async (folderId: string, newName: string) => {
    if (!newName.trim()) return false

    try {
      await updateFolder(folderId, newName.trim())
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: newName.trim() } : f))
      )
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [])

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const folderDocs = documents.filter((d) => d.folderId === folderId)
      if (folderDocs.length > 0) {
        alert('フォルダ内にドキュメントがあるため削除できません。先にドキュメントを削除してください。')
        return false
      }
      if (!confirm('このフォルダを削除しますか？')) return false

      try {
        await deleteFolder(folderId)
        setFolders((prev) => prev.filter((f) => f.id !== folderId))
        if (selectedFolderId === folderId) setSelectedFolderId(null)
        return true
      } catch (err: any) {
        setError(err.message)
        return false
      }
    },
    [documents, selectedFolderId]
  )

  const handleDeleteDocument = useCallback(async (docId: string, geminiFileName?: string, storeName?: string) => {
    if (!confirm('このドキュメントを削除しますか？')) return false

    try {
      const apiKey = BUILT_IN_GEMINI_API_KEY

      // 1. Gemini File Search Store から削除
      if (geminiFileName && apiKey) {
        const targetStoreName = storeName || stores[0]?.storeName
        if (targetStoreName) {
          try {
            await deleteFileCompletely(apiKey, targetStoreName, geminiFileName)
          } catch (err) {
            knowledgeLogger.warn('Failed to delete file from Gemini:', err)
            // Gemini側のエラーは無視して続行
          }
        }
      }

      // 2. Firestore ベクトル検索インデックス（knowledge_chunks）から削除
      try {
        const deleteRes = await fetch(`/api/knowledge/index?documentId=${encodeURIComponent(docId)}`, {
          method: 'DELETE',
        })
        if (!deleteRes.ok) {
          const errorData = await deleteRes.json().catch(() => ({}))
          knowledgeLogger.warn('Failed to delete vector index:', errorData)
        } else {
          knowledgeLogger.debug('Vector index deleted for document:', docId)
        }
      } catch (err) {
        knowledgeLogger.warn('Failed to delete vector index (network error):', err)
        // ベクトルインデックスのエラーは無視して続行
      }

      // 3. Firestore documents コレクションから削除
      await deleteDocument(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      knowledgeLogger.info('Document deleted successfully:', docId)
      return true
    } catch (err: any) {
      knowledgeLogger.error('Failed to delete document:', err)
      setError(err.message)
      return false
    }
  }, [stores])

  const handleMoveDocument = useCallback(async (docId: string, targetFolderId: string | null) => {
    try {
      await updateDocumentFolder(docId, targetFolderId)
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, folderId: targetFolderId } : d))
      )
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [])

  const updateProcessingStatus = useCallback(
    (
      id: string,
      status: 'uploading' | 'processing' | 'completed' | 'error',
      message: string,
      progress: number
    ) => {
      setProcessingStatus((prev) => ({
        ...prev,
        [id]: { status, message, progress },
      }))
    },
    []
  )

  const clearProcessingStatus = useCallback((id: string, delay: number = 3000) => {
    setTimeout(() => {
      setProcessingStatus((prev) => {
        const { [id]: _, ...rest } = prev
        return rest
      })
    }, delay)
  }, [])

  const getOrCreateStore = useCallback(async (): Promise<string | null> => {
    if (stores[0]?.storeName) return stores[0].storeName

    const apiKey = BUILT_IN_GEMINI_API_KEY
    if (!apiKey || !user || !profile?.companyId) return null

    try {
      const storeResult = await createFileSearchStore(
        apiKey,
        `${profile.companyName || 'Company'} Knowledge`
      )
      if (storeResult.error) throw new Error(storeResult.error)
      const storeName = storeResult.storeName

      await saveFileSearchStore(
        user.uid,
        profile.companyId,
        storeName,
        `${profile.companyName || 'Company'} Knowledge`
      )
      setStores((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          storeName,
          displayName: `${profile.companyName || 'Company'} Knowledge`,
        },
      ])
      return storeName
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [stores, user, profile?.companyId, profile?.companyName])

  // ファイルアップロードの実処理（バックグラウンド）
  const processFileUpload = async (
    taskId: string,
    file: File,
    userId: string,
    companyId: string,
    folderId: string | null
  ) => {
    const { updateTask } = getTaskActions()
    try {
      const apiKey = BUILT_IN_GEMINI_API_KEY
      if (!apiKey) throw new Error('Gemini APIキーが設定されていません')

      // ストアを取得または作成
      let storeName = storesRef.current[0]?.storeName
      if (!storeName) {
        updateTask(taskId, { progress: 5, message: '準備中...' })
        const storeResult = await createFileSearchStore(apiKey, 'Company Knowledge')
        if (storeResult.error) throw new Error(storeResult.error)
        storeName = storeResult.storeName
        await saveFileSearchStore(userId, companyId, storeName, 'Company Knowledge')
        storesRef.current = [{ id: Date.now().toString(), storeName, displayName: 'Company Knowledge' }]
      }

      // ファイルをバッファに読み込み
      updateTask(taskId, { progress: 10, message: 'ファイルを読み込み中...' })
      const fileBuffer = await file.arrayBuffer()

      // 並列処理: Storage + AI アップロード
      updateTask(taskId, { progress: 20, message: 'アップロード中...' })
      const [storageResult, uploadResult] = await Promise.all([
        uploadFileToStorage(companyId, file, file.name).catch(err => {
          knowledgeLogger.warn('Storage upload failed:', err)
          return { url: '', error: err.message }
        }),
        uploadFile(apiKey, new Uint8Array(fileBuffer), file.name, file.type),
      ])
      if (uploadResult.error) throw new Error(uploadResult.error)

      // AI処理
      updateTask(taskId, { progress: 50, message: '処理中...' })
      const importResult = await importFileToStore(apiKey, storeName, uploadResult.fileName)
      if (importResult.error) throw new Error(importResult.error)

      // ドキュメント保存
      updateTask(taskId, { progress: 70, message: '保存中...' })
      const savedDoc = await saveUploadedDocument(
        userId,
        companyId,
        file.name,
        file.name,
        uploadResult.fileName,
        storeName,
        folderId,
        storageResult.url || undefined,
        file.type || undefined
      )

      // 検索準備（バックグラウンド）
      updateTask(taskId, { progress: 85, message: '検索準備中...' })
      const extractedText = await extractTextFromFile(apiKey, fileBuffer, file.type, file.name)
      if (extractedText && extractedText.length > 10) {
        // 非同期で実行（awaitしない）
        fetch('/api/knowledge/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: savedDoc.id,
            documentTitle: file.name,
            content: extractedText,
            companyId,
            folderId: folderId || undefined,
          }),
        }).catch(indexErr => knowledgeLogger.warn('Vector index failed:', indexErr))
      }

      // 完了
      updateTask(taskId, { status: 'completed', progress: 100, message: 'アップロード完了' })
    } catch (err: any) {
      knowledgeLogger.error('Upload error:', err)
      const { updateTask: ut } = getTaskActions()
      ut(taskId, { status: 'error', progress: 0, message: 'エラーが発生しました', error: err.message })
    }
  }

  // Driveインポートの実処理（バックグラウンド）
  const processDriveImport = async (
    taskId: string,
    driveFile: DriveFile,
    userId: string,
    companyId: string,
    folderId: string | null
  ) => {
    const { updateTask } = getTaskActions()
    try {
      const apiKey = BUILT_IN_GEMINI_API_KEY
      if (!apiKey) throw new Error('Gemini APIキーが設定されていません')

      // Driveからダウンロード
      updateTask(taskId, { progress: 10, message: 'ダウンロード中...' })
      const { blob, fileName } = await downloadGoogleFile(driveFile)
      const mimeType = blob.type || driveFile.mimeType || 'application/octet-stream'
      const fileBuffer = await blob.arrayBuffer()

      // ストアを取得または作成
      let storeName = storesRef.current[0]?.storeName
      if (!storeName) {
        updateTask(taskId, { progress: 15, message: '準備中...' })
        const storeResult = await createFileSearchStore(apiKey, 'Company Knowledge')
        if (storeResult.error) throw new Error(storeResult.error)
        storeName = storeResult.storeName
        await saveFileSearchStore(userId, companyId, storeName, 'Company Knowledge')
        storesRef.current = [{ id: Date.now().toString(), storeName, displayName: 'Company Knowledge' }]
      }

      // 並列処理: Storage + AI アップロード
      updateTask(taskId, { progress: 25, message: 'アップロード中...' })
      const [storageResult, uploadResult] = await Promise.all([
        uploadBufferToStorage(companyId, fileBuffer, fileName, mimeType).catch(err => {
          knowledgeLogger.warn('Storage upload failed:', err)
          return { url: '', error: err.message }
        }),
        uploadFile(apiKey, new Uint8Array(fileBuffer), fileName, mimeType),
      ])
      if (uploadResult.error) throw new Error(uploadResult.error)

      // AI処理
      updateTask(taskId, { progress: 50, message: '処理中...' })
      const importResult = await importFileToStore(apiKey, storeName, uploadResult.fileName)
      if (importResult.error) throw new Error(importResult.error)

      // ドキュメント保存
      updateTask(taskId, { progress: 70, message: '保存中...' })
      const savedDoc = await saveUploadedDocument(
        userId,
        companyId,
        fileName,
        driveFile.name,
        uploadResult.fileName,
        storeName,
        folderId,
        storageResult.url || undefined,
        mimeType
      )

      // 検索準備（バックグラウンド）
      updateTask(taskId, { progress: 85, message: '検索準備中...' })
      const extractedText = await extractTextFromFile(apiKey, fileBuffer, mimeType, fileName)
      if (extractedText && extractedText.length > 10) {
        // 非同期で実行（awaitしない）
        fetch('/api/knowledge/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: savedDoc.id,
            documentTitle: fileName,
            content: extractedText,
            companyId,
            folderId: folderId || undefined,
          }),
        }).catch(indexErr => knowledgeLogger.warn('Vector index failed:', indexErr))
      }

      // 完了
      updateTask(taskId, { status: 'completed', progress: 100, message: 'アップロード完了' })
    } catch (err: any) {
      knowledgeLogger.error('Drive import error:', err)
      const { updateTask: ut } = getTaskActions()
      ut(taskId, { status: 'error', progress: 0, message: 'エラーが発生しました', error: err.message })
    }
  }

  const handleDriveImport = useCallback(
    async (files: DriveFile[]) => {
      if (!user || !profile?.companyId || files.length === 0) return

      const companyId = profile.companyId
      const userId = user.uid
      const currentFolderId = selectedFolderId
      const { addTask } = getTaskActions()

      // UIをすぐに解放（バックグラウンドで処理）
      setUploading(false)
      setError(null)

      // 各ファイルを並列でバックグラウンド処理
      files.forEach((driveFile) => {
        const taskId = `drive-${driveFile.id}-${Date.now()}`

        // タスクを追加
        addTask({
          id: taskId,
          type: 'upload',
          title: driveFile.name,
          status: 'processing',
          progress: 0,
          message: 'ダウンロード準備中...',
        })

        // バックグラウンドで処理開始（awaitしない）
        processDriveImport(
          taskId,
          driveFile,
          userId,
          companyId,
          currentFolderId
        ).then(() => {
          fetchData()
        })
      })
    },
    [user, profile?.companyId, selectedFolderId, fetchData]
  )

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (files.length === 0 || !user || !profile?.companyId) return

      const fileArray = Array.from(files)
      const companyId = profile.companyId
      const userId = user.uid
      const currentFolderId = selectedFolderId
      const { addTask } = getTaskActions()

      // UIをすぐに解放（バックグラウンドで処理）
      setUploading(false)
      setError(null)

      // 各ファイルを並列でバックグラウンド処理
      fileArray.forEach((file) => {
        const taskId = `upload-${Date.now()}-${file.name}`

        // タスクを追加
        addTask({
          id: taskId,
          type: 'upload',
          title: file.name,
          status: 'processing',
          progress: 0,
          message: 'アップロード準備中...',
        })

        // バックグラウンドで処理開始（awaitしない）
        processFileUpload(
          taskId,
          file,
          userId,
          companyId,
          currentFolderId
        ).then(() => {
          // 完了後にデータを更新
          fetchData()
        })
      })
    },
    [user, profile?.companyId, selectedFolderId, fetchData]
  )

  const filteredDocuments = selectedFolderId
    ? documents.filter((d) => d.folderId === selectedFolderId)
    : documents

  // テキストファイルからテキストを抽出
  async function extractTextFromFile(
    apiKey: string,
    fileBuffer: ArrayBuffer,
    mimeType: string,
    fileName: string
  ): Promise<string> {
    try {
      // テキストファイルはそのまま
      if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
        return new TextDecoder().decode(fileBuffer)
      }

      // Gemini APIでテキスト抽出
      const ai = createGeminiClient(apiKey)
      const base64Data = btoa(
        new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              {
                text: `このドキュメント「${fileName}」の全テキスト内容を抽出してください。
フォーマットや構造は保持しつつ、プレーンテキストとして出力してください。
要約や解説は不要です。ドキュメントの内容をそのまま出力してください。`,
              },
            ],
          },
        ],
        config: { temperature: 0, maxOutputTokens: 8000 },
      })

      return response.text || ''
    } catch (error) {
      knowledgeLogger.error('Text extraction error:', error)
      return ''
    }
  }

  return {
    // State
    documents,
    folders,
    stores,
    selectedFolderId,
    setSelectedFolderId,
    loading,
    uploading,
    error,
    processingStatus,
    companyDriveConnection,
    filteredDocuments,

    // Actions
    handleCreateFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleDeleteDocument,
    handleMoveDocument,
    handleDriveImport,
    handleFileUpload,
    fetchData,
  }
}
