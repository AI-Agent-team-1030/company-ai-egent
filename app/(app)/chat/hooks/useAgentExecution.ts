'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Agent,
  AgentExecutionStep,
  AgentExecutionResult,
  AgentCitation,
  ToolExecutionResult,
  AgentSSEEventType,
} from '@/lib/types/agent'

interface UseAgentExecutionOptions {
  onToolResult?: (tool: string, results: unknown) => void
  onContentStream?: (text: string, isPartial: boolean) => void
  onComplete?: (result: AgentExecutionResult) => void
  onError?: (error: string) => void
}

interface UseAgentExecutionReturn {
  isExecuting: boolean
  currentStep: AgentExecutionStep | null
  stepMessage: string
  toolResults: ToolExecutionResult[]
  citations: AgentCitation[]
  response: string
  error: string | null
  executeAgent: (
    agent: Agent,
    message: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => Promise<AgentExecutionResult | null>
  cancelExecution: () => void
  reset: () => void
}

export function useAgentExecution(
  options: UseAgentExecutionOptions = {}
): UseAgentExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentStep, setCurrentStep] = useState<AgentExecutionStep | null>(null)
  const [stepMessage, setStepMessage] = useState('')
  const [toolResults, setToolResults] = useState<ToolExecutionResult[]>([])
  const [citations, setCitations] = useState<AgentCitation[]>([])
  const [response, setResponse] = useState('')
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    setIsExecuting(false)
    setCurrentStep(null)
    setStepMessage('')
    setToolResults([])
    setCitations([])
    setResponse('')
    setError(null)
  }, [])

  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsExecuting(false)
    setCurrentStep(null)
    setStepMessage('')
  }, [])

  const executeAgent = useCallback(
    async (
      agent: Agent,
      message: string,
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
    ): Promise<AgentExecutionResult | null> => {
      reset()
      setIsExecuting(true)

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/agent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            message,
            conversationHistory,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let finalResult: AgentExecutionResult | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            const jsonStr = line.slice(6)
            if (!jsonStr.trim()) continue

            try {
              const event: AgentSSEEventType = JSON.parse(jsonStr)

              switch (event.type) {
                case 'status':
                  setCurrentStep(event.step || null)
                  setStepMessage(event.message || '')
                  break

                case 'tool_result':
                  const toolResult: ToolExecutionResult = {
                    tool: event.tool,
                    status: event.status,
                    result: event.results,
                    error: event.error,
                    executionTimeMs: 0,
                  }
                  setToolResults(prev => [...prev, toolResult])
                  options.onToolResult?.(event.tool, event.results)
                  break

                case 'content':
                  setResponse(event.text)
                  options.onContentStream?.(event.text, event.isPartial)
                  break

                case 'complete':
                  finalResult = event.result
                  setCitations(event.result.citations || [])
                  options.onComplete?.(event.result)
                  break

                case 'error':
                  setError(event.error)
                  options.onError?.(event.error)
                  break
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError)
            }
          }
        }

        setIsExecuting(false)
        setCurrentStep(null)
        return finalResult
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('実行がキャンセルされました')
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          setError(errorMessage)
          options.onError?.(errorMessage)
        }
        setIsExecuting(false)
        setCurrentStep(null)
        return null
      }
    },
    [options, reset]
  )

  return {
    isExecuting,
    currentStep,
    stepMessage,
    toolResults,
    citations,
    response,
    error,
    executeAgent,
    cancelExecution,
    reset,
  }
}

// ============================================
// 並列実行フック
// ============================================

interface ParallelTask {
  agentId: string
  message: string
  priority?: number
}

interface ParallelTaskState {
  taskId: string
  agentId: string
  agentName: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  currentStep?: AgentExecutionStep
  result?: AgentExecutionResult
}

interface UseParallelAgentExecutionReturn {
  isExecuting: boolean
  tasks: ParallelTaskState[]
  results: AgentExecutionResult[]
  queueStatus: {
    total: number
    running: number
    pending: number
    completed: number
  }
  error: string | null
  executeParallel: (
    tasks: ParallelTask[],
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxConcurrent?: number
  ) => Promise<AgentExecutionResult[]>
  cancelExecution: () => void
  reset: () => void
}

export function useParallelAgentExecution(): UseParallelAgentExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false)
  const [tasks, setTasks] = useState<ParallelTaskState[]>([])
  const [results, setResults] = useState<AgentExecutionResult[]>([])
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    running: 0,
    pending: 0,
    completed: 0,
  })
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    setIsExecuting(false)
    setTasks([])
    setResults([])
    setQueueStatus({ total: 0, running: 0, pending: 0, completed: 0 })
    setError(null)
  }, [])

  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsExecuting(false)
  }, [])

  const executeParallel = useCallback(
    async (
      parallelTasks: ParallelTask[],
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
      maxConcurrent = 3
    ): Promise<AgentExecutionResult[]> => {
      reset()
      setIsExecuting(true)

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/agent/parallel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks: parallelTasks,
            conversationHistory,
            maxConcurrent,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        const finalResults: AgentExecutionResult[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            const jsonStr = line.slice(6)
            if (!jsonStr.trim()) continue

            try {
              const event = JSON.parse(jsonStr)

              switch (event.type) {
                case 'queue_status':
                  setQueueStatus({
                    total: event.total,
                    running: event.running,
                    pending: event.pending,
                    completed: event.completed || 0,
                  })
                  break

                case 'task_started':
                  setTasks(prev => [
                    ...prev,
                    {
                      taskId: event.taskId,
                      agentId: event.agentId,
                      agentName: event.agentName,
                      status: 'running',
                    },
                  ])
                  break

                case 'task_progress':
                  setTasks(prev =>
                    prev.map(t =>
                      t.taskId === event.taskId
                        ? { ...t, currentStep: event.step }
                        : t
                    )
                  )
                  break

                case 'task_completed':
                  setTasks(prev =>
                    prev.map(t =>
                      t.taskId === event.taskId
                        ? {
                            ...t,
                            status: event.result.status === 'completed' ? 'completed' : 'failed',
                            result: event.result,
                          }
                        : t
                    )
                  )
                  setResults(prev => [...prev, event.result])
                  break

                case 'all_completed':
                  finalResults.push(...event.results)
                  break

                case 'error':
                  setError(event.error)
                  break
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError)
            }
          }
        }

        setIsExecuting(false)
        return finalResults
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('実行がキャンセルされました')
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          setError(errorMessage)
        }
        setIsExecuting(false)
        return []
      }
    },
    [reset]
  )

  return {
    isExecuting,
    tasks,
    results,
    queueStatus,
    error,
    executeParallel,
    cancelExecution,
    reset,
  }
}

// ============================================
// 自動エージェント生成フック
// ============================================

// APIレスポンス型
interface GenerationResult {
  agent: Agent
  agentInput: {
    name: string
    description: string
    category: string
    systemPrompt: string
    tools: string[]
    model: string
    isShared: boolean
  }
  reasoning: string
  canSave: boolean
  generatedAt: number
}

interface UseAutoAgentRoutingOptions {
  userId?: string
  companyId?: string
  userName?: string
  onAgentGenerated?: (agent: Agent, reasoning: string) => void
  onError?: (error: string) => void
}

interface UseAutoAgentRoutingReturn {
  isRouting: boolean
  isSaving: boolean
  generatedAgent: Agent | null
  generationResult: GenerationResult | null
  error: string | null
  generateAgent: (message: string) => Promise<GenerationResult | null>
  saveGeneratedAgent: () => Promise<string | null>
  clearGenerated: () => void
}

export function useAutoAgentRouting(
  options: UseAutoAgentRoutingOptions = {}
): UseAutoAgentRoutingReturn {
  const [isRouting, setIsRouting] = useState(false)
  const [generatedAgent, setGeneratedAgent] = useState<Agent | null>(null)
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // optionsをrefで保持して最新の値を参照できるようにする
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  // メッセージからエージェントを生成
  const generateAgent = useCallback(
    async (message: string): Promise<GenerationResult | null> => {
      setIsRouting(true)
      setError(null)

      const currentOptions = optionsRef.current

      try {
        const response = await fetch('/api/agent/router', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            userId: currentOptions.userId,
            companyId: currentOptions.companyId,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`)
        }

        const result: GenerationResult = await response.json()

        setGenerationResult(result)
        setGeneratedAgent(result.agent)
        currentOptions.onAgentGenerated?.(result.agent, result.reasoning)

        setIsRouting(false)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'エージェント生成に失敗しました'
        setError(errorMessage)
        currentOptions.onError?.(errorMessage)
        setIsRouting(false)
        return null
      }
    },
    []
  )

  // 生成したエージェントを保存
  const saveGeneratedAgent = useCallback(async (): Promise<string | null> => {
    const currentOptions = optionsRef.current

    console.log('saveGeneratedAgent called:', {
      hasAgentInput: !!generationResult?.agentInput,
      userId: currentOptions.userId,
      companyId: currentOptions.companyId,
    })

    if (!generationResult?.agentInput) {
      setError('保存するエージェントがありません')
      console.error('No agent input to save')
      return null
    }

    if (!currentOptions.userId || !currentOptions.companyId) {
      setError('ユーザー情報が取得できません。再度ログインしてください。')
      console.error('Missing userId or companyId:', { userId: currentOptions.userId, companyId: currentOptions.companyId })
      return null
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/agent/router', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentInput: generationResult.agentInput,
          userId: currentOptions.userId,
          companyId: currentOptions.companyId,
          userName: currentOptions.userName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '保存に失敗しました')
      }

      console.log('Agent saved successfully:', data.agentId)
      setIsSaving(false)
      return data.agentId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存に失敗しました'
      setError(errorMessage)
      console.error('Save error:', errorMessage)
      setIsSaving(false)
      return null
    }
  }, [generationResult])

  // 生成結果をクリア
  const clearGenerated = useCallback(() => {
    setGeneratedAgent(null)
    setGenerationResult(null)
    setError(null)
  }, [])

  return {
    isRouting,
    isSaving,
    generatedAgent,
    generationResult,
    error,
    generateAgent,
    saveGeneratedAgent,
    clearGenerated,
  }
}
