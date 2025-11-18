# マルチエージェントシステム（TypeScript版）

## 概要

統括エージェントが複数の専門エージェントを呼び出し、結果を統合してレポートを生成するマルチエージェントシステムです。

**重要**: 2025年11月14日より、TypeScript版に統一しました。Python（LangGraph）版は削除されています。

### エージェント構成

```
統括エージェント (Coordinator)
    ↓ 指示・選定
    ├─ 市場調査エージェント (Market Research) [並列実行可能]
    ├─ 競合調査エージェント (Competitor Analysis) [並列実行可能]
    └─ 戦略立案エージェント (Strategy) [順次実行]
    ↓ 結果収集
レポート統合エージェント (Report Integration)
    ↓
最終レポート出力
```

## 実装方式

### TypeScript版（Next.js）- 唯一の実装
- **ファイル**: `/app/api/simple-agent/route.ts`
- **特徴**: Next.js API Routeで実装、Claude APIを直接呼び出し
- **処理**: 5つのエージェント、並列実行対応（市場調査・競合調査を同時実行）
- **ストリーミング**: Server-Sent Events (SSE)で進捗をリアルタイム配信
- **高速**: 並列実行により約2倍高速化

## アーキテクチャ詳細

### エージェントの役割

#### 1. 統括エージェント
- **役割**: ユーザーのゴールを分析し、各専門エージェントへの指示を出す
- **入力**: ユーザーのゴール
- **出力**: 各エージェントへの具体的な指示

#### 2. 市場調査エージェント
- **役割**: 市場の状況を調査・分析
- **分析観点**:
  - 市場規模
  - 成長性
  - 主要なトレンド
  - 市場機会

#### 3. 競合調査エージェント
- **役割**: 競合の状況を調査・分析
- **分析観点**:
  - 主要な競合企業
  - 各社の強み・弱み
  - 差別化ポイント
  - 市場での位置づけ

#### 4. 戦略立案エージェント
- **役割**: 市場調査と競合調査の結果を踏まえて戦略を立案
- **出力内容**:
  - 推奨アクション（3-5個）
  - 差別化戦略
  - 実施優先度
  - 期待される成果

#### 5. レポート統合エージェント
- **役割**: 全エージェントの結果を統合し、包括的なレポートを作成
- **レポート構成**:
  1. エグゼクティブサマリー（要約）
  2. 市場分析の要点
  3. 競合分析の要点
  4. 推奨戦略
  5. 次のステップ

## 使用技術

### フロントエンド
- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **Framer Motion** - アニメーション
- **react-markdown** - マークダウンレンダリング
- **remark-gfm** - GitHub Flavored Markdown対応

### バックエンド（TypeScript版）
- **Next.js API Routes** - APIエンドポイント
- **Anthropic SDK** - Claude API連携
- **Server-Sent Events** - リアルタイム通信

### バックエンド（LangGraph版）
- **Python 3.x** - 実行環境
- **LangGraph** - マルチエージェントフレームワーク
- **LangChain** - LLMオーケストレーション
- **langchain-anthropic** - Claude API連携

### AIモデル
- **Claude Sonnet 4** (`claude-sonnet-4-20250514`)
- **最大トークン数**: 1500-2000トークン/リクエスト

## 使い方

### アクセス方法
```
http://localhost:3002/simple-agent
```

### 実行手順

1. **ゴール入力**
   - テキストエリアに達成したいゴールを入力
   - 例: 「新しいオンライン英会話サービスを立ち上げて、6ヶ月で1000人の会員を獲得したい」

2. **実装方式の選択**
   - **TypeScript版**: 純粋なNext.js実装
   - **LangGraph版**: Python + LangGraphによる実装

3. **エージェント実行**
   - 「エージェント実行」ボタンをクリック
   - リアルタイムで各エージェントの実行状況が表示される

4. **結果の確認**
   - **最終レポート**: マークダウン形式で綺麗に整形されて表示
   - **各エージェントの詳細**: ボタンで開閉して確認可能
   - **ダウンロード**: JSON形式でレポートをダウンロード可能

## ファイル構成

```
/Users/kurosakiyuto/法人AI素案/
├── app/
│   ├── (app)/
│   │   └── simple-agent/
│   │       └── page.tsx              # UIページ
│   └── api/
│       └── simple-agent/
│           └── route.ts              # TypeScript版API
├── components/
│   └── ui/
│       └── Sidebar.tsx               # サイドバー（ナビゲーション）
└── ENTERPRISE_AGENT_ARCHITECTURE.md  # エンタープライズ設計書
```

## API仕様

**エンドポイント**: `POST /api/simple-agent`

**リクエスト**:
```json
{
  "goal": "ユーザーのゴール"
}
```

**レスポンス**: Server-Sent Events (text/event-stream)
```
data: {"type":"steps","steps":[...],"agent":"エージェント名","result":"結果"}

data: {"type":"complete","agentResults":[...],"finalReport":"..."}

data: {"type":"error","error":"エラーメッセージ"}
```

## 実装の詳細

### 並列実行による高速化

```typescript
// 統括エージェント実行
const coordinatorResult = await runAgent('統括エージェント', coordinatorPrompt)

// 市場調査と競合調査を並列実行（約2倍高速化）
const [marketResult, competitorResult] = await Promise.all([
  runAgent('市場調査エージェント', marketPrompt),
  runAgent('競合調査エージェント', competitorPrompt)
])

// 戦略立案（市場・競合の結果を使用）
const strategyResult = await runAgent('戦略立案エージェント', strategyPrompt)

// 最終レポート統合
const finalReport = await runAgent('レポート統合エージェント', reportPrompt)
```

### リアルタイム結果送信

各エージェントの完了時に即座に結果を送信：

```typescript
await writer.write(
  encoder.encode(`data: ${JSON.stringify({
    type: 'steps',
    steps,
    agent: 'エージェント名',
    result: 'エージェントの出力'
  })}\n\n`)
)
```

## トラブルシューティング

### エラー: "エージェント実行に失敗しました"

**確認事項**:
1. ANTHROPIC_API_KEYが設定されているか
   ```bash
   # .env.local
   ANTHROPIC_API_KEY=your_key_here
   ```
2. 開発サーバーが起動しているか
   ```bash
   PORT=3002 npm run dev
   ```

### UIが表示されない

**確認事項**:
1. npm パッケージがインストールされているか
   ```bash
   npm install
   ```
2. 必要な依存関係
   - react-markdown
   - remark-gfm
   - framer-motion
   - @heroicons/react

### パフォーマンスが遅い

**対策**:
- 並列実行が有効になっているか確認
- ネットワーク接続を確認
- Claude APIのレート制限を確認

## コスト最適化

### トークン使用量
各エージェント実行で約1500-2000トークンを使用

**1回の完全実行**:
- 統括エージェント: ~1500トークン
- 市場調査: ~1500トークン
- 競合調査: ~1500トークン
- 戦略立案: ~1500トークン
- レポート統合: ~2000トークン
- **合計**: 約8000-10000トークン

### コスト削減の工夫
1. `max_tokens` を適切に設定（無駄な長文を避ける）
2. システムプロンプトを簡潔に保つ
3. 必要な情報のみを次のエージェントに渡す

## UI機能

### リアルタイム進捗表示
- ✅ 完了: 緑色の背景 + チェックアイコン
- 🔄 実行中: 青色の背景 + 回転アニメーション
- ⏳ 待機中: 灰色の背景 + 空の円

### マークダウンレンダリング
- 見出し、リスト、テーブルなどを綺麗に表示
- GitHub Flavored Markdown (GFM) 対応
- Tailwind proseスタイリングで可読性向上

### 開閉式の詳細表示
- 各エージェントの結果を個別に展開/折りたたみ可能
- スムーズなアニメーション
- シェブロンアイコンで開閉状態を表示

### レポートダウンロード
- JSON形式でダウンロード可能
- 以下の情報を含む:
  - ゴール
  - 実装方式
  - 各エージェントの結果
  - 最終レポート

## 実装済み機能

### ✅ 完了
- [x] エージェントの並列実行（市場調査と競合調査を同時実行）
- [x] エージェント結果の段階的表示（リアルタイム）
- [x] ストリーミングレスポンス最適化
- [x] プログレスバー表示
- [x] 経過時間タイマー

## 今後の拡張案

詳細は `ENTERPRISE_AGENT_ARCHITECTURE.md` を参照してください。

### Phase 1（現在〜2週間）
- [ ] 動的エージェント選定システム
- [ ] エージェントレジストリ実装
- [ ] 依存関係解決エンジン
- [ ] Supabase統合（pgvector）

### Phase 2（2週間〜2ヶ月）
- [ ] RAGシステム実装（ハイブリッド検索）
- [ ] 3層メモリアーキテクチャ
- [ ] コスト監視ダッシュボード
- [ ] エージェント実行ログ

### Phase 3（2-6ヶ月）
- [ ] Ollamaローカル実行対応
- [ ] ハイブリッド実行（ローカル+クラウド）
- [ ] HITL（Human-in-the-Loop）実装
- [ ] 1,000エージェント対応

### 長期（6-12ヶ月）
- [ ] Kubernetes化
- [ ] Kafkaメッセージバス
- [ ] 法人データ全統合
- [ ] エンタープライズガバナンス

## ライセンス

このプロジェクトは内部使用のためのものです。

## お問い合わせ

技術的な質問や改善提案がある場合は、開発チームまでお問い合わせください。
