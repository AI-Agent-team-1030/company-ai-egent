'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    console.log('[Login] Starting login process...')

    try {
      // 1. 企業名のバリデーション
      if (!companyName.trim()) {
        console.log('[Login] Company name is empty')
        setError('企業名を入力してください')
        setLoading(false)
        return
      }

      console.log('[Login] Company name:', companyName)
      console.log('[Login] Email:', email)

      // 2. Supabase認証
      console.log('[Login] Attempting sign in...')
      const { data: authData, error: authError } = await signIn(email, password)

      console.log('[Login] Sign in result:', { authData, authError })

      if (authError) {
        console.error('[Login] Auth error:', authError)
        setError(`認証エラー: ${authError.message}`)
        setLoading(false)
        return
      }

      if (!authData || !authData.user) {
        console.error('[Login] No user data returned')
        setError('ログインに失敗しました')
        setLoading(false)
        return
      }

      console.log('[Login] User authenticated:', authData.user.id)

      // 3. 企業名を正規化して検索
      const normalizedName = normalizeCompanyName(companyName)
      console.log('[Login] Normalized company name:', normalizedName)

      console.log('[Login] Searching for company...')
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('normalized_name', normalizedName)
        .single()

      console.log('[Login] Company search result:', { company, companyError })

      if (companyError || !company) {
        console.error('[Login] Company not found:', companyError)
        setError('企業が見つかりません。企業名を確認してください')
        setLoading(false)
        return
      }

      console.log('[Login] Company found:', company.id)

      // 4. ユーザーがその企業に所属しているか確認
      console.log('[Login] Checking user profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .eq('company_id', company.id)
        .single()

      console.log('[Login] Profile result:', { profile, profileError })

      if (profileError || !profile) {
        console.error('[Login] User not in company:', profileError)
        setError('この企業に所属していません')
        setLoading(false)
        return
      }

      console.log('[Login] Profile verified')

      // 5. 企業IDをローカルストレージに保存
      console.log('[Login] Saving to localStorage...')
      localStorage.setItem('company_id', company.id)
      localStorage.setItem('company_name', company.name)

      console.log('[Login] Login complete! Redirecting to /chat...')

      // 6. チャットページにリダイレクト
      setLoading(false)
      router.push('/chat')
    } catch (err: any) {
      console.error('[Login] Unexpected error:', err)
      setError(err.message || 'ログイン中にエラーが発生しました')
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
          <p className="text-gray-600">社内ポータルサイトへようこそ</p>
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
      </motion.div>
    </div>
  )
}
