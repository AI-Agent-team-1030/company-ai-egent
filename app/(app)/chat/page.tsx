'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import {
  SparklesIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ChevronDownIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { KnowledgeItem } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { apiGet, apiPost, apiPatch } from '@/lib/api-client'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  searchProcess?: SearchStep[]
  relatedKnowledge?: KnowledgeItem[]
  alternatives?: string[] // 複数の回答を保存
  currentAlternativeIndex?: number // 現在表示している回答のインデックス
}

interface SearchStep {
  id: string
  type: 'searching' | 'checking' | 'analyzing' | 'completed'
  message: string
  knowledgeTitle?: string
}

interface AIModel {
  id: string
  name: string
  provider: 'Anthropic' | 'OpenAI' | 'Google Gemini'
  description: string
}

// AIモデルの定義
const AI_MODELS: AIModel[] = [
  {
    id: 'sonnet-4.5',
    name: 'Sonnet 4.5',
    provider: 'Anthropic',
    description: '高性能・推奨',
  },
  {
    id: 'haiku-4.5',
    name: 'Haiku 4.5',
    provider: 'Anthropic',
    description: '高速・軽量',
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    description: '最新・高性能',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google Gemini',
    description: '最新・高性能',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google Gemini',
    description: '高速・軽量',
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'Google Gemini',
    description: '高性能',
  },
]

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const [isKnowledgeSearchEnabled, setIsKnowledgeSearchEnabled] = useState(true) // ナレッジ検索のON/OFF
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null) // 現在選択されているAIメッセージ
  const [isTyping, setIsTyping] = useState(false) // タイピング中かどうか
  const [shouldStopTyping, setShouldStopTyping] = useState(false) // タイピングを停止するフラグ
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // URLパラメータから会話IDを取得して既存の会話をロード
  useEffect(() => {
    const id = searchParams.get('id')
    const currentId = conversationId

    if (id && id !== currentId) {
      // 異なる会話IDの場合のみロード
      loadExistingConversation(id)
    } else if (!id && currentId) {
      // URLに会話IDがなく、既存の会話IDがある場合は初期状態にリセット
      setConversationId(null)
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。社内のナレッジベースから最適な情報を自動で探してお答えします。',
        timestamp: new Date(),
      }])
      setInput('')
      setIsProcessing(false)
      setError(null)
    } else if (!id && !currentId && messages.length === 0) {
      // 初回読み込み時
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。社内のナレッジベースから最適な情報を自動で探してお答えします。',
        timestamp: new Date(),
      }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const loadExistingConversation = async (id: string) => {
    try {
      const response = await apiGet(`/api/chat/conversations/${id}`)

      if (!response.ok) {
        // 会話が見つからない場合は初期状態に戻す
        setConversationId(null)
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。社内のナレッジベースから最適な情報を自動で探してお答えします。',
          timestamp: new Date(),
        }])
        router.push('/chat')
        return
      }

      const conversation = await response.json()
      setConversationId(conversation.id)

      // メッセージをロード
      if (conversation.messages && conversation.messages.length > 0) {
        // メッセージをグループ化して重複を除去
        const rawMessages = conversation.messages
        const groupedMessages: Message[] = []

        let i = 0
        while (i < rawMessages.length) {
          const msg = rawMessages[i]

          if (msg.role === 'user') {
            const userContent = msg.content
            const firstUserId = msg.id
            const firstUserTimestamp = new Date(msg.created_at)

            // このユーザーメッセージと同じ内容のメッセージ+AI応答を全て収集
            const aiAlternatives: string[] = []
            const aiMessageIds: string[] = []
            const aiTimestamps: Date[] = []

            // 同じ内容のuser-assistant ペアを全て収集
            while (i < rawMessages.length) {
              const currentMsg = rawMessages[i]

              // ユーザーメッセージが同じ内容の場合
              if (currentMsg.role === 'user' && currentMsg.content === userContent) {
                i++ // ユーザーメッセージをスキップ

                // 次のアシスタントメッセージを収集
                if (i < rawMessages.length && rawMessages[i].role === 'assistant') {
                  aiAlternatives.push(rawMessages[i].content)
                  aiMessageIds.push(rawMessages[i].id)
                  aiTimestamps.push(new Date(rawMessages[i].created_at))
                  i++
                }
              } else {
                // 異なる内容のユーザーメッセージが来たらループを抜ける
                break
              }
            }

            // 最初のユーザーメッセージのみを追加
            groupedMessages.push({
              id: firstUserId,
              role: 'user',
              content: userContent,
              timestamp: firstUserTimestamp,
            })

            // AI応答がある場合は1つのメッセージとしてまとめる
            if (aiAlternatives.length > 0) {
              groupedMessages.push({
                id: aiMessageIds[aiMessageIds.length - 1], // 最新のIDを使用
                role: 'assistant',
                content: aiAlternatives[aiAlternatives.length - 1], // 最新の回答を表示
                timestamp: aiTimestamps[aiTimestamps.length - 1],
                alternatives: aiAlternatives,
                currentAlternativeIndex: aiAlternatives.length - 1, // 最新の回答を表示
              })
            }
          } else {
            // システムメッセージなど（通常はないはず）
            groupedMessages.push({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
            })
            i++
          }
        }

        setMessages(groupedMessages)

        // 最新のAIメッセージを選択状態にする
        const latestAiMessage = [...groupedMessages].reverse().find(m => m.role === 'assistant')
        if (latestAiMessage) {
          setCurrentAiMessageId(latestAiMessage.id)
        }
      } else {
        // メッセージがない場合は初期メッセージを表示
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。社内のナレッジベースから最適な情報を自動で探してお答えします。',
          timestamp: new Date(),
        }])
      }
    } catch (err) {
      // エラーが発生した場合も初期状態に戻す（エラーメッセージは表示しない）
      setConversationId(null)
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。社内のナレッジベースから最適な情報を自動で探してお答えします。',
        timestamp: new Date(),
      }])
      router.push('/chat')
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await apiPost('/api/chat/conversations', { title: '新しい会話' })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const conversation = await response.json()
      setConversationId(conversation.id)

      // URLを更新（replace を使ってページリロードを防ぐ）
      router.replace(`/chat?id=${conversation.id}`, { scroll: false })

      return conversation.id
    } catch (err) {
      console.error('Error creating conversation:', err)
      setError('会話の作成に失敗しました')
      return null
    }
  }

  // クリーンアップ: コンポーネントのアンマウント時にすべてのタイマーをクリア
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current = []
    }
  }, [])

  // 停止ボタンの処理
  const handleStopTyping = () => {
    setShouldStopTyping(true)
    setIsTyping(false)
    setIsProcessing(false)
    // すべてのタイマーをクリア
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current = []
  }

  // ドロップダウンメニューの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false)
      }
    }

    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isModelDropdownOpen])

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

  // 回答の切り替え
  const switchAlternative = (messageId: string, direction: 'prev' | 'next') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.alternatives && msg.alternatives.length > 0) {
        const currentIndex = msg.currentAlternativeIndex || 0
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1

        // ループ処理
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

  // 回答を再生成
  const regenerateResponse = async (userMessageId: string, userMessageContent: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    setError(null)

    try {
      // ユーザーメッセージの直後のAIメッセージを見つける
      const messageIndex = messages.findIndex(m => m.id === userMessageId)
      const aiMessage = messages[messageIndex + 1]

      if (!aiMessage || aiMessage.role !== 'assistant') {
        throw new Error('AI応答が見つかりません')
      }

      // 新しいAI応答を生成
      const response = await apiPost('/api/chat/messages', {
        conversation_id: conversationId,
        content: userMessageContent,
        model_id: selectedModel.id,
        provider: selectedModel.provider,
        use_knowledge_search: isKnowledgeSearchEnabled, // ナレッジ検索フラグを追加
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to regenerate message')
      }

      const { assistantMessage, usedKnowledge } = await response.json()
      const newContent = assistantMessage.content

      // 検索プロセスを表示（ナレッジ検索を使った場合のみ）
      if (usedKnowledge) {
        const relatedDocs = await searchDocuments(userMessageContent)
        // 検索プロセスは省略して、すぐに結果を表示
      }

      // 既存のAIメッセージのalternativesを取得（クロージャで保持）
      let existingAlternatives: string[] = []
      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMessage.id) {
          // 既存のalternativesを取得、なければ現在のcontentを最初の要素として保存
          existingAlternatives = msg.alternatives || [msg.content]
          return {
            ...msg,
            content: '', // タイピング効果のため一旦空に
            alternatives: existingAlternatives,
            currentAlternativeIndex: existingAlternatives.length // 新しい回答のインデックス
          }
        }
        return msg
      }))

      // タイピングエフェクト
      setShouldStopTyping(false) // 停止フラグをリセット
      setIsTyping(true)
      let currentIndex = 0
      const charsPerFrame = 2
      const typingSpeed = 30

      const typeNextCharacter = () => {
        // 停止フラグがtrueの場合、タイピングを中断
        if (shouldStopTyping) {
          const partialContent = newContent.substring(0, currentIndex)
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

        if (currentIndex < newContent.length) {
          currentIndex = Math.min(currentIndex + charsPerFrame, newContent.length)
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessage.id) {
              return {
                ...msg,
                content: newContent.substring(0, currentIndex)
              }
            }
            return msg
          }))
          const timeoutId = setTimeout(typeNextCharacter, typingSpeed)
          timeoutsRef.current.push(timeoutId)
        } else {
          // タイピング完了後、alternativesに追加
          const updatedAlternatives = [...existingAlternatives, newContent]
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessage.id) {
              return {
                ...msg,
                content: newContent,
                alternatives: updatedAlternatives,
                currentAlternativeIndex: updatedAlternatives.length - 1
              }
            }
            return msg
          }))
          // タイピング完了後にprocessing状態を解除
          setIsTyping(false)
          setIsProcessing(false)
        }
      }

      typeNextCharacter()
    } catch (err: any) {
      console.error('Error regenerating message:', err)
      setError(err.message || '回答の再生成に失敗しました')
      setIsProcessing(false)
    }
  }

  const handleSend = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isProcessing) return

    // 一時的なユーザーメッセージを追加（楽観的更新）
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, tempUserMessage])
    setInput('')
    setIsProcessing(true)
    setError(null)

    // 会話IDがない場合は新しい会話を作成
    let currentConversationId = conversationId
    if (!currentConversationId) {
      currentConversationId = await createNewConversation()
      if (!currentConversationId) {
        setIsProcessing(false)
        return
      }
    }

    // 最初のユーザーメッセージであれば、会話のタイトルを更新
    const isFirstMessage = messages.length === 1 // 初回のAIメッセージのみ
    if (isFirstMessage && currentConversationId) {
      try {
        // タイトルを最初の30文字に制限
        const title = text.length > 30 ? text.substring(0, 30) + '...' : text
        await apiPatch(`/api/chat/conversations/${currentConversationId}`, { title })
      } catch (error) {
        console.error('Failed to update conversation title:', error)
      }
    }

    try {
      // AI APIに送信
      const response = await apiPost('/api/chat/messages', {
        conversation_id: currentConversationId,
        content: text,
        model_id: selectedModel.id,
        provider: selectedModel.provider,
        use_knowledge_search: isKnowledgeSearchEnabled, // ナレッジ検索フラグを追加
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const { userMessage, assistantMessage, usedKnowledge } = await response.json()

      const searchSteps: SearchStep[] = []
      let relatedDocs: any[] = []

      // ナレッジ検索を使った場合のみ、検索プロセスを表示
      if (usedKnowledge) {
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
        relatedDocs = await searchDocuments(text)

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

        // Step 3: 選択したAIで分析中
        const analyzingStep: SearchStep = {
          id: 'step-analyzing',
          type: 'analyzing',
          message: `${selectedModel.name}が情報を分析中...`,
        }
        searchSteps.push(analyzingStep)
        setMessages((prev) => prev.map(m =>
          m.content === 'SEARCH_PROCESS'
            ? { ...m, searchProcess: [...searchSteps] }
            : m
        ))

        await createManagedTimeout(() => {}, 300)

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
      }

      // 実際のDBに保存されたメッセージに置き換え
      const realUserMessage: Message = {
        id: userMessage.id,
        role: 'user',
        content: userMessage.content,
        timestamp: new Date(userMessage.created_at),
      }

      // SEARCH_PROCESSと一時ユーザーメッセージを削除し、実際のユーザーメッセージを追加
      setMessages((prev) =>
        prev
          .filter(m => m.content !== 'SEARCH_PROCESS' && m.id !== tempUserMessage.id)
          .concat([realUserMessage])
      )

      // タイピングエフェクトでAIメッセージを表示
      const fullContent = assistantMessage.content
      const aiMessageId = assistantMessage.id

      // 空のAIメッセージを追加
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
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
        alternatives: [fullContent], // 初回の回答をalternativesに追加
        currentAlternativeIndex: 0,
      }

      setMessages((prev) => [...prev, initialAiMessage])

      // 新しいAIメッセージを選択状態にする
      setCurrentAiMessageId(aiMessageId)

      // タイピングエフェクト（文字を少しずつ表示）
      setShouldStopTyping(false) // 停止フラグをリセット
      setIsTyping(true)
      let currentIndex = 0
      const charsPerFrame = 2 // 1フレームあたりの文字数
      const typingSpeed = 30 // ミリ秒

      const typeNextCharacter = () => {
        // 停止フラグがtrueの場合、タイピングを中断
        if (shouldStopTyping) {
          // 部分的な内容を保存
          setMessages((prev) =>
            prev.map(m => {
              if (m.id === aiMessageId) {
                const partialContent = fullContent.substring(0, currentIndex)
                return {
                  ...m,
                  content: partialContent,
                  alternatives: [partialContent], // 部分的な内容で上書き
                  currentAlternativeIndex: 0
                }
              }
              return m
            })
          )
          setIsTyping(false)
          setIsProcessing(false)
          setShouldStopTyping(false)
          return
        }

        if (currentIndex < fullContent.length) {
          currentIndex = Math.min(currentIndex + charsPerFrame, fullContent.length)
          setMessages((prev) =>
            prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: fullContent.substring(0, currentIndex) }
                : m
            )
          )
          const timeoutId = setTimeout(typeNextCharacter, typingSpeed)
          timeoutsRef.current.push(timeoutId)
        } else {
          // タイピング完了
          setIsTyping(false)
          setIsProcessing(false)
        }
      }

      typeNextCharacter()
    } catch (err: any) {
      console.error('Error sending message:', err)
      setError(err.message || 'メッセージの送信に失敗しました')

      // エラー時：SEARCH_PROCESSを削除し、一時ユーザーメッセージは残す
      setMessages((prev) => prev.filter(m => m.content !== 'SEARCH_PROCESS'))
    } finally {
      setIsProcessing(false)
    }
  }


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

          {/* Model Selector */}
          <div className="relative" ref={modelDropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <SparklesIcon className="w-4 h-4 text-gray-700" />
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900">{selectedModel.name}</div>
                <div className="text-xs text-gray-600">{selectedModel.description}</div>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isModelDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs font-bold text-gray-500 px-3 py-2">Anthropic</div>
                  {AI_MODELS.filter(m => m.provider === 'Anthropic').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model)
                        setIsModelDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                        selectedModel.id === model.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="font-bold text-sm text-gray-900">{model.name}</div>
                      <div className="text-xs text-gray-600">{model.description}</div>
                    </button>
                  ))}

                  <div className="text-xs font-bold text-gray-500 px-3 py-2 mt-2">OpenAI</div>
                  {AI_MODELS.filter(m => m.provider === 'OpenAI').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model)
                        setIsModelDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                        selectedModel.id === model.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="font-bold text-sm text-gray-900">{model.name}</div>
                      <div className="text-xs text-gray-600">{model.description}</div>
                    </button>
                  ))}

                  <div className="text-xs font-bold text-gray-500 px-3 py-2 mt-2">Google Gemini</div>
                  {AI_MODELS.filter(m => m.provider === 'Google Gemini').map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model)
                        setIsModelDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                        selectedModel.id === model.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="font-bold text-sm text-gray-900">{model.name}</div>
                      <div className="text-xs text-gray-600">{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Button */}
          <button
            onClick={() => router.push('/knowledge')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            title="ナレッジベースへ"
          >
            <BookOpenIcon className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">ナレッジ</span>
          </button>
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
                        ? 'bg-black text-white ml-auto relative'
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

                    {/* 再生成ボタン（ユーザーメッセージのみ、メッセージボックス内の左下に配置） */}
                    {message.role === 'user' && (
                      <button
                        onClick={() => {
                          regenerateResponse(message.id, message.content)
                          // 次のAIメッセージを選択状態にする
                          const nextAiMessage = messages[messages.findIndex(m => m.id === message.id) + 1]
                          if (nextAiMessage && nextAiMessage.role === 'assistant') {
                            setCurrentAiMessageId(nextAiMessage.id)
                          }
                        }}
                        disabled={isProcessing}
                        className="group absolute -bottom-3 -left-3 p-1.5 bg-gray-800/90 hover:bg-gray-900 border border-gray-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        title="回答を再生成"
                      >
                        <div className="flex items-center gap-1.5">
                          <ArrowPathIcon className="w-4 h-4 text-white transition-colors" />
                          <span className="text-xs font-medium text-white max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-200 whitespace-nowrap">
                            回答を再生成
                          </span>
                        </div>
                      </button>
                    )}
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

        {/* ローディングメッセージ（AI思考中） - タイピング中は表示しない */}
        {isProcessing && !isTyping && (
          <div className="flex justify-start">
            <div className="max-w-2xl w-full">
              <div className="bg-white border border-gray-300 rounded-xl px-6 py-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-gray-900" />
                  <span className="text-xs font-bold text-gray-900">AI アシスタント</span>
                </div>
                {isKnowledgeSearchEnabled ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">ナレッジ検索中...</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm">回答を生成中...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm">考え中...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>


      {/* 回答切り替えボタン（画面下部固定） */}
      {currentAiMessageId && (() => {
        const currentMessage = messages.find(m => m.id === currentAiMessageId)
        if (currentMessage && currentMessage.alternatives && currentMessage.alternatives.length > 1) {
          return (
            <div className="border-t border-gray-200 bg-white px-6 py-3">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1 bg-white border-2 border-gray-300 rounded-full px-4 py-2 shadow-lg">
                  <button
                    onClick={() => switchAlternative(currentAiMessageId, 'prev')}
                    disabled={isProcessing}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    title="前の回答"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <span className="text-sm font-bold text-gray-700 min-w-[3rem] text-center px-3">
                    {(currentMessage.currentAlternativeIndex || 0) + 1} / {currentMessage.alternatives.length}
                  </span>
                  <button
                    onClick={() => switchAlternative(currentAiMessageId, 'next')}
                    disabled={isProcessing}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    title="次の回答"
                  >
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
          {/* タイピング中は停止ボタンを表示 */}
          {isTyping ? (
            <button
              onClick={handleStopTyping}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold"
            >
              <span>停止</span>
              <div className="w-4 h-4 border-2 border-white"></div>
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isProcessing}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            >
              <span>送信</span>
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            {isKnowledgeSearchEnabled ? 'AIが自動で最適なナレッジを探して回答します' : 'AIが直接回答します（ナレッジ検索なし）'}
          </p>
          {/* ナレッジ検索トグルボタン */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium">ナレッジ検索</span>
            <button
              onClick={() => setIsKnowledgeSearchEnabled(!isKnowledgeSearchEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isKnowledgeSearchEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isKnowledgeSearchEnabled ? 'translate-x-6' : 'translate-x-1'
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
