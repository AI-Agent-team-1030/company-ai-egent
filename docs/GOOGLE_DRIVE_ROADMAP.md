# Googleドライブ連携ロードマップ

Firebase Google認証を使用してGoogleドライブと連携するための実装ガイド。

## 概要

ユーザーがGoogleアカウントでログインすると、そのユーザーのGoogleドライブにアクセスできるようにする。
これにより、ドライブ内のドキュメントを直接ナレッジベースにインポートできる。

## 前提条件

- Firebase Authentication（設定済み）
- Google Cloud Consoleへのアクセス
- Googleドライブに保存されたドキュメント

---

## Phase 1: Google Cloud Console設定

### 1.1 Google Drive APIを有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Firebaseと同じプロジェクトを選択
3. 「APIとサービス」→「ライブラリ」
4. 「Google Drive API」を検索して有効化

### 1.2 OAuth同意画面の設定

1. 「APIとサービス」→「OAuth同意画面」
2. 以下のスコープを追加：
   - `https://www.googleapis.com/auth/drive.readonly`（読み取り専用）
   - または `https://www.googleapis.com/auth/drive.file`（アプリが作成したファイルのみ）

### 1.3 OAuth クライアントIDの確認

1. 「APIとサービス」→「認証情報」
2. FirebaseのWebクライアントIDを確認（Firebase Consoleでも確認可能）

---

## Phase 2: Firebase認証にGoogleプロバイダー追加

### 2.1 Firebase ConsoleでGoogle認証を有効化

1. Firebase Console → Authentication → Sign-in method
2. 「Google」を有効化
3. プロジェクトのサポートメールを設定

### 2.2 コード実装（AuthContext.tsx）

```typescript
// contexts/AuthContext.tsx に追加

import {
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup
} from 'firebase/auth'

// Googleプロバイダー（Driveスコープ付き）
const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly')

// Google認証でサインイン
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken // ← これがDrive APIに必要

    // アクセストークンを保存（セッション中のみ）
    if (accessToken) {
      sessionStorage.setItem('google_access_token', accessToken)
    }

    return { data: result, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// 既存ユーザーにGoogle連携を追加
const linkGoogleAccount = async () => {
  if (!auth.currentUser) return { error: 'Not logged in' }

  try {
    const result = await linkWithPopup(auth.currentUser, googleProvider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken

    if (accessToken) {
      sessionStorage.setItem('google_access_token', accessToken)
    }

    return { data: result, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
```

---

## Phase 3: Googleドライブ連携ライブラリ作成

### 3.1 lib/google-drive.ts

```typescript
// lib/google-drive.ts

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

// アクセストークンを取得
export function getGoogleAccessToken(): string | null {
  return sessionStorage.getItem('google_access_token')
}

// ドライブのファイル一覧を取得
export async function listDriveFiles(
  folderId?: string,
  pageToken?: string
): Promise<{
  files: DriveFile[]
  nextPageToken?: string
}> {
  const accessToken = getGoogleAccessToken()
  if (!accessToken) throw new Error('Google認証が必要です')

  const params = new URLSearchParams({
    pageSize: '50',
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink)',
    q: folderId
      ? `'${folderId}' in parents and trashed = false`
      : `'root' in parents and trashed = false`,
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
      sessionStorage.removeItem('google_access_token')
      throw new Error('認証の有効期限が切れました。再度ログインしてください')
    }
    throw new Error('ファイル一覧の取得に失敗しました')
  }

  return response.json()
}

// ファイルをダウンロード
export async function downloadDriveFile(fileId: string): Promise<Blob> {
  const accessToken = getGoogleAccessToken()
  if (!accessToken) throw new Error('Google認証が必要です')

  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('ファイルのダウンロードに失敗しました')
  }

  return response.blob()
}

// Google Docsをエクスポート（PDF/テキストに変換）
export async function exportGoogleDoc(
  fileId: string,
  mimeType: 'application/pdf' | 'text/plain'
): Promise<Blob> {
  const accessToken = getGoogleAccessToken()
  if (!accessToken) throw new Error('Google認証が必要です')

  const response = await fetch(
    `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('ファイルのエクスポートに失敗しました')
  }

  return response.blob()
}

// 型定義
export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  thumbnailLink?: string
}
```

---

## Phase 4: UI実装

### 4.1 Googleドライブファイルピッカー

```typescript
// components/GoogleDrivePicker.tsx

'use client'

import { useState, useEffect } from 'react'
import { listDriveFiles, DriveFile } from '@/lib/google-drive'

interface Props {
  onSelect: (files: DriveFile[]) => void
  onClose: () => void
}

export default function GoogleDrivePicker({ onSelect, onClose }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [currentFolder])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const result = await listDriveFiles(currentFolder || undefined)
      setFiles(result.files)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      // フォルダに入る
      setFolderStack([...folderStack, { id: file.id, name: file.name }])
      setCurrentFolder(file.id)
    } else {
      // ファイルを選択/解除
      const newSelected = new Set(selectedFiles)
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id)
      } else {
        newSelected.add(file.id)
      }
      setSelectedFiles(newSelected)
    }
  }

  const handleBack = () => {
    const newStack = [...folderStack]
    newStack.pop()
    setFolderStack(newStack)
    setCurrentFolder(newStack.length > 0 ? newStack[newStack.length - 1].id : null)
  }

  const handleConfirm = () => {
    const selected = files.filter(f => selectedFiles.has(f.id))
    onSelect(selected)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            {folderStack.length > 0 && (
              <button onClick={handleBack} className="p-1 hover:bg-gray-100 rounded">
                ← 戻る
              </button>
            )}
            <h2 className="font-bold">
              {folderStack.length > 0 ? folderStack[folderStack.length - 1].name : 'マイドライブ'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* ファイル一覧 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ファイルがありません</div>
          ) : (
            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 ${
                    selectedFiles.has(file.id) ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">
                    {file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄'}
                  </span>
                  <span className="flex-1 truncate">{file.name}</span>
                  {selectedFiles.has(file.id) && <span className="text-blue-600">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t flex justify-between">
          <span className="text-sm text-gray-500">
            {selectedFiles.size}件選択中
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.size === 0}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300"
            >
              インポート
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 5: ナレッジベースとの統合

### 5.1 ドライブからナレッジにインポート

```typescript
// ナレッジページでの使用例

import { downloadDriveFile, exportGoogleDoc, DriveFile } from '@/lib/google-drive'
import { uploadToGeminiFileSearch } from '@/lib/gemini-file-search'

const handleImportFromDrive = async (files: DriveFile[]) => {
  for (const file of files) {
    let blob: Blob

    // Google DocsはPDFにエクスポート
    if (file.mimeType.startsWith('application/vnd.google-apps.')) {
      blob = await exportGoogleDoc(file.id, 'application/pdf')
    } else {
      blob = await downloadDriveFile(file.id)
    }

    // Gemini File Searchにアップロード
    const fileObj = new File([blob], file.name, { type: blob.type })
    await uploadToGeminiFileSearch(fileObj, companyId, userId)
  }
}
```

---

## 実装順序（推奨）

| 順序 | タスク | 難易度 | 所要時間 |
|------|--------|--------|----------|
| 1 | Google Cloud ConsoleでDrive API有効化 | 簡単 | 10分 |
| 2 | Firebase ConsoleでGoogle認証有効化 | 簡単 | 5分 |
| 3 | AuthContextにGoogle認証追加 | 中 | 30分 |
| 4 | google-drive.ts作成 | 中 | 1時間 |
| 5 | GoogleDrivePicker UI作成 | 中 | 1-2時間 |
| 6 | ナレッジページに統合 | 中 | 1時間 |
| 7 | テスト・デバッグ | - | 1-2時間 |

---

## 注意点

### セキュリティ
- アクセストークンは`sessionStorage`に保存（タブを閉じると消える）
- `localStorage`には保存しない（XSSリスク）

### トークンの有効期限
- Googleのアクセストークンは約1時間で期限切れ
- 期限切れ時は再度Google認証が必要
- リフレッシュトークンを使う場合はサーバーサイド実装が必要

### 対応ファイル形式
| Google形式 | 変換先 |
|------------|--------|
| Google Docs | PDF/テキスト |
| Google Sheets | Excel/CSV |
| Google Slides | PDF |
| その他 | そのままダウンロード |

### スコープの選択
- `drive.readonly`: 全ファイル読み取り（ユーザー許可が必要）
- `drive.file`: アプリが作成したファイルのみ（制限的）
- 推奨: `drive.readonly`（ユーザーが任意のファイルを選べる）

---

## 次のステップ

1. まずPhase 1-2を完了（Google Cloud + Firebase設定）
2. 設定が完了したら連絡ください
3. コード実装（Phase 3-5）を進めます
