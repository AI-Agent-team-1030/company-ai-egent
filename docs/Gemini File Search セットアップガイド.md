# Gemini File Search セットアップガイド

## 概要

Gemini File Search は Google が提供するマネージド RAG（Retrieval-Augmented Generation）サービス。
ファイルをアップロードするだけで、チャンキング・エンベディング・ベクトル検索まで自動で行ってくれる。

---

## 1. 有料プランへの移行方法

### なぜ有料プランが必要か

| 項目 | 無料プラン | 有料プラン |
|------|----------|----------|
| データがモデル学習に使われる | ⚠️ 使われる可能性あり | ✅ 使われない |
| 人間によるレビュー | あり得る | 基本なし |
| 機密情報の取り扱い | ❌ 非推奨 | ✅ OK |
| クライアント案件での利用 | ❌ 非推奨 | ✅ OK |

### 有料プランへの切り替え手順

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/

2. **プロジェクトを作成（または既存を選択）**
   - 左上のプロジェクトセレクタから「新しいプロジェクト」

3. **課金を有効化**
   - ナビゲーションメニュー → 「お支払い」
   - 請求先アカウントをプロジェクトにリンク

4. **Gemini API を有効化**
   - 「APIとサービス」→「ライブラリ」
   - 「Generative Language API」を検索して有効化

5. **API キーを作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「API キー」

### 料金体系

| 項目 | 料金 |
|------|------|
| ストレージ | **無料** |
| クエリ時のエンベディング | **無料** |
| インデックス作成時 | $0.15 / 100万トークン |
| 生成時のトークン（入力） | モデル料金に準拠 |
| 生成時のトークン（出力） | モデル料金に準拠 |

---

## 2. 環境セットアップ

### 必要なもの

- Python 3.9 以上（または Node.js 18 以上）
- Google Cloud プロジェクト（課金有効）
- Gemini API キー

### Python 環境

```bash
# SDK インストール
pip install google-genai

# 環境変数設定
export GOOGLE_API_KEY="your-api-key-here"
```

### JavaScript/TypeScript 環境

```bash
# SDK インストール
npm install @google/genai

# 環境変数設定
export GOOGLE_API_KEY="your-api-key-here"
```

---

## 3. 基本実装

### Python での実装例

```python
from google import genai
from google.genai import types
import time
import os

# クライアント初期化
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

# ========================================
# Step 1: ストア作成
# ========================================
store = client.file_search_stores.create(
    config={'display_name': 'my-knowledge-base'}
)
print(f"ストア作成完了: {store.name}")

# ========================================
# Step 2: ファイルアップロード
# ========================================
file = client.files.upload(
    file='path/to/your-document.pdf',
    config={'name': 'document-display-name'}
)
print(f"ファイルアップロード完了: {file.name}")

# ========================================
# Step 3: ストアにインポート
# ========================================
operation = client.file_search_stores.import_file(
    file_search_store_name=store.name,
    file_name=file.name
)

# インポート完了を待つ
while not operation.done:
    print("インデックス作成中...")
    time.sleep(5)
    operation = client.operations.get(operation)

print("インデックス作成完了！")

# ========================================
# Step 4: 質問する（RAG検索）
# ========================================
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="このドキュメントの要点を教えて",
    config=types.GenerateContentConfig(
        tools=[
            types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[store.name]
                )
            )
        ]
    )
)

print("回答:")
print(response.text)

# ========================================
# Step 5: クリーンアップ（任意）
# ========================================
# client.file_search_stores.delete(name=store.name)
```

### JavaScript/TypeScript での実装例

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function main() {
  // Step 1: ストア作成
  const store = await ai.fileSearchStores.create({
    config: { displayName: 'my-knowledge-base' }
  });
  console.log(`ストア作成完了: ${store.name}`);

  // Step 2: ファイルアップロード
  const file = await ai.files.upload({
    file: fs.createReadStream('path/to/your-document.pdf'),
    config: { name: 'document-display-name' }
  });

  // Step 3: インポート
  let operation = await ai.fileSearchStores.importFile({
    fileSearchStoreName: store.name,
    fileName: file.name
  });

  // 完了を待つ
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.get(operation);
  }

  // Step 4: 質問
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'このドキュメントの要点を教えて',
    config: {
      tools: [{
        fileSearch: {
          fileSearchStoreNames: [store.name]
        }
      }]
    }
  });

  console.log('回答:', response.text);
}

main();
```

---

## 4. 対応ファイル形式

| カテゴリ | 形式 |
|---------|------|
| テキスト | .txt, .md, .html, .css, .js, .py, .java, .cpp など |
| ドキュメント | .pdf, .doc, .docx |
| スプレッドシート | .csv, .xlsx, .xls |
| プレゼンテーション | .pptx |
| データ | .json, .xml |

**ファイルサイズ上限**: 100MB / ファイル

---

## 5. ストレージ容量

| Tier | 容量 |
|------|------|
| Free | 1 GB |
| Tier 1 | 10 GB |
| Tier 2 | 100 GB |
| Tier 3 | 1 TB |

---

## 6. セキュリティに関する注意事項

### 有料プランの場合

- プロンプト・応答はモデル学習に**使用されない**
- データは不正検知目的でのみ一時的にログ保持
- Data Processing Addendum（DPA）が適用される

### アップロードすべきでないデータ

- 健康記録・医療情報
- 財務情報・クレジットカード番号
- 政府発行ID（マイナンバー等）
- 生体情報
- パスワード・認証情報

### 推奨事項

1. **本番環境では必ず有料プランを使用**
2. **機密情報は匿名化してからアップロード**
3. **不要になったストアは削除する**
4. **APIキーは環境変数で管理（コードに直書きしない）**

---

## 7. 公式ドキュメント

| ドキュメント | URL |
|-------------|-----|
| メインガイド | https://ai.google.dev/gemini-api/docs/file-search |
| API リファレンス | https://ai.google.dev/api/file-search/file-search-stores |
| 利用規約 | https://ai.google.dev/gemini-api/terms |
| 使用ポリシー | https://ai.google.dev/gemini-api/docs/usage-policies |

---

## 8. よくある構成パターン

### パターン A: シンプルなチャットBot

```
[Streamlit / Gradio UI]
        ↓
[Gemini File Search API]
        ↓
    回答 + 引用
```

### パターン B: 本格的なWebアプリ

```
[React / Next.js フロント]
        ↓
[FastAPI / Express バックエンド]
        ↓
[Gemini File Search API]
        ↓
    回答 + 引用
```

### パターン C: Dify / n8n 連携

```
[Dify ワークフロー or n8n]
        ↓
[カスタムツール（FastAPI）]
        ↓
[Gemini File Search API]
```

---

## 9. チェックリスト

### セットアップ前

- [ ] Google Cloud アカウント作成済み
- [ ] 課金有効化済み
- [ ] プロジェクト作成済み
- [ ] Gemini API 有効化済み
- [ ] API キー取得済み

### 開発時

- [ ] SDK インストール済み
- [ ] 環境変数に API キー設定済み
- [ ] ストア作成できることを確認
- [ ] ファイルアップロード・インポート確認
- [ ] クエリが動作することを確認

### 本番デプロイ前

- [ ] 有料プランであることを確認
- [ ] 機密情報が含まれていないか確認
- [ ] エラーハンドリング実装済み
- [ ] レート制限対策済み
- [ ] 不要ストアの削除処理実装済み

---

## 10. トラブルシューティング

### よくあるエラー

| エラー | 原因 | 対処 |
|--------|------|------|
| 401 Unauthorized | API キーが無効 | キーを再生成 |
| 403 Forbidden | API が有効化されていない | Cloud Console で有効化 |
| 429 Too Many Requests | レート制限 | リトライ処理を実装 |
| インポートが終わらない | ファイルが大きい | 分割してアップロード |

---

## まとめ

1. **有料プラン必須**（クライアント案件では特に）
2. **DBやインフラ構築不要**（Google が全部持ってる）
3. **実装はシンプル**（アップロード → インポート → クエリ）
4. **公式ドキュメント2つだけ読めばOK**

---

*最終更新: 2025年11月*