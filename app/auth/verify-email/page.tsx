'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
      >
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <EnvelopeIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">メールを確認してください</h1>
          <p className="text-gray-600">
            登録確認メールを送信しました。メールに記載されているリンクをクリックして、アカウントを有効化してください。
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>注意：</strong> メールが届かない場合は、迷惑メールフォルダを確認してください。
          </p>
        </div>

        <Link
          href="/auth/login"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          ログインページに戻る
        </Link>
      </motion.div>
    </div>
  )
}
