/**
 * ナレッジヘッダーコンポーネント
 *
 * タイトル、アップロードボタン、Googleドライブ連携表示
 */

'use client'

import { CloudArrowUpIcon, CloudIcon } from '@heroicons/react/24/outline'
import type { CompanyDriveConnection } from '@/lib/firestore-chat'

interface KnowledgeHeaderProps {
  uploading: boolean
  companyDriveConnection: CompanyDriveConnection | null
  onDrivePickerOpen: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function KnowledgeHeader({
  uploading,
  companyDriveConnection,
  onDrivePickerOpen,
  onFileUpload,
}: KnowledgeHeaderProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">ナレッジボックス</h1>
          <p className="text-sm md:text-base text-gray-600">
            ドキュメントをアップロードすると、チャットで自動検索されます
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Googleドライブからインポート */}
          {companyDriveConnection?.isConnected && (
            <button
              onClick={onDrivePickerOpen}
              disabled={uploading}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm md:text-base w-full sm:w-auto disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <CloudIcon className="w-5 h-5" />
              Googleドライブから
            </button>
          )}

          {/* 直接アップロード */}
          <label className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold cursor-pointer text-sm md:text-base w-full sm:w-auto">
            <CloudArrowUpIcon className="w-5 h-5" />
            {uploading ? 'アップロード中...' : 'ドキュメント追加'}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.txt,.md,.docx,.xlsx,.xls,.pptx,.ppt,.csv,.png,.jpg,.jpeg,.gif,.webp"
              onChange={onFileUpload}
              disabled={uploading}
              multiple
            />
          </label>
        </div>
      </div>

      {/* Googleドライブ未接続の案内 */}
      {!companyDriveConnection?.isConnected && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CloudIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Googleドライブ連携</p>
              <p className="text-sm text-blue-600">
                設定からGoogleドライブを接続すると、ドライブからファイルを直接インポートできます
              </p>
            </div>
          </div>
          <a
            href="/settings"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
          >
            設定を開く
          </a>
        </div>
      )}
    </>
  )
}
