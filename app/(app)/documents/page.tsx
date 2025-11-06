'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FolderIcon,
  TagIcon,
  XMarkIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { mockDocuments } from '@/data/mockData'

interface DocWithTags {
  id: string
  title: string
  description?: string
  type: string
  department: string
  createdBy: string
  createdAt: Date
  status: string
  tags: string[]
  folder: string
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // ドキュメントにタグとフォルダを追加
  const documentsWithTags: DocWithTags[] = mockDocuments.map((doc, index) => ({
    ...doc,
    tags: index % 3 === 0 ? ['重要', '承認済み'] : index % 2 === 0 ? ['作成中', '要確認'] : ['完了'],
    folder: doc.type === 'report' ? 'レポート' :
            doc.type === 'proposal' ? '提案資料' :
            doc.type === 'manual' ? 'マニュアル' : '契約書類'
  }))

  const typeLabels: Record<string, string> = {
    report: 'レポート',
    proposal: '提案書',
    manual: 'マニュアル',
    contract: '契約書',
  }

  // フォルダ一覧
  const folders = ['all', ...Array.from(new Set(documentsWithTags.map(doc => doc.folder)))]

  // 全タグ
  const allTags = Array.from(new Set(documentsWithTags.flatMap(doc => doc.tags)))

  const filteredDocuments = documentsWithTags.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || doc.type === filterType
    const matchesFolder = selectedFolder === 'all' || doc.folder === selectedFolder
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => doc.tags.includes(tag))
    return matchesSearch && matchesType && matchesFolder && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const getTagColor = (tag: string) => {
    if (tag === '重要') return 'bg-red-100 text-red-700 border-red-200'
    if (tag === '承認済み') return 'bg-green-100 text-green-700 border-green-200'
    if (tag === '作成中') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (tag === '要確認') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (tag === '完了') return 'bg-gray-100 text-gray-700 border-gray-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ドキュメント管理</h1>
          <p className="text-gray-600">重要な文書を一元管理</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
            <ArrowUpTrayIcon className="w-5 h-5" />
            アップロード
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold">
            <PlusIcon className="w-5 h-5" />
            新規作成
          </button>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ドキュメントを検索..."
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
                {/* Folder Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">フォルダ</label>
                  <div className="flex flex-wrap gap-2">
                    {folders.map(folder => (
                      <button
                        key={folder}
                        onClick={() => setSelectedFolder(folder)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          selectedFolder === folder
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <FolderIcon className="w-4 h-4" />
                        {folder === 'all' ? 'すべて' : folder}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">種類</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterType === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      すべて
                    </button>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setFilterType(value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterType === value
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
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
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border flex items-center gap-1 ${
                          selectedTags.includes(tag)
                            ? getTagColor(tag)
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        <TagIcon className="w-3.5 h-3.5" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedFolder !== 'all' || filterType !== 'all' || selectedTags.length > 0) && (
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    <span className="text-sm text-gray-600">選択中:</span>
                    {selectedFolder !== 'all' && (
                      <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2">
                        {selectedFolder}
                        <button onClick={() => setSelectedFolder('all')}>
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    )}
                    {filterType !== 'all' && (
                      <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2">
                        {typeLabels[filterType]}
                        <button onClick={() => setFilterType('all')}>
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    )}
                    {selectedTags.map(tag => (
                      <span key={tag} className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 border ${getTagColor(tag)}`}>
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
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">総ドキュメント数</p>
          <p className="text-2xl font-bold text-gray-900">{mockDocuments.length}</p>
        </div>
        {Object.entries(typeLabels).map(([type, label]) => {
          const count = mockDocuments.filter((doc) => doc.type === type).length
          return (
            <div key={type} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
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
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-gray-900" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 line-clamp-1">{doc.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{doc.createdAt.toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-xs font-medium">
                {typeLabels[doc.type]}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-900 rounded text-xs font-medium">
                {doc.department}
              </span>
              {doc.tags.map((tag, i) => (
                <span
                  key={i}
                  className={`px-2 py-1 rounded text-xs font-medium border ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-600">作成者: {doc.createdBy}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                doc.status === 'published' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {doc.status === 'published' ? '公開中' : '下書き'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">ドキュメントが見つかりません</h3>
          <p className="text-gray-600">検索条件を変更してみてください</p>
        </motion.div>
      )}
    </div>
  )
}
