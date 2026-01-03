/**
 * 統合結果表示コンポーネント
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'
import type { AgentExecution } from '../types'

interface IntegratedResultProps {
  result: string
  agentExecutions: Map<string, AgentExecution>
}

export function IntegratedResult({
  result,
  agentExecutions,
}: IntegratedResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // 完了したエージェントの数を計算
  const completedCount = Array.from(agentExecutions.values()).filter(
    (e) => e.status === 'completed'
  ).length
  const totalCount = agentExecutions.size

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">統合結果</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {completedCount} / {totalCount} エージェントの結果を統合
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {copied ? (
            <>
              <CheckIcon className="w-5 h-5" />
              コピー済み
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-5 h-5" />
              コピー
            </>
          )}
        </button>
      </div>

      {/* 結果本文 */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {result}
        </div>
      </div>
    </motion.div>
  )
}
