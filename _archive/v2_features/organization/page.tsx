'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { UsersIcon } from '@heroicons/react/24/outline'

interface Department {
  id: string
  name: string
  manager: string
  members: number
  description: string
}

export default function OrganizationPage() {
  const [selectedDept, setSelectedDept] = useState<string | null>(null)

  const ceo = {
    name: '代表取締役',
    person: '山田 太郎',
    description: '全社の経営戦略と意思決定を統括',
  }

  const departments: Department[] = [
    {
      id: 'sales',
      name: '営業部',
      manager: '田中 一郎',
      members: 15,
      description: '新規顧客開拓と既存顧客フォロー',
    },
    {
      id: 'marketing',
      name: 'マーケティング部',
      manager: '佐藤 花子',
      members: 8,
      description: 'ブランディングと広告宣伝活動',
    },
    {
      id: 'hr',
      name: '人事部',
      manager: '鈴木 次郎',
      members: 5,
      description: '採用・育成・労務管理',
    },
    {
      id: 'finance',
      name: '財務・経理部',
      manager: '高橋 美咲',
      members: 6,
      description: '予算管理・経理処理・財務戦略',
    },
    {
      id: 'dev',
      name: '開発部',
      manager: '伊藤 健太',
      members: 20,
      description: 'システム開発と技術基盤の構築',
    },
    {
      id: 'admin',
      name: '総務部',
      manager: '渡辺 由美',
      members: 4,
      description: 'バックオフィス業務全般',
    },
  ]

  const selectedDepartment = departments.find(d => d.id === selectedDept)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">組織図</h1>
        <p className="text-gray-600">会社の組織構造と各部署の情報</p>
      </motion.div>

      <div className="flex gap-8">
        {/* Organization Chart */}
        <div className="flex-1">
          <div className="max-w-5xl mx-auto">
            {/* CEO */}
            <div className="flex justify-center mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-80 bg-white rounded-lg p-6 shadow-md border-2 border-gray-300"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <UsersIcon className="w-8 h-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{ceo.name}</h3>
                  <p className="text-sm font-medium text-gray-700 mb-2">{ceo.person}</p>
                  <p className="text-xs text-gray-600">{ceo.description}</p>
                </div>
              </motion.div>
            </div>

            {/* Vertical Connection Line */}
            <div className="flex justify-center mb-12">
              <div className="w-0.5 h-16 bg-gray-300" />
            </div>

            {/* Departments */}
            <div className="relative">
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {departments.map((dept, index) => {
                  const col = index % 3
                  const row = Math.floor(index / 3)
                  const isSelected = selectedDept === dept.id

                  return (
                    <line
                      key={dept.id}
                      x1="50%"
                      y1="0"
                      x2={`${(col * 33.33) + 16.67}%`}
                      y2={`${row * 50 + 15}%`}
                      stroke={isSelected ? '#000' : '#d1d5db'}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                  )
                })}
              </svg>

              {/* Department Cards */}
              <div className="grid grid-cols-3 gap-6 relative" style={{ zIndex: 10 }}>
                {departments.map((dept, index) => {
                  const isSelected = selectedDept === dept.id

                  return (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                      className={`cursor-pointer bg-white rounded-lg p-5 shadow-md border-2 transition-all ${
                        isSelected
                          ? 'border-gray-900 shadow-xl'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="mb-3">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{dept.name}</h4>
                        <p className="text-sm text-gray-600">{dept.manager}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <UsersIcon className="w-4 h-4" />
                        <span>{dept.members}名</span>
                      </div>
                      <p className="text-xs text-gray-600">{dept.description}</p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Department Detail Panel */}
        {selectedDepartment && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-96 bg-white border-2 border-gray-900 rounded-lg p-6 shadow-xl"
            style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedDepartment.name}
              </h2>
              <p className="text-sm text-gray-600">{selectedDepartment.description}</p>
            </div>

            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">部門長</h3>
                <p className="text-lg font-medium text-gray-900">{selectedDepartment.manager}</p>
              </div>

              <div className="pb-4 border-b border-gray-200">
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">メンバー数</h3>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-gray-600" />
                  <p className="text-lg font-medium text-gray-900">{selectedDepartment.members}名</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-2">主な業務</h3>
                <p className="text-sm text-gray-700">{selectedDepartment.description}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDept(null)}
              className="w-full mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
          </motion.div>
        )}
      </div>

      {/* Company Stats */}
      <div className="max-w-5xl mx-auto mt-12">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">総従業員数</div>
            <div className="text-2xl font-bold text-gray-900">
              {departments.reduce((sum, dept) => sum + dept.members, 0) + 1}名
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">部署数</div>
            <div className="text-2xl font-bold text-gray-900">{departments.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">平均部署人数</div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(departments.reduce((sum, dept) => sum + dept.members, 0) / departments.length)}名
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">最大部署</div>
            <div className="text-lg font-bold text-gray-900">
              {departments.reduce((max, dept) => dept.members > max.members ? dept : max).name}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
