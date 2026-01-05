/**
 * ドキュメントチャンク取得API
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDocumentChunks } from '@/lib/firestore-vector-search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      )
    }

    const { chunks, error } = await getDocumentChunks(documentId)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ chunks })
  } catch (error: any) {
    console.error('Chunks API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chunks' },
      { status: 500 }
    )
  }
}
