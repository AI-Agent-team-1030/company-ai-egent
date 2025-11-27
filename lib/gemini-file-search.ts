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
          citations.push({
            title: chunk.retrievedContext.title || 'Unknown',
            uri: chunk.retrievedContext.uri || '',
            text: chunk.retrievedContext.text || '',
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

// 型定義
export interface Citation {
  title: string
  uri: string
  text: string
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
