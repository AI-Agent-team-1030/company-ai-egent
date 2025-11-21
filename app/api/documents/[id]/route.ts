import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// GET: ドキュメント詳細とチャンクを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ユーザー認証チェック
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ドキュメント情報を取得
    const { data: document, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching document:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 404 })
    }

    // チャンクを取得
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', params.id)
      .order('chunk_index', { ascending: true })

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError)
      return NextResponse.json({ error: chunksError.message }, { status: 500 })
    }

    // チャンクを結合してマークダウン形式に変換
    const fullText = chunks?.map(c => c.content).join('\n\n') || ''

    // マークダウン形式に変換
    const markdown = convertToMarkdown(fullText, document.original_filename, document.file_type)

    return NextResponse.json({
      document,
      chunks,
      fullText,
      markdown,
    })
  } catch (error) {
    console.error('Error in GET /api/documents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// テキストをマークダウン形式に変換
function convertToMarkdown(text: string, filename: string, fileType: string): string {
  const timestamp = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let markdown = `# ${filename}\n\n`
  markdown += `**変換日時:** ${timestamp}  \n`
  markdown += `**ファイル形式:** ${fileType}\n\n`
  markdown += `---\n\n`

  // 行ごとに分割
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)

  let inList = false
  let listItems: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = lines[i + 1] || ''

    // 箇条書き・番号付きリストの検出
    const isBulletPoint = /^[\-\*\•]\s/.test(line)
    const isNumberedList = /^\d+[\.\)]\s/.test(line)
    const isList = isBulletPoint || isNumberedList

    if (isList) {
      // リスト項目を収集
      if (!inList) {
        inList = true
        listItems = []
      }

      // 箇条書きの場合
      if (isBulletPoint) {
        listItems.push(`- ${line.replace(/^[\-\*\•]\s/, '')}`)
      }
      // 番号付きリストの場合
      else if (isNumberedList) {
        const num = listItems.length + 1
        listItems.push(`${num}. ${line.replace(/^\d+[\.\)]\s/, '')}`)
      }

      // 次の行がリストでない場合、リストを出力
      const nextIsList = /^[\-\*\•]\s/.test(nextLine) || /^\d+[\.\)]\s/.test(nextLine)
      if (!nextIsList) {
        markdown += listItems.join('\n') + '\n\n'
        inList = false
        listItems = []
      }
    }
    // 見出しの検出（より厳密に）
    else if (
      line.length < 60 &&
      !line.match(/[。、]/g) &&
      /^[【\[《]?[^\s]+[】\]》]?$/.test(line) ||
      (line.length < 40 && !line.includes('、') && !line.includes('。'))
    ) {
      // 前の行と次の行が空白または短い場合、見出しと判定
      const prevLine = i > 0 ? lines[i - 1] : ''
      const standalone = prevLine.length < 20 || i === 0

      if (standalone) {
        markdown += `## ${line}\n\n`
      } else {
        markdown += `${line}\n\n`
      }
    }
    // セクション番号付き見出し（1. や 1-1 など）
    else if (/^[\d\-\.]+\s+[^\s]/.test(line) && line.length < 80) {
      markdown += `### ${line}\n\n`
    }
    // 通常の段落
    else {
      // 長い文章を適切に分割
      if (line.length > 200) {
        // 句点で分割
        const sentences = line.split(/([。！？])/).reduce((acc: string[], curr, idx, arr) => {
          if (idx % 2 === 0 && curr) {
            const punctuation = arr[idx + 1] || ''
            acc.push(curr + punctuation)
          }
          return acc
        }, [])

        // 文ごとに段落として出力
        sentences.forEach(sentence => {
          if (sentence.trim()) {
            markdown += `${sentence.trim()}\n\n`
          }
        })
      } else {
        markdown += `${line}\n\n`
      }
    }
  }

  // 最後にリストが残っている場合
  if (inList && listItems.length > 0) {
    markdown += listItems.join('\n') + '\n\n'
  }

  // 連続する空行を削除
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  return markdown
}

// DELETE: ドキュメントを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ユーザー認証チェック
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ドキュメント情報を取得（user_idもチェック）
    const { data: document, error: fetchError } = await supabase
      .from('uploaded_documents')
      .select('filename')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching document:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Storageからファイルを削除
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.filename])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // ストレージ削除失敗してもDBからは削除を続行
    }

    // データベースから削除（チャンクも自動削除される）
    const { error: deleteError } = await supabase
      .from('uploaded_documents')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/documents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
