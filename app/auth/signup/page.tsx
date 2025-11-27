'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore'

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

  // Firebaseエラーを日本語に変換
  const translateFirebaseError = (error: any): string => {
    const code = error?.code || ''
    const message = error?.message || ''

    // Firebase Authエラー
    if (code === 'auth/email-already-in-use') {
      return 'このメールアドレスは既に登録されています'
    }
    if (code === 'auth/invalid-email') {
      return 'メールアドレスの形式が正しくありません'
    }
    if (code === 'auth/weak-password') {
      return 'パスワードが弱すぎます。より強力なパスワードを設定してください'
    }
    if (code === 'auth/operation-not-allowed') {
      return 'この認証方法は現在無効になっています'
    }
    if (code === 'auth/network-request-failed') {
      return 'ネットワークエラーが発生しました。接続を確認してください'
    }

    // Firestoreエラー
    if (code === 'permission-denied' || message.includes('Missing or insufficient permissions')) {
      return 'データベースへのアクセス権限がありません。管理者に連絡してください'
    }

    // その他
    return '登録中にエラーが発生しました。しばらくしてから再度お試しください'
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
      // 1. Firebase認証でユーザー作成
      const { data: authData, error: authError } = await signUp(email, password)

      if (authError) {
        setError(translateFirebaseError(authError))
        setLoading(false)
        return
      }

      if (!authData?.user) {
        setError('ユーザー作成に失敗しました')
        setLoading(false)
        return
      }

      // 2. 企業名を正規化
      const normalizedName = normalizeCompanyName(companyName)

      // 3. 企業を検索または作成
      let companyId: string
      let finalCompanyName: string

      const companiesQuery = query(
        collection(db, 'companies'),
        where('normalizedName', '==', normalizedName)
      )
      const companiesSnapshot = await getDocs(companiesQuery)

      if (!companiesSnapshot.empty) {
        // 既存の企業
        const existingCompany = companiesSnapshot.docs[0]
        companyId = existingCompany.id
        finalCompanyName = existingCompany.data().name
      } else {
        // 新しい企業を作成
        const newCompanyRef = await addDoc(collection(db, 'companies'), {
          name: companyName.trim(),
          normalizedName: normalizedName,
          createdAt: new Date(),
        })
        companyId = newCompanyRef.id
        finalCompanyName = companyName.trim()
      }

      // 4. プロフィールを作成
      await setDoc(doc(db, 'profiles', authData.user.uid), {
        userName: userName.trim(),
        companyId: companyId,
        companyName: finalCompanyName,
        email: email,
        createdAt: new Date(),
      })

      // 5. 企業IDをローカルストレージに保存
      localStorage.setItem('company_id', companyId)
      localStorage.setItem('company_name', finalCompanyName)

      // 6. チャットページにリダイレクト
      router.push('/chat')
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(translateFirebaseError(err))
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
          <p className="text-gray-600">社内AIアシスタントを始めましょう</p>
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
