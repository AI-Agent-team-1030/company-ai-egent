import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
} from 'firebase/auth'
import { auth, driveAuth } from './firebase'

// Firebaseエラーかどうかを判定
function isAuthError(error: unknown): error is AuthError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as AuthError).code === 'string'
  )
}

// エラーメッセージを取得
function getErrorFromUnknown(error: unknown): { code?: string; message: string } {
  if (isAuthError(error)) {
    return { code: error.code, message: getErrorMessage(error.code) }
  }
  if (error instanceof Error) {
    return { message: error.message }
  }
  return { message: '認証エラーが発生しました' }
}

// Googleプロバイダー（Driveスコープ付き）
const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly')
googleProvider.setCustomParameters({
  prompt: 'select_account',  // アカウント選択画面を毎回表示
  access_type: 'offline',    // リフレッシュトークンを取得
})

// 認証結果の型定義
interface AuthResult {
  data: { user: User; session?: { user: User } } | null
  error: { code?: string; message: string } | null
}

// サインアップ
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { data: { user: userCredential.user }, error: null }
  } catch (error: unknown) {
    return { data: null, error: getErrorFromUnknown(error) }
  }
}

// ログイン
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { data: { user: userCredential.user, session: { user: userCredential.user } }, error: null }
  } catch (error: unknown) {
    return { data: null, error: getErrorFromUnknown(error) }
  }
}

// ログアウト
export async function signOut(): Promise<{ error: { message: string } | null }> {
  try {
    await firebaseSignOut(auth)
    return { error: null }
  } catch (error: unknown) {
    const errInfo = getErrorFromUnknown(error)
    return { error: { message: errInfo.message } }
  }
}

// 現在のユーザーを取得
export async function getCurrentUser(): Promise<{ user: User | null; error: null }> {
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

// Google認証結果の型定義
interface GoogleAuthResult {
  accessToken: string | null
  error: { message: string } | null
}

// Googleドライブ接続（ポップアップ方式）
// 別のFirebase Authインスタンス(driveAuth)を使用し、メイン認証に影響を与えない
export async function linkGoogleDrive(): Promise<GoogleAuthResult> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return { accessToken: null, error: { message: 'ログインしていません' } }
  }

  try {
    // 別のAuthインスタンスでGoogle認証（メイン認証には影響しない）
    const result = await signInWithPopup(driveAuth, googleProvider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken || null

    if (accessToken) {
      sessionStorage.setItem('google_drive_token', accessToken)
    }

    // driveAuthからサインアウト（トークンは取得済みなので不要）
    await firebaseSignOut(driveAuth)

    return { accessToken, error: null }
  } catch (error: unknown) {
    const errorCode = isAuthError(error) ? error.code : ''
    return { accessToken: null, error: { message: getGoogleErrorMessage(errorCode) } }
  }
}

// リダイレクト結果を処理（未使用だが互換性のため残す）
export async function handleGoogleDriveRedirect(): Promise<GoogleAuthResult> {
  return { accessToken: null, error: null }
}

// リダイレクト待ちかどうか確認（未使用だが互換性のため残す）
export function isGoogleDriveRedirectPending(): boolean {
  return false
}

// Googleドライブのアクセストークンを取得
export function getGoogleDriveToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('google_drive_token')
}

// Googleドライブの接続を解除
export function clearGoogleDriveToken(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('google_drive_token')
}

// Googleエラーメッセージ
function getGoogleErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Google認証がキャンセルされました'
    case 'auth/popup-blocked':
      return 'ポップアップがブロックされました。ポップアップを許可してください'
    case 'auth/cancelled-popup-request':
      return '認証リクエストがキャンセルされました'
    case 'auth/account-exists-with-different-credential':
      return 'このメールアドレスは別の方法で登録されています'
    default:
      return 'Google認証エラーが発生しました'
  }
}

// ============================================
// OneDrive連携（MSAL使用）
// ============================================

// OneDrive認証結果の型定義
interface OnedriveAuthResult {
  accessToken: string | null
  error: { message: string } | null
}

// OneDrive接続（MSALポップアップ方式）
export async function linkOneDrive(): Promise<OnedriveAuthResult> {
  const currentUser = auth.currentUser
  if (!currentUser) {
    return { accessToken: null, error: { message: 'ログインしていません' } }
  }

  // クライアントIDが設定されているか確認
  if (!process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID) {
    return {
      accessToken: null,
      error: { message: 'Microsoft Client IDが設定されていません。Azure ADアプリの登録が必要です。' }
    }
  }

  try {
    // MSALを動的インポート（サーバーサイドでのエラーを防ぐ）
    const { initializeMsal, onedriveScopes } = await import('./msal-config')
    const msalInstance = await initializeMsal()

    // ポップアップでログイン
    const response = await msalInstance.loginPopup({
      ...onedriveScopes,
      prompt: 'select_account', // アカウント選択画面を毎回表示
    })

    const accessToken = response.accessToken

    if (accessToken) {
      sessionStorage.setItem('onedrive_token', accessToken)
    }

    return { accessToken, error: null }
  } catch (error: unknown) {
    console.error('[OneDrive] Auth error:', error)
    return { accessToken: null, error: { message: getMicrosoftErrorMessage(error) } }
  }
}

// OneDriveのアクセストークンを取得
export function getOnedriveToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('onedrive_token')
}

// OneDriveの接続を解除
export function clearOnedriveToken(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('onedrive_token')
}

// Microsoftエラーメッセージ
function getMicrosoftErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const msalError = error as { errorCode?: string; errorMessage?: string }
    switch (msalError.errorCode) {
      case 'user_cancelled':
        return 'Microsoft認証がキャンセルされました'
      case 'popup_window_error':
        return 'ポップアップがブロックされました。ポップアップを許可してください'
      case 'interaction_in_progress':
        return '認証処理が進行中です。少し待ってから再試行してください'
      case 'consent_required':
        return 'アプリへのアクセス許可が必要です'
      case 'login_required':
        return 'Microsoftアカウントへのログインが必要です'
      default:
        if (msalError.errorMessage) {
          return msalError.errorMessage
        }
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Microsoft認証エラーが発生しました'
}
