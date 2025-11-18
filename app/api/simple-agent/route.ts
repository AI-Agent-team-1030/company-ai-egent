import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface AgentResult {
  agent: string
  result: string
}

export async function POST(req: NextRequest) {
  try {
    const { goal } = await req.json()

    if (!goal) {
      return NextResponse.json(
        { error: 'ゴールを入力してください' },
        { status: 400 }
      )
    }

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // ストリーミングレスポンスを非同期で処理
    ;(async () => {
      try {
        const steps = [
          { name: '統括エージェント', status: 'pending' as const },
          { name: '市場調査エージェント', status: 'pending' as const },
          { name: '競合調査エージェント', status: 'pending' as const },
          { name: '戦略立案エージェント', status: 'pending' as const },
          { name: 'レポート統合エージェント', status: 'pending' as const },
        ]

        // 初期状態を送信
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const agentResults: AgentResult[] = []

        // ステップ1: 統括エージェント
        steps[0].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const coordinatorResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `あなたは統括AIエージェントです。
ユーザーのゴールを分析し、どのような調査が必要かを判断してください。

以下の3つのエージェントに指示を出します：
1. 市場調査エージェント
2. 競合調査エージェント
3. 戦略立案エージェント

各エージェントへの指示を簡潔に記述してください。`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n\n各エージェントへの指示を出してください。`,
            },
          ],
        })

        const coordinatorText = coordinatorResult.content[0].type === 'text'
          ? coordinatorResult.content[0].text
          : ''

        agentResults.push({
          agent: '統括エージェント',
          result: coordinatorText,
        })

        steps[0].status = 'completed'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps, agent: '統括エージェント', result: coordinatorText })}\n\n`)
        )

        // ステップ2 & 3: 市場調査と競合調査を並列実行（高速化）
        steps[1].status = 'running'
        steps[2].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const [marketResult, competitorResult] = await Promise.all([
          anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `あなたは市場調査の専門AIエージェントです。
与えられたゴールに対して、市場の状況を調査・分析してください。

以下の観点で調査してください：
- 市場規模
- 成長性
- 主要なトレンド
- 市場機会`,
            messages: [
              {
                role: 'user',
                content: `ゴール: ${goal}\n\n統括エージェントからの指示:\n${coordinatorText}\n\n市場調査を実施してください。`,
              },
            ],
          }),
          anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `あなたは競合分析の専門AIエージェントです。
与えられたゴールに対して、競合の状況を調査・分析してください。

以下の観点で調査してください：
- 主要な競合企業
- 各社の強み・弱み
- 差別化ポイント
- 市場での位置づけ`,
            messages: [
              {
                role: 'user',
                content: `ゴール: ${goal}\n\n統括エージェントからの指示:\n${coordinatorText}\n\n競合調査を実施してください。`,
              },
            ],
          })
        ])

        const marketText = marketResult.content[0].type === 'text'
          ? marketResult.content[0].text
          : ''

        const competitorText = competitorResult.content[0].type === 'text'
          ? competitorResult.content[0].text
          : ''

        agentResults.push({
          agent: '市場調査エージェント',
          result: marketText,
        })

        agentResults.push({
          agent: '競合調査エージェント',
          result: competitorText,
        })

        steps[1].status = 'completed'
        steps[2].status = 'completed'
        // 市場調査と競合調査の結果を個別に送信
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps, agent: '市場調査エージェント', result: marketText })}\n\n`)
        )
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps, agent: '競合調査エージェント', result: competitorText })}\n\n`)
        )

        // ステップ4: 戦略立案エージェント
        steps[3].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const strategyResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: `あなたは戦略立案の専門AIエージェントです。
市場調査と競合調査の結果を踏まえて、具体的な戦略を立案してください。

以下の観点で戦略を立ててください：
- 推奨アクション（3-5個）
- 差別化戦略
- 実施優先度
- 期待される成果`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n\n市場調査結果:\n${marketText}\n\n競合調査結果:\n${competitorText}\n\n戦略を立案してください。`,
            },
          ],
        })

        const strategyText = strategyResult.content[0].type === 'text'
          ? strategyResult.content[0].text
          : ''

        agentResults.push({
          agent: '戦略立案エージェント',
          result: strategyText,
        })

        steps[3].status = 'completed'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps, agent: '戦略立案エージェント', result: strategyText })}\n\n`)
        )

        // ステップ5: レポート統合エージェント
        steps[4].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const reportResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `あなたはレポート統合の専門AIエージェントです。
複数のエージェントから得られた情報を統合し、包括的な最終レポートを作成してください。

レポートの構成：
1. エグゼクティブサマリー（要約）
2. 市場分析の要点
3. 競合分析の要点
4. 推奨戦略
5. 次のステップ

読みやすく、実行可能な内容にしてください。`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n\n統括エージェント:\n${coordinatorText}\n\n市場調査エージェント:\n${marketText}\n\n競合調査エージェント:\n${competitorText}\n\n戦略立案エージェント:\n${strategyText}\n\n最終レポートを作成してください。`,
            },
          ],
        })

        const reportText = reportResult.content[0].type === 'text'
          ? reportResult.content[0].text
          : ''

        agentResults.push({
          agent: 'レポート統合エージェント',
          result: reportText,
        })

        steps[4].status = 'completed'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps, agent: 'レポート統合エージェント', result: reportText })}\n\n`)
        )

        // 最終結果を送信
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'complete',
            agentResults,
            finalReport: reportText
          })}\n\n`)
        )
      } catch (error) {
        console.error('Error in agent execution:', error)
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'エージェント実行中にエラーが発生しました' })}\n\n`)
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
    console.error('Error in simple agent:', error)
    return NextResponse.json(
      { error: 'エージェント実行に失敗しました' },
      { status: 500 }
    )
  }
}
