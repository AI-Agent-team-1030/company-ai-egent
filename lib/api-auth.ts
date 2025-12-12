import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from './supabase-server'

export interface AuthResult {
  authorized: boolean
  userId?: string
  error?: NextResponse
}

/**
 * API認証チェック
 * 認証が必要なAPIエンドポイントで使用
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const { user, error } = await getUserFromRequest(request)

  if (error || !user) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      ),
    }
  }

  return {
    authorized: true,
    userId: user.id,
  }
}

/**
 * 認証ヘッダーの検証のみ（Supabase未使用の場合）
 */
export function requireBearerToken(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      ),
    }
  }

  return {
    authorized: true,
  }
}
