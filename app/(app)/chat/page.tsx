'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import {
  SparklesIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { mockKnowledge } from '@/data/mockData'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  searchProcess?: SearchStep[]
  relatedKnowledge?: typeof mockKnowledge
}

interface SearchStep {
  id: string
  type: 'searching' | 'checking' | 'analyzing' | 'completed'
  message: string
  knowledgeTitle?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 初回メッセージを設定
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。社内のナレッジベースから最適な情報を自動で探してお答えします。',
        timestamp: new Date(),
      }])
    }
  }, [messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // ナレッジ検索ロジック
  const searchKnowledge = (query: string) => {
    const lowerQuery = query.toLowerCase()

    const scored = mockKnowledge.map(k => {
      let score = 0
      if (k.title.toLowerCase().includes(lowerQuery)) score += 10
      if (k.content.toLowerCase().includes(lowerQuery)) score += 5
      k.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery) || lowerQuery.includes(tag.toLowerCase())) {
          score += 3
        }
      })
      if (k.category.toLowerCase().includes(lowerQuery)) score += 2
      return { knowledge: k, score }
    })

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.knowledge)
  }

  // 回答生成ロジック
  const generateAnswer = (query: string, relatedKnowledge: typeof mockKnowledge): string => {
    if (relatedKnowledge.length === 0) {
      return `「${query}」に関する情報がナレッジベースに見つかりませんでした。

以下のような質問にお答えできます：
• 経費精算の方法について
• 有給休暇の申請手順
• 会議室の予約方法
• 勤怠管理システムの使い方
• テレワークの申請方法

別の言葉で質問してみてください。`
    }

    // 最も関連性の高いナレッジ（1位）は全文表示
    const mainKnowledge = relatedKnowledge[0]

    // その他のナレッジは要約のみ表示
    const additionalKnowledge = relatedKnowledge.slice(1, 3) // 最大2件まで

    let answer = `**${mainKnowledge.title}**についてお答えします。\n\n`
    answer += `${mainKnowledge.content}\n\n`

    // 追加の関連ナレッジがある場合
    if (additionalKnowledge.length > 0) {
      answer += `━━━━━━━━━━━━━━━━━━\n\n`
      answer += `**関連情報**\n\n`
      additionalKnowledge.forEach((k, i) => {
        // コンテンツの最初の300文字を抜粋
        const excerpt = k.content.split('\n').slice(0, 5).join('\n').slice(0, 300)
        answer += `${i + 1}. **${k.title}**\n${excerpt}...\n\n`
      })
    }

    answer += `━━━━━━━━━━━━━━━━━━\n\n`
    answer += `💡 この情報は${mainKnowledge.usageCount}回参照され、${mainKnowledge.helpful}人が役に立ったと評価しています。\n\n`
    answer += `他にご不明な点があれば、お気軽にお聞きください。`

    return answer
  }

  const handleSend = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // Step 1: ナレッジ検索開始
    const relatedKnowledge = searchKnowledge(text)
    const searchSteps: SearchStep[] = []

    // Step 2: 検索中メッセージ
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

    await new Promise(resolve => setTimeout(resolve, 800))

    // Step 3: 各ナレッジを確認
    for (let i = 0; i < relatedKnowledge.length; i++) {
      const knowledge = relatedKnowledge[i]
      const checkingStep: SearchStep = {
        id: `step-${i + 1}`,
        type: 'checking',
        message: `「${knowledge.title}」を確認中...`,
        knowledgeTitle: knowledge.title,
      }
      searchSteps.push(checkingStep)

      setMessages((prev) => prev.map(m =>
        m.content === 'SEARCH_PROCESS'
          ? { ...m, searchProcess: [...searchSteps] }
          : m
      ))

      await new Promise(resolve => setTimeout(resolve, 600))
    }

    // Step 4: 分析中
    await new Promise(resolve => setTimeout(resolve, 400))
    const analyzingStep: SearchStep = {
      id: 'step-analyzing',
      type: 'analyzing',
      message: '情報を分析中...',
    }
    searchSteps.push(analyzingStep)
    setMessages((prev) => prev.map(m =>
      m.content === 'SEARCH_PROCESS'
        ? { ...m, searchProcess: [...searchSteps] }
        : m
    ))

    await new Promise(resolve => setTimeout(resolve, 800))

    // Step 5: 完了
    const completedStep: SearchStep = {
      id: 'step-completed',
      type: 'completed',
      message: `${relatedKnowledge.length}件のナレッジを参照して回答を生成しました`,
    }
    searchSteps.push(completedStep)
    setMessages((prev) => prev.map(m =>
      m.content === 'SEARCH_PROCESS'
        ? { ...m, searchProcess: [...searchSteps] }
        : m
    ))

    await new Promise(resolve => setTimeout(resolve, 600))

    // 最終回答
    const answer = generateAnswer(text, relatedKnowledge)
    const aiMessage: Message = {
      id: (Date.now() + 100).toString(),
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
      relatedKnowledge: relatedKnowledge.length > 0 ? relatedKnowledge : undefined,
    }

    setMessages((prev) => prev.filter(m => m.content !== 'SEARCH_PROCESS').concat([aiMessage]))
    setIsProcessing(false)
  }

  const faqQuestions = [
    '経費精算の方法を教えて',
    '有給休暇の申請手順は？',
    '会議室の予約方法',
    '勤怠管理システムの使い方',
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
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
        <AnimatePresence>
          {messages.map((message) => {
            // Search Process Display
            if (message.role === 'system' && message.content === 'SEARCH_PROCESS' && message.searchProcess) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <div className="bg-white border-2 border-gray-300 rounded-xl p-6 max-w-2xl w-full">
                    <div className="space-y-3">
                      {message.searchProcess.map((step, index) => (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          {step.type === 'searching' && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                              <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
                            </motion.div>
                          )}
                          {step.type === 'checking' && (
                            <BookOpenIcon className="w-5 h-5 text-purple-600" />
                          )}
                          {step.type === 'analyzing' && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                              <LightBulbIcon className="w-5 h-5 text-yellow-600" />
                            </motion.div>
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
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            }

            // Regular messages
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
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
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-3 space-y-2"
                    >
                      <p className="text-xs text-gray-600 font-bold mb-2">📚 参照したナレッジ</p>
                      {message.relatedKnowledge.map((k, i) => (
                        <motion.div
                          key={k.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-bold text-gray-900 text-sm">{k.title}</h4>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {k.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{k.content.slice(0, 100)}...</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3 font-medium">💬 よく相談される質問</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {faqQuestions.map((question, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSend(question)}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="text-sm font-medium text-gray-900 line-clamp-2">{question}</div>
              </motion.button>
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
          <motion.button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
          >
            <span>送信</span>
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4" />
          AIが自動で最適なナレッジを探して回答します
        </p>
      </div>
    </div>
  )
}
