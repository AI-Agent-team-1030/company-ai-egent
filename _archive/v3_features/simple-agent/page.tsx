'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  RocketLaunchIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

interface AgentStep {
  name: string
  status: 'pending' | 'running' | 'completed'
}

interface AgentResult {
  agent: string
  result: string
}

export default function SimpleAgentPage() {
  const [goal, setGoal] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [agentResults, setAgentResults] = useState<AgentResult[]>([])
  const [finalReport, setFinalReport] = useState('')
  const [error, setError] = useState('')
  const [openAgents, setOpenAgents] = useState<Record<number, boolean>>({})
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  const toggleAgent = (index: number) => {
    setOpenAgents((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // タイマー処理
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 100)
    } else if (!isRunning && interval) {
      clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, startTime])

  // 進捗率を計算
  const getProgress = () => {
    if (steps.length === 0) return 0
    const completed = steps.filter((s) => s.status === 'completed').length
    return (completed / steps.length) * 100
  }

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleRun = async () => {
    if (!goal.trim()) {
      setError('ゴールを入力してください')
      return
    }

    setIsRunning(true)
    setError('')
    setSteps([])
    setAgentResults([])
    setFinalReport('')
    setOpenAgents({})
    setElapsedTime(0)
    setStartTime(Date.now())

    try {
      const response = await fetch('/api/simple-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal }),
      })

      if (!response.ok) {
        throw new Error('エージェント実行に失敗しました')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('レスポンスの読み取りに失敗しました')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'steps') {
              setSteps(data.steps)
              // リアルタイム結果表示
              if (data.result && data.agent) {
                setAgentResults((prev) => {
                  const existing = prev.findIndex((r) => r.agent === data.agent)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = { agent: data.agent, result: data.result }
                    return updated
                  }
                  return [...prev, { agent: data.agent, result: data.result }]
                })
              }
            } else if (data.type === 'complete') {
              setAgentResults(data.agentResults)
              setFinalReport(data.finalReport)
              setIsRunning(false)
              setStartTime(null)
            } else if (data.type === 'error') {
              setError(data.error)
              setIsRunning(false)
              setStartTime(null)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
      setIsRunning(false)
      setStartTime(null)
    }
  }

  const getStepIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />
    } else if (status === 'running') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <ArrowPathIcon className="w-5 h-5 text-blue-600" />
        </motion.div>
      )
    } else {
      return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🤖 マルチエージェントシステム
        </h1>
        <p className="text-gray-600">
          統括エージェントが複数の専門エージェントを呼び出し、結果を統合してレポートを生成します
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">
          <span>⚡</span>
          <span>TypeScript版 - 高速・並列実行対応</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-fit">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 入力</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                達成したいゴール *
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="例: 新しいオンライン英会話サービスを立ち上げて、6ヶ月で1000人の会員を獲得したい"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none min-h-[120px]"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRun}
              disabled={isRunning || !goal.trim()}
              className="w-full mt-6 px-6 py-4 rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  エージェント稼働中...
                </>
              ) : (
                <>
                  <RocketLaunchIcon className="w-5 h-5" />
                  エージェント実行
                </>
              )}
            </motion.button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Architecture Diagram */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-3">エージェント構成:</h3>
              <div className="text-xs text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>統括エージェント → 各エージェントに指示</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>├─ 市場調査エージェント</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>├─ 競合調査エージェント</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>└─ 戦略立案エージェント</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>レポート統合エージェント → 最終レポート</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Progress & Results */}
        <div className="space-y-6">
          {/* Progress Steps */}
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">⚙️ 実行状況</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-mono font-bold">{formatTime(elapsedTime)}</span>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-gray-700">進捗状況</span>
                  <span className="font-bold text-blue-600">{Math.round(getProgress())}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress()}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      step.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : step.status === 'running'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{step.name}</p>
                      {step.status === 'running' && (
                        <p className="text-xs text-blue-600">実行中...</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* エージェント結果（実行中もリアルタイム表示） */}
          {agentResults.length > 0 && !finalReport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 エージェント結果</h2>

              <div className="space-y-3">
                {agentResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleAgent(index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-gray-900">{result.agent}</span>
                      </div>
                      {openAgents[index] ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <AnimatePresence>
                      {openAgents[index] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-gray-200">
                            <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {result.result}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Final Report */}
          {finalReport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 最終レポート</h2>

              <div className="prose prose-sm max-w-none">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 mb-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {finalReport}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Individual Agent Results */}
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-bold text-gray-900">各エージェントの詳細結果:</h3>

                {agentResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleAgent(index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="font-bold text-gray-900">
                        {index + 1}. {result.agent}
                      </span>
                      {openAgents[index] ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </button>
                    <AnimatePresence>
                      {openAgents[index] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-gray-200">
                            <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {result.result}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <button
                onClick={() => {
                  const content = {
                    goal,
                    agentResults,
                    finalReport,
                  }
                  const blob = new Blob([JSON.stringify(content, null, 2)], {
                    type: 'application/json',
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'simple_agent_report.json'
                  a.click()
                }}
                className="w-full mt-6 px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-bold flex items-center justify-center gap-2"
              >
                <DocumentTextIcon className="w-5 h-5" />
                レポートをダウンロード
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
