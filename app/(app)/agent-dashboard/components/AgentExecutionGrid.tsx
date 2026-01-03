/**
 * エージェント実行グリッドコンポーネント
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, ChevronUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import type { AgentExecution, AgentPlan } from '../types'

interface AgentExecutionGridProps {
  agents: AgentPlan[]
  agentExecutions: Map<string, AgentExecution>
  onRetry: (agentName: string) => void
}

const toolLabels: Record<string, string> = {
  knowledge_search: 'ナレッジ',
  drive_search: 'Drive',
  web_search: 'Web',
  document_generate: '文書生成',
  api_call: 'API',
  code_execute: 'コード',
}

export function AgentExecutionGrid({
  agents,
  agentExecutions,
  onRetry,
}: AgentExecutionGridProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  const toggleExpand = (agentName: string) => {
    setExpandedAgent(prev => prev === agentName ? null : agentName)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
        エージェント実行状況
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {agents.map((agent) => {
          const execution = agentExecutions.get(agent.name)
          const status = execution?.status || 'pending'
          const isExpanded = expandedAgent === agent.name

          return (
            <motion.div
              key={agent.name}
              layout
              className={`rounded-xl border overflow-hidden ${
                status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : status === 'running'
                  ? 'border-blue-200 bg-blue-50/50'
                  : status === 'failed'
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              {/* ヘッダー */}
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* ステータスアイコン */}
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        status === 'completed'
                          ? 'bg-emerald-500'
                          : status === 'running'
                          ? 'bg-blue-500'
                          : status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gray-300'
                      }`}>
                        {status === 'completed' && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {status === 'running' && (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {status === 'failed' && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {status === 'pending' && (
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 truncate">{agent.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{agent.role}</p>
                  </div>

                  {/* リトライボタン */}
                  {status === 'failed' && (
                    <button
                      onClick={() => onRetry(agent.name)}
                      className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="再実行"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* ツールバッジ */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {toolLabels[tool] || tool}
                    </span>
                  ))}
                </div>

                {/* 実行中のステップ */}
                {status === 'running' && execution?.currentStep && (
                  <div className="mt-2 text-xs text-blue-600 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse flex-shrink-0" />
                    <span className="truncate">{execution.currentStep}</span>
                  </div>
                )}

                {/* エラー表示 */}
                {status === 'failed' && execution?.error && (
                  <div className="mt-2 text-xs text-red-600 truncate">
                    {execution.error}
                  </div>
                )}

                {/* 結果プレビュー（完了時） */}
                {status === 'completed' && execution?.result && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleExpand(agent.name)}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUpIcon className="w-3.5 h-3.5" />
                          <span>閉じる</span>
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                          <span>結果を見る</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* 展開された結果 */}
              <AnimatePresence>
                {isExpanded && execution?.result && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                      <div className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {execution.result}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
