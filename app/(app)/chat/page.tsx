/**
 * チャットページ
 *
 * AIアシスタントとの対話画面
 * コンポーネントとフックに分割してリファクタリング済み
 */

'use client'

import { Suspense } from 'react'
import { ALL_MODELS } from '@/lib/ai-providers'
import { useChat } from './hooks'
import {
  ChatHeader,
  MessageList,
  ChatInput,
  AlternativeSwitcher,
} from './components'

function ChatContent() {
  const {
    // State
    messages,
    input,
    setInput,
    isProcessing,
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

    // Actions
    handleSend,
    handleStopTyping,
    switchAlternative,
    regenerateResponse,
  } = useChat()

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
      />

      <MessageList
        messages={messages}
        selectedModel={selectedModel}
        isProcessing={isProcessing}
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

      <ChatInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onStop={handleStopTyping}
        isProcessing={isProcessing}
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
