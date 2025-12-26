/**
 * チャットロジックフック
 *
 * メッセージの送受信、タイピングエフェクト、会話管理を担当
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  createConversation,
  getMessages,
  addMessage,
  updateConversationTitle,
  getCompanyFileSearchStores,
  getCompanyDriveConnection,
  getCompanyDriveSyncStatus,
  getDocuments,
  CompanyDriveConnection,
} from '@/lib/firestore-chat'
import {
  queryWithFileSearch,
  Citation,
  generateSearchQuery,
  advancedKnowledgeSearch,
} from '@/lib/gemini-file-search'
import {
  ALL_MODELS,
  ModelOption,
  DEFAULT_MODEL,
  BUILT_IN_GEMINI_API_KEY,
  chat as aiChat,
  AIProvider,
} from '@/lib/ai-providers'
import { TYPING, GEMINI_LIMITS } from '@/lib/constants'
import { chatLogger } from '@/lib/logger'
import type { ChatMessage, ApiKeys, FileSearchStore, DocumentData, LoadedMessage, DriveSearchResult } from '../types'

const createWelcomeMessage = (): ChatMessage => ({
  id: '1',
  role: 'assistant',
  content:
    'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。ナレッジベースにドキュメントがアップロードされていれば、自動で検索してお答えします。',
  timestamp: new Date(),
})

export function useChat() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()

  // State
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isKnowledgeSearchEnabled, setIsKnowledgeSearchEnabled] = useState(true)
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [shouldStopTyping, setShouldStopTyping] = useState(false)
  const [fileSearchStores, setFileSearchStores] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL)
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ anthropic: '', openai: '' })
  const [companyDriveConnection, setCompanyDriveConnection] =
    useState<CompanyDriveConnection | null>(null)
  const [documentNameMap, setDocumentNameMap] = useState<Record<string, string>>({})

  // Refs
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const isSendingRef = useRef(false)

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
      } catch (err) {
        chatLogger.error('Failed to fetch API keys:', err)
      }
    }
    fetchApiKeys()
  }, [user])

  // File Search StoresとDrive接続を取得
  useEffect(() => {
    const loadStoresAndDrive = async () => {
      if (!profile?.companyId) return

      const firestoreStores = await getCompanyFileSearchStores(profile.companyId)
      const firestoreStoreNames = (firestoreStores as FileSearchStore[])
        .map((s) => s.storeName)
        .filter((name): name is string => Boolean(name))
      chatLogger.debug('Firestore File Search Stores:', firestoreStoreNames)

      const driveSyncStatus = await getCompanyDriveSyncStatus(profile.companyId)

      const allStoreNames = Array.from(
        new Set([
          ...firestoreStoreNames,
          ...(driveSyncStatus?.driveStoreName ? [driveSyncStatus.driveStoreName] : []),
        ])
      )

      const limitedStoreNames = allStoreNames.slice(0, GEMINI_LIMITS.MAX_STORES_PER_QUERY)
      chatLogger.debug('Final Store Names:', limitedStoreNames)
      setFileSearchStores(limitedStoreNames)

      const driveConnection = await getCompanyDriveConnection(profile.companyId)
      setCompanyDriveConnection(driveConnection)

      const documents = await getDocuments(profile.companyId)
      const nameMap: Record<string, string> = {};
      (documents as DocumentData[]).forEach((doc) => {
        if (doc.geminiFileName && doc.originalFileName) {
          nameMap[doc.geminiFileName] = doc.originalFileName
        }
      })
      setDocumentNameMap(nameMap)
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

  // クリーンアップ
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      timeoutsRef.current = []
    }
  }, [])

  const resetChat = useCallback(() => {
    setConversationId(null)
    setMessages([createWelcomeMessage()])
    setInput('')
    setIsProcessing(false)
    setError(null)
  }, [])

  const loadExistingConversation = async (id: string) => {
    try {
      const loadedMessages = (await getMessages(id)) as LoadedMessage[]
      if (loadedMessages.length > 0) {
        setConversationId(id)
        const mappedMessages = loadedMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
          citations: m.citations?.map((c) => ({
            ...c,
            source: c.source || 'knowledge',
          })),
          provider: m.provider,
          showCitations: true,
        }))
        setMessages(mappedMessages as ChatMessage[])
        const latestAi = [...loadedMessages].reverse().find((m) => m.role === 'assistant')
        if (latestAi) setCurrentAiMessageId(latestAi.id)
      } else {
        resetChat()
        router.push('/chat')
      }
    } catch (err) {
      chatLogger.error('Error loading conversation:', err)
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
      chatLogger.error('Error creating conversation:', err)
      setError('会話の作成に失敗しました')
      return null
    }
  }

  const getSelectedModelInfo = (): ModelOption | undefined => {
    return ALL_MODELS.find((m) => m.id === selectedModel)
  }

  const getApiKeyForProvider = (provider: AIProvider): string => {
    if (provider === 'gemini') return BUILT_IN_GEMINI_API_KEY
    return apiKeys[provider] || ''
  }

  const hasApiKeyForModel = (modelId: string): boolean => {
    const model = ALL_MODELS.find((m) => m.id === modelId)
    if (!model) return false
    if (model.provider === 'gemini') return true
    return !!apiKeys[model.provider]
  }

  const hasKnowledgeApiKey = !!BUILT_IN_GEMINI_API_KEY

  const handleStopTyping = useCallback(() => {
    setShouldStopTyping(true)
    setIsTyping(false)
    setIsProcessing(false)
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    timeoutsRef.current = []
  }, [])

  const switchAlternative = useCallback((messageId: string, direction: 'prev' | 'next') => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.alternatives && msg.alternatives.length > 0) {
          const currentIndex = msg.currentAlternativeIndex || 0
          let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
          if (newIndex < 0) newIndex = msg.alternatives.length - 1
          if (newIndex >= msg.alternatives.length) newIndex = 0
          return {
            ...msg,
            content: msg.alternatives[newIndex],
            currentAlternativeIndex: newIndex,
          }
        }
        return msg
      })
    )
  }, [])

  const handleSend = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isProcessing || isSendingRef.current) return
    isSendingRef.current = true

    const modelInfo = getSelectedModelInfo()
    if (!modelInfo) {
      setError('モデルが選択されていません')
      isSendingRef.current = false
      return
    }

    if (!hasApiKeyForModel(selectedModel)) {
      setError(
        `${modelInfo.providerName}のAPIキーが設定されていません。設定画面でAPIキーを登録してください。`
      )
      isSendingRef.current = false
      return
    }

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, tempUserMessage])
    setInput('')
    setIsProcessing(true)
    setError(null)

    let currentConversationId = conversationId
    if (!currentConversationId) {
      currentConversationId = await createNewConversation()
      if (!currentConversationId) {
        setIsProcessing(false)
        isSendingRef.current = false
        return
      }
    }

    const isFirstMessage = messages.length === 1
    if (isFirstMessage && currentConversationId) {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text
      await updateConversationTitle(currentConversationId, title)
    }

    try {
      const savedUserMessage = await addMessage(currentConversationId, 'user', text)

      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      history.push({ role: 'user', content: text })

      let aiResponse: string
      let citations: Citation[] = []
      let usedModel = selectedModel
      let driveContext = ''

      // AIに最適な検索クエリを生成させる
      let searchQueries: string[] = [text]
      if (
        isKnowledgeSearchEnabled &&
        (fileSearchStores.length > 0 || companyDriveConnection?.isConnected)
      ) {
        const queryResult = await generateSearchQuery(
          BUILT_IN_GEMINI_API_KEY,
          text,
          history.slice(0, -1)
        )
        if (!queryResult.error) {
          searchQueries = queryResult.queries || [text]
        }
      }

      // ドライブ検索
      if (
        isKnowledgeSearchEnabled &&
        companyDriveConnection?.isConnected &&
        companyDriveConnection.accessToken
      ) {
        try {
          const driveQueries = searchQueries.slice(0, 2)
          const driveSearchPromises = driveQueries.map((query) =>
            fetch('/api/drive/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: companyDriveConnection.accessToken,
                query: query,
                folderId: companyDriveConnection.driveFolderId,
              }),
            })
              .then((res) => (res.ok ? res.json() : { results: [] }))
              .catch(() => ({ results: [] }))
          )

          interface DriveResult {
            id: string
            name: string
            content: string
            webViewLink?: string
          }

          const driveResultsArray = await Promise.all(driveSearchPromises)
          const allDriveResults: DriveResult[] = []
          const seenDriveIds = new Set<string>()

          driveResultsArray.forEach((driveResults) => {
            if (driveResults.results) {
              (driveResults.results as DriveResult[]).forEach((result) => {
                if (!seenDriveIds.has(result.id)) {
                  seenDriveIds.add(result.id)
                  allDriveResults.push(result)
                }
              })
            }
          })

          if (allDriveResults.length > 0) {
            driveContext = '\n\n【Googleドライブから見つかった関連情報】\n'
            allDriveResults.slice(0, 5).forEach((result) => {
              driveContext += `\n--- ${result.name} ---\n${result.content}\n`
              citations.push({
                title: result.name,
                text: result.content.slice(0, 300),
                uri: result.webViewLink || '',
                source: 'drive',
              })
            })
          }
        } catch (driveError) {
          chatLogger.error('Drive search error:', driveError)
        }
      }

      // ナレッジ検索
      let knowledgeContext = ''
      if (isKnowledgeSearchEnabled && fileSearchStores.length > 0 && hasKnowledgeApiKey) {
        try {
          const searchResult = await advancedKnowledgeSearch(
            BUILT_IN_GEMINI_API_KEY,
            fileSearchStores,
            text,
            searchQueries
          )

          if (!searchResult.error && searchResult.citations.length > 0) {
            knowledgeContext = '\n\n【社内ナレッジから見つかった関連情報】\n'
            searchResult.citations.forEach((citation) => {
              let displayTitle = citation.title

              if (citation.uri) {
                const fileNameMatch = citation.uri.match(/files\/([^/?]+)/)
                if (fileNameMatch) {
                  const geminiFileName = `files/${fileNameMatch[1]}`
                  if (documentNameMap[geminiFileName]) {
                    displayTitle = documentNameMap[geminiFileName]
                  }
                }
              }

              if (displayTitle.startsWith('files/') && documentNameMap[displayTitle]) {
                displayTitle = documentNameMap[displayTitle]
              }

              knowledgeContext += `\n--- ${displayTitle} ---\n${citation.text}\n`
              citations.push({
                ...citation,
                title: displayTitle,
                source: 'knowledge',
              })
            })
          }
        } catch (searchError) {
          chatLogger.error('Knowledge search error:', searchError)
        }
      }

      // AIレスポンス生成
      const apiKey = getApiKeyForProvider(modelInfo.provider)
      const combinedContext = driveContext + knowledgeContext
      const systemPrompt = combinedContext
        ? `日本語で回答してください。質問に対して丁寧に回答してください。以下の情報を参考にしてください：${combinedContext}`
        : '日本語で回答してください。質問に対して丁寧に回答してください。'

      const result = await aiChat(modelInfo.provider, apiKey, history, selectedModel, systemPrompt)

      if (result.error) throw new Error(result.error)

      aiResponse = result.content
      usedModel = selectedModel

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== tempUserMessage.id)
          .concat([
            {
              id: savedUserMessage.id,
              role: 'user',
              content: text,
              timestamp: new Date(),
            },
          ])
      )

      const savedAiMessage = await addMessage(
        currentConversationId,
        'assistant',
        aiResponse,
        citations
      )

      // タイピングエフェクト
      const aiMessageId = savedAiMessage.id
      const initialAiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        citations: citations.length > 0 ? citations : undefined,
        alternatives: [aiResponse],
        currentAlternativeIndex: 0,
        model: usedModel,
        showCitations: false,
      }

      setMessages((prev) => [...prev, initialAiMessage])
      setCurrentAiMessageId(aiMessageId)

      setShouldStopTyping(false)
      setIsTyping(true)
      let currentIndex = 0

      const typeNextCharacter = () => {
        if (shouldStopTyping) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? { ...m, content: aiResponse.substring(0, currentIndex), showCitations: true }
                : m
            )
          )
          setIsTyping(false)
          setIsProcessing(false)
          setShouldStopTyping(false)
          isSendingRef.current = false
          return
        }

        if (currentIndex < aiResponse.length) {
          currentIndex = Math.min(currentIndex + TYPING.CHARS_PER_FRAME, aiResponse.length)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, content: aiResponse.substring(0, currentIndex) } : m
            )
          )
          const timeoutId = setTimeout(typeNextCharacter, TYPING.SPEED_MS)
          timeoutsRef.current.push(timeoutId)
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMessageId ? { ...m, showCitations: true } : m))
          )
          setIsTyping(false)
          setIsProcessing(false)
          isSendingRef.current = false
        }
      }

      typeNextCharacter()
    } catch (err: unknown) {
      chatLogger.error('Error sending message:', err)
      const message = err instanceof Error ? err.message : 'メッセージの送信に失敗しました'
      setError(message)
      setIsProcessing(false)
      isSendingRef.current = false
    }
  }

  const regenerateResponse = async (userMessageId: string, userMessageContent: string) => {
    const modelInfo = getSelectedModelInfo()
    if (isProcessing || !modelInfo) return

    if (!hasApiKeyForModel(selectedModel)) {
      setError(
        `${modelInfo.providerName}のAPIキーが設定されていません。設定画面でAPIキーを登録してください。`
      )
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const messageIndex = messages.findIndex((m) => m.id === userMessageId)
      const aiMessage = messages[messageIndex + 1]

      if (!aiMessage || aiMessage.role !== 'assistant') {
        throw new Error('AI応答が見つかりません')
      }

      const history = messages
        .slice(0, messageIndex + 1)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

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

      if (conversationId) {
        await addMessage(conversationId, 'assistant', aiResponse, citations)
      }

      const existingAlternatives = aiMessage.alternatives || [aiMessage.content]

      setMessages((prev) =>
        prev.map((msg) => {
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
        })
      )

      setShouldStopTyping(false)
      setIsTyping(true)
      let currentIndex = 0

      const typeNextCharacter = () => {
        if (shouldStopTyping) {
          const partialContent = aiResponse.substring(0, currentIndex)
          const updatedAlternatives = [...existingAlternatives, partialContent]
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === aiMessage.id) {
                return {
                  ...msg,
                  content: partialContent,
                  alternatives: updatedAlternatives,
                  currentAlternativeIndex: updatedAlternatives.length - 1,
                }
              }
              return msg
            })
          )
          setIsTyping(false)
          setIsProcessing(false)
          setShouldStopTyping(false)
          return
        }

        if (currentIndex < aiResponse.length) {
          currentIndex = Math.min(currentIndex + TYPING.CHARS_PER_FRAME, aiResponse.length)
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === aiMessage.id) {
                return { ...msg, content: aiResponse.substring(0, currentIndex) }
              }
              return msg
            })
          )
          const timeoutId = setTimeout(typeNextCharacter, TYPING.SPEED_MS)
          timeoutsRef.current.push(timeoutId)
        } else {
          const updatedAlternatives = [...existingAlternatives, aiResponse]
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === aiMessage.id) {
                return {
                  ...msg,
                  content: aiResponse,
                  alternatives: updatedAlternatives,
                  currentAlternativeIndex: updatedAlternatives.length - 1,
                }
              }
              return msg
            })
          )
          setIsTyping(false)
          setIsProcessing(false)
        }
      }

      typeNextCharacter()
    } catch (err: unknown) {
      chatLogger.error('Error regenerating:', err)
      const message = err instanceof Error ? err.message : '回答の再生成に失敗しました'
      setError(message)
      setIsProcessing(false)
    }
  }

  return {
    // State
    conversationId,
    messages,
    input,
    setInput,
    isProcessing,
    error,
    isKnowledgeSearchEnabled,
    setIsKnowledgeSearchEnabled,
    currentAiMessageId,
    setCurrentAiMessageId,
    isTyping,
    selectedModel,
    setSelectedModel,
    apiKeys,
    companyDriveConnection,

    // Actions
    handleSend,
    handleStopTyping,
    switchAlternative,
    regenerateResponse,
    resetChat,

    // Utilities
    getSelectedModelInfo,
    hasApiKeyForModel,
  }
}
