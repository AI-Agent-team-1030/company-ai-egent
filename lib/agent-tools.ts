/**
 * エージェントツール実行ロジック
 *
 * 各ツールの実行関数と結果の型を定義
 */

import {
  AgentTool,
  AgentCitation,
  ToolExecutionResult,
} from './types/agent'
import { searchSimilar } from './firestore-vector-search'

// ============================================
// ツール実行結果の型
// ============================================

export interface KnowledgeSearchResult {
  citations: AgentCitation[]
  totalResults: number
}

export interface DriveSearchResult {
  files: Array<{
    id: string
    name: string
    content: string
    webViewLink?: string
    mimeType?: string
  }>
  totalResults: number
}

export interface WebSearchResult {
  results: Array<{
    title: string
    url: string
    snippet: string
  }>
  totalResults: number
}

export interface DocumentGenerateResult {
  content: string
  format: 'markdown' | 'html' | 'plain'
}

// ============================================
// ナレッジ検索ツール
// ============================================

/**
 * ナレッジベース検索を実行（Gemini File Search）
 *
 * 注意: AI Studioモードでは vertexAiSearch は使用できないため、
 * fileSearch ツールを使用します。
 */
export async function executeKnowledgeSearch(
  query: string,
  apiKey: string,
  fileSearchStores: Array<{ id: string; name: string }>,
  options?: {
    maxResults?: number
  }
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  try {
    if (!fileSearchStores || fileSearchStores.length === 0) {
      return {
        tool: 'knowledge_search',
        status: 'skipped',
        result: { citations: [], totalResults: 0 },
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Gemini File Search APIを使用（AI Studio互換）
    // 注: fileSearchStores[].id は "fileSearchStores/xxx" 形式である必要がある
    const storeNames = fileSearchStores.map(s => s.id).slice(0, 5)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
          tools: [{
            fileSearch: {
              fileSearchStoreNames: storeNames,
            },
          }],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Knowledge search failed: ${response.status}`)
    }

    const data = await response.json()

    // 引用情報を抽出
    const citations: AgentCitation[] = []
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.retrievedContext) {
          citations.push({
            title: chunk.retrievedContext.title || 'ドキュメント',
            content: chunk.retrievedContext.text || '',
            source: chunk.retrievedContext.uri || '',
            sourceType: 'knowledge',
            url: chunk.retrievedContext.uri,
          })
        }
      }
    }

    return {
      tool: 'knowledge_search',
      status: 'success',
      result: {
        citations: citations.slice(0, options?.maxResults || 10),
        totalResults: citations.length,
      } as KnowledgeSearchResult,
      executionTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      tool: 'knowledge_search',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    }
  }
}

/**
 * Firestore Vector Searchでナレッジ検索を実行
 */
export async function executeFirestoreKnowledgeSearch(
  query: string,
  apiKey: string,
  companyId: string,
  options?: {
    maxResults?: number
  }
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  try {
    if (!companyId) {
      return {
        tool: 'knowledge_search',
        status: 'skipped',
        result: { citations: [], totalResults: 0 },
        executionTimeMs: Date.now() - startTime,
      }
    }

    // Firestore Vector Searchを使用
    const searchResult = await searchSimilar(query, apiKey, {
      companyId,
      limit: options?.maxResults || 5,
      threshold: 0.3,  // 最低類似度
    })

    if (searchResult.error) {
      throw new Error(searchResult.error)
    }

    // 引用情報を生成
    const citations: AgentCitation[] = searchResult.results.map(r => ({
      title: r.chunk.metadata.documentTitle,
      content: r.chunk.content,
      source: r.chunk.metadata.documentId,
      sourceType: 'knowledge' as const,
      score: r.score,
    }))

    return {
      tool: 'knowledge_search',
      status: 'success',
      result: {
        citations,
        totalResults: citations.length,
      } as KnowledgeSearchResult,
      executionTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      tool: 'knowledge_search',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    }
  }
}

// ============================================
// Google Drive検索ツール
// ============================================

/**
 * Google Drive検索を実行
 */
export async function executeDriveSearch(
  query: string,
  accessToken: string,
  folderId?: string,
  options?: {
    maxResults?: number
  }
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  try {
    if (!accessToken) {
      return {
        tool: 'drive_search',
        status: 'skipped',
        result: { files: [], totalResults: 0 },
        executionTimeMs: Date.now() - startTime,
      }
    }

    // 内部APIを呼び出し
    const response = await fetch('/api/drive/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
        query,
        folderId,
        maxResults: options?.maxResults || 10,
      }),
    })

    if (!response.ok) {
      throw new Error(`Drive search failed: ${response.status}`)
    }

    const data = await response.json()

    return {
      tool: 'drive_search',
      status: 'success',
      result: {
        files: data.results || [],
        totalResults: data.results?.length || 0,
      } as DriveSearchResult,
      executionTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      tool: 'drive_search',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    }
  }
}

// ============================================
// Web検索ツール
// ============================================

/**
 * Web検索を実行
 */
export async function executeWebSearch(
  query: string,
  options?: {
    maxResults?: number
  }
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  try {
    // Gemini APIのgroundingを使用してWeb検索
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY

    if (!apiKey) {
      return {
        tool: 'web_search',
        status: 'skipped',
        result: { results: [], totalResults: 0 },
        executionTimeMs: Date.now() - startTime,
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `以下について、最新の情報を検索してまとめてください：\n\n${query}` }],
          }],
          tools: [{ googleSearch: {} }],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Web search failed: ${response.status}`)
    }

    const data = await response.json()

    // 検索結果を抽出
    const results: WebSearchResult['results'] = []
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata

    if (groundingMetadata?.webSearchQueries) {
      // Web検索が実行された場合
      const searchChunks = groundingMetadata.groundingChunks || []
      for (const chunk of searchChunks) {
        if (chunk.web) {
          results.push({
            title: chunk.web.title || '',
            url: chunk.web.uri || '',
            snippet: chunk.web.text || '',
          })
        }
      }
    }

    return {
      tool: 'web_search',
      status: 'success',
      result: {
        results: results.slice(0, options?.maxResults || 10),
        totalResults: results.length,
      } as WebSearchResult,
      executionTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      tool: 'web_search',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    }
  }
}

// ============================================
// 文書生成ツール
// ============================================

/**
 * フォーマット済み文書を生成
 */
export async function executeDocumentGenerate(
  prompt: string,
  documentType: string,
  options?: {
    format?: 'markdown' | 'html' | 'plain'
  }
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY

    if (!apiKey) {
      return {
        tool: 'document_generate',
        status: 'failed',
        error: 'API key not configured',
        executionTimeMs: Date.now() - startTime,
      }
    }

    const format = options?.format || 'markdown'
    const formatInstruction = format === 'markdown'
      ? 'Markdown形式で、適切な見出し・箇条書き・テーブルを使用してください。'
      : format === 'html'
        ? 'HTML形式で、適切なタグを使用してください。'
        : 'プレーンテキスト形式で出力してください。'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `以下の内容に基づいて、${documentType}を作成してください。

${formatInstruction}

内容：
${prompt}`,
            }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Document generation failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      tool: 'document_generate',
      status: 'success',
      result: {
        content,
        format,
      } as DocumentGenerateResult,
      executionTimeMs: Date.now() - startTime,
    }
  } catch (error) {
    return {
      tool: 'document_generate',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    }
  }
}

// ============================================
// API呼び出しツール（将来実装）
// ============================================

/**
 * 外部API呼び出しを実行
 */
export async function executeApiCall(
  _endpoint: string,
  _method: string,
  _body?: unknown
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  // 将来実装
  return {
    tool: 'api_call',
    status: 'skipped',
    result: { message: 'API call tool is not yet implemented' },
    executionTimeMs: Date.now() - startTime,
  }
}

// ============================================
// コード実行ツール（将来実装）
// ============================================

/**
 * コードをサンドボックスで実行
 */
export async function executeCode(
  _code: string,
  _language: string
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  // 将来実装
  return {
    tool: 'code_execute',
    status: 'skipped',
    result: { message: 'Code execution tool is not yet implemented' },
    executionTimeMs: Date.now() - startTime,
  }
}

// ============================================
// ツール実行ディスパッチャー
// ============================================

export interface ToolExecutionContext {
  query: string
  geminiApiKey?: string
  driveAccessToken?: string
  driveFolderId?: string
  fileSearchStores?: Array<{ id: string; name: string }>
  // Firestore Vector Search用
  companyId?: string
  useFirestoreVectorSearch?: boolean  // trueでFirestore Vector Searchを使用
}

/**
 * 指定されたツールを実行
 */
export async function executeTool(
  tool: AgentTool,
  context: ToolExecutionContext
): Promise<ToolExecutionResult> {
  switch (tool) {
    case 'knowledge_search':
      // Firestore Vector Searchを使用する場合
      if (context.useFirestoreVectorSearch && context.companyId) {
        return executeFirestoreKnowledgeSearch(
          context.query,
          context.geminiApiKey || '',
          context.companyId
        )
      }
      // 従来のGemini File Searchを使用
      return executeKnowledgeSearch(
        context.query,
        context.geminiApiKey || '',
        context.fileSearchStores || []
      )

    case 'drive_search':
      return executeDriveSearch(
        context.query,
        context.driveAccessToken || '',
        context.driveFolderId
      )

    case 'web_search':
      return executeWebSearch(context.query)

    case 'document_generate':
      return executeDocumentGenerate(context.query, 'ビジネス文書')

    case 'api_call':
      return executeApiCall('', 'GET')

    case 'code_execute':
      return executeCode('', 'javascript')

    default:
      return {
        tool,
        status: 'failed',
        error: `Unknown tool: ${tool}`,
        executionTimeMs: 0,
      }
  }
}

/**
 * 複数のツールを並列実行
 */
export async function executeToolsParallel(
  tools: AgentTool[],
  context: ToolExecutionContext
): Promise<ToolExecutionResult[]> {
  const executions = tools.map(tool => executeTool(tool, context))
  return Promise.all(executions)
}

/**
 * ツール結果から引用情報を抽出
 */
export function extractCitationsFromToolResults(
  results: ToolExecutionResult[]
): AgentCitation[] {
  const citations: AgentCitation[] = []

  for (const result of results) {
    if (result.status !== 'success') continue

    if (result.tool === 'knowledge_search') {
      const kr = result.result as KnowledgeSearchResult
      citations.push(...kr.citations)
    }

    if (result.tool === 'drive_search') {
      const dr = result.result as DriveSearchResult
      for (const file of dr.files) {
        citations.push({
          title: file.name,
          content: file.content,
          source: file.webViewLink || file.id,
          sourceType: 'drive',
          url: file.webViewLink,
        })
      }
    }

    if (result.tool === 'web_search') {
      const wr = result.result as WebSearchResult
      for (const r of wr.results) {
        citations.push({
          title: r.title,
          content: r.snippet,
          source: r.url,
          sourceType: 'web',
          url: r.url,
        })
      }
    }
  }

  return citations
}
