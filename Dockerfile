# ===============================================
# Stage 1: 依存関係のインストール
# ===============================================
FROM node:20-alpine AS deps

# libc6-compat は Alpine で一部パッケージの互換性に必要
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 依存関係ファイルのみをコピー（キャッシュ効率化）
COPY package.json package-lock.json* ./

# 本番用依存関係のみインストール
RUN npm ci --only=production

# ===============================================
# Stage 2: ビルド
# ===============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# devDependencies も含めて再インストール（ビルドに必要）
RUN npm ci

# 環境変数（ビルド時に必要なもの）
# NEXT_PUBLIC_ で始まる変数はビルド時に埋め込まれる
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_GEMINI_API_KEY

# Next.js のテレメトリを無効化
ENV NEXT_TELEMETRY_DISABLED=1

# ビルド実行
RUN npm run build

# ===============================================
# Stage 3: 本番イメージ
# ===============================================
FROM node:20-alpine AS runner

WORKDIR /app

# 本番環境設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# セキュリティ: 非rootユーザーで実行
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone ビルド成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 非rootユーザーに切り替え
USER nextjs

# Cloud Run はPORT環境変数を自動設定（デフォルト8080）
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# アプリケーション起動
CMD ["node", "server.js"]
