import { NextRequest, NextResponse } from 'next/server'
import { syncDriveToFileSearch, checkSyncStatus } from '@/lib/drive-sync'
import {
  getCompanyDriveConnection,
  getCompanyDriveSyncStatus,
  updateCompanyDriveSyncStatus,
  saveFileSearchStore,
} from '@/lib/firestore-chat'
import { BUILT_IN_GEMINI_API_KEY } from '@/lib/ai-providers'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5分のタイムアウト

// POST: Drive同期を開始
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, userId, accessToken: requestAccessToken } = body

    console.log('[Drive Sync API] Request:', { companyId, userId, hasToken: !!requestAccessToken })

    if (!companyId) {
      console.log('[Drive Sync API] Error: companyId is missing')
      return NextResponse.json(
        { error: 'companyIdが必要です' },
        { status: 400 }
      )
    }

    // accessTokenはリクエストから取得、なければFirestoreから取得
    let accessToken = requestAccessToken
    if (!accessToken) {
      const driveConnection = await getCompanyDriveConnection(companyId)
      console.log('[Drive Sync API] Drive connection from Firestore:', {
        isConnected: driveConnection?.isConnected,
        hasAccessToken: !!driveConnection?.accessToken,
      })
      accessToken = driveConnection?.accessToken
    }

    if (!accessToken) {
      console.log('[Drive Sync API] Error: No access token available')
      return NextResponse.json(
        { error: 'Googleドライブに接続されていません。接続してください。' },
        { status: 400 }
      )
    }

    // 現在の同期状態を取得
    const currentSyncStatus = await getCompanyDriveSyncStatus(companyId)

    // 既に同期中の場合はスキップ
    if (currentSyncStatus?.status === 'syncing') {
      return NextResponse.json({
        message: '同期中です',
        status: currentSyncStatus,
      })
    }

    // 同期開始を記録
    await updateCompanyDriveSyncStatus(companyId, {
      status: 'syncing',
      totalFiles: 0,
      syncedFiles: 0,
    })

    // 同期実行
    const result = await syncDriveToFileSearch(
      BUILT_IN_GEMINI_API_KEY,
      accessToken,
      companyId,
      currentSyncStatus?.driveStoreName,
      currentSyncStatus?.syncedFileIds || [],
      async (progressStatus) => {
        // 進捗をFirestoreに保存
        await updateCompanyDriveSyncStatus(companyId, progressStatus)
      }
    )

    // 結果を保存
    await updateCompanyDriveSyncStatus(companyId, {
      status: result.status,
      totalFiles: result.totalFiles,
      syncedFiles: result.syncedFiles,
      driveStoreName: result.driveStoreName,
      syncedFileIds: result.syncedFileIds,
      lastSyncAt: result.lastSyncAt,
      errorMessage: result.errorMessage,
    })

    // 新しいStoreが作成された場合、fileSearchStoresにも保存
    if (result.driveStoreName && !currentSyncStatus?.driveStoreName && userId) {
      await saveFileSearchStore(
        userId,
        companyId,
        result.driveStoreName,
        `Googleドライブ（自動同期）`
      )
    }

    return NextResponse.json({
      success: true,
      status: result,
    })
  } catch (error: any) {
    console.error('Drive sync error:', error)

    // エラー状態を保存
    try {
      const body = await request.json().catch(() => ({}))
      if (body.companyId) {
        await updateCompanyDriveSyncStatus(body.companyId, {
          status: 'error',
          errorMessage: error.message,
        })
      }
    } catch {}

    return NextResponse.json(
      { error: error.message || 'ドライブ同期に失敗しました' },
      { status: 500 }
    )
  }
}

// GET: 同期状態を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyIdが必要です' },
        { status: 400 }
      )
    }

    const syncStatus = await getCompanyDriveSyncStatus(companyId)

    // 差分チェックが必要な場合
    const checkDiff = searchParams.get('checkDiff') === 'true'
    if (checkDiff && syncStatus?.syncedFileIds) {
      const driveConnection = await getCompanyDriveConnection(companyId)
      if (driveConnection?.accessToken) {
        const diffStatus = await checkSyncStatus(
          driveConnection.accessToken,
          syncStatus.syncedFileIds
        )
        return NextResponse.json({
          syncStatus,
          diffStatus,
        })
      }
    }

    return NextResponse.json({
      syncStatus: syncStatus || {
        status: 'idle',
        totalFiles: 0,
        syncedFiles: 0,
        syncedFileIds: [],
      },
    })
  } catch (error: any) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: error.message || '同期状態の取得に失敗しました' },
      { status: 500 }
    )
  }
}
