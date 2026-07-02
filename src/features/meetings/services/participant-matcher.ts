import type { Contact } from '@/types/database'

export interface MatchSuggestion {
  contact: Contact
  /** 0–1, higher is better */
  score: number
}

export interface ParticipantMatch {
  detectedName: string
  /** Top suggestions sorted descending by score, only those >= 0.3 */
  suggestions: MatchSuggestion[]
  /** The top suggestion if its score is >= 0.85 (auto-preselect threshold) */
  autoMatch: Contact | null
}

function tokenize(s: string): string[] {
  return s.toLowerCase().trim().split(/\s+/).filter(Boolean)
}

function scoreName(detected: string, contact: Contact): number {
  const d = detected.toLowerCase().trim()
  const n = contact.name.toLowerCase().trim()

  if (d === n) return 1.0
  if (d.includes(n) || n.includes(d)) return 0.85

  const dTokens = tokenize(detected)
  const nTokens = tokenize(contact.name)

  // All tokens of detected name appear verbatim in contact name tokens
  const allExact = dTokens.every((dt) => nTokens.includes(dt))
  if (allExact && dTokens.length > 1) return 0.8

  // Any single token exact cross-match (e.g. shared last name)
  const anyExact = dTokens.some((dt) => nTokens.includes(dt))
  if (anyExact) return 0.6

  // Any token is a prefix of another (handles abbreviations: "Mike" ↔ "Michael")
  const anyPrefix = dTokens.some((dt) =>
    nTokens.some((nt) => nt.startsWith(dt) || dt.startsWith(nt)),
  )
  if (anyPrefix) return 0.45

  return 0
}

/**
 * Match each detected name against the workspace contact list.
 * Returns one result per name, with suggestions sorted by confidence.
 */
export function matchParticipants(names: string[], contacts: Contact[]): ParticipantMatch[] {
  const activeContacts = contacts.filter((c) => !c.archived)

  return names.map((name) => {
    const suggestions: MatchSuggestion[] = activeContacts
      .map((contact) => ({ contact, score: scoreName(name, contact) }))
      .filter((s) => s.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4) // max 4 candidates shown

    const top = suggestions[0]
    const autoMatch = top && top.score >= 0.85 ? top.contact : null

    return { detectedName: name, suggestions, autoMatch }
  })
}
