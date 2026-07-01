const GROQ_BASE = 'https://api.groq.com/openai/v1'

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set')
  return key
}

/** Transcribes a meeting file. Audio files use Groq Whisper; text files are read directly. */
export const transcriptionService = {
  async transcribe(file: File): Promise<string> {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return file.text()
    }

    const body = new FormData()
    body.append('file', file)
    body.append('model', 'whisper-large-v3')
    body.append('response_format', 'text')

    const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getApiKey()}` },
      body,
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText)
      throw new Error(`Transcription failed (${res.status}): ${detail}`)
    }

    return res.text()
  },
}
