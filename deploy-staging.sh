#!/bin/bash
# ステージング環境への手動デプロイスクリプト
# 使用方法: ./deploy-staging.sh

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  ステージング環境デプロイ開始${NC}"
echo -e "${YELLOW}========================================${NC}"

# プロジェクトIDを取得
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}エラー: GCPプロジェクトが設定されていません${NC}"
    echo "gcloud config set project <PROJECT_ID> を実行してください"
    exit 1
fi

echo -e "${GREEN}プロジェクト: ${PROJECT_ID}${NC}"

# 短いコミットハッシュを生成（GitがなければタイムスタンプID）
if git rev-parse --short HEAD > /dev/null 2>&1; then
    SHORT_SHA=$(git rev-parse --short HEAD)
else
    SHORT_SHA=$(date +%Y%m%d%H%M%S)
fi

echo -e "${GREEN}ビルドID: ${SHORT_SHA}${NC}"

# Cloud Buildでステージング用設定を使ってビルド＆デプロイ
echo -e "${YELLOW}Cloud Buildを実行中...${NC}"

gcloud builds submit \
    --config=cloudbuild-staging.yaml \
    --substitutions=SHORT_SHA=${SHORT_SHA} \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  デプロイ完了！${NC}"
    echo -e "${GREEN}========================================${NC}"

    # デプロイされたURLを取得
    SERVICE_URL=$(gcloud run services describe knowledge-search-staging \
        --region=asia-northeast1 \
        --format='value(status.url)' 2>/dev/null)

    if [ -n "$SERVICE_URL" ]; then
        echo -e "${GREEN}ステージングURL: ${SERVICE_URL}${NC}"
    fi
else
    echo -e "${RED}デプロイに失敗しました${NC}"
    exit 1
fi
