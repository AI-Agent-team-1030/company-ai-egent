# 法人AIエージェントシステム 開発計画書

## 📋 目次
1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [システムアーキテクチャ](#システムアーキテクチャ)
4. [開発ロードマップ](#開発ロードマップ)
5. [ディレクトリ構造](#ディレクトリ構造)
6. [実装の詳細](#実装の詳細)

---

## システム概要

### ビジョン
複数のAIエージェントが連携し、経営判断から各部門への指示展開、タスク実行までを自動化する統合AIシステム

### 主要機能
- **マルチエージェント連携**: 経営AI、部門AI（営業、人事、財務など）が協調動作
- **ナレッジベース**: 組織の知識を蓄積・検索し、AIが参照
- **自動タスク生成**: 経営指示から具体的なタスクへの分解
- **リアルタイム処理**: WebSocketによるリアルタイム通信
- **RAG (Retrieval-Augmented Generation)**: ナレッジベースを活用した高精度な応答

---

## 技術スタック

### フロントエンド
```
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion (アニメーション)
- Zustand (状態管理)
- SWR or React Query (データフェッチング)
```

### バックエンド (Go)
```
- Go 1.21+
- Gin or Echo (Webフレームワーク)
- GORM (ORM)
- go-redis (キャッシュ)
- gorilla/websocket (WebSocket)
- golang-migrate (マイグレーション)
```

### AIエージェント (Python)
```
- Python 3.11+
- LangChain / LangGraph (エージェント制御)
- OpenAI API / Anthropic Claude API
- FastAPI (AIエージェントAPI)
- Celery (非同期タスク処理)
- Redis (メッセージキュー)
- ChromaDB / Qdrant (ベクトルDB)
- sentence-transformers (埋め込み生成)
```

### データベース
```
- PostgreSQL 15+ (メインDB)
- Redis 7+ (キャッシュ & メッセージキュー)
- ChromaDB / Qdrant (ベクトルDB)
```

### インフラ
```
- Docker & Docker Compose
- Nginx (リバースプロキシ)
- AWS / GCP (本番環境)
```

---

## システムアーキテクチャ

### 全体構成図

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  - チャットUI                                            │
│  - ダッシュボード                                        │
│  - タスク管理                                            │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API / WebSocket
                   ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API Gateway (Go)                   │
│  - 認証・認可                                            │
│  - ルーティング                                          │
│  - WebSocket管理                                         │
│  - ビジネスロジック                                      │
└──────────┬─────────────────┬────────────────────────────┘
           │                 │
           ↓                 ↓
┌──────────────────┐  ┌─────────────────────────────────┐
│   PostgreSQL     │  │  AI Agent Orchestrator (Python) │
│   - ユーザー     │  │  - エージェント管理              │
│   - タスク       │  │  - LangGraph制御                │
│   - ナレッジ     │  │  - プロンプト管理               │
│   - ログ         │  └────────┬────────────────────────┘
└──────────────────┘           │
                               ↓
                    ┌──────────────────────┐
                    │   AI Agents (Python) │
                    │  ┌─────────────────┐ │
                    │  │   経営AI         │ │
                    │  ├─────────────────┤ │
                    │  │   営業AI         │ │
                    │  ├─────────────────┤ │
                    │  │   人事AI         │ │
                    │  ├─────────────────┤ │
                    │  │   財務AI         │ │
                    │  ├─────────────────┤ │
                    │  │   統合AI         │ │
                    │  └─────────────────┘ │
                    └──────┬───────────────┘
                           │
                    ┌──────┴───────────────┐
                    │                      │
                    ↓                      ↓
         ┌─────────────────┐    ┌──────────────────┐
         │  Vector DB      │    │     Redis        │
         │  (ChromaDB)     │    │  - Cache         │
         │  - ナレッジ埋込 │    │  - Queue         │
         │  - RAG検索      │    │  - Session       │
         └─────────────────┘    └──────────────────┘
```

### データフロー

```
1. ユーザー入力
   User → Next.js → Go API → Redis Queue

2. AIエージェント処理
   Redis Queue → Python Agent Orchestrator
   → LangGraph (エージェント制御)
   → 各部門AI (並列実行)
   → ナレッジ検索 (Vector DB)
   → LLM API呼び出し
   → 結果統合

3. リアルタイム更新
   Python Agent → Redis Pub/Sub → Go WebSocket → Next.js

4. データ保存
   Go API → PostgreSQL (タスク、ログ、結果)
```

---

## 開発ロードマップ

### Phase 1: 基盤構築 (2-3週間)

#### Week 1: バックエンド基盤
- [ ] Goプロジェクトのセットアップ
  - プロジェクト構造
  - 依存関係の設定
  - Docker環境構築
- [ ] データベース設計
  - PostgreSQLスキーマ設計
  - マイグレーションファイル作成
  - 初期データ投入
- [ ] 基本API実装
  - ユーザー認証 (JWT)
  - CRUD API (Tasks, Knowledge)
  - ヘルスチェック

#### Week 2: AI基盤
- [ ] Pythonプロジェクトのセットアップ
  - FastAPIプロジェクト構築
  - LangChain/LangGraph導入
  - 環境変数管理
- [ ] ベクトルDB構築
  - ChromaDB/Qdrant導入
  - 埋め込みモデル選定
  - 初期ナレッジ投入
- [ ] 基本エージェント実装
  - シンプルなエージェント1つ
  - LLM API接続
  - プロンプトテンプレート

#### Week 3: 連携実装
- [ ] Go ↔ Python連携
  - Redis Queue実装
  - WebSocket実装
  - エラーハンドリング
- [ ] フロントエンド改修
  - API統合
  - WebSocket接続
  - ローディング状態

---

### Phase 2: コア機能実装 (3-4週間)

#### Week 4-5: マルチエージェント
- [ ] エージェントオーケストレーター
  - LangGraph定義
  - エージェント間通信
  - タスク分配ロジック
- [ ] 部門AIエージェント実装
  - 経営AI
  - 営業AI
  - 人事AI
  - 財務AI
  - 統合AI
- [ ] エージェント状態管理
  - 処理状態の可視化
  - エラーリカバリー

#### Week 6-7: ナレッジベース & RAG
- [ ] ナレッジ管理システム
  - ナレッジCRUD API
  - 自動埋め込み生成
  - バージョン管理
- [ ] RAG実装
  - セマンティック検索
  - リランキング
  - コンテキスト生成
- [ ] ナレッジ学習機能
  - タスク実行結果の保存
  - 成功パターンの抽出

---

### Phase 3: 高度な機能 (3-4週間)

#### Week 8-9: タスク自動生成
- [ ] タスク分解ロジック
  - 経営指示の解析
  - タスクの自動生成
  - 優先度付け
- [ ] タスク実行エンジン
  - 自動実行トリガー
  - 進捗追跡
  - 完了判定

#### Week 10-11: 高度なUI
- [ ] ダッシュボード強化
  - リアルタイムチャート
  - KPI可視化
  - エージェント活動履歴
- [ ] チャット機能強化
  - ストリーミング応答
  - ファイルアップロード
  - 会話履歴

---

### Phase 4: 本番化準備 (2-3週間)

#### Week 12-13: パフォーマンス & セキュリティ
- [ ] パフォーマンス最適化
  - キャッシング戦略
  - クエリ最適化
  - 並列処理
- [ ] セキュリティ強化
  - 権限管理
  - API Rate Limiting
  - データ暗号化

#### Week 14: デプロイ & 監視
- [ ] 本番環境構築
  - Kubernetes/ECS
  - CI/CD構築
  - 監視・ログ
- [ ] ドキュメント
  - API仕様書
  - 運用マニュアル
  - ユーザーガイド

---

## ディレクトリ構造

### 全体構成
```
corporate-ai-system/
├── frontend/              # Next.js フロントエンド
├── backend/               # Go バックエンド
├── agents/                # Python AIエージェント
├── docker/                # Docker設定
└── docs/                  # ドキュメント
```

### フロントエンド (Next.js)
```
frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── chat/
│   │   ├── tasks/
│   │   ├── knowledge/
│   │   └── organization/
│   └── api/               # API Routes (プロキシ)
├── components/
│   ├── ui/                # 共通UIコンポーネント
│   ├── chat/              # チャット関連
│   ├── tasks/             # タスク関連
│   └── dashboard/         # ダッシュボード関連
├── lib/
│   ├── api/               # API クライアント
│   ├── websocket/         # WebSocket クライアント
│   └── utils/             # ユーティリティ
├── store/                 # Zustand ストア
├── types/                 # TypeScript型定義
└── hooks/                 # カスタムフック
```

### バックエンド (Go)
```
backend/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── handler/           # HTTPハンドラー
│   │   ├── auth.go
│   │   ├── task.go
│   │   ├── knowledge.go
│   │   └── websocket.go
│   ├── service/           # ビジネスロジック
│   │   ├── task_service.go
│   │   ├── agent_service.go
│   │   └── knowledge_service.go
│   ├── repository/        # データアクセス
│   │   ├── task_repo.go
│   │   ├── user_repo.go
│   │   └── knowledge_repo.go
│   ├── model/             # データモデル
│   │   ├── task.go
│   │   ├── user.go
│   │   └── knowledge.go
│   ├── middleware/        # ミドルウェア
│   │   ├── auth.go
│   │   ├── cors.go
│   │   └── logger.go
│   └── queue/             # Redisキュー
│       ├── producer.go
│       └── consumer.go
├── pkg/                   # 共通パッケージ
│   ├── database/
│   ├── redis/
│   └── logger/
├── migrations/            # DBマイグレーション
└── config/                # 設定ファイル
```

### AIエージェント (Python)
```
agents/
├── src/
│   ├── agents/            # 各エージェント実装
│   │   ├── base.py
│   │   ├── executive_agent.py
│   │   ├── sales_agent.py
│   │   ├── hr_agent.py
│   │   ├── finance_agent.py
│   │   └── integration_agent.py
│   ├── orchestrator/      # エージェント制御
│   │   ├── langgraph_flow.py
│   │   └── task_distributor.py
│   ├── knowledge/         # ナレッジ管理
│   │   ├── vector_store.py
│   │   ├── embedding.py
│   │   └── retriever.py
│   ├── prompts/           # プロンプトテンプレート
│   │   ├── executive.py
│   │   ├── sales.py
│   │   └── common.py
│   ├── api/               # FastAPI
│   │   ├── main.py
│   │   └── routes/
│   ├── workers/           # Celeryワーカー
│   │   └── tasks.py
│   └── utils/
│       ├── llm_client.py
│       └── logger.py
├── tests/
├── requirements.txt
└── pyproject.toml
```

---

## 実装の詳細

### 1. バックエンドAPI設計 (Go)

#### 主要エンドポイント

```go
// 認証
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh

// タスク
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/:id
PUT    /api/v1/tasks/:id
DELETE /api/v1/tasks/:id

// チャット（エージェント連携）
POST   /api/v1/chat/message
GET    /api/v1/chat/history
WebSocket /api/v1/chat/ws

// ナレッジ
GET    /api/v1/knowledge
POST   /api/v1/knowledge
GET    /api/v1/knowledge/:id
PUT    /api/v1/knowledge/:id
DELETE /api/v1/knowledge/:id
POST   /api/v1/knowledge/search

// エージェント
GET    /api/v1/agents/status
POST   /api/v1/agents/execute
GET    /api/v1/agents/activities
```

#### データモデル例

```go
// Task
type Task struct {
    ID          string    `json:"id" gorm:"primaryKey"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Status      string    `json:"status"`
    Priority    string    `json:"priority"`
    AssignedTo  string    `json:"assigned_to"`
    Department  string    `json:"department"`
    DueDate     time.Time `json:"due_date"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
    Progress    int       `json:"progress"`
    AIGenerated bool      `json:"ai_generated"`
}

// Knowledge
type Knowledge struct {
    ID         string    `json:"id" gorm:"primaryKey"`
    Title      string    `json:"title"`
    Content    string    `json:"content"`
    Category   string    `json:"category"`
    Department string    `json:"department"`
    Tags       []string  `json:"tags" gorm:"type:text[]"`
    Embedding  []float32 `json:"-" gorm:"type:vector(1536)"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`
    UsageCount int       `json:"usage_count"`
}
```

---

### 2. AIエージェント設計 (Python)

#### LangGraphフロー

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List

class AgentState(TypedDict):
    messages: List[dict]
    current_agent: str
    task: str
    knowledge: List[dict]
    results: dict

# グラフ定義
workflow = StateGraph(AgentState)

# ノード追加
workflow.add_node("executive", executive_agent)
workflow.add_node("sales", sales_agent)
workflow.add_node("hr", hr_agent)
workflow.add_node("finance", finance_agent)
workflow.add_node("integration", integration_agent)
workflow.add_node("knowledge_search", knowledge_search)

# エッジ定義
workflow.add_edge("executive", "knowledge_search")
workflow.add_edge("knowledge_search", route_to_departments)
workflow.add_conditional_edges(
    "sales",
    check_completion,
    {
        "continue": "integration",
        "end": END
    }
)

# コンパイル
app = workflow.compile()
```

#### エージェント実装例

```python
class ExecutiveAgent:
    def __init__(self, llm, knowledge_retriever):
        self.llm = llm
        self.retriever = knowledge_retriever

    async def process(self, state: AgentState) -> AgentState:
        # 1. ナレッジ検索
        relevant_knowledge = await self.retriever.search(
            query=state["task"],
            top_k=3
        )

        # 2. プロンプト構築
        prompt = self._build_prompt(
            task=state["task"],
            knowledge=relevant_knowledge
        )

        # 3. LLM呼び出し
        response = await self.llm.ainvoke(prompt)

        # 4. タスク分解
        tasks = self._parse_tasks(response)

        # 5. 状態更新
        state["results"]["executive"] = {
            "analysis": response,
            "tasks": tasks,
            "knowledge_used": relevant_knowledge
        }

        return state
```

---

### 3. ナレッジベース & RAG

#### ベクトルストア実装

```python
from chromadb import Client
from sentence_transformers import SentenceTransformer

class KnowledgeStore:
    def __init__(self):
        self.client = Client()
        self.collection = self.client.create_collection("knowledge")
        self.embedder = SentenceTransformer('intfloat/multilingual-e5-large')

    def add_knowledge(self, knowledge: dict):
        """ナレッジを追加"""
        embedding = self.embedder.encode(
            knowledge["content"],
            convert_to_tensor=False
        ).tolist()

        self.collection.add(
            ids=[knowledge["id"]],
            embeddings=[embedding],
            documents=[knowledge["content"]],
            metadatas=[{
                "title": knowledge["title"],
                "category": knowledge["category"],
                "department": knowledge.get("department")
            }]
        )

    def search(self, query: str, top_k: int = 5) -> List[dict]:
        """セマンティック検索"""
        query_embedding = self.embedder.encode(
            query,
            convert_to_tensor=False
        ).tolist()

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )

        return [
            {
                "id": id,
                "content": doc,
                "metadata": meta,
                "score": 1 - distance
            }
            for id, doc, meta, distance in zip(
                results["ids"][0],
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]
```

---

### 4. リアルタイム通信

#### WebSocket (Go)

```go
type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.clients[client] = true

        case client := <-h.unregister:
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }

        case message := <-h.broadcast:
            for client := range h.clients {
                select {
                case client.send <- message:
                default:
                    close(client.send)
                    delete(h.clients, client)
                }
            }
        }
    }
}
```

#### Redis Pub/Sub (Python → Go)

```python
# Python側 (エージェント)
import redis

redis_client = redis.Redis()

async def publish_activity(activity: dict):
    """エージェントの活動をリアルタイム配信"""
    await redis_client.publish(
        "agent_activities",
        json.dumps(activity)
    )
```

```go
// Go側
func (s *AgentService) SubscribeActivities() {
    pubsub := s.redis.Subscribe("agent_activities")

    for msg := range pubsub.Channel() {
        var activity AgentActivity
        json.Unmarshal([]byte(msg.Payload), &activity)

        // WebSocketでフロントエンドに配信
        s.hub.broadcast <- []byte(msg.Payload)
    }
}
```

---

### 5. フロントエンド統合

#### API クライアント

```typescript
// lib/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// リクエストインターセプター
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const chatAPI = {
  sendMessage: async (message: string) => {
    const { data } = await apiClient.post('/chat/message', { message })
    return data
  },

  getHistory: async () => {
    const { data } = await apiClient.get('/chat/history')
    return data
  },
}

export const taskAPI = {
  getTasks: async () => {
    const { data } = await apiClient.get('/tasks')
    return data
  },

  createTask: async (task: CreateTaskInput) => {
    const { data } = await apiClient.post('/tasks', task)
    return data
  },
}
```

#### WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react'

export function useWebSocket(url: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    const websocket = new WebSocket(url)

    websocket.onopen = () => {
      console.log('WebSocket connected')
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages((prev) => [...prev, data])
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [url])

  const sendMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  return { messages, sendMessage }
}
```

---

## 環境変数設定

### Backend (.env)
```env
# Server
PORT=8080
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=corporate_ai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Python Agent
AGENT_API_URL=http://localhost:8000
```

### Agents (.env)
```env
# LLM API
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Vector DB
CHROMADB_HOST=localhost
CHROMADB_PORT=8001

# Redis
REDIS_URL=redis://localhost:6379

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/corporate_ai
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/v1/chat/ws
```

---

## Docker Compose

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: corporate_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # ChromaDB
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/data

  # Backend (Go)
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      REDIS_HOST: redis
      AGENT_API_URL: http://agents:8000
    depends_on:
      - postgres
      - redis

  # AI Agents (Python)
  agents:
    build: ./agents
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/corporate_ai
      REDIS_URL: redis://redis:6379
      CHROMADB_HOST: chromadb
    depends_on:
      - postgres
      - redis
      - chromadb

  # Frontend (Next.js)
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080/api/v1
      NEXT_PUBLIC_WS_URL: ws://localhost:8080/api/v1/chat/ws
    depends_on:
      - backend

volumes:
  postgres_data:
  chroma_data:
```

---

## 次のステップ

### 即座に開始すべきこと
1. **バックエンドのセットアップ**
   ```bash
   mkdir backend
   cd backend
   go mod init github.com/yourusername/corporate-ai-backend
   ```

2. **Pythonエージェントのセットアップ**
   ```bash
   mkdir agents
   cd agents
   python -m venv venv
   source venv/bin/activate
   pip install langchain langgraph openai fastapi
   ```

3. **データベース設計**
   - PostgreSQLスキーマ作成
   - マイグレーションファイル作成

### 推奨する学習リソース
- **Go**: [Go by Example](https://gobyexample.com/)
- **LangChain**: [LangChain Documentation](https://python.langchain.com/)
- **LangGraph**: [LangGraph Tutorial](https://langchain-ai.github.io/langgraph/)
- **Vector DB**: [ChromaDB Guide](https://docs.trychroma.com/)

---

## まとめ

このシステムは段階的に構築していくことが重要です。まずは**Phase 1の基盤構築**から始め、動くものを早期に作ることをお勧めします。

質問や詳細が必要な部分があれば、いつでもお聞きください！
