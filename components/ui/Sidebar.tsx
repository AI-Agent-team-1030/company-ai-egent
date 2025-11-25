'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { apiGet, apiDelete } from '@/lib/api-client'
import {
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'AIチャット', href: '/chat', icon: ChatBubbleLeftRightIcon },
]

interface Conversation {
  id: string
  title: string
  updated_at: string
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [companyName, setCompanyName] = useState<string>('法人AI')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isResizing, setIsResizing] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUserName()
      fetchCompanyName()
      fetchConversations()
    }
  }, [user])

  // 会話が切り替わったら履歴を更新
  useEffect(() => {
    if (user && pathname.includes('/chat')) {
      fetchConversations()
    }
  }, [pathname, user])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  // リサイズハンドラー
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const fetchUserName = async () => {
    try {
      const response = await apiGet('/api/settings?key=user_name')
      if (response.ok) {
        const data = await response.json()
        setUserName(data.value || 'ユーザー')
      }
    } catch (error) {
      console.error('Failed to fetch user name:', error)
    }
  }

  const fetchCompanyName = async () => {
    try {
      // Supabaseから会社名を取得
      const response = await apiGet('/api/company')
      if (response.ok) {
        const data = await response.json()
        setCompanyName(data.name || '法人AI')
      }
    } catch (error) {
      console.error('Failed to fetch company name:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await apiGet('/api/chat/conversations?limit=20')
      if (response.ok) {
        const result = await response.json()
        setConversations(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      // 即座にUIから削除（楽観的更新）
      setConversations((prev) => prev.filter((conv) => conv.id !== conversationId))

      // 確認ダイアログを閉じる
      setDeleteConfirmId(null)

      const response = await apiDelete(`/api/chat/conversations/${conversationId}`)
      if (response.ok) {
        // 削除した会話が現在表示中の場合、新しいチャットに移動
        if (pathname.includes(conversationId)) {
          router.push('/chat')
        }

        // 成功メッセージを表示
        setToastMessage('会話を削除しました')
        setShowToast(true)
      } else {
        // 削除に失敗した場合は元に戻す
        await fetchConversations()
        setToastMessage('削除に失敗しました')
        setShowToast(true)
      }
    } catch (error) {
      // エラー時は元に戻す
      await fetchConversations()
      setToastMessage('削除に失敗しました')
      setShowToast(true)
    }
  }

  const handleBulkDelete = async () => {
    try {
      const idsToDelete = Array.from(selectedIds)

      // 即座にUIから削除（楽観的更新）
      setConversations((prev) => prev.filter((conv) => !selectedIds.has(conv.id)))

      // 確認ダイアログを閉じる
      setShowBulkDeleteConfirm(false)
      setSelectionMode(false)
      setSelectedIds(new Set())

      // 並列で削除リクエストを実行
      const deletePromises = idsToDelete.map((id) =>
        apiDelete(`/api/chat/conversations/${id}`)
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter((res) => !res.ok).length

      // 現在表示中の会話が削除された場合、新しいチャットに移動
      if (idsToDelete.some((id) => pathname.includes(id))) {
        router.push('/chat')
      }

      // 結果メッセージを表示
      if (failedCount === 0) {
        setToastMessage(`${idsToDelete.length}件の会話を削除しました`)
        setShowToast(true)
      } else if (failedCount === idsToDelete.length) {
        await fetchConversations()
        setToastMessage('削除に失敗しました')
        setShowToast(true)
      } else {
        await fetchConversations()
        setToastMessage(`${idsToDelete.length - failedCount}/${idsToDelete.length}件削除しました`)
        setShowToast(true)
      }
    } catch (error) {
      await fetchConversations()
      setToastMessage('削除に失敗しました')
      setShowToast(true)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(conversations.map((c) => c.id)))
    }
  }

  const getUserInitial = () => {
    if (userName && userName !== 'ユーザー') {
      return userName.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <div
      style={{ width: isCollapsed ? 80 : sidebarWidth }}
      className="h-full bg-white border-r border-gray-200 flex flex-col relative transition-all duration-300"
    >
      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors group"
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-20 bg-gray-300 group-hover:bg-blue-500 transition-colors" />
        </div>
      )}
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-50 shadow-sm"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        )}
      </motion.button>

      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
              <p className="text-xs text-gray-600 mt-1">Enterprise System</p>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">
                AI
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat History */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isCollapsed && (
          <div className="p-4 pb-2 space-y-2">
            <button
              onClick={() => router.push('/chat')}
              className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              新しいチャット
            </button>

            {/* Selection Mode Controls */}
            {conversations.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectionMode(!selectionMode)
                    setSelectedIds(new Set())
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectionMode
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectionMode ? (
                    <>
                      <XMarkIcon className="w-4 h-4 inline mr-1" />
                      キャンセル
                    </>
                  ) : (
                    <>
                      <Squares2X2Icon className="w-4 h-4 inline mr-1" />
                      選択
                    </>
                  )}
                </button>

                {selectionMode && (
                  <>
                    <button
                      onClick={toggleSelectAll}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      {selectedIds.size === conversations.length ? '全解除' : '全選択'}
                    </button>

                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                        削除 ({selectedIds.size})
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 p-4 pt-2 overflow-y-auto space-y-1">
          {!isCollapsed ? (
            conversations.length > 0 ? (
              conversations.map((conv) => {
                const isActive = pathname.includes(conv.id)
                const isSelected = selectedIds.has(conv.id)
                return (
                  <div
                    key={conv.id}
                    className={`group relative w-full text-left rounded-lg transition-colors ${
                      isActive && !selectionMode
                        ? 'bg-gray-200 text-gray-900'
                        : isSelected
                        ? 'bg-blue-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-3 py-2">
                      {/* Checkbox in selection mode */}
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(conv.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                        />
                      )}

                      <button
                        onClick={() => {
                          if (selectionMode) {
                            toggleSelection(conv.id)
                          } else {
                            router.push(`/chat?id=${conv.id}`)
                          }
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conv.updated_at).toLocaleDateString('ja-JP')}
                        </p>
                      </button>

                      {/* Single delete button (only in normal mode) */}
                      {!selectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(conv.id)
                          }}
                          className="p-1.5 opacity-30 group-hover:opacity-100 hover:bg-red-50 rounded transition-all flex-shrink-0"
                          title="削除"
                        >
                          <TrashIcon className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 font-medium">履歴がありません</p>
                <p className="text-xs text-gray-400 mt-1">新しいチャットを開始してください</p>
              </div>
            )
          ) : (
            <Link href="/chat">
              <div
                className="flex items-center justify-center px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                title="AIチャット"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-700" />
              </div>
            </Link>
          )}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-200 relative">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {getUserInitial()}
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <p className="text-sm font-bold text-gray-900 truncate">{userName || 'ユーザー'}</p>
                  <p className="text-xs text-gray-600 truncate">{user?.email || 'ゲスト'}</p>
                </div>
              </button>

              {/* User Menu */}
              <AnimatePresence>
                {showLogoutMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false)
                        router.push('/settings')
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-200"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      設定
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false)
                        signOut()
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      ログアウト
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                className="w-full flex justify-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                title={`${userName || 'ユーザー'} (${user?.email})`}
              >
                <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                  {getUserInitial()}
                </div>
              </button>

              {/* User Menu - Collapsed */}
              <AnimatePresence>
                {showLogoutMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden whitespace-nowrap"
                  >
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-bold text-gray-900">{userName || 'ユーザー'}</p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false)
                        router.push('/settings')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-200"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      設定
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false)
                        signOut()
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      ログアウト
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                会話を削除しますか？
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                この操作は取り消せません。本当に削除してもよろしいですか？
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => handleDeleteConversation(deleteConfirmId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  削除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Dialog */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowBulkDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {selectedIds.size}件の会話を削除しますか？
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                この操作は取り消せません。選択した{selectedIds.size}件の会話を本当に削除してもよろしいですか？
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {selectedIds.size}件削除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                toastMessage.includes('失敗')
                  ? 'bg-red-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              {toastMessage.includes('失敗') ? (
                <XCircleIcon className="w-5 h-5" />
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              <span className="font-medium">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
