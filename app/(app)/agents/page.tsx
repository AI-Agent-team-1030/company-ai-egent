/**
 * エージェント管理ページ
 *
 * 作成済みエージェントの一覧・編集・削除
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  BookOpenIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

// ツールアイコンマッピング
const TOOL_ICONS: Record<string, React.ElementType> = {
  knowledge_search: BookOpenIcon,
  web_search: GlobeAltIcon,
  document_generate: DocumentTextIcon,
  code_execute: CodeBracketIcon,
}

const TOOL_LABELS: Record<string, string> = {
  knowledge_search: 'ナレッジ',
  web_search: 'Web',
  document_generate: '文書',
  code_execute: 'コード',
}

interface Agent {
  id: string
  name: string
  role: string
  tools: string[]
  createdAt: Date
  usageCount: number
}

export default function AgentsPage() {
  const router = useRouter()
  const [agents] = useState<Agent[]>([])
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleCreateNew = () => {
    router.push('/agent-builder')
  }

  const handleEdit = (agentId: string) => {
    // TODO: 編集ページへ遷移
    router.push(`/agent-builder?edit=${agentId}`)
    setMenuOpenId(null)
  }

  const handleDelete = (agentId: string) => {
    setDeleteConfirmId(agentId)
    setMenuOpenId(null)
  }

  const confirmDelete = () => {
    // TODO: 実際の削除処理
    console.log('Delete agent:', deleteConfirmId)
    setDeleteConfirmId(null)
  }

  const handleRun = (agent: Agent) => {
    // エージェントを実行（AIに依頼ページへ遷移してプリセット）
    router.push(`/agent-dashboard?agent=${agent.id}`)
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">エージェント管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              作成したカスタムエージェントを管理
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            <span>新規作成</span>
          </button>
        </div>

        {/* エージェント一覧 */}
        {agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <SparklesIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              エージェントがありません
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              カスタムエージェントを作成して、タスクを自動化しましょう
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              最初のエージェントを作成
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {agent.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.role}</p>
                    </div>
                  </div>

                  {/* メニュー */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === agent.id ? null : agent.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                    </button>
                    <AnimatePresence>
                      {menuOpenId === agent.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
                        >
                          <button
                            onClick={() => handleEdit(agent.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <PencilIcon className="w-4 h-4" />
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(agent.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <TrashIcon className="w-4 h-4" />
                            削除
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ツール */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {agent.tools.map((tool) => {
                    const Icon = TOOL_ICONS[tool] || SparklesIcon
                    return (
                      <span
                        key={tool}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg"
                      >
                        <Icon className="w-3 h-3" />
                        {TOOL_LABELS[tool] || tool}
                      </span>
                    )
                  })}
                </div>

                {/* 統計 & 実行ボタン */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {agent.usageCount}回使用
                  </div>
                  <button
                    onClick={() => handleRun(agent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    実行
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                エージェントを削除しますか？
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                この操作は取り消せません。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  削除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
