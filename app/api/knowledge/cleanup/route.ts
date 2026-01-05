/**
 * 孤立チャンククリーンアップAPI
 *
 * 親ドキュメントが削除されたチャンクを検出・削除
 */

import { NextRequest, NextResponse } from 'next/server'
import { cleanupOrphanedChunks } from '@/lib/firestore-vector-search'
import { geminiLogger } from '@/lib/logger'

// 孤立チャンクをクリーンアップ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { companyId } = body

    geminiLogger.debug(`[Cleanup API] Starting cleanup${companyId ? ` for company: ${companyId}` : ''}`)

    const result = await cleanupOrphanedChunks(companyId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: result.deletedCount > 0
        ? `${result.deletedCount}件の孤立ドキュメントのチャンクを削除しました`
        : '孤立チャンクはありませんでした',
    })
  } catch (error: any) {
    geminiLogger.error('[Cleanup API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
