import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { getUserFromRequest } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// POST: メッセージを送信してAIからの応答を取得
export async function POST(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, content, referenced_knowledge_ids } = body

    // バリデーション
    if (!conversation_id || !content) {
      return NextResponse.json(
        { error: 'conversation_id and content are required' },
        { status: 400 }
      )
    }

    // ユーザーメッセージを保存
    const { data: userMessage, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert([
        {
          conversation_id,
          role: 'user',
          content,
          referenced_knowledge_ids: referenced_knowledge_ids || [],
        },
      ])
      .select()
      .single()

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
      return NextResponse.json({ error: userMsgError.message }, { status: 500 })
    }

    // ユーザーのAPIキーを設定から取得
    const { data: apiKeySetting, error: apiKeyError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'anthropic_api_key')
      .eq('user_id', user.id)
      .single()

    if (apiKeyError || !apiKeySetting) {
      return NextResponse.json(
        { error: 'Claude APIキーが設定されていません。設定ページから登録してください。' },
        { status: 400 }
      )
    }

    // 会話履歴を取得
    const { data: messages, error: historyError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })

    if (historyError) {
      console.error('Error fetching message history:', historyError)
      return NextResponse.json({ error: historyError.message }, { status: 500 })
    }

    // ドキュメントを検索してコンテキストを構築
    let knowledgeContext = ''

    // ユーザーのドキュメントのみを検索
    const { data: userDocuments } = await supabase
      .from('uploaded_documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('processed', true)

    const userDocumentIds = userDocuments?.map(doc => doc.id) || []

    // ユーザーのメッセージから関連ドキュメントを検索
    const { data: relevantChunks, error: searchError } = await supabase
      .from('document_chunks')
      .select('content, document_id, uploaded_documents(original_filename)')
      .in('document_id', userDocumentIds)
      .textSearch('content', content.trim(), {
        type: 'websearch',
        config: 'english'
      })
      .limit(5)

    if (!searchError && relevantChunks && relevantChunks.length > 0) {
      knowledgeContext = '\n\n【参照ドキュメント】\n以下のドキュメントから関連情報を見つけました：\n\n'

      const seenDocs = new Set<string>()
      relevantChunks.forEach((chunk: any) => {
        const docName = chunk.uploaded_documents?.original_filename || 'Unknown'
        if (!seenDocs.has(chunk.document_id)) {
          seenDocs.add(chunk.document_id)
          knowledgeContext += `■ ${docName}\n`
        }
        knowledgeContext += `${chunk.content}\n\n`
      })

      knowledgeContext += '\n上記のドキュメント内容を参考に、質問に回答してください。'
    }

    // Claude APIを呼び出し
    const anthropic = new Anthropic({
      apiKey: apiKeySetting.value,
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 8192,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.role === 'user' && knowledgeContext
          ? m.content + knowledgeContext
          : m.content,
      })),
    })

    const assistantContent = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // AIメッセージを保存
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert([
        {
          conversation_id,
          role: 'assistant',
          content: assistantContent,
          referenced_knowledge_ids: referenced_knowledge_ids || [],
        },
      ])
      .select()
      .single()

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
      return NextResponse.json({ error: assistantMsgError.message }, { status: 500 })
    }

    // 会話のupdated_atを更新
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation_id)

    return NextResponse.json({
      userMessage,
      assistantMessage,
    })
  } catch (error: any) {
    console.error('Error in POST /api/chat/messages:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
