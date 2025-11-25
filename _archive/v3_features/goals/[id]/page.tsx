'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  SparklesIcon,
  ClockIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ChartPieIcon,
  DocumentCheckIcon,
  TableCellsIcon,
  BoltIcon,
  LightBulbIcon,
  BeakerIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import { useRouter, useParams } from 'next/navigation'

interface TaskWithAI {
  id: string
  task: string
  aiAgent: string
  aiAgentId: string
  status: 'completed' | 'in_progress' | 'pending'
  level: number
  estimatedTime: number // in seconds
  deliverable: string // 成果物
  deliverableIcon: any // 成果物アイコン
  agents: string[] // 使用する複数のAIエージェント
  knowledge: string[] // 参照するナレッジ
  todos: string[] // タスク内のToDo項目
}

interface Goal {
  id: string
  title: string
  description: string
  progress: number
  deadline: string
  owner: string
  status: 'active' | 'completed' | 'pending'
  deliverable: string
}

interface NextStepSuggestion {
  id: string
  title: string
  description: string
  icon: any
  category: 'analysis' | 'strategy' | 'execution' | 'reporting'
  estimatedTime: string
  priority: 'high' | 'medium' | 'low'
}

// Generate next step suggestions based on completed goal
const generateNextStepSuggestions = (goal: Goal): NextStepSuggestion[] => {
  const suggestions: NextStepSuggestion[] = []

  // Based on goal title
  if (goal.title.includes('EC') || goal.title.includes('売上')) {
    suggestions.push(
      {
        id: 'scale-marketing',
        title: 'マーケティング施策をスケールする',
        description: '成功した施策を拡大し、広告予算を2倍に増やして売上を加速',
        icon: RocketLaunchIcon,
        category: 'execution',
        estimatedTime: '2-3週間',
        priority: 'high'
      },
      {
        id: 'new-channel',
        title: '新しい販売チャネルを開拓する',
        description: 'Amazon、楽天などのモール出店や卸売チャネルの開拓',
        icon: SparklesIcon,
        category: 'strategy',
        estimatedTime: '1-2ヶ月',
        priority: 'high'
      },
      {
        id: 'customer-retention',
        title: '既存顧客のリテンション強化',
        description: 'CRMを活用したリピート率向上とLTV最大化施策',
        icon: UserGroupIcon,
        category: 'execution',
        estimatedTime: '2-4週間',
        priority: 'medium'
      }
    )
  }

  if (goal.title.includes('採用')) {
    suggestions.push(
      {
        id: 'onboarding',
        title: 'オンボーディングプログラムを構築',
        description: '新入社員の定着率を高める研修プログラムの設計',
        icon: BookOpenIcon,
        category: 'execution',
        estimatedTime: '2-3週間',
        priority: 'high'
      },
      {
        id: 'employer-brand',
        title: '採用ブランディングを強化',
        description: '会社の魅力を発信し、応募数を増やす施策',
        icon: LightBulbIcon,
        category: 'strategy',
        estimatedTime: '1ヶ月',
        priority: 'medium'
      }
    )
  }

  // Always add these suggestions
  suggestions.push(
    {
      id: 'next-goal',
      title: '次のゴールを設定する',
      description: '達成した勢いを活かして、次の大きな目標に挑戦',
      icon: ChartBarIcon,
      category: 'strategy',
      estimatedTime: '即座',
      priority: 'high'
    },
    {
      id: 'report',
      title: '経営層への報告資料を作成',
      description: '成果と学びをまとめたプレゼンテーション資料を生成',
      icon: PresentationChartLineIcon,
      category: 'reporting',
      estimatedTime: '1-2日',
      priority: 'medium'
    },
    {
      id: 'retrospective',
      title: 'プロジェクトの振り返りを実施',
      description: '成功要因と改善点を分析し、次回に活かす',
      icon: DocumentTextIcon,
      category: 'analysis',
      estimatedTime: '半日',
      priority: 'low'
    }
  )

  // Return top 4 suggestions sorted by priority
  return suggestions
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 4)
}

export default function GoalDetailPage() {
  const router = useRouter()
  const params = useParams()
  const goalId = params.id as string

  const [goal, setGoal] = useState<Goal | null>(null)
  const [tasks, setTasks] = useState<TaskWithAI[]>([])
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [completedTasks, setCompletedTasks] = useState<TaskWithAI[]>([])
  const [currentTodoIndex, setCurrentTodoIndex] = useState(0)
  const [nextSteps, setNextSteps] = useState<NextStepSuggestion[]>([])

  useEffect(() => {
    // Mock data
    const mockGoal: Goal = {
      id: goalId,
      title: 'EC事業で月商1000万円達成',
      description: 'EC事業を立ち上げ、6ヶ月以内に月商1000万円を達成する',
      progress: 0,
      deadline: '2024-12-31',
      owner: '営業部',
      status: 'active',
      deliverable: '実行計画書',
    }

    // 階層的なタスク構造
    const mockTasks: TaskWithAI[] = [
      // Level 1: 戦略
      {
        id: 't1',
        task: '市場調査を実行',
        aiAgent: '市場調査AI',
        aiAgentId: 'marketing-research',
        status: 'pending',
        level: 1,
        estimatedTime: 16,
        deliverable: '市場調査レポート',
        deliverableIcon: ChartPieIcon,
        agents: ['市場調査AI', '競合分析AI', 'トレンド分析AI'],
        knowledge: ['EC市場の最新トレンド', '競合他社の戦略分析', '顧客行動データ'],
        todos: ['市場規模を調査', '競合5社を分析', 'SWOT分析を実施', 'トレンドレポート作成']
      },
      {
        id: 't2',
        task: 'ターゲット顧客を分析',
        aiAgent: 'ペルソナ分析AI',
        aiAgentId: 'marketing-persona',
        status: 'pending',
        level: 1,
        estimatedTime: 16,
        deliverable: 'ペルソナ設計書',
        deliverableIcon: UserGroupIcon,
        agents: ['ペルソナ分析AI', '行動分析AI', 'セグメント分析AI'],
        knowledge: ['顧客セグメンテーション手法', 'ペルソナ設計のベストプラクティス', 'EC購買行動パターン'],
        todos: ['年齢・性別の傾向分析', '購買動機を特定', 'ペルソナ3パターン作成', 'カスタマージャーニー設計']
      },
      {
        id: 't3',
        task: '事業計画を策定',
        aiAgent: '予算策定AI',
        aiAgentId: 'finance-budget',
        status: 'pending',
        level: 1,
        estimatedTime: 16,
        deliverable: '事業計画書',
        deliverableIcon: DocumentTextIcon,
        agents: ['予算策定AI', '収益予測AI', 'リスク分析AI'],
        knowledge: ['事業計画の作成手順', '収益予測モデル', 'EC事業の原価構造'],
        todos: ['売上目標を設定', 'コスト構造を分析', '損益分岐点を算出', '資金計画を立案']
      },

      // Level 2: 実行計画
      {
        id: 't4',
        task: 'コンテンツ戦略を立案',
        aiAgent: 'コンテンツ企画AI',
        aiAgentId: 'marketing-content',
        status: 'pending',
        level: 2,
        estimatedTime: 12,
        deliverable: 'コンテンツ戦略書',
        deliverableIcon: BookOpenIcon,
        agents: ['コンテンツ企画AI', 'SEO分析AI'],
        knowledge: ['コンテンツマーケティングの効果測定', 'SEO最適化手法'],
        todos: ['記事テーマ30本リスト化', 'SNS投稿カレンダー作成', 'キーワード選定']
      },
      {
        id: 't5',
        task: '広告文を作成',
        aiAgent: 'コピーライティングAI',
        aiAgentId: 'marketing-copywriting',
        status: 'pending',
        level: 2,
        estimatedTime: 12,
        deliverable: '広告クリエイティブ集',
        deliverableIcon: LightBulbIcon,
        agents: ['コピーライティングAI', '広告最適化AI'],
        knowledge: ['広告コピーのベストプラクティス', 'A/Bテスト手法'],
        todos: ['Google広告20パターン作成', 'SNS広告10パターン作成', 'CTR予測']
      },
      {
        id: 't6',
        task: 'リード調査を開始',
        aiAgent: 'リード調査AI',
        aiAgentId: 'sales-lead-research',
        status: 'pending',
        level: 2,
        estimatedTime: 12,
        deliverable: 'リード候補リスト',
        deliverableIcon: TableCellsIcon,
        agents: ['リード調査AI', '企業情報収集AI', 'スコアリングAI'],
        knowledge: ['リード獲得の方法', '企業データベースの活用法'],
        todos: ['ターゲット企業500社抽出', '意思決定者を特定', 'スコアリング実施']
      },
      {
        id: 't7',
        task: 'ターゲットリストを作成',
        aiAgent: 'リスト作成AI',
        aiAgentId: 'sales-lead-list',
        status: 'pending',
        level: 2,
        estimatedTime: 12,
        deliverable: 'アプローチリスト',
        deliverableIcon: ClipboardDocumentListIcon,
        agents: ['リスト作成AI', 'データ検証AI'],
        knowledge: ['ターゲットリスト作成のポイント'],
        todos: ['優先順位付け', '連絡先情報検証', 'アプローチ方法決定']
      },

      // Level 3: 営業・マーケティング
      {
        id: 't8',
        task: 'SEO最適化を実施',
        aiAgent: 'SEO最適化AI',
        aiAgentId: 'marketing-seo',
        status: 'pending',
        level: 3,
        estimatedTime: 12,
        deliverable: 'SEO改善レポート',
        deliverableIcon: ChartBarIcon,
        agents: ['SEO最適化AI', 'キーワード分析AI', 'テクニカルSEO AI'],
        knowledge: ['SEO対策の基本', 'Googleアルゴリズム最新情報'],
        todos: ['キーワード調査100件', 'メタタグ最適化', 'サイトマップ作成', '被リンク戦略立案']
      },
      {
        id: 't9',
        task: 'Web広告を運用',
        aiAgent: '広告運用AI',
        aiAgentId: 'marketing-ad-management',
        status: 'pending',
        level: 3,
        estimatedTime: 12,
        deliverable: '広告運用レポート',
        deliverableIcon: RocketLaunchIcon,
        agents: ['広告運用AI', '入札最適化AI', '効果測定AI'],
        knowledge: ['Web広告運用のベストプラクティス', 'ROI最大化手法'],
        todos: ['キャンペーン5本設定', '予算配分決定', 'A/Bテスト設計', 'コンバージョン測定設定']
      },
      {
        id: 't10',
        task: 'アウトバウンド営業を実行',
        aiAgent: 'アウトバウンドAI',
        aiAgentId: 'sales-outbound',
        status: 'pending',
        level: 3,
        estimatedTime: 12,
        deliverable: '営業活動報告書',
        deliverableIcon: BoltIcon,
        agents: ['アウトバウンドAI', 'メール送信AI', 'フォローアップAI'],
        knowledge: ['アウトバウンド営業のコツ', 'メールテンプレート集'],
        todos: ['メール200通送信', 'フォローアップ50件', '商談化率測定']
      },
      {
        id: 't11',
        task: '提案資料を作成',
        aiAgent: '提案資料作成AI',
        aiAgentId: 'sales-proposal',
        status: 'pending',
        level: 3,
        estimatedTime: 12,
        deliverable: '提案資料パック',
        deliverableIcon: PresentationChartLineIcon,
        agents: ['提案資料作成AI', 'デザインAI', 'データ可視化AI'],
        knowledge: ['提案資料の構成', 'プレゼンテーション技法'],
        todos: ['スライド30枚作成', 'ケーススタディ3件追加', 'ROI試算表作成']
      },

      // Level 4: 商品・物流
      {
        id: 't12',
        task: '仕入先を選定',
        aiAgent: 'ベンダー管理AI',
        aiAgentId: 'procurement-vendor',
        status: 'pending',
        level: 4,
        estimatedTime: 12,
        deliverable: 'ベンダー評価表',
        deliverableIcon: DocumentCheckIcon,
        agents: ['ベンダー管理AI', '品質評価AI'],
        knowledge: ['仕入先選定の基準', 'ベンダー管理のポイント'],
        todos: ['候補20社リスト化', '評価基準設定', 'サンプル取り寄せ']
      },
      {
        id: 't13',
        task: '見積を比較',
        aiAgent: '見積比較AI',
        aiAgentId: 'procurement-comparison',
        status: 'pending',
        level: 4,
        estimatedTime: 12,
        deliverable: '見積比較表',
        deliverableIcon: TableCellsIcon,
        agents: ['見積比較AI', 'コスト分析AI'],
        knowledge: ['見積比較のポイント', '交渉テクニック'],
        todos: ['見積取得10社', '条件比較', '値引き交渉']
      },
      {
        id: 't14',
        task: '在庫を予測',
        aiAgent: '在庫予測AI',
        aiAgentId: 'logistics-inventory-forecast',
        status: 'pending',
        level: 4,
        estimatedTime: 12,
        deliverable: '在庫計画書',
        deliverableIcon: ChartBarIcon,
        agents: ['在庫予測AI', '需要予測AI'],
        knowledge: ['在庫管理の基本', '需要予測モデル'],
        todos: ['3ヶ月先の需要予測', '安全在庫算出', '発注計画作成']
      },

      // Level 5: カスタマーサポート
      {
        id: 't15',
        task: 'チャットボットを設定',
        aiAgent: 'チャットボットAI',
        aiAgentId: 'support-chatbot',
        status: 'pending',
        level: 5,
        estimatedTime: 12,
        deliverable: 'チャットボット設定書',
        deliverableIcon: BeakerIcon,
        agents: ['チャットボットAI', 'FAQ作成AI'],
        knowledge: ['チャットボット設計のベストプラクティス', 'よくある質問集'],
        todos: ['FAQ50件作成', 'シナリオ設計', 'テスト実施']
      },
      {
        id: 't16',
        task: '顧客満足度を調査',
        aiAgent: '満足度調査AI',
        aiAgentId: 'support-satisfaction',
        status: 'pending',
        level: 5,
        estimatedTime: 12,
        deliverable: '顧客満足度レポート',
        deliverableIcon: ChartPieIcon,
        agents: ['満足度調査AI', 'アンケート分析AI'],
        knowledge: ['顧客満足度調査の方法', 'NPS測定手法'],
        todos: ['アンケート設計', '100名に配信', '結果分析']
      },

      // Level 6: データ分析
      {
        id: 't17',
        task: 'データを収集',
        aiAgent: 'データ収集AI',
        aiAgentId: 'data-collection',
        status: 'pending',
        level: 6,
        estimatedTime: 12,
        deliverable: 'データセット',
        deliverableIcon: TableCellsIcon,
        agents: ['データ収集AI', 'クレンジングAI'],
        knowledge: ['データ収集の方法', 'データクレンジング手法'],
        todos: ['GA4データ抽出', '広告データ統合', 'クレンジング実施']
      },
      {
        id: 't18',
        task: 'データを分析',
        aiAgent: 'データ分析AI',
        aiAgentId: 'data-analysis',
        status: 'pending',
        level: 6,
        estimatedTime: 12,
        deliverable: '分析レポート',
        deliverableIcon: ChartBarIcon,
        agents: ['データ分析AI', '統計分析AI', '機械学習AI'],
        knowledge: ['データ分析手法', '統計分析の基礎'],
        todos: ['相関分析', 'トレンド分析', '予測モデル構築']
      },
      {
        id: 't19',
        task: 'レポートを生成',
        aiAgent: 'レポート生成AI',
        aiAgentId: 'data-report',
        status: 'pending',
        level: 6,
        estimatedTime: 12,
        deliverable: 'ダッシュボード',
        deliverableIcon: PresentationChartLineIcon,
        agents: ['レポート生成AI', 'データ可視化AI'],
        knowledge: ['レポート作成のポイント', 'ダッシュボード設計'],
        todos: ['KPI設定', 'グラフ20種作成', 'サマリー作成']
      },

      // Level 7: 最終成果物
      {
        id: 't20',
        task: '実行計画書を作成',
        aiAgent: 'プロジェクト管理AI',
        aiAgentId: 'project-planning',
        status: 'pending',
        level: 7,
        estimatedTime: 20,
        deliverable: '実行計画書',
        deliverableIcon: DocumentTextIcon,
        agents: ['プロジェクト管理AI', '統合レポート作成AI', '最終確認AI'],
        knowledge: ['実行計画書の作成手順', 'プロジェクト管理のベストプラクティス'],
        todos: ['全成果物を統合', '実行スケジュール作成', 'リスク管理表作成', '最終レビュー']
      },
    ]

    setGoal(mockGoal)
    setTasks(mockTasks)
  }, [goalId])

  // Auto-progress simulation
  useEffect(() => {
    if (tasks.length === 0) return
    if (currentTaskIndex >= tasks.length) return // All tasks completed

    const currentTask = tasks[currentTaskIndex]

    // Update task status to in_progress
    if (currentTask.status === 'pending') {
      setTasks(prev => prev.map((t, i) =>
        i === currentTaskIndex ? { ...t, status: 'in_progress' as const } : t
      ))
      setCurrentTodoIndex(0) // Reset todo index for new task
    }

    // Simulate task completion
    const timer = setInterval(() => {
      setElapsedTime(prev => {
        const newElapsed = prev + 1

        // Update current todo index based on progress
        const todoCount = currentTask.todos.length
        const timePerTodo = currentTask.estimatedTime / todoCount
        const newTodoIndex = Math.min(
          Math.floor(newElapsed / timePerTodo),
          todoCount - 1
        )
        setCurrentTodoIndex(newTodoIndex)

        // If task is complete
        if (newElapsed >= currentTask.estimatedTime) {
          // Mark as completed
          setTasks(prev => prev.map((t, i) =>
            i === currentTaskIndex ? { ...t, status: 'completed' as const } : t
          ))
          setCompletedTasks(prev => [...prev, { ...currentTask, status: 'completed' }])

          // Check if this is the last task
          const isLastTask = currentTaskIndex === tasks.length - 1

          if (!isLastTask) {
            // Move to next task
            setTimeout(() => {
              setCurrentTaskIndex(prev => prev + 1)
              setElapsedTime(0)
              setCurrentTodoIndex(0)
            }, 500)
          } else {
            // Last task completed - ensure progress shows 100%
            setTimeout(() => {
              setCurrentTaskIndex(prev => prev + 1) // This will trigger completion state
              setElapsedTime(0)
            }, 800) // Give a bit more time to show completion
          }

          clearInterval(timer)
          return currentTask.estimatedTime // Set to max to show 100%
        }

        return newElapsed
      })
    }, 500) // Faster simulation: 500ms = 1 second

    return () => clearInterval(timer)
  }, [tasks, currentTaskIndex])

  // Calculate progress
  const totalTasks = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const currentTask = currentTaskIndex < tasks.length ? tasks[currentTaskIndex] : null

  // Include current task's partial progress in overall progress
  const currentTaskProgress = currentTask ? (elapsedTime / currentTask.estimatedTime) : 0
  const progress = totalTasks > 0
    ? Math.round(((completed + currentTaskProgress) / totalTasks) * 100)
    : 0

  // Calculate estimated time remaining
  const remainingTasks = tasks.slice(currentTaskIndex + 1)
  const totalRemainingTime = remainingTasks.reduce((sum, t) => sum + t.estimatedTime, 0)
  const currentTaskRemainingTime = currentTaskIndex < tasks.length
    ? tasks[currentTaskIndex].estimatedTime - elapsedTime
    : 0
  const estimatedTimeRemaining = Math.round(totalRemainingTime + currentTaskRemainingTime) // in seconds

  const currentProgress = currentTask ? (elapsedTime / currentTask.estimatedTime) * 100 : 0
  const isCompleted = completed === totalTasks

  // Generate next steps when all tasks are completed
  useEffect(() => {
    console.log('useEffect triggered:', { isCompleted, goalExists: !!goal, nextStepsLength: nextSteps.length })
    if (isCompleted && goal && nextSteps.length === 0) {
      console.log('Generating next steps suggestions...')
      const suggestions = generateNextStepSuggestions(goal)
      console.log('Generated suggestions:', suggestions)
      setNextSteps(suggestions)
    }
  }, [isCompleted, goal])

  const handleNextStepClick = (suggestion: NextStepSuggestion) => {
    if (suggestion.id === 'next-goal') {
      router.push('/goals')
    } else if (suggestion.id === 'report' || suggestion.id === 'retrospective') {
      // Navigate to documents or create new document
      alert(`${suggestion.title}を開始します`)
    } else {
      alert(`${suggestion.title}を開始します`)
    }
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Fullscreen Completion Celebration */}
      <AnimatePresence>
        {isCompleted && progress === 100 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            {/* Animated Background Circles */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 1.5], opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute w-96 h-96 bg-green-500 rounded-full"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.8, 1.2], opacity: [0, 0.4, 0] }}
              transition={{ duration: 1.3, ease: "easeOut", delay: 0.1 }}
              className="absolute w-96 h-96 bg-blue-500 rounded-full"
            />

            {/* Main Content */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
              className="relative z-10 text-center"
            >
              {/* Huge Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.5 }}
                className="mx-auto mb-8"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-48 h-48 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl"
                >
                  <CheckCircleIcon className="w-32 h-32 text-white" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h1 className="text-8xl font-black text-white mb-6 tracking-tight">
                  完了！
                </h1>
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-1 w-24 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
                  <span className="text-6xl font-bold text-green-400">100%</span>
                  <div className="h-1 w-24 bg-gradient-to-r from-transparent via-green-400 to-transparent" />
                </div>
              </motion.div>

              {/* Details */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="space-y-4"
              >
                <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl px-12 py-6 inline-block">
                  <p className="text-white/80 text-xl mb-2">生成完了</p>
                  <p className="text-3xl font-bold text-white mb-3">{goal.deliverable}</p>
                  <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
                    <span>全{totalTasks}タスク完了</span>
                    <span>•</span>
                    <span>AIエージェント稼働</span>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-8 px-12 py-5 bg-white text-black rounded-2xl font-bold text-xl shadow-2xl hover:shadow-green-500/50 transition-all flex items-center gap-3 mx-auto"
                >
                  <DocumentTextIcon className="w-7 h-7" />
                  {goal.deliverable}を確認する
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => router.push('/goals')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          ゴール一覧に戻る
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-100 text-purple-700 border-purple-200 font-bold">
                {goal.deliverable}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{goal.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <UserGroupIcon className="w-4 h-4" />
                <span>{goal.owner}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                <span>期限: {goal.deadline}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <ChartBarIcon className="w-4 h-4" />
                <span>タスク: {completed}/{totalTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Deep Research Style Display */}
      {!isCompleted && currentTask ? (
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Left: Progress Circle */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200 h-full flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                {/* Progress Circle */}
                <svg className="w-full h-full transform -rotate-90 relative">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                    fill="none"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#000000"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100) }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ rotate: { duration: 3, repeat: Infinity, ease: 'linear' } }}
                    className="mb-2"
                  >
                    <SparklesIcon className="w-10 h-10 text-gray-900" />
                  </motion.div>
                  <div className="text-4xl font-black text-gray-900">{progress}%</div>
                  <div className="text-xs text-gray-600 font-semibold mt-1">進行中</div>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 w-full space-y-2">
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 font-semibold">完了</p>
                  <p className="text-lg font-bold text-gray-900">{completed}/{totalTasks}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 font-semibold">残り時間</p>
                  <p className="text-lg font-bold text-gray-900">{estimatedTimeRemaining}秒</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Task Info */}
          <div className="col-span-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200 h-full">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                  <span className="text-green-600 font-bold text-xs uppercase tracking-wider">AI稼働中</span>
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-1">{currentTask.task}</h3>
                <p className="text-sm text-gray-600 mb-2">Level {currentTask.level}</p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-black rounded-full"
                    style={{ width: `${currentProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Deliverable */}
                {currentTask && (
                  <div className="bg-gray-50 border-2 border-gray-900 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <currentTask.deliverableIcon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 font-semibold">生成中の成果物</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{currentTask.deliverable}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Agents & Knowledge */}
                {currentTask && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <p className="text-xs text-gray-900 mb-2 font-bold uppercase">AIエージェント</p>
                      <div className="space-y-1">
                        {currentTask.agents.slice(0, 3).map((agent, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate">{agent}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <p className="text-xs text-gray-900 mb-2 font-bold uppercase">参照ナレッジ</p>
                      <div className="space-y-1">
                        {currentTask.knowledge.slice(0, 3).map((k, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-600 rounded-full flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate">{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Right: Todo List */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200 h-full">
              {currentTask && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-gray-900 rounded" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">実行中のタスク</h4>
                  </div>
                  <div className="space-y-2">
                    {currentTask.todos.map((todo, index) => {
                      const isCompleted = index < currentTodoIndex
                      const isCurrent = index === currentTodoIndex
                      const isPending = index > currentTodoIndex

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                            isCompleted ? 'bg-green-50 border-green-500' :
                            isCurrent ? 'bg-blue-50 border-blue-500 shadow' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                                <CheckCircleIcon className="w-3 h-3 text-white" />
                              </div>
                            ) : isCurrent ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"
                              >
                                <div className="w-2 h-2 border border-white border-t-transparent rounded-full" />
                              </motion.div>
                            ) : (
                              <div className="w-4 h-4 bg-gray-300 rounded-full" />
                            )}
                          </div>

                          {/* Todo Text */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${
                              isCompleted ? 'text-green-900 line-through' :
                              isCurrent ? 'text-blue-900 font-bold' :
                              'text-gray-400'
                            }`}>
                              {todo}
                            </p>
                          </div>

                          {/* Current Badge */}
                          {isCurrent && (
                            <div className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-bold rounded flex-shrink-0">
                              実行中
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Progress Summary */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-semibold">
                      {currentTodoIndex + 1} / {currentTask.todos.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-black"
                          initial={{ width: 0 }}
                          animate={{ width: `${((currentTodoIndex + 1) / currentTask.todos.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-900">
                        {Math.round(((currentTodoIndex + 1) / currentTask.todos.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="text-center py-8">
              <CheckCircleIcon className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">すべてのタスクが完了しました</h2>
              <p className="text-sm text-gray-600">全{totalTasks}個のタスクを正常に完了</p>
            </div>
          </div>

          {/* Next Steps Suggestions - Always show for debugging */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border-2 border-purple-200 mb-6"
          >
            <div className="mb-4 p-3 bg-yellow-100 rounded text-xs font-mono">
              <div>Debug Info:</div>
              <div>- isCompleted: {isCompleted ? 'true' : 'false'}</div>
              <div>- completed: {completed}</div>
              <div>- totalTasks: {totalTasks}</div>
              <div>- nextSteps.length: {nextSteps.length}</div>
              <div>- goal exists: {goal ? 'true' : 'false'}</div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">次のステップ</h2>
                  <p className="text-sm text-gray-600">AIがおすすめする次のアクション</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {nextSteps.map((suggestion, index) => {
                  const Icon = suggestion.icon
                  const categoryColors = {
                    analysis: 'from-blue-500 to-cyan-500',
                    strategy: 'from-purple-500 to-pink-500',
                    execution: 'from-orange-500 to-red-500',
                    reporting: 'from-green-500 to-emerald-500'
                  }

                  const categoryBadgeColors = {
                    analysis: 'bg-blue-100 text-blue-700 border-blue-200',
                    strategy: 'bg-purple-100 text-purple-700 border-purple-200',
                    execution: 'bg-orange-100 text-orange-700 border-orange-200',
                    reporting: 'bg-green-100 text-green-700 border-green-200'
                  }

                  const categoryLabels = {
                    analysis: '分析',
                    strategy: '戦略',
                    execution: '実行',
                    reporting: 'レポート'
                  }

                  return (
                    <motion.button
                      key={suggestion.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      onClick={() => handleNextStepClick(suggestion)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all text-left group relative overflow-hidden"
                    >
                      {/* Priority Badge */}
                      {suggestion.priority === 'high' && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            優先
                          </div>
                        </div>
                      )}

                      {/* Icon with Gradient */}
                      <div className="flex items-start gap-4 mb-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${categoryColors[suggestion.category]} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                            {suggestion.title}
                          </h3>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full border font-bold ${categoryBadgeColors[suggestion.category]}`}>
                          {categoryLabels[suggestion.category]}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {suggestion.estimatedTime}
                        </div>
                      </div>

                      {/* Hover Arrow */}
                      <motion.div
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        <ArrowLeftIcon className="w-5 h-5 text-purple-500 rotate-180" />
                      </motion.div>
                    </motion.button>
                  )
                })}
              </div>

            {nextSteps.length === 0 && (
              <div className="text-center text-gray-600 py-4">
                次のステップ提案を生成中...
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && !isCompleted && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 shadow-sm border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              完了したタスク
            </h2>
            <div className="px-3 py-1 bg-green-600 text-white rounded-full font-bold text-sm">
              {completedTasks.length}/{totalTasks}
            </div>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {completedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.03 }}
                className="relative group cursor-pointer"
              >
                {/* Deliverable Icon Badge */}
                <div className="absolute -top-1 -right-1 z-10">
                  <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-full p-1 shadow">
                    <task.deliverableIcon className="w-3 h-3 text-white" />
                  </div>
                </div>

                <div className="p-1.5 bg-white border border-green-300 rounded-lg shadow-sm hover:shadow transition-all">
                  <div className="flex items-start gap-1 mb-0.5">
                    <CheckCircleIcon className="w-2.5 h-2.5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-gray-900 line-clamp-1 leading-tight">{task.task}</span>
                  </div>
                  <p className="text-xs text-green-700 font-medium mb-0.5 truncate">
                    {task.deliverable}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 truncate flex-1">{task.aiAgent}</span>
                    <span className="text-xs font-bold text-green-600 ml-1">L{task.level}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
