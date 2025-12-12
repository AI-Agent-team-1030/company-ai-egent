# Firebase + Gemini API + File Search セットアップ指示書

以下の手順を順番に実行してください。すべてブラウザ上で完結します。

---

## Part 1: Firebase プロジェクト作成

1. https://console.firebase.google.com/ を開く
2. Googleアカウントでログイン（未ログインの場合）
3. 「プロジェクトを作成」または「プロジェクトを追加」をクリック
4. プロジェクト名を入力: `corporate-ai-platform`
5. 「続行」をクリック
6. Google アナリティクスの画面で「このプロジェクトで Google アナリティクスを有効にする」を**オフ**にする
7. 「プロジェクトを作成」をクリック
8. 作成完了まで待つ（30秒〜1分程度）
9. 「続行」をクリックしてプロジェクトダッシュボードへ

---

## Part 2: Firebase Authentication 設定


1. 左サイドメニューから「構築」セクションを展開
2. 「Authentication」をクリック
3. 「始める」ボタンをクリック
4. 「Sign-in method」タブが表示される
5. 「ネイティブのプロバイダ」セクションの「メール／パスワード」をクリック
6. 「メール／パスワード」の右にあるトグルを**有効**にする
7. 「メールリンク（パスワードなしでログイン）」は**無効のまま**でOK
8. 「保存」をクリック
9. 「メール／パスワード」が「有効」と表示されていることを確認

---

## Part 3: Firebase ウェブアプリ登録

1. 左上の「プロジェクトの概要」の横にある**歯車アイコン**をクリック
2. 「プロジェクトの設定」を選択
3. 「全般」タブの下部「マイアプリ」セクションまでスクロール
4. 「アプリを追加」または**ウェブアイコン `</>`** をクリック
5. 「アプリのニックネーム」に `web-client` と入力
6. 「このアプリの Firebase Hosting も設定します」は**チェックしない**
7. 「アプリを登録」をクリック
8. 「Firebase SDK の追加」画面で `firebaseConfig` が表示される
9. **以下の形式で全ての値をメモ帳にコピー**:

```
【Firebase Config】
apiKey: ここに値をコピー
authDomain: ここに値をコピー
projectId: ここに値をコピー
storageBucket: ここに値をコピー
messagingSenderId: ここに値をコピー
appId: ここに値をコピー
```

10. 「コンソールに進む」をクリック

---

## Part 4: Google Cloud 課金有効化

1. 新しいタブで https://console.cloud.google.com/ を開く
2. 上部のプロジェクトセレクタ（「プロジェクトを選択」と表示）をクリック
3. 先ほど作成した `corporate-ai-platform` を選択
4. 左上のハンバーガーメニュー「≡」をクリック
5. 「お支払い」をクリック
6. 「請求先アカウントをリンク」をクリック
7. 既存の請求先アカウントがあれば選択、なければ「請求先アカウントを作成」
8. 新規作成の場合:
   - 国: 日本
   - アカウントの種類: 個人 または ビジネス
   - クレジットカード情報を入力
   - 「送信して課金を有効にする」をクリック
9. プロジェクトに請求先アカウントがリンクされたことを確認

---

## Part 5: Gemini API（Generative Language API）有効化

1. Google Cloud Console で https://console.cloud.google.com/apis/library を開く
2. 上部でプロジェクトが `corporate-ai-platform` になっていることを確認
3. 検索バーに `Generative Language API` と入力
4. 検索結果から「Generative Language API」をクリック
5. 「有効にする」ボタンをクリック
6. 有効化が完了するまで待つ（数秒）
7. 「API が有効です」と表示されることを確認

---

## Part 6: Gemini API キー作成

1. https://console.cloud.google.com/apis/credentials を開く
2. 上部でプロジェクトが `corporate-ai-platform` になっていることを確認
3. 「+ 認証情報を作成」をクリック
4. 「API キー」を選択
5. API キーが生成されポップアップで表示される
6. **API キーをメモ帳にコピー**（後で見れなくなるので必ずコピー）

```
【Gemini API キー】
APIキー: ここにコピー
```

7. 「キーを制限」をクリック（セキュリティのため推奨）
8. 「API キーの制限」画面で:
   - 名前を `gemini-api-key` に変更（任意）
   - 「API の制限」セクションで「キーを制限」を選択
   - 「API を選択」ドロップダウンから「Generative Language API」を選択
9. 「保存」をクリック

---

## Part 7: Gemini File Search 動作確認（Google AI Studio）

1. 新しいタブで https://aistudio.google.com/ を開く
2. 右上でプロジェクトが `corporate-ai-platform` になっていることを確認
3. 左メニューの「Get API key」をクリック
4. 先ほど作成した API キーが表示されていることを確認
5. 左メニューの「Create Prompt」または「新しいプロンプト」をクリック
6. 画面が表示されればセットアップ完了

※ File Search のストア作成はアプリのコードから自動で行うため、ここでの追加設定は不要です。

---

## 完了チェックリスト

以下がすべて完了していることを確認してください:

- [ ] Firebase プロジェクト作成完了
- [ ] Firebase Authentication（メール/パスワード）有効化完了
- [ ] Firebase ウェブアプリ登録完了 → Config 取得済み
- [ ] Google Cloud 課金有効化完了
- [ ] Generative Language API 有効化完了
- [ ] Gemini API キー作成完了 → キー取得済み
- [ ] Google AI Studio でプロジェクト確認完了

---

## 取得した情報（報告用テンプレート）

以下の情報をすべて埋めて報告してください:

```
===========================================
Firebase + Gemini セットアップ完了報告
===========================================

【Firebase Config】
apiKey:
authDomain:
projectId:
storageBucket:
messagingSenderId:
appId:

【Gemini API キー】
APIキー:

【確認事項】
- Firebase Auth (メール/パスワード): 有効 / 未設定
- Google Cloud 課金: 有効 / 未設定
- Generative Language API: 有効 / 未設定

===========================================
```

---

## 注意事項

1. **API キーは絶対に公開しないでください**（GitHub等にコミットしない）
2. **課金有効化しても無料枠内なら請求は発生しません**
3. Firebase と Google Cloud は同じプロジェクトを共有しています
4. 何かエラーが出た場合はスクリーンショットを撮って報告してください

---

## 所要時間目安

- 全体: 約10〜15分
- ※ クレジットカード登録がある場合は追加で5分程度
