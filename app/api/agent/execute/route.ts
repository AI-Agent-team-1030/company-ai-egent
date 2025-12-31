import { NextRequest, NextResponse } from 'next/server'
import { requireFirebaseAuth } from '@/lib/firebase-api-auth'
import { checkStrictRateLimit } from '@/lib/rate-limit'
import { apiLogger } from '@/lib/logger'
import { getAgentById } from '@/lib/firestore-agents'
import {
  executeTool,
  extractCitationsFromToolResults,
  ToolExecutionContext,
} from '@/lib/agent-tools'
import {
  AgentExecuteRequest,
  AgentTool,
  AgentModel,
  ToolExecutionResult,
  AgentCitation,
} from '@/lib/types/agent'

export const dynamic = 'force-dynamic'

// モデルIDからプロバイダーを判定
function getModelProvider(model: AgentModel): 'gemini' | 'anthropic' | 'openai' {
  if (model.startsWith('gemini') || model === 'auto') return 'gemini'
  if (model.startsWith('claude')) return 'anthropic'
  if (model.startsWith('gpt')) return 'openai'
  return 'gemini'
}

// モデルIDを実際のAPI用に変換
function getActualModelId(model: AgentModel): string {
  if (model === 'auto') return 'gemini-2.5-flash'
  return model
}

export async function POST(req: NextRequest) {
  // Rate Limitチェック
  const rateLimit = checkStrictRateLimit(req)
  if (!rateLimit.allowed) return rateLimit.error

  // 認証チェック
  const auth = await requireFirebaseAuth(req)
  if (!auth.authorized) return auth.error!

  try {
    const body: AgentExecuteRequest = await req.json()
    const { agentId, message, conversationHistory, overrides } = body

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'agentId and message are required' },
        { status: 400 }
      )
    }

    // エージェント定義を取得
    const userId = auth.userId || ''
    const companyId = auth.companyId || ''
    const agent = await getAgentById(agentId, userId, companyId)

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // 設定をオーバーライドで上書き
    const enabledTools = overrides?.tools || agent.tools
    const model = overrides?.model || agent.model
    const temperature = overrides?.temperature ?? agent.temperature
    const maxTokens = overrides?.maxTokens ?? agent.maxTokens

    // SSEストリーム準備
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // 非同期でエージェント実行
    ;(async () => {
      try {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const startedAt = new Date()

        // ステータス: analyzing
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            status: 'running',
            step: 'analyzing',
            message: '質問を分析しています...',
            timestamp: Date.now(),
          })}\n\n`)
        )

        // ツール実行コンテキスト
        // NOTE: driveAccessToken等はクライアントから渡すか、別途取得が必要
        const toolContext: ToolExecutionContext = {
          query: message,
          geminiApiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          driveAccessToken: undefined, // TODO: Firestoreから取得
          driveFolderId: undefined, // TODO: Firestoreから取得
          fileSearchStores: [], // TODO: Firestoreから取得
        }

        // ツール実行
        const toolResults: ToolExecutionResult[] = []

        for (const tool of enabledTools) {
          // ステータス更新
          const stepMap: Record<AgentTool, string> = {
            knowledge_search: 'ナレッジを検索中...',
            drive_search: 'Driveを検索中...',
            web_search: 'Webを検索中...',
            document_generate: '文書を生成中...',
            api_call: 'APIを呼び出し中...',
            code_execute: 'コードを実行中...',
          }

          await writer.write(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              status: 'running',
              step: `${tool}_searching`,
              message: stepMap[tool] || `${tool}を実行中...`,
              timestamp: Date.now(),
            })}\n\n`)
          )

          // ツール実行
          const result = await executeTool(tool, toolContext)
          toolResults.push(result)

          // ツール結果をストリーム
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({
              type: 'tool_result',
              tool,
              status: result.status,
              results: result.result,
              error: result.error,
              timestamp: Date.now(),
            })}\n\n`)
          )
        }

        // 引用情報を抽出
        const citations = extractCitationsFromToolResults(toolResults)

        // ステータス: generating
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            status: 'running',
            step: 'generating',
            message: '回答を生成中...',
            timestamp: Date.now(),
          })}\n\n`)
        )

        // AI応答生成
        const provider = getModelProvider(model)
        const actualModel = getActualModelId(model)
        let response = ''

        // コンテキストを構築
        const contextParts: string[] = []

        if (citations.length > 0) {
          contextParts.push('## 参考情報\n')
          citations.forEach((citation, i) => {
            contextParts.push(`### ${i + 1}. ${citation.title}`)
            contextParts.push(`${citation.content}\n`)
          })
        }

        const systemPromptWithContext = `${agent.systemPrompt}

${contextParts.length > 0 ? '\n以下の参考情報を活用して回答してください：\n' + contextParts.join('\n') : ''}`

        // 会話履歴を構築
        const messages = [
          ...(conversationHistory || []).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: message },
        ]

        if (provider === 'gemini') {
          response = await generateWithGemini(
            actualModel,
            systemPromptWithContext,
            messages,
            temperature,
            maxTokens
          )
        } else if (provider === 'anthropic') {
          const anthropicKey = process.env.ANTHROPIC_API_KEY
          if (!anthropicKey) {
            throw new Error('Anthropic API key is required for Claude models')
          }
          response = await generateWithAnthropic(
            actualModel,
            systemPromptWithContext,
            messages,
            anthropicKey,
            temperature,
            maxTokens
          )
        } else if (provider === 'openai') {
          const openaiKey = process.env.OPENAI_API_KEY
          if (!openaiKey) {
            throw new Error('OpenAI API key is required for GPT models')
          }
          response = await generateWithOpenAI(
            actualModel,
            systemPromptWithContext,
            messages,
            openaiKey,
            temperature,
            maxTokens
          )
        }

        // コンテンツをストリーム
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'content',
            text: response,
            isPartial: false,
            timestamp: Date.now(),
          })}\n\n`)
        )

        // 完了
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            result: {
              taskId,
              agentId: agent.id,
              agentName: agent.name,
              status: 'completed',
              response,
              citations,
              toolResults,
              startedAt: startedAt.toISOString(),
              completedAt: new Date().toISOString(),
            },
            timestamp: Date.now(),
          })}\n\n`)
        )
      } catch (error) {
        apiLogger.error('Agent execution error:', error)
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          })}\n\n`)
        )
      } finally {
        await writer.close()
      }
    })()

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    apiLogger.error('Agent execute route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// AI生成関数
// ============================================

async function generateWithGemini(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature: temperature ?? 0.7,
          maxOutputTokens: maxTokens ?? 8000,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function generateWithAnthropic(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  apiKey: string,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens ?? 8000,
      temperature: temperature ?? 0.7,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

async function generateWithOpenAI(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  apiKey: string,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens ?? 8000,
      temperature: temperature ?? 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}
