/**
 * チャットサイドパネル
 */

'use client'

import { Suspense, useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  StopIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid'
import { useChatPanel } from '@/contexts/ChatPanelContext'
import { ALL_MODELS } from '@/lib/ai-providers'
import { useChat } from '@/app/(app)/chat/hooks'

function ChatPanelContent({ onClose }: { onClose?: () => void }) {
  const {
    messages,
    input,
    setInput,
    isProcessing,
    processingStep,
    isTyping,
    selectedModel,
    setSelectedModel,
    handleSend,
    handleStopTyping,
  } = useChat()

  const [showModelSelector, setShowModelSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // テキストエリアの高さ自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter (Mac) または Ctrl+Enter (Windows) で送信
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const onSendClick = () => {
    handleSend()
  }

  const getModelDisplayName = (modelId: string): string => {
    const model = ALL_MODELS.find((m) => m.id === modelId)
    return model?.name || modelId
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-gray-900">チャット</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              <span>{getModelDisplayName(selectedModel)}</span>
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  {ALL_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
                        setShowModelSelector(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        selectedModel === model.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
              title="パネルを閉じる"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              title="閉じる"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">メッセージを入力してください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {(isProcessing || isTyping) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    {processingStep && (
                      <span className="text-xs text-gray-500">{processingStep}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={1}
            disabled={isProcessing || isTyping}
          />
          {isProcessing || isTyping ? (
            <button
              onClick={handleStopTyping}
              className="p-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
            >
              <StopIcon className="w-5 h-5 text-gray-700" />
            </button>
          ) : (
            <button
              onClick={onSendClick}
              disabled={!input.trim()}
              className={`p-2.5 rounded-xl transition-colors ${
                input.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-right">
          Cmd + Enter で送信
        </p>
      </div>
    </div>
  )
}

export function ChatSidePanel() {
  const { isOpen, togglePanel } = useChatPanel()

  return (
    <>
      {/* デスクトップ用トグルボタン（パネルが閉じている時） */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={togglePanel}
            className="hidden md:flex fixed right-6 bottom-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all items-center gap-2"
            title="AIに質問する"
          >
            <SparklesIconSolid className="w-5 h-5" />
            <span className="font-medium">AIに質問</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* モバイル用オーバーレイ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={togglePanel}
            className="md:hidden fixed inset-0 bg-black/50 z-[55]"
          />
        )}
      </AnimatePresence>

      {/* デスクトップサイドパネル */}
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 380 : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden md:flex h-full border-l border-gray-200 flex-col relative overflow-hidden flex-shrink-0 bg-white"
      >
        {isOpen && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-white">
                <div className="text-gray-500">読み込み中...</div>
              </div>
            }
          >
            <ChatPanelContent onClose={togglePanel} />
          </Suspense>
        )}
      </motion.div>

      {/* モバイル用フルスクリーンパネル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-[58] flex flex-col bg-white"
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500">読み込み中...</div>
                </div>
              }
            >
              <ChatPanelContent onClose={togglePanel} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
