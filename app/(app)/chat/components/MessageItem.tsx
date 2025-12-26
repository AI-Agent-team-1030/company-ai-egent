/**
 * 個別メッセージコンポーネント
 *
 * ユーザー/AI メッセージの表示、引用表示、再生成ボタンを担当
 */

'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { ChatMessage } from '../types'

interface MessageItemProps {
  message: ChatMessage
  selectedModel: string
  isProcessing: boolean
  getModelDisplayName: (modelId: string) => string
  onRegenerate: (messageId: string, content: string) => void
}

export function MessageItem({
  message,
  selectedModel,
  isProcessing,
  getModelDisplayName,
  onRegenerate,
}: MessageItemProps) {
  if (message.role === 'system') return null

  const messageModel = message.model || selectedModel

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-2xl w-full">
        <div
          className={`${
            message.role === 'user'
              ? 'bg-black text-white ml-auto relative'
              : 'bg-white border border-gray-300'
          } rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-sm`}
        >
          {message.role === 'assistant' && (
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-4 h-4 text-gray-900" />
              <span className="text-xs font-bold text-gray-900">
                {getModelDisplayName(messageModel)}
              </span>
            </div>
          )}
          {message.role === 'assistant' ? (
            <div className="prose prose-sm max-w-none text-gray-900">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
          )}
          <div
            className={`text-xs mt-2 ${
              message.role === 'user' ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {message.timestamp.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          {message.role === 'user' && (
            <button
              onClick={() => onRegenerate(message.id, message.content)}
              disabled={isProcessing}
              className="group absolute -bottom-3 -left-3 p-1.5 bg-gray-800/90 hover:bg-gray-900 border border-gray-600 rounded-lg transition-all disabled:opacity-50"
              title="回答を再生成"
            >
              <ArrowPathIcon className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Citations */}
        {message.citations &&
          message.citations.length > 0 &&
          message.showCitations === true && (
            <div className="mt-3 space-y-2 animate-slideUp">
              <p className="text-xs text-gray-600 font-bold mb-2">参照した情報源</p>
              {message.citations.map((citation, i) => (
                <div
                  key={i}
                  className={`border rounded-lg p-3 ${
                    citation.source === 'drive'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">
                      {citation.source === 'drive' ? '📁' : '📄'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            citation.source === 'drive'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {citation.source === 'drive' ? 'Googleドライブ' : '社内ナレッジ'}
                        </span>
                        {citation.uri && (
                          <a
                            href={citation.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            開く ↗
                          </a>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mt-1">{citation.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {citation.text.slice(0, 200)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
