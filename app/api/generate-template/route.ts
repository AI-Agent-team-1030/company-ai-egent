import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''

const TEMPLATE_CATEGORIES = [
  '営業',
  'マーケティング',
  '業務効率化',
  'コミュニケーション',
  'カスタマーサポート',
]

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description) {
      return NextResponse.json(
        { error: '説明が必要です' },
        { status: 400 }
      )
    }

    if (!GEMINI_API_KEY) {
      logger.error('GEMINI_API_KEY is not configured')
      return NextResponse.json(
        { error: 'APIキーが設定されていません。管理者に連絡してください。' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `あなたはプロンプトテンプレート生成の専門家です。
ユーザーの説明に基づいて、業務で使えるプロンプトテンプレートを生成してください。

ユーザーの説明: ${description}

以下のJSON形式で出力してください。必ず有効なJSONのみを出力し、他のテキストは含めないでください。

{
  "name": "テンプレート名（短く分かりやすく）",
  "category": "カテゴリー（${TEMPLATE_CATEGORIES.join('/')}のいずれか）",
  "description": "テンプレートの説明（1行で簡潔に）",
  "prompt": "プロンプト本文（ユーザーが入力すべき部分は[変数名]の形式で記載。例: [顧客名]、[日付]など）"
}

プロンプト本文は実用的で具体的な内容にしてください。
■ を使って項目を分けると読みやすくなります。`

    let result
    try {
      result = await model.generateContent(prompt)
    } catch (apiError) {
      logger.error('Gemini API call failed:', apiError)
      return NextResponse.json(
        { error: 'AI APIとの通信に失敗しました。しばらく待ってから再試行してください。' },
        { status: 503 }
      )
    }

    const responseText = result.response.text()

    if (!responseText) {
      logger.error('Empty response from Gemini API')
      return NextResponse.json(
        { error: 'AIからの応答が空でした。再試行してください。' },
        { status: 500 }
      )
    }

    // JSONを抽出（コードブロックで囲まれている場合も対応）
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    // JSONをパース
    let template
    try {
      template = JSON.parse(jsonStr.trim())
    } catch (parseError) {
      logger.error('Failed to parse JSON from Gemini response:', responseText)
      return NextResponse.json(
        { error: 'AIの応答を解析できませんでした。再試行してください。' },
        { status: 500 }
      )
    }

    // 必須フィールドの確認
    if (!template.name || !template.prompt) {
      logger.error('Invalid template structure:', template)
      return NextResponse.json(
        { error: 'テンプレートの形式が不正です。再試行してください。' },
        { status: 500 }
      )
    }

    // カテゴリーが有効か確認
    if (!TEMPLATE_CATEGORIES.includes(template.category)) {
      template.category = '業務効率化' // デフォルト
    }

    // descriptionがなければ空文字を設定
    if (!template.description) {
      template.description = ''
    }

    return NextResponse.json(template)
  } catch (error) {
    logger.error('Template generation error:', error)
    return NextResponse.json(
      { error: 'テンプレートの生成に失敗しました' },
      { status: 500 }
    )
  }
}
