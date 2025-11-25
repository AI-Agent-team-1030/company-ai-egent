'use client'

import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  UserGroupIcon,
  DocumentTextIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function HomePage() {
  // 主要指標（組織の健康状態）
  const healthMetrics = [
    { label: 'タスク完了率', value: '87%', change: '+5%', icon: CheckCircleIcon, trend: 'up' },
    { label: '稼働AIエージェント', value: '12', change: '+3', icon: CpuChipIcon, trend: 'up' },
    { label: '組織効率', value: '94%', change: '+8%', icon: ArrowTrendingUpIcon, trend: 'up' },
    { label: 'KPI達成率', value: '92%', change: '+7%', icon: ChartBarIcon, trend: 'up' },
    { label: '総タスク数', value: '348', change: '+15%', icon: ChartBarIcon, trend: 'up' },
    { label: 'アクティブユーザー', value: '45', change: '+12', icon: UserGroupIcon, trend: 'up' },
    { label: '生成ドキュメント', value: '342', change: '+28', icon: DocumentTextIcon, trend: 'up' },
    { label: 'ナレッジアイテム', value: '145', change: '+18', icon: LightBulbIcon, trend: 'up' },
  ]

  // 部門別パフォーマンス
  const departmentPerformance = [
    { dept: '人事', 完了率: 91, 平均日数: 1.9 },
    { dept: '財務', 完了率: 85, 平均日数: 2.5 },
    { dept: '営業', 完了率: 82, 平均日数: 2.1 },
    { dept: 'マーケ', 完了率: 78, 平均日数: 2.8 },
  ]

  // AI稼働率データ
  const aiPerformanceData = [
    { name: '営業AI', 稼働率: 95, 処理数: 82 },
    { name: '財務AI', 稼働率: 92, 処理数: 68 },
    { name: 'マーケAI', 稼働率: 88, 処理数: 54 },
    { name: 'CS AI', 稼働率: 81, 処理数: 47 },
    { name: '人事AI', 稼働率: 76, 処理数: 38 },
    { name: '法務AI', 稼働率: 65, 処理数: 28 },
  ]

  // KPI推移データ
  const kpiTrendData = [
    { month: '6月', KPI: 78 },
    { month: '7月', KPI: 82 },
    { month: '8月', KPI: 85 },
    { month: '9月', KPI: 88 },
    { month: '10月', KPI: 90 },
    { month: '11月', KPI: 92 },
  ]

  // AIエージェントの状態
  const agentActivities = [
    { agent: '営業AI', status: 'active', task: '新規リードを100件発掘中', performance: 95 },
    { agent: 'マーケティングAI', status: 'active', task: '広告キャンペーンを最適化中', performance: 88 },
    { agent: '財務AI', status: 'active', task: '予算分析レポート作成中', performance: 92 },
    { agent: '人事AI', status: 'idle', task: '待機中', performance: 76 },
  ]

  // 進行中の指示
  const recentDirectives = [
    { id: 1, title: '新規顧客獲得施策の実行', department: '営業', progress: 75, status: 'active' },
    { id: 2, title: 'コスト削減プラン策定', department: '財務', progress: 45, status: 'active' },
    { id: 3, title: '採用計画の見直し', department: '人事', progress: 90, status: 'active' },
  ]

  // 主要インサイト
  const keyInsights = [
    {
      id: 1,
      title: '生産性が大幅に向上',
      category: 'パフォーマンス',
      icon: ArrowTrendingUpIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      impact: 'high',
      summary: '先月比でタスク完了率が5%向上し、平均完了日数が8%短縮されました',
      details: [
        { label: 'タスク完了率', value: '87%', change: '+5%', trend: 'up' },
        { label: '平均完了日数', value: '2.3日', change: '-8%', trend: 'up' },
        { label: '月間節約時間', value: '520時間', change: '+12%', trend: 'up' },
      ],
      insight: '人事部門が完了率91%と最も高いパフォーマンスを発揮。平均1.9日で業務を完遂しています。一方、マーケティング部門は78%と改善の余地があります。',
      proposals: [
        {
          title: '人事部門のベストプラクティス共有会を開催',
          description: '月次で人事部門のタスク管理手法を他部門に共有する場を設ける',
          impact: '完了率 +8-10%向上見込み',
          timeline: '2週間以内に開始'
        },
        {
          title: 'マーケティング部門専用のワークフロー最適化',
          description: 'AIエージェントのチューニングとタスクテンプレートの整備',
          impact: '平均完了日数 -0.5日短縮見込み',
          timeline: '1ヶ月以内に実施'
        }
      ],
      progress: 87
    },
    {
      id: 2,
      title: 'AI活用率が全社で68%に到達',
      category: 'AI活用',
      icon: CpuChipIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      impact: 'high',
      summary: '12のAIエージェントが稼働し、全タスクの68%を自動処理しています',
      details: [
        { label: 'AI処理タスク', value: '237件', change: '+22件', trend: 'up' },
        { label: '自動化率', value: '68%', change: '+11%', trend: 'up' },
        { label: '平均稼働率', value: '83%', change: '+5%', trend: 'up' },
      ],
      insight: '営業AIの稼働率95%が最高値。法務AI（65%）とCS AI（81%）は改善の余地があります。稼働率が低いAIは、学習データ不足やタスクの複雑性が原因と考えられます。',
      proposals: [
        {
          title: '法務AIの専門データセット追加学習プログラム',
          description: '契約書、法令文書など法務特有のデータで追加学習を実施',
          impact: '稼働率 65% → 85%への向上見込み',
          timeline: '3週間で完了予定'
        },
        {
          title: '営業AIのベストプラクティスを他AIに横展開',
          description: '成功要因を分析し、プロンプト設計とデータ構造を標準化',
          impact: '全体稼働率 83% → 90%超え',
          timeline: '1ヶ月で段階的展開'
        }
      ],
      progress: 68
    },
    {
      id: 3,
      title: 'KPI達成率が目標を上回る',
      category: '目標達成',
      icon: CheckCircleIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      impact: 'high',
      summary: '全社KPI達成率が92%に到達し、目標の85%を7ポイント上回っています',
      details: [
        { label: 'KPI達成率', value: '92%', change: '+7%', trend: 'up' },
        { label: '達成部門数', value: '4/4部門', change: '', trend: 'neutral' },
        { label: '最高KPI', value: '財務 95%', change: '', trend: 'neutral' },
      ],
      insight: '全4部門が目標を達成。特に財務部門（95%）と営業部門（92%）が優秀です。この成功を維持しつつ、さらに高い目標設定が可能です。',
      proposals: [
        {
          title: '次四半期のKPI目標を90%に引き上げ',
          description: '全部門が達成可能な範囲で目標を高め、継続的な成長を促進',
          impact: '組織全体のパフォーマンス +5-8%向上',
          timeline: '次四半期から適用'
        },
        {
          title: '財務・営業部門の成功事例研究会を実施',
          description: 'KPI達成のベストプラクティスを全社で共有',
          impact: '他部門のKPI達成率 +3-5%',
          timeline: '月1回の定期開催'
        }
      ],
      progress: 92
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ホーム</h1>
        <p className="text-gray-600">組織の健康状態を一目で確認</p>
      </motion.div>

      {/* 組織の健康状態 - 主要指標 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">組織の健康状態</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {healthMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <metric.icon className="w-6 h-6 text-gray-900" />
                </div>
                <span className={`text-sm font-semibold ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 部門別パフォーマンスとAI稼働率 */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">各部署の稼働状況</h2>
            <p className="text-sm text-gray-600">部門別のタスク完了率</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="dept" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="完了率" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">AI稼働率</h2>
            <p className="text-sm text-gray-600">各AIエージェントの稼働状況</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={aiPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="稼働率" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* KPI推移 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">KPI推移</h2>
          <p className="text-sm text-gray-600">過去6ヶ月のKPI達成率</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={kpiTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Line
              type="monotone"
              dataKey="KPI"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* AIエージェントの活動状況 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                <BoltIcon className="w-6 h-6" />
                AIエージェントの活動状況
              </h2>
              <p className="text-sm text-gray-600">リアルタイムの稼働状態とパフォーマンス</p>
            </div>
          </div>

          <div className="space-y-4">
            {agentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-black animate-pulse' : 'bg-gray-300'
                      }`}
                    />
                    <span className="font-bold text-gray-900">{activity.agent}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    activity.status === 'active'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.status === 'active' ? '稼働中' : '待機中'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{activity.task}</p>
                {activity.status === 'active' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">パフォーマンス</span>
                      <span className="text-xs font-bold text-gray-900">{activity.performance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        style={{ width: `${activity.performance}%` }}
                        className="bg-gray-900 h-1.5 rounded-full transition-all"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 進行中の指示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                <ChartBarIcon className="w-6 h-6" />
                進行中の指示
              </h2>
              <p className="text-sm text-gray-600">現在進行中のプロジェクトとタスク</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentDirectives.map((directive, index) => (
              <motion.div
                key={directive.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{directive.title}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-900 rounded">
                      {directive.department}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{directive.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    style={{ width: `${directive.progress}%` }}
                    className="bg-gray-900 h-2 rounded-full transition-all"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 主要インサイト */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">主要インサイト</h2>
            <p className="text-sm text-gray-600">データから得られた重要な知見とアクションアイテム</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full">
              High Impact: {keyInsights.filter(i => i.impact === 'high').length}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {keyInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + index * 0.1 }}
              className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className={`p-4 ${insight.iconBg} rounded-xl`}>
                    <insight.icon className={`w-8 h-8 ${insight.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{insight.title}</h3>
                      {insight.impact === 'high' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                          High Impact
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{insight.category}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <p className="text-base text-gray-700 mb-6 leading-relaxed border-l-4 border-gray-300 pl-4">
                {insight.summary}
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                {insight.details.map((detail, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-xs text-gray-600 mb-2 font-medium">{detail.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{detail.value}</p>
                    {detail.change && (
                      <p className={`text-sm font-semibold mt-1 ${
                        detail.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {detail.change}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">達成度</span>
                  <span className="text-lg font-bold text-gray-900">{insight.progress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.progress}%` }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full ${
                      insight.progress >= 85
                        ? 'bg-green-500'
                        : insight.progress >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Analysis */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>📊</span> 分析結果
                </p>
                <p className="text-sm text-blue-800 leading-relaxed">{insight.insight}</p>
              </div>

              {/* Proposals */}
              {insight.proposals && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <span>🎯</span> 具体的な提案・アクションプラン
                  </p>
                  {insight.proposals.map((proposal, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-bold text-purple-900">{proposal.title}</h5>
                        <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs font-semibold rounded">
                          {proposal.timeline}
                        </span>
                      </div>
                      <p className="text-sm text-purple-800 mb-3 leading-relaxed">
                        {proposal.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-purple-700">期待効果:</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          {proposal.impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
