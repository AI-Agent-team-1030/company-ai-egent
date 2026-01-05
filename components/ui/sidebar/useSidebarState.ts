/**
 * サイドバー状態管理フック
 *
 * 会話履歴の取得、削除、選択モード管理を担当
 */

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChatPanel } from '@/contexts/ChatPanelContext'
import { getConversations, deleteConversation as firestoreDeleteConversation } from '@/lib/firestore-chat'
import { getAgentExecutions, deleteAgentExecution as firestoreDeleteAgentExecution, type AgentExecution } from '@/lib/firestore-agent'
import { useSidebarStore } from '@/stores/sidebarStore'
import { sidebarLogger } from '@/lib/logger'
import { SIDEBAR, TOAST } from '@/lib/constants'

export interface Conversation {
  id: string
  title: string
  updated_at: string
}

export interface AgentHistory {
  id: string
  taskSummary: string
  status: 'completed' | 'failed' | 'cancelled'
  agentCount: number
  createdAt: string
}

export type HistoryTab = 'chat' | 'agent'

export function useSidebarState() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const { isMobileOpen, closeMobileSidebar } = useSidebarStore()
  const { openConversation, startNewConversation } = useChatPanel()

  // State
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [agentHistories, setAgentHistories] = useState<AgentHistory[]>([])
  const [activeTab, setActiveTab] = useState<HistoryTab>('agent')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(SIDEBAR.DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  const userName = profile?.userName || ''
  const companyName = profile?.companyName || '社内ナレッジ検索くん'

  // Fetch conversations
  interface ConversationResult {
    id: string
    title?: string
    updatedAt?: Date | string | { toISOString: () => string }
  }

  const fetchConversations = useCallback(async () => {
    if (!user) return
    try {
      sidebarLogger.debug('Fetching conversations for user:', user.uid)
      const result = (await getConversations(user.uid)) as ConversationResult[]
      const mapped = result.map((conv) => ({
        id: conv.id,
        title: conv.title || '新しい会話',
        updated_at: typeof conv.updatedAt === 'object' && conv.updatedAt && 'toISOString' in conv.updatedAt
          ? conv.updatedAt.toISOString()
          : String(conv.updatedAt || new Date().toISOString()),
      }))
      setConversations(mapped)
    } catch (error) {
      sidebarLogger.error('Failed to fetch conversations:', error)
    }
  }, [user])

  // Fetch agent histories
  const fetchAgentHistories = useCallback(async () => {
    if (!user) return
    try {
      sidebarLogger.debug('Fetching agent histories for user:', user.uid)
      const result = await getAgentExecutions(user.uid, 20) // サイドバー用に20件に制限
      const mapped: AgentHistory[] = result.map((exec) => ({
        id: exec.id,
        taskSummary: exec.taskSummary,
        status: exec.status,
        agentCount: exec.orchestrationPlan?.agents?.length || 0,
        createdAt: exec.createdAt instanceof Date
          ? exec.createdAt.toISOString()
          : new Date().toISOString(),
      }))
      setAgentHistories(mapped)
    } catch (error) {
      sidebarLogger.error('Failed to fetch agent histories:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      // 並列で取得して高速化
      Promise.all([fetchConversations(), fetchAgentHistories()])
    }
  }, [user, fetchConversations, fetchAgentHistories])

  useEffect(() => {
    if (user && pathname.includes('/chat')) fetchConversations()
    if (user && pathname.includes('/agent-dashboard')) fetchAgentHistories()
  }, [pathname, user, fetchConversations, fetchAgentHistories])

  // Toast auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), TOAST.DURATION_MS)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // Resize handler
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX
      if (newWidth >= SIDEBAR.MIN_WIDTH && newWidth <= SIDEBAR.MAX_WIDTH) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const showMessage = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }, [])

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))
        setDeleteConfirmId(null)
        await firestoreDeleteConversation(conversationId)
        showMessage('会話を削除しました')
      } catch (error) {
        await fetchConversations()
        showMessage('削除に失敗しました')
      }
    },
    [fetchConversations, showMessage]
  )

  const handleBulkDelete = useCallback(async () => {
    try {
      const idsToDelete = Array.from(selectedIds)
      setConversations((prev) => prev.filter((conv) => !selectedIds.has(conv.id)))
      setShowBulkDeleteConfirm(false)
      setSelectionMode(false)
      setSelectedIds(new Set())

      const deletePromises = idsToDelete.map((id) =>
        firestoreDeleteConversation(id)
          .then(() => ({ ok: true }))
          .catch(() => ({ ok: false }))
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter((res) => !res.ok).length

      if (failedCount === 0) {
        showMessage(`${idsToDelete.length}件の会話を削除しました`)
      } else if (failedCount === idsToDelete.length) {
        await fetchConversations()
        showMessage('削除に失敗しました')
      } else {
        await fetchConversations()
        showMessage(`${idsToDelete.length - failedCount}/${idsToDelete.length}件削除しました`)
      }
    } catch (error) {
      await fetchConversations()
      showMessage('削除に失敗しました')
    }
  }, [selectedIds, fetchConversations, showMessage])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(conversations.map((c) => c.id)))
    }
  }, [selectedIds.size, conversations])

  const getUserInitial = useCallback(() => {
    if (userName && userName !== 'ユーザー') {
      return userName.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }, [userName, user?.email])

  const navigateToChat = useCallback(
    (conversationId?: string) => {
      // ページ遷移ではなく、右サイドパネルを開く
      if (conversationId) {
        openConversation(conversationId)
      } else {
        startNewConversation()
      }
      closeMobileSidebar()
    },
    [openConversation, startNewConversation, closeMobileSidebar]
  )

  const navigateToSettings = useCallback(() => {
    router.push('/settings')
    closeMobileSidebar()
  }, [router, closeMobileSidebar])

  const navigateToAgentDashboard = useCallback(
    (executionId?: string) => {
      if (executionId) {
        router.push(`/agent-dashboard?id=${executionId}`)
      } else {
        router.push('/agent-dashboard')
      }
      closeMobileSidebar()
    },
    [router, closeMobileSidebar]
  )

  const handleDeleteAgentExecution = useCallback(
    async (executionId: string) => {
      try {
        setAgentHistories((prev) => prev.filter((exec) => exec.id !== executionId))
        setDeleteConfirmId(null)
        await firestoreDeleteAgentExecution(executionId)

        if (pathname.includes(executionId)) {
          router.push('/agent-dashboard')
        }
        showMessage('実行履歴を削除しました')
      } catch (error) {
        await fetchAgentHistories()
        showMessage('削除に失敗しました')
      }
    },
    [pathname, router, fetchAgentHistories, showMessage]
  )

  return {
    // State
    isCollapsed,
    setIsCollapsed,
    showLogoutMenu,
    setShowLogoutMenu,
    conversations,
    agentHistories,
    activeTab,
    setActiveTab,
    deleteConfirmId,
    setDeleteConfirmId,
    showToast,
    toastMessage,
    selectionMode,
    setSelectionMode,
    selectedIds,
    setSelectedIds,
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,
    sidebarWidth,
    setIsResizing,
    isMobileOpen,
    closeMobileSidebar,
    userName,
    companyName,
    user,
    pathname,

    // Actions
    handleDeleteConversation,
    handleDeleteAgentExecution,
    handleBulkDelete,
    toggleSelection,
    toggleSelectAll,
    getUserInitial,
    navigateToChat,
    navigateToAgentDashboard,
    navigateToSettings,
    signOut,
  }
}
