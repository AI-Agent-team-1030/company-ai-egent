/**
 * チャット入力コンポーネント
 *
 * メッセージ入力、送信、ナレッジ検索トグルを担当
 */

'use client'

import { useRef, useCallback } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { TEXTAREA } from '@/lib/constants'
import type { CompanyDriveConnection } from '@/lib/firestore-chat'

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
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(e.target.value)
      // 自動リサイズ
      e.target.style.height = 'auto'
      e.target.style.height = Math.min(e.target.scrollHeight, TEXTAREA.MAX_HEIGHT) + 'px'
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

  return (
    <div className="border-t border-gray-200 p-3 md:p-6 bg-white">
      <div className="flex gap-2 md:gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="相談内容を入力... (Shift+Enterで改行)"
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
            onClick={onSend}
            disabled={!input.trim() || isProcessing}
            className="px-3 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1 md:gap-2 font-semibold"
          >
            <span className="hidden sm:inline">送信</span>
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex items-center justify-end mt-2 md:mt-3">
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
