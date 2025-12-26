/**
 * ナレッジページ
 *
 * ドキュメント管理とフォルダ整理機能
 * コンポーネントとフックに分割してリファクタリング済み
 */

'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import GoogleDrivePicker from '@/components/ui/GoogleDrivePicker'
import { useDocuments } from './hooks'
import {
  KnowledgeHeader,
  FolderList,
  DocumentList,
  ProcessingStatus,
  FolderModal,
} from './components'
import type { KnowledgeFolder } from './types'

export default function KnowledgePage() {
  const {
    documents,
    folders,
    selectedFolderId,
    setSelectedFolderId,
    loading,
    uploading,
    error,
    processingStatus,
    companyDriveConnection,
    filteredDocuments,
    handleCreateFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleDeleteDocument,
    handleDriveImport,
    handleFileUpload,
  } = useDocuments()

  // Modal state
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState<KnowledgeFolder | null>(null)
  const [showDrivePicker, setShowDrivePicker] = useState(false)

  const handleFolderSubmit = async (name: string) => {
    if (editingFolder) {
      const success = await handleUpdateFolder(editingFolder.id, name)
      if (success) {
        setEditingFolder(null)
        setShowFolderModal(false)
      }
    } else {
      const success = await handleCreateFolder(name)
      if (success) {
        setShowFolderModal(false)
      }
    }
  }

  const openCreateFolderModal = () => {
    setEditingFolder(null)
    setShowFolderModal(true)
  }

  const openEditFolderModal = (folder: KnowledgeFolder) => {
    setEditingFolder(folder)
    setShowFolderModal(true)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <KnowledgeHeader
        uploading={uploading}
        companyDriveConnection={companyDriveConnection}
        onDrivePickerOpen={() => setShowDrivePicker(true)}
        onFileUpload={handleFileInputChange}
      />

      <ProcessingStatus status={processingStatus} />

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">
            <strong>エラー:</strong> {error}
          </p>
        </div>
      )}

      <FolderList
        folders={folders}
        documents={documents}
        selectedFolderId={selectedFolderId}
        onFolderSelect={setSelectedFolderId}
        onCreateFolder={openCreateFolderModal}
        onEditFolder={openEditFolderModal}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">ドキュメント数</p>
          <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">フォルダ数</p>
          <p className="text-2xl font-bold text-gray-900">{folders.length}</p>
        </div>
      </div>

      <DocumentList
        documents={filteredDocuments}
        folders={folders}
        loading={loading}
        onDelete={handleDeleteDocument}
      />

      <FolderModal
        isOpen={showFolderModal}
        editingFolder={editingFolder}
        onClose={() => {
          setShowFolderModal(false)
          setEditingFolder(null)
        }}
        onSubmit={handleFolderSubmit}
      />

      {/* Google Drive Picker */}
      <AnimatePresence>
        {showDrivePicker && (
          <GoogleDrivePicker
            onSelect={(files) => {
              setShowDrivePicker(false)
              handleDriveImport(files)
            }}
            onClose={() => setShowDrivePicker(false)}
            multiSelect={true}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
