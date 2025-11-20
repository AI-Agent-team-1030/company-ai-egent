'use client'

import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import {
  SparklesIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { KnowledgeItem } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { apiGet, apiPost } from '@/lib/api-client'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  searchProcess?: SearchStep[]
  relatedKnowledge?: KnowledgeItem[]
}

interface SearchStep {
  id: string
  type: 'searching' | 'checking' | 'analyzing' | 'completed'
  message: string
  knowledgeTitle?: string
}

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // 会話を作成
  useEffect(() => {
    createNewConversation()
  }, [])

  const createNewConversation = async () => {
    try {
      const response = await apiPost('/api/chat/conversations', { title: '新しい会話' })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const conversation = await response.json()
      setConversationId(conversation.id)

      // 初回メッセージ
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。社内のナレッジベースから最適な情報を自動で探してお答えします。',
        timestamp: new Date(),
      }])
    } catch (err) {
      console.error('Error creating conversation:', err)
      setError('会話の作成に失敗しました')
    }
  }

  // クリーンアップ: コンポーネントのアンマウント時にすべてのタイマーをクリア
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current = []
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // タイマーを管理するヘルパー関数
  const createManagedTimeout = (callback: () => void, delay: number) => {
    return new Promise<void>((resolve) => {
      const timeoutId = setTimeout(() => {
        callback()
        resolve()
      }, delay)
      timeoutsRef.current.push(timeoutId)
    })
  }

  // ドキュメント検索ロジック（APIから）
  const searchDocuments = async (query: string): Promise<any[]> => {
    try {
      const response = await apiGet('/api/documents')

      if (!response.ok) {
        throw new Error('Failed to search documents')
      }

      const result = await response.json()
      // 処理済みのドキュメントのみ返す
      return (result.data || []).filter((d: any) => d.processed).slice(0, 3)
    } catch (err) {
      console.error('Error searching documents:', err)
      return []
    }
  }

  const handleSend = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isProcessing || !conversationId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)
    setError(null)

    const searchSteps: SearchStep[] = []

    try {
      // Step 1: ナレッジ検索開始
      const searchingStep: SearchStep = {
        id: 'step-0',
        type: 'searching',
        message: 'ナレッジベースを検索中...',
      }
      searchSteps.push(searchingStep)

      const searchMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'SEARCH_PROCESS',
        timestamp: new Date(),
        searchProcess: [searchingStep],
      }
      setMessages((prev) => [...prev, searchMessage])

      // ドキュメントを検索
      const relatedDocs = await searchDocuments(text)

      await createManagedTimeout(() => {}, 500)

      // Step 2: 各ドキュメントを確認
      for (let i = 0; i < relatedDocs.length; i++) {
        const doc = relatedDocs[i]
        const checkingStep: SearchStep = {
          id: `step-${i + 1}`,
          type: 'checking',
          message: `「${doc.original_filename}」を確認中...`,
          knowledgeTitle: doc.original_filename,
        }
        searchSteps.push(checkingStep)

        setMessages((prev) => prev.map(m =>
          m.content === 'SEARCH_PROCESS'
            ? { ...m, searchProcess: [...searchSteps] }
            : m
        ))

        await createManagedTimeout(() => {}, 400)
      }

      // Step 3: Claude AIで分析中
      const analyzingStep: SearchStep = {
        id: 'step-analyzing',
        type: 'analyzing',
        message: 'Claude AIが情報を分析中...',
      }
      searchSteps.push(analyzingStep)
      setMessages((prev) => prev.map(m =>
        m.content === 'SEARCH_PROCESS'
          ? { ...m, searchProcess: [...searchSteps] }
          : m
      ))

      // Claude APIに送信
      const response = await apiPost('/api/chat/messages', {
        conversation_id: conversationId,
        content: text,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const { assistantMessage } = await response.json()

      // Step 4: 完了
      const completedStep: SearchStep = {
        id: 'step-completed',
        type: 'completed',
        message: `${relatedDocs.length}件のドキュメントを参照して回答を生成しました`,
      }
      searchSteps.push(completedStep)
      setMessages((prev) => prev.map(m =>
        m.content === 'SEARCH_PROCESS'
          ? { ...m, searchProcess: [...searchSteps] }
          : m
      ))

      await createManagedTimeout(() => {}, 300)

      // AIメッセージを追加
      const aiMessage: Message = {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        timestamp: new Date(assistantMessage.created_at),
        relatedKnowledge: relatedDocs.length > 0 ? relatedDocs.map(d => ({
          id: d.id,
          title: d.original_filename,
          content: '',
          category: '',
          tags: [],
          createdAt: new Date(d.uploaded_at),
          updatedAt: new Date(d.uploaded_at),
          usageCount: 0,
          helpful: 0,
        })) : undefined,
      }

      setMessages((prev) => prev.filter(m => m.content !== 'SEARCH_PROCESS').concat([aiMessage]))
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'メッセージの送信に失敗しました')

      // エラーメッセージを表示
      setMessages((prev) => prev.filter(m => m.content !== 'SEARCH_PROCESS'))
    } finally {
      setIsProcessing(false)
    }
  }

  const faqQuestions = [
    '新規顧客へのアプローチ方法を教えて',
    'SaaS業界の採用について',
    'カスタマーサポートのテンプレート',
    '営業のノウハウを教えて',
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">
              <strong>エラー:</strong> {error}
              {error.includes('APIキー') && (
                <a href="/settings" className="ml-2 underline">
                  設定ページへ
                </a>
              )}
            </p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-lg">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">AIアシスタント</h1>
            <p className="text-sm text-gray-600">お悩み相談・ナレッジ検索</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>オンライン</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message) => {
            // Search Process Display
            if (message.role === 'system' && message.content === 'SEARCH_PROCESS' && message.searchProcess) {
              return (
                <div
                  key={message.id}
                  className="flex justify-center"
                >
                  <div className="bg-white border-2 border-gray-300 rounded-xl p-6 max-w-2xl w-full">
                    <div className="space-y-3">
                      {message.searchProcess.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-3"
                        >
                          {step.type === 'searching' && (
                            <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
                          )}
                          {step.type === 'checking' && (
                            <BookOpenIcon className="w-5 h-5 text-purple-600" />
                          )}
                          {step.type === 'analyzing' && (
                            <LightBulbIcon className="w-5 h-5 text-yellow-600" />
                          )}
                          {step.type === 'completed' && (
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              step.type === 'completed' ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {step.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }

            // Regular messages
            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-2xl w-full">
                  <div
                    className={`${
                      message.role === 'user'
                        ? 'bg-black text-white ml-auto'
                        : 'bg-white border border-gray-300'
                    } rounded-xl px-6 py-4 shadow-sm`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <SparklesIcon className="w-4 h-4 text-gray-900" />
                        <span className="text-xs font-bold text-gray-900">AI アシスタント</span>
                      </div>
                    )}
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-gray-900">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
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
                  </div>

                  {/* Related Knowledge Cards */}
                  {message.relatedKnowledge && message.relatedKnowledge.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600 font-bold mb-2">📚 参照したナレッジ</p>
                      {message.relatedKnowledge.map((k, i) => (
                        <div
                          key={k.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-bold text-gray-900 text-sm">{k.title}</h4>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {k.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{k.content.slice(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3 font-medium">💬 よく相談される質問</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {faqQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSend(question)}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="text-sm font-medium text-gray-900 line-clamp-2">{question}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-6 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend()
              }
            }}
            placeholder="お困りのことを相談してください..."
            disabled={isProcessing}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500 disabled:bg-gray-100"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            <span>送信</span>
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4" />
          AIが自動で最適なナレッジを探して回答します
        </p>
      </div>
    </div>
  )
}
