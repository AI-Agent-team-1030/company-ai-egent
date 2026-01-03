/**
 * サブタスク一覧コンポーネント
 */

'use client'

import type { AgentExecution, AgentPlan } from '../types'

interface SubtaskListProps {
  agents: AgentPlan[]
  agentExecutions: Map<string, AgentExecution>
}

export function SubtaskList({ agents, agentExecutions }: SubtaskListProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
        サブタスク ({agents.length})
      </h2>
      <div className="space-y-2">
        {agents.map((agent, index) => {
          const execution = agentExecutions.get(agent.name)
          const status = execution?.status || 'pending'

          return (
            <div
              key={agent.name}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                status === 'completed'
                  ? 'bg-emerald-50 border-emerald-200'
                  : status === 'running'
                  ? 'bg-blue-50 border-blue-200'
                  : status === 'failed'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* 番号 */}
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                status === 'completed'
                  ? 'bg-emerald-500 text-white'
                  : status === 'running'
                  ? 'bg-blue-500 text-white'
                  : status === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {status === 'completed' ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : status === 'running' ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : status === 'failed' ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{agent.name}</div>
                <div className="text-xs text-gray-500 truncate">{agent.role}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
