import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/supabase-server'

// GET: 設定を取得
export async function GET(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (key) {
      // 特定のキーを取得
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', key)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
        }
        console.error('Error fetching setting:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // 全ての設定を取得
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
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
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
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

    // upsert: 存在すれば更新、なければ作成
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value, user_id: user.id },
        { onConflict: 'key,user_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upserting setting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('app_settings')
      .delete()
      .eq('key', key)
      .eq('user_id', user.id)

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
