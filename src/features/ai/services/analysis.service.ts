import type { MeetingAnalysis } from '../types'

const GROQ_BASE = 'https://api.groq.com/openai/v1'

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set')
  return key
}

const SYSTEM_PROMPT = `You are an expert meeting analyst. Analyze the meeting transcript and respond ONLY with a valid JSON object matching this exact structure — no extra text, no markdown fences:

{
  "summary": "2–4 sentence overview of what was discussed and decided",
  "keyPoints": ["string"],
  "actionItems": [
    { "content": "string", "assignee": "string or null", "priority": "low|medium|high|critical" }
  ],
  "decisions": [
    { "content": "string", "context": "string or null" }
  ],
  "risks": [
    { "content": "string", "severity": "low|medium|high|critical" }
  ],
  "followUpQuestions": ["string"],
  "participants": ["string"]
}

Rules:
- Return empty arrays when a field has no relevant content.
- Never fabricate information not present in the transcript.
- assignee and context must be null (not omitted) when unknown.`

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/** Analyzes a meeting transcript using Groq and returns structured data. */
export const analysisService = {
  async analyze(transcript: string): Promise<MeetingAnalysis> {
    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this meeting transcript:\n\n${transcript}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText)
      throw new Error(`Analysis failed (${res.status}): ${detail}`)
    }

    const data = (await res.json()) as ChatCompletionResponse
    const text = data.choices?.[0]?.message?.content

    if (!text) throw new Error('Unexpected response shape from Groq')

    return JSON.parse(text) as MeetingAnalysis
  },
}
