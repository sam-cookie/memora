import type { AssistantToolCall } from './services/chat.service'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: Date
  /** Set on assistant messages that triggered a tool call */
  toolCalls?: AssistantToolCall[]
  /** Set on tool result messages */
  toolCallId?: string
  /** True while a tool is actively executing (show spinner) */
  loading?: boolean
}
