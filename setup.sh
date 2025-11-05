#!/bin/bash

# Next.jsプロジェクトのセットアップスクリプト

echo "🚀 セットアップを開始します..."

# Node.jsがインストールされているか確認
if ! command -v node &> /dev/null; then
    echo "❌ Node.jsがインストールされていません。"
    echo "   Node.jsをインストールしてください: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.jsバージョン: $(node --version)"
echo "✅ npmバージョン: $(npm --version)"

# 依存関係のインストール
echo ""
echo "📦 依存関係をインストールしています..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依存関係のインストールに失敗しました。"
    exit 1
fi

echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "次のコマンドで開発サーバーを起動できます:"
echo "  npm run dev"
echo ""

