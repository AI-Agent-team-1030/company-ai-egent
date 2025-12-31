'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  ChevronDownIcon,
  XMarkIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  UserIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  PresentationChartLineIcon,
  MegaphoneIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  GlobeAltIcon,
  CloudIcon,
} from '@heroicons/react/24/outline'
import {
  Agent,
  AGENT_CATEGORIES,
  AGENT_TOOLS,
} from '@/lib/types/agent'
import { getAllAgents } from '@/lib/firestore-agents'

interface Props {
  selectedAgent: Agent | null
  onSelect: (agent: Agent) => void
  disabled?: boolean
  companyId?: string
  userId?: string
}

// アイコン名からコンポーネントを取得
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  SparklesIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  PresentationChartLineIcon,
  MegaphoneIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  GlobeAltIcon,
  CloudIcon,
}

// カラー名からTailwindクラスを取得
const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-100 text-red-600',
  pink: 'bg-pink-100 text-pink-600',
  teal: 'bg-teal-100 text-teal-600',
  yellow: 'bg-yellow-100 text-yellow-600',
}

export function AgentSelector({
  selectedAgent,
  onSelect,
  disabled,
  companyId,
  userId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  // エージェント一覧を読み込み
  const loadAgents = useCallback(async () => {
    if (!companyId || !userId) return
    setIsLoading(true)
    try {
      const loadedAgents = await getAllAgents(userId, companyId)
      setAgents(loadedAgents)
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [companyId, userId])

  useEffect(() => {
    if (isOpen && companyId && userId) {
      loadAgents()
    }
  }, [isOpen, companyId, userId, loadAgents])

  // カテゴリでフィルタ
  const filteredAgents = selectedCategory === 'all'
    ? agents
    : agents.filter(a => a.category === selectedCategory)

  // エージェントを種類別に分類
  const builtInAgents = filteredAgents.filter(a => a.isBuiltIn)
  const sharedAgents = filteredAgents.filter(a => !a.isBuiltIn && a.isShared)
  const personalAgents = filteredAgents.filter(a => !a.isBuiltIn && !a.isShared)

  // 選択処理
  const handleSelect = (agent: Agent) => {
    onSelect(agent)
    setIsOpen(false)
  }

  // アイコンを取得
  const getIcon = (iconName?: string) => {
    if (!iconName) return CpuChipIcon
    return iconMap[iconName] || CpuChipIcon
  }

  // ツールバッジを表示
  const renderToolBadges = (tools: string[]) => {
    const visibleTools = tools.slice(0, 3)
    const remaining = tools.length - 3

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {visibleTools.map(tool => {
          const toolInfo = AGENT_TOOLS.find(t => t.id === tool)
          return (
            <span
              key={tool}
              className="px-1 py-0.5 text-[9px] bg-gray-100 text-gray-500 rounded"
            >
              {toolInfo?.name || tool}
            </span>
          )
        })}
        {remaining > 0 && (
          <span className="px-1 py-0.5 text-[9px] bg-gray-100 text-gray-500 rounded">
            +{remaining}
          </span>
        )}
      </div>
    )
  }

  // エージェント項目を表示
  const renderAgentItem = (agent: Agent) => {
    const IconComponent = getIcon(agent.icon)
    const colorClass = colorMap[agent.color || 'gray'] || colorMap.gray
    const isSelected = selectedAgent?.id === agent.id

    return (
      <button
        key={agent.id}
        onClick={() => handleSelect(agent)}
        className={`w-full px-3 py-2.5 text-left transition-colors rounded-lg ${
          isSelected
            ? 'bg-indigo-50 border border-indigo-200'
            : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded-lg ${colorClass} flex-shrink-0`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-gray-900 truncate">
                {agent.name}
              </span>
              {isSelected && (
                <CheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
              {agent.description}
            </p>
            {renderToolBadges(agent.tools)}
          </div>
        </div>
      </button>
    )
  }

  // セクションを表示
  const renderSection = (
    title: string,
    icon: React.ReactNode,
    agentList: Agent[]
  ) => {
    if (agentList.length === 0) return null

    return (
      <div className="mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500">
          {icon}
          {title}
        </div>
        <div className="space-y-1">
          {agentList.map(renderAgentItem)}
        </div>
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed ${
          selectedAgent
            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {selectedAgent ? (
          <>
            {(() => {
              const IconComponent = getIcon(selectedAgent.icon)
              return <IconComponent className="w-4 h-4" />
            })()}
            <span className="max-w-[120px] truncate">{selectedAgent.name}</span>
          </>
        ) : (
          <>
            <CpuChipIcon className="w-4 h-4" />
            <span>エージェント</span>
          </>
        )}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ドロップダウン */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 bottom-full mb-2 w-80 bg-white border border-gray-200
                       rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">AIエージェント</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/50 rounded"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* カテゴリーフィルター */}
            <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-100">
              {AGENT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* エージェント一覧 */}
            <div className="max-h-80 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <CpuChipIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  エージェントがありません
                </div>
              ) : (
                <>
                  {renderSection(
                    '組み込み',
                    <SparklesIcon className="w-3.5 h-3.5" />,
                    builtInAgents
                  )}
                  {renderSection(
                    '企業共有',
                    <BuildingOfficeIcon className="w-3.5 h-3.5" />,
                    sharedAgents
                  )}
                  {renderSection(
                    '個人',
                    <UserIcon className="w-3.5 h-3.5" />,
                    personalAgents
                  )}
                </>
              )}
            </div>

            {/* 選択解除ボタン */}
            {selectedAgent && (
              <div className="px-3 py-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    onSelect(null as unknown as Agent)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700
                             hover:bg-gray-50 rounded-lg transition-colors"
                >
                  エージェントを解除
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
