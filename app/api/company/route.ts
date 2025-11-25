import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: ユーザーの会社情報を取得
export async function GET(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プロフィールから会社IDを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 会社情報を取得
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', profile.company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: company.id,
      name: company.name,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
