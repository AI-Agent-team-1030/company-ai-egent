/**
 * チャット入力コンポーネント
 *
 * メッセージ入力、送信、エージェント選択、ナレッジ検索トグルを担当
 */

'use client'

import { useRef, useCallback, useEffect } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { TEXTAREA } from '@/lib/constants'
import type { CompanyDriveConnection } from '@/lib/firestore-chat'
import { AgentSelector } from './AgentSelector'
import type { Agent } from '@/lib/types/agent'

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isProcessing: boolean
  isTyping: boolean
  isKnowledgeSearchEnabled: boolean
  onKnowledgeSearchToggle: () => void
  companyDriveConnection: CompanyDriveConnection | null
  companyId?: string
  userId?: string
  // エージェント関連
  selectedAgent: Agent | null
  onAgentSelect: (agent: Agent | null) => void
  // 自動ルーティング関連
  isAutoMode?: boolean
  onAutoModeToggle?: () => void
}

export function ChatInput({
  input,
  onInputChange,
  onSend,
  onStop,
  isProcessing,
  isTyping,
  isKnowledgeSearchEnabled,
  onKnowledgeSearchToggle,
  companyDriveConnection,
  companyId,
  userId,
  selectedAgent,
  onAgentSelect,
  isAutoMode = true,
  onAutoModeToggle,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 入力値が変わったときにテキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, TEXTAREA.MAX_HEIGHT) + 'px'
    }
  }, [input])

  const handleAgentSelect = useCallback(
    (agent: Agent) => {
      onAgentSelect(agent)
    },
    [onAgentSelect]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(e.target.value)
    },
    [onInputChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enterで送信、Shift+Enterで改行
      // 日本語入力中（IME変換中）は送信しない
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        if (input.trim() && !isProcessing) {
          onSend()
          // リサイズをリセット
          if (textareaRef.current) {
            textareaRef.current.style.height = `${TEXTAREA.MIN_HEIGHT}px`
          }
        }
      }
    },
    [input, isProcessing, onSend]
  )

  // プレースホルダーテキスト
  const placeholderText = selectedAgent
    ? `${selectedAgent.name}に質問... (Shift+Enterで改行)`
    : '相談内容を入力... (Shift+Enterで改行)'

  return (
    <div className="border-t border-gray-200 p-3 md:p-6 bg-white">
      {/* 選択中のエージェント表示 */}
      {selectedAgent && (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="text-gray-500">使用エージェント:</span>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
            {selectedAgent.name}
          </span>
        </div>
      )}

      <div className="flex gap-2 md:gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          disabled={isProcessing}
          rows={1}
          className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500 disabled:bg-gray-100 text-sm md:text-base resize-none overflow-y-auto"
          style={{ minHeight: `${TEXTAREA.MIN_HEIGHT}px`, maxHeight: `${TEXTAREA.MAX_HEIGHT}px` }}
        />
        {isTyping ? (
          <button
            onClick={onStop}
            className="px-3 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <span className="hidden sm:inline">停止</span>
            <div className="w-4 h-4 border-2 border-white sm:hidden"></div>
          </button>
        ) : (
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || isProcessing}
            className="px-3 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1 md:gap-2 font-semibold"
          >
            <span className="hidden sm:inline">送信</span>
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 md:mt-3">
        {/* エージェントセレクター + 自動モードトグル */}
        <div className="flex items-center gap-3">
          {/* 自動モードトグル */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-medium ${
                isAutoMode ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              自動
            </span>
            <button
              onClick={onAutoModeToggle}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoMode ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                  isAutoMode ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* 手動選択時のみエージェントセレクター表示 */}
          {!isAutoMode && (
            <AgentSelector
              selectedAgent={selectedAgent}
              onSelect={handleAgentSelect}
              disabled={isProcessing || isTyping}
              companyId={companyId}
              userId={userId}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              isKnowledgeSearchEnabled ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            ナレッジ検索
            {companyDriveConnection?.isConnected && isKnowledgeSearchEnabled && (
              <span className="text-blue-500 ml-1">+ Drive</span>
            )}
          </span>
          <button
            onClick={onKnowledgeSearchToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              isKnowledgeSearchEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                isKnowledgeSearchEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
