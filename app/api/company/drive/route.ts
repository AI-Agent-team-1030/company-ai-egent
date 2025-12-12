import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'
import { encrypt, decrypt } from '@/lib/encryption'
import { db } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// GET: 会社のDrive接続情報を取得（トークンは復号化して返す）
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プロフィールから会社IDを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Firestoreから接続情報を取得
    const companyDoc = await db.collection('companies').doc(profile.company_id).get()

    if (!companyDoc.exists) {
      return NextResponse.json({ driveConnection: null })
    }

    const data = companyDoc.data()
    const connection = data?.driveConnection

    if (!connection) {
      return NextResponse.json({ driveConnection: null })
    }

    // トークンは復号化して返す（クライアントで使用するため）
    return NextResponse.json({
      driveConnection: {
        isConnected: connection.isConnected,
        connectedByEmail: connection.connectedByEmail,
        connectedAt: connection.connectedAt?.toDate?.() || null,
        // トークンは復号化
        accessToken: connection.accessToken ? decrypt(connection.accessToken) : null,
        tokenExpiresAt: connection.tokenExpiresAt?.toDate?.() || null,
      }
    })
  } catch (error: any) {
    console.error('Error getting drive connection:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Drive接続情報を保存（トークンは暗号化して保存）
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { accessToken, refreshToken, expiresAt, email } = body

    // プロフィールから会社IDを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // トークンを暗号化して保存
    const connectionData: Record<string, any> = {
      isConnected: true,
      connectedBy: user.id,
      connectedByEmail: email || user.email,
      connectedAt: new Date(),
    }

    if (accessToken) {
      connectionData.accessToken = encrypt(accessToken)
    }
    if (refreshToken) {
      connectionData.refreshToken = encrypt(refreshToken)
    }
    if (expiresAt) {
      connectionData.tokenExpiresAt = new Date(expiresAt)
    }

    // Firestoreに保存
    await db.collection('companies').doc(profile.company_id).set({
      driveConnection: connectionData,
      updatedAt: new Date(),
    }, { merge: true })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving drive connection:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Drive接続を解除
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getUserFromRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // 接続情報を削除
    await db.collection('companies').doc(profile.company_id).set({
      driveConnection: {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
      },
      updatedAt: new Date(),
    }, { merge: true })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error disconnecting drive:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
