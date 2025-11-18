'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  StarIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { mockKnowledge } from '@/data/mockData'

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent'>('popular')
  const [showFilters, setShowFilters] = useState(true)

  // カテゴリーを抽出
  const categories = ['all', ...Array.from(new Set(mockKnowledge.map(item => item.category)))]

  // 全タグを抽出
  const allTags = Array.from(new Set(mockKnowledge.flatMap(item => item.tags)))

  // フィルタリングとソート
  const filteredKnowledge = mockKnowledge
    .filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => item.tags.includes(tag))
      return matchesSearch && matchesCategory && matchesTags
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.usageCount - a.usageCount
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
      return 0
    })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ナレッジベース</h1>
          <p className="text-gray-600">組織の知識を蓄積・共有</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold">
          <PlusIcon className="w-5 h-5" />
          新規作成
        </button>
      </div>

      {/* Search & Controls */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ナレッジを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              showFilters ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            フィルター
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-gray-200 space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">カテゴリー</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category === 'all' ? 'すべて' : category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tag Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">タグ</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <TagIcon className="w-3.5 h-3.5" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">並び替え</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'popular', label: '人気順' },
                      { value: 'rating', label: '評価順' },
                      { value: 'recent', label: '新着順' },
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          sortBy === option.value
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedCategory !== 'all' || selectedTags.length > 0) && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-gray-600">選択中:</span>
                    {selectedCategory !== 'all' && (
                      <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2">
                        {selectedCategory}
                        <button onClick={() => setSelectedCategory('all')}>
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    )}
                    {selectedTags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                        {tag}
                        <button onClick={() => toggleTag(tag)}>
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">総ナレッジ数</p>
          <p className="text-2xl font-bold text-gray-900">{mockKnowledge.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">カテゴリー数</p>
          <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">タグ数</p>
          <p className="text-2xl font-bold text-gray-900">{allTags.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">表示中</p>
          <p className="text-2xl font-bold text-gray-900">{filteredKnowledge.length}</p>
        </div>
      </div>

      {/* Knowledge Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKnowledge.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium">
                {item.category}
              </span>
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-bold text-gray-900">{item.rating}</span>
              </div>
            </div>

            <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">{item.content}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {item.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpenIcon className="w-4 h-4" />
                <span className="text-xs">{item.usageCount}回使用</span>
              </div>
              <button className="text-xs font-medium text-gray-900 hover:text-gray-600 transition-colors">
                詳細を見る →
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredKnowledge.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">ナレッジが見つかりません</h3>
          <p className="text-gray-600">検索条件を変更してみてください</p>
        </motion.div>
      )}
    </div>
  )
}
