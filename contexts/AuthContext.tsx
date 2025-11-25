'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 初期セッションを取得
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        // エラーがある場合はセッションをクリア
        setSession(null)
        setUser(null)
        // ローカルストレージもクリア
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
        }
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }).catch((error) => {
      console.error('Failed to get session:', error)
      setSession(null)
      setUser(null)
      setLoading(false)
    })

    // 認証状態の変更をリッスン
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session)

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }

      if (event === 'SIGNED_OUT') {
        // ローカルストレージをクリア
        if (typeof window !== 'undefined') {
          localStorage.removeItem('company_id')
          localStorage.removeItem('company_name')
        }
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called with email:', email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('[AuthContext] signInWithPassword completed:', { data, error })

      // データとエラーを返す（リダイレクトはログインページで処理）
      return { data, error }
    } catch (err) {
      console.error('[AuthContext] signIn exception:', err)
      return { data: null, error: err }
    }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // メール確認リンクを無効化
      },
    })

    // データとエラーを返すのみ。リダイレクトはサインアップページで処理
    return { data, error }
  }

  const signOut = async () => {
    // ローカルストレージをクリア
    if (typeof window !== 'undefined') {
      localStorage.removeItem('company_id')
      localStorage.removeItem('company_name')
    }
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
