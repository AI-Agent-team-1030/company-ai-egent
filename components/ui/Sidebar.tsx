/**
 * サイドバーコンポーネント
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  Cog6ToothIcon,
  XMarkIcon,
  SparklesIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon,
  ChevronDownIcon,
  WrenchScrewdriverIcon,
  RectangleStackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useSidebarStore } from '@/stores/sidebarStore'
import {
  useSidebarState,
  DeleteDialog,
  ToastNotification,
} from './sidebar/index'

export default function Sidebar() {
  const router = useRouter()
  const { isCollapsed, toggleCollapsed } = useSidebarStore()
  const {
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
    isMobileOpen,
    closeMobileSidebar,
    userName,
    companyName,
    user,
    pathname,
    handleDeleteConversation,
    handleDeleteAgentExecution,
    getUserInitial,
    navigateToChat,
    navigateToAgentDashboard,
    navigateToSettings,
    signOut,
  } = useSidebarState()

  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigateToKnowledge = () => {
    router.push('/knowledge')
    closeMobileSidebar()
  }

  const navigateToAgentBuilder = () => {
    router.push('/agent-builder')
    closeMobileSidebar()
  }

  const navigateToAgents = () => {
    router.push('/agents')
    closeMobileSidebar()
  }

  // 履歴アイテム
  const HistoryItem = ({
    item,
    type,
    isActive,
    onNavigate,
    onDelete,
  }: {
    item: { id: string; title?: string; taskSummary?: string; status?: string; agentCount?: number }
    type: 'agent' | 'chat'
    isActive: boolean
    onNavigate: () => void
    onDelete: () => void
  }) => (
    <div
      onClick={onNavigate}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {type === 'agent' && (
        <div className="flex-shrink-0">
          {item.status === 'completed' ? (
            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircleIcon className="w-4 h-4 text-red-500" />
          )}
        </div>
      )}
      {type === 'chat' && (
        <ChatBubbleLeftRightIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
      )}
      <span className="flex-1 text-sm truncate">
        {type === 'agent' ? item.taskSummary : item.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
      >
        <TrashIcon className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
      </button>
    </div>
  )

  // 履歴リスト
  const HistoryList = ({ onItemClick }: { onItemClick?: () => void }) => {
    const items = activeTab === 'agent' ? agentHistories : conversations
    const isEmpty = items.length === 0

    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            {activeTab === 'agent' ? (
              <SparklesIcon className="w-6 h-6 text-gray-400" />
            ) : (
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-500">履歴がありません</p>
        </div>
      )
    }

    return (
      <div className="space-y-0.5">
        {activeTab === 'agent' ? (
          agentHistories.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              type="agent"
              isActive={pathname.includes(item.id)}
              onNavigate={() => {
                navigateToAgentDashboard(item.id)
                onItemClick?.()
              }}
              onDelete={() => setDeleteConfirmId(item.id)}
            />
          ))
        ) : (
          conversations.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              type="chat"
              isActive={pathname.includes(item.id)}
              onNavigate={() => {
                navigateToChat(item.id)
                onItemClick?.()
              }}
              onDelete={() => setDeleteConfirmId(item.id)}
            />
          ))
        )}
      </div>
    )
  }

  // サイドバー共通コンテンツ
  const SidebarContent = ({ onClose, collapsed = false }: { onClose?: () => void; collapsed?: boolean }) => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* ヘッダー */}
      <div className={`flex items-center justify-between ${collapsed ? 'px-2' : 'px-4'} py-4 border-b border-gray-100`}>
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-gray-900">{companyName || '社内ナレッジ検索くん'}</span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        )}
        {!onClose && !collapsed && (
          <button
            onClick={toggleCollapsed}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
            title="サイドバーを閉じる"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* ナビゲーション */}
      <div className={`${collapsed ? 'px-2' : 'px-3'} py-3 space-y-1 border-b border-gray-100`}>
        <button
          onClick={() => {
            navigateToAgentDashboard()
            onClose?.()
          }}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-colors ${
            pathname.includes('/agent-dashboard')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={collapsed ? 'AIに依頼' : undefined}
        >
          <SparklesIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">AIに依頼</span>}
        </button>
        <button
          onClick={() => {
            navigateToKnowledge()
            onClose?.()
          }}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-colors ${
            pathname.includes('/knowledge')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={collapsed ? 'ナレッジ' : undefined}
        >
          <BookOpenIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">ナレッジ</span>}
        </button>
        <button
          onClick={() => {
            navigateToAgents()
            onClose?.()
          }}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-colors ${
            pathname === '/agents'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={collapsed ? 'エージェント管理' : undefined}
        >
          <RectangleStackIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">エージェント管理</span>}
        </button>
        <button
          onClick={() => {
            navigateToAgentBuilder()
            onClose?.()
          }}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-colors ${
            pathname.includes('/agent-builder')
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={collapsed ? 'エージェント作成' : undefined}
        >
          <PlusIcon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">エージェント作成</span>}
        </button>
      </div>

      {/* 履歴タブ */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('agent')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'agent'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              依頼履歴
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'chat'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
              チャット
            </button>
          </div>
        </div>
      )}

      {/* 履歴リスト */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <HistoryList onItemClick={onClose} />
        </div>
      )}

      {/* 折りたたみ時のスペーサー */}
      {collapsed && <div className="flex-1" />}

      {/* フッター - ユーザーメニュー */}
      <div className={`${collapsed ? 'p-2' : 'p-3'} border-t border-gray-100 relative`}>
        {collapsed ? (
          // 折りたたみ時：アバターのみ表示
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            title={userName || 'ユーザー'}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {getUserInitial()}
            </div>
          </button>
        ) : (
          // 展開時：フル表示
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {getUserInitial()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{userName || 'ユーザー'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* ユーザーメニュー */}
        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute bottom-full ${collapsed ? 'left-2 right-2' : 'left-3 right-3'} mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50`}
            >
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  navigateToSettings()
                  onClose?.()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                {!collapsed && '設定'}
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  signOut()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                {!collapsed && 'ログアウト'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  return (
    <>
      {/* モバイルオーバーレイ */}
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

      {/* モバイルサイドバー */}
      <motion.div
        initial={false}
        animate={{ x: isMobileOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 left-0 z-50 w-80 md:hidden"
      >
        <SidebarContent onClose={closeMobileSidebar} />
      </motion.div>

      {/* デスクトップサイドバー */}
      <motion.div
        initial={false}
        animate={{ width: isCollapsed ? 64 : 288 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="hidden md:block h-full flex-shrink-0 relative"
      >
        <SidebarContent collapsed={isCollapsed} />

        {/* 折りたたみ時の開くボタン */}
        {isCollapsed && (
          <button
            onClick={toggleCollapsed}
            className="absolute top-4 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            title="サイドバーを開く"
          >
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </motion.div>

      {/* 削除ダイアログ */}
      <DeleteDialog
        isOpen={!!deleteConfirmId}
        title="履歴を削除しますか？"
        message="この操作は取り消せません。"
        confirmLabel="削除"
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            if (activeTab === 'agent') {
              handleDeleteAgentExecution(deleteConfirmId)
            } else {
              handleDeleteConversation(deleteConfirmId)
            }
          }
        }}
      />

      <ToastNotification isVisible={showToast} message={toastMessage} />
    </>
  )
}
