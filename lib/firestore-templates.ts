/**
 * カスタムプロンプトテンプレートのFirestore操作
 *
 * 個人テンプレート: profiles/{userId}/promptTemplates
 * 企業共有テンプレート: companies/{companyId}/promptTemplates
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { logger } from './logger'

export interface CustomPromptTemplate {
  id: string
  name: string
  category: string
  description: string
  prompt: string
  isShared: boolean
  createdBy?: string
  createdByName?: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomPromptTemplateInput {
  name: string
  category: string
  description: string
  prompt: string
  isShared?: boolean
}

/**
 * 個人テンプレート一覧を取得
 */
export async function getPersonalTemplates(userId: string): Promise<CustomPromptTemplate[]> {
  try {
    const templatesRef = collection(db, 'profiles', userId, 'promptTemplates')
    const q = query(templatesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        description: data.description,
        prompt: data.prompt,
        isShared: false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })
  } catch (error) {
    logger.error('Failed to get personal templates:', error)
    return []
  }
}

/**
 * 企業共有テンプレート一覧を取得
 */
export async function getCompanyTemplates(companyId: string): Promise<CustomPromptTemplate[]> {
  try {
    const templatesRef = collection(db, 'companies', companyId, 'promptTemplates')
    const q = query(templatesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        description: data.description,
        prompt: data.prompt,
        isShared: true,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })
  } catch (error) {
    logger.error('Failed to get company templates:', error)
    return []
  }
}

/**
 * 全テンプレート取得（個人 + 企業共有）
 */
export async function getAllTemplates(
  userId: string,
  companyId: string
): Promise<CustomPromptTemplate[]> {
  const [personal, shared] = await Promise.all([
    getPersonalTemplates(userId),
    getCompanyTemplates(companyId),
  ])
  return [...shared, ...personal]
}

/**
 * テンプレートを追加
 */
export async function addTemplate(
  userId: string,
  companyId: string,
  template: CustomPromptTemplateInput,
  userName?: string
): Promise<string | null> {
  try {
    const now = Timestamp.now()
    const isShared = template.isShared ?? false

    if (isShared) {
      // 企業共有テンプレート
      const templatesRef = collection(db, 'companies', companyId, 'promptTemplates')
      const docRef = await addDoc(templatesRef, {
        name: template.name,
        category: template.category,
        description: template.description,
        prompt: template.prompt,
        createdBy: userId,
        createdByName: userName || '',
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    } else {
      // 個人テンプレート
      const templatesRef = collection(db, 'profiles', userId, 'promptTemplates')
      const docRef = await addDoc(templatesRef, {
        name: template.name,
        category: template.category,
        description: template.description,
        prompt: template.prompt,
        createdAt: now,
        updatedAt: now,
      })
      return docRef.id
    }
  } catch (error) {
    logger.error('Failed to add template:', error)
    return null
  }
}

/**
 * テンプレートを更新
 */
export async function updateTemplate(
  userId: string,
  companyId: string,
  templateId: string,
  template: CustomPromptTemplateInput,
  isCurrentlyShared: boolean
): Promise<boolean> {
  try {
    const collectionPath = isCurrentlyShared
      ? `companies/${companyId}/promptTemplates`
      : `profiles/${userId}/promptTemplates`

    const templateRef = doc(db, collectionPath, templateId)

    await updateDoc(templateRef, {
      name: template.name,
      category: template.category,
      description: template.description,
      prompt: template.prompt,
      updatedAt: Timestamp.now(),
    })

    return true
  } catch (error) {
    logger.error('Failed to update template:', error)
    return false
  }
}

/**
 * テンプレートを削除
 */
export async function deleteTemplate(
  userId: string,
  companyId: string,
  templateId: string,
  isShared: boolean
): Promise<boolean> {
  try {
    const collectionPath = isShared
      ? `companies/${companyId}/promptTemplates`
      : `profiles/${userId}/promptTemplates`

    const templateRef = doc(db, collectionPath, templateId)
    await deleteDoc(templateRef)
    return true
  } catch (error) {
    logger.error('Failed to delete template:', error)
    return false
  }
}

// 下位互換性のためのエイリアス
export const getCustomTemplates = getCompanyTemplates
export const addCustomTemplate = async (
  companyId: string,
  template: CustomPromptTemplateInput
) => addTemplate('', companyId, { ...template, isShared: true })
export const updateCustomTemplate = async (
  companyId: string,
  templateId: string,
  template: CustomPromptTemplateInput
) => updateTemplate('', companyId, templateId, template, true)
export const deleteCustomTemplate = async (
  companyId: string,
  templateId: string
) => deleteTemplate('', companyId, templateId, true)
