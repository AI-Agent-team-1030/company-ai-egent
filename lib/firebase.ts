import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase アプリの初期化（重複初期化を防ぐ）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Googleドライブ連携用の別インスタンス（メイン認証に影響を与えないため）
const driveAppName = 'drive-auth'
const driveApp = getApps().find(a => a.name === driveAppName)
  ? getApp(driveAppName)
  : initializeApp(firebaseConfig, driveAppName)

// Firebase Auth（メイン）
export const auth = getAuth(app)

// Firebase Auth（Googleドライブ連携用）
export const driveAuth = getAuth(driveApp)

// Firestore
export const db = getFirestore(app)

// Firebase Storage
export const storage = getStorage(app)

export default app
