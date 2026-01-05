/**
 * チャットサイドパネル
 */

'use client'

import { Suspense, useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  StopIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  BookOpenIcon,
  GlobeAltIcon,
  CloudIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid'
import { useChatPanel } from '@/contexts/ChatPanelContext'
import { ALL_MODELS } from '@/lib/ai-providers'
import { useChat } from '@/app/(app)/chat/hooks'
import type { Citation } from '@/lib/gemini-file-search'

// ソースアイコンを取得
function getSourceIcon(source?: string) {
  switch (source) {
    case 'drive':
      return <CloudIcon className="w-3 h-3" />
    case 'onedrive':
      return <CloudIcon className="w-3 h-3" />
    case 'web':
      return <GlobeAltIcon className="w-3 h-3" />
    default:
      return <BookOpenIcon className="w-3 h-3" />
  }
}

// ソースラベルを取得
function getSourceLabel(source?: string) {
  switch (source) {
    case 'drive':
      return 'Google Drive'
    case 'onedrive':
      return 'OneDrive'
    case 'web':
      return 'Web'
    default:
      return 'ナレッジ'
  }
}

// ソースに応じたスタイルを取得
function getSourceStyle(source?: string) {
  switch (source) {
    case 'drive':
      return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
    case 'onedrive':
      return 'bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200'
    case 'web':
      return 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'
    default:
      return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
  }
}

// 参照元詳細モーダルコンポーネント
function CitationDetailModal({
  citation,
  isOpen,
  onClose
}: {
  citation: Citation | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!citation) return null

  const hasValidUrl = citation.uri && (
    citation.uri.startsWith('https://firebasestorage.googleapis.com') ||
    citation.uri.startsWith('https://storage.googleapis.com') ||
    citation.uri.startsWith('https://docs.google.com') ||
    citation.uri.startsWith('https://drive.google.com') ||
    citation.uri.includes('sharepoint.com') ||
    citation.uri.includes('onedrive.live.com') ||
    citation.uri.includes('1drv.ms') ||
    citation.uri.startsWith('http')
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[100]"
          />
          {/* モーダル */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* ヘッダー */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              citation.source === 'drive' ? 'bg-blue-50 border-blue-100' :
              citation.source === 'onedrive' ? 'bg-violet-50 border-violet-100' :
              citation.source === 'web' ? 'bg-orange-50 border-orange-100' :
              'bg-emerald-50 border-emerald-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  citation.source === 'drive' ? 'bg-blue-100 text-blue-600' :
                  citation.source === 'onedrive' ? 'bg-violet-100 text-violet-600' :
                  citation.source === 'web' ? 'bg-orange-100 text-orange-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {getSourceIcon(citation.source)}
                </div>
                <div>
                  <p className="text-xs text-gray-500">{getSourceLabel(citation.source)}</p>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{citation.title}</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-5">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <BookOpenIcon className="w-3.5 h-3.5" />
                参照された内容
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[300px] overflow-y-auto">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {citation.text || '（テキスト情報なし）'}
                </p>
              </div>
            </div>

            {/* フッター */}
            {hasValidUrl && (
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                <a
                  href={citation.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    citation.source === 'drive' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    citation.source === 'onedrive' ? 'bg-violet-600 hover:bg-violet-700 text-white' :
                    citation.source === 'web' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                    'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  元のファイルを開く
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// 引用元バッジコンポーネント
function CitationBadge({
  citation,
  onClick
}: {
  citation: Citation
  onClick: () => void
}) {
  const hasValidUrl = citation.uri && (
    citation.uri.startsWith('https://firebasestorage.googleapis.com') ||
    citation.uri.startsWith('https://storage.googleapis.com') ||
    citation.uri.startsWith('https://docs.google.com') ||
    citation.uri.startsWith('https://drive.google.com') ||
    citation.uri.includes('sharepoint.com') ||
    citation.uri.includes('onedrive.live.com') ||
    citation.uri.includes('1drv.ms') ||
    citation.uri.startsWith('http')
  )

  const content = (
    <>
      {getSourceIcon(citation.source)}
      <span className="truncate max-w-[120px]">{citation.title}</span>
      {hasValidUrl && <span className="text-[10px] opacity-60">↗</span>}
    </>
  )

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors cursor-pointer ${getSourceStyle(citation.source)}`}
      title={`${citation.title}\n${getSourceLabel(citation.source)}\n\nクリックして詳細を表示`}
    >
      {content}
    </button>
  )
}

function ChatPanelContent({ onClose }: { onClose?: () => void }) {
  const { conversationId: panelConversationId } = useChatPanel()

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
  } = useChat({
    externalConversationId: panelConversationId,
    disableRouting: true,
  })

  const [showModelSelector, setShowModelSelector] = useState(false)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
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
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-gray-900 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1 prose-strong:text-gray-900 prose-code:bg-gray-200 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-800 prose-pre:text-gray-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {/* Citations（参照元） */}
                {message.role === 'assistant' &&
                  message.citations &&
                  message.citations.length > 0 &&
                  message.showCitations && (
                    <div className="mt-2 max-w-[90%]">
                      <p className="text-[10px] text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                        <BookOpenIcon className="w-3 h-3" />
                        参照元
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.citations.map((citation, i) => (
                          <CitationBadge
                            key={i}
                            citation={citation}
                            onClick={() => setSelectedCitation(citation)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* 参照元詳細モーダル */}
      <CitationDetailModal
        citation={selectedCitation}
        isOpen={selectedCitation !== null}
        onClose={() => setSelectedCitation(null)}
      />
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
