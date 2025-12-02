# GCP Cloud Run デプロイガイド（リポジトリ連携版）

## 概要

GitHub にプッシュするだけで自動デプロイされる構成です。

```
git push → Cloud Build（自動ビルド）→ Cloud Run（自動デプロイ）
```

---

## 1. 初期セットアップ（1回だけ）

### 1.1 gcloud CLI の認証

```bash
gcloud auth login
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID
```

### 1.2 必要な API を有効化

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

### 1.3 Artifact Registry リポジトリ作成

```bash
gcloud artifacts repositories create cloud-run-images \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Cloud Run container images"
```

---

## 2. Secret Manager に環境変数を登録

Firebase と Gemini の認証情報を Secret Manager に登録します。

```bash
# Firebase 設定
echo -n "your-firebase-api-key" | gcloud secrets create FIREBASE_API_KEY --data-file=-
echo -n "your-project.firebaseapp.com" | gcloud secrets create FIREBASE_AUTH_DOMAIN --data-file=-
echo -n "your-project-id" | gcloud secrets create FIREBASE_PROJECT_ID --data-file=-
echo -n "your-project.firebasestorage.app" | gcloud secrets create FIREBASE_STORAGE_BUCKET --data-file=-
echo -n "your-sender-id" | gcloud secrets create FIREBASE_MESSAGING_SENDER_ID --data-file=-
echo -n "your-app-id" | gcloud secrets create FIREBASE_APP_ID --data-file=-

# Gemini API
echo -n "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

### シークレットの更新（値を変更する場合）

```bash
echo -n "new-value" | gcloud secrets versions add FIREBASE_API_KEY --data-file=-
```

---

## 3. Cloud Build にシークレットへのアクセス権限を付与

```bash
# Cloud Build サービスアカウントを取得
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Secret Manager へのアクセス権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"

# Cloud Run 管理者権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

# サービスアカウントユーザー権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"
```

---

## 4. GitHub リポジトリを Cloud Build に接続

### 4.1 GCP Console から接続

1. [Cloud Build トリガー](https://console.cloud.google.com/cloud-build/triggers) を開く
2. 「リポジトリを接続」をクリック
3. 「GitHub（Cloud Build GitHub アプリ）」を選択
4. GitHub で認証し、リポジトリを選択
5. 接続完了

### 4.2 トリガーを作成

```bash
gcloud builds triggers create github \
  --repo-name="your-repo-name" \
  --repo-owner="your-github-username" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --description="Deploy to Cloud Run on push to main"
```

または GCP Console から：

1. 「トリガーを作成」をクリック
2. 名前: `deploy-to-cloud-run`
3. イベント: 「ブランチにプッシュ」
4. ソース: 接続した GitHub リポジトリ
5. ブランチ: `^main$`
6. 構成: `cloudbuild.yaml`
7. 「作成」

---

## 5. デプロイ

これで設定完了です。以降は `main` ブランチにプッシュするだけで自動デプロイされます。

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### ビルド状況の確認

```bash
# 最新のビルドログを確認
gcloud builds list --limit=5

# 特定のビルドの詳細ログ
gcloud builds log BUILD_ID
```

または [Cloud Build 履歴](https://console.cloud.google.com/cloud-build/builds) で確認。

---

## 6. カスタムドメインの設定（任意）

### 6.1 ドメインマッピング

```bash
gcloud run domain-mappings create \
  --service knowledge-search-kun \
  --domain your-domain.com \
  --region asia-northeast1
```

### 6.2 DNS 設定

表示される DNS レコードをドメイン管理画面で設定してください。

---

## 7. ログの確認

```bash
# 最新のログを表示
gcloud run services logs read knowledge-search-kun --region asia-northeast1

# リアルタイム監視
gcloud run services logs tail knowledge-search-kun --region asia-northeast1
```

---

## 8. トラブルシューティング

### ビルドが失敗する

```bash
# ビルドログを確認
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')
```

### シークレットにアクセスできない

```bash
# 権限を再確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:cloudbuild.gserviceaccount.com"
```

### デプロイ後に 502 エラー

```bash
# メモリを増やす
gcloud run services update knowledge-search-kun \
  --memory 1Gi \
  --region asia-northeast1
```

---

## 9. 手動デプロイ（緊急時）

自動デプロイを待たずに手動でビルド・デプロイする場合：

```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

## クイックリファレンス

| 操作 | コマンド |
|-----|---------|
| デプロイ | `git push origin main` |
| ビルド状況確認 | `gcloud builds list --limit=5` |
| ログ確認 | `gcloud run services logs read knowledge-search-kun --region asia-northeast1` |
| 手動ビルド | `gcloud builds submit --config=cloudbuild.yaml` |
| サービス状態確認 | `gcloud run services describe knowledge-search-kun --region asia-northeast1` |
