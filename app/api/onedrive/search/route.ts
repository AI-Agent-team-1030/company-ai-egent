/**
 * OneDrive検索API
 * Microsoft Graph APIを使用してOneDrive内のファイルを検索
 */

import { NextRequest, NextResponse } from 'next/server'

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0'

interface OnedriveFile {
  id: string
  name: string
  webUrl: string
  file?: {
    mimeType: string
  }
  lastModifiedDateTime: string
  size: number
}

interface SearchResponse {
  value: OnedriveFile[]
}

// OneDrive内のファイルを検索
async function searchOnedriveFiles(
  accessToken: string,
  query: string
): Promise<{ files: OnedriveFile[]; error: string | null }> {
  try {
    // Microsoft Graph Search API
    const response = await fetch(
      `${GRAPH_API_BASE}/me/drive/root/search(q='${encodeURIComponent(query)}')`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[OneDrive Search] API error:', response.status, errorData)
      return { files: [], error: `OneDrive API error: ${response.status}` }
    }

    const data: SearchResponse = await response.json()

    // ファイルのみをフィルタリング（フォルダは除外）
    const files = data.value.filter(item => item.file)

    return { files, error: null }
  } catch (error) {
    console.error('[OneDrive Search] Error:', error)
    return { files: [], error: 'OneDrive検索中にエラーが発生しました' }
  }
}

// ファイル内容を取得
async function getFileContent(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  try {
    // テキスト系ファイルのみ内容を取得
    const textMimeTypes = [
      'text/plain',
      'text/csv',
      'text/html',
      'text/markdown',
      'application/json',
    ]

    // Officeドキュメント系
    const officeMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/msword', // .doc
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-powerpoint', // .ppt
    ]

    if (textMimeTypes.includes(mimeType)) {
      // テキストファイルはそのままダウンロード
      const response = await fetch(
        `${GRAPH_API_BASE}/me/drive/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const text = await response.text()
        return text.slice(0, 5000) // 最初の5000文字
      }
    } else if (officeMimeTypes.includes(mimeType)) {
      // Officeドキュメントはプレビュー用テキストを取得
      // Microsoft Graph APIではプレーンテキスト変換が制限されているため、
      // ファイル名と基本情報を返す
      return `[Officeドキュメント: 検索にヒットしました]`
    } else if (mimeType === 'application/pdf') {
      // PDFもプレビューのみ
      return `[PDFファイル: 検索にヒットしました]`
    }

    return ''
  } catch (error) {
    console.error('[OneDrive] Error getting file content:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, query } = body

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

    // ファイル検索
    const { files, error } = await searchOnedriveFiles(accessToken, query)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    // 上位10件を処理
    const topFiles = files.slice(0, 10)

    // 各ファイルの内容を取得
    const results = await Promise.all(
      topFiles.map(async (file) => {
        const mimeType = file.file?.mimeType || ''
        const content = await getFileContent(accessToken, file.id, mimeType)

        return {
          id: file.id,
          name: file.name,
          mimeType,
          webViewLink: file.webUrl,
          content,
          lastModified: file.lastModifiedDateTime,
        }
      })
    )

    // 内容があるファイルのみ返す
    const relevantResults = results.filter(r => r.content)

    return NextResponse.json({
      results: relevantResults,
      totalFound: files.length,
    })
  } catch (error) {
    console.error('[OneDrive Search API] Error:', error)
    return NextResponse.json(
      { error: 'OneDrive検索中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
