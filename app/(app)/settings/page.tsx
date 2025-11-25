'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { apiGet, apiPost } from '@/lib/api-client'
import {
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

// AIプロバイダーの定義
const AI_PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    settingKey: 'anthropic_api_key',
    placeholder: 'sk-ant-api03-xxxxxxxxxxxxxxxxxx',
    getKeyUrl: 'https://console.anthropic.com/',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    settingKey: 'openai_api_key',
    placeholder: '',
    getKeyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    settingKey: 'google_gemini_api_key',
    placeholder: '',
    getKeyUrl: 'https://makersuite.google.com/app/apikey',
  },
]

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const [userName, setUserName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<typeof AI_PROVIDERS[0] | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [showNameSuccess, setShowNameSuccess] = useState(false)
  const [showKeySuccess, setShowKeySuccess] = useState(false)

  // ユーザー名、会社名、APIキーを取得
  useEffect(() => {
    if (!loading && user) {
      fetchUserName()
      fetchCompanyName()
      fetchAllApiKeys()
    }
  }, [user, loading])

  const fetchUserName = async () => {
    try {
      const response = await apiGet('/api/settings?key=user_name')
      if (response.ok) {
        const data = await response.json()
        setUserName(data.value || '')
      }
    } catch (error) {
      console.error('[Settings Page] Error fetching user name:', error)
    }
  }

  const fetchCompanyName = async () => {
    try {
      // Supabaseから会社名を取得
      const response = await apiGet('/api/company')
      if (response.ok) {
        const data = await response.json()
        setCompanyName(data.name || '')
      }
    } catch (error) {
      console.error('Failed to fetch company name:', error)
    }
  }

  const fetchAllApiKeys = async () => {
    const keys: Record<string, string> = {}

    for (const provider of AI_PROVIDERS) {
      try {
        const response = await apiGet(`/api/settings?key=${provider.settingKey}`)
        if (response.ok) {
          const data = await response.json()
          if (data.value) {
            // マスク表示
            keys[provider.settingKey] = `${data.value.substring(0, 8)}${'*'.repeat(20)}${data.value.substring(data.value.length - 4)}`
          }
        }
      } catch (error) {
        // エラーは無視（設定されていないだけ）
      }
    }

    setApiKeys(keys)
  }

  const handleSaveName = async () => {
    if (!userName.trim()) {
      alert('名前を入力してください')
      return
    }

    setIsSavingName(true)
    try {
      const response = await apiPost('/api/settings', {
        key: 'user_name',
        value: userName.trim(),
      })

      if (response.ok) {
        setShowNameSuccess(true)
        setTimeout(() => setShowNameSuccess(false), 3000)
        await fetchUserName()
      } else {
        const error = await response.json()
        alert(`保存に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving user name:', error)
      alert('保存中にエラーが発生しました')
    } finally {
      setIsSavingName(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      alert('APIキーを入力してください')
      return
    }

    setIsSavingKey(true)
    try {
      const response = await apiPost('/api/settings', {
        key: selectedProvider.settingKey,
        value: apiKey,
      })

      if (response.ok) {
        setShowKeySuccess(true)
        setTimeout(() => setShowKeySuccess(false), 3000)
        await fetchAllApiKeys()
        setApiKey('')
        setSelectedProvider(null)
      } else {
        const error = await response.json()
        alert(`保存に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      alert('保存中にエラーが発生しました')
    } finally {
      setIsSavingKey(false)
    }
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 認証されていない場合の表示
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">認証されていません。ログインしてください。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">設定</h1>
        <p className="text-gray-600">アカウントとAPIキーの設定</p>
      </div>

      {/* Settings Sections */}
      <div className="max-w-4xl space-y-6">
        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">プロフィール</h2>
                <p className="text-sm text-gray-600 mt-1">
                  表示名とアカウント情報
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                表示名
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="山田太郎"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <p className="text-xs text-gray-500 mt-2">
                サイドバーやプロフィールに表示される名前です
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-2">
                メールアドレスは変更できません
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                企業名
              </label>
              <input
                type="text"
                value={companyName}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-2">
                企業名は変更できません
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveName}
                disabled={isSavingName || !userName.trim()}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSavingName ? '保存中...' : '名前を保存'}
              </button>

              {showNameSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-green-600 font-medium"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  保存しました
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI API Keys Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <KeyIcon className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">AI APIキー</h2>
                <p className="text-sm text-gray-600 mt-1">
                  使用するAIモデルのAPIキーを設定してください
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* AI Providers List */}
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                AIプロバイダーを選択
              </label>
              {AI_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider)
                    setApiKey(apiKeys[provider.settingKey] || '')
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    selectedProvider?.id === provider.id
                      ? 'border-gray-900 bg-gray-50'
                      : apiKeys[provider.settingKey]
                      ? 'border-green-500 hover:border-green-600 bg-green-50/50 shadow-md ring-2 ring-green-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold text-gray-900">{provider.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {apiKeys[provider.settingKey] && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
                        <CheckCircleIcon className="w-4 h-4" />
                        設定済み
                      </div>
                    )}
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>

            {/* API Key Input Form */}
            <AnimatePresence>
              {selectedProvider && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 pt-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      {selectedProvider.name} のAPIキー
                    </label>
                    <input
                      type="text"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={selectedProvider.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      APIキーは <a href={selectedProvider.getKeyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedProvider.name}</a> で取得できます
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={isSavingKey || !apiKey.trim()}
                      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSavingKey ? '保存中...' : 'APIキーを保存'}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedProvider(null)
                        setApiKey('')
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                      キャンセル
                    </button>

                    {showKeySuccess && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-green-600 font-medium"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        保存しました
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
