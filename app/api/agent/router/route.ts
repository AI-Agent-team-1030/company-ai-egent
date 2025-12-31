/**
 * エージェントルーターAPI（Gemini版）
 *
 * ユーザーのリクエストを分析し、タスクに最適なエージェントをGeminiが設計
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAgent } from '@/lib/firestore-agents'
import type { Agent, AgentTool, AgentInput } from '@/lib/types/agent'

export const runtime = 'nodejs'
export const maxDuration = 60

interface RouterRequest {
  message: string
  userId?: string
  companyId?: string
  conversationContext?: string
}

// エージェント生成プロンプト
function buildAgentDesignPrompt(userMessage: string, context?: string): string {
  return `あなたは最高峰のAIエージェント設計者です。ユーザーのリクエストを深く分析し、そのタスクを完璧に遂行するためのエージェントを設計してください。

## ユーザーのリクエスト
${userMessage}

${context ? `## 会話コンテキスト\n${context}\n` : ''}

## あなたの任務
1. リクエストの本質的な目的を理解する
2. その目的を達成するために必要な能力・ツール・アプローチを特定する
3. 最適なシステムプロンプトを設計する

## 利用可能なツール
- knowledge_search: 社内ナレッジベース・ドキュメント検索（社内情報が必要な場合）
- drive_search: Google Drive内ファイル検索（ユーザーのファイルを参照する場合）
- web_search: インターネット検索（最新情報・外部情報が必要な場合）
- document_generate: 構造化された文書・レポート生成（成果物として文書が必要な場合）

## 設計のポイント

### システムプロンプト設計のコツ
1. **役割の明確化**: このエージェントが「誰として」振る舞うかを明確に
2. **タスクの具体化**: 何をすべきかを具体的に指示
3. **出力形式の指定**: ユーザーが期待する出力形式を明示
4. **制約と注意点**: 守るべきルールや注意事項
5. **品質基準**: 成果物の品質基準

### ツール選択の基準
- 本当に必要なツールだけを選択（無駄なツールは処理を遅くする）
- knowledge_search: 社内情報・過去の資料を参照する場合
- web_search: 最新トレンド・外部データ・競合情報などが必要な場合
- document_generate: 報告書・提案書・議事録など文書作成が目的の場合

## 出力形式（JSON）
\`\`\`json
{
  "name": "エージェント名（8文字以内、タスクを端的に表現）",
  "description": "このエージェントの役割と目的（40文字以内）",
  "category": "リサーチ|文書作成|分析|サポート|開発|マーケティング|営業|その他",
  "systemPrompt": "詳細なシステムプロンプト（エージェントへの指示）",
  "tools": ["必要なツールの配列"],
  "reasoning": "この設計にした理由（20文字以内）"
}
\`\`\`

## 重要
- systemPromptは具体的かつ実用的に。曖昧な指示は避ける
- ユーザーのリクエストの意図を超えて価値を提供できる設計を心がける
- 出力はJSON形式のみ。余計な説明は不要`
}

// Geminiのレスポンスをパース
function parseGeminiResponse(response: string): {
  name: string
  description: string
  category: string
  systemPrompt: string
  tools: AgentTool[]
  reasoning: string
} | null {
  try {
    // JSONブロックを抽出
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      response.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('No JSON found in response')
      return null
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    // バリデーション
    if (!parsed.name || !parsed.systemPrompt) {
      console.error('Missing required fields')
      return null
    }

    // ツールのバリデーション
    const validTools: AgentTool[] = [
      'knowledge_search',
      'drive_search',
      'web_search',
      'document_generate',
      'api_call',
      'code_execute',
    ]
    const tools = (parsed.tools || ['knowledge_search']).filter((t: string) =>
      validTools.includes(t as AgentTool)
    ) as AgentTool[]

    return {
      name: String(parsed.name).slice(0, 20),
      description: String(parsed.description || `${parsed.name}エージェント`).slice(0, 100),
      category: parsed.category || 'その他',
      systemPrompt: String(parsed.systemPrompt),
      tools: tools.length > 0 ? tools : ['knowledge_search'],
      reasoning: String(parsed.reasoning || 'タスクに最適化').slice(0, 50),
    }
  } catch (error) {
    console.error('Failed to parse Gemini response:', error)
    return null
  }
}

// フォールバック: シンプルなエージェント生成
function createFallbackAgent(userMessage: string): {
  name: string
  description: string
  category: string
  systemPrompt: string
  tools: AgentTool[]
  reasoning: string
} {
  const message = userMessage.toLowerCase()

  if (message.includes('調査') || message.includes('リサーチ') || message.includes('分析')) {
    return {
      name: 'リサーチャー',
      description: '情報収集と分析を行うエージェント',
      category: 'リサーチ',
      systemPrompt: `あなたは優秀なリサーチアナリストです。

【タスク】
${userMessage}

【アプローチ】
1. まず関連情報を幅広く収集
2. 情報の信頼性と関連性を評価
3. 分析結果を構造化して報告

【出力形式】
## 概要
（3行以内で要約）

## 詳細分析
（調査結果を項目別に整理）

## 結論・提言
（具体的なアクションにつながる提言）`,
      tools: ['knowledge_search', 'web_search'],
      reasoning: 'リサーチタスク向け',
    }
  }

  if (message.includes('作成') || message.includes('書いて') || message.includes('文書')) {
    return {
      name: 'ライター',
      description: '文書・コンテンツを作成するエージェント',
      category: '文書作成',
      systemPrompt: `あなたはプロフェッショナルなビジネスライターです。

【タスク】
${userMessage}

【品質基準】
- 明確で簡潔な文章
- 適切な構成と見出し
- 読み手を意識したトーン

【注意点】
- 専門用語は必要に応じて説明を付ける
- 具体例を交えて分かりやすく`,
      tools: ['knowledge_search', 'document_generate'],
      reasoning: '文書作成タスク向け',
    }
  }

  return {
    name: 'アシスタント',
    description: 'ユーザーのリクエストに対応するエージェント',
    category: 'その他',
    systemPrompt: `あなたは優秀なAIアシスタントです。

【タスク】
${userMessage}

【アプローチ】
- ユーザーのリクエストを正確に理解する
- 必要な情報を収集・整理する
- 分かりやすく丁寧に回答する

【品質基準】
- 正確性を重視
- 具体的で実用的な回答
- 必要に応じて追加の提案も行う`,
    tools: ['knowledge_search'],
    reasoning: '汎用アシスタント',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RouterRequest = await request.json()
    const { message, userId, companyId, conversationContext } = body

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      )
    }

    let agentConfig: ReturnType<typeof createFallbackAgent>

    // Gemini APIでエージェントを設計
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

        const prompt = buildAgentDesignPrompt(message, conversationContext)

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        console.log('Gemini response:', responseText.slice(0, 500))

        const parsed = parseGeminiResponse(responseText)
        if (parsed) {
          agentConfig = parsed
          console.log('Generated agent:', parsed.name, '-', parsed.reasoning)
        } else {
          console.log('Failed to parse, using fallback')
          agentConfig = createFallbackAgent(message)
        }
      } catch (error) {
        console.error('Gemini API error:', error)
        agentConfig = createFallbackAgent(message)
      }
    } else {
      console.log('No Gemini API key, using fallback')
      agentConfig = createFallbackAgent(message)
    }

    // 一時的なエージェントオブジェクトを作成
    const tempAgent: Agent = {
      id: `generated-${Date.now()}`,
      name: agentConfig.name,
      description: agentConfig.description,
      category: agentConfig.category,
      systemPrompt: agentConfig.systemPrompt,
      tools: agentConfig.tools,
      model: 'auto',
      isBuiltIn: false,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const agentInput: AgentInput = {
      name: agentConfig.name,
      description: agentConfig.description,
      category: agentConfig.category,
      systemPrompt: agentConfig.systemPrompt,
      tools: agentConfig.tools,
      model: 'auto',
      isShared: false,
    }

    return NextResponse.json({
      agent: tempAgent,
      agentInput,
      reasoning: agentConfig.reasoning,
      canSave: !!(userId && companyId),
      generatedAt: Date.now(),
    })
  } catch (error) {
    console.error('Agent router error:', error)

    const fallback = createFallbackAgent('一般的な質問')
    const tempAgent: Agent = {
      id: `generated-${Date.now()}`,
      name: fallback.name,
      description: fallback.description,
      category: fallback.category,
      systemPrompt: fallback.systemPrompt,
      tools: fallback.tools,
      model: 'auto',
      isBuiltIn: false,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return NextResponse.json({
      agent: tempAgent,
      agentInput: {
        name: fallback.name,
        description: fallback.description,
        category: fallback.category,
        systemPrompt: fallback.systemPrompt,
        tools: fallback.tools,
        model: 'auto',
        isShared: false,
      },
      reasoning: 'エラー時のフォールバック',
      canSave: false,
      generatedAt: Date.now(),
    })
  }
}

// 生成したエージェントを保存するエンドポイント
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { agentInput, userId, companyId, userName } = body

    if (!agentInput || !userId || !companyId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    const agentId = await createAgent(userId, companyId, agentInput, userName)

    if (!agentId) {
      return NextResponse.json(
        { error: 'エージェントの保存に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agentId,
      message: 'エージェントを保存しました',
    })
  } catch (error) {
    console.error('Save agent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
