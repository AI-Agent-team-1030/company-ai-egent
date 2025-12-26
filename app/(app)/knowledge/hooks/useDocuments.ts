/**
 * ドキュメント管理フック
 *
 * ドキュメントとフォルダの CRUD 操作、ファイルアップロード処理を担当
 */

import { useState, useEffect, useCallback } from 'react'
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
  getCompanyDriveConnection,
  CompanyDriveConnection,
} from '@/lib/firestore-chat'
import {
  createFileSearchStore,
  uploadFile,
  importFileToStore,
  deleteFile as deleteGeminiFile,
} from '@/lib/gemini-file-search'
import { BUILT_IN_GEMINI_API_KEY } from '@/lib/ai-providers'
import { knowledgeLogger } from '@/lib/logger'
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

  const handleDeleteDocument = useCallback(async (docId: string, geminiFileName?: string) => {
    if (!confirm('このドキュメントを削除しますか？')) return false

    try {
      const apiKey = BUILT_IN_GEMINI_API_KEY
      if (geminiFileName && apiKey) {
        await deleteGeminiFile(apiKey, geminiFileName).catch(() => {})
      }
      await deleteDocument(docId)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
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

  const handleDriveImport = useCallback(
    async (files: DriveFile[]) => {
      if (!user || !profile?.companyId || files.length === 0) return

      setUploading(true)
      setError(null)

      for (const driveFile of files) {
        const tempId = `drive-${driveFile.id}-${Date.now()}`

        updateProcessingStatus(tempId, 'uploading', `${driveFile.name} をダウンロード中...`, 10)

        try {
          const apiKey = BUILT_IN_GEMINI_API_KEY
          if (!apiKey) throw new Error('Gemini APIキーが設定されていません')

          updateProcessingStatus(
            tempId,
            'processing',
            `${driveFile.name} をダウンロード中...`,
            20
          )
          const { blob, fileName } = await downloadGoogleFile(driveFile)

          let storeName = await getOrCreateStore()
          if (!storeName) throw new Error('ストアの作成に失敗しました')

          updateProcessingStatus(
            tempId,
            'processing',
            `${fileName} をGemini AIにアップロード中...`,
            50
          )
          const fileBuffer = await blob.arrayBuffer()
          const uploadResult = await uploadFile(
            apiKey,
            new Uint8Array(fileBuffer),
            fileName,
            blob.type || 'application/octet-stream'
          )
          if (uploadResult.error) throw new Error(uploadResult.error)

          updateProcessingStatus(tempId, 'processing', 'インデックス作成中...', 70)
          const importResult = await importFileToStore(apiKey, storeName, uploadResult.fileName)
          if (importResult.error) throw new Error(importResult.error)

          updateProcessingStatus(tempId, 'processing', '保存中...', 90)
          await saveUploadedDocument(
            user.uid,
            profile.companyId,
            fileName,
            driveFile.name,
            uploadResult.fileName,
            storeName,
            selectedFolderId
          )

          updateProcessingStatus(tempId, 'completed', `${driveFile.name} 完了！`, 100)
          clearProcessingStatus(tempId)
        } catch (err: any) {
          setError(err.message)
          updateProcessingStatus(tempId, 'error', `エラー: ${err.message}`, 0)
          clearProcessingStatus(tempId, 5000)
        }
      }

      await fetchData()
      setUploading(false)
    },
    [
      user,
      profile?.companyId,
      selectedFolderId,
      getOrCreateStore,
      updateProcessingStatus,
      clearProcessingStatus,
      fetchData,
    ]
  )

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (files.length === 0 || !user || !profile?.companyId) return

      const fileArray = Array.from(files)
      setUploading(true)
      setError(null)

      const storeName = await getOrCreateStore()
      if (!storeName) {
        setUploading(false)
        return
      }

      const apiKey = BUILT_IN_GEMINI_API_KEY
      if (!apiKey) {
        setError('Gemini APIキーが設定されていません')
        setUploading(false)
        return
      }

      for (const file of fileArray) {
        const tempId = `temp-${Date.now()}-${file.name}`

        updateProcessingStatus(tempId, 'uploading', `${file.name} をアップロード中...`, 20)

        try {
          updateProcessingStatus(
            tempId,
            'processing',
            `${file.name} をGemini AIにアップロード中...`,
            50
          )
          const fileBuffer = await file.arrayBuffer()
          const uploadResult = await uploadFile(
            apiKey,
            new Uint8Array(fileBuffer),
            file.name,
            file.type
          )
          if (uploadResult.error) throw new Error(uploadResult.error)

          updateProcessingStatus(
            tempId,
            'processing',
            `${file.name} のインデックス作成中...`,
            70
          )
          const importResult = await importFileToStore(apiKey, storeName, uploadResult.fileName)
          if (importResult.error) throw new Error(importResult.error)

          updateProcessingStatus(tempId, 'processing', `${file.name} を保存中...`, 90)
          await saveUploadedDocument(
            user.uid,
            profile.companyId,
            file.name,
            file.name,
            uploadResult.fileName,
            storeName,
            selectedFolderId
          )

          updateProcessingStatus(tempId, 'completed', `${file.name} 完了！`, 100)
          clearProcessingStatus(tempId)
        } catch (err: any) {
          setError(err.message)
          updateProcessingStatus(tempId, 'error', `${file.name}: ${err.message}`, 0)
          clearProcessingStatus(tempId, 5000)
        }
      }

      await fetchData()
      setUploading(false)
    },
    [
      user,
      profile?.companyId,
      selectedFolderId,
      getOrCreateStore,
      updateProcessingStatus,
      clearProcessingStatus,
      fetchData,
    ]
  )

  const filteredDocuments = selectedFolderId
    ? documents.filter((d) => d.folderId === selectedFolderId)
    : documents

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
    handleDriveImport,
    handleFileUpload,
    fetchData,
  }
}
