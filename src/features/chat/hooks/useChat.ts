import { useCallback, useRef, useState } from 'react'
import {
  streamCompletionWithTools,
  ACTION_ITEM_TOOLS,
  type ApiMessage,
  type ToolDefinition,
  type AssistantToolCall,
} from '../services/chat.service'
import type { ToolHandlers } from './useActionItemTools'
import type { ChatMessage } from '../types'

const MEMO_SYSTEM_PROMPT = `You are Memo, an AI assistant built into Memora — an AI-powered meeting intelligence platform.

Your role: help users understand their meetings, find specific information, track action items, spot patterns, and get value from their meeting data.

CRITICAL RULES — never break these:
- NEVER invent, fabricate, or estimate any meeting names, dates, action items, decisions, participants, statistics, or counts. If the data is not in the context block, it does not exist as far as you are concerned.
- Only answer from what is in the context. If a specific detail is genuinely missing, say so naturally — e.g. "I don't have visibility into that" or "That's not something I can see right now." Never use technical phrases like "data is not loaded". Keep responses conversational.
- Do not speculate or offer plausible-sounding guesses. Silence is better than fiction.

Tool use rules:
- When the user asks you to add, edit, assign, reassign, change priority, or mark complete an action item, use the appropriate tool immediately.
- When the user asks you to delete an action item, always ask for confirmation first (e.g. "Are you sure you want to delete '[item]'? This can't be undone."). Only call delete_action_item after the user explicitly confirms (e.g. "yes", "go ahead", "confirm", "delete it").
- Always find the action item ID from the context before calling edit_action_item or delete_action_item.
- If you cannot find the ID in the context, ask the user to clarify which item they mean before calling any tool.
- Never call a tool for an item that is not listed in the context.
- For create_action_item, use the meeting_id from the context. If in a specific meeting, use that meeting's ID. If on the dashboard, use the meeting_id shown next to the action item or from the recent meetings list.

Style guidelines:
- Be concise and direct. No filler phrases or unnecessary preamble.
- Reference specific details from the provided context when relevant.
- Use markdown formatting (bold, bullet lists) when it improves readability.
- Speak in first person as Memo.`

function buildApiMessages(
  contextString: string,
  history: ChatMessage[],
  newContent: string,
): ApiMessage[] {
  const systemContent = `${MEMO_SYSTEM_PROMPT}\n\n---\n\n${contextString}`

  return [
    { role: 'system', content: systemContent },
    ...history.map((m): ApiMessage => {
      if (m.role === 'tool') {
        return { role: 'tool', content: m.content, tool_call_id: m.toolCallId }
      }
      if (m.role === 'assistant' && m.toolCalls) {
        return { role: 'assistant', content: null, tool_calls: m.toolCalls }
      }
      return { role: m.role as 'user' | 'assistant', content: m.content }
    }),
    { role: 'user', content: newContent },
  ]
}


export function useChat(toolHandlers?: ToolHandlers) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesRef = useRef<ChatMessage[]>([])

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, msg]
      messagesRef.current = next
      return next
    })
  }, [])

  const updateLastAssistant = useCallback((id: string, content: string) => {
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, content } : m))
      messagesRef.current = next
      return next
    })
  }, [])

  const addToolCallToHistory = useCallback((id: string, toolCalls: AssistantToolCall[]) => {
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, toolCalls } : m))
      messagesRef.current = next
      return next
    })
  }, [])

  const setMessageLoading = useCallback((id: string, loading: boolean) => {
    setMessages((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, loading } : m))
      messagesRef.current = next
      return next
    })
  }, [])

  const sendMessage = useCallback(
    async (userContent: string, contextString: string) => {
      if (!userContent.trim() || isStreaming) return

      setError(null)

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userContent.trim(),
        timestamp: new Date(),
      }
      addMessage(userMsg)

      const assistantId = crypto.randomUUID()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
      addMessage(assistantMsg)
      setIsStreaming(true)

      const tools: ToolDefinition[] = toolHandlers ? ACTION_ITEM_TOOLS : []

      try {
        const apiMessages = buildApiMessages(
          contextString,
          messagesRef.current.filter((m) => m.id !== assistantId),
          userContent.trim(),
        )

        let accumulated = ''

        for await (const event of streamCompletionWithTools(apiMessages, tools)) {
          if (event.type === 'token') {
            accumulated += event.value
            updateLastAssistant(assistantId, accumulated)
          } else if (event.type === 'tool_call' && toolHandlers) {
            const handler = toolHandlers[event.name]
            if (!handler) continue

            // Show loading label + spinner while executing
            updateLastAssistant(assistantId, handler.loadingLabel)
            setMessageLoading(assistantId, true)

            // Record the assistant's tool_calls on the message for history reconstruction
            addToolCallToHistory(assistantId, [event.rawCall])

            // Execute the tool
            let toolResult: string
            try {
              toolResult = await handler.execute(event.args)
            } catch (err) {
              toolResult = `Error: ${err instanceof Error ? err.message : 'Tool call failed'}`
            } finally {
              setMessageLoading(assistantId, false)
            }

            // Append a tool result message to history for context continuity
            const toolMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'tool',
              content: toolResult,
              toolCallId: event.id,
              timestamp: new Date(),
            }
            addMessage(toolMsg)

            // Show confirmation instantly — no second Groq round-trip needed
            updateLastAssistant(assistantId, toolResult)
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        updateLastAssistant(assistantId, `Sorry, I ran into a problem: ${msg}`)
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, toolHandlers, addMessage, updateLastAssistant, addToolCallToHistory, setMessageLoading],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    messagesRef.current = []
    setError(null)
  }, [])

  return { messages, isStreaming, error, sendMessage, clearMessages }
}
