#!/bin/bash

# GitHubプッシュスクリプト
# 使い方: ./push-to-github.sh "コミットメッセージ"

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== GitHub Push Script ===${NC}\n"

# プロジェクトディレクトリに移動
cd "/Users/kurosakiyuto/法人AI素案"

# Personal Access Token が設定されているか確認
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [[ ! $CURRENT_REMOTE == https://*@github.com/* ]]; then
    echo -e "${YELLOW}⚠️  Personal Access Token が設定されていません${NC}\n"
    echo "以下の手順でトークンを設定してください:"
    echo ""
    echo "1. https://github.com/settings/tokens/new でトークンを作成"
    echo "2. 'repo' 権限にチェックを入れる"
    echo "3. 生成されたトークンをコピー"
    echo ""
    read -p "トークンを入力してください (ghp_で始まる): " TOKEN
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ トークンが入力されていません${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}✓ トークンを設定しています...${NC}"
    git remote set-url origin "https://${TOKEN}@github.com/AI-Agent-team-1030/company-ai-egent.git"
    echo -e "${GREEN}✓ トークンが設定されました${NC}\n"
fi

# 変更があるか確認
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  コミットする変更がありません${NC}"
    exit 0
fi

# コミットメッセージの確認
if [ -z "$1" ]; then
    echo -e "${RED}❌ コミットメッセージが指定されていません${NC}"
    echo "使い方: ./push-to-github.sh \"コミットメッセージ\""
    exit 1
fi

COMMIT_MESSAGE=$1

# ステータスを表示
echo -e "${GREEN}📝 変更されたファイル:${NC}"
git status -s
echo ""

# 変更を追加
echo -e "${GREEN}✓ 変更をステージングしています...${NC}"
git add .

# コミット
echo -e "${GREEN}✓ コミットしています...${NC}"
git commit -m "$COMMIT_MESSAGE"

# プッシュ
echo -e "${GREEN}✓ プッシュしています...${NC}"
git push -u origin main

echo -e "\n${GREEN}🎉 成功！GitHubにプッシュされました${NC}"
echo -e "リポジトリ: ${GREEN}https://github.com/AI-Agent-team-1030/company-ai-egent${NC}"

















