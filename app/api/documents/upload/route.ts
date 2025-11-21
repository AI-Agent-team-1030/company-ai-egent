import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserFromRequest } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // ユーザー認証チェック
    const { user, error: authError } = await getUserFromRequest(request)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folder_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ファイルサイズチェック（50MB制限）
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
    }

    // 対応しているファイル形式チェック
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD, Images (PNG, JPG, GIF)' },
        { status: 400 }
      )
    }

    // ファイル名の生成（重複防止）
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    // ユーザーIDをパスに含める
    const filename = `${user.id}/${timestamp}_${sanitizedFilename}`

    // ファイルをバイト配列に変換
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Supabase Storageにアップロード
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // データベースに記録
    const { data: document, error: dbError } = await supabase
      .from('uploaded_documents')
      .insert([
        {
          filename,
          original_filename: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.path,
          processed: false,
          user_id: user.id,
          folder_id: folderId || null,
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // アップロードしたファイルを削除
      await supabase.storage.from('documents').remove([filename])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // バックグラウンドでテキスト抽出処理を開始（非同期）
    extractTextFromDocument(document.id, filename, file.type).catch(err => {
      console.error('Text extraction error:', err)
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/documents/upload:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// テキスト抽出処理（非同期）
async function extractTextFromDocument(
  documentId: string,
  filename: string,
  fileType: string
) {
  try {
    // Storageからファイルを取得
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filename)

    if (downloadError) {
      throw downloadError
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    let text = ''

    // ファイルタイプに応じてテキスト抽出
    if (fileType === 'application/pdf') {
      // PDF
      const pdfParse = require('pdf-parse-fork')
      const pdfData = await pdfParse(buffer)
      text = pdfData.text
    } else if (fileType === 'text/plain' || fileType === 'text/markdown') {
      // テキスト・Markdown
      text = buffer.toString('utf-8')
    } else if (fileType === 'text/csv') {
      // CSV
      const { parse } = require('csv-parse/sync')
      const records = parse(buffer, { columns: true, skip_empty_lines: true })
      text = records.map((row: any) => Object.values(row).join(' ')).join('\n')
    } else if (
      fileType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // Word (.docx)
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel'
    ) {
      // Excel (.xlsx, .xls)
      const XLSX = require('xlsx')
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheets: string[] = []

      workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName]
        const sheetText = XLSX.utils.sheet_to_csv(sheet)
        sheets.push(`[シート: ${sheetName}]\n${sheetText}`)
      })

      text = sheets.join('\n\n')
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fileType === 'application/vnd.ms-powerpoint'
    ) {
      // PowerPoint (.pptx, .ppt)
      const officeParser = require('officeparser')
      text = await officeParser.parseOfficeAsync(buffer)
    } else if (fileType.startsWith('image/')) {
      // 画像 (OCR)
      const Tesseract = require('tesseract.js')
      const { data } = await Tesseract.recognize(buffer, 'jpn+eng', {
        logger: (m: any) => console.log(m),
      })
      text = data.text
    }

    if (!text) {
      throw new Error('No text extracted from document')
    }

    // テキストをチャンクに分割（2000文字ごと）
    const chunkSize = 2000
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }

    // チャンクをデータベースに保存
    const chunkRecords = chunks.map((chunk, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: chunk,
    }))

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords)

    if (chunksError) {
      throw chunksError
    }

    // ドキュメントを処理済みに更新
    await supabase
      .from('uploaded_documents')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    console.log(`Successfully processed document ${documentId}`)
  } catch (error) {
    console.error(`Failed to process document ${documentId}:`, error)
    // エラーをデータベースに記録することもできる
  }
}
