import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

// ナレッジ検索が必要かどうかを判定する関数
async function checkIfKnowledgeNeeded(
  userQuestion: string,
  provider: string,
  apiKey: string,
  modelName: string
): Promise<boolean> {
  try {
    const judgePrompt = `以下の質問を分析して、社内のドキュメントやナレッジベースを参照する必要があるかどうかを判定してください。

質問: "${userQuestion}"

判定基準:
- 業務に関する質問、社内の資料・手順・ガイドラインが必要な質問の場合: YES
- 一般的な挨拶、雑談、一般知識で答えられる質問の場合: NO

回答は "YES" または "NO" のみで答えてください。`

    if (provider === 'Anthropic') {
      const anthropic = new Anthropic({ apiKey })
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: judgePrompt }],
      })
      const result = response.content[0].type === 'text' ? response.content[0].text.trim() : 'YES'
      return result.toUpperCase().includes('YES')
    } else if (provider === 'OpenAI') {
      const openai = new OpenAI({ apiKey })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: judgePrompt }],
      })
      const result = response.choices[0]?.message?.content?.trim() || 'YES'
      return result.toUpperCase().includes('YES')
    } else if (provider === 'Google Gemini') {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
      const result = await model.generateContent(judgePrompt)
      const response = await result.response
      const text = response.text().trim()
      return text.toUpperCase().includes('YES')
    }

    // デフォルトは検索を使う
    return true
  } catch (error) {
    console.error('Error checking if knowledge is needed:', error)
    // エラー時はデフォルトで検索を使う
    return true
  }
}

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
    const { conversation_id, content, referenced_knowledge_ids, provider, model_id, use_knowledge_search } = body

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
      return NextResponse.json(
        { error: `${providerName}のAPIキーが設定されていません。設定ページから登録してください。` },
        { status: 400 }
      )
    }

    // APIキーを復号化
    const apiKey = decrypt(apiKeySetting.value)

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

    // モデルIDをAPIのモデル名にマッピング
    const modelMapping: Record<string, string> = {
      // Anthropic
      'sonnet-4.5': 'claude-3-7-sonnet-20250219',
      'haiku-4.5': 'claude-3-5-haiku-20241022',
      // OpenAI
      'gpt-5.1': 'gpt-4o',
      // Google Gemini
      'gemini-2.5-pro': 'gemini-2.0-flash-exp',
      'gemini-2.5-flash': 'gemini-2.0-flash-exp',
      'gemini-3-pro': 'gemini-2.0-flash-exp',
    }

    const apiModelName = modelMapping[model_id] || modelMapping['sonnet-4.5']

    // ナレッジ検索の実行判定
    // use_knowledge_searchがtrueの場合のみ、AIによる必要性判定を行う
    let shouldUseKnowledge = false
    if (use_knowledge_search === true) {
      shouldUseKnowledge = await checkIfKnowledgeNeeded(content, provider, apiKey, apiModelName)
    }

    // ドキュメントを検索してコンテキストを構築
    let knowledgeContext = ''
    let usedKnowledge = false

    if (shouldUseKnowledge) {
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
          usedKnowledge = true
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
    }

    // プロバイダーに応じてAI APIを呼び出し
    let assistantContent = ''

    if (provider === 'Anthropic') {
      // Claude API
      const anthropic = new Anthropic({
        apiKey: apiKey,
      })

      const response = await anthropic.messages.create({
        model: apiModelName,
        max_tokens: 8192,
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.role === 'user' && knowledgeContext
            ? m.content + knowledgeContext
            : m.content,
        })),
      })

      assistantContent = response.content[0].type === 'text'
        ? response.content[0].text
        : ''
    } else if (provider === 'OpenAI') {
      // OpenAI API
      const openai = new OpenAI({
        apiKey: apiKey,
      })

      const response = await openai.chat.completions.create({
        model: apiModelName,
        max_tokens: 8192,
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.role === 'user' && knowledgeContext
            ? m.content + knowledgeContext
            : m.content,
        })),
      })

      assistantContent = response.choices[0]?.message?.content || ''
    } else if (provider === 'Google Gemini') {
      // Google Gemini API
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: apiModelName })

      // Gemini APIの形式に変換
      const geminiMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{
          text: m.role === 'user' && knowledgeContext
            ? m.content + knowledgeContext
            : m.content
        }],
      }))

      const chat = model.startChat({
        history: geminiMessages.slice(0, -1), // 最後のメッセージ以外を履歴として渡す
      })

      const result = await chat.sendMessage(geminiMessages[geminiMessages.length - 1].parts[0].text)
      const response = await result.response
      assistantContent = response.text()
    } else {
      throw new Error(`Unsupported provider: ${provider}`)
    }

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
      usedKnowledge, // ナレッジ検索を使ったかどうかのフラグ
    })
  } catch (error: any) {
    console.error('Error in POST /api/chat/messages:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
