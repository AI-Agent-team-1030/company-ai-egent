'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AgentTool } from '@/lib/types/agent'

// ============================================
// 型定義
// ============================================

interface AgentPlan {
  name: string
  role: string
  systemPrompt: string
  tools: AgentTool[]
  dependsOn: string[]
  priority: number
}

interface OrchestrationPlan {
  taskAnalysis: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: AgentPlan[]
  synthesisPrompt: string
}

interface AgentExecutionState {
  name: string
  role: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
  tools: AgentTool[]
}

interface UseMultiAgentOptions {
  userId?: string
  companyId?: string
  onPlanGenerated?: (plan: OrchestrationPlan) => void
  onAgentStart?: (agentName: string) => void
  onAgentComplete?: (agentName: string, result: string) => void
  onAllComplete?: (finalResult: string) => void
  onError?: (error: string) => void
}

interface UseMultiAgentReturn {
  isOrchestrating: boolean
  isExecuting: boolean
  plan: OrchestrationPlan | null
  agentStates: AgentExecutionState[]
  finalResult: string | null
  error: string | null
  execute: (message: string, context?: string) => Promise<string | null>
  reset: () => void
}

// ============================================
// フック実装
// ============================================

export function useMultiAgentExecution(
  options: UseMultiAgentOptions = {}
): UseMultiAgentReturn {
  const [isOrchestrating, setIsOrchestrating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [plan, setPlan] = useState<OrchestrationPlan | null>(null)
  const [agentStates, setAgentStates] = useState<AgentExecutionState[]>([])
  const [finalResult, setFinalResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const optionsRef = useRef(options)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsOrchestrating(false)
    setIsExecuting(false)
    setPlan(null)
    setAgentStates([])
    setFinalResult(null)
    setError(null)
  }, [])

  // エージェントを実行（ツールに基づいて検索を実行し、AIで応答生成）
  const executeAgent = useCallback(async (
    agent: AgentPlan,
    userMessage: string,
    previousResults: Record<string, string>
  ): Promise<string> => {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    // 依存エージェントの結果をコンテキストに追加
    let dependencyContext = ''
    if (agent.dependsOn.length > 0) {
      dependencyContext = '\n\n【前段エージェントの結果】\n'
      agent.dependsOn.forEach(depName => {
        if (previousResults[depName]) {
          dependencyContext += `\n--- ${depName}の結果 ---\n${previousResults[depName]}\n`
        }
      })
    }

    // ツールに基づいて検索を実行
    let toolContext = ''

    // Knowledge Search
    if (agent.tools.includes('knowledge_search')) {
      // 既存のナレッジ検索は useChat 経由で実行されるので、ここではスキップ
      // 実際の実装では別途APIを呼び出す
    }

    // Web Search
    if (agent.tools.includes('web_search')) {
      try {
        const response = await fetch('/api/web/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userMessage, maxResults: 3 }),
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
    const fullPrompt = `${agent.systemPrompt}

【ユーザーのリクエスト】
${userMessage}
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
  }, [])

  // 結果を統合
  const synthesizeResults = useCallback(async (
    orchestrationPlan: OrchestrationPlan,
    results: Record<string, string>,
    userMessage: string
  ): Promise<string> => {
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

    let allResults = ''
    orchestrationPlan.agents.forEach(agent => {
      if (results[agent.name]) {
        allResults += `\n\n## ${agent.name}（${agent.role}）の結果\n${results[agent.name]}`
      }
    })

    const synthesisPrompt = `あなたは複数のAIエージェントの結果を統合する役割です。

【元のリクエスト】
${userMessage}

【各エージェントの結果】
${allResults}

【統合の指示】
${orchestrationPlan.synthesisPrompt || '上記の結果を統合し、ユーザーにとって分かりやすい形でまとめてください。'}

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

  // メイン実行関数
  const execute = useCallback(async (
    message: string,
    context?: string
  ): Promise<string | null> => {
    reset()
    setIsOrchestrating(true)

    abortControllerRef.current = new AbortController()
    const currentOptions = optionsRef.current

    try {
      // 1. オーケストレーションプランを取得
      const orchestrateResponse = await fetch('/api/agent/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: currentOptions.userId,
          companyId: currentOptions.companyId,
          conversationContext: context,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!orchestrateResponse.ok) {
        throw new Error('オーケストレーションに失敗しました')
      }

      const { plan: orchestrationPlan } = await orchestrateResponse.json()
      setPlan(orchestrationPlan)
      currentOptions.onPlanGenerated?.(orchestrationPlan)

      console.log('Orchestration plan:', orchestrationPlan.complexity, orchestrationPlan.agents.length, 'agents')

      // エージェント状態を初期化
      const initialStates: AgentExecutionState[] = orchestrationPlan.agents.map((agent: AgentPlan) => ({
        name: agent.name,
        role: agent.role,
        status: 'pending' as const,
        tools: agent.tools,
      }))
      setAgentStates(initialStates)

      setIsOrchestrating(false)
      setIsExecuting(true)

      // 2. エージェントを実行
      const results: Record<string, string> = {}
      const completedAgents = new Set<string>()

      // 優先度順にソート
      const sortedAgents = [...orchestrationPlan.agents].sort((a: AgentPlan, b: AgentPlan) => a.priority - b.priority)

      for (const agent of sortedAgents) {
        // 依存関係をチェック
        const dependenciesMet = agent.dependsOn.every((dep: string) => completedAgents.has(dep))
        if (!dependenciesMet) {
          // 依存が満たされるまで待機（簡易実装）
          console.log(`Waiting for dependencies: ${agent.dependsOn.join(', ')}`)
        }

        // 状態を更新
        setAgentStates(prev => prev.map(s =>
          s.name === agent.name ? { ...s, status: 'running' as const } : s
        ))
        currentOptions.onAgentStart?.(agent.name)

        try {
          const result = await executeAgent(agent, message, results)
          results[agent.name] = result
          completedAgents.add(agent.name)

          setAgentStates(prev => prev.map(s =>
            s.name === agent.name ? { ...s, status: 'completed' as const, result } : s
          ))
          currentOptions.onAgentComplete?.(agent.name, result)
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'エージェント実行エラー'
          setAgentStates(prev => prev.map(s =>
            s.name === agent.name ? { ...s, status: 'failed' as const, error: errorMsg } : s
          ))
          console.error(`Agent ${agent.name} failed:`, err)
        }
      }

      // 3. 結果を統合（複数エージェントの場合）
      let finalOutput: string
      if (orchestrationPlan.agents.length === 1) {
        finalOutput = results[orchestrationPlan.agents[0].name] || ''
      } else {
        finalOutput = await synthesizeResults(orchestrationPlan, results, message)
      }

      setFinalResult(finalOutput)
      setIsExecuting(false)
      currentOptions.onAllComplete?.(finalOutput)

      return finalOutput
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('実行がキャンセルされました')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        currentOptions.onError?.(errorMessage)
      }
      setIsOrchestrating(false)
      setIsExecuting(false)
      return null
    }
  }, [reset, executeAgent, synthesizeResults])

  return {
    isOrchestrating,
    isExecuting,
    plan,
    agentStates,
    finalResult,
    error,
    execute,
    reset,
  }
}
