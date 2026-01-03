/**
 * Agent Dashboard 状態管理フック
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { saveAgentExecution, generateTaskSummary } from '@/lib/firestore-agent'
import type {
  OrchestrationPlan,
  AgentPlan,
  AgentExecution,
  ExecutionPhase,
} from '../types'

interface UseAgentDashboardReturn {
  // 状態
  taskInput: string
  setTaskInput: (value: string) => void
  isAnalyzing: boolean
  orchestrationPlan: OrchestrationPlan | null
  agentExecutions: Map<string, AgentExecution>
  executionPhase: ExecutionPhase
  integratedResult: string | null
  error: string | null

  // アクション
  executeTask: () => Promise<void>
  cancelExecution: () => void
  retryAgent: (agentName: string) => void
}

export function useAgentDashboard(): UseAgentDashboardReturn {
  const { user, profile } = useAuth()

  // 状態
  const [taskInput, setTaskInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [orchestrationPlan, setOrchestrationPlan] = useState<OrchestrationPlan | null>(null)
  const [agentExecutions, setAgentExecutions] = useState<Map<string, AgentExecution>>(new Map())
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>('idle')
  const [integratedResult, setIntegratedResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  // エージェント実行状態を更新
  const updateAgentExecution = useCallback((agentName: string, updates: Partial<AgentExecution>) => {
    setAgentExecutions(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(agentName)
      if (current) {
        newMap.set(agentName, { ...current, ...updates })
      }
      return newMap
    })
  }, [])

  // 単一エージェントを実行
  const executeAgent = useCallback(async (
    agent: AgentPlan,
    message: string,
    previousResults: Map<string, string>
  ): Promise<string> => {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    // 依存エージェントの結果をコンテキストに追加
    let dependencyContext = ''
    if (agent.dependsOn.length > 0) {
      dependencyContext = '\n\n【前段エージェントの結果】\n'
      agent.dependsOn.forEach(depName => {
        const result = previousResults.get(depName)
        if (result) {
          dependencyContext += `\n--- ${depName}の結果 ---\n${result}\n`
        }
      })
    }

    // ツール実行（Web検索など）
    let toolContext = ''

    if (agent.tools.includes('web_search')) {
      try {
        updateAgentExecution(agent.name, { currentStep: 'Web検索中...' })
        const response = await fetch('/api/web/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: message, maxResults: 3 }),
        })
        if (response.ok) {
          const data = await response.json()
          if (data.summary) {
            toolContext += `\n\n【Web検索結果】\n${data.summary}\n`
          }
        }
      } catch (e) {
        console.error('Web search failed:', e)
      }
    }

    // AIで応答生成
    updateAgentExecution(agent.name, { currentStep: '回答を生成中...' })

    const fullPrompt = `${agent.systemPrompt}

【ユーザーのリクエスト】
${message}
${dependencyContext}
${toolContext}

上記の情報を踏まえて、あなたの役割（${agent.role}）に基づいて回答してください。`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Agent execution failed: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }, [updateAgentExecution])

  // 結果を統合
  const synthesizeResults = useCallback(async (
    plan: OrchestrationPlan,
    results: Map<string, string>,
    originalMessage: string
  ): Promise<string> => {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    let allResults = ''
    plan.agents.forEach(agent => {
      const result = results.get(agent.name)
      if (result) {
        allResults += `\n\n## ${agent.name}（${agent.role}）の結果\n${result}`
      }
    })

    const synthesisPrompt = `あなたは複数のAIエージェントの結果を統合する役割です。

【元のリクエスト】
${originalMessage}

【各エージェントの結果】
${allResults}

【統合の指示】
${plan.synthesisPrompt || '上記の結果を統合し、ユーザーにとって分かりやすい形でまとめてください。'}

重複を排除し、論理的な流れで最終的な回答を作成してください。`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: synthesisPrompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 8000,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Synthesis failed: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }, [])

  // タスク実行
  const executeTask = useCallback(async () => {
    if (!taskInput.trim()) return

    setError(null)
    setIsAnalyzing(true)
    setOrchestrationPlan(null)
    setAgentExecutions(new Map())
    setIntegratedResult(null)
    setExecutionPhase('analyzing')

    abortControllerRef.current = new AbortController()

    try {
      // 1. オーケストレーション
      const orchestrateResponse = await fetch('/api/agent/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: taskInput,
          userId: user?.uid,
          companyId: profile?.companyId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!orchestrateResponse.ok) {
        throw new Error('オーケストレーションに失敗しました')
      }

      const { plan } = await orchestrateResponse.json()
      setOrchestrationPlan(plan)
      setIsAnalyzing(false)

      // エージェント実行状態を初期化
      const initialExecutions = new Map<string, AgentExecution>()
      plan.agents.forEach((agent: AgentPlan) => {
        initialExecutions.set(agent.name, {
          id: `${agent.name}-${Date.now()}`,
          agentName: agent.name,
          agentRole: agent.role,
          status: 'pending',
          currentStep: null,
          result: null,
          citations: [],
          toolResults: [],
          startedAt: null,
          completedAt: null,
          error: null,
        })
      })
      setAgentExecutions(initialExecutions)

      // 2. エージェント実行
      setExecutionPhase('executing')
      const results = new Map<string, string>()
      const completedAgents = new Set<string>()

      // 優先度順にソート
      const sortedAgents = [...plan.agents].sort((a: AgentPlan, b: AgentPlan) => a.priority - b.priority)

      for (const agent of sortedAgents) {
        // 依存関係をチェック
        const dependenciesMet = agent.dependsOn.every((dep: string) => completedAgents.has(dep))
        if (!dependenciesMet) {
          // 依存が満たされるまで待機
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // 実行開始
        updateAgentExecution(agent.name, {
          status: 'running',
          startedAt: new Date(),
          currentStep: '開始中...',
        })

        try {
          const result = await executeAgent(agent, taskInput, results)
          results.set(agent.name, result)
          completedAgents.add(agent.name)

          updateAgentExecution(agent.name, {
            status: 'completed',
            result,
            completedAt: new Date(),
            currentStep: null,
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'エージェント実行エラー'
          updateAgentExecution(agent.name, {
            status: 'failed',
            error: errorMsg,
            currentStep: null,
          })
          console.error(`Agent ${agent.name} failed:`, err)
        }
      }

      // 3. 結果統合
      setExecutionPhase('synthesizing')

      let finalIntegratedResult: string
      if (plan.agents.length === 1) {
        finalIntegratedResult = results.get(plan.agents[0].name) || ''
      } else {
        finalIntegratedResult = await synthesizeResults(plan, results, taskInput)
      }
      setIntegratedResult(finalIntegratedResult)

      setExecutionPhase('complete')

      // Firestoreに履歴を保存
      try {
        const agentResultsForSave = plan.agents.map((agent: AgentPlan) => ({
          agentName: agent.name,
          status: completedAgents.has(agent.name) ? 'completed' as const : 'failed' as const,
          result: results.get(agent.name) || undefined,
        }))

        await saveAgentExecution({
          userId: user?.uid || '',
          companyId: profile?.companyId,
          taskInput,
          taskSummary: generateTaskSummary(taskInput),
          orchestrationPlan: {
            taskAnalysis: plan.taskAnalysis,
            complexity: plan.complexity,
            agents: plan.agents.map((a: AgentPlan) => ({
              name: a.name,
              role: a.role,
              tools: a.tools,
            })),
          },
          agentResults: agentResultsForSave,
          integratedResult: finalIntegratedResult,
          status: agentResultsForSave.every((r: { status: 'completed' | 'failed' }) => r.status === 'completed') ? 'completed' : 'failed',
          completedAt: new Date(),
        })
      } catch (saveError) {
        console.error('Failed to save agent execution:', saveError)
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('実行がキャンセルされました')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
      }
      setIsAnalyzing(false)
      setExecutionPhase('idle')
    }
  }, [taskInput, user?.uid, profile?.companyId, executeAgent, synthesizeResults, updateAgentExecution])

  // キャンセル
  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setExecutionPhase('idle')
    setIsAnalyzing(false)
  }, [])

  // リトライ
  const retryAgent = useCallback(async (agentName: string) => {
    if (!orchestrationPlan) return

    const agent = orchestrationPlan.agents.find(a => a.name === agentName)
    if (!agent) return

    updateAgentExecution(agentName, {
      status: 'running',
      error: null,
      startedAt: new Date(),
      currentStep: '再実行中...',
    })

    try {
      // 既存の結果を取得
      const previousResults = new Map<string, string>()
      agentExecutions.forEach((exec, name) => {
        if (exec.status === 'completed' && exec.result) {
          previousResults.set(name, exec.result)
        }
      })

      const result = await executeAgent(agent, taskInput, previousResults)

      updateAgentExecution(agentName, {
        status: 'completed',
        result,
        completedAt: new Date(),
        currentStep: null,
      })

      // 統合結果を再生成
      const allResults = new Map<string, string>()
      agentExecutions.forEach((exec, name) => {
        if (name === agentName) {
          allResults.set(name, result)
        } else if (exec.status === 'completed' && exec.result) {
          allResults.set(name, exec.result)
        }
      })

      if (orchestrationPlan.agents.length > 1) {
        const synthesized = await synthesizeResults(orchestrationPlan, allResults, taskInput)
        setIntegratedResult(synthesized)
      } else {
        setIntegratedResult(result)
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'エージェント実行エラー'
      updateAgentExecution(agentName, {
        status: 'failed',
        error: errorMsg,
        currentStep: null,
      })
    }
  }, [orchestrationPlan, agentExecutions, taskInput, executeAgent, synthesizeResults, updateAgentExecution])

  return {
    taskInput,
    setTaskInput,
    isAnalyzing,
    orchestrationPlan,
    agentExecutions,
    executionPhase,
    integratedResult,
    error,
    executeTask,
    cancelExecution,
    retryAgent,
  }
}
