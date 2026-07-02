/** A participant linked to a workspace contact directory entry. */
export interface LinkedParticipant {
  type: 'contact'
  contactId: string
  name: string
}

/** A free-text participant name not tied to a contact record. */
export interface FreeTextParticipant {
  type: 'text'
  name: string
}

/**
 * Discriminated union representing a participant in the new-meeting form.
 * - 'contact' → persisted to meeting_contacts junction table
 * - 'text'    → stored only in meetings.participants text array
 */
export type ParticipantEntry = LinkedParticipant | FreeTextParticipant
