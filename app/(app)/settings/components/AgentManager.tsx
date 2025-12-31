'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  UserIcon,
  CheckCircleIcon,
  CpuChipIcon,
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
import { motion, AnimatePresence } from 'framer-motion'
import {
  Agent,
  AgentInput,
  AgentTool,
  AgentModel,
  AGENT_CATEGORIES,
  AGENT_TOOLS,
  AGENT_MODELS,
} from '@/lib/types/agent'
import {
  getAllAgents,
  createAgent,
  updateAgent,
  deleteAgent,
} from '@/lib/firestore-agents'
import { AgentEditor } from './AgentEditor'

interface Props {
  companyId: string
  userId: string
  userName?: string
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

export function AgentManager({ companyId, userId, userName }: Props) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
    loadAgents()
  }, [loadAgents])

  // カテゴリでフィルタ
  const filteredAgents = selectedCategory === 'all'
    ? agents
    : agents.filter(a => a.category === selectedCategory)

  // エージェントを種類別に分類
  const builtInAgents = filteredAgents.filter(a => a.isBuiltIn)
  const sharedAgents = filteredAgents.filter(a => !a.isBuiltIn && a.isShared)
  const personalAgents = filteredAgents.filter(a => !a.isBuiltIn && !a.isShared)

  // 新規作成を開く
  const handleNew = () => {
    setEditingAgent(null)
    setIsEditorOpen(true)
  }

  // 編集を開く
  const handleEdit = (agent: Agent) => {
    if (agent.isBuiltIn) return // 組み込みは編集不可
    setEditingAgent(agent)
    setIsEditorOpen(true)
  }

  // 保存
  const handleSave = async (input: AgentInput) => {
    setIsSaving(true)
    try {
      if (editingAgent) {
        // 更新
        const success = await updateAgent(
          userId,
          companyId,
          editingAgent.id,
          input,
          editingAgent.isShared
        )
        if (!success) throw new Error('Failed to update')
      } else {
        // 新規作成
        const id = await createAgent(userId, companyId, input, userName)
        if (!id) throw new Error('Failed to create')
      }

      setIsEditorOpen(false)
      setEditingAgent(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      await loadAgents()
    } catch (error) {
      console.error('Failed to save agent:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // 削除
  const handleDelete = async (agent: Agent) => {
    if (agent.isBuiltIn) return
    try {
      const success = await deleteAgent(userId, companyId, agent.id, agent.isShared)
      if (!success) throw new Error('Failed to delete')
      setDeleteConfirm(null)
      await loadAgents()
    } catch (error) {
      console.error('Failed to delete agent:', error)
      alert('削除に失敗しました')
    }
  }

  // アイコンを取得
  const getIcon = (iconName?: string) => {
    if (!iconName) return CpuChipIcon
    return iconMap[iconName] || CpuChipIcon
  }

  // ツールバッジを表示
  const renderToolBadges = (tools: AgentTool[]) => {
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {tools.map(tool => {
          const toolInfo = AGENT_TOOLS.find(t => t.id === tool)
          return (
            <span
              key={tool}
              className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
            >
              {toolInfo?.name || tool}
            </span>
          )
        })}
      </div>
    )
  }

  // エージェントカードを表示
  const renderAgentCard = (agent: Agent) => {
    const IconComponent = getIcon(agent.icon)
    const colorClass = colorMap[agent.color || 'gray'] || colorMap.gray

    return (
      <div
        key={agent.id}
        className={`p-4 border rounded-lg ${
          agent.isBuiltIn ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-gray-300'
        } transition-colors`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-gray-900">{agent.name}</h4>
              {agent.isBuiltIn && (
                <span className="px-1.5 py-0.5 text-[10px] bg-gray-200 text-gray-700 rounded font-medium">
                  組み込み
                </span>
              )}
              {!agent.isBuiltIn && agent.isShared && (
                <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-medium">
                  企業共有
                </span>
              )}
              {!agent.isBuiltIn && !agent.isShared && (
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded font-medium">
                  個人
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{agent.description}</p>
            {renderToolBadges(agent.tools)}
            {agent.createdByName && (
              <p className="text-xs text-gray-400 mt-2">
                作成者: {agent.createdByName}
              </p>
            )}
          </div>
          {!agent.isBuiltIn && (
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(agent)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="編集"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteConfirm(agent.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="削除"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 削除確認 */}
        {deleteConfirm === agent.id && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-2">
              「{agent.name}」を削除しますか？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(agent)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                削除
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CpuChipIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AIエージェント管理</h3>
              <p className="text-sm text-gray-500">
                特化型エージェントを作成・管理
              </p>
            </div>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                       hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            新規作成
          </button>
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="px-6 py-3 border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-2">
          {AGENT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 保存成功メッセージ */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">保存しました</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* エージェント一覧 */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CpuChipIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>エージェントがありません</p>
            <button
              onClick={handleNew}
              className="mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              + 新しいエージェントを作成
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 組み込みエージェント */}
            {builtInAgents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  組み込みエージェント
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {builtInAgents.map(renderAgentCard)}
                </div>
              </div>
            )}

            {/* 企業共有エージェント */}
            {sharedAgents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  企業共有エージェント
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {sharedAgents.map(renderAgentCard)}
                </div>
              </div>
            )}

            {/* 個人エージェント */}
            {personalAgents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  個人エージェント
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {personalAgents.map(renderAgentCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* エディターモーダル */}
      <AnimatePresence>
        {isEditorOpen && (
          <AgentEditor
            agent={editingAgent}
            onSave={handleSave}
            onCancel={() => {
              setIsEditorOpen(false)
              setEditingAgent(null)
            }}
            isSaving={isSaving}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
