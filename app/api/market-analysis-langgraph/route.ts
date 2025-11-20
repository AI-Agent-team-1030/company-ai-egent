import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

type StepStatus = 'pending' | 'running' | 'completed'

interface Step {
  step: number
  name: string
  status: StepStatus
}

export async function POST(req: NextRequest) {
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

    // Pythonスクリプトのパス
    const scriptPath = path.join(
      process.cwd(),
      'langgraph-agent-demo',
      'market_analysis_cli.py'
    )

    // ストリーミングレスポンスを非同期で処理
    ;(async () => {
      try {
        const steps: Step[] = [
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

        // Pythonプロセスを起動
        const python = spawn('python3', [
          scriptPath,
          goal,
          industry || '',
          targetMarket || '',
        ])

        let stdoutData = ''
        let stderrData = ''

        // ステップ進捗をシミュレート
        const stepInterval = setInterval(async () => {
          const pendingStep = steps.find((s) => s.status === 'pending')
          if (pendingStep) {
            pendingStep.status = 'running'
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
            )

            // 少し待ってから完了にする
            setTimeout(async () => {
              pendingStep.status = 'completed'
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
              )
            }, 3000)
          }
        }, 5000)

        // 標準出力を収集
        python.stdout.on('data', (data) => {
          stdoutData += data.toString()
        })

        // エラー出力を収集
        python.stderr.on('data', (data) => {
          stderrData += data.toString()
          console.error('Python stderr:', data.toString())
        })

        // プロセス終了時の処理
        await new Promise<void>((resolve, reject) => {
          python.on('close', (code) => {
            clearInterval(stepInterval)

            if (code !== 0) {
              console.error('Python process exited with code:', code)
              console.error('stderr:', stderrData)
              reject(new Error(`Pythonプロセスがエラーで終了しました（コード: ${code}）`))
              return
            }

            try {
              // JSON出力をパース
              const result = JSON.parse(stdoutData)

              // 全ステップを完了にする
              steps.forEach((s) => (s.status = 'completed'))
              writer.write(
                encoder.encode(`data: ${JSON.stringify({ type: 'steps', steps })}\n\n`)
              )

              // 最終結果を送信
              const analysis = {
                goal: result.goal,
                industry: result.industry,
                targetMarket: result.target_market,
                marketSize: JSON.stringify(result.market_size, null, 2),
                competitors: JSON.stringify(result.competitors, null, 2),
                trends: JSON.stringify(result.trends, null, 2),
                swot: JSON.stringify(result.swot, null, 2),
                recommendations: JSON.stringify(result.recommendations, null, 2),
                tasks: result.tasks.categories || [],
              }

              writer.write(
                encoder.encode(`data: ${JSON.stringify({ type: 'complete', analysis })}\n\n`)
              )

              resolve()
            } catch (error) {
              console.error('JSON parse error:', error)
              console.error('stdout:', stdoutData)
              reject(new Error('結果のパースに失敗しました'))
            }
          })

          python.on('error', (error) => {
            clearInterval(stepInterval)
            console.error('Python process error:', error)
            reject(error)
          })
        })
      } catch (error) {
        console.error('Error in market analysis:', error)
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : '分析中にエラーが発生しました',
            })}\n\n`
          )
        )
      } finally {
        await writer.close()
      }
    })()

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in market analysis:', error)
    return NextResponse.json({ error: '分析に失敗しました' }, { status: 500 })
  }
}
