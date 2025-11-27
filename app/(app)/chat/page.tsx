'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import {
  SparklesIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '@/contexts/AuthContext'
import {
  createConversation,
  getMessages,
  addMessage,
  updateConversationTitle,
  getCompanyFileSearchStores,
  getCompanyDriveConnection,
  CompanyDriveConnection,
} from '@/lib/firestore-chat'
import { queryWithFileSearch, Citation, chat as geminiChat } from '@/lib/gemini-file-search'
import { ALL_MODELS, ModelOption, DEFAULT_MODEL, BUILT_IN_GEMINI_API_KEY, chat as aiChat, AIProvider } from '@/lib/ai-providers'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  citations?: Citation[]
  alternatives?: string[]
  currentAlternativeIndex?: number
  model?: string
}

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isKnowledgeSearchEnabled, setIsKnowledgeSearchEnabled] = useState(true)
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [shouldStopTyping, setShouldStopTyping] = useState(false)
  const [fileSearchStores, setFileSearchStores] = useState<string[]>([])
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [companyDriveConnection, setCompanyDriveConnection] = useState<CompanyDriveConnection | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // APIキーを取得
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!user) return
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid))
        if (profileDoc.exists()) {
          const data = profileDoc.data()
          setApiKeys({
            anthropic: data.anthropic_api_key || '',
            openai: data.openai_api_key || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch API keys:', error)
      }
    }
    fetchApiKeys()
  }, [user])

  // File Search StoresとDrive接続を取得
  useEffect(() => {
    const loadStoresAndDrive = async () => {
      if (profile?.companyId) {
        // File Search Stores
        const stores = await getCompanyFileSearchStores(profile.companyId)
        setFileSearchStores(stores.map((s: any) => s.storeName).filter(Boolean))

        // Company Drive Connection
        const driveConnection = await getCompanyDriveConnection(profile.companyId)
        setCompanyDriveConnection(driveConnection)
      }
    }
    loadStoresAndDrive()
  }, [profile?.companyId])

  // URLパラメータから会話IDを取得
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && id !== conversationId) {
      loadExistingConversation(id)
    } else if (!id && conversationId) {
      resetChat()
    } else if (!id && !conversationId && messages.length === 0) {
      setMessages([createWelcomeMessage()])
    }
  }, [searchParams])

  const createWelcomeMessage = (): Message => ({
    id: '1',
    role: 'assistant',
    content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。ナレッジベースにドキュメントがアップロードされていれば、自動で検索してお答えします。',
    timestamp: new Date(),
  })

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }
  }

  const resetChat = () => {
    setConversationId(null)
    setMessages([createWelcomeMessage()])
    setInput('')
    resetTextareaHeight()
    setIsProcessing(false)
    setError(null)
  }

  const loadExistingConversation = async (id: string) => {
    try {
      const loadedMessages = await getMessages(id)
      if (loadedMessages.length > 0) {
        setConversationId(id)
        setMessages(loadedMessages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
          citations: m.citations,
          provider: m.provider,
        })))
        const latestAi = [...loadedMessages].reverse().find((m: any) => m.role === 'assistant')
        if (latestAi) setCurrentAiMessageId(latestAi.id)
      } else {
        resetChat()
        router.push('/chat')
      }
    } catch (err) {
      resetChat()
      router.push('/chat')
    }
  }

  const createNewConversation = async () => {
    if (!user) return null
    try {
      const conversation = await createConversation(user.uid, '新しい会話')
      setConversationId(conversation.id)
      router.replace(`/chat?id=${conversation.id}`, { scroll: false })
      return conversation.id
    } catch (err) {
      console.error('Error creating conversation:', err)
      setError('会話の作成に失敗しました')
      return null
    }
  }

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current = []
    }
  }, [])

  const handleStopTyping = () => {
    setShouldStopTyping(true)
    setIsTyping(false)
    setIsProcessing(false)
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current = []
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const switchAlternative = (messageId: string, direction: 'prev' | 'next') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.alternatives && msg.alternatives.length > 0) {
        const currentIndex = msg.currentAlternativeIndex || 0
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
        if (newIndex < 0) newIndex = msg.alternatives.length - 1
        if (newIndex >= msg.alternatives.length) newIndex = 0
        return {
          ...msg,
          content: msg.alternatives[newIndex],
          currentAlternativeIndex: newIndex
        }
      }
      return msg
    }))
  }

  const getModelDisplayName = (modelId: string): string => {
    const model = ALL_MODELS.find(m => m.id === modelId)
    return model?.name || modelId
  }

  const getSelectedModelInfo = (): ModelOption | undefined => {
    return ALL_MODELS.find(m => m.id === selectedModel)
  }

  const getApiKeyForProvider = (provider: AIProvider): string => {
    if (provider === 'gemini') {
      return BUILT_IN_GEMINI_API_KEY // Geminiは常に使用可能
    }
    return apiKeys[provider] || ''
  }

  const hasApiKeyForModel = (modelId: string): boolean => {
    const model = ALL_MODELS.find(m => m.id === modelId)
    if (!model) return false
    if (model.provider === 'gemini') return true // Geminiは常に使用可能
    return !!apiKeys[model.provider]
  }

  // ナレッジ検索は標準搭載のGemini APIキーを使用
  const hasKnowledgeApiKey = !!BUILT_IN_GEMINI_API_KEY

  const handleSend = async (messageText?: string) => {
    const text = messageText || input

    if (!text.trim() || isProcessing) return

    const modelInfo = getSelectedModelInfo()
    if (!modelInfo) {
      setError('モデルが選択されていません')
      return
    }

    // APIキーのチェック
    if (!hasApiKeyForModel(selectedModel)) {
      setError(`${modelInfo.providerName}のAPIキーが設定されていません。設定画面でAPIキーを登録してください。`)
      return
    }

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, tempUserMessage])
    setInput('')
    resetTextareaHeight()
    setIsProcessing(true)
    setError(null)

    let currentConversationId = conversationId
    if (!currentConversationId) {
      currentConversationId = await createNewConversation()
      if (!currentConversationId) {
        setIsProcessing(false)
        return
      }
    }

    // 最初のメッセージならタイトルを更新
    const isFirstMessage = messages.length === 1
    if (isFirstMessage && currentConversationId) {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text
      await updateConversationTitle(currentConversationId, title)
    }

    try {
      // ユーザーメッセージをFirestoreに保存
      const savedUserMessage = await addMessage(currentConversationId, 'user', text)

      // 会話履歴を構築
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      history.push({ role: 'user', content: text })

      let aiResponse: string
      let citations: Citation[] = []
      let usedModel = selectedModel
      let driveContext = ''

      // ナレッジ検索が有効で、会社がドライブに接続している場合はドライブも検索
      if (isKnowledgeSearchEnabled && companyDriveConnection?.isConnected && companyDriveConnection.accessToken) {
        try {
          const driveSearchResponse = await fetch('/api/drive/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: companyDriveConnection.accessToken,
              query: text,
              folderId: companyDriveConnection.driveFolderId,
            }),
          })

          if (driveSearchResponse.ok) {
            const driveResults = await driveSearchResponse.json()
            if (driveResults.results && driveResults.results.length > 0) {
              // Drive結果をコンテキストとして構築
              driveContext = '\n\n【Googleドライブから見つかった関連情報】\n'
              driveResults.results.forEach((result: any, index: number) => {
                driveContext += `\n--- ${result.name} ---\n${result.content}\n`
                // citationsにも追加
                citations.push({
                  title: result.name,
                  text: result.content.slice(0, 300),
                  uri: result.webViewLink || '',
                  source: 'drive',
                })
              })
            }
          }
        } catch (driveError) {
          console.error('Drive search error:', driveError)
          // ドライブ検索エラーは無視して続行
        }
      }

      // ナレッジ検索が有効で、File Search Storesがある場合
      if (isKnowledgeSearchEnabled && fileSearchStores.length > 0 && hasKnowledgeApiKey) {
        // Gemini File Searchを使って回答を生成（UIには検索プロセスを表示しない）
        // Drive結果がある場合は追加のコンテキストとして渡す
        const systemPrompt = driveContext
          ? `日本語で回答してください。質問に対して丁寧に回答してください。${driveContext}`
          : '日本語で回答してください。質問に対して丁寧に回答してください。'

        const result = await queryWithFileSearch(
          BUILT_IN_GEMINI_API_KEY,
          fileSearchStores,
          text,
          systemPrompt
        )

        if (result.error) {
          throw new Error(result.error)
        }

        aiResponse = result.answer
        // File Searchからのcitationsも追加
        citations = [...citations, ...result.citations]
        usedModel = 'gemini-2.5-pro' // File SearchはGemini 2.5 Pro固定
      } else {
        // 通常のチャット（選択したプロバイダー・モデルを使用）
        const apiKey = getApiKeyForProvider(modelInfo.provider)

        // Drive結果がある場合はシステムプロンプトに追加
        const systemPrompt = driveContext
          ? `日本語で回答してください。質問に対して丁寧に回答してください。以下の情報を参考にしてください：${driveContext}`
          : '日本語で回答してください。質問に対して丁寧に回答してください。'

        const result = await aiChat(
          modelInfo.provider,
          apiKey,
          history,
          selectedModel,
          systemPrompt
        )

        if (result.error) {
          throw new Error(result.error)
        }

        aiResponse = result.content
      }

      // 一時メッセージを実際のメッセージに置き換え
      setMessages(prev =>
        prev
          .filter(m => m.id !== tempUserMessage.id)
          .concat([{
            id: savedUserMessage.id,
            role: 'user',
            content: text,
            timestamp: new Date(),
          }])
      )

      // AIメッセージをFirestoreに保存
      const savedAiMessage = await addMessage(
        currentConversationId,
        'assistant',
        aiResponse,
        citations
      )

      // タイピングエフェクト
      const aiMessageId = savedAiMessage.id
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        citations: citations.length > 0 ? citations : undefined,
        alternatives: [aiResponse],
        currentAlternativeIndex: 0,
        model: usedModel,
      }

      setMessages(prev => [...prev, initialAiMessage])
      setCurrentAiMessageId(aiMessageId)

      // タイピングエフェクト
      setShouldStopTyping(false)
      setIsTyping(true)
      let currentIndex = 0
      const charsPerFrame = 2
      const typingSpeed = 30

      const typeNextCharacter = () => {
        if (shouldStopTyping) {
          setMessages(prev => prev.map(m =>
            m.id === aiMessageId
              ? { ...m, content: aiResponse.substring(0, currentIndex) }
              : m
          ))
          setIsTyping(false)
          setIsProcessing(false)
          setShouldStopTyping(false)
          return
        }

        if (currentIndex < aiResponse.length) {
          currentIndex = Math.min(currentIndex + charsPerFrame, aiResponse.length)
          setMessages(prev => prev.map(m =>
            m.id === aiMessageId
              ? { ...m, content: aiResponse.substring(0, currentIndex) }
              : m
          ))
          const timeoutId = setTimeout(typeNextCharacter, typingSpeed)
          timeoutsRef.current.push(timeoutId)
        } else {
          setIsTyping(false)
          setIsProcessing(false)
        }
      }

      typeNextCharacter()
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'メッセージの送信に失敗しました')
      setIsProcessing(false)
    }
  }

  const regenerateResponse = async (userMessageId: string, userMessageContent: string) => {
    const modelInfo = getSelectedModelInfo()
    if (isProcessing || !modelInfo) return

    if (!hasApiKeyForModel(selectedModel)) {
      setError(`${modelInfo.providerName}のAPIキーが設定されていません。設定画面でAPIキーを登録してください。`)
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessageId)
      const aiMessage = messages[messageIndex + 1]

      if (!aiMessage || aiMessage.role !== 'assistant') {
        throw new Error('AI応答が見つかりません')
      }

      // 会話履歴を構築（再生成する質問まで）
      const history = messages
        .slice(0, messageIndex + 1)
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      let aiResponse: string
      let citations: Citation[] = []
      let usedModel = selectedModel

      if (isKnowledgeSearchEnabled && fileSearchStores.length > 0 && hasKnowledgeApiKey) {
        const result = await queryWithFileSearch(
          BUILT_IN_GEMINI_API_KEY,
          fileSearchStores,
          userMessageContent,
          '日本語で回答してください。質問に対して丁寧に回答してください。'
        )
        if (result.error) throw new Error(result.error)
        aiResponse = result.answer
        citations = result.citations
        usedModel = 'gemini-2.5-pro'
      } else {
        const apiKey = getApiKeyForProvider(modelInfo.provider)
        const result = await aiChat(
          modelInfo.provider,
          apiKey,
          history,
          selectedModel,
          '日本語で回答してください。質問に対して丁寧に回答してください。'
        )
        if (result.error) throw new Error(result.error)
        aiResponse = result.content
      }

      // Firestoreに保存
      if (conversationId) {
        await addMessage(conversationId, 'assistant', aiResponse, citations)
      }

      // 既存のalternativesを取得
      let existingAlternatives = aiMessage.alternatives || [aiMessage.content]

      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMessage.id) {
          return {
            ...msg,
            content: '',
            alternatives: existingAlternatives,
            currentAlternativeIndex: existingAlternatives.length,
            citations: citations.length > 0 ? citations : msg.citations,
            model: usedModel,
          }
        }
        return msg
      }))

      // タイピングエフェクト
      setShouldStopTyping(false)
      setIsTyping(true)
      let currentIndex = 0

      const typeNextCharacter = () => {
        if (shouldStopTyping) {
          const partialContent = aiResponse.substring(0, currentIndex)
          const updatedAlternatives = [...existingAlternatives, partialContent]
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessage.id) {
              return {
                ...msg,
                content: partialContent,
                alternatives: updatedAlternatives,
                currentAlternativeIndex: updatedAlternatives.length - 1
              }
            }
            return msg
          }))
          setIsTyping(false)
          setIsProcessing(false)
          setShouldStopTyping(false)
          return
        }

        if (currentIndex < aiResponse.length) {
          currentIndex = Math.min(currentIndex + 2, aiResponse.length)
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessage.id) {
              return { ...msg, content: aiResponse.substring(0, currentIndex) }
            }
            return msg
          }))
          const timeoutId = setTimeout(typeNextCharacter, 30)
          timeoutsRef.current.push(timeoutId)
        } else {
          const updatedAlternatives = [...existingAlternatives, aiResponse]
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessage.id) {
              return {
                ...msg,
                content: aiResponse,
                alternatives: updatedAlternatives,
                currentAlternativeIndex: updatedAlternatives.length - 1
              }
            }
            return msg
          }))
          setIsTyping(false)
          setIsProcessing(false)
        }
      }

      typeNextCharacter()
    } catch (err: any) {
      console.error('Error regenerating:', err)
      setError(err.message || '回答の再生成に失敗しました')
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
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
            <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">AIアシスタント</h1>
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
              <span className="text-sm font-bold text-gray-900 hidden sm:inline">{getModelDisplayName(selectedModel)}</span>
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
                  {/* Gemini（常に利用可能） */}
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-500">Google Gemini（常に利用可能）</span>
                  </div>
                  {ALL_MODELS.filter(m => m.provider === 'gemini').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
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
                      {!apiKeys.anthropic && <span className="text-orange-500 ml-1">（APIキー未設定）</span>}
                    </span>
                  </div>
                  {ALL_MODELS.filter(m => m.provider === 'anthropic').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
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
                      {!apiKeys.openai && <span className="text-orange-500 ml-1">（APIキー未設定）</span>}
                    </span>
                  </div>
                  {ALL_MODELS.filter(m => m.provider === 'openai').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id)
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
            <span className="text-xs md:text-sm font-medium text-gray-700 hidden sm:inline">ナレッジ</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gray-50">
        {messages.map((message) => {
          // システムメッセージはスキップ
          if (message.role === 'system') return null

          const messageModel = message.model || selectedModel

          // Regular messages
          return (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-2xl w-full">
                <div className={`${
                  message.role === 'user'
                    ? 'bg-black text-white ml-auto relative'
                    : 'bg-white border border-gray-300'
                } rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-sm`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <SparklesIcon className="w-4 h-4 text-gray-900" />
                      <span className="text-xs font-bold text-gray-900">{getModelDisplayName(messageModel)}</span>
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
                  <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {message.role === 'user' && (
                    <button
                      onClick={() => {
                        regenerateResponse(message.id, message.content)
                        const nextAiMessage = messages[messages.findIndex(m => m.id === message.id) + 1]
                        if (nextAiMessage?.role === 'assistant') {
                          setCurrentAiMessageId(nextAiMessage.id)
                        }
                      }}
                      disabled={isProcessing}
                      className="group absolute -bottom-3 -left-3 p-1.5 bg-gray-800/90 hover:bg-gray-900 border border-gray-600 rounded-lg transition-all disabled:opacity-50"
                      title="回答を再生成"
                    >
                      <ArrowPathIcon className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 font-bold mb-2">📚 参照した情報源</p>
                    {message.citations.map((citation, i) => (
                      <div key={i} className={`border rounded-lg p-3 ${
                        citation.source === 'drive'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">
                            {citation.source === 'drive' ? '📁' : '📄'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                citation.source === 'drive'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
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
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{citation.text.slice(0, 200)}...</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {isProcessing && !isTyping && (
          <div className="flex justify-start">
            <div className="max-w-2xl w-full">
              <div className="bg-white border border-gray-300 rounded-xl px-6 py-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-gray-900" />
                  <span className="text-xs font-bold text-gray-900">{getModelDisplayName(selectedModel)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm">考え中...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Alternative Switcher */}
      {currentAiMessageId && (() => {
        const currentMessage = messages.find(m => m.id === currentAiMessageId)
        if (currentMessage?.alternatives && currentMessage.alternatives.length > 1) {
          return (
            <div className="border-t border-gray-200 bg-white px-6 py-3">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1 bg-white border-2 border-gray-300 rounded-full px-4 py-2 shadow-lg">
                  <button onClick={() => switchAlternative(currentAiMessageId, 'prev')} disabled={isProcessing} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <span className="text-sm font-bold text-gray-700 min-w-[3rem] text-center px-3">
                    {(currentMessage.currentAlternativeIndex || 0) + 1} / {currentMessage.alternatives.length}
                  </span>
                  <button onClick={() => switchAlternative(currentAiMessageId, 'next')} disabled={isProcessing} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronRightIcon className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* Input */}
      <div className="border-t border-gray-200 p-3 md:p-6 bg-white">
        <div className="flex gap-2 md:gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              // 自動リサイズ
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
            }}
            onKeyDown={(e) => {
              // Enterで送信、Shift+Enterで改行
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (input.trim() && !isProcessing) {
                  handleSend()
                }
              }
            }}
            placeholder="相談内容を入力... (Shift+Enterで改行)"
            disabled={isProcessing}
            rows={1}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 placeholder-gray-500 disabled:bg-gray-100 text-sm md:text-base resize-none overflow-y-auto"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
          {isTyping ? (
            <button onClick={handleStopTyping} className="px-3 md:px-6 py-2.5 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
              <span className="hidden sm:inline">停止</span>
              <div className="w-4 h-4 border-2 border-white sm:hidden"></div>
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isProcessing}
              className="px-3 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1 md:gap-2 font-semibold"
            >
              <span className="hidden sm:inline">送信</span>
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-end mt-2 md:mt-3">
          {/* ナレッジ検索トグル（ドライブ接続時はドライブも検索） */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${isKnowledgeSearchEnabled ? 'text-green-600' : 'text-gray-500'}`}>
              ナレッジ検索
              {companyDriveConnection?.isConnected && isKnowledgeSearchEnabled && (
                <span className="text-blue-500 ml-1">+ Drive</span>
              )}
            </span>
            <button
              onClick={() => setIsKnowledgeSearchEnabled(!isKnowledgeSearchEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                isKnowledgeSearchEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                  isKnowledgeSearchEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
