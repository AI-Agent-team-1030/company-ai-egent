import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let app: App
let firestore: Firestore

function initAdmin() {
  if (getApps().length === 0) {
    // Cloud Run環境ではデフォルト認証が使用される
    // ローカル開発ではGOOGLE_APPLICATION_CREDENTIALS環境変数を設定
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // サービスアカウントキーファイルがある場合
      app = initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    } else {
      // Cloud Run環境（デフォルト認証）
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    }
  } else {
    app = getApps()[0]
  }

  firestore = getFirestore(app)
  return { app, firestore }
}

// 初期化してエクスポート
const { firestore: db } = initAdmin()

export { db }
