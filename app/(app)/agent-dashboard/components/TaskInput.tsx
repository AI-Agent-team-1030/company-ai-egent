/**
 * タスク入力コンポーネント
 */

'use client'

import { useRef, useEffect, useCallback } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'

interface TaskInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  disabled: boolean
}

export function TaskInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled,
}: TaskInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // テキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        if (value.trim() && !isLoading && !disabled) {
          onSubmit()
        }
      }
    },
    [value, isLoading, disabled, onSubmit]
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          実行したいタスク
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例: 競合他社のSNS戦略を分析して"
            disabled={isLoading || disabled}
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:bg-gray-100 resize-none text-base"
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />
          <button
            onClick={onSubmit}
            disabled={!value.trim() || isLoading || disabled}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors flex-shrink-0"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="whitespace-nowrap">分析中</span>
              </>
            ) : (
              <>
                <span className="whitespace-nowrap">実行</span>
                <PaperAirplaneIcon className="w-5 h-5 flex-shrink-0" />
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter で実行
        </p>
      </div>
    </div>
  )
}
