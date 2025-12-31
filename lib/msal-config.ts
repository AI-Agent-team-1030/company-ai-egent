/**
 * Microsoft Authentication Library (MSAL) 設定
 * OneDrive連携のためのMicrosoft認証
 */

import { PublicClientApplication, Configuration, LogLevel } from '@azure/msal-browser'

// MSAL設定
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/common', // 組織と個人アカウント両方対応
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message)
            break
          case LogLevel.Warning:
            console.warn('[MSAL]', message)
            break
          case LogLevel.Info:
            // console.info('[MSAL]', message)
            break
          case LogLevel.Verbose:
            // console.debug('[MSAL]', message)
            break
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
}

// OneDrive読み取りスコープ
export const onedriveScopes = {
  scopes: [
    'User.Read',        // ユーザー情報
    'Files.Read',       // ファイル読み取り
    'Files.Read.All',   // すべてのファイル読み取り
  ],
}

// MSALインスタンス（シングルトン）
let msalInstance: PublicClientApplication | null = null

/**
 * MSALインスタンスを取得（遅延初期化）
 */
export function getMsalInstance(): PublicClientApplication {
  if (typeof window === 'undefined') {
    throw new Error('MSAL can only be used in browser environment')
  }

  if (!msalInstance) {
    if (!process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID) {
      throw new Error('Microsoft Client ID is not configured. Set NEXT_PUBLIC_MICROSOFT_CLIENT_ID in .env.local')
    }
    msalInstance = new PublicClientApplication(msalConfig)
  }

  return msalInstance
}

/**
 * MSALインスタンスを初期化
 */
export async function initializeMsal(): Promise<PublicClientApplication> {
  const instance = getMsalInstance()
  await instance.initialize()
  return instance
}
