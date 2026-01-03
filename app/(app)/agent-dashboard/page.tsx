/**
 * AIアシスタント
 *
 * 依頼入力→タスク分解→AI実行→結果統合
 */

'use client'

import { TaskInput } from './components/TaskInput'
import { SubtaskList } from './components/SubtaskList'
import { AgentExecutionGrid } from './components/AgentExecutionGrid'
import { IntegratedResult } from './components/IntegratedResult'
import { useAgentDashboard } from './hooks/useAgentDashboard'

export default function AgentDashboardPage() {
  const {
    // 状態
    taskInput,
    setTaskInput,
    isAnalyzing,
    orchestrationPlan,
    agentExecutions,
    executionPhase,
    integratedResult,
    error,

    // アクション
    executeTask,
    cancelExecution,
    retryAgent,
  } = useAgentDashboard()

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">AIに依頼する</h1>
          <p className="text-sm text-gray-500 mt-1">
            やりたいことを入力すると、AIが自動で実行します
          </p>
        </div>

        {/* タスク入力 */}
        <TaskInput
          value={taskInput}
          onChange={setTaskInput}
          onSubmit={executeTask}
          isLoading={isAnalyzing}
          disabled={executionPhase !== 'idle' && executionPhase !== 'complete'}
        />

        {/* エラー表示 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 分析中 */}
        {isAnalyzing && (
          <div className="mt-8 flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">タスクを分析中...</p>
          </div>
        )}

        {/* オーケストレーションプラン表示 */}
        {orchestrationPlan && !isAnalyzing && (
          <div className="mt-6 space-y-4">
            {/* タスク分析結果 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  タスク分析
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                  orchestrationPlan.complexity === 'simple'
                    ? 'bg-emerald-100 text-emerald-700'
                    : orchestrationPlan.complexity === 'moderate'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {orchestrationPlan.complexity === 'simple' ? 'シンプル' :
                   orchestrationPlan.complexity === 'moderate' ? '中程度' : '複雑'}
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-700">{orchestrationPlan.taskAnalysis}</p>
            </div>

            {/* サブタスク一覧 */}
            <SubtaskList
              agents={orchestrationPlan.agents}
              agentExecutions={agentExecutions}
            />

            {/* エージェント実行グリッド */}
            <AgentExecutionGrid
              agents={orchestrationPlan.agents}
              agentExecutions={agentExecutions}
              onRetry={retryAgent}
            />

            {/* 統合結果 */}
            {integratedResult && (
              <IntegratedResult
                result={integratedResult}
                agentExecutions={agentExecutions}
              />
            )}

            {/* キャンセルボタン */}
            {(executionPhase === 'executing' || executionPhase === 'synthesizing') && (
              <div className="flex justify-center">
                <button
                  onClick={cancelExecution}
                  className="px-6 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        )}

        {/* 初期状態 */}
        {executionPhase === 'idle' && !orchestrationPlan && !isAnalyzing && (
          <div className="mt-12 sm:mt-16 text-center px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 rounded-2xl mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              何をお手伝いしましょうか？
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              依頼内容を入力すると、AIが自動で分析・実行します
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
