import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: 特定の会話を取得（メッセージも含む）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 会話情報を取得
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (convError) {
      if (convError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      console.error('Error fetching conversation:', convError)
      return NextResponse.json({ error: convError.message }, { status: 500 })
    }

    // メッセージを取得
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('Error fetching messages:', msgError)
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }

    return NextResponse.json({
      ...conversation,
      messages,
    })
  } catch (error) {
    console.error('Error in GET /api/chat/conversations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH: 会話のタイトルを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .update({ title })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/chat/conversations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 会話を削除（メッセージも自動削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting conversation:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Conversation deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/chat/conversations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
