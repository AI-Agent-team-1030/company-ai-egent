'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  SparklesIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  XMarkIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ChartPieIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface Goal {
  id: string
  title: string
  description: string
  progress: number
  deadline: string
  owner: string
  agentCount: number
  status: 'active' | 'completed' | 'pending'
  deliverable?: string
}

interface Deliverable {
  id: string
  name: string
  description: string
  icon: any
  estimatedTime: string
  agentCount: number
}

const deliverables: Deliverable[] = [
  {
    id: 'report',
    name: '分析レポート',
    description: 'データ分析結果をまとめた詳細レポート',
    icon: DocumentTextIcon,
    estimatedTime: '2-3時間',
    agentCount: 5,
  },
  {
    id: 'proposal',
    name: '提案書',
    description: '実行可能な施策をまとめた提案書',
    icon: ClipboardDocumentListIcon,
    estimatedTime: '3-4時間',
    agentCount: 6,
  },
  {
    id: 'presentation',
    name: 'プレゼン資料',
    description: '経営層向けのプレゼンテーション資料',
    icon: PresentationChartLineIcon,
    estimatedTime: '4-5時間',
    agentCount: 7,
  },
  {
    id: 'manual',
    name: '業務マニュアル',
    description: '実行手順をまとめたマニュアル',
    icon: BookOpenIcon,
    estimatedTime: '5-6時間',
    agentCount: 6,
  },
  {
    id: 'analysis',
    name: 'データ分析結果',
    description: '数値データと可視化されたグラフ',
    icon: ChartPieIcon,
    estimatedTime: '2-3時間',
    agentCount: 4,
  },
  {
    id: 'action-plan',
    name: '実行計画書',
    description: 'タスクとスケジュールを含む実行計画',
    icon: DocumentCheckIcon,
    estimatedTime: '3-4時間',
    agentCount: 8,
  },
]

export default function GoalsPage() {
  const router = useRouter()
  const [showNewGoalModal, setShowNewGoalModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newGoalInput, setNewGoalInput] = useState('')

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1) // 1: ゴール入力, 2: 成果物選択, 3: 確認
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'EC事業で月商1000万円達成',
      description: 'EC事業を立ち上げ、6ヶ月以内に月商1000万円を達成する',
      progress: 65,
      deadline: '2024-12-31',
      owner: '営業部',
      agentCount: 6,
      status: 'active',
      deliverable: '実行計画書',
    },
    {
      id: '2',
      title: '年間100名の採用実現',
      description: '人材不足を解消し、年間100名の優秀な人材を採用する',
      progress: 45,
      deadline: '2024-11-30',
      owner: '人事部',
      agentCount: 5,
      status: 'active',
      deliverable: '提案書',
    },
    {
      id: '3',
      title: '顧客満足度95%以上達成',
      description: 'カスタマーサポート体制を強化し、顧客満足度95%以上を実現',
      progress: 80,
      deadline: '2024-10-31',
      owner: 'CS部',
      agentCount: 4,
      status: 'active',
      deliverable: 'データ分析結果',
    },
  ])

  const handleNext = () => {
    if (currentStep === 1 && newGoalInput.trim()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && selectedDeliverable) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleCreateGoal = async () => {
    if (!newGoalInput.trim() || !selectedDeliverable) return

    setIsGenerating(true)

    // シミュレーション: AIが組織を生成
    await new Promise(resolve => setTimeout(resolve, 2500))

    // ゴールを保存
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newGoalInput,
      description: `${newGoalInput}の達成に向けて`,
      progress: 0,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      owner: '全社',
      agentCount: selectedDeliverable.agentCount,
      status: 'active',
      deliverable: selectedDeliverable.name,
    }

    setGoals([newGoal, ...goals])
    setIsGenerating(false)
    setShowNewGoalModal(false)
    setNewGoalInput('')
    setSelectedDeliverable(null)
    setCurrentStep(1)

    // 新しいゴールの詳細ページに遷移
    router.push(`/goals/${newGoal.id}`)
  }

  const handleCloseModal = () => {
    setShowNewGoalModal(false)
    setNewGoalInput('')
    setSelectedDeliverable(null)
    setCurrentStep(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '進行中'
      case 'completed': return '完了'
      case 'pending': return '待機中'
      default: return '不明'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ゴール管理</h1>
          <p className="text-gray-600">ゴールを設定してAIエージェント組織を自動構築</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewGoalModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          <PlusIcon className="w-5 h-5" />
          新規ゴール設定
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">総ゴール数</span>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{goals.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">進行中</span>
            <SparklesIcon className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{goals.filter(g => g.status === 'active').length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">完了</span>
            <ChartBarIcon className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{goals.filter(g => g.status === 'completed').length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">稼働AIエージェント</span>
            <UserGroupIcon className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{goals.reduce((sum, g) => sum + g.agentCount, 0)}</p>
        </motion.div>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => router.push(`/goals/${goal.id}`)}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {goal.title}
                  </h3>
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusColor(goal.status)}`}>
                    {getStatusLabel(goal.status)}
                  </span>
                  {goal.deliverable && (
                    <span className="text-xs px-3 py-1 rounded-full border bg-purple-100 text-purple-700 border-purple-200 font-bold">
                      📄 {goal.deliverable}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{goal.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{goal.owner}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>期限: {goal.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    <span>AIエージェント: {goal.agentCount}体</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-4xl font-bold text-gray-900">{goal.progress}%</div>
                  <div className="text-sm text-gray-600">達成率</div>
                </div>
                <ArrowRightIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-black to-gray-700 h-3 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-300"
        >
          <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">ゴールを設定しましょう</h3>
          <p className="text-gray-600 mb-6">
            ゴールを設定すると、AIが最適なエージェント組織を自動構築します
          </p>
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            最初のゴールを設定
          </button>
        </motion.div>
      )}

      {/* New Goal Modal */}
      <AnimatePresence>
        {showNewGoalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">新規ゴール設定</h2>
                  <p className="text-gray-600">
                    {currentStep === 1 && '達成したいゴールを入力してください'}
                    {currentStep === 2 && '成果物のタイプを選択してください'}
                    {currentStep === 3 && 'AIエージェント組織を確認して実行'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-24 h-1 ${
                        currentStep > step ? 'bg-black' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: ゴール入力 */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <textarea
                      value={newGoalInput}
                      onChange={(e) => setNewGoalInput(e.target.value)}
                      placeholder="例: EC事業で月商1000万円を達成したい"
                      rows={4}
                      className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-black focus:outline-none resize-none text-lg"
                      autoFocus
                    />
                  </div>

                  {/* Example Goals */}
                  <div className="mb-6">
                    <p className="text-sm font-bold text-gray-900 mb-3">サンプル</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'EC事業で月商1000万円を達成したい',
                        '年間100名の採用を実現したい',
                        '顧客満足度を95%以上にしたい',
                        '業務効率を30%改善したい',
                      ].map((example, i) => (
                        <button
                          key={i}
                          onClick={() => setNewGoalInput(example)}
                          className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-700"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!newGoalInput.trim()}
                      className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      次へ
                      <ArrowRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: 成果物選択 */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <p className="text-lg font-bold text-gray-900 mb-4">どの成果物を作成しますか？</p>
                    <div className="grid grid-cols-2 gap-4">
                      {deliverables.map((deliverable) => {
                        const Icon = deliverable.icon
                        const isSelected = selectedDeliverable?.id === deliverable.id
                        return (
                          <motion.button
                            key={deliverable.id}
                            onClick={() => setSelectedDeliverable(deliverable)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 border-2 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 bg-white hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <Icon className="w-6 h-6 flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{deliverable.name}</h3>
                                <p className={`text-sm ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {deliverable.description}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                              )}
                            </div>
                            <div className={`flex items-center gap-4 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                              <span>推定時間: {deliverable.estimatedTime}</span>
                              <span>AIエージェント: {deliverable.agentCount}体</span>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold flex items-center justify-center gap-2"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                      戻る
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!selectedDeliverable}
                      className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      次へ
                      <ArrowRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: 確認画面 */}
              {currentStep === 3 && selectedDeliverable && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">設定内容の確認</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">ゴール</span>
                          <p className="font-bold text-gray-900">{newGoalInput}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">成果物</span>
                          <p className="font-bold text-gray-900">{selectedDeliverable.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">推定時間</span>
                          <p className="font-bold text-gray-900">{selectedDeliverable.estimatedTime}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">AIエージェント</span>
                          <p className="font-bold text-gray-900">{selectedDeliverable.agentCount}体が協力して実行</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <SparklesIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-bold text-blue-900 mb-2">AIエージェント組織を自動構築します</h4>
                          <p className="text-sm text-blue-700">
                            「実行開始」をクリックすると、{selectedDeliverable.agentCount}体のAIエージェントが自動的に協力して作業を開始します。
                            進捗状況はリアルタイムで確認できます。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleBack}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold flex items-center justify-center gap-2"
                      disabled={isGenerating}
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                      戻る
                    </button>
                    <button
                      onClick={handleCreateGoal}
                      disabled={isGenerating}
                      className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-3 border-white border-t-transparent rounded-full"
                          />
                          AI組織を構築中...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-5 h-5" />
                          実行開始
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
