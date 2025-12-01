/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Cloud Run デプロイ用: standalone モードで軽量な本番ビルドを生成
  output: 'standalone',

  // 画像最適化の設定（必要に応じてドメインを追加）
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
      },
    ],
  },
}

module.exports = nextConfig

