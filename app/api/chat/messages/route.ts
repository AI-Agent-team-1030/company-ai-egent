import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// POST: メッセージを送信してAIからの応答を取得
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
    const { conversation_id, content, referenced_knowledge_ids, provider } = body

    // バリデーション
    if (!conversation_id || !content) {
      return NextResponse.json(
        { error: 'conversation_id and content are required' },
        { status: 400 }
      )
    }

    // プロバイダーに応じてAPIキーの種類を決定
    let apiKeyName = 'anthropic_api_key' // デフォルト
    let providerName = 'Claude'

    if (provider === 'OpenAI') {
      apiKeyName = 'openai_api_key'
      providerName = 'OpenAI'
    } else if (provider === 'Google Gemini') {
      apiKeyName = 'google_gemini_api_key'
      providerName = 'Google Gemini'
    } else if (provider === 'Anthropic') {
      apiKeyName = 'anthropic_api_key'
      providerName = 'Claude'
    }

    // ユーザーメッセージを保存
    const { data: userMessage, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert([
        {
          conversation_id,
          role: 'user',
          content,
          user_id: user.id,
          referenced_knowledge_ids: referenced_knowledge_ids || [],
        },
      ])
      .select()
      .single()

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
      return NextResponse.json({ error: userMsgError.message }, { status: 500 })
    }

    // ユーザーの選択したプロバイダーのAPIキーを設定から取得
    const { data: apiKeySetting, error: apiKeyError } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', apiKeyName)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (apiKeyError || !apiKeySetting || !apiKeySetting.value) {
      console.error(`[Chat API] ${providerName} API key not found:`, apiKeyError)
      return NextResponse.json(
        { error: `${providerName}のAPIキーが設定されていません。設定ページから登録してください。` },
        { status: 400 }
      )
    }

    // APIキーを復号化
    const apiKey = decrypt(apiKeySetting.value)
    console.log('[Chat API] API key retrieved and decrypted')

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

    // ユーザーのドキュメントを取得
    const { data: userDocuments } = await supabase
      .from('uploaded_documents')
      .select('id, original_filename')
      .eq('processed', true)

    if (userDocuments && userDocuments.length > 0) {
      const userDocumentIds = userDocuments.map(doc => doc.id)

      // すべてのチャンクを取得（シンプルな実装）
      const { data: relevantChunks } = await supabase
        .from('document_chunks')
        .select('content, document_id')
        .in('document_id', userDocumentIds)
        .limit(10)

      if (relevantChunks && relevantChunks.length > 0) {
        knowledgeContext = '\n\n【参照ドキュメント】\n以下のドキュメントから関連情報を見つけました：\n\n'

        const seenDocs = new Set<string>()
        relevantChunks.forEach((chunk: any) => {
          const doc = userDocuments.find(d => d.id === chunk.document_id)
          const docName = doc?.original_filename || 'Unknown'
          if (!seenDocs.has(chunk.document_id)) {
            seenDocs.add(chunk.document_id)
            knowledgeContext += `■ ${docName}\n`
          }
          knowledgeContext += `${chunk.content}\n\n`
        })

        knowledgeContext += '\n上記のドキュメント内容を参考に、質問に回答してください。'
      }
    }

    // Claude APIを呼び出し
    const anthropic = new Anthropic({
      apiKey: apiKey,
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
          user_id: user.id,
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
