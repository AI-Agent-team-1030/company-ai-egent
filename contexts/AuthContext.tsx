'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
} from '@/lib/firebase-auth'
import { authLogger } from '@/lib/logger'

interface UserProfile {
  userName: string
  companyId: string
  companyName: string
}

// 認証結果の型
interface AuthResult {
  data: { user: User; session?: { user: User } } | null
  error: { code?: string; message: string } | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Firestoreからプロフィールを取得
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', firebaseUser.uid))
          if (profileDoc.exists()) {
            const data = profileDoc.data()
            setProfile({
              userName: data.userName,
              companyId: data.companyId,
              companyName: data.companyName,
            })
            // ローカルストレージにも保存（互換性のため）
            localStorage.setItem('company_id', data.companyId)
            localStorage.setItem('company_name', data.companyName)
          }
        } catch (error) {
          authLogger.error('Failed to fetch profile:', error)
        }
      } else {
        setProfile(null)
        localStorage.removeItem('company_id')
        localStorage.removeItem('company_name')
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return firebaseSignIn(email, password)
  }

  const signUp = async (email: string, password: string) => {
    return firebaseSignUp(email, password)
  }

  const signOut = async () => {
    localStorage.removeItem('company_id')
    localStorage.removeItem('company_name')
    await firebaseSignOut()
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
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
