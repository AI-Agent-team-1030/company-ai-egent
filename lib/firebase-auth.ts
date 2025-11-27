import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './firebase'

// サインアップ
export async function signUp(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { data: { user: userCredential.user }, error: null }
  } catch (error: any) {
    return { data: null, error: { message: getErrorMessage(error.code) } }
  }
}

// ログイン
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { data: { user: userCredential.user, session: { user: userCredential.user } }, error: null }
  } catch (error: any) {
    return { data: null, error: { message: getErrorMessage(error.code) } }
  }
}

// ログアウト
export async function signOut() {
  try {
    await firebaseSignOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: { message: error.message } }
  }
}

// 現在のユーザーを取得
export async function getCurrentUser(): Promise<{ user: User | null; error: any }> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve({ user, error: null })
    })
  })
}

// セッションを取得（Firebase では currentUser を返す）
export async function getSession() {
  const user = auth.currentUser
  if (user) {
    return { session: { user }, error: null }
  }
  return { session: null, error: null }
}

// 認証状態の監視
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// エラーメッセージの日本語化
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に登録されています'
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません'
    case 'auth/operation-not-allowed':
      return 'この認証方法は許可されていません'
    case 'auth/weak-password':
      return 'パスワードは6文字以上で設定してください'
    case 'auth/user-disabled':
      return 'このアカウントは無効になっています'
    case 'auth/user-not-found':
      return 'メールアドレスまたはパスワードが正しくありません'
    case 'auth/wrong-password':
      return 'メールアドレスまたはパスワードが正しくありません'
    case 'auth/invalid-credential':
      return 'メールアドレスまたはパスワードが正しくありません'
    case 'auth/too-many-requests':
      return 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください'
    default:
      return '認証エラーが発生しました'
  }
}
