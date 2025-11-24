# エージェント管理機能 詳細設計

**最終更新**: 2025年11月23日

---

## 🎯 概要

**エージェント管理ページ**は、組織内で使えるAIエージェントを管理・カスタマイズするための中核機能。

### 役割
- エージェントの一覧・カタログ
- 新しいエージェントの追加
- プロンプトのカスタマイズ
- エージェントの有効/無効化
- 依存関係の管理

### 想定ユーザー
- 法人管理者（Company Admin）
- 部門管理者（Department Manager）
- 上級ユーザー

---

## 📊 データ構造

### Supabaseテーブル設計

```sql
-- エージェント定義テーブル
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- 基本情報
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,  -- 表示名（日本語可）
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('executive', 'sales', 'hr', 'finance', 'marketing', 'custom')),
  icon TEXT,  -- アイコンのURL or emoji

  -- プロンプト
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,  -- ユーザープロンプトのテンプレート

  -- 実行設定
  model TEXT DEFAULT 'claude-sonnet-4',  -- 使用するLLM
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4000,

  -- 制御
  can_run_in_parallel BOOLEAN DEFAULT true,
  dependencies JSONB DEFAULT '[]'::jsonb,  -- 依存するエージェントのID配列
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  runtime TEXT CHECK (runtime IN ('cloud', 'local', 'auto')) DEFAULT 'cloud',

  -- ステータス
  is_enabled BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,  -- システムデフォルトか、カスタムか

  -- メタデータ
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,  -- 使用回数

  -- 検索用
  tags TEXT[] DEFAULT '{}',

  CONSTRAINT unique_agent_name_per_company UNIQUE (company_id, name)
);

-- インデックス
CREATE INDEX idx_agents_company ON agents(company_id);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_enabled ON agents(is_enabled);

-- エージェント実行ログ（既存）
CREATE TABLE agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  agent_id UUID NOT NULL REFERENCES agents(id),

  -- 実行情報
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),

  -- 入出力
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,

  -- コスト・リソース
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  execution_time_ms INTEGER,

  -- 実行者
  executed_by UUID REFERENCES users(id),

  INDEX idx_logs_agent (agent_id, started_at DESC),
  INDEX idx_logs_company (company_id, started_at DESC)
);
```

---

## 🖥️ UI設計

### ページ構成

```
/agents
  ├─ 一覧ページ（カード/リスト表示）
  ├─ 詳細・編集ページ（/agents/[id]）
  └─ 新規作成ページ（/agents/new）
```

---

### 一覧ページ（/agents）

#### レイアウト

```
┌──────────────────────────────────────────────────────────┐
│  エージェント管理                          [+ 新規作成]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  フィルタ:  [全て ▼]  [カテゴリ ▼]  [有効のみ ☑]       │
│  検索:      [____________________]  🔍                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  システムエージェント                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ 📊 経営AI  │ │ 💼 営業AI  │ │ 👔 人事AI  │          │
│  │            │ │            │ │            │          │
│  │ 経営判断と │ │ 営業戦略の │ │ 採用・人材 │          │
│  │ 戦略立案   │ │ 立案と分析 │ │ 育成の支援 │          │
│  │            │ │            │ │            │          │
│  │ 使用: 245回│ │ 使用: 182回│ │ 使用: 98回 │          │
│  │ [編集]     │ │ [編集]     │ │ [編集]     │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                          │
│  カスタムエージェント                                     │
│  ┌────────────┐ ┌────────────┐                         │
│  │ 🎯 新規事業│ │ 📈 財務分析│                         │
│  │    支援AI  │ │    AI      │                         │
│  │            │ │            │                         │
│  │ 新規事業の │ │ 財務諸表の │                         │
│  │ 企画・検証 │ │ 分析と予測 │                         │
│  │            │ │            │                         │
│  │ 使用: 12回 │ │ 使用: 34回 │                         │
│  │ [編集][削除]│ │ [編集][削除]│                        │
│  └────────────┘ └────────────┘                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 機能
- **カード表示**（デフォルト）
  - エージェント名、説明、アイコン
  - 使用回数
  - 有効/無効のステータス
  - 編集・削除ボタン

- **フィルタ・検索**
  - カテゴリ別
  - 有効/無効
  - キーワード検索

- **新規作成**
  - 右上の「+ 新規作成」ボタン

---

### 詳細・編集ページ（/agents/[id]）

#### レイアウト

```
┌──────────────────────────────────────────────────────────┐
│  ← 戻る        経営AI - 編集                   [保存]    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  基本情報                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 表示名: [経営AI_______________________]            │ │
│  │ 名前:   executive_ai  （変更不可）                │ │
│  │ カテゴリ: [経営 ▼]                                 │ │
│  │ 説明:   [経営判断と戦略立案を支援するAI______]     │ │
│  │         [_____________________________________]     │ │
│  │ アイコン: [📊]                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  プロンプト設定                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ システムプロンプト:                                │ │
│  │ ┌────────────────────────────────────────────────┐ │ │
│  │ │ あなたは経営判断と戦略立案を支援するAIです。   │ │ │
│  │ │ 以下の点に注意してください:                    │ │ │
│  │ │ - 法人全体の視点で考える                       │ │ │
│  │ │ - データに基づいた判断                         │ │ │
│  │ │ - リスクと機会の両面を提示                     │ │ │
│  │ │                                                │ │ │
│  │ │ [1200文字]                                     │ │ │
│  │ └────────────────────────────────────────────────┘ │ │
│  │                                            [プレビュー] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  実行設定                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ モデル:      [Claude Sonnet 4 ▼]                  │ │
│  │ Temperature: [0.7] (0.0 - 1.0)                     │ │
│  │ Max Tokens:  [4000]                                │ │
│  │ 優先度:      [高 ○ 中 ◉ 低 ○]                    │ │
│  │ 実行環境:    [クラウド ◉ ローカル ○ 自動 ○]      │ │
│  │ 並列実行:    [☑ 可能]                             │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  依存関係                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ このエージェントは以下のエージェントの完了後に   │ │
│  │ 実行されます:                                      │ │
│  │                                                    │ │
│  │ [なし]                          [+ 依存関係を追加] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  統計情報                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 使用回数:     245回                                │ │
│  │ 平均実行時間: 12.3秒                                │ │
│  │ 成功率:       98.4%                                 │ │
│  │ 総コスト:     $123.45                               │ │
│  │                                          [詳細を見る] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [保存]  [キャンセル]  [削除]                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 機能

1. **基本情報編集**
   - 表示名（日本語可）
   - 名前（英数字、変更不可）
   - カテゴリ選択
   - 説明
   - アイコン（emoji選択）

2. **プロンプト編集** 🔥 **重要**
   - システムプロンプト（大きなテキストエリア）
   - コードエディタ風（シンタックスハイライトなし）
   - 文字数カウント
   - プレビュー機能（実際にテスト実行）

3. **実行設定**
   - LLMモデル選択（Claude Sonnet 4, GPT-4, Llama 3.2など）
   - Temperature（創造性）
   - Max Tokens（最大トークン数）
   - 優先度（高/中/低）
   - 実行環境（クラウド/ローカル/自動）
   - 並列実行可能か

4. **依存関係設定**
   - このエージェントの前に実行すべきエージェントを指定
   - 例：「戦略立案AI」は「市場調査AI」と「競合分析AI」の後に実行

5. **統計情報**
   - 使用回数
   - 平均実行時間
   - 成功率
   - 総コスト
   - 詳細ログへのリンク

---

### 新規作成ページ（/agents/new）

#### テンプレート選択

```
┌──────────────────────────────────────────────────────────┐
│  新しいエージェントを作成                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  テンプレートから作成（推奨）                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ 営業支援   │ │ カスタマー │ │ データ分析 │          │
│  │            │ │ サポート   │ │            │          │
│  │ 営業戦略の │ │ 顧客対応と │ │ データから │          │
│  │ 立案と提案 │ │ FAQ対応    │ │ 洞察を抽出 │          │
│  │            │ │            │ │            │          │
│  │ [選択]     │ │ [選択]     │ │ [選択]     │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ コンテンツ │ │ 翻訳       │ │ コード     │          │
│  │ 作成       │ │            │ │ レビュー   │          │
│  │            │ │            │ │            │          │
│  │ [選択]     │ │ [選択]     │ │ [選択]     │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                          │
│  ─────────────────────────────────────────────────────   │
│                                                          │
│  ゼロから作成                                            │
│  [空白のエージェントを作成]                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 機能
- **テンプレート選択**
  - よくあるユースケースのテンプレート
  - プロンプトがあらかじめ用意されている
  - カスタマイズ可能

- **ゼロから作成**
  - 完全にカスタムなエージェント

---

## 🔧 技術実装

### フロントエンド

```typescript
// app/(app)/agents/page.tsx
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentFilters } from '@/components/agents/AgentFilters'

export default async function AgentsPage() {
  const agents = await getAgents()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">エージェント管理</h1>
        <Link href="/agents/new">
          <Button>+ 新規作成</Button>
        </Link>
      </div>

      <AgentFilters />

      <div className="space-y-8">
        {/* システムエージェント */}
        <section>
          <h2 className="text-xl font-semibold mb-4">システムエージェント</h2>
          <div className="grid grid-cols-3 gap-4">
            {agents.filter(a => a.is_system).map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* カスタムエージェント */}
        <section>
          <h2 className="text-xl font-semibold mb-4">カスタムエージェント</h2>
          <div className="grid grid-cols-3 gap-4">
            {agents.filter(a => !a.is_system).map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
```

```typescript
// app/(app)/agents/[id]/page.tsx
import { AgentEditor } from '@/components/agents/AgentEditor'

export default async function AgentEditPage({
  params
}: {
  params: { id: string }
}) {
  const agent = await getAgent(params.id)

  return <AgentEditor agent={agent} />
}
```

```typescript
// components/agents/AgentEditor.tsx
'use client'

import { useState } from 'react'

interface AgentEditorProps {
  agent: Agent
}

export function AgentEditor({ agent }: AgentEditorProps) {
  const [formData, setFormData] = useState(agent)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await updateAgent(agent.id, formData)
    setIsSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 基本情報 */}
      <section>
        <h2>基本情報</h2>
        <div className="space-y-4">
          <input
            value={formData.display_name}
            onChange={e => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="表示名"
          />
          {/* ... */}
        </div>
      </section>

      {/* プロンプト設定 */}
      <section>
        <h2>プロンプト設定</h2>
        <textarea
          value={formData.system_prompt}
          onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
          rows={20}
          className="w-full font-mono"
        />
        <div className="text-sm text-gray-500">
          {formData.system_prompt.length} 文字
        </div>
      </section>

      {/* 実行設定 */}
      <section>
        <h2>実行設定</h2>
        {/* ... */}
      </section>

      {/* 保存ボタン */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
        <Button variant="ghost">キャンセル</Button>
      </div>
    </div>
  )
}
```

---

### バックエンド（API）

```typescript
// app/api/agents/route.ts
import { createClient } from '@/lib/supabase/server'

// 一覧取得
export async function GET(request: Request) {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('company_id', user.company_id)
    .order('is_system', { ascending: false })
    .order('created_at', { ascending: false })

  return Response.json({ agents })
}

// 新規作成
export async function POST(request: Request) {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const { data: agent } = await supabase
    .from('agents')
    .insert({
      ...body,
      company_id: user.company_id,
      created_by: user.id
    })
    .select()
    .single()

  return Response.json({ agent })
}
```

```typescript
// app/api/agents/[id]/route.ts

// 詳細取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .single()

  return Response.json({ agent })
}

// 更新
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()

  const { data: agent } = await supabase
    .from('agents')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single()

  return Response.json({ agent })
}

// 削除
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  await supabase
    .from('agents')
    .delete()
    .eq('id', params.id)

  return Response.json({ success: true })
}
```

---

## 🚀 実装の優先順位

### Phase 1（1ヶ月目）- 基本機能

- [ ] Supabaseテーブル作成
- [ ] エージェント一覧表示
- [ ] エージェント詳細・編集ページ
- [ ] プロンプト編集機能
- [ ] システムエージェントの登録（経営・営業・人事・財務・統合）

### Phase 2（2ヶ月目）- カスタマイズ機能

- [ ] 新規エージェント作成
- [ ] テンプレート機能
- [ ] 依存関係の設定
- [ ] プレビュー機能（テスト実行）

### Phase 3（3ヶ月目）- 高度な機能

- [ ] エージェントの複製
- [ ] バージョン管理（プロンプトの履歴）
- [ ] A/Bテスト（プロンプトの比較）
- [ ] マーケットプレイス（他社のエージェントを共有）

---

## 📊 初期データ（システムエージェント）

### 1. 経営AI（Executive AI）

```sql
INSERT INTO agents (
  name,
  display_name,
  description,
  category,
  system_prompt,
  is_system,
  priority
) VALUES (
  'executive_ai',
  '経営AI',
  '経営判断と戦略立案を支援するAIです。法人全体の視点で、データに基づいた意思決定をサポートします。',
  'executive',
  'あなたは経営判断と戦略立案を支援するAIです。

以下の点に注意してください:
- 法人全体の視点で考える
- データに基づいた判断を行う
- リスクと機会の両面を提示する
- 短期と長期の両面を考慮する
- 具体的なアクションプランを提示する

あなたの役割:
1. 経営戦略の立案
2. 市場分析と競合分析
3. 投資判断の支援
4. リスクマネジメント
5. 組織改革の提案',
  true,
  'high'
);
```

### 2. 営業AI（Sales AI）

```sql
INSERT INTO agents (
  name,
  display_name,
  description,
  category,
  system_prompt,
  is_system,
  priority
) VALUES (
  'sales_ai',
  '営業AI',
  '営業戦略の立案と分析を支援するAIです。顧客分析、提案書作成、売上予測などをサポートします。',
  'sales',
  'あなたは営業戦略の立案と分析を支援するAIです。

以下の点に注意してください:
- 顧客のニーズを深く理解する
- データに基づいた売上予測を行う
- 効果的な営業戦略を提案する
- 顧客との関係構築を重視する

あなたの役割:
1. 営業戦略の立案
2. 顧客分析とセグメンテーション
3. 提案書・見積書の作成支援
4. 売上予測とKPI管理
5. 営業プロセスの最適化',
  true,
  'medium'
);
```

### 3. 人事AI（HR AI）

```sql
INSERT INTO agents (
  name,
  display_name,
  description,
  category,
  system_prompt,
  is_system,
  priority
) VALUES (
  'hr_ai',
  '人事AI',
  '採用・人材育成・組織開発を支援するAIです。採用計画、育成プラン、組織改革などをサポートします。',
  'hr',
  'あなたは採用・人材育成・組織開発を支援するAIです。

以下の点に注意してください:
- 人材の多様性を尊重する
- データに基づいた人事戦略を提案する
- 組織文化の醸成を重視する
- 従業員のキャリア開発を支援する

あなたの役割:
1. 採用計画の立案
2. 人材育成プランの作成
3. 組織開発と組織改革の支援
4. 評価制度の設計
5. 従業員満足度の向上施策',
  true,
  'medium'
);
```

---

## 🎯 成功指標

### 1ヶ月後
- システムエージェント5体が登録されている
- プロンプト編集ができる
- エージェントの有効/無効化ができる

### 3ヶ月後
- カスタムエージェントが平均3体/社
- プロンプトのカスタマイズ率 > 50%
- エージェント実行回数 > 1,000回/月

---

## 🏁 まとめ

**エージェント管理ページ**は、法人AIの**カスタマイズ性と拡張性の要**。

### 重要ポイント
1. **プロンプト編集** → 各社の業務に最適化
2. **エージェント追加** → 新しいユースケースに対応
3. **依存関係管理** → 複雑なワークフローを実現
4. **統計情報** → エージェントのパフォーマンスを可視化

**このページがあることで、法人AIは「汎用ツール」から「自社専用AI」に進化する。**

---

**作成者**: Claude Code
**最終更新**: 2025年11月23日
