'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  PlusIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { Agent, AgentExecutionResult } from '@/lib/types/agent'
import { useParallelAgentExecution } from '../hooks/useAgentExecution'

interface Props {
  agents: Agent[]
  onResultsReady?: (results: AgentExecutionResult[]) => void
}

interface SelectedTask {
  agent: Agent
  message: string
}

export function ParallelAgentPanel({ agents, onResultsReady }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([])
  const [currentMessage, setCurrentMessage] = useState('')

  const {
    isExecuting,
    tasks,
    results,
    queueStatus,
    error,
    executeParallel,
    cancelExecution,
    reset,
  } = useParallelAgentExecution()

  // エージェントを追加
  const addTask = useCallback((agent: Agent) => {
    if (!currentMessage.trim()) return

    setSelectedTasks(prev => [
      ...prev,
      { agent, message: currentMessage },
    ])
    setCurrentMessage('')
  }, [currentMessage])

  // タスクを削除
  const removeTask = useCallback((index: number) => {
    setSelectedTasks(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 実行開始
  const handleExecute = useCallback(async () => {
    if (selectedTasks.length === 0) return

    const parallelTasks = selectedTasks.map((task, index) => ({
      agentId: task.agent.id,
      message: task.message,
      priority: selectedTasks.length - index,
    }))

    const results = await executeParallel(parallelTasks)

    if (results.length > 0 && onResultsReady) {
      onResultsReady(results)
    }
  }, [selectedTasks, executeParallel, onResultsReady])

  // パネルを閉じる
  const handleClose = useCallback(() => {
    if (!isExecuting) {
      setIsOpen(false)
      setSelectedTasks([])
      reset()
    }
  }, [isExecuting, reset])

  // ステータスアイコン
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-gray-400" />
      case 'running':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <CpuChipIcon className="w-4 h-4 text-indigo-500" />
          </motion.div>
        )
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <>
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600
                   hover:bg-gray-100 rounded-lg transition-colors"
      >
        <SparklesIcon className="w-4 h-4" />
        <span>並列実行</span>
      </button>

      {/* パネル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">並列エージェント実行</h3>
                      <p className="text-sm text-gray-500">
                        複数のエージェントを同時に実行
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isExecuting}
                    className="p-1 hover:bg-white/50 rounded disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* コンテンツ */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* タスク追加フォーム */}
                {!isExecuting && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メッセージを入力してエージェントを選択
                    </label>
                    <textarea
                      value={currentMessage}
                      onChange={e => setCurrentMessage(e.target.value)}
                      placeholder="各エージェントに送信するメッセージを入力..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                 mb-3"
                    />

                    <div className="flex flex-wrap gap-2">
                      {agents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => addTask(agent)}
                          disabled={!currentMessage.trim()}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm
                                     border border-gray-200 rounded-lg
                                     hover:bg-gray-50 disabled:opacity-50
                                     disabled:cursor-not-allowed transition-colors"
                        >
                          <PlusIcon className="w-4 h-4" />
                          {agent.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 選択済みタスク */}
                {selectedTasks.length > 0 && !isExecuting && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      実行するタスク ({selectedTasks.length}件)
                    </h4>
                    <div className="space-y-2">
                      {selectedTasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <CpuChipIcon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">
                              {task.agent.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {task.message}
                            </div>
                          </div>
                          <button
                            onClick={() => removeTask(index)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <XMarkIcon className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 実行中の状態 */}
                {isExecuting && (
                  <div className="space-y-4">
                    {/* キュー状態 */}
                    <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {queueStatus.total}
                        </div>
                        <div className="text-xs text-gray-500">合計</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {queueStatus.running}
                        </div>
                        <div className="text-xs text-gray-500">実行中</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {queueStatus.pending}
                        </div>
                        <div className="text-xs text-gray-500">待機中</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {queueStatus.completed}
                        </div>
                        <div className="text-xs text-gray-500">完了</div>
                      </div>
                    </div>

                    {/* タスク一覧 */}
                    <div className="space-y-2">
                      {tasks.map(task => (
                        <div
                          key={task.taskId}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            task.status === 'completed'
                              ? 'bg-green-50'
                              : task.status === 'failed'
                                ? 'bg-red-50'
                                : task.status === 'running'
                                  ? 'bg-indigo-50'
                                  : 'bg-gray-50'
                          }`}
                        >
                          {getStatusIcon(task.status)}
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">
                              {task.agentName}
                            </div>
                            {task.currentStep && (
                              <div className="text-xs text-gray-500">
                                {task.currentStep}
                              </div>
                            )}
                          </div>
                          {task.status === 'completed' && (
                            <span className="text-xs text-green-600">完了</span>
                          )}
                          {task.status === 'failed' && (
                            <span className="text-xs text-red-600">失敗</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 結果表示 */}
                {results.length > 0 && !isExecuting && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700">
                      実行結果 ({results.length}件)
                    </h4>
                    {results.map((result, index) => (
                      <div
                        key={result.taskId || index}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {result.status === 'completed' ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-red-500" />
                          )}
                          <span className="font-medium text-gray-900">
                            {result.agentName}
                          </span>
                        </div>
                        {result.response && (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {result.response.slice(0, 500)}
                            {result.response.length > 500 && '...'}
                          </div>
                        )}
                        {result.error && (
                          <div className="text-sm text-red-600">
                            エラー: {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* エラー表示 */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
              </div>

              {/* フッター */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                {isExecuting ? (
                  <button
                    onClick={cancelExecution}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white
                               rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <StopIcon className="w-4 h-4" />
                    停止
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100
                                 rounded-lg transition-colors"
                    >
                      閉じる
                    </button>
                    {selectedTasks.length > 0 && (
                      <button
                        onClick={handleExecute}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600
                                   text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <PlayIcon className="w-4 h-4" />
                        実行 ({selectedTasks.length}件)
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
