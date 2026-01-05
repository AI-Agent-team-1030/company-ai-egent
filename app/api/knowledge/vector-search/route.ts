/**
 * ベクトル検索 API Route
 *
 * クライアントからFirestore Vector Searchを利用するためのエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server'
import { advancedVectorSearch, getIndexedDocumentCount } from '@/lib/firestore-vector-search'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, query, queries, companyId, apiKey, options } = body

    if (action === 'count') {
      // ドキュメント数取得
      if (!companyId) {
        return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
      }
      const count = await getIndexedDocumentCount(companyId)
      return NextResponse.json({ count })
    }

    if (action === 'search') {
      // ベクトル検索
      if (!query || !queries || !companyId) {
        return NextResponse.json(
          { error: 'query, queries, and companyId are required' },
          { status: 400 }
        )
      }

      const result = await advancedVectorSearch(query, queries, apiKey, {
        companyId,
        ...options,
      })

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[Vector Search API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
