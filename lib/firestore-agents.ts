/**
 * エージェントのFirestore操作
 *
 * 個人エージェント: profiles/{userId}/agents
 * 企業共有エージェント: companies/{companyId}/agents
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  increment,
} from 'firebase/firestore'
import { db } from './firebase'
import { logger } from './logger'
import { Agent, AgentInput, AgentTool, AgentModel } from './types/agent'
import { BUILT_IN_AGENTS } from './built-in-agents'

// ============================================
// 組み込みエージェント取得
// ============================================

/**
 * 組み込みエージェント一覧を取得
 */
export function getBuiltInAgents(): Agent[] {
  return BUILT_IN_AGENTS
}

// ============================================
// 個人エージェント操作
// ============================================

/**
 * 個人エージェント一覧を取得
 */
export async function getPersonalAgents(userId: string): Promise<Agent[]> {
  try {
    const agentsRef = collection(db, 'profiles', userId, 'agents')
    const q = query(agentsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data()
      return {
        id: docSnapshot.id,
        name: data.name,
        description: data.description,
        category: data.category,
        systemPrompt: data.systemPrompt,
        tools: (data.tools || []) as AgentTool[],
        model: (data.model || 'auto') as AgentModel,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        isBuiltIn: false,
        isShared: false,
        icon: data.icon,
        color: data.color,
        tags: data.tags,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })
  } catch (error) {
    logger.error('Failed to get personal agents:', error)
    return []
  }
}

// ============================================
// 企業共有エージェント操作
// ============================================

/**
 * 企業共有エージェント一覧を取得
 */
export async function getCompanyAgents(companyId: string): Promise<Agent[]> {
  try {
    const agentsRef = collection(db, 'companies', companyId, 'agents')
    const q = query(agentsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data()
      return {
        id: docSnapshot.id,
        name: data.name,
        description: data.description,
        category: data.category,
        systemPrompt: data.systemPrompt,
        tools: (data.tools || []) as AgentTool[],
        model: (data.model || 'auto') as AgentModel,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        isBuiltIn: false,
        isShared: true,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        icon: data.icon,
        color: data.color,
        tags: data.tags,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })
  } catch (error) {
    logger.error('Failed to get company agents:', error)
    return []
  }
}

// ============================================
// 統合取得
// ============================================

/**
 * 全エージェント取得（組み込み + 企業共有 + 個人）
 */
export async function getAllAgents(
  userId: string,
  companyId: string
): Promise<Agent[]> {
  const [personal, shared] = await Promise.all([
    getPersonalAgents(userId),
    getCompanyAgents(companyId),
  ])

  // 組み込み → 企業共有 → 個人 の順序で返す
  return [...BUILT_IN_AGENTS, ...shared, ...personal]
}

/**
 * IDでエージェントを取得
 */
export async function getAgentById(
  agentId: string,
  userId: string,
  companyId: string
): Promise<Agent | null> {
  try {
    // まず組み込みエージェントを確認
    const builtIn = BUILT_IN_AGENTS.find(a => a.id === agentId)
    if (builtIn) {
      return builtIn
    }

    // 企業共有エージェントを確認
    const companyAgentRef = doc(db, 'companies', companyId, 'agents', agentId)
    const companySnapshot = await getDoc(companyAgentRef)
    if (companySnapshot.exists()) {
      const data = companySnapshot.data()
      return {
        id: companySnapshot.id,
        name: data.name,
        description: data.description,
        category: data.category,
        systemPrompt: data.systemPrompt,
        tools: (data.tools || []) as AgentTool[],
        model: (data.model || 'auto') as AgentModel,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        isBuiltIn: false,
        isShared: true,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        icon: data.icon,
        color: data.color,
        tags: data.tags,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    }

    // 個人エージェントを確認
    const personalAgentRef = doc(db, 'profiles', userId, 'agents', agentId)
    const personalSnapshot = await getDoc(personalAgentRef)
    if (personalSnapshot.exists()) {
      const data = personalSnapshot.data()
      return {
        id: personalSnapshot.id,
        name: data.name,
        description: data.description,
        category: data.category,
        systemPrompt: data.systemPrompt,
        tools: (data.tools || []) as AgentTool[],
        model: (data.model || 'auto') as AgentModel,
        maxTokens: data.maxTokens,
        temperature: data.temperature,
        isBuiltIn: false,
        isShared: false,
        icon: data.icon,
        color: data.color,
        tags: data.tags,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    }

    return null
  } catch (error) {
    logger.error('Failed to get agent by id:', error)
    return null
  }
}

// ============================================
// CRUD操作
// ============================================

/**
 * エージェントを追加
 */
export async function createAgent(
  userId: string,
  companyId: string,
  input: AgentInput,
  userName?: string
): Promise<string | null> {
  try {
    const now = Timestamp.now()
    const isShared = input.isShared ?? false

    const agentData = {
      name: input.name,
      description: input.description,
      category: input.category,
      systemPrompt: input.systemPrompt,
      tools: input.tools,
      model: input.model,
      maxTokens: input.maxTokens || null,
      temperature: input.temperature || null,
      icon: input.icon || null,
      color: input.color || null,
      tags: input.tags || null,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    if (isShared) {
      // 企業共有エージェント
      const agentsRef = collection(db, 'companies', companyId, 'agents')
      const docRef = await addDoc(agentsRef, {
        ...agentData,
        createdBy: userId,
        createdByName: userName || '',
      })
      return docRef.id
    } else {
      // 個人エージェント
      const agentsRef = collection(db, 'profiles', userId, 'agents')
      const docRef = await addDoc(agentsRef, agentData)
      return docRef.id
    }
  } catch (error) {
    logger.error('Failed to create agent:', error)
    return null
  }
}

/**
 * エージェントを更新
 */
export async function updateAgent(
  userId: string,
  companyId: string,
  agentId: string,
  input: AgentInput,
  isCurrentlyShared: boolean
): Promise<boolean> {
  try {
    const collectionPath = isCurrentlyShared
      ? `companies/${companyId}/agents`
      : `profiles/${userId}/agents`

    const agentRef = doc(db, collectionPath, agentId)

    await updateDoc(agentRef, {
      name: input.name,
      description: input.description,
      category: input.category,
      systemPrompt: input.systemPrompt,
      tools: input.tools,
      model: input.model,
      maxTokens: input.maxTokens || null,
      temperature: input.temperature || null,
      icon: input.icon || null,
      color: input.color || null,
      tags: input.tags || null,
      updatedAt: Timestamp.now(),
    })

    return true
  } catch (error) {
    logger.error('Failed to update agent:', error)
    return false
  }
}

/**
 * エージェントを削除
 */
export async function deleteAgent(
  userId: string,
  companyId: string,
  agentId: string,
  isShared: boolean
): Promise<boolean> {
  try {
    const collectionPath = isShared
      ? `companies/${companyId}/agents`
      : `profiles/${userId}/agents`

    const agentRef = doc(db, collectionPath, agentId)
    await deleteDoc(agentRef)
    return true
  } catch (error) {
    logger.error('Failed to delete agent:', error)
    return false
  }
}

/**
 * エージェントの使用回数をインクリメント
 */
export async function incrementAgentUsage(
  agentId: string,
  userId: string,
  companyId: string,
  isShared: boolean
): Promise<void> {
  try {
    // 組み込みエージェントは使用回数を記録しない
    const builtIn = BUILT_IN_AGENTS.find(a => a.id === agentId)
    if (builtIn) {
      return
    }

    const collectionPath = isShared
      ? `companies/${companyId}/agents`
      : `profiles/${userId}/agents`

    const agentRef = doc(db, collectionPath, agentId)
    await updateDoc(agentRef, {
      usageCount: increment(1),
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    logger.error('Failed to increment agent usage:', error)
  }
}

// ============================================
// マイグレーション用（テンプレートからエージェントへ）
// ============================================

/**
 * 既存のテンプレートをエージェントに変換
 */
export function convertTemplateToAgent(template: {
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
}): Agent {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    systemPrompt: template.prompt,
    tools: ['knowledge_search'],  // デフォルトでナレッジ検索を有効化
    model: 'auto',
    isBuiltIn: false,
    isShared: template.isShared,
    createdBy: template.createdBy,
    createdByName: template.createdByName,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }
}

// ============================================
// 下位互換性のためのエイリアス（将来削除予定）
// ============================================

export const getCustomAgents = getCompanyAgents
export const addCustomAgent = async (
  companyId: string,
  input: AgentInput,
  userName?: string
) => createAgent('', companyId, { ...input, isShared: true }, userName)
export const updateCustomAgent = async (
  companyId: string,
  agentId: string,
  input: AgentInput
) => updateAgent('', companyId, agentId, input, true)
export const deleteCustomAgent = async (
  companyId: string,
  agentId: string
) => deleteAgent('', companyId, agentId, true)
