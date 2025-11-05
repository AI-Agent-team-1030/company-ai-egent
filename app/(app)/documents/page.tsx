'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { mockDocuments } from '@/data/mockData'

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || doc.type === filterType
    return matchesSearch && matchesType
  })

  const typeLabels: Record<string, string> = {
    report: 'レポート',
    proposal: '提案書',
    manual: 'マニュアル',
    contract: '契約書',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ドキュメント管理</h1>
        <p className="text-gray-600">重要な文書を一元管理</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-2xl">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ドキュメントを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="all">すべて</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(typeLabels).map(([type, label]) => {
          const count = mockDocuments.filter((doc) => doc.type === type).length
          return (
            <div key={type} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-900 mb-1">{count}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          )
        })}
      </div>

      {/* Documents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{doc.title}</h3>
                <p className="text-xs text-gray-500">{doc.createdAt.toLocaleDateString('ja-JP')}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-xs">
                {typeLabels[doc.type]}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-xs">
                {doc.department}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-600">作成者: {doc.createdBy}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                doc.status === 'published' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {doc.status === 'published' ? '公開中' : '下書き'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
