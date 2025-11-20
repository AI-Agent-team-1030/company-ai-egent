import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// DELETE: ドキュメントを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ユーザー認証チェック
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ドキュメント情報を取得（user_idもチェック）
    const { data: document, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('filename')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching document:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Storageからファイルを削除
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.filename])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // ストレージ削除失敗してもDBからは削除を続行
    }

    // データベースから削除（チャンクも自動削除される）
    const { error: deleteError } = await supabase
      .from('uploaded_documents')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/documents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
