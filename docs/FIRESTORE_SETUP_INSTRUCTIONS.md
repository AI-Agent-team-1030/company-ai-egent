# Firestore Database セットアップ指示書

以下の手順を順番に実行してください。

---

## Part 1: Firestore Database を有効化

1. https://console.firebase.google.com/ を開く
2. 先ほど作成した `corporate-ai-platform` プロジェクトを選択
3. 左サイドメニューから「構築」→「Firestore Database」をクリック
4. 「データベースを作成」をクリック
5. 「本番環境モードで開始」を選択して「次へ」
6. ロケーションで「asia-northeast1 (Tokyo)」を選択
7. 「有効にする」をクリック
8. データベース作成完了まで待つ（1〜2分）

---

## Part 2: セキュリティルールの設定

1. Firestore Database の画面で「ルール」タブをクリック
2. 以下のルールをコピーして貼り付け:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のデータのみ読み書き可能

    // Companies コレクション
    match /companies/{companyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false; // 管理者のみ
    }

    // Profiles コレクション
    match /profiles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }

    // Conversations コレクション
    match /conversations/{conversationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;

      // Messages サブコレクション
      match /messages/{messageId} {
        allow read: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
        allow create: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
        allow update, delete: if false;
      }
    }

    // FileSearchStores コレクション
    match /fileSearchStores/{storeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }

    // Documents コレクション
    match /documents/{documentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

3. 「公開」ボタンをクリック
4. 「公開」をクリックして確認

---

## Part 3: インデックスの作成（必要な場合）

インデックスはアプリを使用中に自動で必要なものが表示されます。
エラーが出た場合は、エラーメッセージに含まれるリンクをクリックしてインデックスを作成してください。

よく使うインデックス:
- `conversations` コレクション: `userId` (昇順) + `updatedAt` (降順)
- `documents` コレクション: `companyId` (昇順) + `createdAt` (降順)

---

## 完了チェックリスト

- [ ] Firestore Database が有効化されている
- [ ] ロケーションが asia-northeast1 (Tokyo) になっている
- [ ] セキュリティルールが公開されている

---

## 完了後の報告

```
===========================================
Firestore セットアップ完了報告
===========================================

- Firestore Database: 有効 / 未設定
- ロケーション: asia-northeast1 / その他
- セキュリティルール: 公開済み / 未設定

===========================================
```

---

## 注意事項

- セキュリティルールは認証済みユーザーのみがアクセスできるように設定されています
- 本番環境モードで開始しているため、ルールが正しく設定されていないとアクセスできません
- ルールを変更した場合は必ず「公開」をクリックしてください
