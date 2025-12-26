/**
 * Firebase API認証ユーティリティ
 *
 * API Routesで使用するFirebase Admin認証を提供
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { db } from './firebase-admin'
import type { AuthResult } from './types/api'
import { apiLogger } from './logger'

/**
 * Bearerトークンを抽出
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.replace('Bearer ', '')
}

/**
 * Firebase認証を必須とするAPI用
 *
 * トークンを検証し、ユーザー情報とcompanyIdを返す
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = await requireFirebaseAuth(request)
 *   if (!auth.authorized) return auth.error
 *
 *   const { userId, companyId } = auth
 *   // ...
 * }
 * ```
 */
export async function requireFirebaseAuth(request: NextRequest): Promise<AuthResult> {
  const token = extractBearerToken(request)

  if (!token) {
    apiLogger.warn('Missing or invalid Authorization header')
    return {
      authorized: false,
      error: NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      ),
    }
  }

  try {
    // Firebase Admin SDKでトークンを検証
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid
    const email = decodedToken.email

    // Firestoreからプロフィールを取得してcompanyIdを取得
    let companyId: string | undefined

    try {
      const profileDoc = await db.collection('profiles').doc(userId).get()
      if (profileDoc.exists) {
        const profileData = profileDoc.data()
        companyId = profileData?.companyId
      }
    } catch (profileError) {
      apiLogger.warn('Failed to fetch profile for user:', userId, profileError)
      // プロフィール取得失敗は認証失敗とはしない
    }

    apiLogger.debug('Auth successful:', { userId, companyId, email })

    return {
      authorized: true,
      userId,
      companyId,
      email,
    }
  } catch (error) {
    apiLogger.warn('Token verification failed:', error)
    return {
      authorized: false,
      error: NextResponse.json(
        { error: '無効なトークンです' },
        { status: 401 }
      ),
    }
  }
}

/**
 * オプショナルな認証（認証なしでもアクセス可能）
 *
 * トークンがあれば検証し、なくてもエラーにしない
 */
export async function optionalFirebaseAuth(request: NextRequest): Promise<AuthResult> {
  const token = extractBearerToken(request)

  if (!token) {
    return { authorized: false }
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token)
    const userId = decodedToken.uid

    let companyId: string | undefined
    try {
      const profileDoc = await db.collection('profiles').doc(userId).get()
      if (profileDoc.exists) {
        companyId = profileDoc.data()?.companyId
      }
    } catch {
      // ignore
    }

    return {
      authorized: true,
      userId,
      companyId,
      email: decodedToken.email,
    }
  } catch {
    return { authorized: false }
  }
}

/**
 * companyIdを必須とする認証
 *
 * ユーザー認証に加えて、companyIdの存在も検証
 */
export async function requireCompanyAuth(request: NextRequest): Promise<AuthResult> {
  const auth = await requireFirebaseAuth(request)

  if (!auth.authorized) {
    return auth
  }

  if (!auth.companyId) {
    apiLogger.warn('User has no companyId:', auth.userId)
    return {
      authorized: false,
      error: NextResponse.json(
        { error: '企業情報が設定されていません' },
        { status: 403 }
      ),
    }
  }

  return auth
}

/**
 * 標準的なエラーレスポンスを生成
 */
export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * 標準的な成功レスポンスを生成
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * ページネーション付きレスポンスを生成
 */
export function createPaginatedResponse<T>(
  data: T[],
  count: number,
  limit: number,
  offset: number
): NextResponse {
  return NextResponse.json({
    data,
    count,
    limit,
    offset,
  })
}
