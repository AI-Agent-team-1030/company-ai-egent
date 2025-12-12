import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// インメモリストア（本番ではRedis推奨）
const rateLimitStore = new Map<string, RateLimitEntry>()

// 定期的にクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  })
}, 60000) // 1分ごと

interface RateLimitOptions {
  limit?: number      // リクエスト数上限
  windowMs?: number   // 時間枠（ミリ秒）
}

/**
 * Rate Limitingチェック
 */
export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): { allowed: boolean; error?: NextResponse } {
  const { limit = 60, windowMs = 60000 } = options // デフォルト: 60リクエスト/分

  // IPアドレス取得
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    // 新しいエントリ作成
    entry = { count: 1, resetTime: now + windowMs }
    rateLimitStore.set(key, entry)
    return { allowed: true }
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'リクエスト制限を超えました。しばらく待ってから再試行してください。' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      ),
    }
  }

  return { allowed: true }
}

/**
 * 厳格なRate Limit（AI API用）
 * 高コストなAPIには厳しい制限
 */
export function checkStrictRateLimit(request: NextRequest) {
  return checkRateLimit(request, {
    limit: 10,       // 10リクエスト
    windowMs: 60000, // 1分間
  })
}
