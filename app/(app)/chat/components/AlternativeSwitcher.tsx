/**
 * 回答切替コンポーネント
 *
 * 複数の回答候補間を切り替えるUI
 */

'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { ChatMessage } from '../types'

interface AlternativeSwitcherProps {
  currentMessage: ChatMessage | undefined
  isProcessing: boolean
  onSwitch: (direction: 'prev' | 'next') => void
}

export function AlternativeSwitcher({
  currentMessage,
  isProcessing,
  onSwitch,
}: AlternativeSwitcherProps) {
  if (!currentMessage?.alternatives || currentMessage.alternatives.length <= 1) {
    return null
  }

  return (
    <div className="border-t border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 bg-white border-2 border-gray-300 rounded-full px-4 py-2 shadow-lg">
          <button
            onClick={() => onSwitch('prev')}
            disabled={isProcessing}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-sm font-bold text-gray-700 min-w-[3rem] text-center px-3">
            {(currentMessage.currentAlternativeIndex || 0) + 1} /{' '}
            {currentMessage.alternatives.length}
          </span>
          <button
            onClick={() => onSwitch('next')}
            disabled={isProcessing}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  )
}
