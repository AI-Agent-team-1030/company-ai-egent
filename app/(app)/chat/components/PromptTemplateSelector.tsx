'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  ChevronDownIcon,
  XMarkIcon,
  StarIcon,
  BuildingOfficeIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES, PromptTemplate } from '../constants'
import { getAllTemplates, CustomPromptTemplate } from '@/lib/firestore-templates'

interface Props {
  onSelect: (template: PromptTemplate) => void
  disabled?: boolean
  companyId?: string
  userId?: string
}

// カスタムテンプレートをPromptTemplate形式に変換
function convertCustomTemplate(custom: CustomPromptTemplate): PromptTemplate & { isCustom: boolean; isShared: boolean } {
  return {
    id: `custom-${custom.id}`,
    name: custom.name,
    category: custom.category,
    description: custom.description,
    prompt: custom.prompt,
    isCustom: true,
    isShared: custom.isShared,
  }
}

export function PromptTemplateSelector({ onSelect, disabled, companyId, userId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [customTemplates, setCustomTemplates] = useState<(PromptTemplate & { isCustom?: boolean; isShared?: boolean })[]>([])
  const [isLoadingCustom, setIsLoadingCustom] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // カスタムテンプレートを取得
  useEffect(() => {
    const loadCustomTemplates = async () => {
      if (!companyId || !userId) return

      setIsLoadingCustom(true)
      try {
        const templates = await getAllTemplates(userId, companyId)
        setCustomTemplates(templates.map(convertCustomTemplate))
      } catch (error) {
        // エラーは無視（デフォルトのみ表示）
      } finally {
        setIsLoadingCustom(false)
      }
    }

    if (isOpen && companyId && userId) {
      loadCustomTemplates()
    }
  }, [isOpen, companyId, userId])

  // デフォルトとカスタムを結合
  const allTemplates: (PromptTemplate & { isCustom?: boolean; isShared?: boolean })[] = [
    ...customTemplates,
    ...PROMPT_TEMPLATES.map(t => ({ ...t, isCustom: false, isShared: false })),
  ]

  const filteredTemplates = selectedCategory === 'all'
    ? allTemplates
    : allTemplates.filter(t => t.category === selectedCategory)

  const handleSelect = (template: PromptTemplate) => {
    onSelect(template)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600
                   hover:bg-gray-100 rounded-lg transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DocumentTextIcon className="w-4 h-4" />
        <span>テンプレート</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ドロップダウン */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 bottom-full mb-2 w-80 bg-white border border-gray-200
                       rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="font-medium text-gray-900">プロンプトテンプレート</span>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded">
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* カテゴリーフィルター */}
            <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-100">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* テンプレート一覧 */}
            <div className="max-h-64 overflow-y-auto">
              {isLoadingCustom ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  テンプレートがありません
                </div>
              ) : (
                filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelect(template)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50
                               border-b border-gray-50 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {template.isCustom ? (
                        template.isShared ? (
                          <BuildingOfficeIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        )
                      ) : (
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm">{template.name}</p>
                          {template.isCustom && template.isShared && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-medium">
                              企業共有
                            </span>
                          )}
                          {template.isCustom && !template.isShared && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded font-medium">
                              個人
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
