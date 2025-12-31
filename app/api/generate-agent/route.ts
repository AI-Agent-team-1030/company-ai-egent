import { NextRequest, NextResponse } from 'next/server'
import { apiLogger } from '@/lib/logger'
import { AgentTool, AgentModel, AGENT_CATEGORIES, AGENT_TOOLS } from '@/lib/types/agent'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json()

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // 利用可能なカテゴリとツールのリスト
    const categoryList = AGENT_CATEGORIES
      .filter(c => c.id !== 'all')
      .map(c => c.id)
      .join(', ')

    const toolList = AGENT_TOOLS
      .filter(t => t.isAvailable)
      .map(t => `${t.id}: ${t.description}`)
      .join('\n')

    const prompt = `あなたはAIエージェント設計の専門家です。
以下のユーザーの説明に基づいて、最適なエージェント設定を生成してください。

## ユーザーの説明
${description}

## 利用可能なカテゴリ
${categoryList}

## 利用可能なツール
${toolList}

## 出力形式
以下のJSON形式で出力してください。他のテキストは含めないでください。

{
  "name": "エージェント名（簡潔に、最大20文字程度）",
  "description": "エージェントの説明（1-2文で、何ができるかを明確に）",
  "category": "上記カテゴリから1つ選択",
  "systemPrompt": "詳細なシステムプロンプト（役割、ガイドライン、回答形式を含む）",
  "tools": ["使用するツールのID配列"],
  "model": "auto"
}

## 注意事項
- systemPromptは具体的かつ実用的な内容にしてください
- Markdown形式（##見出し、箇条書きなど）を活用してください
- ツールは説明に合わせて適切に選択してください
- JSONのみを出力し、説明文は含めないでください`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      apiLogger.error('Gemini API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate agent' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // JSONを抽出
    let agentConfig
    try {
      // JSONブロックを探す
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      agentConfig = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      apiLogger.error('Failed to parse generated JSON:', parseError)
      return NextResponse.json(
        { error: 'AIの応答を解析できませんでした' },
        { status: 500 }
      )
    }

    // バリデーション
    const validCategories = AGENT_CATEGORIES.filter(c => c.id !== 'all').map(c => c.id)
    const validTools = AGENT_TOOLS.filter(t => t.isAvailable).map(t => t.id)

    // カテゴリのバリデーション
    if (!validCategories.includes(agentConfig.category)) {
      agentConfig.category = '汎用'
    }

    // ツールのバリデーション
    if (!Array.isArray(agentConfig.tools)) {
      agentConfig.tools = ['knowledge_search']
    } else {
      agentConfig.tools = agentConfig.tools.filter((t: string) =>
        validTools.includes(t as AgentTool)
      )
      if (agentConfig.tools.length === 0) {
        agentConfig.tools = ['knowledge_search']
      }
    }

    // モデルのバリデーション
    const validModels: AgentModel[] = [
      'auto', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-exp-1206',
      'claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'gpt-5.1'
    ]
    if (!validModels.includes(agentConfig.model)) {
      agentConfig.model = 'auto'
    }

    return NextResponse.json({
      name: agentConfig.name || 'カスタムエージェント',
      description: agentConfig.description || '',
      category: agentConfig.category,
      systemPrompt: agentConfig.systemPrompt || '',
      tools: agentConfig.tools,
      model: agentConfig.model,
    })
  } catch (error) {
    apiLogger.error('Generate agent error:', error)
    return NextResponse.json(
      { error: 'エージェント生成に失敗しました' },
      { status: 500 }
    )
  }
}
