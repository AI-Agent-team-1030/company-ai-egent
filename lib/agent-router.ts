/**
 * エージェントルーター（動的生成版）
 *
 * ユーザーのリクエストを分析し、タスクに最適なエージェントを毎回生成
 */

import { AgentTool, AgentInput, AgentModel } from '@/lib/types/agent'

// 生成されたエージェント設定
export interface GeneratedAgentConfig {
  name: string
  description: string
  category: string
  systemPrompt: string
  tools: AgentTool[]
  model: AgentModel
  reasoning: string
}

// エージェント生成プロンプト
export function buildAgentGenerationPrompt(userMessage: string): string {
  return `あなたはエージェント設計の専門家です。ユーザーのリクエストを分析し、そのタスクに最適なAIエージェントを設計してください。

## ユーザーのリクエスト
${userMessage}

## タスク
このリクエストを最も効果的に処理するためのエージェント設定を生成してください。

## 利用可能なツール（必要なものだけ選択）
- knowledge_search: 社内ナレッジベース・ドキュメント検索
- drive_search: Google Drive内のファイル検索
- web_search: インターネット検索（最新情報取得）
- document_generate: 文書・レポート・テンプレート生成
- api_call: 外部APIとの連携
- code_execute: コード実行・データ処理

## 利用可能なモデル
- gemini-2.5-pro: 高精度・長文対応（デフォルト推奨）
- gemini-2.5-flash: 高速・コスト効率
- claude-sonnet-4-5-20250929: 複雑な推論
- auto: 自動選択

## 出力形式（JSON）
{
  "name": "エージェント名（10文字以内、タスクを端的に表す）",
  "description": "このエージェントが何をするか（50文字以内）",
  "category": "カテゴリ（リサーチ/文書作成/分析/サポート/開発/その他）",
  "systemPrompt": "エージェントへの詳細な指示（タスクに特化した具体的なプロンプト）",
  "tools": ["必要なツールの配列"],
  "model": "最適なモデルID",
  "reasoning": "なぜこの設定が最適か（30文字以内）"
}

## 設計のポイント
1. **systemPrompt**: タスクに特化した具体的な指示を含める
   - 出力フォーマットの指定
   - 注意点や制約
   - 期待される成果物の形式
2. **tools**: 本当に必要なツールだけ選択（多すぎると遅くなる）
3. **name**: ユーザーが一目で理解できる名前

JSONのみを出力してください。`
}

// 生成結果のパース
export function parseGeneratedAgent(response: string): GeneratedAgentConfig | null {
  try {
    // JSONを抽出
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('JSON not found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // バリデーション
    if (!parsed.name || !parsed.systemPrompt) {
      throw new Error('Missing required fields')
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
    const tools = (parsed.tools || []).filter((t: string) =>
      validTools.includes(t as AgentTool)
    ) as AgentTool[]

    // デフォルトで最低1つのツールを持つ
    if (tools.length === 0) {
      tools.push('knowledge_search')
    }

    return {
      name: parsed.name.slice(0, 20),
      description: parsed.description || `${parsed.name}エージェント`,
      category: parsed.category || 'その他',
      systemPrompt: parsed.systemPrompt,
      tools,
      model: parsed.model || 'auto',
      reasoning: parsed.reasoning || 'タスクに最適化',
    }
  } catch (error) {
    console.error('Failed to parse generated agent:', error)
    return null
  }
}

// フォールバック: シンプルなエージェント生成
export function createFallbackAgent(userMessage: string): GeneratedAgentConfig {
  // メッセージから意図を推測
  const message = userMessage.toLowerCase()

  let category = 'その他'
  let tools: AgentTool[] = ['knowledge_search']
  let name = '汎用アシスタント'
  let systemPrompt = 'ユーザーの質問に丁寧に回答してください。'

  if (message.includes('調査') || message.includes('リサーチ') || message.includes('分析')) {
    category = 'リサーチ'
    tools = ['knowledge_search', 'web_search']
    name = 'リサーチャー'
    systemPrompt = `以下のリクエストについて調査・分析を行い、結果を整理して報告してください。

【調査内容】
${userMessage}

【出力形式】
1. 概要（3行以内）
2. 詳細な調査結果
3. 結論・提言`
  } else if (message.includes('作成') || message.includes('書いて') || message.includes('文書')) {
    category = '文書作成'
    tools = ['knowledge_search', 'document_generate']
    name = 'ライター'
    systemPrompt = `以下のリクエストに基づいて文書を作成してください。

【リクエスト】
${userMessage}

【注意点】
- 明確で読みやすい文章
- 適切な構成と見出し
- プロフェッショナルなトーン`
  } else if (message.includes('コード') || message.includes('プログラム') || message.includes('実装')) {
    category = '開発'
    tools = ['knowledge_search', 'code_execute']
    name = 'デベロッパー'
    systemPrompt = `以下のプログラミングに関するリクエストに対応してください。

【リクエスト】
${userMessage}

【出力形式】
1. 解決アプローチの説明
2. コード（適切にコメント付き）
3. 使用方法の説明`
  }

  return {
    name,
    description: `${userMessage.slice(0, 30)}...に対応`,
    category,
    systemPrompt,
    tools,
    model: 'auto',
    reasoning: 'リクエスト内容から自動判定',
  }
}

// AgentInputに変換
export function toAgentInput(config: GeneratedAgentConfig): AgentInput {
  return {
    name: config.name,
    description: config.description,
    category: config.category,
    systemPrompt: config.systemPrompt,
    tools: config.tools,
    model: config.model,
    isShared: false,
  }
}
