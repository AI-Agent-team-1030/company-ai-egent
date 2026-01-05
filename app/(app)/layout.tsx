import dynamic from 'next/dynamic'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ChatPanelProvider } from '@/contexts/ChatPanelContext'
import { BackgroundTaskNotification } from '@/components/BackgroundTaskNotification'

// ChatSidePanelを遅延読み込み（初期表示を高速化）
const ChatSidePanel = dynamic(
  () => import('@/components/ChatSidePanel').then(mod => ({ default: mod.ChatSidePanel })),
  { ssr: false }
)

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <ChatPanelProvider>
        <div className="flex h-screen bg-gray-50">
          {/* デスクトップサイドバー */}
          <Sidebar />

          {/* メインエリア */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* モバイルヘッダー */}
            <Header />

            {/* コンテンツ + チャットパネル */}
            <div className="flex-1 flex overflow-hidden">
              <main className="flex-1 min-w-0 overflow-y-auto">
                {children}
              </main>
              <ChatSidePanel />
            </div>
          </div>
        </div>
      </ChatPanelProvider>
      {/* バックグラウンドタスク通知 */}
      <BackgroundTaskNotification />
    </ProtectedRoute>
  )
}

