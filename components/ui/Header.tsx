'use client'

import { Bars3Icon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useAuth } from '@/contexts/AuthContext'
import { useChatPanel } from '@/contexts/ChatPanelContext'

export default function Header() {
  const { openMobileSidebar } = useSidebarStore()
  const { profile } = useAuth()
  const { togglePanel, isOpen } = useChatPanel()

  const companyName = profile?.companyName || '社内ナレッジ検索くん'

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between md:hidden">
      {/* ハンバーガーメニュー */}
      <button
        onClick={openMobileSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="メニューを開く"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      {/* タイトル */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <SparklesIcon className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[180px]">{companyName}</h1>
      </div>

      {/* チャットボタン */}
      <button
        onClick={togglePanel}
        className={`p-2 rounded-lg transition-colors ${
          isOpen ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-700'
        }`}
        aria-label="チャットを開く"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>
    </header>
  )
}
