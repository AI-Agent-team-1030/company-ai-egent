/**
 * 処理ステータスコンポーネント
 *
 * アップロード・処理中の進捗表示
 */

'use client'

import type { ProcessingStatus as ProcessingStatusType } from '../types'

interface ProcessingStatusProps {
  status: ProcessingStatusType
}

export function ProcessingStatus({ status }: ProcessingStatusProps) {
  if (Object.keys(status).length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      {Object.entries(status).map(([id, item]) => (
        <div
          key={id}
          className={`rounded-lg p-4 ${
            item.status === 'error'
              ? 'bg-red-50 border border-red-200'
              : item.status === 'completed'
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className={`text-sm font-medium ${
                item.status === 'error'
                  ? 'text-red-800'
                  : item.status === 'completed'
                    ? 'text-green-800'
                    : 'text-blue-800'
              }`}
            >
              {item.message}
            </p>
            <span
              className={`text-xs font-bold ${
                item.status === 'error'
                  ? 'text-red-600'
                  : item.status === 'completed'
                    ? 'text-green-600'
                    : 'text-blue-600'
              }`}
            >
              {item.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                item.status === 'error'
                  ? 'bg-red-600'
                  : item.status === 'completed'
                    ? 'bg-green-600'
                    : 'bg-blue-600'
              }`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
