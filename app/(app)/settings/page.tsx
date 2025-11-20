'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { apiGet, apiPost } from '@/lib/api-client'
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CpuChipIcon,
  KeyIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    aiAssist: true,
    dataSharing: false,
  })

  const [userName, setUserName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyStatus, setApiKeyStatus] = useState<'loading' | 'saved' | 'not_set' | 'error'>('loading')
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showNameSuccess, setShowNameSuccess] = useState(false)

  // ユーザー名とAPIキーを取得
  useEffect(() => {
    fetchUserName()
    fetchApiKey()
  }, [])

  const fetchUserName = async () => {
    try {
      const response = await apiGet('/api/settings?key=user_name')
      if (response.ok) {
        const data = await response.json()
        setUserName(data.value || '')
      }
    } catch (error) {
      console.error('Error fetching user name:', error)
    }
  }

  const fetchApiKey = async () => {
    try {
      const response = await apiGet('/api/settings?key=anthropic_api_key')
      if (response.ok) {
        const data = await response.json()
        // セキュリティのため、最初の8文字と最後の4文字のみ表示
        const maskedKey = data.value
          ? `${data.value.substring(0, 8)}${'*'.repeat(40)}${data.value.substring(data.value.length - 4)}`
          : ''
        setApiKey(maskedKey)
        setApiKeyStatus(data.value ? 'saved' : 'not_set')
      } else {
        setApiKeyStatus('not_set')
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
      setApiKeyStatus('error')
    }
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
    if (!apiKey.trim()) {
      alert('APIキーを入力してください')
      return
    }

    setIsSaving(true)
    try {
      const response = await apiPost('/api/settings', {
        key: 'anthropic_api_key',
        value: apiKey,
      })

      if (response.ok) {
        setApiKeyStatus('saved')
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        // マスク表示に切り替え
        fetchApiKey()
      } else {
        const error = await response.json()
        alert(`保存に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      alert('保存中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const settingsSections = [
    {
      title: '通知設定',
      icon: BellIcon,
      items: [
        { label: 'プッシュ通知', type: 'toggle', key: 'notifications' },
        { label: 'メール通知', type: 'toggle', key: 'emailAlerts' },
      ],
    },
    {
      title: 'AI設定',
      icon: CpuChipIcon,
      items: [
        { label: 'AIアシスタント', type: 'toggle', key: 'aiAssist' },
        { label: 'データ共有', type: 'toggle', key: 'dataSharing' },
      ],
    },
  ]

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">設定</h1>
        <p className="text-gray-600">アカウントとシステムの設定</p>
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

        {/* Claude API Key Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <KeyIcon className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Claude API キー</h2>
                <p className="text-sm text-gray-600 mt-1">
                  チャット機能を使用するには、Claude APIキーが必要です
                </p>
              </div>
              {apiKeyStatus === 'saved' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                  <CheckCircleIcon className="w-4 h-4" />
                  設定済み
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                APIキー
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-xxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Claude APIキーは <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a> で取得できます
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveApiKey}
                disabled={isSaving || !apiKey.trim()}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : 'APIキーを保存'}
              </button>

              {showSuccess && (
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

        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (sectionIndex + 1) * 0.1 }}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <section.icon className="w-6 h-6 text-gray-900" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="text-gray-900 font-medium">{item.label}</span>

                  {'type' in item && item.type === 'toggle' ? (
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings]
                          ? 'bg-black'
                          : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{
                          x: settings[item.key as keyof typeof settings] ? 24 : 0,
                        }}
                        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  ) : (
                    <span className="text-gray-600">{'value' in item ? String(item.value) : ''}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border-2 border-red-200 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-red-600 mb-4">危険な操作</h2>
          <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
            アカウントを削除
          </button>
        </motion.div>
      </div>
    </div>
  )
}
