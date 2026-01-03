/**
 * マルチエージェントオーケストレーターAPI
 *
 * タスクを分析し、必要なエージェントを動的に生成・実行
 * 複雑なタスクは複数エージェントで協調処理
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AgentTool } from '@/lib/types/agent'

export const runtime = 'nodejs'
export const maxDuration = 120

interface OrchestrateRequest {
  message: string
  userId?: string
  companyId?: string
  conversationContext?: string
}

interface AgentPlan {
  name: string
  role: string
  systemPrompt: string
  tools: AgentTool[]
  dependsOn?: string[] // 依存する他のエージェント名
  priority: number // 実行優先度（低い方が先）
}

interface OrchestrationPlan {
  taskAnalysis: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: AgentPlan[]
  synthesisPrompt: string // 結果統合用プロンプト
}

// オーケストレーションプラン生成プロンプト
function buildOrchestrationPrompt(userMessage: string, context?: string): string {
  return `あなたは最高峰のAIタスクオーケストレーターです。
ユーザーのリクエストを分析し、最適なエージェント構成を設計してください。

## ユーザーのリクエスト
${userMessage}

${context ? `## 会話コンテキスト\n${context}\n` : ''}

## あなたの任務
1. タスクの複雑さを判断（simple/moderate/complex）
2. 必要なエージェントを特定（1〜5体）
3. 各エージェントの役割・ツール・依存関係を設計
4. 結果を統合するための指示を作成

## 複雑さの判断基準
- **simple**: 単一の明確なタスク（例：要約、翻訳、質問回答）→ 1エージェント
- **moderate**: 2-3ステップのタスク（例：調査→分析）→ 2-3エージェント
- **complex**: 多段階・多角的なタスク（例：競合分析レポート作成）→ 3-5エージェント

## 利用可能なツール
- knowledge_search: 社内ナレッジベース検索
- drive_search: Google Drive/OneDrive検索
- web_search: インターネット検索
- document_generate: 構造化文書生成

## エージェント設計のポイント
1. 各エージェントは専門性を持つ（汎用的すぎない）
2. 依存関係を明確に（並列実行可能なものは並列で）
3. 最終成果物の品質を最大化する構成

## 出力形式（JSON）
\`\`\`json
{
  "taskAnalysis": "タスクの分析結果（50文字以内）",
  "complexity": "simple|moderate|complex",
  "agents": [
    {
      "name": "エージェント名（6文字以内）",
      "role": "このエージェントの役割（30文字以内）",
      "systemPrompt": "詳細なシステムプロンプト",
      "tools": ["必要なツール"],
      "dependsOn": ["依存するエージェント名（なければ空配列）"],
      "priority": 1
    }
  ],
  "synthesisPrompt": "複数エージェントの結果を統合する際の指示（complexの場合のみ必要）"
}
\`\`\`

## 重要
- simpleの場合でも必ずagents配列に1つ入れる
- 出力はJSON形式のみ。余計な説明は不要`
}

// Geminiレスポンスをパース
function parseOrchestrationPlan(response: string): OrchestrationPlan | null {
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.match(/```\s*([\s\S]*?)\s*```/) ||
                      response.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('No JSON found in orchestration response')
      return null
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    // バリデーション
    if (!parsed.agents || !Array.isArray(parsed.agents) || parsed.agents.length === 0) {
      console.error('Invalid agents array')
      return null
    }

    // ツールのバリデーション
    const validTools: AgentTool[] = [
      'knowledge_search',
      'drive_search',
      'web_search',
      'document_generate',
    ]

    const agents: AgentPlan[] = parsed.agents.map((agent: {
      name?: string
      role?: string
      systemPrompt?: string
      tools?: string[]
      dependsOn?: string[]
      priority?: number
    }, index: number) => ({
      name: String(agent.name || `Agent${index + 1}`).slice(0, 20),
      role: String(agent.role || 'タスク実行').slice(0, 50),
      systemPrompt: String(agent.systemPrompt || ''),
      tools: (agent.tools || ['knowledge_search']).filter((t: string) =>
        validTools.includes(t as AgentTool)
      ) as AgentTool[],
      dependsOn: agent.dependsOn || [],
      priority: agent.priority || index + 1,
    }))

    return {
      taskAnalysis: String(parsed.taskAnalysis || 'タスク分析').slice(0, 100),
      complexity: ['simple', 'moderate', 'complex'].includes(parsed.complexity)
        ? parsed.complexity
        : 'simple',
      agents,
      synthesisPrompt: String(parsed.synthesisPrompt || ''),
    }
  } catch (error) {
    console.error('Failed to parse orchestration plan:', error)
    return null
  }
}

// シンプルなフォールバック
function createFallbackPlan(userMessage: string): OrchestrationPlan {
  return {
    taskAnalysis: 'シンプルなタスク',
    complexity: 'simple',
    agents: [{
      name: 'アシスタント',
      role: 'ユーザーリクエストに対応',
      systemPrompt: `あなたは優秀なAIアシスタントです。

【タスク】
${userMessage}

【指示】
- ユーザーのリクエストを正確に理解する
- 必要な情報を収集・整理する
- 分かりやすく丁寧に回答する`,
      tools: ['knowledge_search'],
      dependsOn: [],
      priority: 1,
    }],
    synthesisPrompt: '',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestrateRequest = await request.json()
    const { message, userId, companyId, conversationContext } = body

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      )
    }

    let plan: OrchestrationPlan

    // Gemini APIでオーケストレーションプランを生成
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

        const prompt = buildOrchestrationPrompt(message, conversationContext)
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        console.log('Orchestration response:', responseText.slice(0, 500))

        const parsed = parseOrchestrationPlan(responseText)
        if (parsed) {
          plan = parsed
          console.log('Orchestration plan:', plan.complexity, plan.agents.length, 'agents')
        } else {
          console.log('Failed to parse, using fallback')
          plan = createFallbackPlan(message)
        }
      } catch (error) {
        console.error('Gemini API error:', error)
        plan = createFallbackPlan(message)
      }
    } else {
      console.log('No Gemini API key, using fallback')
      plan = createFallbackPlan(message)
    }

    return NextResponse.json({
      success: true,
      plan,
      canSave: !!(userId && companyId),
      generatedAt: Date.now(),
    })
  } catch (error) {
    console.error('Orchestration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'オーケストレーションに失敗しました' },
      { status: 500 }
    )
  }
}
