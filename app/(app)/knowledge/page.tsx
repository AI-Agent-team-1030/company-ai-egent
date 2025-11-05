'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpenIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline'
import { mockKnowledge } from '@/data/mockData'

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredKnowledge = mockKnowledge.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ナレッジベース</h1>
        <p className="text-gray-600">組織の知識を蓄積・共有</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ナレッジを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      {/* Knowledge Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKnowledge.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium">
                {item.category}
              </span>
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-gray-900 fill-gray-900" />
                <span className="text-sm font-bold text-gray-900">{item.rating}</span>
              </div>
            </div>

            <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.content}</p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">{item.usageCount}回使用</span>
              </div>
              <div className="flex gap-1">
                {item.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
