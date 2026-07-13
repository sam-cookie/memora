export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response('GROQ_API_KEY not configured', { status: 500 })
  }

  // Forward the raw multipart body preserving the Content-Type boundary
  const contentType = req.headers.get('Content-Type') ?? ''
  const body = await req.arrayBuffer()

  const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': contentType,
    },
    body,
  })

  const text = await groqRes.text()
  return new Response(text, {
    status: groqRes.status,
    headers: { 'Content-Type': 'text/plain' },
  })
}
