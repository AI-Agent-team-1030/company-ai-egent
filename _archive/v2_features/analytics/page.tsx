'use client'

import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
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

export default function AnalyticsPage() {
  // 主要指標
  const keyMetrics = [
    { label: '総タスク数', value: '348', change: '+15%', icon: ChartBarIcon, trend: 'up' },
    { label: 'タスク完了率', value: '87%', change: '+5%', icon: CheckCircleIcon, trend: 'up' },
    { label: '平均完了日数', value: '2.3日', change: '-8%', icon: ClockIcon, trend: 'up' },
    { label: '稼働AIエージェント', value: '12', change: '+3', icon: CpuChipIcon, trend: 'up' },
    { label: 'KPI達成率', value: '92%', change: '+7%', icon: ArrowTrendingUpIcon, trend: 'up' },
    { label: 'アクティブユーザー', value: '45', change: '+12', icon: UserGroupIcon, trend: 'up' },
    { label: '生成ドキュメント', value: '342', change: '+28', icon: DocumentTextIcon, trend: 'up' },
    { label: 'ナレッジアイテム', value: '145', change: '+18', icon: LightBulbIcon, trend: 'up' },
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
      needs: [
        '人事部門の成功要因の分析レポート',
        '部門間のワークフロー比較データ',
        'タスク管理ツールのログ分析'
      ],
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
      chartData: [
        { dept: '人事', 完了率: 91, 平均日数: 1.9 },
        { dept: '財務', 完了率: 85, 平均日数: 2.5 },
        { dept: '営業', 完了率: 82, 平均日数: 2.1 },
        { dept: 'マーケ', 完了率: 78, 平均日数: 2.8 },
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
      needs: [
        '法務AI・CS AIのエラーログと失敗要因分析',
        '各AIエージェントの学習データ品質評価',
        '高稼働率エージェント（営業AI）の設定パラメータ'
      ],
      proposals: [
        {
          title: '法務AIの専門データセット追加学習プログラム',
          description: '契約書、法令文書など法務特有のデータで追加学習を実施',
          impact: '稼働率 65% → 85%への向上見込み',
          timeline: '3週間で完了予定'
        },
        {
          title: 'CS AIのFAQ・過去対応履歴の統合',
          description: '顧客対応履歴とFAQデータベースをAIに学習させる',
          impact: '対応精度 +15%、稼働率 81% → 90%',
          timeline: '2週間で実装可能'
        },
        {
          title: '営業AIのベストプラクティスを他AIに横展開',
          description: '成功要因を分析し、プロンプト設計とデータ構造を標準化',
          impact: '全体稼働率 83% → 90%超え',
          timeline: '1ヶ月で段階的展開'
        }
      ],
      chartData: [
        { name: '営業AI', 稼働率: 95, 処理数: 82 },
        { name: '財務AI', 稼働率: 92, 処理数: 68 },
        { name: 'マーケAI', 稼働率: 88, 処理数: 54 },
        { name: 'CS AI', 稼働率: 81, 処理数: 47 },
        { name: '人事AI', 稼働率: 76, 処理数: 38 },
        { name: '法務AI', 稼働率: 65, 処理数: 28 },
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
      needs: [
        '各部門のKPI達成要因の詳細分析',
        '次四半期の適正な目標値設定のためのデータ',
        '財務・営業部門の成功パターンのドキュメント化'
      ],
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
      chartData: [
        { month: '6月', KPI: 78 },
        { month: '7月', KPI: 82 },
        { month: '8月', KPI: 85 },
        { month: '9月', KPI: 88 },
        { month: '10月', KPI: 90 },
        { month: '11月', KPI: 92 },
      ],
      progress: 92
    },
    {
      id: 4,
      title: 'ドキュメント生成が月間342件',
      category: 'コンテンツ',
      icon: DocumentTextIcon,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      impact: 'medium',
      summary: 'AIによる自動ドキュメント生成が先月比+28件増加し、品質スコアは4.2/5.0を維持',
      details: [
        { label: '生成件数', value: '342件', change: '+28件', trend: 'up' },
        { label: '品質スコア', value: '4.2/5.0', change: '+0.1', trend: 'up' },
        { label: '編集時間削減', value: '73%', change: '+8%', trend: 'up' },
      ],
      insight: '報告書、提案書、議事録など多様なドキュメントを自動生成。編集時間を73%削減していますが、品質スコア4.2は改善の余地があります。',
      needs: [
        'ドキュメント品質評価の詳細フィードバック',
        '高品質ドキュメントのテンプレート分析',
        'ユーザーの編集箇所と改善点のログ'
      ],
      proposals: [
        {
          title: '業界別・用途別テンプレートライブラリの構築',
          description: '契約書、提案書、報告書など10種類のプロフェッショナルテンプレートを追加',
          impact: '品質スコア 4.2 → 4.5、編集時間 -10%',
          timeline: '6週間で段階的にリリース'
        },
        {
          title: 'AIのドキュメント生成精度向上プログラム',
          description: '高評価ドキュメントを学習データとして追加学習を実施',
          impact: '品質スコア 4.2 → 4.7、ユーザー満足度 +20%',
          timeline: '4週間で実装完了'
        }
      ],
      chartData: [
        { type: '報告書', 件数: 124, 品質: 4.3 },
        { type: '提案書', 件数: 89, 品質: 4.1 },
        { type: '議事録', 件数: 76, 品質: 4.4 },
        { type: '契約書', 件数: 53, 品質: 3.9 },
      ],
      progress: 84
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">アナリティクス</h1>
        <p className="text-gray-600">組織のパフォーマンスを可視化</p>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {keyMetrics.map((metric, index) => (
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

      {/* 主要インサイト */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
            <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">
              Medium Impact: {keyInsights.filter(i => i.impact === 'medium').length}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {keyInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
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
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
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

              {/* Chart */}
              {insight.chartData && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">関連データ</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    {insight.id === 1 ? (
                      <BarChart data={insight.chartData}>
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
                    ) : insight.id === 2 ? (
                      <BarChart data={insight.chartData}>
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
                    ) : insight.id === 3 ? (
                      <LineChart data={insight.chartData}>
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
                    ) : (
                      <BarChart data={insight.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="type" stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="件数" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Analysis */}
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>📊</span> 分析結果
                </p>
                <p className="text-sm text-blue-800 leading-relaxed">{insight.insight}</p>
              </div>

              {/* Needs */}
              {insight.needs && (
                <div className="mb-6 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-100">
                  <p className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2">
                    <span>🔍</span> この分析のために必要なもの
                  </p>
                  <ul className="space-y-2">
                    {insight.needs.map((need, idx) => (
                      <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span>
                        <span>{need}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
