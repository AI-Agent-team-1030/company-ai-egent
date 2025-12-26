/**
 * フォルダモーダルコンポーネント
 *
 * フォルダの作成・編集ダイアログ
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeFolder } from '../types'

interface FolderModalProps {
  isOpen: boolean
  editingFolder: KnowledgeFolder | null
  onClose: () => void
  onSubmit: (name: string) => void
}

export function FolderModal({ isOpen, editingFolder, onClose, onSubmit }: FolderModalProps) {
  const [folderName, setFolderName] = useState('')

  useEffect(() => {
    if (editingFolder) {
      setFolderName(editingFolder.name)
    } else {
      setFolderName('')
    }
  }, [editingFolder, isOpen])

  const handleSubmit = () => {
    if (folderName.trim()) {
      onSubmit(folderName.trim())
      setFolderName('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingFolder ? 'フォルダ名を変更' : '新しいフォルダ'}
            </h2>

            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
              placeholder="フォルダ名"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                disabled={!folderName.trim()}
                className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:bg-gray-300"
              >
                {editingFolder ? '変更' : '作成'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
