export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return new Response('GROQ_API_KEY not configured', { status: 500 })
  }

  const body = await req.text()

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  // Pass the body through as-is — works for both streaming SSE and regular JSON responses
  return new Response(groqRes.body, {
    status: groqRes.status,
    headers: {
      'Content-Type': groqRes.headers.get('Content-Type') ?? 'application/json',
    },
  })
}
