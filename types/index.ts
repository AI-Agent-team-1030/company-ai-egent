// ユーザーの役割
export type UserRole = 'executive' | 'department' | 'employee'

// 部門タイプ
export type DepartmentType = 'sales' | 'hr' | 'finance' | 'development' | 'general_affairs' | 'marketing'

// ユーザー情報
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: DepartmentType
  avatar?: string
}

// AIエージェントのタイプ
export type AgentType = 'executive' | 'department' | 'integration'

// AIエージェント
export interface AIAgent {
  id: string
  name: string
  type: AgentType
  department?: DepartmentType
  status: 'active' | 'idle' | 'processing'
  lastActive: Date
}

// タスクのステータス
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

// タスクの優先度
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// タスク
export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo?: string
  department?: DepartmentType
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  progress: number
  aiGenerated: boolean
}

// 経営指示
export interface ExecutiveDirective {
  id: string
  title: string
  content: string
  createdBy: string
  createdAt: Date
  status: 'active' | 'completed' | 'archived'
  relatedTasks: string[]
  kpis: KPI[]
}

// KPI
export interface KPI {
  id: string
  name: string
  target: number
  current: number
  unit: string
  department?: DepartmentType
}

// チャットメッセージ
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agentId?: string
}

// ナレッジアイテム
export interface KnowledgeItem {
  id: string
  title: string
  content: string
  category: string
  department?: DepartmentType
  tags: string[]
  createdAt: Date
  updatedAt: Date
  usageCount: number
  helpful: number
  rating?: number
}

// ドキュメント
export interface Document {
  id: string
  title: string
  description?: string
  type: 'report' | 'proposal' | 'meeting_notes' | 'manual'
  content: string
  createdBy: string
  createdAt: Date
  department?: DepartmentType
  aiGenerated: boolean
  status?: 'published' | 'draft'
}

// 通知
export interface Notification {
  id: string
  type: 'task' | 'directive' | 'alert' | 'info'
  title: string
  message: string
  read: boolean
  createdAt: Date
  link?: string
}

// ダッシュボード統計
export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  activeTasks: number
  totalAgents: number
  activeAgents: number
  pendingDirectives: number
  knowledgeItems: number
}

