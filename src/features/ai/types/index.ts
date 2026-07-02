import type { ActionItemPriority, RiskSeverity } from '@/types/database'

export type MeetingOverallStatus = 'on-track' | 'at-risk' | 'blocked'
export type Confidence = 'high' | 'medium' | 'low'
export type ActionStatus = 'not-started' | 'in-progress' | 'completed'
export type Likelihood = 'low' | 'medium' | 'high'
export type InsightType =
  | 'missing-owner'
  | 'missing-deadline'
  | 'repeated-concern'
  | 'project-risk'
  | 'unresolved-item'
  | 'follow-up-needed'
  | 'discussion-distribution'

export interface ExecutiveSummary {
  objective: string
  keyOutcome: string
  status: MeetingOverallStatus
  paragraph: string
}

export interface DiscussionTopic {
  topic: string
  points: string[]
}

export interface ActionItemAI {
  content: string
  assignee: string | null
  priority: ActionItemPriority
  dueDate: string | null
  status: ActionStatus
  confidence: Confidence
}

export interface DecisionAI {
  content: string
  context: string | null
  impact: string | null
  confidence: Confidence
}

export interface RiskAI {
  content: string
  severity: RiskSeverity
  impact: string | null
  likelihood: Likelihood
  mitigation: string | null
}

export interface AIInsight {
  type: InsightType
  content: string
}

export interface TimelineEvent {
  moment: string
  description: string
}

export interface MeetingAnalysis {
  executiveSummary: ExecutiveSummary
  discussionTopics: DiscussionTopic[]
  keyPoints: string[]
  actionItems: ActionItemAI[]
  decisions: DecisionAI[]
  risks: RiskAI[]
  openQuestions: string[]
  participants: string[]
  aiInsights: AIInsight[]
  timeline: TimelineEvent[]
}
