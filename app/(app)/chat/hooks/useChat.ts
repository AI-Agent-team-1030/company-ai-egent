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
  saveFileSearchStore,
  saveUploadedDocument,
  getCompanyOnedriveConnection,
  CompanyOnedriveConnection,
} from '@/lib/firestore-chat'
import {
  Citation,
  generateSearchQuery,
  summarizeConversation,
  uploadFile,
  importFileToStore,
  createFileSearchStore,
  createGeminiClient,
  RateLimitError,
} from '@/lib/gemini-file-search'
// VectorSearchResult型定義（APIレスポンス用）
interface VectorSearchResult {
  chunk: {
    id: string
    content: string
    metadata: {
      documentId: string
      documentTitle: string
      chunkIndex: number
      totalChunks: number
      companyId: string
      folderId?: string
    }
    createdAt: Date
  }
  score: number
}
import {
  ALL_MODELS,
  ModelOption,
  DEFAULT_MODEL,
  BUILT_IN_GEMINI_API_KEY,
  chat as aiChat,
  AIProvider,
} from '@/lib/ai-providers'
import { TYPING, GEMINI_LIMITS, PROCESSING_STEPS } from '@/lib/constants'
import { chatLogger } from '@/lib/logger'
import type { ChatMessage, ApiKeys, FileSearchStore, DocumentData, DocumentInfo, LoadedMessage, DriveSearchResult } from '../types'

const createWelcomeMessage = (): ChatMessage => ({
  id: '1',
  role: 'assistant',
  content:
    'こんにちは！AIアシスタントです。\n\n何かお困りのことがあれば、お気軽にご相談ください。ナレッジベースにドキュメントがアップロードされていれば、自動で検索してお答えします。',
  timestamp: new Date(),
})

interface UseChatOptions {
  externalConversationId?: string | null
  disableRouting?: boolean
}

export function useChat(options: UseChatOptions = {}) {
  const { externalConversationId, disableRouting = false } = options
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
  const [hasIndexedKnowledge, setHasIndexedKnowledge] = useState(false)
  const [fileSearchStores, setFileSearchStores] = useState<string[]>([]) // Legacy - for save to knowledge
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL)
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ anthropic: '', openai: '' })
  const [companyDriveConnection, setCompanyDriveConnection] =
    useState<CompanyDriveConnection | null>(null)
  const [companyOnedriveConnection, setCompanyOnedriveConnection] =
    useState<CompanyOnedriveConnection | null>(null)
  const [documentInfoMap, setDocumentInfoMap] = useState<Record<string, DocumentInfo>>({})
  const [processingStep, setProcessingStep] = useState<string>('')
  const [isSavingToKnowledge, setIsSavingToKnowledge] = useState(false)
  const [knowledgeSaveSuccess, setKnowledgeSaveSuccess] = useState(false)

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

  // ナレッジインデックスとDrive接続を取得
  useEffect(() => {
    const loadKnowledgeAndDrive = async () => {
      if (!profile?.companyId) return

      // Firestore Vector Searchのインデックス済みドキュメント数を確認
      try {
        const indexRes = await fetch(`/api/knowledge/index?companyId=${profile.companyId}`)
        if (indexRes.ok) {
          const indexData = await indexRes.json()
          chatLogger.debug('Indexed knowledge documents:', indexData.indexedDocuments)
          setHasIndexedKnowledge(indexData.indexedDocuments > 0)
        }
      } catch (err) {
        chatLogger.error('Failed to get indexed document count:', err)
      }

      // Legacy: File Search Stores (ナレッジ保存用に維持)
      const firestoreStores = await getCompanyFileSearchStores(profile.companyId)
      const firestoreStoreNames = (firestoreStores as FileSearchStore[])
        .map((s) => s.storeName)
        .filter((name): name is string => Boolean(name))
      setFileSearchStores(firestoreStoreNames)

      const driveConnection = await getCompanyDriveConnection(profile.companyId)
      setCompanyDriveConnection(driveConnection)

      const onedriveConnection = await getCompanyOnedriveConnection(profile.companyId)
      setCompanyOnedriveConnection(onedriveConnection)

      const documents = await getDocuments(profile.companyId)
      const infoMap: Record<string, DocumentInfo> = {};
      (documents as DocumentData[]).forEach((doc) => {
        if (doc.geminiFileName && doc.originalFileName) {
          infoMap[doc.geminiFileName] = {
            originalFileName: doc.originalFileName,
            fileUrl: doc.fileUrl,
            mimeType: doc.mimeType,
          }
        }
      })
      setDocumentInfoMap(infoMap)
    }
    loadKnowledgeAndDrive()
  }, [profile?.companyId])

  // 会話IDを取得（外部指定 or URLパラメータ）
  useEffect(() => {
    // 外部から指定されたIDを優先
    const id = externalConversationId !== undefined
      ? externalConversationId
      : searchParams.get('id')

    if (id && id !== conversationId) {
      loadExistingConversation(id)
    } else if (!id && conversationId) {
      resetChat()
    } else if (!id && !conversationId && messages.length === 0) {
      setMessages([createWelcomeMessage()])
    }
  }, [searchParams, externalConversationId])

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
      }
    } catch (err) {
      chatLogger.error('Error loading conversation:', err)
      resetChat()
    }
  }

  const createNewConversation = async () => {
    if (!user) return null
    try {
      const conversation = await createConversation(user.uid, '新しい会話')
      setConversationId(conversation.id)
      // disableRouting が false の場合のみ URL を更新
      if (!disableRouting) {
        router.replace(`/chat?id=${conversation.id}`, { scroll: false })
      }
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

  const handleSend = async (messageText?: string, agentSystemPrompt?: string, agentTools?: string[]) => {
    const text = messageText || input
    if (!text.trim() || isProcessing || isSendingRef.current) return
    isSendingRef.current = true

    // エージェントのツール設定（指定がなければナレッジ検索のみ）
    // ただし、ユーザーがナレッジ検索をOFFにしている場合はそれを優先
    const enabledTools = agentTools || ['knowledge_search']
    const shouldSearchKnowledge = enabledTools.includes('knowledge_search') && isKnowledgeSearchEnabled
    const shouldSearchDrive = enabledTools.includes('drive_search') && isKnowledgeSearchEnabled
    const shouldSearchWeb = enabledTools.includes('web_search')

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
    setProcessingStep(PROCESSING_STEPS.ANALYZING)
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
      let onedriveContext = ''

      // AIに最適な検索クエリを生成させる
      let searchQueries: string[] = [text]
      const hasDriveConnection = companyDriveConnection?.isConnected || companyOnedriveConnection?.isConnected
      const needsSearch = (shouldSearchKnowledge && hasIndexedKnowledge) ||
                          (shouldSearchDrive && hasDriveConnection) ||
                          shouldSearchWeb
      if (needsSearch) {
        const queryResult = await generateSearchQuery(
          BUILT_IN_GEMINI_API_KEY,
          text,
          history.slice(0, -1)
        )
        if (!queryResult.error) {
          searchQueries = queryResult.queries || [text]
        }
      }

      // ドライブ検索（エージェントのツールにdrive_searchがある場合のみ）
      if (
        shouldSearchDrive &&
        companyDriveConnection?.isConnected &&
        companyDriveConnection.accessToken
      ) {
        setProcessingStep(PROCESSING_STEPS.SEARCHING_FILES)
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

      // OneDrive検索（エージェントのツールにdrive_searchがある場合のみ）
      if (
        shouldSearchDrive &&
        companyOnedriveConnection?.isConnected &&
        companyOnedriveConnection.accessToken
      ) {
        setProcessingStep(PROCESSING_STEPS.SEARCHING_FILES)
        try {
          const onedriveQueries = searchQueries.slice(0, 2)
          const onedriveSearchPromises = onedriveQueries.map((query) =>
            fetch('/api/onedrive/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: companyOnedriveConnection.accessToken,
                query: query,
              }),
            })
              .then((res) => (res.ok ? res.json() : { results: [] }))
              .catch(() => ({ results: [] }))
          )

          interface OnedriveResult {
            id: string
            name: string
            content: string
            webViewLink?: string
            mimeType?: string
          }

          const onedriveResultsArray = await Promise.all(onedriveSearchPromises)
          const allOnedriveResults: OnedriveResult[] = []
          const seenOnedriveIds = new Set<string>()

          onedriveResultsArray.forEach((onedriveResults) => {
            if (onedriveResults.results) {
              (onedriveResults.results as OnedriveResult[]).forEach((result) => {
                if (!seenOnedriveIds.has(result.id)) {
                  seenOnedriveIds.add(result.id)
                  allOnedriveResults.push(result)
                }
              })
            }
          })

          if (allOnedriveResults.length > 0) {
            onedriveContext = '\n\n【OneDriveから見つかった関連情報】\n'
            allOnedriveResults.slice(0, 5).forEach((result) => {
              onedriveContext += `\n--- ${result.name} ---\n${result.content}\n`
              citations.push({
                title: result.name,
                text: result.content.slice(0, 300),
                uri: result.webViewLink || '',
                source: 'onedrive',
              })
            })
          }
        } catch (onedriveError) {
          chatLogger.error('OneDrive search error:', onedriveError)
        }
      }

      // ナレッジ検索（Firestore Vector Search - API経由）
      let knowledgeContext = ''
      if (shouldSearchKnowledge && hasIndexedKnowledge && hasKnowledgeApiKey && profile?.companyId) {
        setProcessingStep(PROCESSING_STEPS.SEARCHING_KNOWLEDGE)
        try {
          const searchRes = await fetch('/api/knowledge/vector-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'search',
              query: text,
              queries: searchQueries,
              companyId: profile.companyId,
              apiKey: BUILT_IN_GEMINI_API_KEY,
              options: {
                limit: 5,
                threshold: 0.3,
                rerank: true,
              },
            }),
          })
          const searchResult = await searchRes.json()

          if (!searchResult.error && searchResult.results?.length > 0) {
            knowledgeContext = '\n\n【社内ナレッジから見つかった関連情報】\n'
            searchResult.results.forEach((result: VectorSearchResult) => {
              const displayTitle = result.chunk.metadata.documentTitle
              const documentId = result.chunk.metadata.documentId

              // documentInfoMapからファイル情報を取得
              let fileUrl: string | undefined
              let mimeType: string | undefined
              const docInfo = Object.values(documentInfoMap).find(
                (info) => info.originalFileName === displayTitle
              )
              if (docInfo) {
                fileUrl = docInfo.fileUrl
                mimeType = docInfo.mimeType
              }

              knowledgeContext += `\n--- ${displayTitle} (スコア: ${result.score.toFixed(2)}) ---\n${result.chunk.content}\n`
              citations.push({
                title: displayTitle,
                text: result.chunk.content,
                uri: fileUrl || documentId,
                source: 'knowledge',
                ...(mimeType ? { mimeType } : {}),
              })
            })
          }
        } catch (searchError) {
          chatLogger.error('Knowledge search error:', searchError)
        }
      }

      // Web検索（エージェントのツールにweb_searchがある場合のみ）
      // レート制限対策で1クエリのみ実行
      let webContext = ''
      if (shouldSearchWeb) {
        setProcessingStep('Webを検索中...')
        try {
          const webQueries = searchQueries.slice(0, 1) // レート制限対策: 2→1に削減
          const webSearchPromises = webQueries.map((query) =>
            fetch('/api/web/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, maxResults: 3 }),
            })
              .then((res) => (res.ok ? res.json() : { results: [] }))
              .catch(() => ({ results: [] }))
          )

          interface WebResult {
            title: string
            url: string
            snippet: string
          }

          const webResultsArray = await Promise.all(webSearchPromises)
          const allWebResults: WebResult[] = []
          const seenUrls = new Set<string>()
          let webSummary = ''

          webResultsArray.forEach((webResults) => {
            if (webResults.summary && !webSummary) {
              webSummary = webResults.summary
            }
            if (webResults.results) {
              (webResults.results as WebResult[]).forEach((result) => {
                if (!seenUrls.has(result.url)) {
                  seenUrls.add(result.url)
                  allWebResults.push(result)
                }
              })
            }
          })

          if (allWebResults.length > 0 || webSummary) {
            webContext = '\n\n【Web検索結果】\n'
            if (webSummary) {
              webContext += `${webSummary}\n\n`
            }
            allWebResults.slice(0, 5).forEach((result) => {
              if (result.snippet) {
                webContext += `\n--- ${result.title} ---\n${result.snippet}\n`
              }
              citations.push({
                title: result.title,
                text: result.snippet || '',
                uri: result.url,
                source: 'web',
              })
            })
          }
        } catch (webError) {
          chatLogger.error('Web search error:', webError)
        }
      }

      // AIレスポンス生成
      setProcessingStep(PROCESSING_STEPS.GENERATING)
      const apiKey = getApiKeyForProvider(modelInfo.provider)
      const combinedContext = driveContext + onedriveContext + knowledgeContext + webContext

      // エージェントのsystemPromptがあればそれを使用、なければデフォルト
      let systemPrompt: string
      if (agentSystemPrompt) {
        // エージェントのシステムプロンプト + 検索結果のコンテキスト
        systemPrompt = combinedContext
          ? `${agentSystemPrompt}\n\n【参考情報】\n以下の情報を参考にしてください：${combinedContext}`
          : agentSystemPrompt
      } else {
        // デフォルトのシステムプロンプト
        systemPrompt = combinedContext
          ? `日本語で回答してください。質問に対して丁寧に回答してください。以下の情報を参考にしてください：${combinedContext}`
          : '日本語で回答してください。質問に対して丁寧に回答してください。'
      }

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
          setProcessingStep('')
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
          setProcessingStep('')
          isSendingRef.current = false
        }
      }

      typeNextCharacter()
    } catch (err: unknown) {
      chatLogger.error('Error sending message:', err)

      // 429エラー（レート制限）の検出
      let message: string
      if (err instanceof RateLimitError) {
        message = 'APIのレート制限に達しました。30秒ほど待ってから再度お試しください。'
      } else if (err instanceof Error) {
        // エラーメッセージから429を検出
        if (
          err.message.includes('429') ||
          err.message.includes('RESOURCE_EXHAUSTED') ||
          err.message.includes('Quota exceeded') ||
          err.message.includes('rate limit')
        ) {
          message = 'APIのレート制限に達しました。30秒ほど待ってから再度お試しください。'
        } else {
          message = err.message
        }
      } else {
        message = 'メッセージの送信に失敗しました'
      }

      setError(message)
      setIsProcessing(false)
      setProcessingStep('')
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

      // ナレッジ検索してコンテキストを構築（API経由）
      let knowledgeContext = ''
      if (isKnowledgeSearchEnabled && hasIndexedKnowledge && hasKnowledgeApiKey && profile?.companyId) {
        try {
          const searchRes = await fetch('/api/knowledge/vector-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'search',
              query: userMessageContent,
              queries: [userMessageContent],
              companyId: profile.companyId,
              apiKey: BUILT_IN_GEMINI_API_KEY,
              options: {
                limit: 5,
                threshold: 0.3,
              },
            }),
          })
          const searchResult = await searchRes.json()

          if (!searchResult.error && searchResult.results?.length > 0) {
            knowledgeContext = '\n\n【参考情報】\n'
            searchResult.results.forEach((result: VectorSearchResult) => {
              knowledgeContext += `\n--- ${result.chunk.metadata.documentTitle} ---\n${result.chunk.content}\n`
              citations.push({
                title: result.chunk.metadata.documentTitle,
                text: result.chunk.content,
                uri: result.chunk.metadata.documentId,
                source: 'knowledge',
              })
            })
          }
        } catch (err) {
          chatLogger.error('Knowledge search error in regenerate:', err)
        }
      }

      // AI回答生成
      const apiKey = getApiKeyForProvider(modelInfo.provider)
      const systemPrompt = knowledgeContext
        ? `以下の参考情報を踏まえて、日本語で丁寧に回答してください。${knowledgeContext}`
        : '日本語で回答してください。質問に対して丁寧に回答してください。'

      const result = await aiChat(
        modelInfo.provider,
        apiKey,
        history,
        selectedModel,
        systemPrompt
      )
      if (result.error) throw new Error(result.error)
      aiResponse = result.content

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

  // 会話をナレッジとして保存
  const saveConversationAsKnowledge = async () => {
    if (!user || !profile?.companyId || messages.length < 2) {
      setError('保存する会話がありません')
      return false
    }

    setIsSavingToKnowledge(true)
    setKnowledgeSaveSuccess(false)
    setError(null)

    try {
      const apiKey = BUILT_IN_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません')
      }

      // 1. 会話を要約してドキュメント化
      chatLogger.debug('Summarizing conversation...')
      const summaryResult = await summarizeConversation(
        apiKey,
        messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      )
      if (summaryResult.error) {
        throw new Error(summaryResult.error)
      }

      const { content, title } = summaryResult
      const fileName = `会話ナレッジ_${title.slice(0, 30).replace(/[/\\?%*:|"<>]/g, '_')}_${Date.now()}.md`

      // 2. File Search Store を取得または作成
      let storeName = fileSearchStores[0]
      if (!storeName) {
        chatLogger.debug('Creating new File Search Store...')
        const storeResult = await createFileSearchStore(
          apiKey,
          `${profile.companyName || 'Company'} Knowledge`
        )
        if (storeResult.error) {
          throw new Error(storeResult.error)
        }
        storeName = storeResult.storeName

        await saveFileSearchStore(
          user.uid,
          profile.companyId,
          storeName,
          `${profile.companyName || 'Company'} Knowledge`
        )
        setFileSearchStores(prev => [...prev, storeName])
      }

      // 3. Markdownをテキストファイルとしてアップロード
      chatLogger.debug('Uploading to Gemini Files API...')
      const textEncoder = new TextEncoder()
      const fileBuffer = textEncoder.encode(content)

      const uploadResult = await uploadFile(
        apiKey,
        fileBuffer,
        fileName,
        'text/markdown'
      )
      if (uploadResult.error) {
        throw new Error(uploadResult.error)
      }

      // 4. File Search Store にインポート
      chatLogger.debug('Importing to File Search Store...')
      const importResult = await importFileToStore(apiKey, storeName, uploadResult.fileName)
      if (importResult.error) {
        throw new Error(importResult.error)
      }

      // 5. Firestore に保存（Firebase Storageはスキップ - CORSの問題を回避）
      chatLogger.debug('Saving to Firestore...')
      await saveUploadedDocument(
        user.uid,
        profile.companyId,
        fileName,
        title,
        uploadResult.fileName,
        storeName,
        null,
        undefined, // fileUrl - 会話ナレッジはGemini Files APIから検索するのでStorage不要
        'text/markdown'
      )

      chatLogger.info('Conversation saved as knowledge:', title)
      setKnowledgeSaveSuccess(true)

      // 3秒後に成功メッセージを消す
      setTimeout(() => {
        setKnowledgeSaveSuccess(false)
      }, 3000)

      return true
    } catch (err: unknown) {
      chatLogger.error('Error saving conversation as knowledge:', err)
      const message = err instanceof Error ? err.message : 'ナレッジの保存に失敗しました'
      setError(message)
      return false
    } finally {
      setIsSavingToKnowledge(false)
    }
  }

  return {
    // State
    conversationId,
    messages,
    input,
    setInput,
    isProcessing,
    processingStep,
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
    companyOnedriveConnection,
    companyId: profile?.companyId,
    userId: user?.uid,
    isSavingToKnowledge,
    knowledgeSaveSuccess,

    // Actions
    handleSend,
    handleStopTyping,
    switchAlternative,
    regenerateResponse,
    resetChat,
    saveConversationAsKnowledge,

    // Utilities
    getSelectedModelInfo,
    hasApiKeyForModel,
  }
}
