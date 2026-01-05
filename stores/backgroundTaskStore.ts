/**
 * バックグラウンドタスク管理ストア
 *
 * ナレッジアップロードやAI生成などの長時間処理を
 * バックグラウンドで実行し、進捗を通知する
 */

import { create } from 'zustand'

export interface BackgroundTask {
  id: string
  type: 'upload' | 'ai-generation' | 'indexing'
  title: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number // 0-100
  message: string
  createdAt: Date
  completedAt?: Date
  error?: string
}

interface BackgroundTaskStore {
  tasks: BackgroundTask[]

  // アクション
  addTask: (task: Omit<BackgroundTask, 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<BackgroundTask>) => void
  removeTask: (id: string) => void
  clearCompletedTasks: () => void

  // 進行中のタスクがあるか
  hasActiveTasks: () => boolean
  getActiveTaskCount: () => number
}

export const useBackgroundTaskStore = create<BackgroundTaskStore>((set, get) => ({
  tasks: [],

  addTask: (task) => {
    set((state) => ({
      tasks: [
        ...state.tasks,
        { ...task, createdAt: new Date() }
      ]
    }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...updates,
              completedAt: updates.status === 'completed' || updates.status === 'error'
                ? new Date()
                : task.completedAt
            }
          : task
      )
    }))
  },

  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id)
    }))
  },

  clearCompletedTasks: () => {
    set((state) => ({
      tasks: state.tasks.filter(
        (task) => task.status !== 'completed' && task.status !== 'error'
      )
    }))
  },

  hasActiveTasks: () => {
    return get().tasks.some(
      (task) => task.status === 'pending' || task.status === 'processing'
    )
  },

  getActiveTaskCount: () => {
    return get().tasks.filter(
      (task) => task.status === 'pending' || task.status === 'processing'
    ).length
  },
}))
