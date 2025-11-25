'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

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

    // バリデーション
    if (!companyName.trim()) {
      setError('企業名を入力してください')
      setLoading(false)
      return
    }

    if (!userName.trim()) {
      setError('お名前を入力してください')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      // 1. Supabase認証でユーザー作成
      console.log('Starting signup process...')
      const { data: authData, error: authError } = await signUp(email, password)

      console.log('Signup result:', { authData, authError })

      if (authError) {
        console.error('Auth error:', authError)
        // ユーザーが既に存在する場合
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          setError('このメールアドレスは既に登録されています。ログインページからログインしてください。')
        } else {
          setError(`認証エラー: ${authError.message}`)
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        console.error('No user data returned')
        setError('ユーザー作成に失敗しました')
        setLoading(false)
        return
      }

      console.log('User created:', authData.user.id)

      // 2. 企業名を正規化
      console.log('Normalizing company name:', companyName)
      const normalizedName = normalizeCompanyName(companyName)
      console.log('Normalized name:', normalizedName)

      // 3. 企業を検索または作成
      let companyId: string

      console.log('Searching for existing company...')
      const { data: existingCompany, error: searchError } = await supabase
        .from('companies')
        .select('id')
        .eq('normalized_name', normalizedName)
        .single()

      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Company search error:', searchError)
      }

      if (existingCompany) {
        // 既存の企業
        console.log('Found existing company:', existingCompany.id)
        companyId = existingCompany.id
      } else {
        // 新しい企業を作成
        console.log('Creating new company...')
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName.trim(),
            normalized_name: normalizedName,
          })
          .select('id')
          .single()

        if (companyError) {
          console.error('Company creation error:', companyError)
          setError(`企業の作成に失敗しました: ${companyError.message}`)
          setLoading(false)
          return
        }

        if (!newCompany) {
          console.error('No company data returned')
          setError('企業の作成に失敗しました')
          setLoading(false)
          return
        }

        console.log('Company created:', newCompany.id)
        companyId = newCompany.id
      }

      // 4. プロフィールを作成
      console.log('Creating profile for user:', authData.user.id)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          company_id: companyId,
          user_name: userName.trim(),
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setError(`プロフィールの作成に失敗しました: ${profileError.message}`)
        setLoading(false)
        return
      }

      console.log('Profile created successfully')

      // 5. 企業IDをローカルストレージに保存
      localStorage.setItem('company_id', companyId)
      localStorage.setItem('company_name', companyName.trim())

      console.log('Signup complete! Redirecting to chat...')

      // 6. チャットページにリダイレクト
      router.push('/chat')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || '登録中にエラーが発生しました')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新規登録</h1>
          <p className="text-gray-600">社内ポータルサイトを始めましょう</p>
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
            <p className="text-xs text-gray-500 mt-1">
              同じ企業名のユーザーとナレッジを共有できます
            </p>
          </div>

          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              お名前
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="山田 太郎"
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
            <p className="text-xs text-gray-500 mt-1">
              個人のメールアドレス（Gmail等）もご利用いただけます
            </p>
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? '登録中...' : '登録'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/auth/login" className="text-black font-semibold hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
