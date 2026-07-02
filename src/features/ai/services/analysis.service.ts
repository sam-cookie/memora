import type { MeetingAnalysis } from '../types'

const GROQ_BASE = 'https://api.groq.com/openai/v1'

function getApiKey(): string {
  const key = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set')
  return key
}

const SYSTEM_PROMPT = `You are a senior project manager and expert meeting facilitator. Analyze the meeting transcript and extract structured intelligence that will be immediately useful to stakeholders and team leads.

Return ONLY a valid JSON object matching this exact schema — no markdown fences, no explanation, no extra text:

{
  "executiveSummary": {
    "objective": "1–2 sentence description of the meeting's primary purpose",
    "keyOutcome": "1–2 sentences on the main result, conclusion, or direction set",
    "status": "on-track | at-risk | blocked",
    "paragraph": "3–5 sentence executive-grade summary in professional business language covering what was discussed, what was decided, and what happens next. No filler phrases."
  },
  "discussionTopics": [
    {
      "topic": "Topic heading (2–5 words)",
      "points": ["Specific concrete point discussed under this topic"]
    }
  ],
  "keyPoints": ["High-level takeaway suitable for a 30-second briefing"],
  "actionItems": [
    {
      "content": "Specific actionable task in imperative form (e.g. 'Implement OAuth token refresh')",
      "assignee": "Full name if explicitly assigned, null if unidentified",
      "priority": "low | medium | high | critical",
      "dueDate": "YYYY-MM-DD if a date was mentioned, null otherwise",
      "status": "not-started | in-progress | completed",
      "confidence": "high | medium | low"
    }
  ],
  "decisions": [
    {
      "content": "The specific finalized decision (not a proposal or tentative idea)",
      "context": "The reason or background that drove this decision, null if not discussed",
      "impact": "Expected consequence or effect on the project or team, null if not mentioned",
      "confidence": "high | medium | low"
    }
  ],
  "risks": [
    {
      "content": "Brief precise description of the risk or blocker",
      "severity": "low | medium | high | critical",
      "impact": "What happens if this risk materializes, null if not discussed",
      "likelihood": "low | medium | high",
      "mitigation": "Mitigation strategy discussed or strongly implied, null if none"
    }
  ],
  "openQuestions": ["Questions explicitly raised in the meeting that were NOT answered during the meeting"],
  "participants": ["Full name of each identified speaker or attendee"],
  "aiInsights": [
    {
      "type": "missing-owner | missing-deadline | repeated-concern | project-risk | unresolved-item | follow-up-needed | discussion-distribution",
      "content": "Specific actionable observation (not generic). Example: '3 action items have no assigned owner' not 'Some items lack owners'"
    }
  ],
  "timeline": [
    {
      "moment": "Topic or event label (2–5 words)",
      "description": "One sentence describing what happened at this point in the meeting"
    }
  ]
}

Classification rules:
- status "blocked": a critical blocker is actively preventing forward progress
- status "at-risk": issues exist that threaten timelines or quality but work continues
- status "on-track": meeting concluded normally with clear, achievable next steps

Extraction rules:
- decisions: only finalized agreements — not proposals, ideas, or "we should consider" statements
- openQuestions: only questions that received no resolution in the transcript
- aiInsights: generate 3–6 specific, targeted observations. Prefer concrete specificity over vague generality.
- timeline: 4–8 key moments in chronological order extracted from the transcript
- confidence "high": both person and task are unambiguously explicit
- confidence "medium": task is clear but owner is inferred from context
- confidence "low": both owner and task scope are inferred

Quality rules:
- Never fabricate details absent from the transcript
- Use professional business language throughout
- Every null field must be explicit null, never omitted
- Return [] for arrays with no content
- Avoid repeating the same information across sections
- Write action items in imperative form starting with a verb`

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
