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

// 検索クエリを生成（Query Rewriting）
export async function generateSearchQuery(
  apiKey: string,
  userQuestion: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ query: string; error: string | null }> {
  try {
    const ai = createGeminiClient(apiKey)

    // 会話履歴を文字列に変換（直近3ターンまで）
    const recentHistory = conversationHistory.slice(-6)
    const historyText = recentHistory.length > 0
      ? recentHistory.map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`).join('\n')
      : ''

    const prompt = `あなたは社内ナレッジベースを検索するための最適なクエリを生成するアシスタントです。

${historyText ? `【会話履歴】\n${historyText}\n\n` : ''}【ユーザーの質問】
${userQuestion}

上記の質問に対して、社内ナレッジベースから関連情報を見つけるための最適な検索クエリを生成してください。

ルール：
- 検索クエリのみを出力（説明不要）
- 3〜5個のキーワードを含める
- 「それ」「これ」などの指示語は具体的な言葉に置き換える
- 会話の文脈を考慮して、何について聞いているのかを明確にする
- 日本語で出力

検索クエリ：`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.1, // 低めで一貫性を重視
        maxOutputTokens: 100,
      },
    })

    const query = response.text?.trim() || userQuestion
    console.log('[Query Rewriting] Original:', userQuestion)
    console.log('[Query Rewriting] Generated:', query)

    return { query, error: null }
  } catch (error: any) {
    console.error('Query generation error:', error)
    // エラー時は元の質問をそのまま使用
    return { query: userQuestion, error: error.message }
  }
}

// File Search を使った質問応答
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
              fileSearchStoreNames: storeNames,
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
          // タイトルを取得（ファイルIDの場合は読みやすい形式に変換）
          let title = chunk.retrievedContext.title || ''

          // タイトルがファイルIDっぽい場合（files/xxxなど）は改善
          if (!title || title.startsWith('files/') || title.match(/^[a-zA-Z0-9_-]+$/)) {
            // URIから情報を取得できるか確認
            const uri = chunk.retrievedContext.uri || ''
            // URIにファイル名が含まれている場合があるので抽出を試みる
            const uriMatch = uri.match(/displayName=([^&]+)/)
            if (uriMatch) {
              title = decodeURIComponent(uriMatch[1])
            } else {
              // textの最初の部分をタイトルとして使用
              const text = chunk.retrievedContext.text || ''
              const firstLine = text.split('\n')[0].trim()
              if (firstLine && firstLine.length < 100) {
                title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
              } else {
                title = 'ナレッジドキュメント'
              }
            }
          }

          console.log('[File Search] Citation:', {
            originalTitle: chunk.retrievedContext.title,
            processedTitle: title,
            uri: chunk.retrievedContext.uri
          })

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
