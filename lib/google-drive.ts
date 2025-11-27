// Googleドライブ連携ライブラリ

import { getGoogleDriveToken } from './firebase-auth'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

// ドライブファイルの型定義
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  thumbnailLink?: string
  iconLink?: string
  webViewLink?: string
}

// ファイル一覧のレスポンス
interface ListFilesResponse {
  files: DriveFile[]
  nextPageToken?: string
}

// アクセストークンを取得（エラーチェック付き）
function getAccessToken(): string {
  const token = getGoogleDriveToken()
  if (!token) {
    throw new Error('Googleドライブに接続されていません。設定から接続してください。')
  }
  return token
}

// ドライブのファイル一覧を取得
export async function listDriveFiles(
  folderId?: string,
  pageToken?: string
): Promise<ListFilesResponse> {
  const accessToken = getAccessToken()

  // クエリ構築
  let q = 'trashed = false'
  if (folderId) {
    q = `'${folderId}' in parents and ${q}`
  } else {
    q = `'root' in parents and ${q}`
  }

  const params = new URLSearchParams({
    pageSize: '50',
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, iconLink, webViewLink)',
    q,
    orderBy: 'folder,name',
  })

  if (pageToken) {
    params.append('pageToken', pageToken)
  }

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('認証の有効期限が切れました。再度Googleドライブに接続してください。')
    }
    throw new Error('ファイル一覧の取得に失敗しました')
  }

  return response.json()
}

// ファイルをダウンロード
export async function downloadDriveFile(fileId: string): Promise<Blob> {
  const accessToken = getAccessToken()

  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('認証の有効期限が切れました')
    }
    throw new Error('ファイルのダウンロードに失敗しました')
  }

  return response.blob()
}

// Google Docsをエクスポート（PDF/テキストに変換）
export async function exportGoogleDoc(
  fileId: string,
  exportMimeType: 'application/pdf' | 'text/plain' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<Blob> {
  const accessToken = getAccessToken()

  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('認証の有効期限が切れました')
    }
    throw new Error('ファイルのエクスポートに失敗しました')
  }

  return response.blob()
}

// Google Sheetsをエクスポート
export async function exportGoogleSheet(
  fileId: string,
  exportMimeType: 'application/pdf' | 'text/csv' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
): Promise<Blob> {
  const accessToken = getAccessToken()

  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('スプレッドシートのエクスポートに失敗しました')
  }

  return response.blob()
}

// ファイル情報を取得
export async function getDriveFile(fileId: string): Promise<DriveFile> {
  const accessToken = getAccessToken()

  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,webViewLink`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('ファイル情報の取得に失敗しました')
  }

  return response.json()
}

// MIMEタイプからファイル種別を判定
export function getFileType(mimeType: string): 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'image' | 'other' {
  if (mimeType === 'application/vnd.google-apps.folder') return 'folder'
  if (mimeType === 'application/vnd.google-apps.document') return 'document'
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'spreadsheet'
  if (mimeType === 'application/vnd.google-apps.presentation') return 'presentation'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  return 'other'
}

// ファイルアイコンを取得
export function getFileIcon(mimeType: string): string {
  const type = getFileType(mimeType)
  switch (type) {
    case 'folder': return '📁'
    case 'document': return '📝'
    case 'spreadsheet': return '📊'
    case 'presentation': return '📽️'
    case 'pdf': return '📕'
    case 'image': return '🖼️'
    default: return '📄'
  }
}

// ファイルサイズを人間が読みやすい形式に変換
export function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return ''
  const size = parseInt(bytes, 10)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Google形式のファイルをダウンロード可能な形式に変換してダウンロード
export async function downloadGoogleFile(file: DriveFile): Promise<{ blob: Blob; fileName: string }> {
  const fileType = getFileType(file.mimeType)

  let blob: Blob
  let fileName = file.name

  switch (fileType) {
    case 'document':
      blob = await exportGoogleDoc(file.id, 'application/pdf')
      fileName = file.name.replace(/\.[^/.]+$/, '') + '.pdf'
      break
    case 'spreadsheet':
      blob = await exportGoogleSheet(file.id, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      fileName = file.name.replace(/\.[^/.]+$/, '') + '.xlsx'
      break
    case 'presentation':
      blob = await exportGoogleDoc(file.id, 'application/pdf')
      fileName = file.name.replace(/\.[^/.]+$/, '') + '.pdf'
      break
    default:
      blob = await downloadDriveFile(file.id)
  }

  return { blob, fileName }
}
