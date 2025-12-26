'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import {
  getAllTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  CustomPromptTemplate,
  CustomPromptTemplateInput,
} from '@/lib/firestore-templates'
import { TEMPLATE_CATEGORIES } from '@/app/(app)/chat/constants'
import { settingsLogger } from '@/lib/logger'

interface Props {
  companyId: string
  userId: string
  userName?: string
}

interface GeneratedTemplate {
  name: string
  category: string
  description: string
  prompt: string
}

export function TemplateManager({ companyId, userId, userName }: Props) {
  const [templates, setTemplates] = useState<CustomPromptTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CustomPromptTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // AI生成関連
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // フォーム状態
  const [formData, setFormData] = useState<CustomPromptTemplateInput>({
    name: '',
    category: '業務効率化',
    description: '',
    prompt: '',
    isShared: false,
  })

  // テンプレート一覧を取得
  useEffect(() => {
    loadTemplates()
  }, [companyId, userId])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const data = await getAllTemplates(userId, companyId)
      setTemplates(data)
    } catch (error) {
      settingsLogger.error('Failed to load templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // AIでテンプレートを生成
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return

    setIsGenerating(true)
    setGenerateError(null)

    try {
      const response = await fetch('/api/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt }),
      })

      if (!response.ok) {
        throw new Error('テンプレート生成に失敗しました')
      }

      const result: GeneratedTemplate = await response.json()

      // フォームに反映して編集モードに
      setFormData({
        name: result.name,
        category: result.category,
        description: result.description,
        prompt: result.prompt,
        isShared: false,
      })
      setEditingTemplate(null)
      setIsEditing(true)
      setAiPrompt('')
    } catch (error) {
      settingsLogger.error('Failed to generate template:', error)
      setGenerateError('テンプレートの生成に失敗しました。もう一度お試しください。')
    } finally {
      setIsGenerating(false)
    }
  }

  // 新規作成モードを開始
  const handleStartCreate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      category: '業務効率化',
      description: '',
      prompt: '',
      isShared: false,
    })
    setIsEditing(true)
  }

  // 編集モードを開始
  const handleStartEdit = (template: CustomPromptTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      description: template.description,
      prompt: template.prompt,
      isShared: template.isShared,
    })
    setIsEditing(true)
  }

  // 編集をキャンセル
  const handleCancel = () => {
    setIsEditing(false)
    setEditingTemplate(null)
    setFormData({
      name: '',
      category: '業務効率化',
      description: '',
      prompt: '',
      isShared: false,
    })
  }

  // 保存
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      alert('テンプレート名とプロンプトは必須です')
      return
    }

    setIsSaving(true)
    try {
      if (editingTemplate) {
        // 更新
        const success = await updateTemplate(
          userId,
          companyId,
          editingTemplate.id,
          formData,
          editingTemplate.isShared
        )
        if (!success) throw new Error('Failed to update')
      } else {
        // 新規作成
        const id = await addTemplate(userId, companyId, formData, userName)
        if (!id) throw new Error('Failed to create')
      }

      await loadTemplates()
      handleCancel()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      settingsLogger.error('Failed to save template:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // 削除
  const handleDelete = async (template: CustomPromptTemplate) => {
    if (!confirm(`「${template.name}」を削除しますか？`)) return

    try {
      const success = await deleteTemplate(userId, companyId, template.id, template.isShared)
      if (!success) throw new Error('Failed to delete')
      await loadTemplates()
    } catch (error) {
      settingsLogger.error('Failed to delete template:', error)
      alert('削除に失敗しました')
    }
  }

  // カテゴリーのみ取得（"all"を除く）
  const categories = TEMPLATE_CATEGORIES.filter(c => c.id !== 'all')

  // 共有テンプレートと個人テンプレートを分離
  const sharedTemplates = templates.filter(t => t.isShared)
  const personalTemplates = templates.filter(t => !t.isShared)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
    >
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">プロンプトテンプレート</h2>
              <p className="text-sm text-gray-600 mt-1">
                よく使うプロンプトをテンプレートとして保存
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              新規作成
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* AI生成セクション */}
        {!isEditing && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-purple-900">AIでテンプレートを作成</h3>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              作りたいテンプレートを説明してください。AIが自動でテンプレートを生成します。
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && aiPrompt.trim()) {
                    handleAiGenerate()
                  }
                }}
                placeholder="例: 顧客向けの週次報告書を作成するテンプレート"
                className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                disabled={isGenerating}
              />
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
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
            {generateError && (
              <p className="text-sm text-red-600 mt-2">{generateError}</p>
            )}
          </div>
        )}

        {/* 成功メッセージ */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-600"
            >
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">保存しました</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 編集フォーム */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">
                  {editingTemplate ? 'テンプレートを編集' : '新しいテンプレート'}
                </h3>
                <button onClick={handleCancel} className="p-1 hover:bg-gray-200 rounded">
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    テンプレート名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: 週次報告書作成"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリー
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="例: 週次の進捗報告書を作成"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  プロンプト <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  placeholder="プロンプトの内容を入力してください。[変数名]の形式でユーザーが入力する部分を示せます。"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  [顧客名] のように括弧で囲むと、ユーザーが入力すべき箇所が分かりやすくなります
                </p>
              </div>

              {/* 共有設定 - 新規作成時のみ表示 */}
              {!editingTemplate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isShared}
                      onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="font-medium text-blue-900">企業で共有</span>
                        <p className="text-xs text-blue-700">
                          ONにすると、同じ企業のメンバー全員がこのテンプレートを使用できます
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !formData.name.trim() || !formData.prompt.trim()}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  キャンセル
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* テンプレート一覧 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>テンプレートはまだありません</p>
            <p className="text-sm mt-1">上のAI生成か「新規作成」からテンプレートを追加してください</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 企業共有テンプレート */}
            {sharedTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">企業共有テンプレート</h4>
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {sharedTemplates.length}件
                  </span>
                </div>
                <div className="space-y-3">
                  {sharedTemplates.map(template => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      onEdit={handleStartEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 個人テンプレート */}
            {personalTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <h4 className="font-medium text-gray-900">個人テンプレート</h4>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {personalTemplates.length}件
                  </span>
                </div>
                <div className="space-y-3">
                  {personalTemplates.map(template => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      onEdit={handleStartEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ヒント */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">テンプレートの使い方</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>チャット画面の「テンプレート」ボタンから選択できます</li>
            <li>「企業で共有」をONにすると、同じ企業のメンバー全員が使えます</li>
            <li>個人テンプレートは自分だけが使用できます</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

// テンプレートアイテムコンポーネント
function TemplateItem({
  template,
  onEdit,
  onDelete,
}: {
  template: CustomPromptTemplate
  onEdit: (template: CustomPromptTemplate) => void
  onDelete: (template: CustomPromptTemplate) => void
}) {
  return (
    <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-gray-900">{template.name}</h4>
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            {template.category}
          </span>
          {template.isShared ? (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
              <BuildingOfficeIcon className="w-3 h-3" />
              共有
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              個人
            </span>
          )}
        </div>
        {template.description && (
          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
        )}
        {template.createdByName && (
          <p className="text-xs text-gray-400 mt-1">作成者: {template.createdByName}</p>
        )}
        <p className="text-xs text-gray-400 mt-2 line-clamp-2 font-mono">
          {template.prompt.substring(0, 100)}...
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={() => onEdit(template)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="編集"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(template)}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          title="削除"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
