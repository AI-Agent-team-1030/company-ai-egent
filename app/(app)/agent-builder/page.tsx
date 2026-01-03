/**
 * エージェント作成ページ
 *
 * AIと対話しながらカスタムエージェントを作成
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  WrenchScrewdriverIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  CheckIcon,
  BookOpenIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

// 利用可能なツール
const AVAILABLE_TOOLS = [
  { id: 'knowledge_search', name: 'ナレッジ検索', icon: BookOpenIcon, description: '社内ドキュメントを検索' },
  { id: 'web_search', name: 'Web検索', icon: GlobeAltIcon, description: 'インターネットから情報を取得' },
  { id: 'document_generate', name: '文書生成', icon: DocumentTextIcon, description: 'レポートや文書を作成' },
  { id: 'code_execute', name: 'コード実行', icon: CodeBracketIcon, description: 'Pythonコードを実行' },
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AgentConfig {
  name: string
  role: string
  systemPrompt: string
  tools: string[]
}

export default function AgentBuilderPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'こんにちは！カスタムエージェントを一緒に作りましょう。\n\nどんなタスクを自動化したいですか？例えば：\n- 競合分析を自動で行う\n- 日報を自動生成する\n- 技術ドキュメントを要約する\n\n自由に教えてください！',
    },
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'describe' | 'refine' | 'configure' | 'complete'>('describe')
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    role: '',
    systemPrompt: '',
    tools: [],
  })

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

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // シミュレートされたAI応答（実際はAPIを呼び出す）
    setTimeout(() => {
      let response: Message

      if (currentStep === 'describe') {
        // ユーザーの説明を分析して提案
        const suggestedTools = analyzeTasks(userMessage.content)
        setAgentConfig(prev => ({
          ...prev,
          tools: suggestedTools,
          role: extractRole(userMessage.content),
        }))
        setCurrentStep('refine')

        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `なるほど！「${extractRole(userMessage.content)}」のエージェントですね。\n\n以下のツールを使うのが良さそうです：\n${suggestedTools.map(t => `- ${AVAILABLE_TOOLS.find(at => at.id === t)?.name}`).join('\n')}\n\nエージェントに名前をつけましょう。どんな名前がいいですか？\n（例: 競合分析アシスタント、日報作成くん）`,
        }
      } else if (currentStep === 'refine') {
        // エージェント名を設定
        setAgentConfig(prev => ({
          ...prev,
          name: userMessage.content.trim(),
        }))
        setCurrentStep('configure')

        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `「${userMessage.content.trim()}」いい名前ですね！\n\n最後に、このエージェントの性格や話し方を決めましょう。\n\n例えば：\n- フォーマルなビジネス調\n- フレンドリーでカジュアル\n- 簡潔で効率重視\n\nどんなスタイルがいいですか？`,
        }
      } else if (currentStep === 'configure') {
        // システムプロンプトを生成
        const systemPrompt = generateSystemPrompt(agentConfig, userMessage.content)
        setAgentConfig(prev => ({
          ...prev,
          systemPrompt,
        }))
        setCurrentStep('complete')

        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `エージェント「${agentConfig.name}」の設定が完了しました！\n\n下のプレビューで確認して、問題なければ保存しましょう。`,
        }
      } else {
        response = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'エージェントは既に完成しています。新しいエージェントを作成する場合は、ページをリロードしてください。',
        }
      }

      setMessages(prev => [...prev, response])
      setIsProcessing(false)
    }, 1500)
  }

  // タスクからツールを分析
  const analyzeTasks = (description: string): string[] => {
    const tools: string[] = []
    const lower = description.toLowerCase()

    if (lower.includes('検索') || lower.includes('調べ') || lower.includes('探')) {
      tools.push('knowledge_search')
    }
    if (lower.includes('web') || lower.includes('ネット') || lower.includes('競合') || lower.includes('市場')) {
      tools.push('web_search')
    }
    if (lower.includes('レポート') || lower.includes('文書') || lower.includes('日報') || lower.includes('要約')) {
      tools.push('document_generate')
    }
    if (lower.includes('コード') || lower.includes('計算') || lower.includes('分析')) {
      tools.push('code_execute')
    }

    // デフォルトでナレッジ検索を追加
    if (tools.length === 0) {
      tools.push('knowledge_search')
    }

    return tools
  }

  // 役割を抽出
  const extractRole = (description: string): string => {
    if (description.includes('競合')) return '競合分析'
    if (description.includes('日報')) return '日報作成'
    if (description.includes('要約')) return 'ドキュメント要約'
    if (description.includes('分析')) return 'データ分析'
    if (description.includes('調査')) return 'リサーチ'
    return 'タスク支援'
  }

  // システムプロンプトを生成
  const generateSystemPrompt = (config: AgentConfig, style: string): string => {
    let tone = ''
    if (style.includes('フォーマル') || style.includes('ビジネス')) {
      tone = '丁寧でプロフェッショナルな口調で対応してください。'
    } else if (style.includes('フレンドリー') || style.includes('カジュアル')) {
      tone = 'フレンドリーで親しみやすい口調で対応してください。'
    } else if (style.includes('簡潔') || style.includes('効率')) {
      tone = '簡潔で要点を押さえた回答を心がけてください。'
    } else {
      tone = 'わかりやすく丁寧に対応してください。'
    }

    return `あなたは「${config.name}」という名前の${config.role}専門のAIアシスタントです。\n\n${tone}\n\nユーザーの依頼に対して、利用可能なツールを活用しながら最善の結果を提供してください。`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter (Mac) または Ctrl+Enter (Windows) で送信
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveAgent = () => {
    // TODO: Firestoreに保存
    alert('エージェントを保存しました！（デモ）')
  }

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'こんにちは！カスタムエージェントを一緒に作りましょう。\n\nどんなタスクを自動化したいですか？',
      },
    ])
    setCurrentStep('describe')
    setAgentConfig({ name: '', role: '', systemPrompt: '', tools: [] })
  }

  const toggleTool = (toolId: string) => {
    setAgentConfig(prev => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter(t => t !== toolId)
        : [...prev.tools, toolId],
    }))
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <WrenchScrewdriverIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">エージェント作成</h1>
              <p className="text-xs text-gray-500">AIと対話しながらカスタムエージェントを作成</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            リセット
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* チャットエリア */}
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
          {/* メッセージ */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 入力 */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={1}
                disabled={isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className={`p-2.5 rounded-xl transition-colors ${
                  input.trim() && !isProcessing
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">
              Cmd + Enter で送信
            </p>
          </div>
        </div>

        {/* 設定プレビュー（デスクトップ） */}
        <AnimatePresence>
          {currentStep !== 'describe' && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block border-l border-gray-200 bg-white overflow-hidden"
            >
              <div className="w-80 p-6 h-full overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-indigo-600" />
                  エージェント設定
                </h3>

                {/* 名前 */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">名前</label>
                  <input
                    type="text"
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="エージェント名"
                  />
                </div>

                {/* 役割 */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">役割</label>
                  <input
                    type="text"
                    value={agentConfig.role}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="競合分析、日報作成など"
                  />
                </div>

                {/* ツール */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">使用ツール</label>
                  <div className="space-y-2">
                    {AVAILABLE_TOOLS.map((tool) => {
                      const Icon = tool.icon
                      const isSelected = agentConfig.tools.includes(tool.id)
                      return (
                        <button
                          key={tool.id}
                          onClick={() => toggleTool(tool.id)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                            <div className="text-xs text-gray-500">{tool.description}</div>
                          </div>
                          {isSelected && (
                            <CheckIcon className="w-5 h-5 text-indigo-600" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 保存ボタン */}
                {currentStep === 'complete' && (
                  <button
                    onClick={handleSaveAgent}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    エージェントを保存
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* モバイル用プレビュー */}
      {currentStep === 'complete' && (
        <div className="lg:hidden p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleSaveAgent}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-5 h-5" />
            「{agentConfig.name}」を保存
          </button>
        </div>
      )}
    </div>
  )
}
