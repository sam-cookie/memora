export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response('GROQ_API_KEY not configured', { status: 500 })
  }

  // Accept a signed Supabase Storage URL so the audio file never passes through
  // Vercel as a request body (Edge functions have a 4 MB payload limit).
  // The Edge function fetches the file server-to-server — no payload limit applies.
  const { signedUrl, filename, contentType } = (await req.json()) as {
    signedUrl: string
    filename: string
    contentType: string
  }

  const fileRes = await fetch(signedUrl)
  if (!fileRes.ok) {
    return new Response(`Failed to fetch audio from storage: ${fileRes.status}`, { status: 502 })
  }

  const fileBuffer = await fileRes.arrayBuffer()
  const effectiveType = contentType || fileRes.headers.get('Content-Type') || 'audio/mpeg'
  const fileBlob = new Blob([fileBuffer], { type: effectiveType })

  const form = new FormData()
  form.append('file', fileBlob, filename)
  form.append('model', 'whisper-large-v3')
  form.append('response_format', 'text')

  const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  const text = await groqRes.text()
  return new Response(text, {
    status: groqRes.status,
    headers: { 'Content-Type': 'text/plain' },
  })
}
