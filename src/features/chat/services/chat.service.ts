export interface ApiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string | undefined
  tool_calls?: AssistantToolCall[]
}

export interface AssistantToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export type ChatStreamEvent =
  | { type: 'token'; value: string }
  | { type: 'tool_call'; id: string; name: string; args: unknown; rawCall: AssistantToolCall }

export const ACTION_ITEM_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'create_action_item',
      description: 'Create a new action item in a specific meeting.',
      parameters: {
        type: 'object',
        properties: {
          meeting_id: { type: 'string', description: 'The ID of the meeting to add the action item to.' },
          content: { type: 'string', description: 'The action item description.' },
          assignee: { type: 'string', description: 'Name of the person responsible.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority level.' },
          due_date: { type: 'string', description: 'Due date in ISO 8601 format (YYYY-MM-DD).' },
        },
        required: ['meeting_id', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit_action_item',
      description: 'Edit an existing action item. Find the item ID from the context. Only pass fields that should change.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The action item ID from the context.' },
          content: { type: 'string', description: 'New description.' },
          assignee: { type: 'string', description: 'New assignee name.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          due_date: { type: 'string', description: 'New due date (YYYY-MM-DD) or null to clear.' },
          completed: { type: 'boolean', description: 'Mark as complete or incomplete.' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_action_item',
      description: 'Permanently delete an action item.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The action item ID from the context.' },
        },
        required: ['id'],
      },
    },
  },
]

interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string | null
      tool_calls?: Array<{
        index: number
        id?: string
        type?: string
        function?: { name?: string; arguments?: string }
      }>
    }
    finish_reason: string | null
  }>
}

async function* readSSE(res: Response): AsyncGenerator<string> {
  if (!res.body) throw new Error('Empty response from server')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const raw = decoder.decode(value, { stream: true })
      for (const line of raw.split('\n')) {
        if (line.startsWith('data: ')) yield line.slice(6).trim()
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** Streams completion, yielding text tokens and/or a tool_call event. */
export async function* streamCompletionWithTools(
  messages: ApiMessage[],
  tools?: ToolDefinition[],
): AsyncGenerator<ChatStreamEvent> {
  const body: Record<string, unknown> = {
    model: 'llama-3.3-70b-versatile',
    messages,
    stream: true,
    temperature: 0.3,
    max_tokens: 1024,
  }
  if (tools && tools.length > 0) {
    body['tools'] = tools
    body['tool_choice'] = 'auto'
  }

  const res = await fetch('/api/groq/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Memo failed to respond (${res.status}): ${detail}`)
  }

  // Accumulate tool call fragments across streaming chunks
  const toolCallAccumulator: Record<number, { id: string; name: string; argsStr: string }> = {}

  for await (const data of readSSE(res)) {
    if (data === '[DONE]') break

    let chunk: StreamChunk
    try {
      chunk = JSON.parse(data) as StreamChunk
    } catch {
      continue
    }

    const choice = chunk.choices.at(0)
    if (!choice) continue

    const delta = choice.delta

    if (delta.content) {
      yield { type: 'token', value: delta.content }
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const acc = (toolCallAccumulator[tc.index] ??= { id: '', name: '', argsStr: '' })
        if (tc.id) acc.id = tc.id
        if (tc.function?.name) acc.name += tc.function.name
        if (tc.function?.arguments) acc.argsStr += tc.function.arguments
      }
    }

    if (choice.finish_reason === 'tool_calls') {
      for (const acc of Object.values(toolCallAccumulator)) {
        let args: unknown = {}
        try { args = JSON.parse(acc.argsStr) } catch { /* leave as empty object */ }
        yield {
          type: 'tool_call',
          id: acc.id,
          name: acc.name,
          args,
          rawCall: { id: acc.id, type: 'function', function: { name: acc.name, arguments: acc.argsStr } },
        }
      }
    }
  }
}

/** Legacy: streams only text tokens (no tool support). */
export async function* streamCompletion(messages: ApiMessage[]): AsyncGenerator<string> {
  for await (const event of streamCompletionWithTools(messages)) {
    if (event.type === 'token') yield event.value
  }
}
