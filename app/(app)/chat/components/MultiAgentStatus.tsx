'use client'

import type { AgentTool } from '@/lib/types/agent'

interface AgentState {
  name: string
  role: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: string
  error?: string
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

interface MultiAgentStatusProps {
  isOrchestrating: boolean
  isExecuting: boolean
  plan: OrchestrationPlan | null
  agentStates: AgentState[]
}

const toolIcons: Record<AgentTool, string> = {
  knowledge_search: '📚',
  drive_search: '☁️',
  web_search: '🌐',
  document_generate: '📝',
  api_call: '🔗',
  code_execute: '💻',
}

const complexityLabels: Record<string, { label: string; color: string }> = {
  simple: { label: 'シンプル', color: 'bg-green-100 text-green-700' },
  moderate: { label: '中程度', color: 'bg-yellow-100 text-yellow-700' },
  complex: { label: '複雑', color: 'bg-red-100 text-red-700' },
}

export function MultiAgentStatus({
  isOrchestrating,
  isExecuting,
  plan,
  agentStates,
}: MultiAgentStatusProps) {
  if (!isOrchestrating && !isExecuting && !plan) {
    return null
  }

  return (
    <div className="mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
      {/* オーケストレーション中 */}
      {isOrchestrating && (
        <div className="flex items-center gap-2 text-indigo-700">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
          <span className="text-sm font-medium">タスクを分析中...</span>
        </div>
      )}

      {/* プラン表示 */}
      {plan && !isOrchestrating && (
        <div className="space-y-2">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {plan.taskAnalysis}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${complexityLabels[plan.complexity]?.color || 'bg-gray-100'}`}>
                {complexityLabels[plan.complexity]?.label || plan.complexity}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {plan.agents.length}エージェント
            </span>
          </div>

          {/* エージェント一覧 */}
          <div className="flex flex-wrap gap-2">
            {agentStates.map((agent) => (
              <div
                key={agent.name}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
                  agent.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : agent.status === 'running'
                    ? 'bg-blue-100 text-blue-700'
                    : agent.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {/* ステータスアイコン */}
                {agent.status === 'running' && (
                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                )}
                {agent.status === 'completed' && <span>✓</span>}
                {agent.status === 'failed' && <span>✗</span>}
                {agent.status === 'pending' && <span>○</span>}

                {/* エージェント名 */}
                <span className="font-medium">{agent.name}</span>

                {/* ツールアイコン */}
                <span className="opacity-60">
                  {agent.tools.slice(0, 2).map(tool => toolIcons[tool] || '').join('')}
                </span>
              </div>
            ))}
          </div>

          {/* 実行中の詳細 */}
          {isExecuting && (
            <div className="text-xs text-indigo-600 mt-1">
              {agentStates.filter(a => a.status === 'completed').length} / {agentStates.length} 完了
            </div>
          )}
        </div>
      )}
    </div>
  )
}
