import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encrypt, decrypt, isSensitiveKey } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// GET: 設定を取得
export async function GET(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // ユーザーのトークンを使って認証済みクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // ユーザー情報を取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (key) {
      // 特定のキーを取得（最新のものを取得）
      console.log(`[Settings API GET] Fetching setting: key=${key}, user_id=${user.id}`)

      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', key)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('[Settings API GET] Error fetching setting:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!data) {
        // 設定が見つからない場合はnullを返す
        console.log(`[Settings API GET] Setting not found: key=${key}`)
        return NextResponse.json({ key, value: null })
      }

      // センシティブなキーの場合は復号化
      if (isSensitiveKey(key)) {
        console.log(`[Settings API GET] Decrypting sensitive data for key=${key}`)
        data.value = decrypt(data.value)
      }

      console.log(`[Settings API GET] Setting found:`, data)
      return NextResponse.json(data)
    } else {
      // 全ての設定を取得
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('key', { ascending: true })

      if (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Error in GET /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 設定を作成または更新（upsert）
export async function POST(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // ユーザーのトークンを使って認証済みクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // ユーザー情報を取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    // バリデーション
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 }
      )
    }

    console.log(`[Settings API] Saving setting: key=${key}, user_id=${user.id}`)

    // センシティブなキーの場合は暗号化
    let valueToSave = value
    if (isSensitiveKey(key)) {
      console.log(`[Settings API] Encrypting sensitive data for key=${key}`)
      valueToSave = encrypt(value)
    }

    // まず既存の設定を確認
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('key', key)
      .eq('user_id', user.id)
      .maybeSingle()

    let data, error

    if (existing) {
      // 既存のレコードを更新
      console.log(`[Settings API] Updating existing setting: id=${existing.id}`)
      const result = await supabase
        .from('app_settings')
        .update({ value: valueToSave, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      data = result.data
      error = result.error
    } else {
      // 新しいレコードを作成
      console.log(`[Settings API] Creating new setting`)
      const result = await supabase
        .from('app_settings')
        .insert({
          key,
          value: valueToSave,
          user_id: user.id,
        })
        .select()
        .single()

      data = result.data
      error = result.error
    }

    // レスポンスでは暗号化されていない値を返す
    if (data && isSensitiveKey(key)) {
      data.value = value // 元の値を返す
    }

    if (error) {
      console.error('[Settings API] Error saving setting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[Settings API] Setting saved successfully:', data)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 設定を削除
export async function DELETE(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // ユーザーのトークンを使って認証済みクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('app_settings')
      .delete()
      .eq('key', key)

    if (error) {
      console.error('Error deleting setting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Setting deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
