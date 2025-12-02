import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const notoSansJP = Noto_Sans_JP({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '社内ナレッジ検索くん',
  description: '社内のナレッジをAIで検索・活用できる社内ポータル',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
