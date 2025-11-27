// 統合AIプロバイダーライブラリ
// Claude (Anthropic), GPT (OpenAI), Gemini (Google) をサポート

export type AIProvider = 'anthropic' | 'openai' | 'gemini'

export interface AIProviderConfig {
  id: AIProvider
  name: string
  displayName: string
  models: { id: string; name: string }[]
  settingKey: string
  isBuiltIn?: boolean // 標準搭載（環境変数で提供）
}

// 標準搭載のGemini APIキー（環境変数から取得）
export const BUILT_IN_GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''

// Geminiモデル一覧
export const GEMINI_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-exp-1206', name: 'Gemini 3' },
]

// 全モデル一覧（全プロバイダー）
export interface ModelOption {
  id: string
  name: string
  provider: AIProvider
  providerName: string
}

export const ALL_MODELS: ModelOption[] = [
  // Gemini（常に利用可能）
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'gemini', providerName: 'Google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini', providerName: 'Google' },
  { id: 'gemini-exp-1206', name: 'Gemini 3', provider: 'gemini', providerName: 'Google' },
  // Claude（APIキー必要）
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude 4.5 Sonnet', provider: 'anthropic', providerName: 'Anthropic' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude 4.5 Haiku', provider: 'anthropic', providerName: 'Anthropic' },
  // GPT（APIキー必要）
  { id: 'gpt-5.1', name: 'GPT-5.1', provider: 'openai', providerName: 'OpenAI' },
]

// ファイルサーチ用モデル
export const FILE_SEARCH_MODEL = 'gemini-2.5-pro'

// デフォルトモデル
export const DEFAULT_MODEL = 'gemini-2.5-pro'

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Gemini',
    displayName: 'Google Gemini（標準）',
    models: GEMINI_MODELS,
    settingKey: 'gemini_api_key',
    isBuiltIn: true,
  },
  {
    id: 'anthropic',
    name: 'Claude',
    displayName: 'Anthropic (Claude)',
    models: [
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    ],
    settingKey: 'anthropic_api_key',
  },
  {
    id: 'openai',
    name: 'GPT',
    displayName: 'OpenAI (GPT)',
    models: [
      { id: 'gpt-5.1', name: 'GPT-5.1' },
      { id: 'gpt-5.1-mini', name: 'GPT-5.1 Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
    ],
    settingKey: 'openai_api_key',
  },
]

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  content: string
  error: string | null
}

// Claude API (Anthropic)
async function callClaude(
  apiKey: string,
  messages: ChatMessage[],
  model: string = 'claude-sonnet-4-20250514',
  systemPrompt?: string
): Promise<ChatResponse> {
  try {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt || '日本語で回答してください。',
        messages: formattedMessages,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Claude API エラー')
    }

    const data = await response.json()
    return {
      content: data.content[0]?.text || '',
      error: null,
    }
  } catch (error: any) {
    console.error('Claude API error:', error)
    return {
      content: '',
      error: error.message || 'Claude APIでエラーが発生しました',
    }
  }
}

// GPT API (OpenAI)
async function callGPT(
  apiKey: string,
  messages: ChatMessage[],
  model: string = 'gpt-4o',
  systemPrompt?: string
): Promise<ChatResponse> {
  try {
    const formattedMessages: { role: string; content: string }[] = []

    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt })
    }

    messages.forEach((msg) => {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      })
    })

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API エラー')
    }

    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content || '',
      error: null,
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    return {
      content: '',
      error: error.message || 'OpenAI APIでエラーが発生しました',
    }
  }
}

// Gemini API (Google)
async function callGemini(
  apiKey: string,
  messages: ChatMessage[],
  model: string = 'gemini-2.0-flash',
  systemPrompt?: string
): Promise<ChatResponse> {
  try {
    const contents: { role: string; parts: { text: string }[] }[] = []

    // システムプロンプトを最初に追加
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] })
      contents.push({ role: 'model', parts: [{ text: '承知しました。' }] })
    }

    // メッセージを変換
    messages.forEach((msg) => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Gemini API エラー')
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      content: text,
      error: null,
    }
  } catch (error: any) {
    console.error('Gemini API error:', error)
    return {
      content: '',
      error: error.message || 'Gemini APIでエラーが発生しました',
    }
  }
}

// 統合チャット関数
export async function chat(
  provider: AIProvider,
  apiKey: string,
  messages: ChatMessage[],
  model?: string,
  systemPrompt?: string
): Promise<ChatResponse> {
  const defaultSystemPrompt = systemPrompt || '日本語で回答してください。質問に対して丁寧に回答してください。'

  switch (provider) {
    case 'anthropic':
      return callClaude(apiKey, messages, model || 'claude-sonnet-4-5-20250929', defaultSystemPrompt)
    case 'openai':
      return callGPT(apiKey, messages, model || 'gpt-5.1', defaultSystemPrompt)
    case 'gemini':
      return callGemini(apiKey, messages, model || 'gemini-2.5-pro', defaultSystemPrompt)
    default:
      return { content: '', error: '不明なAIプロバイダーです' }
  }
}

// プロバイダー情報を取得
export function getProviderById(id: AIProvider): AIProviderConfig | undefined {
  return AI_PROVIDERS.find((p) => p.id === id)
}

// APIキーのsettingKeyからプロバイダーを取得
export function getProviderBySettingKey(settingKey: string): AIProviderConfig | undefined {
  return AI_PROVIDERS.find((p) => p.settingKey === settingKey)
}
