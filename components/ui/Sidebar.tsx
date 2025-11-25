'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { apiGet } from '@/lib/api-client'
import {
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'AIチャット', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'ナレッジベース', href: '/knowledge', icon: BookOpenIcon },
  { name: '設定', href: '/settings', icon: Cog6ToothIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (user) {
      fetchUserName()
    }
  }, [user])

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
    <motion.div
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-white border-r border-gray-200 flex flex-col relative"
    >
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
              <h1 className="text-2xl font-bold text-gray-900">法人AI</h1>
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

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

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

              {/* Logout Menu */}
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

              {/* Logout Menu - Collapsed */}
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
    </motion.div>
  )
}
