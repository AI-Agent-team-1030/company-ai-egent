/**
 * エージェント履歴のFirestore操作
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface AgentExecution {
  id: string
  userId: string
  companyId?: string
  taskInput: string
  taskSummary: string
  orchestrationPlan: {
    taskAnalysis: string
    complexity: 'simple' | 'moderate' | 'complex'
    agents: Array<{
      name: string
      role: string
      tools: string[]
    }>
  }
  agentResults: Array<{
    agentName: string
    status: 'completed' | 'failed'
    result?: string
    error?: string
  }>
  integratedResult: string
  status: 'completed' | 'failed' | 'cancelled'
  createdAt: Date | Timestamp
  completedAt?: Date | Timestamp
}

/**
 * エージェント実行履歴を保存
 */
export async function saveAgentExecution(
  execution: Omit<AgentExecution, 'id' | 'createdAt'>
): Promise<string> {
  const executionsRef = collection(db, 'agentExecutions')
  const newDocRef = doc(executionsRef)

  await setDoc(newDocRef, {
    ...execution,
    id: newDocRef.id,
    createdAt: serverTimestamp(),
  })

  return newDocRef.id
}

/**
 * ユーザーのエージェント実行履歴を取得
 */
export async function getAgentExecutions(
  userId: string,
  limitCount: number = 50
): Promise<AgentExecution[]> {
  const executionsRef = collection(db, 'agentExecutions')
  const q = query(
    executionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      completedAt: data.completedAt?.toDate?.() || undefined,
    } as AgentExecution
  })
}

/**
 * 特定のエージェント実行履歴を取得
 */
export async function getAgentExecution(executionId: string): Promise<AgentExecution | null> {
  const docRef = doc(db, 'agentExecutions', executionId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    completedAt: data.completedAt?.toDate?.() || undefined,
  } as AgentExecution
}

/**
 * エージェント実行履歴を削除
 */
export async function deleteAgentExecution(executionId: string): Promise<void> {
  const docRef = doc(db, 'agentExecutions', executionId)
  await deleteDoc(docRef)
}

/**
 * タスク入力からサマリーを生成
 */
export function generateTaskSummary(taskInput: string, maxLength: number = 50): string {
  const cleaned = taskInput.trim().replace(/\n/g, ' ')
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  return cleaned.substring(0, maxLength) + '...'
}
