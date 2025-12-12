import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/api-auth'
import { checkStrictRateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const dynamic = 'force-dynamic'

interface AnalysisStep {
  step: number
  name: string
  status: 'pending' | 'running' | 'completed'
  result?: any
}

export async function POST(req: NextRequest) {
  // Rate Limitチェック
  const rateLimit = checkStrictRateLimit(req)
  if (!rateLimit.allowed) return rateLimit.error

  // 認証チェック
  const auth = await requireAuth(req)
  if (!auth.authorized) return auth.error

  try {
    const { goal, industry, targetMarket } = await req.json()

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
        const steps: AnalysisStep[] = [
          { step: 1, name: '市場規模調査', status: 'pending' },
          { step: 2, name: '競合分析', status: 'pending' },
          { step: 3, name: 'トレンド分析', status: 'pending' },
          { step: 4, name: 'SWOT分析', status: 'pending' },
          { step: 5, name: '推奨施策の提案', status: 'pending' },
          { step: 6, name: '実行可能タスクへ分解', status: 'pending' },
        ]

        // 初期状態を送信
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        let fullAnalysis = {
          goal,
          industry: industry || '未指定',
          targetMarket: targetMarket || '未指定',
          marketSize: '',
          competitors: '',
          trends: '',
          swot: '',
          recommendations: '',
          tasks: [],
        }

        // ステップ1: 市場規模調査
        steps[0].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const marketSizeResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `あなたは市場調査の専門家です。与えられたゴールに対して、市場規模を分析してください。

以下の形式でJSON出力してください：
{
  "marketSize": "市場規模の推定値（金額）",
  "growthRate": "年間成長率",
  "marketTrends": "主要なトレンド",
  "opportunities": "市場機会"
}`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n業界: ${industry || '未指定'}\nターゲット市場: ${targetMarket || '未指定'}\n\n市場規模を分析してください。`,
            },
          ],
        })

        const marketSizeText = marketSizeResult.content[0].type === 'text' ? marketSizeResult.content[0].text : ''
        let marketSizeData = JSON.parse(marketSizeText.includes('```') ? marketSizeText.split('```json')[1].split('```')[0].trim() : marketSizeText)
        fullAnalysis.marketSize = JSON.stringify(marketSizeData, null, 2)

        steps[0].status = 'completed'
        steps[0].result = marketSizeData
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        // ステップ2: 競合分析
        steps[1].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const competitorResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `あなたは競合分析の専門家です。主要な競合企業を3-5社ピックアップし、分析してください。

以下の形式でJSON出力してください：
{
  "competitors": [
    {
      "name": "企業名",
      "strengths": "強み",
      "weaknesses": "弱み",
      "marketShare": "市場シェア推定"
    }
  ],
  "competitiveAdvantage": "差別化のポイント"
}`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n業界: ${industry || '未指定'}\n\n競合企業を分析してください。`,
            },
          ],
        })

        const competitorText = competitorResult.content[0].type === 'text' ? competitorResult.content[0].text : ''
        let competitorData = JSON.parse(competitorText.includes('```') ? competitorText.split('```json')[1].split('```')[0].trim() : competitorText)
        fullAnalysis.competitors = JSON.stringify(competitorData, null, 2)

        steps[1].status = 'completed'
        steps[1].result = competitorData
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        // ステップ3: トレンド分析
        steps[2].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const trendResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `あなたは市場トレンド分析の専門家です。最新のトレンドと今後の予測を分析してください。

以下の形式でJSON出力してください：
{
  "currentTrends": ["トレンド1", "トレンド2", "トレンド3"],
  "emergingTrends": ["新興トレンド1", "新興トレンド2"],
  "threats": ["脅威1", "脅威2"],
  "forecast": "今後3-5年の予測"
}`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n業界: ${industry || '未指定'}\n\nトレンドを分析してください。`,
            },
          ],
        })

        const trendText = trendResult.content[0].type === 'text' ? trendResult.content[0].text : ''
        let trendData = JSON.parse(trendText.includes('```') ? trendText.split('```json')[1].split('```')[0].trim() : trendText)
        fullAnalysis.trends = JSON.stringify(trendData, null, 2)

        steps[2].status = 'completed'
        steps[2].result = trendData
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        // ステップ4: SWOT分析
        steps[3].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const swotResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `あなたはビジネス戦略の専門家です。SWOT分析を実施してください。

以下の形式でJSON出力してください：
{
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["弱み1", "弱み2", "弱み3"],
  "opportunities": ["機会1", "機会2", "機会3"],
  "threats": ["脅威1", "脅威2", "脅威3"]
}`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n市場データ: ${fullAnalysis.marketSize}\n競合データ: ${fullAnalysis.competitors}\n\nSWOT分析を実施してください。`,
            },
          ],
        })

        const swotText = swotResult.content[0].type === 'text' ? swotResult.content[0].text : ''
        let swotData = JSON.parse(swotText.includes('```') ? swotText.split('```json')[1].split('```')[0].trim() : swotText)
        fullAnalysis.swot = JSON.stringify(swotData, null, 2)

        steps[3].status = 'completed'
        steps[3].result = swotData
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        // ステップ5: 推奨施策
        steps[4].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const recommendationResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `あなたは戦略コンサルタントです。分析結果を基に推奨施策を提案してください。

以下の形式でJSON出力してください：
{
  "strategy": "全体戦略",
  "keyActions": ["施策1", "施策2", "施策3", "施策4", "施策5"],
  "expectedOutcomes": "期待される成果",
  "timeline": "実施期間の目安"
}`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\nSWOT分析: ${fullAnalysis.swot}\n\n推奨施策を提案してください。`,
            },
          ],
        })

        const recommendationText = recommendationResult.content[0].type === 'text' ? recommendationResult.content[0].text : ''
        let recommendationData = JSON.parse(recommendationText.includes('```') ? recommendationText.split('```json')[1].split('```')[0].trim() : recommendationText)
        fullAnalysis.recommendations = JSON.stringify(recommendationData, null, 2)

        steps[4].status = 'completed'
        steps[4].result = recommendationData
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        // ステップ6: タスク分解
        steps[5].status = 'running'
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        const taskResult = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          system: `あなたはプロジェクトマネージャーです。推奨施策を実行可能なタスクに分解してください。

以下の形式でJSON出力してください：
{
  "categories": [
    {
      "name": "カテゴリ名",
      "tasks": [
        {
          "id": 1,
          "title": "タスク名",
          "description": "詳細",
          "priority": "high/medium/low",
          "estimatedTime": "推定時間",
          "responsible": "担当"
        }
      ]
    }
  ],
  "totalTasks": 15
}`,
          messages: [
            {
              role: 'user',
              content: `ゴール: ${goal}\n推奨施策: ${fullAnalysis.recommendations}\n\nタスクに分解してください。`,
            },
          ],
        })

        const taskText = taskResult.content[0].type === 'text' ? taskResult.content[0].text : ''
        let taskData = JSON.parse(taskText.includes('```') ? taskText.split('```json')[1].split('```')[0].trim() : taskText)
        fullAnalysis.tasks = taskData.categories

        steps[5].status = 'completed'
        steps[5].result = taskData
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
        )

        // 最終結果を送信
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', analysis: fullAnalysis })}\n\n`)
        )
      } catch (error) {
        console.error('Error in market analysis:', error)
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: '分析中にエラーが発生しました' })}\n\n`)
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
    console.error('Error in market analysis:', error)
    return NextResponse.json(
      { error: '分析に失敗しました' },
      { status: 500 }
    )
  }
}
