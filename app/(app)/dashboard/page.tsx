'use client'

import { 
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const stats = [
    { label: '進行中のタスク', value: '24', icon: ClockIcon },
    { label: '完了済みタスク', value: '156', icon: CheckCircleIcon },
    { label: '稼働中のAI', value: '8', icon: CpuChipIcon },
    { label: '組織効率', value: '94%', icon: ArrowTrendingUpIcon },
  ]

  const recentDirectives = [
    { id: 1, title: '新規顧客獲得施策の実行', department: '営業', progress: 75, status: 'active' },
    { id: 2, title: 'コスト削減プラン策定', department: '財務', progress: 45, status: 'active' },
    { id: 3, title: '採用計画の見直し', department: '人事', progress: 90, status: 'active' },
  ]

  const agentActivities = [
    { agent: '営業AI', status: 'active', task: '新規リードを100件発掘中' },
    { agent: 'マーケティングAI', status: 'active', task: '広告キャンペーンを最適化中' },
    { agent: '人事AI', status: 'idle', task: '待機中' },
    { agent: '財務AI', status: 'active', task: '予算分析レポート作成中' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
        <p className="text-gray-600">全体の状況を一目で確認</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <stat.icon className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Directives */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="w-6 h-6" />
              進行中の指示
            </h2>
          </div>

          <div className="space-y-4">
            {recentDirectives.map((directive) => (
              <div
                key={directive.id}
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
              </div>
            ))}
          </div>
        </div>

        {/* AI Agent Activities */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BoltIcon className="w-6 h-6" />
              AIエージェントの状態
            </h2>
          </div>

          <div className="space-y-4">
            {agentActivities.map((activity, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity.status === 'active' ? 'bg-black' : 'bg-gray-300'
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
                <p className="text-sm text-gray-600">{activity.task}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
