/**
 * チャットページ
 *
 * AIアシスタントとの対話画面
 * マルチエージェントオーケストレーション対応
 */

'use client'

import { Suspense, useCallback, useState } from 'react'
import { ALL_MODELS } from '@/lib/ai-providers'
import { useChat } from './hooks'
import {
  ChatHeader,
  MessageList,
  ChatInput,
  AlternativeSwitcher,
  AgentExecutionPanel,
} from './components'
import type { AgentTool } from '@/lib/types/agent'

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

interface AgentState {
  name: string
  role: string
  status: 'creating' | 'ready' | 'running' | 'completed' | 'failed'
  tools: AgentTool[]
}

function ChatContent() {
  const {
    // State
    messages,
    input,
    setInput,
    isProcessing,
    processingStep,
    error,
    isKnowledgeSearchEnabled,
    setIsKnowledgeSearchEnabled,
    currentAiMessageId,
    setCurrentAiMessageId,
    isTyping,
    selectedModel,
    setSelectedModel,
    apiKeys,
    companyDriveConnection,
    companyId,
    userId,
    isSavingToKnowledge,
    knowledgeSaveSuccess,

    // Actions
    handleSend: originalHandleSend,
    handleStopTyping,
    switchAlternative,
    regenerateResponse,
    saveConversationAsKnowledge,
  } = useChat()

  // エージェント状態管理
  const [isOrchestrating, setIsOrchestrating] = useState(false)
  const [orchestrationPlan, setOrchestrationPlan] = useState<OrchestrationPlan | null>(null)
  const [agentStates, setAgentStates] = useState<AgentState[]>([])
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'analyzing' | 'creating' | 'executing' | 'complete'>('idle')

  // 送信ハンドラー（マルチエージェント対応）
  const handleSend = useCallback(async () => {
    if (!input.trim()) return

    // フェーズ1: タスク分析中
    setCurrentPhase('analyzing')
    setIsOrchestrating(true)
    setOrchestrationPlan(null)
    setAgentStates([])

    try {
      // マルチエージェントでオーケストレーション
      const orchestrateResponse = await fetch('/api/agent/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          userId,
          companyId,
        }),
      })

      if (orchestrateResponse.ok) {
        const { plan } = await orchestrateResponse.json()
        setOrchestrationPlan(plan)

        // フェーズ2: エージェント作成中
        setCurrentPhase('creating')

        // エージェントを順次「作成」するアニメーション
        const agents: AgentState[] = plan.agents.map((agent: AgentPlan) => ({
          name: agent.name,
          role: agent.role,
          status: 'creating' as const,
          tools: agent.tools,
        }))

        for (let i = 0; i < agents.length; i++) {
          setAgentStates([...agents.slice(0, i + 1)])
          await new Promise(resolve => setTimeout(resolve, 300))
          agents[i].status = 'ready'
          setAgentStates([...agents])
        }

        // フェーズ3: 実行中
        setCurrentPhase('executing')

        // 全エージェントを「実行中」に
        agents.forEach(a => a.status = 'running')
        setAgentStates([...agents])

        // 全エージェントのツールを集約
        const allTools = new Set<string>()
        plan.agents.forEach((agent: { tools: string[] }) => {
          agent.tools.forEach((tool: string) => allTools.add(tool))
        })

        // システムプロンプトを生成
        let systemPrompt: string
        if (plan.complexity === 'simple' && plan.agents.length === 1) {
          systemPrompt = plan.agents[0].systemPrompt
        } else {
          const agentDescriptions = plan.agents
            .map((a: { name: string; role: string }) => `- ${a.name}: ${a.role}`)
            .join('\n')

          systemPrompt = `あなたは複数の専門家の知見を統合するAIです。

【タスク分析】
${plan.taskAnalysis}

【動員されたエージェント】
${agentDescriptions}

【指示】
上記の専門家の視点を統合し、ユーザーのリクエストに対して包括的に回答してください。
各専門分野の知見をバランスよく取り入れ、実用的な回答を心がけてください。`
        }

        setIsOrchestrating(false)

        // エージェントのsystemPromptとtoolsを渡して送信
        originalHandleSend(undefined, systemPrompt, Array.from(allTools))

        // 完了時にエージェント状態を更新
        setTimeout(() => {
          agents.forEach(a => a.status = 'completed')
          setAgentStates([...agents])
          setCurrentPhase('complete')

          // 3秒後にリセット
          setTimeout(() => {
            setCurrentPhase('idle')
            setOrchestrationPlan(null)
            setAgentStates([])
          }, 3000)
        }, 500)

      } else {
        setIsOrchestrating(false)
        setCurrentPhase('idle')
        originalHandleSend()
      }
    } catch (err) {
      console.error('Orchestration error:', err)
      setIsOrchestrating(false)
      setCurrentPhase('idle')
      originalHandleSend()
    }
  }, [input, userId, companyId, originalHandleSend])

  const getModelDisplayName = (modelId: string): string => {
    const model = ALL_MODELS.find((m) => m.id === modelId)
    return model?.name || modelId
  }

  const handleRegenerate = (messageId: string, content: string) => {
    regenerateResponse(messageId, content)
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    const nextAiMessage = messages[messageIndex + 1]
    if (nextAiMessage?.role === 'assistant') {
      setCurrentAiMessageId(nextAiMessage.id)
    }
  }

  const currentMessage = currentAiMessageId
    ? messages.find((m) => m.id === currentAiMessageId)
    : undefined

  return (
    <div className="h-full flex flex-col bg-white">
      <ChatHeader
        error={error}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        apiKeys={apiKeys}
        getModelDisplayName={getModelDisplayName}
        onSaveToKnowledge={saveConversationAsKnowledge}
        isSavingToKnowledge={isSavingToKnowledge}
        knowledgeSaveSuccess={knowledgeSaveSuccess}
        canSaveToKnowledge={messages.length >= 2}
      />

      <MessageList
        messages={messages}
        selectedModel={selectedModel}
        isProcessing={isProcessing}
        processingStep={processingStep}
        isTyping={isTyping}
        getModelDisplayName={getModelDisplayName}
        onRegenerate={handleRegenerate}
      />

      <AlternativeSwitcher
        currentMessage={currentMessage}
        isProcessing={isProcessing}
        onSwitch={(direction) => {
          if (currentAiMessageId) {
            switchAlternative(currentAiMessageId, direction)
          }
        }}
      />

      {/* エージェント実行パネル */}
      <AgentExecutionPanel
        phase={currentPhase}
        plan={orchestrationPlan}
        agentStates={agentStates}
      />

      <ChatInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onStop={handleStopTyping}
        isProcessing={isProcessing || isOrchestrating}
        isTyping={isTyping}
        isKnowledgeSearchEnabled={isKnowledgeSearchEnabled}
        onKnowledgeSearchToggle={() => setIsKnowledgeSearchEnabled(!isKnowledgeSearchEnabled)}
        companyDriveConnection={companyDriveConnection}
        companyId={companyId}
        userId={userId}
      />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
