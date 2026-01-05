/**
 * バックグラウンドタスク通知コンポーネント
 *
 * 画面右下に処理中のタスクを表示
 */

'use client'

import { useEffect, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useBackgroundTaskStore, BackgroundTask } from '@/stores/backgroundTaskStore'

function TaskIcon({ type, status }: { type: BackgroundTask['type']; status: BackgroundTask['status'] }) {
  if (status === 'completed') {
    return <CheckCircleIcon className="w-5 h-5 text-green-500" />
  }
  if (status === 'error') {
    return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
  }

  switch (type) {
    case 'upload':
    case 'indexing':
      return <CloudArrowUpIcon className="w-5 h-5 text-blue-500 animate-pulse" />
    case 'ai-generation':
      return <SparklesIcon className="w-5 h-5 text-purple-500 animate-pulse" />
    default:
      return <CloudArrowUpIcon className="w-5 h-5 text-gray-500" />
  }
}

interface TaskItemProps {
  task: BackgroundTask
  onRemove: () => void
}

const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(function TaskItem({ task, onRemove }, ref) {
  // 完了したタスクは5秒後に自動削除
  useEffect(() => {
    if (task.status === 'completed' || task.status === 'error') {
      const timer = setTimeout(onRemove, 5000)
      return () => clearTimeout(timer)
    }
  }, [task.status, onRemove])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      className={`bg-white rounded-xl shadow-lg border p-4 min-w-[300px] max-w-[360px] ${
        task.status === 'error' ? 'border-red-200' :
        task.status === 'completed' ? 'border-green-200' :
        'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <TaskIcon type={task.type} status={task.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
            <button
              onClick={onRemove}
              className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{task.message}</p>

          {/* プログレスバー */}
          {(task.status === 'pending' || task.status === 'processing') && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {task.status === 'error' && task.error && (
            <p className="text-xs text-red-500 mt-1">{task.error}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
})

export function BackgroundTaskNotification() {
  const { tasks, removeTask } = useBackgroundTaskStore()

  // 最新5件のみ表示
  const visibleTasks = tasks.slice(-5)

  if (visibleTasks.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 z-[200] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {visibleTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onRemove={() => removeTask(task.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
