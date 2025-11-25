import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません')
}

export async function getUserFromRequest(request: Request) {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[getUserFromRequest] No Authorization header found')
      return { user: null, error: new Error('No authorization header') }
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error) {
      console.error('[getUserFromRequest] Error getting user:', error)
      return { user: null, error }
    }

    if (!user) {
      console.error('[getUserFromRequest] No user found')
      return { user: null, error: new Error('User not found') }
    }

    console.log('[getUserFromRequest] User authenticated:', user.id)
    return { user, error: null }
  } catch (error) {
    console.error('[getUserFromRequest] Exception:', error)
    return { user: null, error: error as Error }
  }
}

export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
