# 次にやるべきこと

## ✅ 完了したこと

- [x] Supabase環境変数を`.env`に追加
- [x] `@supabase/supabase-js`のインストール
- [x] Supabaseクライアント設定（`lib/supabase.ts`）
- [x] データベースマイグレーションSQLの作成
- [x] ドキュメントの整備

---

## 📌 あなたがやること（2つだけ！）

### 1️⃣ Service Role Keyの取得と設定（5分）

**手順：**
1. https://app.supabase.com にアクセス
2. プロジェクト「uxidrfbshtdhcrlnlfza」を選択
3. 左サイドバーの **⚙️ Settings** → **API** をクリック
4. **Project API keys** セクションの `service_role` 欄で **👁️ Reveal** をクリック
5. 表示されたキーをコピー
6. `.env`ファイルを開く
7. 以下の行を更新：

```env
SUPABASE_SERVICE_ROLE_KEY=取得したら追加してください
```

↓

```env
SUPABASE_SERVICE_ROLE_KEY=（コピーしたキー）
```

**詳細手順：** `docs/SUPABASE_SERVICE_ROLE_KEY.md` を参照

---

### 2️⃣ データベーステーブルの作成（5分）

**手順：**
1. https://app.supabase.com にアクセス
2. プロジェクト「uxidrfbshtdhcrlnlfza」を選択
3. 左サイドバーの **SQL Editor** をクリック
4. **+ New query** をクリック
5. 以下のファイルの内容を全てコピー：

```bash
cat supabase/migrations/001_create_knowledge_table.sql
```

6. SQL Editorに貼り付け
7. **Run** ボタン（または `Cmd + Enter`）をクリック
8. "Success. No rows returned" と表示されればOK

**動作確認：**
- 左サイドバーの **Table Editor** をクリック
- `knowledge` テーブルが表示されることを確認
- 3件のサンプルデータが入っていることを確認

**詳細手順：** `docs/DATABASE_SETUP.md` を参照

---

## 🎯 完了後の次のステップ

上記2つが完了したら、私に教えてください。
次のフェーズ（API実装）に進みます！

**予定：**
1. ✅ Supabaseセットアップ ← **今ここ**
2. ⏭️ ナレッジCRUD APIの実装（1〜2時間）
3. フロントエンド連携（1時間）
4. 動作確認（30分）

---

## 📂 作成されたファイル一覧

```
法人AI素案/
├── .env （更新）
│   └── Supabase環境変数を追加
├── lib/
│   └── supabase.ts （新規）
│       └── Supabaseクライアント設定
├── supabase/
│   └── migrations/
│       └── 001_create_knowledge_table.sql （新規）
│           └── データベーススキーマ
└── docs/
    ├── KNOWLEDGE_IMPLEMENTATION_PLAN.md （全体計画）
    ├── SUPABASE_SERVICE_ROLE_KEY.md （Service Role Key取得手順）
    ├── DATABASE_SETUP.md （データベースセットアップ手順）
    └── NEXT_STEPS.md （このファイル）
```

---

## 💬 困ったら

わからないことがあれば、いつでも聞いてください！

---

最終更新: 2025-11-19
