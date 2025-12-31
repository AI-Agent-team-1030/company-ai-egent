'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  XMarkIcon,
  SparklesIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  Agent,
  AgentInput,
  AgentTool,
  AgentModel,
  AGENT_CATEGORIES,
  AGENT_TOOLS,
  AGENT_MODELS,
} from '@/lib/types/agent'

interface Props {
  agent: Agent | null
  onSave: (input: AgentInput) => void
  onCancel: () => void
  isSaving: boolean
}

export function AgentEditor({ agent, onSave, onCancel, isSaving }: Props) {
  const [formData, setFormData] = useState<AgentInput>({
    name: '',
    description: '',
    category: '汎用',
    systemPrompt: '',
    tools: ['knowledge_search'],
    model: 'auto',
    isShared: false,
  })
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // 編集時にフォームを初期化
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        category: agent.category,
        systemPrompt: agent.systemPrompt,
        tools: agent.tools,
        model: agent.model,
        maxTokens: agent.maxTokens,
        temperature: agent.temperature,
        isShared: agent.isShared,
        icon: agent.icon,
        color: agent.color,
      })
    }
  }, [agent])

  // AI自動生成
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt }),
      })

      if (!response.ok) throw new Error('Failed to generate')

      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        category: data.category || prev.category,
        systemPrompt: data.systemPrompt || prev.systemPrompt,
        tools: data.tools || prev.tools,
        model: data.model || prev.model,
      }))
    } catch (error) {
      console.error('Failed to generate agent:', error)
      alert('AI生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // ツール選択を切り替え
  const toggleTool = (tool: AgentTool) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool],
    }))
  }

  // バリデーション
  const isValid = formData.name.trim() && formData.systemPrompt.trim()

  // 保存
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSave(formData)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {agent ? 'エージェントを編集' : '新しいエージェントを作成'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* AI自動生成 */}
            {!agent && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-indigo-900">AIで自動生成</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="例: 顧客からの技術的な問い合わせに対応するエージェント"
                    className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm
                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                               hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        生成
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 基本情報 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  エージェント名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: カスタマーサポートエージェント"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="このエージェントの用途を簡潔に説明"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリ
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {AGENT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AIモデル
                  </label>
                  <select
                    value={formData.model}
                    onChange={e => setFormData(prev => ({ ...prev, model: e.target.value as AgentModel }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {AGENT_MODELS.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                        {model.requiresApiKey && ' (APIキー必要)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* システムプロンプト */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                システムプロンプト <span className="text-red-500">*</span>
              </label>
              <div className="flex items-start gap-2 mb-2">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  エージェントの役割、ガイドライン、回答形式などを定義します。
                </p>
              </div>
              <textarea
                value={formData.systemPrompt}
                onChange={e => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder={`例:
あなたはカスタマーサポートの専門家です。

## 役割
顧客からの問い合わせに対して、適切かつ丁寧な回答を提供してください。

## ガイドライン
- 共感的で親切な対応を心がける
- 正確な情報を提供する
- 社内ナレッジベースを参照して一貫性を確保`}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           font-mono text-sm"
              />
            </div>

            {/* ツール選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                利用可能なツール
              </label>
              <div className="grid grid-cols-2 gap-2">
                {AGENT_TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    disabled={!tool.isAvailable}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      formData.tools.includes(tool.id)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!tool.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {tool.name}
                      </span>
                      {formData.tools.includes(tool.id) && (
                        <CheckIcon className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                    {!tool.isAvailable && (
                      <span className="text-xs text-gray-400 mt-1 block">
                        (近日公開)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 共有設定（新規作成時のみ） */}
            {!agent && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isShared"
                  checked={formData.isShared}
                  onChange={e => setFormData(prev => ({ ...prev, isShared: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded
                             focus:ring-indigo-500"
                />
                <label htmlFor="isShared" className="text-sm text-gray-700">
                  <span className="font-medium">企業共有エージェントとして作成</span>
                  <p className="text-gray-500">
                    オンにすると、同じ企業の全ユーザーがこのエージェントを使用できます
                  </p>
                </label>
              </div>
            )}

            {/* 詳細設定（オプション） */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                詳細設定（オプション）
              </summary>
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最大トークン数
                    </label>
                    <input
                      type="number"
                      value={formData.maxTokens || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        maxTokens: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      placeholder="デフォルト"
                      min={100}
                      max={100000}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature
                    </label>
                    <input
                      type="number"
                      value={formData.temperature ?? ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        temperature: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                      placeholder="デフォルト"
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg
                                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>
        </form>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>保存</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
