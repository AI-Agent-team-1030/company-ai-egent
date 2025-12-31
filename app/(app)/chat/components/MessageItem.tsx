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
            <div className="mt-3 animate-slideUp">
              <p className="text-xs text-gray-600 font-bold mb-2">参照した情報源</p>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((citation, i) => {
                  // 有効なURLかどうかをチェック（Firebase Storage, Google Drive, OneDrive）
                  const hasValidUrl = citation.uri && (
                    citation.uri.startsWith('https://firebasestorage.googleapis.com') ||
                    citation.uri.startsWith('https://storage.googleapis.com') ||
                    citation.uri.startsWith('https://docs.google.com') ||
                    citation.uri.startsWith('https://drive.google.com') ||
                    citation.uri.includes('sharepoint.com') ||
                    citation.uri.includes('onedrive.live.com') ||
                    citation.uri.includes('1drv.ms')
                  )

                  // ソースに応じたスタイルを取得
                  const getSourceStyle = (source?: string) => {
                    switch (source) {
                      case 'drive':
                        return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      case 'onedrive':
                        return 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
                      default:
                        return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }
                  }

                  if (hasValidUrl) {
                    return (
                      <a
                        key={i}
                        href={citation.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${getSourceStyle(citation.source)}`}
                        title={`${citation.title}\n\nクリックしてファイルを開く`}
                      >
                        <span className="truncate max-w-[200px]">{citation.title}</span>
                        <span className="text-[10px] opacity-60">↗</span>
                      </a>
                    )
                  }

                  // URLがない場合はクリック不可のタグとして表示
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getSourceStyle(citation.source)}`}
                      title={citation.text?.slice(0, 100)}
                    >
                      <span className="truncate max-w-[200px]">{citation.title}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
