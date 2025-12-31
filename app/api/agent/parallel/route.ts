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
  AgentParallelRequest,
  AgentExecutionResult,
  ToolExecutionResult,
} from '@/lib/types/agent'

export const dynamic = 'force-dynamic'

const DEFAULT_MAX_CONCURRENT = 3
const DEFAULT_TIMEOUT_MS = 60000

export async function POST(req: NextRequest) {
  // Rate Limitチェック
  const rateLimit = checkStrictRateLimit(req)
  if (!rateLimit.allowed) return rateLimit.error

  // 認証チェック
  const auth = await requireFirebaseAuth(req)
  if (!auth.authorized) return auth.error!

  try {
    const body: AgentParallelRequest = await req.json()
    const { tasks, maxConcurrent = DEFAULT_MAX_CONCURRENT, conversationHistory } = body

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: 'At least one task is required' },
        { status: 400 }
      )
    }

    const userId = auth.userId || ''
    const companyId = auth.companyId || ''

    // SSEストリーム準備
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // 非同期で並列実行
    ;(async () => {
      try {
        const startTime = Date.now()
        const results: AgentExecutionResult[] = []
        let runningCount = 0
        let completedCount = 0
        const taskQueue = [...tasks]

        // キュー状態を送信
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'queue_status',
            total: tasks.length,
            running: 0,
            pending: tasks.length,
            completed: 0,
            timestamp: Date.now(),
          })}\n\n`)
        )

        // タスク実行関数
        const executeTask = async (
          taskIndex: number,
          agentId: string,
          message: string,
          priority: number
        ): Promise<AgentExecutionResult> => {
          const taskId = `task_${taskIndex}_${Date.now()}`
          const taskStartedAt = new Date()

          // エージェント取得
          const agent = await getAgentById(agentId, userId, companyId)
          if (!agent) {
            return {
              taskId,
              agentId,
              agentName: 'Unknown',
              status: 'failed',
              error: 'Agent not found',
              startedAt: taskStartedAt,
              completedAt: new Date(),
            }
          }

          // タスク開始を通知
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({
              type: 'task_started',
              taskId,
              agentId: agent.id,
              agentName: agent.name,
              timestamp: Date.now(),
            })}\n\n`)
          )

          try {
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
            for (const tool of agent.tools) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'task_progress',
                  taskId,
                  step: `${tool}_searching`,
                  timestamp: Date.now(),
                })}\n\n`)
              )

              const result = await executeTool(tool, toolContext)
              toolResults.push(result)
            }

            // 引用情報を抽出
            const citations = extractCitationsFromToolResults(toolResults)

            // AI応答生成
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({
                type: 'task_progress',
                taskId,
                step: 'generating',
                timestamp: Date.now(),
              })}\n\n`)
            )

            const response = await generateAgentResponse(
              agent.systemPrompt,
              message,
              citations,
              conversationHistory
            )

            return {
              taskId,
              agentId: agent.id,
              agentName: agent.name,
              status: 'completed',
              response,
              citations,
              toolResults,
              startedAt: taskStartedAt,
              completedAt: new Date(),
            }
          } catch (error) {
            return {
              taskId,
              agentId: agent.id,
              agentName: agent.name,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
              startedAt: taskStartedAt,
              completedAt: new Date(),
            }
          }
        }

        // 並列実行ループ
        const runningTasks: Promise<void>[] = []

        const processNextTask = async () => {
          while (taskQueue.length > 0 && runningCount < maxConcurrent) {
            const task = taskQueue.shift()
            if (!task) break

            const taskIndex = tasks.indexOf(task)
            runningCount++

            // キュー状態を更新
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({
                type: 'queue_status',
                total: tasks.length,
                running: runningCount,
                pending: taskQueue.length,
                completed: completedCount,
                timestamp: Date.now(),
              })}\n\n`)
            )

            const taskPromise = (async () => {
              const result = await executeTask(
                taskIndex,
                task.agentId,
                task.message,
                task.priority || 0
              )

              results.push(result)
              runningCount--
              completedCount++

              // タスク完了を通知
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'task_completed',
                  taskId: result.taskId,
                  result,
                  timestamp: Date.now(),
                })}\n\n`)
              )

              // 次のタスクを開始
              await processNextTask()
            })()

            runningTasks.push(taskPromise)
          }
        }

        // 初期タスクを開始
        await processNextTask()

        // 全タスク完了を待機
        await Promise.all(runningTasks)

        // 全完了を通知
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({
            type: 'all_completed',
            results,
            totalTimeMs: Date.now() - startTime,
            timestamp: Date.now(),
          })}\n\n`)
        )
      } catch (error) {
        apiLogger.error('Parallel execution error:', error)
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
    apiLogger.error('Agent parallel route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// ヘルパー関数
// ============================================

async function generateAgentResponse(
  systemPrompt: string,
  message: string,
  citations: Array<{ title: string; content: string }>,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  // コンテキストを構築
  let contextSection = ''
  if (citations.length > 0) {
    contextSection = '\n\n## 参考情報\n'
    citations.forEach((citation, i) => {
      contextSection += `### ${i + 1}. ${citation.title}\n${citation.content}\n\n`
    })
  }

  const fullSystemPrompt = systemPrompt + contextSection

  const contents = [
    ...(conversationHistory || []).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: fullSystemPrompt }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
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
