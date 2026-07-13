/** Transcribes a meeting file. Audio files use Groq Whisper via server proxy; text files are read directly. */
export const transcriptionService = {
  async transcribe(file: File): Promise<string> {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return file.text()
    }

    const body = new FormData()
    body.append('file', file)
    body.append('model', 'whisper-large-v3')
    body.append('response_format', 'text')

    const res = await fetch('/api/groq/transcribe', {
      method: 'POST',
      body,
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText)
      throw new Error(`Transcription failed (${res.status}): ${detail}`)
    }

    return res.text()
  },
}
