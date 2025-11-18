# AIエージェントシステム アーキテクチャ分析レポート

**作成日**: 2025年11月9日
**目的**: サブエージェント vs Python実装の比較分析とコスト試算

---

## 📋 目次

1. [現状分析](#現状分析)
2. [アーキテクチャパターン比較](#アーキテクチャパターン比較)
3. [コスト試算](#コスト試算)
4. [推奨アーキテクチャ](#推奨アーキテクチャ)
5. [実装ロードマップ](#実装ロードマップ)

---

## 現状分析

### 現在の実装状況

```
フロントエンド: Next.js/React (実装済み)
├─ ゴール設定UI
├─ チャット形式のヒアリング
├─ タスク実行のシミュレーション（モックデータ）
└─ 進捗表示

バックエンド: なし（モックのみ）
AI連携: なし（実装なし）
```

### 仕様上の設計

```
Executive AI (経営AI)
    ↓ 指示
Department AIs (部門AI)
├─ 営業AI
├─ 人事AI
├─ 財務AI
├─ マーケティングAI
└─ 開発AI
    ↓ 実行結果
Integration Core (統合AI)
    ↓ 成果物
ユーザー
```

**課題点**:
- 複数のAIエージェントを管理する必要がある
- エージェント間の通信コストが高い可能性
- Claude APIを何回も呼び出すとコストがかかる

---

## アーキテクチャパターン比較

### パターンA: マルチエージェント（仕様通り）

```python
# Anthropic Claude API + マルチエージェント

from anthropic import Anthropic

class ExecutiveAgent:
    """経営AIエージェント"""
    def analyze_goal(self, goal):
        response = anthropic.messages.create(
            model="claude-sonnet-4",
            messages=[{
                "role": "user",
                "content": f"ゴール: {goal}\n\n部門別に指示を生成してください"
            }]
        )
        return response.content

class SalesAgent:
    """営業AIエージェント"""
    def create_sales_plan(self, instruction):
        response = anthropic.messages.create(
            model="claude-sonnet-4",
            messages=[{
                "role": "user",
                "content": f"営業指示: {instruction}\n\n営業計画を作成してください"
            }]
        )
        return response.content

# ... 他のエージェントも同様
```

**メリット**:
- ✅ 各エージェントが専門性を持つ
- ✅ 並列処理が可能
- ✅ 役割が明確で保守しやすい
- ✅ エージェントごとに異なるプロンプトを最適化可能

**デメリット**:
- ❌ API呼び出し回数が多い（コスト高）
- ❌ エージェント間の通信が複雑
- ❌ レイテンシが高い（各エージェント順次実行）
- ❌ トークン消費が多い

**コスト試算**（1ゴールあたり）:
```
Executive AI: 1回のAPI呼び出し
Department AIs: 5回のAPI呼び出し（営業、人事、財務、マーケ、開発）
Integration Core: 1回のAPI呼び出し

合計: 7回のAPI呼び出し

推定トークン数:
- Input: 1,000 tokens × 7 = 7,000 tokens
- Output: 2,000 tokens × 7 = 14,000 tokens

コスト（Claude Sonnet 4）:
- Input: $3 / 1M tokens → $0.021
- Output: $15 / 1M tokens → $0.210
合計: 約 $0.23 / ゴール
```

---

### パターンB: シングルエージェント（Pythonバックエンド）

```python
# 1つのAIエージェントで全て処理

from anthropic import Anthropic

class UnifiedAgent:
    """統合AIエージェント"""

    def process_goal(self, goal_data):
        """1回のAPI呼び出しで全て処理"""

        system_prompt = """
あなたは法人向けAIエージェントシステムです。
以下の役割を全て担当します：

1. 経営層として戦略を立案
2. 営業部門として営業計画を作成
3. 人事部門として採用計画を作成
4. 財務部門として予算計画を作成
5. マーケティング部門として施策を立案
6. 最終的な実行計画書を統合

ゴールを受け取り、包括的な実行計画書を一度に生成してください。
"""

        response = anthropic.messages.create(
            model="claude-sonnet-4",
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": f"""
ゴール: {goal_data['title']}
現状: {goal_data['current_situation']}
期限: {goal_data['deadline']}
予算: {goal_data['budget']}
優先事項: {goal_data['priority']}

以下の形式で実行計画書を作成してください：
1. エグゼクティブサマリー
2. 営業戦略とタスク
3. 人員計画とタスク
4. 予算計画
5. マーケティング施策
6. タイムライン
7. KPI設定
"""
            }],
            max_tokens=8000
        )

        return self.parse_response(response.content)

    def parse_response(self, content):
        """レスポンスをパースしてタスクに分解"""
        # レスポンスを解析してタスクリストに変換
        # ...
        return {
            "executive_summary": "...",
            "sales_plan": {...},
            "hr_plan": {...},
            "finance_plan": {...},
            "marketing_plan": {...},
            "timeline": [...],
            "kpis": [...]
        }
```

**メリット**:
- ✅ API呼び出し回数が少ない（コスト削減）
- ✅ レイテンシが低い（1回の呼び出し）
- ✅ 実装がシンプル
- ✅ エージェント間通信が不要

**デメリット**:
- ❌ 1つのプロンプトで全てをカバーする必要がある
- ❌ 専門性が薄れる可能性
- ❌ 出力のコントロールが難しい
- ❌ エラー時に全体を再実行

**コスト試算**（1ゴールあたり）:
```
API呼び出し: 1回のみ

推定トークン数:
- Input: 2,000 tokens（詳細な指示を含む）
- Output: 8,000 tokens（包括的な計画書）

コスト（Claude Sonnet 4）:
- Input: $3 / 1M tokens → $0.006
- Output: $15 / 1M tokens → $0.120
合計: 約 $0.13 / ゴール
```

**コスト削減率**: 約43%削減

---

### パターンC: ハイブリッド（推奨）

```python
# 2段階アプローチ: 戦略 + 実行

class StrategyAgent:
    """戦略立案AI（1回目の呼び出し）"""

    def create_strategy(self, goal_data):
        """高レベルの戦略を立案"""
        response = anthropic.messages.create(
            model="claude-sonnet-4",
            messages=[{
                "role": "user",
                "content": f"""
ゴール: {goal_data['title']}

以下の観点で戦略を立案してください：
1. 必要な部門とそれぞれの役割
2. 各部門のKPI
3. 優先順位とタイムライン
4. リスクと対策

簡潔なJSON形式で出力してください。
"""
            }],
            max_tokens=2000
        )
        return json.loads(response.content)

class ExecutionAgent:
    """実行計画AI（2回目の呼び出し）"""

    def create_execution_plan(self, strategy):
        """戦略をもとに詳細な実行計画を作成"""
        response = anthropic.messages.create(
            model="claude-sonnet-4",
            messages=[{
                "role": "user",
                "content": f"""
戦略: {json.dumps(strategy)}

この戦略に基づいて、各部門の詳細な実行計画を作成してください：
- 営業部門: {strategy['sales']['role']}
- 人事部門: {strategy['hr']['role']}
- 財務部門: {strategy['finance']['role']}
- マーケティング部門: {strategy['marketing']['role']}

各部門について以下を含めてください：
1. 具体的なタスクリスト（20個程度）
2. 成果物
3. 期限
4. 必要なリソース
"""
            }],
            max_tokens=6000
        )
        return response.content
```

**メリット**:
- ✅ 適度な粒度での処理
- ✅ 戦略と実行を分離できる
- ✅ エラーハンドリングがしやすい
- ✅ コストとクオリティのバランスが良い
- ✅ 必要に応じて戦略を調整可能

**デメリット**:
- △ パターンBより若干コストが高い
- △ 2回の呼び出しが必要

**コスト試算**（1ゴールあたり）:
```
API呼び出し: 2回

1回目（戦略立案）:
- Input: 1,000 tokens
- Output: 2,000 tokens

2回目（実行計画）:
- Input: 3,000 tokens（戦略を含む）
- Output: 6,000 tokens

合計:
- Input: 4,000 tokens
- Output: 8,000 tokens

コスト（Claude Sonnet 4）:
- Input: $3 / 1M tokens → $0.012
- Output: $15 / 1M tokens → $0.120
合計: 約 $0.13 / ゴール
```

**コスト削減率**: 約43%削減（パターンBと同程度）

---

### パターンD: フロー型エージェント（LangGraph使用）

```python
# LangGraphを使った状態管理型エージェント

from langgraph.graph import StateGraph, END
from typing import TypedDict

class AgentState(TypedDict):
    goal: str
    strategy: dict
    sales_plan: dict
    hr_plan: dict
    finance_plan: dict
    marketing_plan: dict
    final_plan: str

def executive_node(state: AgentState) -> AgentState:
    """経営判断ノード"""
    response = call_claude(f"ゴール: {state['goal']}\n戦略を立案")
    state['strategy'] = response
    return state

def sales_node(state: AgentState) -> AgentState:
    """営業計画ノード"""
    response = call_claude(f"戦略: {state['strategy']}\n営業計画を作成")
    state['sales_plan'] = response
    return state

def integration_node(state: AgentState) -> AgentState:
    """統合ノード"""
    all_plans = {
        "sales": state['sales_plan'],
        "hr": state['hr_plan'],
        "finance": state['finance_plan'],
        "marketing": state['marketing_plan']
    }
    response = call_claude(f"全計画: {all_plans}\n実行計画書を統合")
    state['final_plan'] = response
    return state

# グラフ構築
workflow = StateGraph(AgentState)
workflow.add_node("executive", executive_node)
workflow.add_node("sales", sales_node)
workflow.add_node("hr", hr_node)
workflow.add_node("finance", finance_node)
workflow.add_node("marketing", marketing_node)
workflow.add_node("integration", integration_node)

# フロー定義
workflow.set_entry_point("executive")
workflow.add_edge("executive", "sales")
workflow.add_edge("executive", "hr")
workflow.add_edge("executive", "finance")
workflow.add_edge("executive", "marketing")
workflow.add_edge("sales", "integration")
workflow.add_edge("hr", "integration")
workflow.add_edge("finance", "integration")
workflow.add_edge("marketing", "integration")
workflow.add_edge("integration", END)

app = workflow.compile()
```

**メリット**:
- ✅ 複雑なフローを視覚的に管理
- ✅ 並列実行が可能（sales, hr, finance, marketing同時実行）
- ✅ 状態管理が明確
- ✅ エラーハンドリングとリトライが容易
- ✅ 後からフローの変更が簡単

**デメリット**:
- ❌ LangGraphの学習コストがある
- ❌ API呼び出し回数は多い（パターンAと同様）
- ❌ 並列実行でもレイテンシは改善しない（最長パスが全体時間）

**コスト試算**（1ゴールあたり）:
```
パターンAと同様: 約 $0.23 / ゴール

ただし並列実行により処理時間は短縮:
- 逐次実行: 7ステップ → 約70秒
- 並列実行: 3ステップ（exec → 4並列 → integration） → 約30秒
```

---

## コスト試算

### 月間利用想定

```
想定：
- 導入企業: 100社
- 1企業あたり月間ゴール数: 10個
- 月間総ゴール数: 1,000個
```

### 各パターンのコスト比較

| パターン | 1ゴールあたり | 月間コスト（1,000ゴール） | 年間コスト |
|---------|------------|----------------------|----------|
| A: マルチエージェント | $0.23 | $230 | $2,760 |
| B: シングルエージェント | $0.13 | $130 | $1,560 |
| C: ハイブリッド | $0.13 | $130 | $1,560 |
| D: フロー型（LangGraph） | $0.23 | $230 | $2,760 |

### 追加コスト要因

```
上記は基本的なゴール設定のみのコスト。
実際には以下も発生:

1. ナレッジベース検索（RAG）:
   - 月間クエリ数: 10,000回
   - 1クエリあたり: $0.01
   - 月間コスト: $100

2. チャットサポート:
   - 月間セッション数: 5,000回
   - 1セッションあたり: $0.05
   - 月間コスト: $250

3. 成果物の再生成・編集:
   - 月間リクエスト数: 2,000回
   - 1リクエストあたり: $0.08
   - 月間コスト: $160

合計追加コスト: $510/月
```

### 総コスト比較（月間）

| パターン | ゴール処理 | 追加機能 | 合計 |
|---------|----------|---------|------|
| A: マルチエージェント | $230 | $510 | $740 |
| B: シングルエージェント | $130 | $510 | $640 |
| C: ハイブリッド | $130 | $510 | $640 |
| D: フロー型 | $230 | $510 | $740 |

---

## 推奨アーキテクチャ

### 🏆 推奨: パターンC（ハイブリッド）

**理由**:

1. **コストパフォーマンスが最高**
   - パターンAより43%コスト削減
   - パターンBと同等のコスト
   - 年間約$1,200節約

2. **品質と柔軟性のバランス**
   - 戦略と実行を分離することで、各フェーズでの調整が可能
   - エラーが発生しても部分的な再実行で対応可能
   - ユーザーが戦略を確認してから実行に進むことも可能

3. **実装難易度が低い**
   - 新しいライブラリ（LangGraph等）の学習不要
   - シンプルなPython + Anthropic SDKで実装可能
   - 保守・拡張が容易

4. **スケーラビリティ**
   - 必要に応じて部門別エージェントを追加可能
   - 将来的にパターンDへの移行も容易

### 実装例（推奨構成）

```python
# backend/agents/strategy_agent.py

from anthropic import Anthropic
import json
from typing import Dict, Any

class StrategyAgent:
    """戦略立案AI"""

    def __init__(self):
        self.client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.model = "claude-sonnet-4"

    def analyze_goal(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """ゴールを分析して戦略を立案"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            system="""
あなたは経営戦略のエキスパートです。
企業のゴールを分析し、各部門への指示を明確に定義します。

以下の形式でJSON出力してください：
{
  "summary": "戦略の概要",
  "departments": {
    "sales": {
      "role": "営業部門の役割",
      "kpi": "KPI",
      "priority": 1
    },
    "hr": {...},
    "finance": {...},
    "marketing": {...}
  },
  "timeline": "期間",
  "risks": ["リスク1", "リスク2"]
}
""",
            messages=[{
                "role": "user",
                "content": f"""
ゴール: {goal_data['title']}
現状: {goal_data['current_situation']}
期限: {goal_data['deadline']}
予算: {goal_data['budget']}
優先事項: {goal_data['priority']}

上記のゴールを分析し、戦略を立案してください。
"""
            }]
        )

        # JSONをパース
        strategy = json.loads(response.content[0].text)
        return strategy


class ExecutionAgent:
    """実行計画AI"""

    def __init__(self):
        self.client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        self.model = "claude-sonnet-4"

    def create_execution_plan(
        self,
        goal_data: Dict[str, Any],
        strategy: Dict[str, Any]
    ) -> str:
        """戦略に基づいて詳細な実行計画を作成"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=8000,
            system="""
あなたは実行計画のエキスパートです。
戦略を受け取り、各部門の具体的なタスクと成果物を定義します。

以下の形式でMarkdown出力してください：
# 実行計画書

## 1. エグゼクティブサマリー
...

## 2. 営業戦略
### タスク
- [ ] タスク1
- [ ] タスク2
### 成果物
- 成果物1
- 成果物2

## 3. 人員計画
...
""",
            messages=[{
                "role": "user",
                "content": f"""
ゴール: {goal_data['title']}

戦略:
{json.dumps(strategy, ensure_ascii=False, indent=2)}

上記の戦略に基づき、各部門の詳細な実行計画を作成してください。
以下を必ず含めてください：
1. エグゼクティブサマリー
2. 営業戦略（タスク10個以上、成果物3つ以上）
3. 人員計画（タスク5個以上、成果物2つ以上）
4. 予算計画（収支予測を含む）
5. マーケティング施策（タスク10個以上）
6. タイムライン（ガントチャート形式）
7. KPI設定
"""
            }]
        )

        return response.content[0].text


# backend/api/goals.py

from fastapi import APIRouter, HTTPException
from .agents.strategy_agent import StrategyAgent, ExecutionAgent

router = APIRouter()

@router.post("/goals")
async def create_goal(goal_data: dict):
    """ゴールを作成し、実行計画を生成"""

    try:
        # 1. 戦略立案
        strategy_agent = StrategyAgent()
        strategy = strategy_agent.analyze_goal(goal_data)

        # 2. 実行計画作成
        execution_agent = ExecutionAgent()
        execution_plan = execution_agent.create_execution_plan(
            goal_data,
            strategy
        )

        # 3. DBに保存
        # ...

        return {
            "goal_id": "...",
            "strategy": strategy,
            "execution_plan": execution_plan
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 実装ロードマップ

### Phase 1: MVP（1-2ヶ月）

**目標**: ハイブリッドアーキテクチャで基本機能を実装

```
Week 1-2: バックエンド基盤
- FastAPI + PostgreSQL環境構築
- Anthropic Claude API統合
- StrategyAgentの実装

Week 3-4: 実行計画生成
- ExecutionAgentの実装
- レスポンスパーサーの実装
- タスク自動生成機能

Week 5-6: フロントエンド統合
- Next.js → FastAPI API連携
- リアルタイム進捗表示（WebSocket）
- 成果物表示機能

Week 7-8: テストとリファクタリング
- ユニットテスト
- E2Eテスト
- パフォーマンス最適化
```

### Phase 2: 機能拡張（2-3ヶ月）

```
- ナレッジベース（RAG）の実装
- チャットサポート機能
- 成果物の編集・再生成機能
- 複数ゴールの並行処理
```

### Phase 3: エンタープライズ対応（3-4ヶ月）

```
- LangGraphへの移行（オプション）
- より複雑なワークフロー対応
- カスタムエージェントの追加
- オンプレミス対応
```

---

## 補足: なぜPythonバックエンドか

### TypeScript/Node.jsではなくPythonを推奨する理由

1. **AI/ML エコシステムの充実**
   ```
   - LangChain: 最も成熟したLLMフレームワーク
   - LangGraph: 複雑なエージェントフロー管理
   - ChromaDB, Pinecone: ベクトルDB統合
   - Anthropic SDK: 公式サポートが充実
   ```

2. **データ処理の強み**
   ```python
   import pandas as pd
   import numpy as np

   # 複雑なデータ処理が簡潔に書ける
   df = pd.read_csv("sales_data.csv")
   analysis = df.groupby("department").agg({
       "revenue": "sum",
       "cost": "mean"
   })
   ```

3. **機械学習との親和性**
   ```
   将来的に以下を追加する際にPythonが有利:
   - 売上予測モデル
   - 顧客セグメンテーション
   - 異常検知
   - レコメンデーション
   ```

4. **並行処理の柔軟性**
   ```python
   import asyncio

   # 複数のAIエージェントを並列実行
   async def process_all_departments(strategy):
       tasks = [
           sales_agent.process(strategy),
           hr_agent.process(strategy),
           finance_agent.process(strategy),
           marketing_agent.process(strategy)
       ]
       results = await asyncio.gather(*tasks)
       return results
   ```

### Next.jsとの連携

```
フロントエンド（Next.js）
    ↓ REST API / WebSocket
バックエンド（FastAPI/Python）
    ↓ Anthropic SDK
Claude API
```

FastAPIは高速で、Next.jsとの連携も簡単：

```typescript
// Next.js側
const response = await fetch('/api/goals', {
  method: 'POST',
  body: JSON.stringify(goalData)
})
const { strategy, execution_plan } = await response.json()
```

---

## まとめ

### コスト削減の推奨事項

1. **ハイブリッドアーキテクチャ（パターンC）を採用**
   - マルチエージェントより43%コスト削減
   - 年間$1,200節約

2. **バックエンドはPythonで実装**
   - AI/MLエコシステムの恩恵
   - 将来の拡張性が高い

3. **段階的な実装**
   - MVP: シンプルなハイブリッド
   - Phase 2: 機能追加
   - Phase 3: 必要に応じてLangGraphへ移行

4. **コスト最適化Tips**
   - Prompt Caching活用（同じコンテキストの再利用で50%削減）
   - Claude Haikuの活用（シンプルなタスクは安価なモデルで）
   - バッチ処理の活用（複数タスクをまとめて処理）

### 次のアクション

1. ✅ このアーキテクチャ案をレビュー
2. FastAPI + PostgreSQLの環境構築開始
3. StrategyAgentのプロトタイプ実装
4. Claude APIのPrompt Cachingを試す
5. MVP完成後、実際のコストを測定して最適化

---

**作成者**: AI Assistant
**最終更新**: 2025年11月9日
