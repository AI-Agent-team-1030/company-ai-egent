'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'
import { useSidebarStore } from '@/stores/sidebarStore'

export default function Header() {
  const { openMobileSidebar } = useSidebarStore()

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between md:hidden">
      {/* Hamburger Menu Button - Mobile only */}
      <button
        onClick={openMobileSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="メニューを開く"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      {/* Title */}
      <h1 className="text-lg font-bold text-gray-900">法人AI</h1>

      {/* Spacer for centering */}
      <div className="w-10" />
    </header>
  )
}
