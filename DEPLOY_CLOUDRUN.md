# GCP Cloud Run デプロイガイド

## 前提条件

- GCP アカウントとプロジェクトが作成済み
- `gcloud` CLI がインストール済み
- Docker がインストール済み（ローカルテスト用）

---

## 1. 初期セットアップ

### 1.1 gcloud CLI の認証とプロジェクト設定

```bash
# 認証
gcloud auth login

# プロジェクトIDを設定（ご自身のプロジェクトIDに置き換え）
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# リージョンを設定
gcloud config set run/region asia-northeast1
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

## 2. ローカルでの Docker ビルドテスト

```bash
# ビルド時の環境変数を設定
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id" \
  --build-arg NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-key" \
  -t corporate-ai-agent .

# ローカルで実行テスト
docker run -p 8080:8080 corporate-ai-agent

# ブラウザで http://localhost:8080 にアクセスして確認
```

---

## 3. 手動デプロイ（gcloud コマンド）

### 3.1 イメージをビルドしてプッシュ

```bash
# Artifact Registry に認証
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# イメージをビルド（Cloud Build を使用）
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/$PROJECT_ID/cloud-run-images/corporate-ai-agent:latest \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id" \
  --build-arg NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-key"
```

### 3.2 Cloud Run にデプロイ

```bash
gcloud run deploy corporate-ai-agent \
  --image asia-northeast1-docker.pkg.dev/$PROJECT_ID/cloud-run-images/corporate-ai-agent:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production"
```

---

## 4. 環境変数の設定

### 4.1 NEXT_PUBLIC_ 変数（ビルド時に埋め込み）

`NEXT_PUBLIC_` で始まる変数はビルド時にバンドルに埋め込まれます。
Dockerfile の `--build-arg` で渡す必要があります。

| 変数名 | 説明 |
|--------|------|
| NEXT_PUBLIC_FIREBASE_API_KEY | Firebase API キー |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Firebase Auth ドメイン |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | Firebase プロジェクト ID |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Firebase Storage バケット |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Firebase Messaging Sender ID |
| NEXT_PUBLIC_FIREBASE_APP_ID | Firebase App ID |
| NEXT_PUBLIC_GEMINI_API_KEY | Gemini API キー |

### 4.2 サーバーサイド変数（ランタイム）

サーバーサイドのみで使用する変数は `--set-env-vars` で設定します：

```bash
gcloud run deploy corporate-ai-agent \
  --set-env-vars "FIREBASE_ADMIN_SDK=your-admin-sdk-json"
```

### 4.3 Secret Manager を使った機密情報管理（推奨）

```bash
# シークレットを作成
echo -n "your-secret-value" | gcloud secrets create FIREBASE_ADMIN_SDK --data-file=-

# Cloud Run にシークレットを紐付け
gcloud run deploy corporate-ai-agent \
  --set-secrets "FIREBASE_ADMIN_SDK=FIREBASE_ADMIN_SDK:latest"
```

---

## 5. カスタムドメインの設定

### 5.1 ドメインの所有権確認

```bash
# ドメイン検証
gcloud domains verify your-domain.com
```

### 5.2 ドメインマッピングの作成

```bash
gcloud run domain-mappings create \
  --service corporate-ai-agent \
  --domain your-domain.com \
  --region asia-northeast1
```

### 5.3 DNS レコードの設定

上記コマンド実行後に表示される DNS レコードを、
ドメインの DNS 設定に追加します：

| タイプ | ホスト | 値 |
|--------|--------|-----|
| A/AAAA | @ | (表示されるIPアドレス) |
| CNAME | www | ghs.googlehosted.com |

※ 反映まで最大48時間かかる場合があります。

---

## 6. GitHub Actions による自動デプロイ（オプション）

`.github/workflows/deploy.yml` を作成：

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  SERVICE_NAME: corporate-ai-agent
  REGION: asia-northeast1

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Google Auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker asia-northeast1-docker.pkg.dev

      - name: Build and Push
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="${{ secrets.FIREBASE_API_KEY }}" \
            --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${{ secrets.FIREBASE_AUTH_DOMAIN }}" \
            --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="${{ secrets.FIREBASE_PROJECT_ID }}" \
            --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="${{ secrets.FIREBASE_STORAGE_BUCKET }}" \
            --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}" \
            --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="${{ secrets.FIREBASE_APP_ID }}" \
            --build-arg NEXT_PUBLIC_GEMINI_API_KEY="${{ secrets.GEMINI_API_KEY }}" \
            -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/cloud-run-images/$SERVICE_NAME:${{ github.sha }} \
            .
          docker push asia-northeast1-docker.pkg.dev/$PROJECT_ID/cloud-run-images/$SERVICE_NAME:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image asia-northeast1-docker.pkg.dev/$PROJECT_ID/cloud-run-images/$SERVICE_NAME:${{ github.sha }} \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated
```

---

## 7. ログの確認

```bash
# 最新のログを表示
gcloud run services logs read corporate-ai-agent --region asia-northeast1

# リアルタイムでログを監視
gcloud run services logs tail corporate-ai-agent --region asia-northeast1

# Cloud Console でログを確認
# https://console.cloud.google.com/run/detail/asia-northeast1/corporate-ai-agent/logs
```

---

## 8. セキュリティ情報（提案書用）

本システムは以下のセキュリティ基準を満たす環境で運用されます：

| 項目 | 詳細 |
|------|------|
| **リージョン** | GCP 東京リージョン（asia-northeast1） |
| **通信暗号化** | 全通信は TLS 1.3 で暗号化 |
| **認証基盤** | Firebase Authentication（Google 認証基盤） |
| **データ保護** | Firestore / Storage はすべて暗号化保存 |
| **認証資格** | ISO 27001, SOC 1/2/3, PCI DSS 認証取得済み |
| **コンプライアンス** | GDPR, HIPAA 対応可能 |
| **インフラ** | Google Cloud Platform のマネージドサービス |

### セキュリティのポイント

1. **ゼロトラストネットワーク**: Cloud Run はリクエストごとに認証可能
2. **自動スケーリング**: DDoS 攻撃への耐性
3. **コンテナ分離**: 各リクエストは独立したコンテナで処理
4. **Secret Manager**: 機密情報は暗号化して管理
5. **IAM**: 最小権限の原則に基づくアクセス制御

---

## 9. コスト目安

### Cloud Run 無料枠（毎月）

| リソース | 無料枠 |
|----------|--------|
| CPU | 180,000 vCPU 秒 |
| メモリ | 360,000 GiB 秒 |
| リクエスト | 200万リクエスト |
| ネットワーク | 1 GB（北米のみ） |

### 小規模利用の場合

- 月間1万PV程度: **ほぼ無料枠内**
- 月間10万PV程度: **$5-15/月程度**

---

## トラブルシューティング

### ビルドエラー: standalone ディレクトリが見つからない

```bash
# next.config.js に output: 'standalone' が設定されているか確認
cat next.config.js
```

### デプロイ後に 502 エラー

```bash
# ログを確認
gcloud run services logs read corporate-ai-agent --region asia-northeast1 --limit 50

# メモリ不足の可能性がある場合
gcloud run services update corporate-ai-agent --memory 1Gi --region asia-northeast1
```

### 環境変数が読み込まれない

- `NEXT_PUBLIC_` 変数はビルド時に `--build-arg` で渡す必要あり
- サーバーサイド変数は `--set-env-vars` で設定
