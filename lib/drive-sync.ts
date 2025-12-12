// Google Drive → Gemini File Search 同期ライブラリ

import {
  createFileSearchStore,
  uploadFile,
  importFileToStore,
  listStores,
} from './gemini-file-search'
import {
  listDriveFiles,
  downloadDriveFile,
  exportGoogleDoc,
  exportGoogleSheet,
  getFileType,
  DriveFile,
} from './google-drive'

// 同期状態の型定義
export interface DriveSyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error'
  lastSyncAt?: Date
  totalFiles: number
  syncedFiles: number
  driveStoreName?: string
  syncedFileIds: string[]
  errorMessage?: string
}

// 対応するMIMEタイプ
const SUPPORTED_MIME_TYPES = [
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
]

// フォルダのMIMEタイプ
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'

// ファイルがサポートされているかチェック
function isSupportedFile(file: DriveFile): boolean {
  return SUPPORTED_MIME_TYPES.includes(file.mimeType)
}

// Driveからファイルを取得してBlobに変換
async function getDriveFileAsBlob(
  accessToken: string,
  file: DriveFile
): Promise<{ blob: Blob; fileName: string; mimeType: string } | null> {
  const fileType = getFileType(file.mimeType)

  try {
    let blob: Blob
    let fileName = file.name
    let mimeType = file.mimeType

    switch (fileType) {
      case 'document':
        // Google DocsはPDFにエクスポート
        blob = await exportGoogleDoc(file.id, 'application/pdf')
        fileName = file.name.replace(/\.[^/.]+$/, '') + '.pdf'
        mimeType = 'application/pdf'
        break
      case 'spreadsheet':
        // Google SheetsはCSVにエクスポート（テキスト検索しやすい）
        blob = await exportGoogleSheet(file.id, 'text/csv')
        fileName = file.name.replace(/\.[^/.]+$/, '') + '.csv'
        mimeType = 'text/csv'
        break
      default:
        // その他はそのままダウンロード
        blob = await downloadDriveFile(file.id)
    }

    return { blob, fileName, mimeType }
  } catch (error) {
    console.error(`Failed to get file ${file.name}:`, error)
    return null
  }
}

// 再帰的にDriveのファイルを取得
async function getAllDriveFiles(
  accessToken: string,
  folderId?: string,
  depth: number = 0,
  maxDepth: number = 5
): Promise<DriveFile[]> {
  if (depth > maxDepth) return []

  const allFiles: DriveFile[] = []

  try {
    let pageToken: string | undefined
    do {
      const result = await listDriveFiles(folderId, pageToken)

      for (const file of result.files) {
        if (file.mimeType === FOLDER_MIME_TYPE) {
          // フォルダの場合は再帰的に取得
          const subFiles = await getAllDriveFiles(accessToken, file.id, depth + 1, maxDepth)
          allFiles.push(...subFiles)
        } else if (isSupportedFile(file)) {
          allFiles.push(file)
        }
      }

      pageToken = result.nextPageToken
    } while (pageToken)
  } catch (error) {
    console.error('Error listing drive files:', error)
  }

  return allFiles
}

// 同期のメイン処理
export async function syncDriveToFileSearch(
  geminiApiKey: string,
  driveAccessToken: string,
  companyId: string,
  existingStoreName?: string,
  existingSyncedFileIds: string[] = [],
  onProgress?: (status: Partial<DriveSyncStatus>) => void
): Promise<DriveSyncStatus> {
  const result: DriveSyncStatus = {
    status: 'syncing',
    totalFiles: 0,
    syncedFiles: 0,
    syncedFileIds: [...existingSyncedFileIds],
  }

  try {
    onProgress?.({ status: 'syncing' })

    // 1. Driveのファイル一覧を取得
    console.log('[Drive Sync] Fetching drive files...')
    const driveFiles = await getAllDriveFiles(driveAccessToken)
    result.totalFiles = driveFiles.length
    console.log(`[Drive Sync] Found ${driveFiles.length} files`)

    if (driveFiles.length === 0) {
      result.status = 'completed'
      result.lastSyncAt = new Date()
      return result
    }

    // 2. 新規ファイルをフィルタリング
    const newFiles = driveFiles.filter(f => !existingSyncedFileIds.includes(f.id))
    console.log(`[Drive Sync] ${newFiles.length} new files to sync`)

    if (newFiles.length === 0) {
      result.status = 'completed'
      result.lastSyncAt = new Date()
      result.syncedFiles = existingSyncedFileIds.length
      return result
    }

    // 3. Store名を決定（既存または新規作成）
    let storeName = existingStoreName

    if (!storeName) {
      // 新規ストアを作成
      const storeDisplayName = `drive-${companyId}-${Date.now()}`
      console.log(`[Drive Sync] Creating new store: ${storeDisplayName}`)
      const storeResult = await createFileSearchStore(geminiApiKey, storeDisplayName)

      if (storeResult.error) {
        throw new Error(`Failed to create store: ${storeResult.error}`)
      }
      storeName = storeResult.storeName
    }

    result.driveStoreName = storeName
    onProgress?.({ driveStoreName: storeName })

    // 4. ファイルをインポート
    let syncedCount = existingSyncedFileIds.length
    const batchSize = 5 // 同時処理数

    for (let i = 0; i < newFiles.length; i += batchSize) {
      const batch = newFiles.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (file) => {
          try {
            // ファイルを取得
            const fileData = await getDriveFileAsBlob(driveAccessToken, file)
            if (!fileData) return

            // Geminiにアップロード
            const arrayBuffer = await fileData.blob.arrayBuffer()
            const uploadResult = await uploadFile(
              geminiApiKey,
              new Uint8Array(arrayBuffer),
              fileData.fileName,
              fileData.mimeType
            )

            if (uploadResult.error) {
              console.error(`Failed to upload ${file.name}:`, uploadResult.error)
              return
            }

            // Storeにインポート
            const importResult = await importFileToStore(
              geminiApiKey,
              storeName!,
              uploadResult.fileName
            )

            if (importResult.error) {
              console.error(`Failed to import ${file.name}:`, importResult.error)
              return
            }

            // 成功
            result.syncedFileIds.push(file.id)
            syncedCount++
            console.log(`[Drive Sync] Synced: ${file.name} (${syncedCount}/${result.totalFiles})`)
          } catch (error) {
            console.error(`Error syncing file ${file.name}:`, error)
          }
        })
      )

      result.syncedFiles = syncedCount
      onProgress?.({ syncedFiles: syncedCount, totalFiles: result.totalFiles })
    }

    result.status = 'completed'
    result.lastSyncAt = new Date()
    result.syncedFiles = syncedCount

    console.log(`[Drive Sync] Completed! ${syncedCount} files synced`)
    return result
  } catch (error: any) {
    console.error('[Drive Sync] Error:', error)
    result.status = 'error'
    result.errorMessage = error.message
    return result
  }
}

// 同期状態をチェック（差分確認）
export async function checkSyncStatus(
  driveAccessToken: string,
  existingSyncedFileIds: string[]
): Promise<{
  needsSync: boolean
  newFilesCount: number
  deletedFilesCount: number
}> {
  try {
    const driveFiles = await getAllDriveFiles(driveAccessToken)
    const currentFileIds = driveFiles.map(f => f.id)

    const newFiles = currentFileIds.filter(id => !existingSyncedFileIds.includes(id))
    const deletedFiles = existingSyncedFileIds.filter(id => !currentFileIds.includes(id))

    return {
      needsSync: newFiles.length > 0 || deletedFiles.length > 0,
      newFilesCount: newFiles.length,
      deletedFilesCount: deletedFiles.length,
    }
  } catch (error) {
    console.error('Error checking sync status:', error)
    return { needsSync: false, newFilesCount: 0, deletedFilesCount: 0 }
  }
}
