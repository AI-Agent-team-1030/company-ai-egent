/**
 * ナレッジインデックスAPI
 *
 * ドキュメントをFirestore Vector Searchにインデックス
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  indexDocument,
  deleteDocumentIndex,
  getIndexedDocumentCount,
  getTotalChunkCount,
} from '@/lib/firestore-vector-search'
import { geminiLogger } from '@/lib/logger'

// ドキュメントをインデックス
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      documentId,
      documentTitle,
      content,
      companyId,
      folderId,
      chunkSize,
      chunkOverlap,
    } = body

    if (!documentId || !documentTitle || !content || !companyId) {
      return NextResponse.json(
        { error: 'documentId, documentTitle, content, and companyId are required' },
        { status: 400 }
      )
    }

    geminiLogger.debug(`[Index API] Indexing: ${documentTitle}`)

    const result = await indexDocument(
      documentId,
      documentTitle,
      content,
      companyId,
      undefined, // APIキーは環境変数から取得
      {
        folderId,
        chunkSize,
        chunkOverlap,
      }
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documentId,
      chunkCount: result.chunkCount,
    })
  } catch (error: any) {
    geminiLogger.error('[Index API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// インデックスを削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      )
    }

    geminiLogger.debug(`[Index API] Deleting: ${documentId}`)

    const result = await deleteDocumentIndex(documentId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documentId,
    })
  } catch (error: any) {
    geminiLogger.error('[Index API] Delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// インデックス状況を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      )
    }

    const [documentCount, chunkCount] = await Promise.all([
      getIndexedDocumentCount(companyId),
      getTotalChunkCount(companyId),
    ])

    return NextResponse.json({
      companyId,
      indexedDocuments: documentCount,
      totalChunks: chunkCount,
    })
  } catch (error: any) {
    geminiLogger.error('[Index API] Get error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
