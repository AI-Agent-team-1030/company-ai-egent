/**
 * フォルダリストコンポーネント
 *
 * フォルダナビゲーション、作成・編集・削除機能
 * ドラッグ&ドロップでドキュメントを受け入れ可能
 */

'use client'

import { useState } from 'react'
import {
  PlusIcon,
  TrashIcon,
  FolderIcon,
  FolderOpenIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import type { KnowledgeDocument, KnowledgeFolder } from '../types'

interface FolderListProps {
  folders: KnowledgeFolder[]
  documents: KnowledgeDocument[]
  selectedFolderId: string | null
  onFolderSelect: (folderId: string | null) => void
  onCreateFolder: () => void
  onEditFolder: (folder: KnowledgeFolder) => void
  onDeleteFolder: (folderId: string) => void
  onMoveDocument?: (docId: string, folderId: string | null) => void
}

export function FolderList({
  folders,
  documents,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveDocument,
}: FolderListProps) {
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'all'>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault()
    const documentId = e.dataTransfer.getData('documentId')
    if (documentId && onMoveDocument) {
      onMoveDocument(documentId, folderId)
    }
    setDragOverFolderId(null)
  }

  const handleDragEnter = (folderId: string | null | 'all') => {
    setDragOverFolderId(folderId)
  }

  const handleDragLeave = () => {
    setDragOverFolderId(null)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">フォルダ</h2>
        <button
          onClick={onCreateFolder}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          新規フォルダ
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {/* All - ドロップでフォルダから外す */}
        <button
          onClick={() => onFolderSelect(null)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null)}
          onDragEnter={() => handleDragEnter('all')}
          onDragLeave={handleDragLeave}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
            dragOverFolderId === 'all'
              ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300'
              : selectedFolderId === null
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
          }`}
        >
          <FolderOpenIcon className="w-5 h-5" />
          <span className="font-medium">すべて</span>
          <span className="text-xs opacity-75">({documents.length})</span>
        </button>

        {folders.map((folder) => {
          const count = documents.filter((d) => d.folderId === folder.id).length
          const isDragOver = dragOverFolderId === folder.id
          return (
            <div key={folder.id} className="relative group">
              <button
                onClick={() => onFolderSelect(folder.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, folder.id)}
                onDragEnter={() => handleDragEnter(folder.id)}
                onDragLeave={handleDragLeave}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all whitespace-nowrap ${
                  isDragOver
                    ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300 scale-105'
                    : selectedFolderId === folder.id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                <FolderIcon className="w-5 h-5" />
                <span className="font-medium">{folder.name}</span>
                <span className="text-xs opacity-75">({count})</span>
              </button>

              <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditFolder(folder)
                  }}
                  className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <PencilIcon className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteFolder(folder.id)
                  }}
                  className="p-1.5 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                >
                  <TrashIcon className="w-3 h-3 text-red-600" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedFolderId && (
        <p className="text-sm text-gray-500 mt-2">
          「{folders.find((f) => f.id === selectedFolderId)?.name}」に保存されます
        </p>
      )}

      <p className="text-xs text-gray-400 mt-2">
        ドキュメントをドラッグしてフォルダに移動できます
      </p>
    </div>
  )
}
