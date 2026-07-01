import type { ActionItemPriority, RiskSeverity } from '@/types/database'

export interface ActionItemAI {
  content: string
  assignee: string | null
  priority: ActionItemPriority
}

export interface DecisionAI {
  content: string
  context: string | null
}

export interface RiskAI {
  content: string
  severity: RiskSeverity
}

export interface MeetingAnalysis {
  summary: string
  keyPoints: string[]
  actionItems: ActionItemAI[]
  decisions: DecisionAI[]
  risks: RiskAI[]
  followUpQuestions: string[]
  participants: string[]
}
