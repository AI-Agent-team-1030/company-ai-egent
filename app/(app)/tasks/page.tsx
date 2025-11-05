'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  PlusIcon,
} from '@heroicons/react/24/outline'
import { mockTasks } from '@/data/mockData'
import TaskModal from '@/components/TaskModal'
import { Task } from '@/types'

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tasks, setTasks] = useState(mockTasks)

  const projectGoals = [
    {
      id: '1',
      title: '新規顧客100社獲得',
      description: 'Q4までに新規顧客を100社獲得し、売上を30%向上させる',
      progress: 65,
      deadline: '2024-12-31',
      owner: '営業部',
      relatedTasks: tasks.filter(t => t.department === 'sales').length,
    },
    {
      id: '2',
      title: 'コスト20%削減',
      description: '業務効率化により運用コストを20%削減する',
      progress: 45,
      deadline: '2024-11-30',
      owner: '財務部',
      relatedTasks: tasks.filter(t => t.department === 'finance').length,
    },
    {
      id: '3',
      title: '採用5名完了',
      description: '営業職の増員として5名の採用を完了する',
      progress: 80,
      deadline: '2024-10-31',
      owner: '人事部',
      relatedTasks: tasks.filter(t => t.department === 'hr').length,
    },
  ]

  const handleSaveTask = (taskData: any) => {
    const newTask = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date(),
      progress: 0,
    }
    setTasks([...tasks, newTask])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">タスク管理</h1>
          <p className="text-gray-600">すべてのタスクを一元管理</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Task Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            <PlusIcon className="w-5 h-5" />
            新規タスク
          </motion.button>
        </div>
      </div>

      {/* Goal View */}
      <div className="space-y-6">
          {projectGoals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{goal.title}</h3>
                  <p className="text-gray-600 mb-4">{goal.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>担当: {goal.owner}</span>
                    <span>期限: {goal.deadline}</span>
                    <span>関連タスク: {goal.relatedTasks}件</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">{goal.progress}%</div>
                  <div className="text-sm text-gray-600">達成率</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-black h-4 rounded-full flex items-center justify-end pr-2"
                  >
                    {goal.progress > 10 && (
                      <span className="text-xs font-bold text-white">{goal.progress}%</span>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Related Tasks/Todos */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-bold text-gray-900 mb-3">関連Todo</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {tasks
                    .filter(t => {
                      const deptMap: Record<string, string> = {
                        '営業部': 'sales',
                        '財務部': 'finance',
                        '人事部': 'hr',
                        'マーケティング部': 'marketing',
                        '開発部': 'dev',
                        '総務部': 'admin'
                      }
                      return t.department === deptMap[goal.owner]
                    })
                    .slice(0, 4)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          className="mt-1 w-4 h-4"
                          readOnly
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              task.priority === 'high' ? 'bg-black text-white' :
                              task.priority === 'medium' ? 'bg-gray-300 text-gray-900' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                            </span>
                            <span className="text-xs text-gray-600">{task.assignedTo}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  )
}
