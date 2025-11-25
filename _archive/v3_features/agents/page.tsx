'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface TaskAgent {
  id: string
  name: string
  description: string
  status: 'active' | 'idle'
}

interface DepartmentAgent {
  id: string
  name: string
  description: string
  status: 'active' | 'idle'
  taskAgents: TaskAgent[]
}

export default function AgentsPage() {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set(['sales']))
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [newAgentForm, setNewAgentForm] = useState({
    name: '',
    description: '',
    type: 'department' as 'department' | 'task',
    parentId: '',
  })

  const [agents, setAgents] = useState<DepartmentAgent[]>([
    {
      id: 'sales',
      name: '営業AI',
      description: '新規顧客獲得と売上管理',
      status: 'active',
      taskAgents: [
        { id: 'sales-lead-research', name: 'リード調査AI', description: '見込み顧客の情報収集と分析', status: 'active' },
        { id: 'sales-lead-list', name: 'リスト作成AI', description: 'ターゲット顧客リストの自動生成', status: 'active' },
        { id: 'sales-outbound', name: 'アウトバウンドAI', description: '初回アプローチメールの自動送信', status: 'active' },
        { id: 'sales-appointment', name: 'アポイント調整AI', description: '商談日程の自動調整', status: 'active' },
        { id: 'sales-proposal', name: '提案資料作成AI', description: '顧客別提案書の自動生成', status: 'active' },
        { id: 'sales-quote', name: '見積作成AI', description: '見積書の自動作成と送付', status: 'active' },
        { id: 'sales-negotiation', name: '交渉支援AI', description: '価格交渉のデータ分析', status: 'idle' },
        { id: 'sales-contract', name: '契約書作成AI', description: '契約書ドラフトの自動生成', status: 'active' },
        { id: 'sales-followup', name: 'フォローアップAI', description: '商談後の自動フォロー', status: 'active' },
        { id: 'sales-forecast', name: '売上予測AI', description: '受注予測とパイプライン管理', status: 'active' },
      ],
    },
    {
      id: 'marketing',
      name: 'マーケティングAI',
      description: '広告施策とブランディング',
      status: 'active',
      taskAgents: [
        { id: 'marketing-research', name: '市場調査AI', description: '市場トレンド分析', status: 'active' },
        { id: 'marketing-persona', name: 'ペルソナ分析AI', description: 'ターゲット顧客の分析', status: 'active' },
        { id: 'marketing-content', name: 'コンテンツ企画AI', description: 'コンテンツ戦略立案', status: 'active' },
        { id: 'marketing-copywriting', name: 'コピーライティングAI', description: '広告文の自動生成', status: 'active' },
        { id: 'marketing-creative', name: 'クリエイティブ制作AI', description: 'バナー・画像の自動生成', status: 'active' },
        { id: 'marketing-seo', name: 'SEO最適化AI', description: 'コンテンツのSEO最適化', status: 'active' },
        { id: 'marketing-sns-post', name: 'SNS投稿AI', description: 'SNS投稿の自動作成', status: 'active' },
        { id: 'marketing-sns-schedule', name: 'SNS投稿スケジューリングAI', description: '最適タイミングでの投稿', status: 'active' },
        { id: 'marketing-ad-management', name: '広告運用AI', description: 'Web広告の自動運用', status: 'active' },
        { id: 'marketing-ab-test', name: 'ABテストAI', description: 'ABテストの設計と分析', status: 'idle' },
        { id: 'marketing-analytics', name: '効果測定AI', description: 'マーケティング効果の分析', status: 'active' },
        { id: 'marketing-report', name: 'レポート作成AI', description: 'マーケティングレポート自動生成', status: 'active' },
      ],
    },
    {
      id: 'cs',
      name: 'カスタマーサクセスAI',
      description: '顧客満足度向上と継続率改善',
      status: 'active',
      taskAgents: [
        { id: 'cs-onboarding', name: 'オンボーディングAI', description: '新規顧客の導入支援', status: 'active' },
        { id: 'cs-training', name: 'トレーニングAI', description: '顧客向けトレーニング資料作成', status: 'active' },
        { id: 'cs-health-check', name: 'ヘルスチェックAI', description: '顧客の利用状況分析', status: 'active' },
        { id: 'cs-engagement', name: 'エンゲージメントAI', description: '顧客接点の最適化', status: 'active' },
        { id: 'cs-upsell', name: 'アップセル提案AI', description: 'アップセル機会の検出', status: 'idle' },
        { id: 'cs-renewal', name: '更新管理AI', description: '契約更新の自動リマインド', status: 'active' },
        { id: 'cs-churn-prediction', name: '解約予測AI', description: '解約リスクの早期検知', status: 'active' },
        { id: 'cs-feedback', name: 'フィードバック収集AI', description: '顧客フィードバックの収集', status: 'active' },
      ],
    },
    {
      id: 'support',
      name: 'カスタマーサポートAI',
      description: '顧客対応と問い合わせ管理',
      status: 'active',
      taskAgents: [
        { id: 'support-chatbot', name: 'チャットボットAI', description: '自動チャット対応', status: 'active' },
        { id: 'support-ticket-routing', name: 'チケット振り分けAI', description: '問い合わせの自動振り分け', status: 'active' },
        { id: 'support-auto-reply', name: '自動返信AI', description: 'よくある質問への自動回答', status: 'active' },
        { id: 'support-email-response', name: 'メール対応AI', description: 'メール返信文の自動生成', status: 'active' },
        { id: 'support-knowledge-base', name: 'ナレッジベースAI', description: 'FAQ記事の自動生成', status: 'active' },
        { id: 'support-escalation', name: 'エスカレーション判定AI', description: '担当者への引き継ぎ判断', status: 'idle' },
        { id: 'support-sentiment', name: '感情分析AI', description: '顧客感情の分析', status: 'active' },
        { id: 'support-satisfaction', name: '満足度調査AI', description: '満足度アンケートの自動送信', status: 'active' },
      ],
    },
    {
      id: 'hr',
      name: '人事AI',
      description: '採用と人材育成',
      status: 'active',
      taskAgents: [
        { id: 'hr-job-posting', name: '求人票作成AI', description: '魅力的な求人票の自動生成', status: 'active' },
        { id: 'hr-sourcing', name: '人材ソーシングAI', description: '候補者の自動スカウト', status: 'active' },
        { id: 'hr-resume-screening', name: '履歴書スクリーニングAI', description: '履歴書の自動審査', status: 'active' },
        { id: 'hr-interview-schedule', name: '面接調整AI', description: '面接日程の自動調整', status: 'active' },
        { id: 'hr-interview-questions', name: '面接質問生成AI', description: '面接質問の自動生成', status: 'idle' },
        { id: 'hr-evaluation', name: '候補者評価AI', description: '面接評価の分析', status: 'active' },
        { id: 'hr-offer', name: 'オファー作成AI', description: '内定通知の自動作成', status: 'active' },
        { id: 'hr-onboarding-doc', name: '入社書類AI', description: '入社手続き書類の準備', status: 'active' },
        { id: 'hr-training-plan', name: '研修計画AI', description: '社員研修プラン作成', status: 'idle' },
        { id: 'hr-performance', name: '評価管理AI', description: '人事評価のデータ管理', status: 'active' },
      ],
    },
    {
      id: 'finance',
      name: '財務AI',
      description: '予算管理と財務分析',
      status: 'active',
      taskAgents: [
        { id: 'finance-budget', name: '予算策定AI', description: '予算計画の自動作成', status: 'active' },
        { id: 'finance-expense-check', name: '経費チェックAI', description: '経費申請の自動審査', status: 'active' },
        { id: 'finance-invoice', name: '請求書発行AI', description: '請求書の自動発行', status: 'active' },
        { id: 'finance-payment', name: '入金確認AI', description: '入金状況の自動確認', status: 'active' },
        { id: 'finance-reminder', name: '督促AI', description: '未払い請求の自動督促', status: 'idle' },
        { id: 'finance-reconciliation', name: '消込AI', description: '入金消込の自動処理', status: 'active' },
        { id: 'finance-report', name: '財務レポートAI', description: '財務レポートの自動生成', status: 'active' },
        { id: 'finance-forecast', name: '財務予測AI', description: '売上・利益予測', status: 'active' },
      ],
    },
    {
      id: 'accounting',
      name: '経理AI',
      description: '会計処理と帳簿管理',
      status: 'active',
      taskAgents: [
        { id: 'accounting-journal', name: '仕訳AI', description: '仕訳の自動入力', status: 'active' },
        { id: 'accounting-receipt', name: '領収書処理AI', description: '領収書のOCR処理', status: 'active' },
        { id: 'accounting-expense', name: '経費精算AI', description: '経費精算の自動処理', status: 'active' },
        { id: 'accounting-payroll', name: '給与計算AI', description: '給与計算の自動化', status: 'active' },
        { id: 'accounting-tax', name: '税務処理AI', description: '税務申告書の作成支援', status: 'idle' },
        { id: 'accounting-closing', name: '月次決算AI', description: '月次決算の自動化', status: 'active' },
      ],
    },
    {
      id: 'legal',
      name: '法務AI',
      description: '契約管理とリーガルチェック',
      status: 'active',
      taskAgents: [
        { id: 'legal-contract-draft', name: '契約書ドラフトAI', description: '契約書雛形の自動生成', status: 'active' },
        { id: 'legal-contract-review', name: '契約書レビューAI', description: '契約書のリスク確認', status: 'active' },
        { id: 'legal-compliance-check', name: 'コンプライアンスチェックAI', description: '法令遵守の確認', status: 'active' },
        { id: 'legal-contract-management', name: '契約管理AI', description: '契約書の一元管理', status: 'active' },
        { id: 'legal-renewal-reminder', name: '契約更新通知AI', description: '契約更新日の自動通知', status: 'idle' },
        { id: 'legal-research', name: '法令調査AI', description: '関連法令の調査', status: 'idle' },
      ],
    },
    {
      id: 'pr',
      name: '広報・PRAI',
      description: 'プレスリリースとメディア対応',
      status: 'active',
      taskAgents: [
        { id: 'pr-press-release', name: 'プレスリリース作成AI', description: 'プレスリリースの自動生成', status: 'active' },
        { id: 'pr-media-list', name: 'メディアリスト管理AI', description: 'メディアリストの管理', status: 'active' },
        { id: 'pr-media-monitoring', name: 'メディアモニタリングAI', description: 'メディア露出の監視', status: 'active' },
        { id: 'pr-crisis', name: '危機管理AI', description: '炎上リスクの検知', status: 'idle' },
        { id: 'pr-report', name: '広報レポートAI', description: '広報活動レポート作成', status: 'active' },
      ],
    },
    {
      id: 'ir',
      name: 'IRAI',
      description: '投資家対応と情報開示',
      status: 'active',
      taskAgents: [
        { id: 'ir-presentation', name: 'IR資料作成AI', description: 'IR資料の自動生成', status: 'active' },
        { id: 'ir-qa', name: 'IR Q&A AI', description: '想定問答の自動作成', status: 'idle' },
        { id: 'ir-disclosure', name: '開示資料AI', description: '適時開示資料の作成', status: 'active' },
        { id: 'ir-analysis', name: '株価分析AI', description: '株価動向の分析', status: 'active' },
      ],
    },
    {
      id: 'procurement',
      name: '購買・調達AI',
      description: '仕入先管理と発注業務',
      status: 'active',
      taskAgents: [
        { id: 'procurement-vendor', name: 'ベンダー管理AI', description: '仕入先情報の管理', status: 'active' },
        { id: 'procurement-rfq', name: '見積依頼AI', description: '見積依頼書の自動作成', status: 'active' },
        { id: 'procurement-comparison', name: '見積比較AI', description: '複数見積の自動比較', status: 'active' },
        { id: 'procurement-order', name: '発注AI', description: '発注書の自動作成', status: 'active' },
        { id: 'procurement-receiving', name: '検収AI', description: '納品物の検収処理', status: 'idle' },
        { id: 'procurement-payment', name: '支払処理AI', description: '支払処理の自動化', status: 'active' },
      ],
    },
    {
      id: 'logistics',
      name: '物流・倉庫管理AI',
      description: '在庫管理と配送最適化',
      status: 'active',
      taskAgents: [
        { id: 'logistics-inventory-forecast', name: '在庫予測AI', description: '需要予測と発注提案', status: 'active' },
        { id: 'logistics-order', name: '自動発注AI', description: '在庫切れ前の自動発注', status: 'active' },
        { id: 'logistics-receiving', name: '入庫管理AI', description: '入庫処理の自動化', status: 'active' },
        { id: 'logistics-picking', name: 'ピッキング最適化AI', description: 'ピッキングルートの最適化', status: 'active' },
        { id: 'logistics-packing', name: '梱包指示AI', description: '梱包方法の自動指示', status: 'idle' },
        { id: 'logistics-shipping', name: '配送最適化AI', description: '配送ルートの最適化', status: 'active' },
        { id: 'logistics-tracking', name: '配送追跡AI', description: '配送状況の自動通知', status: 'active' },
      ],
    },
    {
      id: 'data',
      name: 'データ分析AI',
      description: 'ビジネスデータの分析と可視化',
      status: 'active',
      taskAgents: [
        { id: 'data-collection', name: 'データ収集AI', description: '各種データの自動収集', status: 'active' },
        { id: 'data-cleaning', name: 'データクレンジングAI', description: 'データの整形と正規化', status: 'active' },
        { id: 'data-analysis', name: 'データ分析AI', description: '統計分析と傾向把握', status: 'active' },
        { id: 'data-visualization', name: 'データ可視化AI', description: 'グラフ・ダッシュボード作成', status: 'active' },
        { id: 'data-report', name: 'レポート生成AI', description: '分析レポートの自動生成', status: 'active' },
        { id: 'data-prediction', name: '予測モデルAI', description: '機械学習による予測', status: 'idle' },
      ],
    },
    {
      id: 'dev',
      name: '開発AI',
      description: 'システム開発と保守',
      status: 'idle',
      taskAgents: [
        { id: 'dev-requirement', name: '要件定義AI', description: '要件定義書の作成支援', status: 'idle' },
        { id: 'dev-design', name: '設計AI', description: 'システム設計書の作成', status: 'idle' },
        { id: 'dev-code', name: 'コード生成AI', description: '仕様からのコード自動生成', status: 'idle' },
        { id: 'dev-review', name: 'コードレビューAI', description: 'コードの自動レビュー', status: 'idle' },
        { id: 'dev-test', name: 'テスト自動化AI', description: 'テストケースの自動実行', status: 'idle' },
        { id: 'dev-bug', name: 'バグ検知AI', description: 'バグの自動検出', status: 'idle' },
        { id: 'dev-deploy', name: 'デプロイAI', description: '自動デプロイと監視', status: 'idle' },
      ],
    },
    {
      id: 'security',
      name: 'セキュリティAI',
      description: 'セキュリティ監視と脅威検知',
      status: 'active',
      taskAgents: [
        { id: 'security-monitoring', name: 'セキュリティ監視AI', description: '不正アクセスの検知', status: 'active' },
        { id: 'security-vulnerability', name: '脆弱性診断AI', description: 'システムの脆弱性診断', status: 'idle' },
        { id: 'security-incident', name: 'インシデント対応AI', description: 'セキュリティ事故の初動対応', status: 'active' },
        { id: 'security-log', name: 'ログ分析AI', description: 'アクセスログの分析', status: 'active' },
        { id: 'security-training', name: 'セキュリティ教育AI', description: '社員向けセキュリティ教育', status: 'idle' },
      ],
    },
    {
      id: 'admin',
      name: '総務AI',
      description: 'バックオフィス業務',
      status: 'idle',
      taskAgents: [
        { id: 'admin-contract', name: '社内契約管理AI', description: '社内契約書の管理', status: 'idle' },
        { id: 'admin-facility-reserve', name: '会議室予約AI', description: '会議室予約の自動調整', status: 'idle' },
        { id: 'admin-equipment', name: '備品管理AI', description: '備品在庫の管理', status: 'idle' },
        { id: 'admin-mail', name: '郵便物管理AI', description: '郵便物の受付・配布管理', status: 'idle' },
        { id: 'admin-visitor', name: '来客対応AI', description: '来客受付の自動化', status: 'idle' },
      ],
    },
  ])

  const toggleExpand = (agentId: string) => {
    setExpandedAgents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(agentId)) {
        newSet.delete(agentId)
      } else {
        newSet.add(agentId)
      }
      return newSet
    })
  }

  const totalTaskAgents = agents.reduce((sum, agent) => sum + agent.taskAgents.length, 0)
  const activeTaskAgents = agents.reduce(
    (sum, agent) => sum + agent.taskAgents.filter(ta => ta.status === 'active').length,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AIエージェント一覧</h1>
          <p className="text-gray-600">全AIエージェントを管理・追加</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
        >
          <PlusIcon className="w-5 h-5" />
          エージェント追加
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <span className="text-sm text-gray-600 block mb-2">職種AIエージェント</span>
          <p className="text-3xl font-bold text-gray-900">{agents.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <span className="text-sm text-gray-600 block mb-2">タスクAIエージェント</span>
          <p className="text-3xl font-bold text-gray-900">{totalTaskAgents}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <span className="text-sm text-gray-600 block mb-2">稼働中</span>
          <p className="text-3xl font-bold text-green-600">{activeTaskAgents}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <span className="text-sm text-gray-600 block mb-2">待機中</span>
          <p className="text-3xl font-bold text-gray-400">{totalTaskAgents - activeTaskAgents}</p>
        </motion.div>
      </div>

      {/* Agent List */}
      <div className="space-y-3">
        {agents.map((agent, index) => {
          const isExpanded = expandedAgents.has(agent.id)

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Department Agent Header */}
              <div
                onClick={() => toggleExpand(agent.id)}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </motion.div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-gray-600">
                          {agent.status === 'active' ? '稼働中' : '待機中'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{agent.description}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">タスクAI</div>
                    <div className="text-xl font-bold text-gray-900">{agent.taskAgents.length}体</div>
                  </div>
                </div>
              </div>

              {/* Task Agents */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="p-4 grid md:grid-cols-3 gap-3">
                      {agent.taskAgents.map((taskAgent, taskIndex) => (
                        <motion.div
                          key={taskAgent.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: taskIndex * 0.02 }}
                          className="bg-white rounded-lg p-3 border border-gray-200 hover:border-gray-400 transition-all"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                taskAgent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                              <h4 className="font-bold text-sm text-gray-900">{taskAgent.name}</h4>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 ml-3.5">{taskAgent.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Add Agent Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">エージェント追加</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    エージェント名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAgentForm.name}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例：カスタマーサポートAI"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    説明
                  </label>
                  <textarea
                    value={newAgentForm.description}
                    onChange={(e) => setNewAgentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="このAIエージェントの役割を入力..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-bold"
                >
                  キャンセル
                </button>
                <button
                  disabled={!newAgentForm.name.trim()}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  追加
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
