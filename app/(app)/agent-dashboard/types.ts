/**
 * Agent Dashboard 型定義
 */

import type { AgentTool } from '@/lib/types/agent'

export interface AgentPlan {
  name: string
  role: string
  systemPrompt: string
  tools: AgentTool[]
  dependsOn: string[]
  priority: number
}

export interface OrchestrationPlan {
  taskAnalysis: string
  complexity: 'simple' | 'moderate' | 'complex'
  agents: AgentPlan[]
  synthesisPrompt: string
}

export interface AgentExecution {
  id: string
  agentName: string
  agentRole: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  currentStep: string | null
  result: string | null
  citations: AgentCitation[]
  toolResults: ToolExecutionResult[]
  startedAt: Date | null
  completedAt: Date | null
  error: string | null
}

export interface AgentCitation {
  title: string
  uri: string
  text: string
  source: 'knowledge' | 'drive' | 'web'
}

export interface ToolExecutionResult {
  tool: AgentTool
  query: string
  results: unknown
  executedAt: Date
}

export type ExecutionPhase =
  | 'idle'
  | 'analyzing'
  | 'executing'
  | 'synthesizing'
  | 'complete'
