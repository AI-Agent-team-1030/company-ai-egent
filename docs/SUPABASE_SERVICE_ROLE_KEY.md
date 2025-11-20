# Supabase Service Role Key 取得方法

## 📌 Service Role Keyとは？

Service Role Keyは、Supabaseの**管理者権限**を持つAPIキーです。
データベースへの完全なアクセス権限があるため、**サーバーサイド（API Routes）でのみ使用**します。

**⚠️ 注意：このキーは絶対に公開しないでください！**

---

## 🔑 取得手順

### ステップ1: Supabaseダッシュボードにアクセス

1. https://app.supabase.com にアクセス
2. プロジェクト「uxidrfbshtdhcrlnlfza」を選択

---

### ステップ2: Settings → API に移動

1. 左サイドバーの **⚙️ Settings** をクリック
2. **API** タブをクリック

---

### ステップ3: Service Role Keyをコピー

**Project API keys** セクションに以下の2つのキーがあります：

1. **anon / public** (既に取得済み)
   - フロントエンドで使用
   - 公開しても安全

2. **service_role** ← **これが必要です！**
   - `service_role` と書かれた欄の右側にある **👁️ Reveal** ボタンをクリック
   - 表示されたキーをコピー

---

### ステップ4: .envファイルに追加

`.env`ファイルの以下の行を更新します：

```env
SUPABASE_SERVICE_ROLE_KEY=取得したら追加してください
```

↓

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...（実際のキー）
```

---

## ✅ 確認

`.env`ファイルが以下のようになっていればOKです：

```env
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uxidrfbshtdhcrlnlfza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aWRyZmJzaHRkaGNybG5sZnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTEzNDMsImV4cCI6MjA3OTA4NzM0M30.qy-smZftiJBBQontN5vMh1-w6DyBcmca-un6nWS3DAo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... （実際のservice_roleキー）
```

---

## 📸 スクリーンショット補足

取得場所のイメージ：

```
Supabase Dashboard
├── Project: uxidrfbshtdhcrlnlfza
└── Settings
    └── API
        ├── Project URL: https://uxidrfbshtdhcrlnlfza.supabase.co
        └── Project API keys
            ├── anon / public: eyJ...qy-smZftiJBBQontN5vMh1-w6DyBcmca-un6nWS3DAo
            └── service_role: [👁️ Reveal] ← ここをクリック！
```

---

## 🚀 次のステップ

Service Role Keyを追加したら、次に進みます：

1. ✅ 環境変数の設定完了
2. ✅ Supabaseクライアントのインストール完了
3. ⏭️ **データベーススキーマの作成**

---

最終更新: 2025-11-19
