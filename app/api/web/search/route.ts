/**
 * Web検索API
 *
 * Gemini APIのgoogleSearchツールを使用してWeb検索を実行
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'
export const maxDuration = 30

interface WebSearchRequest {
  query: string
  maxResults?: number
}

interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WebSearchRequest = await request.json()
    const { query, maxResults = 5 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'クエリが必要です' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini APIキーが設定されていません' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Gemini 2.0 Flash with Google Search grounding
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      tools: [{ googleSearch: {} } as unknown as { codeExecution: Record<string, never> }],
    })

    const prompt = `以下のトピックについて、最新のWeb情報を検索し、重要なポイントを簡潔にまとめてください。
情報源のURLも含めてください。

検索クエリ: ${query}

結果は以下のJSON形式で返してください：
\`\`\`json
{
  "summary": "検索結果の要約（200文字程度）",
  "results": [
    {
      "title": "記事タイトル",
      "url": "https://...",
      "snippet": "記事の概要（100文字程度）"
    }
  ]
}
\`\`\``

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // JSONを抽出
    let searchResults: WebSearchResult[] = []
    let summary = ''

    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                        responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                        responseText.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonStr)
        summary = parsed.summary || ''
        searchResults = (parsed.results || []).slice(0, maxResults)
      }
    } catch {
      // JSONパースに失敗した場合、テキストをそのまま使用
      summary = responseText.slice(0, 500)
    }

    // groundingMetadataから追加の情報を取得
    const candidate = result.response.candidates?.[0]
    const groundingMetadata = candidate?.groundingMetadata as {
      webSearchQueries?: string[]
      groundingChunks?: Array<{
        web?: {
          title?: string
          uri?: string
        }
      }>
    } | undefined

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web && searchResults.length < maxResults) {
          // 重複チェック
          const exists = searchResults.some(r => r.url === chunk.web?.uri)
          if (!exists && chunk.web.uri) {
            searchResults.push({
              title: chunk.web.title || 'Web情報',
              url: chunk.web.uri,
              snippet: '',
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      results: searchResults,
      totalResults: searchResults.length,
    })
  } catch (error) {
    console.error('Web search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Web検索に失敗しました' },
      { status: 500 }
    )
  }
}
