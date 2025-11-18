import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { goal, details } = await req.json()

    if (!goal) {
      return NextResponse.json(
        { error: 'ゴールを入力してください' },
        { status: 400 }
      )
    }

    // プロンプト構築
    let prompt = `ゴール: ${goal}\n\n`

    if (details) {
      if (details.deadline) prompt += `期限: ${details.deadline}\n`
      if (details.budget) prompt += `予算: ${details.budget}\n`
      if (details.current_situation) prompt += `現状: ${details.current_situation}\n`
      if (details.priority) prompt += `優先事項: ${details.priority}\n`
      prompt += '\n'
    }

    prompt += `上記のゴールを達成するための、具体的なタスクリストをJSON形式で生成してください。`

    // Claude API呼び出し
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `あなたはタスク分解のエキスパートAIエージェントです。

ユーザーのゴールを受け取り、実行可能な具体的タスクリストに分解してください。

以下のJSON形式で返してください：
{
  "goal": "ゴール",
  "summary": "戦略の概要",
  "categories": [
    {
      "name": "カテゴリ名",
      "description": "このカテゴリの説明",
      "tasks": [
        {
          "id": 1,
          "title": "タスク名",
          "description": "詳細説明",
          "priority": "high/medium/low",
          "estimated_time": "推定時間",
          "responsible": "担当者・部門"
        }
      ]
    }
  ],
  "total_tasks": 20,
  "estimated_duration": "全体の推定期間"
}

重要なポイント:
1. タスクは具体的で実行可能なものにする
2. 優先順位を明確にする
3. カテゴリ分けして整理する
4. 各タスクに推定時間を付ける
5. 全体で20-30個のタスクを生成する
6. 必ずJSONのみを返す（説明文は不要）`,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // レスポンス解析
    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    // JSONパース
    let jsonStr = content
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim()
    } else if (content.includes('```')) {
      jsonStr = content.split('```')[1].split('```')[0].trim()
    }

    const taskList = JSON.parse(jsonStr)

    return NextResponse.json(taskList)
  } catch (error) {
    console.error('Error generating tasks:', error)
    return NextResponse.json(
      { error: 'タスク生成に失敗しました' },
      { status: 500 }
    )
  }
}
