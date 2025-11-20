import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: ナレッジ一覧取得（検索・フィルタリング対応）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const tags = searchParams.get('tags') || ''
    const sortBy = searchParams.get('sortBy') || 'recent'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('knowledge')
      .select('*', { count: 'exact' })

    // 検索フィルター
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // カテゴリーフィルター
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // タグフィルター
    if (tags) {
      const tagArray = tags.split(',')
      query = query.contains('tags', tagArray)
    }

    // ソート
    switch (sortBy) {
      case 'popular':
        query = query.order('usage_count', { ascending: false })
        break
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'recent':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching knowledge:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in GET /api/knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新規ナレッジ作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, category, department, tags } = body

    // バリデーション
    if (!title || !content || !category || !department) {
      return NextResponse.json(
        { error: 'title, content, category, department are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('knowledge')
      .insert([
        {
          title,
          content,
          category,
          department,
          tags: tags || [],
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating knowledge:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
