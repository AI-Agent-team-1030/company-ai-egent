'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    aiAssist: true,
    dataSharing: false,
  })

  const settingsSections = [
    {
      title: 'プロフィール',
      icon: UserIcon,
      items: [
        { label: '名前', value: 'ユーザー' },
        { label: 'メール', value: 'admin@company.com' },
        { label: '部門', value: '経営企画' },
      ],
    },
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
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
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
                    <span className="text-gray-600">{'value' in item ? item.value : ''}</span>
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
          transition={{ delay: 0.4 }}
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
