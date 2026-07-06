import { useCallback, useRef, useState } from 'react'
import { streamCompletion, type ApiMessage } from '../services/chat.service'
import type { ChatMessage } from '../types'

const MEMO_SYSTEM_PROMPT = `You are Memo, a friendly and knowledgeable AI assistant built into Memora — an AI-powered meeting intelligence platform.

Your role: help users understand their meetings, find specific information, track action items, spot patterns, and get value from their meeting data.

Guidelines:
- Be concise and direct. No filler phrases or unnecessary preamble.
- Reference specific details from the provided context when relevant.
- Use markdown formatting (bold, bullet lists) when it improves readability.
- If something isn't in the provided context, say so clearly rather than guessing.
- Speak in first person as Memo.`

function buildApiMessages(
  contextString: string,
  history: ChatMessage[],
  newContent: string,
): ApiMessage[] {
  const systemContent = `${MEMO_SYSTEM_PROMPT}\n\n---\n\n${contextString}`

  return [
    { role: 'system', content: systemContent },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: newContent },
  ]
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a stable ref so sendMessage doesn't go stale mid-stream
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
      const next = prev.map((m) =>
        m.id === id ? { ...m, content } : m,
      )
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

      let accumulated = ''
      try {
        const apiMessages = buildApiMessages(
          contextString,
          messagesRef.current.filter((m) => m.id !== assistantId),
          userContent.trim(),
        )

        for await (const token of streamCompletion(apiMessages)) {
          accumulated += token
          updateLastAssistant(assistantId, accumulated)
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        updateLastAssistant(
          assistantId,
          `Sorry, I ran into a problem: ${msg}`,
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, addMessage, updateLastAssistant],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    messagesRef.current = []
    setError(null)
  }, [])

  return { messages, isStreaming, error, sendMessage, clearMessages }
}
