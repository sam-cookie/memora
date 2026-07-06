const GROQ_BASE = 'https://api.groq.com/openai/v1'

export interface ApiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface StreamChunk {
  choices: Array<{ delta: { content?: string } }>
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set')
  return key
}

/** Streams a chat completion from Groq, yielding tokens as they arrive. */
export async function* streamCompletion(
  messages: ApiMessage[],
): AsyncGenerator<string> {
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Memo failed to respond (${res.status}): ${detail}`)
  }

  if (!res.body) throw new Error('Empty response from server')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const raw = decoder.decode(value, { stream: true })
      for (const line of raw.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return

        try {
          const chunk = JSON.parse(data) as StreamChunk
          const token = chunk.choices.at(0)?.delta?.content
          if (token) yield token
        } catch {
          // Malformed SSE chunk — skip
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
