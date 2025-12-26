import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { firestoreLogger } from './logger'

// 会話一覧を取得
export async function getConversations(userId: string) {
  try {
    // インデックスなしで動くようにorderByを削除し、JS側でソート
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)
    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }))
    // updatedAtで降順ソートして最新50件を返す
    return conversations
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 50)
  } catch (error: any) {
    // インデックスエラーは警告のみ（初回セットアップ時は発生しうる）
    if (error?.code === 'failed-precondition') {
      firestoreLogger.warn('Firestore index required. This is normal for first setup.')
    }
    return []
  }
}

// 新しい会話を作成
export async function createConversation(userId: string, title: string = '新しい会話') {
  try {
    const docRef = await addDoc(collection(db, 'conversations'), {
      userId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id, title, userId }
  } catch (error) {
    firestoreLogger.error('Error creating conversation:', error)
    throw error
  }
}

// 会話を取得
export async function getConversation(conversationId: string) {
  try {
    const docSnap = await getDoc(doc(db, 'conversations', conversationId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error) {
    firestoreLogger.error('Error getting conversation:', error)
    return null
  }
}

// 会話のタイトルを更新
export async function updateConversationTitle(conversationId: string, title: string) {
  try {
    await updateDoc(doc(db, 'conversations', conversationId), {
      title,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    firestoreLogger.error('Error updating conversation title:', error)
    throw error
  }
}

// 会話を削除
export async function deleteConversation(conversationId: string) {
  try {
    // まずメッセージを削除
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages')
    )
    const messagesSnapshot = await getDocs(messagesQuery)
    const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    // 会話を削除
    await deleteDoc(doc(db, 'conversations', conversationId))
  } catch (error) {
    firestoreLogger.error('Error deleting conversation:', error)
    throw error
  }
}

// メッセージ一覧を取得
export async function getMessages(conversationId: string) {
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }))
  } catch (error) {
    firestoreLogger.error('Error getting messages:', error)
    return []
  }
}

// メッセージを追加
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  citations?: any[]
) {
  try {
    const docRef = await addDoc(
      collection(db, 'conversations', conversationId, 'messages'),
      {
        role,
        content,
        citations: citations || [],
        createdAt: serverTimestamp(),
      }
    )

    // 会話のupdatedAtを更新
    await updateDoc(doc(db, 'conversations', conversationId), {
      updatedAt: serverTimestamp(),
    })

    return { id: docRef.id, role, content, citations }
  } catch (error) {
    firestoreLogger.error('Error adding message:', error)
    throw error
  }
}

// File Search Store情報を保存
export async function saveFileSearchStore(
  userId: string,
  companyId: string,
  storeName: string,
  displayName: string
) {
  try {
    const docRef = await addDoc(collection(db, 'fileSearchStores'), {
      userId,
      companyId,
      storeName,
      displayName,
      createdAt: serverTimestamp(),
    })
    return { id: docRef.id, storeName, displayName }
  } catch (error) {
    firestoreLogger.error('Error saving file search store:', error)
    throw error
  }
}

// Company の File Search Store を取得
export async function getCompanyFileSearchStores(companyId: string) {
  try {
    const q = query(
      collection(db, 'fileSearchStores'),
      where('companyId', '==', companyId)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    firestoreLogger.error('Error getting file search stores:', error)
    return []
  }
}

// アップロードしたドキュメント情報を保存
export async function saveUploadedDocument(
  userId: string,
  companyId: string,
  fileName: string,
  originalFileName: string,
  geminiFileName: string,
  storeName: string,
  folderId?: string | null
) {
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      userId,
      companyId,
      fileName,
      originalFileName,
      geminiFileName,
      storeName,
      folderId: folderId || null,
      createdAt: serverTimestamp(),
    })
    return { id: docRef.id }
  } catch (error) {
    firestoreLogger.error('Error saving document:', error)
    throw error
  }
}

// ドキュメント一覧を取得
export async function getDocuments(companyId: string) {
  try {
    // インデックスなしで動くようにorderByを削除し、JS側でソート
    const q = query(
      collection(db, 'documents'),
      where('companyId', '==', companyId)
    )
    const snapshot = await getDocs(q)
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }))
    // createdAtで降順ソート
    return docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error: any) {
    if (error?.code !== 'failed-precondition') {
      firestoreLogger.warn('Error getting documents:', error?.message)
    }
    return []
  }
}

// 会社のAIモデル設定
export interface CompanyAISettings {
  enabledProviders: string[] // 有効なプロバイダーID
  enabledModels: { [providerId: string]: string[] } // プロバイダーごとの有効なモデル
  defaultProvider: string // デフォルトのプロバイダー
  defaultModel: string // デフォルトのモデル
}

// 会社のAI設定を取得
export async function getCompanyAISettings(companyId: string): Promise<CompanyAISettings | null> {
  try {
    const docSnap = await getDoc(doc(db, 'companies', companyId))
    if (docSnap.exists()) {
      const data = docSnap.data()
      return data.aiSettings || null
    }
    return null
  } catch (error) {
    firestoreLogger.error('Error getting company AI settings:', error)
    return null
  }
}

// 会社のAI設定を更新
export async function updateCompanyAISettings(
  companyId: string,
  settings: CompanyAISettings
) {
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      aiSettings: settings,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    firestoreLogger.error('Error updating company AI settings:', error)
    return false
  }
}

// 会社情報を取得
export async function getCompany(companyId: string) {
  try {
    const docSnap = await getDoc(doc(db, 'companies', companyId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error) {
    firestoreLogger.error('Error getting company:', error)
    return null
  }
}

// ========== フォルダ機能 ==========

// フォルダを作成
export async function createFolder(
  userId: string,
  companyId: string,
  name: string,
  parentFolderId?: string | null
) {
  try {
    const docRef = await addDoc(collection(db, 'folders'), {
      userId,
      companyId,
      name,
      parentFolderId: parentFolderId || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: docRef.id, name }
  } catch (error) {
    firestoreLogger.error('Error creating folder:', error)
    throw error
  }
}

// フォルダ一覧を取得
export async function getFolders(companyId: string) {
  try {
    // インデックスなしで動くようにorderByを削除し、JS側でソート
    const q = query(
      collection(db, 'folders'),
      where('companyId', '==', companyId)
    )
    const snapshot = await getDocs(q)
    const folders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }))
    // nameで昇順ソート
    return folders.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''))
  } catch (error: any) {
    if (error?.code !== 'failed-precondition') {
      firestoreLogger.warn('Error getting folders:', error?.message)
    }
    return []
  }
}

// フォルダを更新
export async function updateFolder(folderId: string, name: string) {
  try {
    await updateDoc(doc(db, 'folders', folderId), {
      name,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    firestoreLogger.error('Error updating folder:', error)
    throw error
  }
}

// フォルダを削除
export async function deleteFolder(folderId: string) {
  try {
    await deleteDoc(doc(db, 'folders', folderId))
    return true
  } catch (error) {
    firestoreLogger.error('Error deleting folder:', error)
    throw error
  }
}

// ドキュメントを削除
export async function deleteDocument(documentId: string) {
  try {
    await deleteDoc(doc(db, 'documents', documentId))
    return true
  } catch (error) {
    firestoreLogger.error('Error deleting document:', error)
    throw error
  }
}

// ========== 会社レベルのGoogleドライブ接続 ==========

// 会社のGoogleドライブ接続情報
export interface CompanyDriveConnection {
  isConnected: boolean
  connectedBy?: string // 接続したユーザーのUID
  connectedByEmail?: string // 接続したユーザーのメールアドレス
  connectedAt?: Date
  accessToken?: string // アクセストークン（短期間有効）
  refreshToken?: string // リフレッシュトークン（長期間有効）
  tokenExpiresAt?: Date
  driveFolderId?: string // 特定のフォルダのみを検索対象にする場合
}

// 会社のDrive接続情報を取得
export async function getCompanyDriveConnection(companyId: string): Promise<CompanyDriveConnection | null> {
  try {
    const docSnap = await getDoc(doc(db, 'companies', companyId))
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.driveConnection) {
        return {
          ...data.driveConnection,
          connectedAt: data.driveConnection.connectedAt?.toDate?.() || null,
          tokenExpiresAt: data.driveConnection.tokenExpiresAt?.toDate?.() || null,
        }
      }
    }
    return null
  } catch (error) {
    firestoreLogger.error('Error getting company drive connection:', error)
    return null
  }
}

// 会社のDrive接続情報を保存
export async function saveCompanyDriveConnection(
  companyId: string,
  connection: Partial<CompanyDriveConnection>
) {
  try {
    const updateData: any = {
      driveConnection: {
        ...connection,
        isConnected: true,
        connectedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    }
    // setDoc + merge: true でドキュメントがなくても作成される
    await setDoc(doc(db, 'companies', companyId), updateData, { merge: true })
    return true
  } catch (error) {
    firestoreLogger.error('Error saving company drive connection:', error)
    throw error
  }
}

// 会社のDrive接続を解除
export async function disconnectCompanyDrive(companyId: string) {
  try {
    await setDoc(doc(db, 'companies', companyId), {
      driveConnection: {
        isConnected: false,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (error) {
    firestoreLogger.error('Error disconnecting company drive:', error)
    throw error
  }
}

// 会社のDriveアクセストークンを更新
export async function updateCompanyDriveToken(
  companyId: string,
  accessToken: string,
  expiresAt: Date
) {
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      'driveConnection.accessToken': accessToken,
      'driveConnection.tokenExpiresAt': Timestamp.fromDate(expiresAt),
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    firestoreLogger.error('Error updating company drive token:', error)
    throw error
  }
}

// ========== Drive同期状態管理 ==========

// Drive同期状態の型定義
export interface DriveSyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error'
  lastSyncAt?: Date
  totalFiles: number
  syncedFiles: number
  driveStoreName?: string
  syncedFileIds: string[]
  errorMessage?: string
}

// 会社のDrive同期状態を取得
export async function getCompanyDriveSyncStatus(companyId: string): Promise<DriveSyncStatus | null> {
  try {
    const docSnap = await getDoc(doc(db, 'companies', companyId))
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.driveSyncStatus) {
        return {
          ...data.driveSyncStatus,
          lastSyncAt: data.driveSyncStatus.lastSyncAt?.toDate?.() || null,
        }
      }
    }
    return null
  } catch (error) {
    firestoreLogger.error('Error getting company drive sync status:', error)
    return null
  }
}

// 会社のDrive同期状態を更新
export async function updateCompanyDriveSyncStatus(
  companyId: string,
  status: Partial<DriveSyncStatus>
) {
  try {
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }

    // 各フィールドを個別に更新（マージ）
    if (status.status !== undefined) {
      updateData['driveSyncStatus.status'] = status.status
    }
    if (status.totalFiles !== undefined) {
      updateData['driveSyncStatus.totalFiles'] = status.totalFiles
    }
    if (status.syncedFiles !== undefined) {
      updateData['driveSyncStatus.syncedFiles'] = status.syncedFiles
    }
    if (status.driveStoreName !== undefined) {
      updateData['driveSyncStatus.driveStoreName'] = status.driveStoreName
    }
    if (status.syncedFileIds !== undefined) {
      updateData['driveSyncStatus.syncedFileIds'] = status.syncedFileIds
    }
    if (status.errorMessage !== undefined) {
      updateData['driveSyncStatus.errorMessage'] = status.errorMessage
    }
    if (status.lastSyncAt !== undefined) {
      updateData['driveSyncStatus.lastSyncAt'] = Timestamp.fromDate(status.lastSyncAt)
    }

    // setDoc + merge: true でドキュメントがなくても作成される
    await setDoc(doc(db, 'companies', companyId), updateData, { merge: true })
    return true
  } catch (error) {
    firestoreLogger.error('Error updating company drive sync status:', error)
    throw error
  }
}

// Drive同期状態を初期化
export async function initializeDriveSyncStatus(companyId: string) {
  try {
    await setDoc(doc(db, 'companies', companyId), {
      driveSyncStatus: {
        status: 'idle',
        totalFiles: 0,
        syncedFiles: 0,
        syncedFileIds: [],
      },
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (error) {
    firestoreLogger.error('Error initializing drive sync status:', error)
    throw error
  }
}

// Drive同期状態をリセット（接続解除時）
export async function resetDriveSyncStatus(companyId: string) {
  try {
    await setDoc(doc(db, 'companies', companyId), {
      driveSyncStatus: {
        status: 'idle',
        totalFiles: 0,
        syncedFiles: 0,
        syncedFileIds: [],
        driveStoreName: null,
        lastSyncAt: null,
        errorMessage: null,
      },
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (error) {
    firestoreLogger.error('Error resetting drive sync status:', error)
    throw error
  }
}
