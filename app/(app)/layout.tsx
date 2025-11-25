import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Mobile Header with hamburger menu */}
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

