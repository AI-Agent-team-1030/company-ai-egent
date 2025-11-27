import { NextRequest, NextResponse } from 'next/server'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

// Driveでファイルを検索
async function searchDriveFiles(accessToken: string, query: string, folderId?: string) {
  // 検索クエリを構築
  let q = `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`

  // 特定のフォルダに限定する場合
  if (folderId) {
    q = `'${folderId}' in parents and ${q}`
  }

  // 対応するMIMEタイプのみ検索
  const supportedTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  const params = new URLSearchParams({
    pageSize: '10',
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
    q,
    orderBy: 'modifiedTime desc',
  })

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || 'ドライブ検索に失敗しました')
  }

  return response.json()
}

// Google Docsの内容を取得
async function getDocContent(accessToken: string, fileId: string, mimeType: string): Promise<string> {
  let content = ''

  try {
    if (mimeType === 'application/vnd.google-apps.document') {
      // Google Docsはtext/plainにエクスポート
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=text/plain`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      if (response.ok) {
        content = await response.text()
      }
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      // Google Sheetsはtext/csvにエクスポート
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=text/csv`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      if (response.ok) {
        content = await response.text()
      }
    } else if (mimeType === 'text/plain') {
      // テキストファイルはそのままダウンロード
      const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
      if (response.ok) {
        content = await response.text()
      }
    }
  } catch (error) {
    console.error('Error getting doc content:', error)
  }

  // 最初の5000文字のみ返す（トークン制限のため）
  return content.slice(0, 5000)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, query, folderId } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'アクセストークンが必要です' },
        { status: 400 }
      )
    }

    if (!query) {
      return NextResponse.json(
        { error: '検索クエリが必要です' },
        { status: 400 }
      )
    }

    // Driveでファイルを検索
    const searchResult = await searchDriveFiles(accessToken, query, folderId)

    // 各ファイルの内容を取得
    const resultsWithContent = await Promise.all(
      (searchResult.files || []).slice(0, 5).map(async (file: any) => {
        const content = await getDocContent(accessToken, file.id, file.mimeType)
        return {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          content,
        }
      })
    )

    // コンテンツがあるファイルのみフィルタリング
    const relevantResults = resultsWithContent.filter(r => r.content.length > 0)

    return NextResponse.json({
      results: relevantResults,
      totalFound: searchResult.files?.length || 0,
    })
  } catch (error: any) {
    console.error('Drive search error:', error)
    return NextResponse.json(
      { error: error.message || 'ドライブ検索に失敗しました' },
      { status: 500 }
    )
  }
}
