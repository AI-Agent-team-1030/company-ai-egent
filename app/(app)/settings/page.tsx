'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  UserIcon,
  KeyIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CloudIcon,
  LinkIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { linkGoogleDrive, getGoogleDriveToken, clearGoogleDriveToken, handleGoogleDriveRedirect, isGoogleDriveRedirectPending } from '@/lib/firebase-auth'
import {
  getCompanyDriveConnection,
  saveCompanyDriveConnection,
  disconnectCompanyDrive,
  CompanyDriveConnection,
} from '@/lib/firestore-chat'
import { settingsLogger } from '@/lib/logger'
import { TemplateManager } from './components/TemplateManager'

// AIプロバイダーの定義（Geminiは標準搭載のため除外）
const AI_PROVIDERS = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    settingKey: 'anthropic_api_key',
    placeholder: 'sk-ant-api03-xxxxxxxxxxxxxxxxxx',
    getKeyUrl: 'https://console.anthropic.com/',
    description: 'Claude 4.5 Sonnet / Haiku を使用する場合',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    settingKey: 'openai_api_key',
    placeholder: 'sk-xxxxxxxxxxxxxxxxxx',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT-5.1 を使用する場合',
  },
]

export default function SettingsPage() {
  const { user, profile, loading } = useAuth()
  const [userName, setUserName] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<typeof AI_PROVIDERS[0] | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingKey, setIsSavingKey] = useState(false)
  const [showNameSuccess, setShowNameSuccess] = useState(false)
  const [showKeySuccess, setShowKeySuccess] = useState(false)
  const [companyDriveConnection, setCompanyDriveConnection] = useState<CompanyDriveConnection | null>(null)
  const [isConnectingDrive, setIsConnectingDrive] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const [driveSuccess, setDriveSuccess] = useState<string | null>(null)
  const [isLoadingDriveStatus, setIsLoadingDriveStatus] = useState(true)
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false)

  // プロフィールからユーザー名を取得
  useEffect(() => {
    if (!loading && profile) {
      setUserName(profile.userName || '')
    }
  }, [profile, loading])

  // APIキーを取得
  useEffect(() => {
    if (!loading && user) {
      fetchApiKeys()
    }
  }, [user, loading])

  // Googleドライブのリダイレクト結果を処理
  useEffect(() => {
    const processRedirectResult = async () => {
      if (!profile?.companyId || !user) return

      // リダイレクト待機中かチェック
      const isPending = isGoogleDriveRedirectPending()
      settingsLogger.debug('[Drive] Checking redirect result, isPending:', isPending)

      if (!isPending) {
        return
      }

      setIsProcessingRedirect(true)
      setDriveError(null)

      try {
        settingsLogger.debug('[Drive] Processing redirect result...')
        const { accessToken, error } = await handleGoogleDriveRedirect()
        settingsLogger.debug('[Drive] Redirect result:', { hasToken: !!accessToken, error })

        if (error) {
          setDriveError(error.message)
          setIsProcessingRedirect(false)
          return
        }

        if (accessToken) {
          settingsLogger.debug('[Drive] Saving connection to Firestore...')
          // リダイレクトから戻ってきた場合、会社レベルで保存
          await saveCompanyDriveConnection(profile.companyId, {
            connectedBy: user.uid,
            connectedByEmail: user.email || undefined,
            accessToken,
          })
          setCompanyDriveConnection({
            isConnected: true,
            connectedBy: user.uid,
            connectedByEmail: user.email || undefined,
            accessToken,
            connectedAt: new Date(),
          })
          setDriveSuccess('Googleドライブに接続しました！')
          setTimeout(() => setDriveSuccess(null), 5000)
          settingsLogger.debug('[Drive] Connection saved successfully!')
        } else {
          settingsLogger.debug('[Drive] No access token received')
          setDriveError('アクセストークンの取得に失敗しました。もう一度お試しください。')
        }
      } catch (err: any) {
        settingsLogger.error('[Drive] Failed to process redirect result:', err)
        setDriveError(err.message || 'Google認証の処理中にエラーが発生しました')
      } finally {
        setIsProcessingRedirect(false)
      }
    }

    processRedirectResult()
  }, [profile?.companyId, user])

  // 会社のGoogleドライブ接続状態を確認
  useEffect(() => {
    const loadDriveConnection = async () => {
      if (!profile?.companyId) {
        setIsLoadingDriveStatus(false)
        return
      }
      try {
        const connection = await getCompanyDriveConnection(profile.companyId)
        setCompanyDriveConnection(connection)
      } catch (error) {
        settingsLogger.error('Failed to load drive connection:', error)
      } finally {
        setIsLoadingDriveStatus(false)
      }
    }
    loadDriveConnection()
  }, [profile?.companyId])

  const fetchApiKeys = async () => {
    if (!user) return

    try {
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid))
      if (profileDoc.exists()) {
        const data = profileDoc.data()
        const keys: Record<string, string> = {}

        for (const provider of AI_PROVIDERS) {
          const keyValue = data[provider.settingKey]
          if (keyValue) {
            // マスク表示
            keys[provider.settingKey] = `${keyValue.substring(0, 8)}${'*'.repeat(20)}${keyValue.substring(keyValue.length - 4)}`
          }
        }

        setApiKeys(keys)
      }
    } catch (error) {
      settingsLogger.error('Failed to fetch API keys:', error)
    }
  }

  const handleSaveName = async () => {
    if (!userName.trim()) {
      alert('名前を入力してください')
      return
    }

    if (!user) {
      alert('ログインしてください')
      return
    }

    setIsSavingName(true)
    try {
      // Firestoreのプロフィールを更新
      await updateDoc(doc(db, 'profiles', user.uid), {
        userName: userName.trim(),
      })

      setShowNameSuccess(true)
      setTimeout(() => setShowNameSuccess(false), 3000)
    } catch (error) {
      settingsLogger.error('Error saving user name:', error)
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

    if (!user) {
      alert('ログインしてください')
      return
    }

    setIsSavingKey(true)
    try {
      // Firestoreのプロフィールを更新（APIキーを保存）
      await updateDoc(doc(db, 'profiles', user.uid), {
        [selectedProvider.settingKey]: apiKey.trim(),
      })

      setShowKeySuccess(true)
      setTimeout(() => setShowKeySuccess(false), 3000)
      await fetchApiKeys()
      setApiKey('')
      setSelectedProvider(null)
    } catch (error) {
      settingsLogger.error('Error saving API key:', error)
      alert('保存中にエラーが発生しました')
    } finally {
      setIsSavingKey(false)
    }
  }

  // 会社のGoogleドライブに接続（ポップアップ方式）
  const handleConnectCompanyDrive = async () => {
    if (!profile?.companyId || !user) return

    setIsConnectingDrive(true)
    setDriveError(null)
    setDriveSuccess(null)

    try {
      const { accessToken, error } = await linkGoogleDrive()

      if (error) {
        setDriveError(error.message)
        setIsConnectingDrive(false)
        return
      }

      if (accessToken) {
        // 会社レベルで保存
        settingsLogger.debug('[Drive] Saving connection to Firestore...')
        await saveCompanyDriveConnection(profile.companyId, {
          connectedBy: user.uid,
          connectedByEmail: user.email || undefined,
          accessToken,
        })
        settingsLogger.debug('[Drive] Connection saved successfully')

        // Firestoreへの保存が反映されるまで少し待つ
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 保存を確認
        const savedConnection = await getCompanyDriveConnection(profile.companyId)
        settingsLogger.debug('[Drive] Verified saved connection:', {
          isConnected: savedConnection?.isConnected,
          hasToken: !!savedConnection?.accessToken,
        })

        setCompanyDriveConnection({
          isConnected: true,
          connectedBy: user.uid,
          connectedByEmail: user.email || undefined,
          accessToken,
          connectedAt: new Date(),
        })
        setDriveSuccess('Googleドライブに接続しました！')
        setTimeout(() => setDriveSuccess(null), 5000)
        setIsConnectingDrive(false)
      }
    } catch (err: any) {
      setDriveError(err.message || 'Googleドライブへの接続に失敗しました')
      setIsConnectingDrive(false)
    }
  }

  // 会社のGoogleドライブから切断
  const handleDisconnectCompanyDrive = async () => {
    if (!profile?.companyId) return

    try {
      await disconnectCompanyDrive(profile.companyId)
      clearGoogleDriveToken()
      setCompanyDriveConnection(null)
    } catch (err: any) {
      setDriveError(err.message || '切断に失敗しました')
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">設定</h1>
        <p className="text-sm md:text-base text-gray-600">アカウントとAPIキーの設定</p>
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
                value={profile?.companyName || ''}
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

        {/* Company Google Drive Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CloudIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">会社のGoogleドライブ連携</h2>
                <p className="text-sm text-gray-600 mt-1">
                  会社全体で使用するGoogleドライブの連携設定（チャット時に自動検索されます）
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoadingDriveStatus ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            ) : companyDriveConnection?.isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Googleドライブに接続中</p>
                    <p className="text-sm text-green-600">
                      チャットで質問すると、自動的にドライブ内を検索します
                    </p>
                  </div>
                </div>

                {driveSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="text-sm">{driveSuccess}</span>
                  </div>
                )}

                {driveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
                    <XCircleIcon className="w-5 h-5" />
                    <span className="text-sm">{driveError}</span>
                  </div>
                )}

                <button
                  onClick={handleDisconnectCompanyDrive}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  接続を解除
                </button>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700">
                    <strong>注意:</strong> アクセストークンの有効期限が切れた場合は、再接続が必要になることがあります。
                  </p>
                </div>
              </div>
            ) : isProcessingRedirect ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800">Google認証を処理中...</p>
                    <p className="text-sm text-blue-600">
                      しばらくお待ちください
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  会社のGoogleドライブに接続すると、チャットで質問した際に自動的にドライブ内のドキュメントを検索して回答に活用します。
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">接続すると...</h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>チャットで質問すると自動でドライブを検索</li>
                    <li>ドキュメントの内容を回答に活用</li>
                    <li>同じ会社のメンバー全員が利用可能</li>
                  </ul>
                </div>

                {driveSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="text-sm">{driveSuccess}</span>
                  </div>
                )}

                {driveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
                    <XCircleIcon className="w-5 h-5" />
                    <span className="text-sm">{driveError}</span>
                  </div>
                )}

                <button
                  onClick={handleConnectCompanyDrive}
                  disabled={isConnectingDrive}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isConnectingDrive ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      接続中...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-5 h-5" />
                      会社のGoogleドライブに接続
                    </>
                  )}
                </button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>接続時にGoogleアカウントへのログインが求められます。</p>
                  <p>ドライブの読み取り権限のみを使用します（書き込みは行いません）。</p>
                  <p>接続したアカウントのドライブが会社全体で共有されます。</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI API Keys Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
                    setApiKey('')
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    selectedProvider?.id === provider.id
                      ? 'border-gray-900 bg-gray-50'
                      : apiKeys[provider.settingKey]
                      ? 'border-green-500 hover:border-green-600 bg-green-50/50 shadow-md ring-2 ring-green-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div>
                      <span className="font-bold text-gray-900">{provider.name}</span>
                      {provider.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{provider.description}</p>
                      )}
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

        {/* Prompt Templates Section */}
        {profile?.companyId && user && (
          <TemplateManager
            companyId={profile.companyId}
            userId={user.uid}
            userName={profile.userName}
          />
        )}
      </div>
    </div>
  )
}
