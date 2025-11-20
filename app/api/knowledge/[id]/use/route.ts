import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST: 使用回数をインクリメント
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 現在の使用回数を取得
    const { data: current, error: fetchError } = await supabase
      .from('knowledge')
      .select('usage_count')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error('Error fetching knowledge:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // 使用回数をインクリメント
    const { data, error } = await supabase
      .from('knowledge')
      .update({ usage_count: (current.usage_count || 0) + 1 })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating usage count:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/knowledge/[id]/use:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
