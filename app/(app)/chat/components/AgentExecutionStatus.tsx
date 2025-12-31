'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  CloudIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  AgentExecutionStep,
  AgentTool,
  ToolExecutionResult,
} from '@/lib/types/agent'

interface Props {
  isExecuting: boolean
  currentStep?: AgentExecutionStep
  stepMessage?: string
  toolResults?: ToolExecutionResult[]
  agentName?: string
}

// ステップに対応するアイコン
const stepIcons: Record<AgentExecutionStep, React.ComponentType<{ className?: string }>> = {
  analyzing: SparklesIcon,
  knowledge_searching: MagnifyingGlassIcon,
  drive_searching: CloudIcon,
  web_searching: GlobeAltIcon,
  generating: DocumentTextIcon,
  formatting: DocumentTextIcon,
}

// ツールに対応するアイコン
const toolIcons: Record<AgentTool, React.ComponentType<{ className?: string }>> = {
  knowledge_search: MagnifyingGlassIcon,
  drive_search: CloudIcon,
  web_search: GlobeAltIcon,
  document_generate: DocumentTextIcon,
  api_call: ArrowPathIcon,
  code_execute: CpuChipIcon,
}

// ツール名の日本語表示
const toolNames: Record<AgentTool, string> = {
  knowledge_search: 'ナレッジ検索',
  drive_search: 'Drive検索',
  web_search: 'Web検索',
  document_generate: '文書生成',
  api_call: 'API呼び出し',
  code_execute: 'コード実行',
}

export function AgentExecutionStatus({
  isExecuting,
  currentStep,
  stepMessage,
  toolResults = [],
  agentName,
}: Props) {
  if (!isExecuting && toolResults.length === 0) {
    return null
  }

  const StepIcon = currentStep ? stepIcons[currentStep] : SparklesIcon

  return (
    <AnimatePresence>
      {isExecuting && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
            {/* ヘッダー */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <CpuChipIcon className="w-5 h-5 text-indigo-600" />
                </div>
                {isExecuting && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {agentName || 'AIエージェント'} が処理中...
                </div>
                <div className="text-sm text-gray-500">
                  {stepMessage || '処理を実行しています'}
                </div>
              </div>
            </div>

            {/* 現在のステップ */}
            {currentStep && (
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <StepIcon className="w-4 h-4 text-indigo-500" />
                </motion.div>
                <span className="text-sm text-indigo-600 font-medium">
                  {stepMessage}
                </span>
              </div>
            )}

            {/* ツール実行結果 */}
            {toolResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ツール実行結果
                </div>
                <div className="grid gap-2">
                  {toolResults.map((result, index) => {
                    const ToolIcon = toolIcons[result.tool]
                    const toolName = toolNames[result.tool]

                    return (
                      <div
                        key={`${result.tool}-${index}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          result.status === 'success'
                            ? 'bg-green-50 text-green-700'
                            : result.status === 'failed'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <ToolIcon className="w-4 h-4" />
                        <span className="flex-1">{toolName}</span>
                        {result.status === 'success' && (
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        )}
                        {result.status === 'failed' && (
                          <XCircleIcon className="w-4 h-4 text-red-500" />
                        )}
                        {result.status === 'skipped' && (
                          <span className="text-xs text-gray-400">スキップ</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {result.executionTimeMs}ms
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* プログレスバー */}
            <div className="mt-3">
              <div className="h-1 bg-indigo-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-500"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// コンパクト版（インライン表示用）
export function AgentExecutionStatusCompact({
  isExecuting,
  stepMessage,
  agentName,
}: Pick<Props, 'isExecuting' | 'stepMessage' | 'agentName'>) {
  if (!isExecuting) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 text-sm text-indigo-600"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <CpuChipIcon className="w-4 h-4" />
      </motion.div>
      <span>
        {agentName ? `${agentName}: ` : ''}
        {stepMessage || '処理中...'}
      </span>
    </motion.div>
  )
}
