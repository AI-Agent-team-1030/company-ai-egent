/**
 * サイドバーコンポーネント
 *
 * 会話履歴、ナビゲーション、ユーザープロフィールを表示
 * フックを使用してロジックを分離
 */

'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { SIDEBAR } from '@/lib/constants'
import {
  useSidebarState,
  DeleteDialog,
  ToastNotification,
} from './sidebar/index'

export default function Sidebar() {
  const {
    isCollapsed,
    setIsCollapsed,
    showLogoutMenu,
    setShowLogoutMenu,
    conversations,
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
    handleDeleteConversation,
    handleBulkDelete,
    toggleSelection,
    toggleSelectAll,
    getUserInitial,
    navigateToChat,
    navigateToSettings,
    signOut,
  } = useSidebarState()

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <div
        className={`
          md:hidden fixed inset-y-0 left-0 z-50 w-[${SIDEBAR.MOBILE_WIDTH}px] bg-white border-r border-gray-200
          flex flex-col transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: SIDEBAR.MOBILE_WIDTH }}
      >
        <button
          onClick={closeMobileSidebar}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 z-50"
        >
          <XMarkIcon className="w-6 h-6 text-gray-600" />
        </button>

        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
          <p className="text-xs text-gray-600 mt-1">Enterprise System</p>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 pb-2">
            <button
              onClick={() => navigateToChat()}
              className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              新しいチャット
            </button>
          </div>

          <nav className="flex-1 p-4 pt-2 overflow-y-auto space-y-1">
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const isActive = pathname.includes(conv.id)
                return (
                  <button
                    key={conv.id}
                    onClick={() => navigateToChat(conv.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.updated_at).toLocaleDateString('ja-JP')}
                    </p>
                  </button>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">履歴がありません</p>
              </div>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
              {getUserInitial()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{userName || 'ユーザー'}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email || 'ゲスト'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={navigateToSettings}
              className="flex-1 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              設定
            </button>
            <button
              onClick={() => {
                closeMobileSidebar()
                signOut()
              }}
              className="flex-1 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        style={{ width: isCollapsed ? SIDEBAR.COLLAPSED_WIDTH : sidebarWidth }}
        className="hidden md:flex h-full bg-white border-r border-gray-200 flex-col relative transition-all duration-300"
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
                onClick={() => navigateToChat()}
                className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                新しいチャット
              </button>

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
                              navigateToChat(conv.id)
                            }
                          }}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(conv.updated_at).toLocaleDateString('ja-JP')}
                          </p>
                        </button>

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
                          navigateToSettings()
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-200"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        設定
                      </button>
                      <button
                        onClick={() => {
                          setShowLogoutMenu(false)
                          closeMobileSidebar()
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
                          navigateToSettings()
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-200"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        設定
                      </button>
                      <button
                        onClick={() => {
                          setShowLogoutMenu(false)
                          closeMobileSidebar()
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
      </div>

      {/* Delete Dialogs */}
      <DeleteDialog
        isOpen={!!deleteConfirmId}
        title="会話を削除しますか？"
        message="この操作は取り消せません。本当に削除してもよろしいですか？"
        confirmLabel="削除"
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDeleteConversation(deleteConfirmId)}
      />

      <DeleteDialog
        isOpen={showBulkDeleteConfirm}
        title={`${selectedIds.size}件の会話を削除しますか？`}
        message={`この操作は取り消せません。選択した${selectedIds.size}件の会話を本当に削除してもよろしいですか？`}
        confirmLabel={`${selectedIds.size}件削除`}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
      />

      {/* Toast */}
      <ToastNotification isVisible={showToast} message={toastMessage} />
    </>
  )
}
