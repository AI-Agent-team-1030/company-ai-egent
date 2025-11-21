import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// PUT: フォルダ名を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('knowledge_folders')
      .update({ name: name.trim() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating folder:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/folders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: フォルダを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // フォルダ内のドキュメント数を確認
    const { data: docs, error: docsError } = await supabase
      .from('uploaded_documents')
      .select('id')
      .eq('folder_id', params.id)

    if (docsError) {
      console.error('Error checking documents:', docsError)
      return NextResponse.json({ error: docsError.message }, { status: 500 })
    }

    if (docs && docs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder with documents. Please move or delete documents first.' },
        { status: 400 }
      )
    }

    // フォルダを削除
    const { error } = await supabase
      .from('knowledge_folders')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting folder:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Folder deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/folders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
