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

interface ChatMessage {
  id: string
  role: 'ai' | 'user'
  content: string
  type?: 'text' | 'deliverable-selection' | 'confirmation' | 'plan-selection'
  options?: Deliverable[] | ExecutionPlan[]
}

interface HearingData {
  goalTitle: string
  currentSituation: string
  deadline: string
  budget: string
  priority: string
  obstacles: string
  previousAttempts: string
}

interface ExecutionPlan {
  id: string
  name: string
  description: string
  duration: string
  deliverables: string[]
  agentCount: number
  successRate: number
  features: string[]
  recommended?: boolean
}

export default function GoalsPage() {
  const router = useRouter()
  const [showNewGoalModal, setShowNewGoalModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Chat-based state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState('')
  const [conversationStep, setConversationStep] = useState(0)
  const [goalTitle, setGoalTitle] = useState('')
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  // Hearing data state
  const [hearingData, setHearingData] = useState<HearingData>({
    goalTitle: '',
    currentSituation: '',
    deadline: '',
    budget: '',
    priority: '',
    obstacles: '',
    previousAttempts: '',
  })
  const [selectedPlan, setSelectedPlan] = useState<ExecutionPlan | null>(null)

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

  // Generate execution plans based on hearing data
  const generateExecutionPlans = (data: HearingData): ExecutionPlan[] => {
    const plans: ExecutionPlan[] = []

    // プランA: スピード重視
    if (data.priority === 'スピード' || data.deadline.includes('早') || data.deadline.includes('急')) {
      plans.push({
        id: 'speed',
        name: 'スピード重視プラン',
        description: '迅速な実行を最優先。早期に成果を出すことに特化',
        duration: '2-3ヶ月',
        deliverables: ['実行計画書', '週次進捗レポート'],
        agentCount: 10,
        successRate: 70,
        features: [
          '最短ルートで実行',
          '毎週の進捗確認',
          '柔軟な軌道修正',
          'クイックウィン重視'
        ],
        recommended: data.priority === 'スピード'
      })
    }

    // プランB: 確実性重視
    if (data.priority === '品質' || data.obstacles || !data.previousAttempts.includes('なし')) {
      plans.push({
        id: 'reliable',
        name: '確実性重視プラン',
        description: '綿密な調査と計画で成功確率を最大化',
        duration: '5-6ヶ月',
        deliverables: ['詳細分析レポート', '実行計画書', 'プレゼン資料', '月次レビュー'],
        agentCount: 8,
        successRate: 90,
        features: [
          '徹底的な事前調査',
          'リスク分析と対策',
          '段階的な実行',
          '品質重視のアプローチ'
        ],
        recommended: data.priority === '品質'
      })
    }

    // プランC: バランス型（常に提案）
    plans.push({
      id: 'balanced',
      name: 'バランス型プラン',
      description: 'スピードと確実性のバランスを取った実用的なアプローチ',
      duration: '3-4ヶ月',
      deliverables: ['分析レポート', '実行計画書', '隔週進捗レポート'],
      agentCount: 9,
      successRate: 80,
      features: [
        '効率的な調査と実行',
        '定期的な進捗確認',
        'リスク管理を含む',
        '柔軟な対応が可能'
      ],
      recommended: !plans.some(p => p.recommended)
    })

    // プランD: コスト重視
    if (data.budget.includes('限') || data.budget.includes('抑')) {
      plans.push({
        id: 'cost-effective',
        name: 'コスト最適化プラン',
        description: '最小限のリソースで最大の効果を目指す',
        duration: '4-5ヶ月',
        deliverables: ['実行計画書', 'データ分析結果'],
        agentCount: 6,
        successRate: 75,
        features: [
          '効率的なリソース配分',
          '優先順位の明確化',
          'コア施策に集中',
          '段階的な投資'
        ]
      })
    }

    return plans.slice(0, 3) // 最大3つのプランを返す
  }

  // Chat conversation logic
  const startConversation = () => {
    setShowNewGoalModal(true)
    setChatMessages([])
    setConversationStep(0)
    setGoalTitle('')
    setSelectedDeliverable(null)
    setSelectedPlan(null)
    setUserInput('')
    setHearingData({
      goalTitle: '',
      currentSituation: '',
      deadline: '',
      budget: '',
      priority: '',
      obstacles: '',
      previousAttempts: '',
    })

    // Start with AI's first message
    setTimeout(() => {
      addAIMessage('こんにちは！✨ まず、どのようなゴールを達成したいですか？\n\n例: 「EC事業で月商1000万円達成」「年間100名の採用実現」', 'text')
    }, 300)
  }

  const addAIMessage = (
    content: string,
    type: 'text' | 'deliverable-selection' | 'confirmation' | 'plan-selection' = 'text',
    options?: Deliverable[] | ExecutionPlan[]
  ) => {
    setIsTyping(true)
    setTimeout(() => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content,
        type,
        options,
      }
      setChatMessages(prev => [...prev, newMessage])
      setIsTyping(false)
    }, 800)
  }

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setChatMessages(prev => [...prev, newMessage])
  }

  const handleSendMessage = () => {
    if (!userInput.trim()) return

    addUserMessage(userInput)
    const input = userInput
    setUserInput('')

    // Handle conversation flow with deep hearing
    if (conversationStep === 0) {
      // Step 0: ゴールタイトル
      setHearingData(prev => ({ ...prev, goalTitle: input }))
      setGoalTitle(input)
      setConversationStep(1)

      setTimeout(() => {
        addAIMessage(
          `素晴らしいゴールですね！「${input}」の達成に向けて、いくつか質問させてください。\n\n現在の状況を教えてください。\n例: 「現在月商500万円」「採用実績は年間20名程度」`
        )
      }, 1000)
    } else if (conversationStep === 1) {
      // Step 1: 現在の状況
      setHearingData(prev => ({ ...prev, currentSituation: input }))
      setConversationStep(2)

      setTimeout(() => {
        // 状況に応じた深掘り質問
        let followUpQuestion = '期限はいつまでですか？\n例: 「3ヶ月以内」「できるだけ早く」「6ヶ月程度」'

        if (input.includes('0') || input.includes('初')) {
          followUpQuestion = 'なるほど、ゼロからのスタートなんですね！期限はいつまでですか？\n例: 「3ヶ月以内」「できるだけ早く」「6ヶ月程度」'
        } else if (input.includes('経験') || input.includes('実績')) {
          followUpQuestion = '既に実績があるのは強みですね！期限はいつまでですか？\n例: 「3ヶ月以内」「できるだけ早く」「6ヶ月程度」'
        }

        addAIMessage(followUpQuestion)
      }, 1000)
    } else if (conversationStep === 2) {
      // Step 2: 期限
      setHearingData(prev => ({ ...prev, deadline: input }))
      setConversationStep(3)

      setTimeout(() => {
        let budgetQuestion = '予算やリソースに制約はありますか？\n例: 「予算は限られている」「十分なリソースがある」「特になし」'

        if (input.includes('早') || input.includes('急') || input.includes('すぐ')) {
          budgetQuestion = '短期間での達成を目指すんですね！予算やリソースに制約はありますか？\n例: 「予算は限られている」「十分なリソースがある」「特になし」'
        }

        addAIMessage(budgetQuestion)
      }, 1000)
    } else if (conversationStep === 3) {
      // Step 3: 予算
      setHearingData(prev => ({ ...prev, budget: input }))
      setConversationStep(4)

      setTimeout(() => {
        addAIMessage(
          '最も重視することは何ですか？\n例: 「スピード重視」「品質・確実性重視」「コスト効率」'
        )
      }, 1000)
    } else if (conversationStep === 4) {
      // Step 4: 優先事項
      const priority = input.includes('スピード') ? 'スピード' :
                      input.includes('品質') || input.includes('確実') ? '品質' :
                      input.includes('コスト') ? 'コスト' : input

      setHearingData(prev => ({ ...prev, priority }))
      setConversationStep(5)

      setTimeout(() => {
        addAIMessage(
          '想定される障壁や課題はありますか？\n例: 「人材不足」「競合が多い」「ノウハウがない」「特になし」'
        )
      }, 1000)
    } else if (conversationStep === 5) {
      // Step 5: 障壁
      setHearingData(prev => ({ ...prev, obstacles: input }))
      setConversationStep(6)

      setTimeout(() => {
        let obstacleFollowUp = '過去に同様の取り組みを試したことはありますか？\n例: 「以前挑戦したが失敗した」「初めての挑戦」「部分的に試した」'

        if (input.includes('なし') || input.includes('ない')) {
          obstacleFollowUp = '順調に進められそうですね！過去に同様の取り組みを試したことはありますか？\n例: 「以前挑戦したが失敗した」「初めての挑戦」「部分的に試した」'
        } else {
          obstacleFollowUp = 'その課題も考慮に入れますね。過去に同様の取り組みを試したことはありますか？\n例: 「以前挑戦したが失敗した」「初めての挑戦」「部分的に試した」'
        }

        addAIMessage(obstacleFollowUp)
      }, 1000)
    } else if (conversationStep === 6) {
      // Step 6: 過去の試み → プラン生成
      const updatedHearingData = { ...hearingData, previousAttempts: input }
      setHearingData(updatedHearingData)
      setConversationStep(7)

      setTimeout(() => {
        addAIMessage(
          '詳しくお聞かせいただき、ありがとうございます！✨\n\nいただいた情報をもとに、最適な実行プランを作成しました。以下から選択してください：'
        )
      }, 1000)

      setTimeout(() => {
        const plans = generateExecutionPlans(updatedHearingData)
        addAIMessage('', 'plan-selection', plans)
      }, 2000)
    }
  }

  const handleSelectPlan = (plan: ExecutionPlan) => {
    setSelectedPlan(plan)
    addUserMessage(plan.name)
    setConversationStep(8)

    setTimeout(() => {
      const confirmationMessage = `${plan.name}を選択されました！✨\n\n以下の内容で実行計画を作成します：

**ゴール**
${hearingData.goalTitle}

**実行プラン**
${plan.name}

**期間**
${plan.duration}

**成果物**
${plan.deliverables.map(d => `• ${d}`).join('\n')}

**AIエージェント**
${plan.agentCount}体が協力して実行

**推定成功率**
${plan.successRate}%

**特徴**
${plan.features.map(f => `• ${f}`).join('\n')}

この内容で実行してよろしいですか？`

      addAIMessage(confirmationMessage, 'confirmation')
    }, 1000)
  }

  const handleSelectDeliverable = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable)
    addUserMessage(deliverable.name)
    setConversationStep(2)

    setTimeout(() => {
      const confirmationMessage = `承知しました！✨ 以下の内容で実行します：

**ゴール**
${goalTitle}

**成果物**
${deliverable.name}

**推定時間**
${deliverable.estimatedTime}

**AIエージェント**
${deliverable.agentCount}体が協力して実行

この内容で実行してよろしいですか？`

      addAIMessage(confirmationMessage, 'confirmation')
    }, 1000)
  }

  const handleConfirmExecution = async (confirmed: boolean) => {
    if (!confirmed) {
      // Reset conversation
      setChatMessages([])
      setConversationStep(0)
      setGoalTitle('')
      setSelectedDeliverable(null)
      setSelectedPlan(null)
      setHearingData({
        goalTitle: '',
        currentSituation: '',
        deadline: '',
        budget: '',
        priority: '',
        obstacles: '',
        previousAttempts: '',
      })
      setTimeout(() => {
        addAIMessage('承知しました。もう一度お聞きします。どのようなゴールを達成したいですか？\n\n例: 「EC事業で月商1000万円達成」「年間100名の採用実現」', 'text')
      }, 300)
      return
    }

    // Execute
    if (!goalTitle.trim() || (!selectedDeliverable && !selectedPlan)) return

    addUserMessage('はい')
    setIsGenerating(true)

    setTimeout(() => {
      addAIMessage('🚀 AIエージェント組織を構築中です...', 'text')
    }, 500)

    // シミュレーション: AIが組織を生成
    await new Promise(resolve => setTimeout(resolve, 2000))

    // ゴールを保存
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goalTitle,
      description: `${goalTitle}の達成に向けて`,
      progress: 0,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      owner: '全社',
      agentCount: selectedPlan?.agentCount || selectedDeliverable?.agentCount || 8,
      status: 'active',
      deliverable: selectedPlan?.deliverables[0] || selectedDeliverable?.name || '実行計画書',
    }

    setGoals([newGoal, ...goals])
    setIsGenerating(false)
    setShowNewGoalModal(false)

    // 新しいゴールの詳細ページに遷移
    router.push(`/goals/${newGoal.id}`)
  }

  const handleCloseModal = () => {
    setShowNewGoalModal(false)
    setChatMessages([])
    setConversationStep(0)
    setGoalTitle('')
    setSelectedDeliverable(null)
    setSelectedPlan(null)
    setUserInput('')
    setHearingData({
      goalTitle: '',
      currentSituation: '',
      deadline: '',
      budget: '',
      priority: '',
      obstacles: '',
      previousAttempts: '',
    })
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
          onClick={startConversation}
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
            onClick={startConversation}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            最初のゴールを設定
          </button>
        </motion.div>
      )}

      {/* Chat Modal */}
      <AnimatePresence>
        {showNewGoalModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">新規ゴール設定</h2>
                  <p className="text-sm text-gray-600">AIアシスタントがゴール設定をサポートします</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {chatMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {/* AI Message */}
                      {message.role === 'ai' && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <SparklesIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                              <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
                            </div>

                            {/* Deliverable Selection Options */}
                            {message.type === 'deliverable-selection' && message.options && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {(message.options as Deliverable[]).map((deliverable) => {
                                  const Icon = deliverable.icon
                                  return (
                                    <motion.button
                                      key={deliverable.id}
                                      onClick={() => handleSelectDeliverable(deliverable)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      className="p-3 border-2 border-gray-200 bg-white hover:border-black rounded-xl text-left transition-all group"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <Icon className="w-5 h-5 text-gray-700 group-hover:text-black" />
                                        <h4 className="font-bold text-sm text-gray-900">{deliverable.name}</h4>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">{deliverable.description}</p>
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{deliverable.estimatedTime}</span>
                                        <span>•</span>
                                        <span>{deliverable.agentCount}体</span>
                                      </div>
                                    </motion.button>
                                  )
                                })}
                              </div>
                            )}

                            {/* Plan Selection Options */}
                            {message.type === 'plan-selection' && message.options && (
                              <div className="mt-3 space-y-3">
                                {(message.options as ExecutionPlan[]).map((plan) => (
                                  <motion.button
                                    key={plan.id}
                                    onClick={() => handleSelectPlan(plan)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`w-full p-4 border-2 ${plan.recommended ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'} hover:border-black rounded-xl text-left transition-all relative`}
                                  >
                                    {plan.recommended && (
                                      <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                                        おすすめ
                                      </div>
                                    )}
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <h4 className="font-bold text-lg text-gray-900 mb-1">{plan.name}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="text-2xl font-bold text-gray-900">{plan.successRate}%</div>
                                        <div className="text-xs text-gray-600">成功率</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                      <div className="flex items-center gap-2 text-sm">
                                        <CalendarIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-700">{plan.duration}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm">
                                        <UserGroupIcon className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-700">{plan.agentCount}体のAI</span>
                                      </div>
                                    </div>
                                    <div className="mb-2">
                                      <div className="text-xs text-gray-600 mb-1 font-bold">成果物:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {plan.deliverables.map((d, i) => (
                                          <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                            {d}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-600 mb-1 font-bold">特徴:</div>
                                      <ul className="text-xs text-gray-700 space-y-1">
                                        {plan.features.slice(0, 2).map((f, i) => (
                                          <li key={i}>• {f}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                            )}

                            {/* Confirmation Buttons */}
                            {message.type === 'confirmation' && (
                              <div className="mt-3 flex gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleConfirmExecution(true)}
                                  disabled={isGenerating}
                                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {isGenerating ? (
                                    <>
                                      <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                      />
                                      実行中...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircleIcon className="w-5 h-5" />
                                      はい、実行します
                                    </>
                                  )}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleConfirmExecution(false)}
                                  disabled={isGenerating}
                                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold disabled:opacity-50"
                                >
                                  修正する
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* User Message */}
                      {message.role === 'user' && (
                        <div className="flex items-start gap-3 justify-end">
                          <div className="bg-black text-white rounded-2xl rounded-tr-none px-4 py-3">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                            <UserGroupIcon className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              {conversationStep < 7 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="メッセージを入力..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                      disabled={isTyping}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || isTyping}
                      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      送信
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
