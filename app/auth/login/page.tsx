'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { authLogger } from '@/lib/logger'

export default function LoginPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  // 企業名を正規化する関数
  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/株式会社|（株）|\(株\)|有限会社|合同会社/g, '')
      .replace(/\s+/g, '')
      .replace(/[　]/g, '')
      .trim()
  }

  // Firebaseエラーを日本語に変換
  const translateFirebaseError = (error: { code?: string; message?: string } | null): string => {
    const code = error?.code || ''
    const message = error?.message || ''

    // Firebase Authエラー
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
      return 'メールアドレスまたはパスワードが正しくありません'
    }
    if (code === 'auth/invalid-email') {
      return 'メールアドレスの形式が正しくありません'
    }
    if (code === 'auth/too-many-requests') {
      return 'ログイン試行回数が多すぎます。しばらく待ってから再度お試しください'
    }
    if (code === 'auth/invalid-credential') {
      return 'メールアドレスまたはパスワードが正しくありません'
    }
    if (code === 'auth/network-request-failed') {
      return 'ネットワークエラーが発生しました。接続を確認してください'
    }

    // Firestoreエラー
    if (code === 'permission-denied' || message.includes('Missing or insufficient permissions')) {
      return 'データベースへのアクセス権限がありません。管理者に連絡してください'
    }
    if (message.includes('Failed to get document')) {
      return 'データの取得に失敗しました'
    }

    // その他
    return 'ログイン中にエラーが発生しました。しばらくしてから再度お試しください'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. 企業名のバリデーション
      if (!companyName.trim()) {
        setError('企業名を入力してください')
        setLoading(false)
        return
      }

      // 2. Firebase認証
      const { data: authData, error: authError } = await signIn(email, password)

      if (authError) {
        setError(translateFirebaseError(authError))
        setLoading(false)
        return
      }

      if (!authData || !authData.user) {
        setError('ログインに失敗しました')
        setLoading(false)
        return
      }

      // 3. 認証状態が反映されるまで少し待機
      await new Promise(resolve => setTimeout(resolve, 500))

      // 4. ユーザーのプロフィールを直接取得
      const profileDoc = await getDoc(doc(db, 'profiles', authData.user.uid))

      if (!profileDoc.exists()) {
        setError('プロフィールが見つかりません。新規登録してください')
        setLoading(false)
        return
      }

      const profileData = profileDoc.data()

      // 4. 入力された企業名を正規化して比較
      const normalizedInputName = normalizeCompanyName(companyName)
      const normalizedProfileName = normalizeCompanyName(profileData.companyName || '')

      if (normalizedInputName !== normalizedProfileName) {
        setError('企業名が登録情報と一致しません')
        setLoading(false)
        return
      }

      // 5. 企業IDをローカルストレージに保存
      localStorage.setItem('company_id', profileData.companyId)
      localStorage.setItem('company_name', profileData.companyName)

      // 6. チャットページにリダイレクト
      setLoading(false)
      router.push('/chat')
    } catch (err: unknown) {
      authLogger.error('Login error:', err)
      const errorInfo = err && typeof err === 'object' && 'code' in err
        ? { code: String((err as { code: unknown }).code), message: String((err as { message?: unknown }).message || '') }
        : null
      setError(translateFirebaseError(errorInfo))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
          <p className="text-gray-600">社内ナレッジ検索くんへようこそ</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              企業名
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="例: ABC株式会社"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            アカウントをお持ちでないですか？{' '}
            <Link href="/auth/signup" className="text-black font-semibold hover:underline">
              新規登録
            </Link>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-xs">
            ログインすることで、
            <Link href="/privacy" className="text-gray-600 hover:text-black underline">
              プライバシーポリシー
            </Link>
            に同意したものとみなされます。
          </p>
        </div>
      </motion.div>
    </div>
  )
}
