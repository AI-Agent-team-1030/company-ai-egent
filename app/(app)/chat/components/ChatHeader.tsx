/**
 * チャットヘッダーコンポーネント
 *
 * AIモデル選択、ナレッジベースへのリンク、エラー表示を担当
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  SparklesIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { ALL_MODELS, ModelOption } from '@/lib/ai-providers'
import type { ApiKeys } from '../types'

interface ChatHeaderProps {
  error: string | null
  selectedModel: string
  onModelSelect: (modelId: string) => void
  apiKeys: ApiKeys
  getModelDisplayName: (modelId: string) => string
}

export function ChatHeader({
  error,
  selectedModel,
  onModelSelect,
  apiKeys,
  getModelDisplayName,
}: ChatHeaderProps) {
  const router = useRouter()
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  return (
    <div className="border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 bg-white">
      {error && (
        <div className="mb-3 md:mb-4 bg-red-50 border border-red-200 rounded-lg p-2 md:p-3">
          <p className="text-red-600 text-xs md:text-sm">
            <strong>エラー:</strong> {error}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 bg-black text-white rounded-lg">
          <ChatBubbleLeftRightIcon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">
            AIアシスタント
          </h1>
          <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
            {getModelDisplayName(selectedModel)} で回答
          </p>
        </div>

        {/* Model Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <SparklesIcon className="w-4 h-4 text-gray-700" />
            <span className="text-sm font-bold text-gray-900 hidden sm:inline">
              {getModelDisplayName(selectedModel)}
            </span>
            <span className="text-sm font-bold text-gray-900 sm:hidden">AI</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-600" />
          </button>

          {showModelDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowModelDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                {/* Gemini */}
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500">
                    Google Gemini（常に利用可能）
                  </span>
                </div>
                {ALL_MODELS.filter((m) => m.provider === 'gemini').map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelSelect(model.id)
                      setShowModelDropdown(false)
                    }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 ${
                      selectedModel === model.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="font-medium">{model.name}</span>
                    {selectedModel === model.id && (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                ))}

                {/* Claude */}
                <div className="px-3 py-2 bg-gray-50 border-b border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-500">
                    Anthropic Claude
                    {!apiKeys.anthropic && (
                      <span className="text-orange-500 ml-1">（APIキー未設定）</span>
                    )}
                  </span>
                </div>
                {ALL_MODELS.filter((m) => m.provider === 'anthropic').map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelSelect(model.id)
                      setShowModelDropdown(false)
                    }}
                    disabled={!apiKeys.anthropic}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 ${
                      selectedModel === model.id ? 'bg-blue-50' : ''
                    } ${!apiKeys.anthropic ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="font-medium">{model.name}</span>
                    {selectedModel === model.id && (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                ))}

                {/* OpenAI */}
                <div className="px-3 py-2 bg-gray-50 border-b border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-500">
                    OpenAI GPT
                    {!apiKeys.openai && (
                      <span className="text-orange-500 ml-1">（APIキー未設定）</span>
                    )}
                  </span>
                </div>
                {ALL_MODELS.filter((m) => m.provider === 'openai').map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelSelect(model.id)
                      setShowModelDropdown(false)
                    }}
                    disabled={!apiKeys.openai}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 last:rounded-b-lg ${
                      selectedModel === model.id ? 'bg-blue-50' : ''
                    } ${!apiKeys.openai ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="font-medium">{model.name}</span>
                    {selectedModel === model.id && (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => router.push('/knowledge')}
          className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          title="ナレッジベースへ"
        >
          <BookOpenIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
          <span className="text-xs md:text-sm font-medium text-gray-700 hidden sm:inline">
            ナレッジ
          </span>
        </button>
      </div>
    </div>
  )
}
