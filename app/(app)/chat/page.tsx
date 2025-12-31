/**
 * チャットページ
 *
 * AIアシスタントとの対話画面
 * エージェント機能統合済み - 自動ルーティング対応
 */

'use client'

import { Suspense, useState, useCallback } from 'react'
import { ALL_MODELS } from '@/lib/ai-providers'
import { useChat } from './hooks'
import { useAgentExecution, useAutoAgentRouting } from './hooks/useAgentExecution'
import {
  ChatHeader,
  MessageList,
  ChatInput,
  AlternativeSwitcher,
} from './components'
import { AgentExecutionStatus } from './components/AgentExecutionStatus'
import type { Agent } from '@/lib/types/agent'

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

  // エージェント関連のstate
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isAutoMode, setIsAutoMode] = useState(true) // 自動生成モード
  const [generationReason, setGenerationReason] = useState<string | null>(null)
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  // 自動エージェント生成フック
  const autoRouting = useAutoAgentRouting({
    userId,
    companyId,
    onAgentGenerated: (agent, reasoning) => {
      setSelectedAgent(agent)
      setGenerationReason(reasoning)
      setShowSavePrompt(true) // 常に保存プロンプトを表示
      console.log('Generated agent:', agent.name, reasoning)
    },
  })

  // エージェント実行フック
  const agentExecution = useAgentExecution({
    onComplete: (result) => {
      console.log('Agent execution completed:', result)
    },
    onError: (error) => {
      console.error('Agent execution error:', error)
    },
  })

  // エージェント選択ハンドラー（手動選択時）
  const handleAgentSelect = useCallback((agent: Agent | null) => {
    setSelectedAgent(agent)
    setGenerationReason(null)
    setShowSavePrompt(false)
    autoRouting.clearGenerated()
  }, [autoRouting])

  // 自動生成エージェントの保存
  const handleSaveGeneratedAgent = useCallback(async () => {
    const agentId = await autoRouting.saveGeneratedAgent()
    if (agentId) {
      setShowSavePrompt(false)
      console.log('Agent saved:', agentId)
    }
  }, [autoRouting])

  // 送信ハンドラー（自動エージェント生成対応）
  const handleSend = useCallback(async () => {
    if (!input.trim()) return

    let agentSystemPrompt: string | undefined
    let agentTools: string[] | undefined

    // 自動モードの場合、まずエージェントを生成
    if (isAutoMode) {
      const result = await autoRouting.generateAgent(input)
      if (result?.agent) {
        console.log('Generated agent for task:', result.agent.name, 'Tools:', result.agent.tools)
        // 生成されたエージェントのsystemPromptとtoolsを取得
        agentSystemPrompt = result.agent.systemPrompt
        agentTools = result.agent.tools
      }
    } else if (selectedAgent) {
      // 手動選択されたエージェントがあればそのsystemPromptとtoolsを使用
      agentSystemPrompt = selectedAgent.systemPrompt
      agentTools = selectedAgent.tools
    }

    // エージェントのsystemPromptとtoolsを渡して送信
    originalHandleSend(undefined, agentSystemPrompt, agentTools)
  }, [input, isAutoMode, selectedAgent, autoRouting, originalHandleSend])

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

      {/* ルーティング中・エージェント実行状況 */}
      <div className="px-4 md:px-6">
        {/* エージェント生成中の表示 */}
        {autoRouting.isRouting && (
          <div className="mb-2 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
            <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
            <span>タスクに最適なエージェントを生成中...</span>
          </div>
        )}

        {/* 生成されたエージェントの表示 */}
        {generationReason && selectedAgent && !autoRouting.isRouting && (
          <div className="mb-2 flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <span className="font-medium">🤖 {selectedAgent.name}</span>
              <span className="text-indigo-600">を生成</span>
              <span className="text-xs text-gray-500">({generationReason})</span>
            </div>
            <button
              onClick={() => {
                setSelectedAgent(null)
                setGenerationReason(null)
                setShowSavePrompt(false)
                autoRouting.clearGenerated()
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              クリア
            </button>
          </div>
        )}

        {/* エージェント保存プロンプト */}
        {showSavePrompt && autoRouting.generationResult?.canSave && (
          <div className="mb-2 flex items-center justify-between bg-amber-50 px-3 py-2 rounded-lg">
            <span className="text-sm text-amber-700">
              新しいエージェント「{selectedAgent?.name}」を保存しますか？
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSaveGeneratedAgent}
                className="text-xs px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                保存
              </button>
              <button
                onClick={() => setShowSavePrompt(false)}
                className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
              >
                スキップ
              </button>
            </div>
          </div>
        )}

        <AgentExecutionStatus
          isExecuting={agentExecution.isExecuting}
          currentStep={agentExecution.currentStep ?? undefined}
          stepMessage={agentExecution.stepMessage}
          toolResults={agentExecution.toolResults}
          agentName={selectedAgent?.name}
        />
      </div>

      <ChatInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onStop={handleStopTyping}
        isProcessing={isProcessing || autoRouting.isRouting}
        isTyping={isTyping}
        isKnowledgeSearchEnabled={isKnowledgeSearchEnabled}
        onKnowledgeSearchToggle={() => setIsKnowledgeSearchEnabled(!isKnowledgeSearchEnabled)}
        companyDriveConnection={companyDriveConnection}
        companyId={companyId}
        userId={userId}
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSelect}
        isAutoMode={isAutoMode}
        onAutoModeToggle={() => setIsAutoMode(!isAutoMode)}
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
