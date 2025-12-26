/**
 * メッセージリストコンポーネント
 *
 * メッセージ一覧の表示、スクロール管理、ローディング表示を担当
 */

'use client'

import { useRef, useEffect } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { MessageItem } from './MessageItem'
import type { ChatMessage } from '../types'

interface MessageListProps {
  messages: ChatMessage[]
  selectedModel: string
  isProcessing: boolean
  isTyping: boolean
  getModelDisplayName: (modelId: string) => string
  onRegenerate: (messageId: string, content: string) => void
}

export function MessageList({
  messages,
  selectedModel,
  isProcessing,
  isTyping,
  getModelDisplayName,
  onRegenerate,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gray-50">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          selectedModel={selectedModel}
          isProcessing={isProcessing}
          getModelDisplayName={getModelDisplayName}
          onRegenerate={onRegenerate}
        />
      ))}

      {/* Loading indicator */}
      {isProcessing && !isTyping && (
        <div className="flex justify-start">
          <div className="max-w-2xl w-full">
            <div className="bg-white border border-gray-300 rounded-xl px-6 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-gray-900" />
                <span className="text-xs font-bold text-gray-900">
                  {getModelDisplayName(selectedModel)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
                <span className="text-sm">考え中...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
