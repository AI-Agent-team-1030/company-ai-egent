/**
 * チャットパネル状態管理コンテキスト
 *
 * サイドパネルチャットの開閉状態を管理
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ChatPanelContextType {
  isOpen: boolean
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
}

const ChatPanelContext = createContext<ChatPanelContextType | undefined>(undefined)

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false) // デフォルトで閉じている

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const openPanel = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <ChatPanelContext.Provider value={{ isOpen, togglePanel, openPanel, closePanel }}>
      {children}
    </ChatPanelContext.Provider>
  )
}

export function useChatPanel() {
  const context = useContext(ChatPanelContext)
  if (context === undefined) {
    throw new Error('useChatPanel must be used within a ChatPanelProvider')
  }
  return context
}
