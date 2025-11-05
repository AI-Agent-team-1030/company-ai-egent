'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon, CpuChipIcon, ChevronDownIcon, ChevronUpIcon, BookOpenIcon, LightBulbIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface Activity {
  agent: string
  action: string
  status: 'processing' | 'completed'
  sendTo?: string[]
  emoji: string
  type?: 'normal' | 'thinking' | 'knowledge'
  knowledgeItems?: string[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'こんにちは。経営AIエージェントです。戦略相談、各部門への指示展開、データ分析など、何でもお手伝いします。',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const taskSequence: Activity[] = [
    { agent: '経営AI', action: '「新規顧客獲得」の指示を受け取りました', status: 'processing', emoji: '', type: 'normal' },
    { agent: '経営AI', action: 'ナレッジベースを検索中...', status: 'processing', emoji: '', type: 'knowledge', knowledgeItems: ['営業戦略ベストプラクティス', '過去の成功事例：新規顧客獲得', 'ターゲット市場分析データ'] },
    { agent: '経営AI', action: '指示を分析し、3つのタスクに分解しました', status: 'completed', emoji: '', type: 'normal' },
    { agent: '経営AI', action: 'タスクを各部門AIに送信します', status: 'completed', sendTo: ['営業AI', 'マーケティングAI', '人事AI'], emoji: '', type: 'normal' },
    { agent: '営業AI', action: '経営AIからタスクを受信しました', status: 'processing', emoji: '', type: 'normal' },
    { agent: '営業AI', action: 'ナレッジベースを検索中...', status: 'processing', emoji: '', type: 'knowledge', knowledgeItems: ['業界別アプローチ方法', '営業トークスクリプト集', '競合分析レポート'] },
    { agent: '営業AI', action: 'ターゲット企業のリサーチを開始...', status: 'processing', emoji: '', type: 'thinking' },
    { agent: '営業AI', action: 'リスト100社の作成が完了しました！', status: 'completed', emoji: '', type: 'normal' },
    { agent: '営業AI', action: '結果を経営AIに送信します', status: 'completed', sendTo: ['経営AI'], emoji: '', type: 'normal' },
    { agent: 'マーケティングAI', action: '経営AIからタスクを受信しました', status: 'processing', emoji: '', type: 'normal' },
    { agent: 'マーケティングAI', action: 'ナレッジベースを検索中...', status: 'processing', emoji: '', type: 'knowledge', knowledgeItems: ['デジタル広告運用ガイド', 'SNSキャンペーン成功事例', 'コンテンツマーケティング戦略'] },
    { agent: 'マーケティングAI', action: '広告施策を立案中...', status: 'processing', emoji: '', type: 'thinking' },
    { agent: 'マーケティングAI', action: 'SNS広告案3件を作成完了！', status: 'completed', emoji: '', type: 'normal' },
    { agent: 'マーケティングAI', action: '結果を営業AIと経営AIに送信します', status: 'completed', sendTo: ['営業AI', '経営AI'], emoji: '', type: 'normal' },
    { agent: '人事AI', action: '経営AIからタスクを受信しました', status: 'processing', emoji: '', type: 'normal' },
    { agent: '人事AI', action: 'ナレッジベースを検索中...', status: 'processing', emoji: '', type: 'knowledge', knowledgeItems: ['営業職の採用基準', '求人票テンプレート集', '面接評価シート'] },
    { agent: '人事AI', action: '採用計画を策定中...', status: 'processing', emoji: '', type: 'thinking' },
    { agent: '人事AI', action: '営業職5名の求人票を作成完了！', status: 'completed', emoji: '', type: 'normal' },
    { agent: '人事AI', action: '結果を経営AIに送信します', status: 'completed', sendTo: ['経営AI'], emoji: '', type: 'normal' },
    { agent: '経営AI', action: '各部門AIから結果を受信しました', status: 'processing', emoji: '', type: 'normal' },
    { agent: '経営AI', action: 'すべてのデータを分析中...', status: 'processing', emoji: '', type: 'thinking' },
    { agent: '経営AI', action: '総合レポートを作成完了！', status: 'completed', emoji: '', type: 'normal' },
    { agent: '経営AI', action: 'すべてのタスクが完了しました！✨', status: 'completed', emoji: '', type: 'normal' },
  ]

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

    // AI processing message
    setTimeout(() => {
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'AI_PROCESSING',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, processingMessage])
    }, 500)

    // Show activities one by one
    for (let i = 0; i < taskSequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1200))
      const activityMessage: Message = {
        id: `activity-${Date.now()}-${i}`,
        role: 'system',
        content: JSON.stringify(taskSequence[i]),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, activityMessage])
    }

    // Final AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 100).toString(),
        role: 'assistant',
        content: generateAIResponse(text),
        timestamp: new Date(),
      }
      setMessages((prev) => prev.filter(m => m.content !== 'AI_PROCESSING').concat([aiMessage]))
      setIsProcessing(false)
    }, 2000)
  }

  const generateAIResponse = (userInput: string): string => {
    return `✅ すべてのAIエージェントがタスクを完了しました！

━━━━━━━━━━━━━━━━━━━━━━━━

**📋 実行内容**
「${userInput}」について、複数のAIエージェントが協力して処理を完了しました。

**🎯 各エージェントの成果**

**営業AI**
   └ ターゲット企業リスト 100社を作成

**マーケティングAI**
   └ SNS広告施策案 3件を提案

**人事AI**
   └ 営業職の求人票 5件を作成

━━━━━━━━━━━━━━━━━━━━━━━━

📊 詳細はダッシュボードで確認できます。
次の指示をお待ちしています！`
  }

  const quickActions = [
    '新規顧客獲得を強化',
    'コスト削減を提案',
    '新製品開発の戦略',
    '組織体制を最適化',
  ]

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-lg">
            <CpuChipIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">経営AIエージェント</h1>
            <p className="text-sm text-gray-600">戦略相談・指示展開・データ分析</p>
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
            // System processing indicator
            if (message.role === 'system' && message.content === 'AI_PROCESSING') {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <div className="bg-white border border-gray-300 rounded-xl px-6 py-3 flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <SparklesIcon className="w-5 h-5 text-gray-900" />
                    </motion.div>
                    <span className="text-sm text-gray-900 font-medium">AIエージェント実行中...</span>
                  </div>
                </motion.div>
              )
            }

            // System activity message
            if (message.role === 'system' && message.content.startsWith('{')) {
              try {
                const activity: Activity = JSON.parse(message.content)
                const isProcessing = activity.status === 'processing'
                const hasSendTo = activity.sendTo && activity.sendTo.length > 0
                const isExpanded = expandedThinking[message.id] || false
                
                // Knowledge search type (Claude thinking style)
                if (activity.type === 'knowledge') {
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-2xl w-full">
                        <button
                          onClick={() => setExpandedThinking(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
                          className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl p-4 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1 bg-black text-white rounded-full">
                                <span className="font-bold text-sm">{activity.agent}</span>
                              </div>
                              <BookOpenIcon className="w-5 h-5 text-gray-600" />
                              <span className="text-sm text-gray-700 font-medium">ナレッジベースを参照中...</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-gray-50 border-x border-b border-gray-300 rounded-b-xl p-4 mt-[-8px] pt-5">
                                <p className="text-xs text-gray-600 mb-3">参照しているナレッジ:</p>
                                <div className="space-y-2">
                                  {activity.knowledgeItems?.map((item, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="flex items-start gap-2 text-sm text-gray-700"
                                    >
                                      <span className="text-gray-400 mt-1">•</span>
                                      <span>{item}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                }

                // Thinking type (Claude thinking style)
                if (activity.type === 'thinking') {
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-2xl w-full">
                        <button
                          onClick={() => setExpandedThinking(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
                          className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl p-4 transition-colors text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1 bg-black text-white rounded-full">
                                <span className="font-bold text-sm">{activity.agent}</span>
                              </div>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                              >
                                <LightBulbIcon className="w-5 h-5 text-gray-600" />
                              </motion.div>
                              <span className="text-sm text-gray-700 font-medium">{activity.action}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-gray-50 border-x border-b border-gray-300 rounded-b-xl p-4 mt-[-8px] pt-5">
                                <p className="text-sm text-gray-700 mb-2">思考プロセス:</p>
                                <div className="space-y-2 text-sm text-gray-600">
                                  <p>• 過去のデータと成功事例を分析</p>
                                  <p>• 最適なアプローチ方法を検討</p>
                                  <p>• 具体的なアクションプランを策定</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                }
                
                // Normal activity
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className={`max-w-2xl bg-white rounded-xl p-5 shadow-md ${
                      isProcessing ? 'border-2 border-black' : 'border border-gray-300'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          {/* Agent Name & Status */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full">
                              <span className="font-bold text-sm">{activity.agent}</span>
                              {isProcessing && (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                >
                                  <SparklesIcon className="w-4 h-4" />
                                </motion.div>
                              )}
                              {activity.status === 'completed' && (
                                <CheckCircleIcon className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                          
                          {/* Action Description */}
                          <div className="mb-3">
                            <p className="text-gray-900 font-medium">{activity.action}</p>
                          </div>
                          
                          {/* Send To Section */}
                          {hasSendTo && activity.sendTo && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <ArrowRightIcon className="w-4 h-4 text-gray-900" />
                                <span className="text-xs font-bold text-gray-900 uppercase">タスク送信先</span>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {activity.sendTo.map((target, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-1 bg-white border-2 border-black px-3 py-1 rounded-full"
                                  >
                                    <span className="text-sm font-bold text-gray-900">{target}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              } catch (e) {
                return null
              }
            }

            // Regular messages
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-300'
                  } rounded-xl px-6 py-4 shadow-sm`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-4 h-4 text-gray-900" />
                      <span className="text-xs font-bold text-gray-900">経営AI</span>
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
              </motion.div>
            )
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="px-6 pb-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3 font-medium">よく使われる質問</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSend(action)}
                className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="text-sm font-medium text-gray-900">{action}</div>
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
            placeholder="経営方針や戦略について入力してください..."
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
          AIが自動的に各部門への指示を展開し、タスクを生成します
        </p>
      </div>
    </div>
  )
}
