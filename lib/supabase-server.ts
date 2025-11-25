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
      return { user: null, error: new Error('No authorization header') }
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error) {
      return { user: null, error }
    }

    if (!user) {
      return { user: null, error: new Error('User not found') }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
