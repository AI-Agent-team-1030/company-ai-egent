import { GoogleGenAI } from '@google/genai'
import { FILE_SEARCH_MODEL, DEFAULT_MODEL } from './ai-providers'

// Gemini クライアントの初期化
export function createGeminiClient(apiKey?: string) {
  const key = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!key) {
    throw new Error('Gemini API キーが設定されていません')
  }
  return new GoogleGenAI({ apiKey: key })
}

// ストア作成
export async function createFileSearchStore(
  apiKey: string,
  displayName: string
): Promise<{ storeName: string; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)
    const store = await ai.fileSearchStores.create({
      config: { displayName },
    })
    return { storeName: store.name || '', error: null }
  } catch (error: any) {
    console.error('Store creation error:', error)
    return { storeName: '', error: error.message }
  }
}

// ファイルアップロード
export async function uploadFile(
  apiKey: string,
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  mimeType: string
): Promise<{ fileName: string; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)

    // ArrayBufferに変換してBlobを作成
    const arrayBuffer = fileBuffer instanceof ArrayBuffer
      ? fileBuffer
      : fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
    const blob = new Blob([arrayBuffer as ArrayBuffer], { type: mimeType })

    const file = await ai.files.upload({
      file: blob,
      config: { displayName: fileName },
    })

    return { fileName: file.name || '', error: null }
  } catch (error: any) {
    console.error('File upload error:', error)
    return { fileName: '', error: error.message }
  }
}

// ストアにファイルをインポート
export async function importFileToStore(
  apiKey: string,
  storeName: string,
  fileName: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)

    await ai.fileSearchStores.importFile({
      fileSearchStoreName: storeName,
      fileName: fileName,
    })

    // インポートはバックグラウンドで処理されるため、少し待機
    await new Promise((resolve) => setTimeout(resolve, 3000))

    return { success: true, error: null }
  } catch (error: any) {
    console.error('Import error:', error)
    return { success: false, error: error.message }
  }
}

// ===========================================
// 高精度ナレッジ検索システム (RAG Best Practices 2025)
// ===========================================

// 検索クエリを生成（Advanced Query Rewriting + Multi-Query + HyDE）
export async function generateSearchQuery(
  apiKey: string,
  userQuestion: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ query: string; queries: string[]; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)

    // 会話履歴を文字列に変換（直近5ターンまで - より多くのコンテキスト）
    const recentHistory = conversationHistory.slice(-10)
    const historyText = recentHistory.length > 0
      ? recentHistory.map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`).join('\n')
      : ''

    // Multi-Query + HyDE アプローチ
    const prompt = `あなたは社内ナレッジベースの検索エキスパートです。ユーザーの質問に対して、最も関連性の高い情報を見つけるための検索戦略を立ててください。

${historyText ? `【会話履歴】\n${historyText}\n\n` : ''}【ユーザーの質問】
${userQuestion}

以下の形式でJSONを出力してください（説明不要、JSONのみ）：

{
  "intent": "ユーザーが本当に知りたいことの要約（1文）",
  "keywords": ["重要キーワード1", "重要キーワード2", "重要キーワード3"],
  "queries": [
    "メインの検索クエリ（最も直接的）",
    "別の観点からの検索クエリ（同義語や関連概念を使用）",
    "より広い文脈での検索クエリ（上位概念を含む）"
  ],
  "hypotheticalAnswer": "この質問に対する理想的な回答の冒頭部分（ナレッジベースにありそうな文章スタイルで50文字程度）"
}

ルール：
- 「それ」「これ」などの指示語は会話履歴から具体的な言葉に置き換える
- 専門用語と一般用語の両方を考慮する
- 日本語で出力`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    })

    const responseText = response.text?.trim() || ''

    // JSONをパース
    let parsed: any = null
    try {
      // ```json ... ``` の形式を処理
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, responseText]
      const jsonStr = jsonMatch[1] || responseText
      parsed = JSON.parse(jsonStr)
    } catch {
      console.warn('[Query Rewriting] JSON parse failed, using fallback')
    }

    // パース成功時は複数クエリを使用、失敗時はフォールバック
    const queries = parsed?.queries || [userQuestion]
    const mainQuery = queries[0] || userQuestion

    // HyDEクエリも追加（仮想回答を検索クエリとして使用）
    if (parsed?.hypotheticalAnswer) {
      queries.push(parsed.hypotheticalAnswer)
    }

    console.log('[Query Rewriting] Original:', userQuestion)
    console.log('[Query Rewriting] Intent:', parsed?.intent || 'N/A')
    console.log('[Query Rewriting] Generated queries:', queries)

    return { query: mainQuery, queries, error: null }
  } catch (error: any) {
    console.error('Query generation error:', error)
    return { query: userQuestion, queries: [userQuestion], error: error.message }
  }
}

// 検索結果の関連性を評価・再ランキング
export async function rerankResults(
  apiKey: string,
  question: string,
  citations: Citation[]
): Promise<Citation[]> {
  if (citations.length <= 1) return citations

  try {
    const ai = createGeminiClient(apiKey)

    const citationTexts = citations.map((c, i) =>
      `[${i + 1}] ${c.title}\n${c.text.slice(0, 300)}`
    ).join('\n\n')

    const prompt = `以下の検索結果を、質問への関連性が高い順に並べ替えてください。

【質問】
${question}

【検索結果】
${citationTexts}

関連性の高い順に番号をカンマ区切りで出力してください（例: 2,1,3）。
関連性が非常に低いものは除外してください。
番号のみ出力（説明不要）：`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 50,
      },
    })

    const orderStr = response.text?.trim() || ''
    const order = orderStr.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < citations.length)

    if (order.length === 0) return citations

    // 再ランキングされた結果を返す
    const reranked = order.map(i => citations[i]).filter(Boolean)
    console.log('[Reranking] Original order:', citations.map((_, i) => i + 1).join(','))
    console.log('[Reranking] New order:', order.map(i => i + 1).join(','))

    return reranked
  } catch (error) {
    console.error('Reranking error:', error)
    return citations
  }
}

// 検索結果から重複を除去
function deduplicateCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>()
  return citations.filter(c => {
    // テキストの最初の100文字をキーとして重複チェック
    const key = c.text.slice(0, 100).toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// File Search を使った質問応答（単一クエリ - 内部用）
async function executeFileSearch(
  ai: any,
  storeNames: string[],
  query: string
): Promise<Citation[]> {
  try {
    const response = await ai.models.generateContent({
      model: FILE_SEARCH_MODEL,
      contents: query,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: storeNames.slice(0, 5), // API制限: 最大5個
            },
          },
        ],
      },
    })

    const citations: Citation[] = []
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.retrievedContext) {
          let title = chunk.retrievedContext.title || ''

          if (!title || title.startsWith('files/') || title.match(/^[a-zA-Z0-9_-]+$/)) {
            const uri = chunk.retrievedContext.uri || ''
            const uriMatch = uri.match(/displayName=([^&]+)/)
            if (uriMatch) {
              title = decodeURIComponent(uriMatch[1])
            } else {
              const text = chunk.retrievedContext.text || ''
              const firstLine = text.split('\n')[0].trim()
              if (firstLine && firstLine.length < 100) {
                title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
              } else {
                title = 'ナレッジドキュメント'
              }
            }
          }

          citations.push({
            title,
            uri: chunk.retrievedContext.uri || '',
            text: chunk.retrievedContext.text || '',
            source: 'knowledge',
          })
        }
      }
    }
    return citations
  } catch (error) {
    console.error('[File Search] Query error:', error)
    return []
  }
}

// 高精度ナレッジ検索（Multi-Query + Reranking）
export async function advancedKnowledgeSearch(
  apiKey: string,
  storeNames: string[],
  originalQuestion: string,
  queries: string[]
): Promise<{ citations: Citation[]; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)
    console.log('[Advanced Search] Starting with', queries.length, 'queries')

    // 複数クエリで並列検索
    const searchPromises = queries.slice(0, 3).map(query =>
      executeFileSearch(ai, storeNames, query)
    )
    const results = await Promise.all(searchPromises)

    // 結果をマージ
    let allCitations = results.flat()
    console.log('[Advanced Search] Total citations before dedup:', allCitations.length)

    // 重複除去
    allCitations = deduplicateCitations(allCitations)
    console.log('[Advanced Search] Citations after dedup:', allCitations.length)

    // 再ランキング（結果が多い場合のみ）
    if (allCitations.length > 2) {
      allCitations = await rerankResults(apiKey, originalQuestion, allCitations)
    }

    // 上位5件に絞る
    allCitations = allCitations.slice(0, 5)
    console.log('[Advanced Search] Final citations:', allCitations.length)

    return { citations: allCitations, error: null }
  } catch (error: any) {
    console.error('[Advanced Search] Error:', error)
    return { citations: [], error: error.message }
  }
}

// File Search を使った質問応答（後方互換性のため維持）
export async function queryWithFileSearch(
  apiKey: string,
  storeNames: string[],
  question: string,
  systemPrompt?: string
): Promise<{ answer: string; citations: Citation[]; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)

    const contents = systemPrompt
      ? [
          { role: 'user' as const, parts: [{ text: systemPrompt }] },
          { role: 'model' as const, parts: [{ text: '承知しました。' }] },
          { role: 'user' as const, parts: [{ text: question }] },
        ]
      : question

    const response = await ai.models.generateContent({
      model: FILE_SEARCH_MODEL,
      contents,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: storeNames.slice(0, 5), // API制限: 最大5個
            },
          },
        ],
      },
    })

    // 引用情報を抽出
    const citations: Citation[] = []
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.retrievedContext) {
          let title = chunk.retrievedContext.title || ''

          if (!title || title.startsWith('files/') || title.match(/^[a-zA-Z0-9_-]+$/)) {
            const uri = chunk.retrievedContext.uri || ''
            const uriMatch = uri.match(/displayName=([^&]+)/)
            if (uriMatch) {
              title = decodeURIComponent(uriMatch[1])
            } else {
              const text = chunk.retrievedContext.text || ''
              const firstLine = text.split('\n')[0].trim()
              if (firstLine && firstLine.length < 100) {
                title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
              } else {
                title = 'ナレッジドキュメント'
              }
            }
          }

          citations.push({
            title,
            uri: chunk.retrievedContext.uri || '',
            text: chunk.retrievedContext.text || '',
            source: 'knowledge',
          })
        }
      }
    }

    return {
      answer: response.text || '',
      citations,
      error: null,
    }
  } catch (error: any) {
    console.error('Query error:', error)
    return { answer: '', citations: [], error: error.message }
  }
}

// 通常のチャット（File Search なし）
export async function chat(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt?: string,
  model?: string
): Promise<{ answer: string; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)

    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: msg.content }],
    }))

    // システムプロンプトがあれば先頭に追加
    if (systemPrompt) {
      contents.unshift(
        { role: 'user' as const, parts: [{ text: systemPrompt }] },
        { role: 'model' as const, parts: [{ text: '承知しました。' }] }
      )
    }

    const response = await ai.models.generateContent({
      model: model || DEFAULT_MODEL,
      contents,
    })

    return { answer: response.text || '', error: null }
  } catch (error: any) {
    console.error('Chat error:', error)
    return { answer: '', error: error.message }
  }
}

// ストア一覧取得
export async function listStores(
  apiKey: string
): Promise<{ stores: StoreInfo[]; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)
    const pager = await ai.fileSearchStores.list()

    const stores: StoreInfo[] = []
    // Pagerをイテレートしてストアを取得
    for await (const store of pager) {
      stores.push({
        name: store.name || '',
        displayName: store.displayName || '',
        createTime: store.createTime || '',
      })
    }

    return { stores, error: null }
  } catch (error: any) {
    console.error('List stores error:', error)
    return { stores: [], error: error.message }
  }
}

// ストア削除
export async function deleteStore(
  apiKey: string,
  storeName: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)
    await ai.fileSearchStores.delete({ name: storeName })
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Delete store error:', error)
    return { success: false, error: error.message }
  }
}

// アップロード済みファイル一覧を取得
export async function listFiles(
  apiKey: string
): Promise<{ files: FileInfo[]; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)
    const pager = await ai.files.list()

    const files: FileInfo[] = []
    for await (const file of pager) {
      files.push({
        name: file.name || '',
        displayName: file.displayName || '',
        mimeType: file.mimeType || '',
        sizeBytes: file.sizeBytes || '0',
        createTime: file.createTime || '',
        state: file.state || '',
      })
    }

    return { files, error: null }
  } catch (error: any) {
    console.error('List files error:', error)
    return { files: [], error: error.message }
  }
}

// ファイル削除
export async function deleteFile(
  apiKey: string,
  fileName: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)
    await ai.files.delete({ name: fileName })
    return { success: true, error: null }
  } catch (error: any) {
    console.error('Delete file error:', error)
    return { success: false, error: error.message }
  }
}

// ファイル情報
export interface FileInfo {
  name: string
  displayName: string
  mimeType: string
  sizeBytes: string
  createTime: string
  state: string
}

// 型定義
export interface Citation {
  title: string
  uri: string
  text: string
  source?: 'drive' | 'knowledge' // ソースの種類
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StoreInfo {
  name: string
  displayName: string
  createTime: string
}
