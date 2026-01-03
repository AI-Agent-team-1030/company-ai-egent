/**
 * エージェント実行パネル
 *
 * AIエージェントの作成・実行プロセスを可視化
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { AgentTool } from '@/lib/types/agent'

interface AgentState {
  name: string
  role: string
  status: 'creating' | 'ready' | 'running' | 'completed' | 'failed'
  tools: AgentTool[]
}

interface OrchestrationPlan {
  taskAnalysis: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: Array<{
    name: string
    role: string
  }>
  synthesisPrompt: string
}

interface AgentExecutionPanelProps {
  phase: 'idle' | 'analyzing' | 'creating' | 'executing' | 'complete'
  plan: OrchestrationPlan | null
  agentStates: AgentState[]
}

const toolLabels: Record<AgentTool, string> = {
  knowledge_search: 'ナレッジ検索',
  drive_search: 'Drive検索',
  web_search: 'Web検索',
  document_generate: '文書生成',
  api_call: 'API連携',
  code_execute: 'コード実行',
}

const complexityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  simple: { label: 'シンプル', color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  moderate: { label: '中程度', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  complex: { label: '複雑', color: 'text-rose-700', bgColor: 'bg-rose-50' },
}

export function AgentExecutionPanel({
  phase,
  plan,
  agentStates,
}: AgentExecutionPanelProps) {
  if (phase === 'idle') {
    return null
  }

  return (
    <div className="px-4 md:px-6 pb-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {phase !== 'complete' && (
                  <div className="relative">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                  </div>
                )}
                {phase === 'complete' && (
                  <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-700">
                  {phase === 'analyzing' && 'タスクを分析中...'}
                  {phase === 'creating' && 'AIエージェントを作成中...'}
                  {phase === 'executing' && 'エージェント実行中'}
                  {phase === 'complete' && '完了'}
                </span>
              </div>

              {plan && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${complexityConfig[plan.complexity]?.bgColor} ${complexityConfig[plan.complexity]?.color}`}>
                  {complexityConfig[plan.complexity]?.label}
                </span>
              )}
            </div>

            {plan && (
              <span className="text-xs text-slate-500">
                {plan.agents.length} エージェント
              </span>
            )}
          </div>

          {/* タスク分析 */}
          {plan && (
            <p className="text-xs text-slate-500 mt-1.5">
              {plan.taskAnalysis}
            </p>
          )}
        </div>

        {/* エージェント一覧 */}
        <AnimatePresence mode="popLayout">
          {agentStates.length > 0 && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2">
                {agentStates.map((agent, index) => (
                  <motion.div
                    key={agent.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      agent.status === 'creating'
                        ? 'bg-indigo-50 border border-indigo-200'
                        : agent.status === 'ready'
                        ? 'bg-blue-50 border border-blue-200'
                        : agent.status === 'running'
                        ? 'bg-amber-50 border border-amber-200'
                        : agent.status === 'completed'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {/* ステータスアイコン */}
                    <div className="flex-shrink-0">
                      {agent.status === 'creating' && (
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {agent.status === 'ready' && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {agent.status === 'running' && (
                        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {agent.status === 'completed' && (
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {agent.status === 'failed' && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* エージェント情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          agent.status === 'creating' ? 'text-indigo-700' :
                          agent.status === 'ready' ? 'text-blue-700' :
                          agent.status === 'running' ? 'text-amber-700' :
                          agent.status === 'completed' ? 'text-emerald-700' :
                          'text-red-700'
                        }`}>
                          {agent.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {agent.status === 'creating' && '作成中...'}
                          {agent.status === 'ready' && '準備完了'}
                          {agent.status === 'running' && '実行中...'}
                          {agent.status === 'completed' && '完了'}
                          {agent.status === 'failed' && 'エラー'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{agent.role}</p>
                    </div>

                    {/* ツール */}
                    <div className="flex-shrink-0 flex gap-1">
                      {agent.tools.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="text-[10px] px-1.5 py-0.5 bg-white/70 text-slate-600 rounded"
                        >
                          {toolLabels[tool]}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
