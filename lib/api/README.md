# API設計ドキュメント

## 概要

法人自走型AIエージェントシステムのAPIエンドポイント設計

## 認証

### POST /api/auth/login
ログイン

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "山田太郎",
    "email": "user@example.com",
    "role": "executive",
    "department": "management"
  }
}
```

### POST /api/auth/logout
ログアウト

### GET /api/auth/me
現在のユーザー情報取得

---

## ダッシュボード

### GET /api/dashboard/stats
ダッシュボード統計情報

**Response:**
```json
{
  "totalTasks": 42,
  "completedTasks": 158,
  "activeTasks": 42,
  "totalAgents": 8,
  "activeAgents": 8,
  "pendingDirectives": 3,
  "knowledgeItems": 125,
  "organizationScore": 87
}
```

### GET /api/dashboard/directives
経営指示一覧

**Response:**
```json
{
  "directives": [
    {
      "id": "directive_id",
      "title": "新規顧客獲得の強化",
      "content": "今期は新規顧客獲得を強化したい",
      "status": "active",
      "progress": 65,
      "departments": ["sales", "marketing", "hr"],
      "createdAt": "2024-11-01T00:00:00Z",
      "kpis": [...]
    }
  ]
}
```

---

## AIチャット

### POST /api/chat/message
AIにメッセージ送信

**Request:**
```json
{
  "message": "新規顧客獲得を強化したい",
  "context": {
    "role": "executive"
  }
}
```

**Response:**
```json
{
  "id": "message_id",
  "role": "assistant",
  "content": "新規顧客獲得について分析しました...",
  "timestamp": "2024-11-05T10:30:00Z",
  "actions": [
    {
      "type": "create_tasks",
      "tasks": [...]
    }
  ]
}
```

### GET /api/chat/history
チャット履歴取得

---

## タスク管理

### GET /api/tasks
タスク一覧取得

**Query Parameters:**
- status: pending | in_progress | completed | blocked
- department: sales | hr | finance | etc.
- assignedTo: user_id

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_id",
      "title": "新規リード獲得リストの作成",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "assignedTo": "営業AI",
      "department": "sales",
      "dueDate": "2024-11-10",
      "progress": 65,
      "aiGenerated": true
    }
  ],
  "total": 42
}
```

### POST /api/tasks
タスク作成

### PUT /api/tasks/:id
タスク更新

### DELETE /api/tasks/:id
タスク削除

---

## ナレッジベース

### GET /api/knowledge
ナレッジ一覧取得

**Query Parameters:**
- category: string
- department: string
- search: string
- tags: string[]

**Response:**
```json
{
  "items": [
    {
      "id": "knowledge_id",
      "title": "新規顧客へのアプローチ方法",
      "content": "...",
      "category": "営業ノウハウ",
      "department": "sales",
      "tags": ["新規開拓", "初回接触"],
      "createdAt": "2024-10-28",
      "usageCount": 48,
      "helpful": 42
    }
  ],
  "total": 125
}
```

### POST /api/knowledge
ナレッジ作成

### GET /api/knowledge/:id
ナレッジ詳細取得

---

## ドキュメント

### GET /api/documents
ドキュメント一覧取得

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_id",
      "title": "Q3経営会議資料",
      "type": "meeting_notes",
      "department": "management",
      "status": "approved",
      "aiGenerated": true,
      "createdAt": "2024-11-04"
    }
  ]
}
```

### POST /api/documents/generate
AIドキュメント生成

**Request:**
```json
{
  "type": "report",
  "title": "営業部門月次レポート",
  "department": "sales",
  "parameters": {
    "period": "2024-10",
    "includeKPIs": true
  }
}
```

### GET /api/documents/:id
ドキュメント詳細・ダウンロード

---

## AIエージェント

### GET /api/agents
AIエージェント一覧

**Response:**
```json
{
  "agents": [
    {
      "id": "agent_id",
      "name": "経営AI",
      "type": "executive",
      "status": "active",
      "activity": "戦略分析中",
      "lastActive": "2024-11-05T10:30:00Z"
    }
  ]
}
```

### GET /api/agents/:id/status
エージェント状態取得

### POST /api/agents/:id/command
エージェントにコマンド送信

---

## 通知

### GET /api/notifications
通知一覧取得

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_id",
      "type": "task",
      "title": "新しいタスクが割り当てられました",
      "message": "...",
      "read": false,
      "createdAt": "2024-11-05T10:30:00Z"
    }
  ]
}
```

### PUT /api/notifications/:id/read
通知を既読にする

### PUT /api/notifications/read-all
全ての通知を既読にする

---

## 組織可視化

### GET /api/organization/structure
組織構造取得（3層構造）

### GET /api/organization/dataflow
データフロー取得

### GET /api/organization/health
システム健全性取得

---

## データベーススキーマ

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- executive, department, employee
  department VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### AI_Agents
```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- executive, department, integration
  department VARCHAR(50),
  status VARCHAR(50) DEFAULT 'idle', -- active, idle, processing
  last_active TIMESTAMP,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Executive_Directives
```sql
CREATE TABLE executive_directives (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'active', -- active, completed, archived
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, blocked
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
  assigned_to VARCHAR(255),
  department VARCHAR(50),
  due_date DATE,
  progress INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  directive_id UUID REFERENCES executive_directives(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Knowledge_Items
```sql
CREATE TABLE knowledge_items (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  department VARCHAR(50),
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- report, proposal, meeting_notes, manual
  content TEXT,
  file_url TEXT,
  department VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Chat_Messages
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES ai_agents(id),
  role VARCHAR(50) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- task, directive, alert, info
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 実装の優先順位

1. 認証システム（POST /api/auth/login, /logout, /me）
2. ダッシュボードAPI（GET /api/dashboard/stats）
3. AIチャットAPI（POST /api/chat/message）
4. タスク管理API（CRUD）
5. その他の機能API

