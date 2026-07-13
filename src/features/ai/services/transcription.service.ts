/** Transcribes a meeting file. Text files are read directly; audio is sent to Groq via a server proxy using a short-lived Supabase Storage signed URL. */
export const transcriptionService = {
  async transcribe(file: File, signedUrl: string): Promise<string> {
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      return file.text()
    }

    const res = await fetch('/api/groq/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedUrl, filename: file.name, contentType: file.type }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText)
      throw new Error(`Transcription failed (${res.status}): ${detail}`)
    }

    return res.text()
  },
}
