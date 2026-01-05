/**
 * Firestore Vector Search
 *
 * Gemini File Searchの代替として、Firestoreのベクトル検索を使用
 * - チャンク数を自由に制御可能
 * - 類似度スコアが取得可能
 * - リランキングのカスタマイズが可能
 */

import { db } from './firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { createGeminiClient } from './gemini-file-search'
import { geminiLogger } from './logger'

// ============================================
// 型定義
// ============================================

export interface KnowledgeChunk {
  id: string
  content: string
  embedding?: number[]
  metadata: {
    documentId: string
    documentTitle: string
    chunkIndex: number
    totalChunks: number
    companyId: string
    folderId?: string
  }
  createdAt: Date
}

export interface VectorSearchResult {
  chunk: KnowledgeChunk
  score: number  // コサイン類似度 (0-1)
}

export interface SearchOptions {
  limit?: number
  threshold?: number  // 最低類似度スコア
  companyId?: string
  folderId?: string
}

// ============================================
// Embedding生成
// ============================================

const EMBEDDING_MODEL = 'text-embedding-004'  // 768次元
const EMBEDDING_DIMENSION = 768

/**
 * テキストからEmbeddingベクトルを生成
 */
export async function createEmbedding(
  text: string,
  apiKey?: string
): Promise<number[]> {
  try {
    const ai = createGeminiClient(apiKey)

    const result = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [{ parts: [{ text }] }],
    })

    const embedding = result.embeddings?.[0]?.values
    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Invalid embedding dimension: ${embedding?.length}`)
    }

    return embedding
  } catch (error) {
    geminiLogger.error('[Embedding] Error:', error)
    throw error
  }
}

/**
 * 複数テキストのEmbeddingを一括生成（バッチ処理用）
 */
export async function createEmbeddingsBatch(
  texts: string[],
  apiKey?: string
): Promise<number[][]> {
  // Gemini Embedding APIはバッチをサポートしていないので、並列実行
  const batchSize = 5  // 同時実行数を制限
  const results: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const embeddings = await Promise.all(
      batch.map(text => createEmbedding(text, apiKey))
    )
    results.push(...embeddings)
  }

  return results
}

// ============================================
// チャンキング
// ============================================

interface ChunkOptions {
  chunkSize?: number      // トークン数（概算）
  chunkOverlap?: number   // オーバーラップするトークン数
}

/**
 * テキストをチャンクに分割
 * 日本語の場合、1文字≒1トークンとして概算
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): string[] {
  const chunkSize = options.chunkSize || 500
  const overlap = options.chunkOverlap || 100

  // 改行や句点で分割してから再結合
  const sentences = text
    .split(/(?<=[。．！？\n])/g)
    .filter(s => s.trim().length > 0)

  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        // オーバーラップ: 最後の部分を次のチャンクに含める
        const overlapText = currentChunk.slice(-overlap)
        currentChunk = overlapText + sentence
      } else {
        // 1文がチャンクサイズを超える場合は強制分割
        for (let i = 0; i < sentence.length; i += chunkSize - overlap) {
          chunks.push(sentence.slice(i, i + chunkSize).trim())
        }
        currentChunk = ''
      }
    } else {
      currentChunk += sentence
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

// ============================================
// ドキュメント保存
// ============================================

/**
 * ドキュメントをチャンク化してFirestoreに保存
 */
export async function indexDocument(
  documentId: string,
  documentTitle: string,
  content: string,
  companyId: string,
  apiKey?: string,
  options?: {
    folderId?: string
    chunkSize?: number
    chunkOverlap?: number
  }
): Promise<{ chunkCount: number; error: string | null }> {
  try {
    geminiLogger.debug(`[Index] Starting: ${documentTitle}`)

    // チャンク分割
    const chunks = chunkText(content, {
      chunkSize: options?.chunkSize,
      chunkOverlap: options?.chunkOverlap,
    })

    geminiLogger.debug(`[Index] Chunks created: ${chunks.length}`)

    // Embedding生成
    const embeddings = await createEmbeddingsBatch(chunks, apiKey)

    // Firestoreに保存
    const batch = db.batch()
    const collectionRef = db.collection('knowledge_chunks')

    for (let i = 0; i < chunks.length; i++) {
      const docRef = collectionRef.doc()
      batch.set(docRef, {
        content: chunks[i],
        embedding: FieldValue.vector(embeddings[i]),
        metadata: {
          documentId,
          documentTitle,
          chunkIndex: i,
          totalChunks: chunks.length,
          companyId,
          folderId: options?.folderId || null,
        },
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()

    geminiLogger.debug(`[Index] Completed: ${chunks.length} chunks saved`)
    return { chunkCount: chunks.length, error: null }
  } catch (error: any) {
    geminiLogger.error('[Index] Error:', error)
    return { chunkCount: 0, error: error.message }
  }
}

/**
 * ドキュメントのインデックスを削除
 */
export async function deleteDocumentIndex(
  documentId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const snapshot = await db
      .collection('knowledge_chunks')
      .where('metadata.documentId', '==', documentId)
      .get()

    if (snapshot.empty) {
      return { success: true, error: null }
    }

    const batch = db.batch()
    snapshot.docs.forEach(doc => batch.delete(doc.ref))
    await batch.commit()

    geminiLogger.debug(`[Index] Deleted: ${snapshot.size} chunks`)
    return { success: true, error: null }
  } catch (error: any) {
    geminiLogger.error('[Index] Delete error:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// ベクトル検索
// ============================================

/**
 * Firestore Vector Searchで類似検索
 *
 * 検索後、documentsコレクションで存在確認を行い、
 * 削除済みドキュメントのチャンクをフィルタリング
 */
export async function searchSimilar(
  query: string,
  apiKey?: string,
  options: SearchOptions = {}
): Promise<{ results: VectorSearchResult[]; error: string | null }> {
  try {
    const limit = options.limit || 10
    const threshold = options.threshold || 0

    geminiLogger.debug(`[Search] Query: ${query.slice(0, 50)}...`)

    // クエリのEmbedding生成
    const queryEmbedding = await createEmbedding(query, apiKey)

    // Firestore Vector Search
    let queryRef = db.collection('knowledge_chunks')

    // companyIdフィルタ（必須ではない）
    if (options.companyId) {
      queryRef = queryRef.where('metadata.companyId', '==', options.companyId) as any
    }

    // Vector Search実行（削除済みを考慮して多めに取得）
    const snapshot = await (queryRef as any)
      .findNearest('embedding', queryEmbedding, {
        limit: limit * 2, // 余分に取得
        distanceMeasure: 'COSINE',
      })
      .get()

    const results: VectorSearchResult[] = []
    const documentIdsToCheck: string[] = []

    for (const doc of snapshot.docs) {
      const data = doc.data()
      // コサイン距離からスコアに変換 (1 - distance = similarity)
      const distance = doc.get('_distance') || 0
      const score = 1 - distance

      if (score >= threshold) {
        results.push({
          chunk: {
            id: doc.id,
            content: data.content,
            metadata: data.metadata,
            createdAt: data.createdAt?.toDate() || new Date(),
          },
          score,
        })
        if (data.metadata?.documentId) {
          documentIdsToCheck.push(data.metadata.documentId)
        }
      }
    }

    // ドキュメントの存在確認（削除済みを除外）
    if (documentIdsToCheck.length > 0) {
      const existingDocIds = await verifyDocumentsExistById(documentIdsToCheck)

      // 存在しないドキュメントのチャンクを除外
      const filteredResults = results.filter(r => {
        const docId = r.chunk.metadata?.documentId
        if (!docId) return true // documentIdがない場合は除外しない
        return existingDocIds.has(docId)
      })

      const removedCount = results.length - filteredResults.length
      if (removedCount > 0) {
        geminiLogger.debug(`[Search] Filtered out ${removedCount} results from deleted documents`)
      }

      geminiLogger.debug(`[Search] Found: ${filteredResults.length} results (after filtering)`)
      return { results: filteredResults.slice(0, limit), error: null }
    }

    geminiLogger.debug(`[Search] Found: ${results.length} results`)
    return { results: results.slice(0, limit), error: null }
  } catch (error: any) {
    geminiLogger.error('[Search] Error:', error)
    return { results: [], error: error.message }
  }
}

// ============================================
// 高精度検索（Multi-Query + Reranking）
// ============================================

/**
 * 高精度ベクトル検索
 * - Multi-Query: 複数の検索クエリで並列検索
 * - 重複除去
 * - LLMリランキング（オプション）
 */
export async function advancedVectorSearch(
  originalQuestion: string,
  queries: string[],
  apiKey?: string,
  options: SearchOptions & { rerank?: boolean } = {}
): Promise<{ results: VectorSearchResult[]; error: string | null }> {
  try {
    const limit = options.limit || 20

    geminiLogger.debug(`[Advanced Search] Queries: ${queries.length}`)

    // 複数クエリで並列検索
    const searchPromises = queries.slice(0, 4).map(query =>
      searchSimilar(query, apiKey, { ...options, limit })
    )
    const searchResults = await Promise.all(searchPromises)

    // 結果をマージして重複除去
    const seen = new Set<string>()
    let allResults: VectorSearchResult[] = []

    for (const { results } of searchResults) {
      for (const result of results) {
        const key = result.chunk.content.slice(0, 100)
        if (!seen.has(key)) {
          seen.add(key)
          allResults.push(result)
        }
      }
    }

    // スコア順でソート
    allResults.sort((a, b) => b.score - a.score)

    geminiLogger.debug(`[Advanced Search] Merged: ${allResults.length} results`)

    // リランキング（オプション）
    if (options.rerank && allResults.length > 2) {
      allResults = await rerankVectorResults(
        originalQuestion,
        allResults,
        apiKey
      )
    }

    // 上位N件に絞る
    allResults = allResults.slice(0, options.limit || 10)

    return { results: allResults, error: null }
  } catch (error: any) {
    geminiLogger.error('[Advanced Search] Error:', error)
    return { results: [], error: error.message }
  }
}

/**
 * LLMベースのリランキング
 */
async function rerankVectorResults(
  question: string,
  results: VectorSearchResult[],
  apiKey?: string
): Promise<VectorSearchResult[]> {
  try {
    const ai = createGeminiClient(apiKey)

    const resultTexts = results.map((r, i) =>
      `[${i + 1}] ${r.chunk.metadata.documentTitle}\n${r.chunk.content.slice(0, 300)}`
    ).join('\n\n')

    const prompt = `以下の検索結果を、質問への関連性が高い順に並べ替えてください。

【質問】
${question}

【検索結果】
${resultTexts}

関連性の高い順に番号をカンマ区切りで出力してください（例: 2,1,3）。
関連性が非常に低いものは除外してください。
番号のみ出力（説明不要）：`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 50,
      },
    })

    const orderStr = response.text?.trim() || ''
    const order = orderStr
      .split(',')
      .map(s => parseInt(s.trim()) - 1)
      .filter(n => !isNaN(n) && n >= 0 && n < results.length)

    if (order.length === 0) return results

    const reranked = order.map(i => results[i]).filter(Boolean)
    geminiLogger.debug('[Rerank] New order:', order.map(i => i + 1).join(','))

    return reranked
  } catch (error) {
    geminiLogger.error('[Rerank] Error:', error)
    return results
  }
}

// ============================================
// ユーティリティ
// ============================================

/**
 * 会社のインデックス済みドキュメント数を取得
 */
export async function getIndexedDocumentCount(
  companyId: string
): Promise<number> {
  try {
    // ドキュメントIDでグループ化して数える
    const snapshot = await db
      .collection('knowledge_chunks')
      .where('metadata.companyId', '==', companyId)
      .where('metadata.chunkIndex', '==', 0)  // 各ドキュメントの最初のチャンクのみカウント
      .count()
      .get()

    return snapshot.data().count
  } catch (error) {
    geminiLogger.error('[Count] Error:', error)
    return 0
  }
}

/**
 * 全チャンク数を取得
 */
export async function getTotalChunkCount(
  companyId: string
): Promise<number> {
  try {
    const snapshot = await db
      .collection('knowledge_chunks')
      .where('metadata.companyId', '==', companyId)
      .count()
      .get()

    return snapshot.data().count
  } catch (error) {
    geminiLogger.error('[Count] Error:', error)
    return 0
  }
}

/**
 * ドキュメントIDからチャンクを取得
 */
export async function getDocumentChunks(
  documentId: string
): Promise<{ chunks: KnowledgeChunk[]; error: string | null }> {
  try {
    const snapshot = await db
      .collection('knowledge_chunks')
      .where('metadata.documentId', '==', documentId)
      .orderBy('metadata.chunkIndex', 'asc')
      .get()

    const chunks: KnowledgeChunk[] = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        content: data.content,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })

    geminiLogger.debug(`[GetChunks] Document ${documentId}: ${chunks.length} chunks`)
    return { chunks, error: null }
  } catch (error: any) {
    geminiLogger.error('[GetChunks] Error:', error)
    return { chunks: [], error: error.message }
  }
}

// ============================================
// 孤立チャンクのクリーンアップ
// ============================================

/**
 * ドキュメントIDで存在確認（検索結果フィルタリング用）
 * 個別にドキュメントを取得して確認
 */
async function verifyDocumentsExistById(documentIds: string[]): Promise<Set<string>> {
  if (documentIds.length === 0) return new Set()

  try {
    const uniqueIds = Array.from(new Set(documentIds))
    const existingIds = new Set<string>()

    // 並列でドキュメントを取得（最大10件ずつ）
    const batchSize = 10
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize)
      const docRefs = batch.map(id => db.collection('documents').doc(id))
      const docs = await db.getAll(...docRefs)

      docs.forEach((doc, index) => {
        if (doc.exists) {
          existingIds.add(batch[index])
        }
      })
    }

    return existingIds
  } catch (error) {
    geminiLogger.error('[VerifyDocumentsById] Error:', error)
    // エラー時は全て存在すると仮定（検索結果を失わないため）
    return new Set(documentIds)
  }
}

/**
 * ドキュメントが存在するか確認（クリーンアップ用）
 */
async function verifyDocumentsExist(documentIds: string[]): Promise<Set<string>> {
  if (documentIds.length === 0) return new Set()

  try {
    const uniqueIds = Array.from(new Set(documentIds))
    const existingIds = new Set<string>()

    // Firestoreの制限（1回のinクエリで最大30件）を考慮してバッチ処理
    const batchSize = 30
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize)
      const snapshot = await db
        .collection('documents')
        .where('__name__', 'in', batch.map(id => db.doc(`documents/${id}`)))
        .select()
        .get()

      snapshot.docs.forEach(doc => existingIds.add(doc.id))
    }

    return existingIds
  } catch (error) {
    geminiLogger.error('[VerifyDocuments] Error:', error)
    return new Set(documentIds)
  }
}

/**
 * 親ドキュメントが削除されたチャンクを検出・削除
 * 定期的に実行することで、不整合なデータをクリーンアップ
 */
export async function cleanupOrphanedChunks(
  companyId?: string
): Promise<{ deletedCount: number; error: string | null }> {
  try {
    geminiLogger.debug('[Cleanup] Starting orphaned chunks cleanup...')

    // 1. knowledge_chunks からユニークなドキュメントIDを取得
    let chunksQuery = db.collection('knowledge_chunks')
      .where('metadata.chunkIndex', '==', 0) // 各ドキュメントの最初のチャンクのみ

    if (companyId) {
      chunksQuery = chunksQuery.where('metadata.companyId', '==', companyId) as any
    }

    const chunksSnapshot = await chunksQuery.limit(500).get() // バッチサイズ制限

    if (chunksSnapshot.empty) {
      geminiLogger.debug('[Cleanup] No chunks found')
      return { deletedCount: 0, error: null }
    }

    // ドキュメントIDを収集
    const documentIds = new Set<string>()
    for (const doc of chunksSnapshot.docs) {
      const data = doc.data()
      const docId = data.metadata?.documentId
      if (docId) {
        documentIds.add(docId)
      }
    }

    geminiLogger.debug(`[Cleanup] Found ${documentIds.size} unique document IDs in chunks`)

    // 2. documentsコレクションで存在確認（より確実な方法を使用）
    const allDocIds = Array.from(documentIds)
    const existingDocIds = await verifyDocumentsExistById(allDocIds)

    geminiLogger.debug(`[Cleanup] ${existingDocIds.size} documents exist in documents collection`)

    // 3. 存在しないドキュメントのチャンクを削除
    const orphanedDocIds = allDocIds.filter(id => !existingDocIds.has(id))

    if (orphanedDocIds.length === 0) {
      geminiLogger.debug('[Cleanup] No orphaned chunks found')
      return { deletedCount: 0, error: null }
    }

    geminiLogger.debug(`[Cleanup] Found ${orphanedDocIds.length} orphaned documents: ${orphanedDocIds.join(', ')}`)

    let totalDeleted = 0

    // バッチ削除
    for (const docId of orphanedDocIds) {
      const result = await deleteDocumentIndex(docId)
      if (result.success) {
        totalDeleted++
        geminiLogger.debug(`[Cleanup] Deleted chunks for document: ${docId}`)
      } else {
        geminiLogger.warn(`[Cleanup] Failed to delete chunks for document: ${docId}`, result.error)
      }
    }

    geminiLogger.debug(`[Cleanup] Deleted chunks for ${totalDeleted} orphaned documents`)
    return { deletedCount: totalDeleted, error: null }
  } catch (error: any) {
    geminiLogger.error('[Cleanup] Error:', error)
    return { deletedCount: 0, error: error.message }
  }
}
