/**
 * チャットパネル状態管理コンテキスト
 *
 * サイドパネルチャットの開閉状態を管理
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ChatPanelContextType {
  isOpen: boolean
  conversationId: string | null
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
  openConversation: (id: string) => void
  startNewConversation: () => void
}

const ChatPanelContext = createContext<ChatPanelContextType | undefined>(undefined)

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const openPanel = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => {
    setIsOpen(false)
  }, [])

  const openConversation = useCallback((id: string) => {
    setConversationId(id)
    setIsOpen(true)
  }, [])

  const startNewConversation = useCallback(() => {
    setConversationId(null)
    setIsOpen(true)
  }, [])

  return (
    <ChatPanelContext.Provider value={{
      isOpen,
      conversationId,
      togglePanel,
      openPanel,
      closePanel,
      openConversation,
      startNewConversation,
    }}>
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
