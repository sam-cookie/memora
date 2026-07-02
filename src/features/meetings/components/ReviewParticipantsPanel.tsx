import { useState, useMemo } from 'react'
import { UserCheck, X, ChevronDown, Plus, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { matchParticipants } from '../services/participant-matcher'
import { useContacts, useCreateContact } from '@/features/participants/hooks/useParticipants'
import { useSetMeetingContacts } from '../hooks/useMeetingDetail'
import type { Contact, MeetingContactWithContact } from '@/types/database'

// ─── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.9) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        Exact
      </span>
    )
  }
  if (score >= 0.7) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        Good
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">
      Partial
    </span>
  )
}

// ─── Contact picker dropdown ───────────────────────────────────────────────────

interface ContactPickerProps {
  suggestions: { contact: Contact; score: number }[]
  allContacts: Contact[]
  selected: string | null // contactId | null
  onChange: (contactId: string | null) => void
  detectedName: string
  onCreateNew: () => void
  isCreating: boolean
}

function ContactPicker({
  suggestions,
  allContacts,
  selected,
  onChange,
  detectedName,
  onCreateNew,
  isCreating,
}: ContactPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedContact = selected ? allContacts.find((c) => c.id === selected) : null

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return allContacts.filter((c) => !c.archived)
    return allContacts.filter(
      (c) => !c.archived && (c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)),
    )
  }, [allContacts, search])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors w-full text-left',
          selected
            ? 'border-primary/40 bg-primary/5 text-foreground'
            : 'border-border bg-background text-muted-foreground',
        )}
      >
        {selectedContact ? (
          <>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {selectedContact.name.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 truncate font-medium text-foreground">{selectedContact.name}</span>
          </>
        ) : (
          <span className="flex-1 truncate italic">No match — skip</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {/* None option */}
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors italic text-muted-foreground',
                !selected && 'bg-accent/50',
              )}
              onClick={() => { onChange(null); setOpen(false); setSearch('') }}
            >
              Skip this name
            </button>

            {/* Suggested matches first */}
            {suggestions.length > 0 && !search && (
              <>
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">
                  Suggested
                </p>
                {suggestions.map(({ contact, score }) => (
                  <button
                    key={contact.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors',
                      selected === contact.id && 'bg-accent',
                    )}
                    onClick={() => { onChange(contact.id); setOpen(false); setSearch('') }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{contact.name}</span>
                    <ConfidenceBadge score={score} />
                  </button>
                ))}
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">
                  All contacts
                </p>
              </>
            )}

            {filteredContacts.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground italic">No contacts found</p>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors',
                    selected === contact.id && 'bg-accent',
                  )}
                  onClick={() => { onChange(contact.id); setOpen(false); setSearch('') }}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{contact.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Create new */}
          <div className="border-t border-border p-1">
            <button
              type="button"
              disabled={isCreating}
              onClick={() => { onCreateNew(); setOpen(false); setSearch('') }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent transition-colors text-primary"
            >
              {isCreating
                ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                : <Plus className="h-3.5 w-3.5 shrink-0" />}
              Create &ldquo;{detectedName}&rdquo; as new contact
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Panel ─────────────────────────────────────────────────────────────────────

interface ReviewParticipantsPanelProps {
  meetingId: string
  /** All names in meeting.participants (AI-detected + user-provided) */
  allParticipantNames: string[]
  /** Already-linked contacts so we can exclude them from review */
  linkedContacts: MeetingContactWithContact[]
  onDismiss: () => void
}

export function ReviewParticipantsPanel({
  meetingId,
  allParticipantNames,
  linkedContacts,
  onDismiss,
}: ReviewParticipantsPanelProps) {
  const { data: contacts = [] } = useContacts({ includeArchived: false })
  const createContact = useCreateContact()
  const setMeetingContacts = useSetMeetingContacts(meetingId)

  // Names that are not yet linked to any contact
  const linkedNames = new Set(linkedContacts.map((lc) => lc.contact.name.toLowerCase()))
  const unlinkedNames = allParticipantNames.filter((n) => !linkedNames.has(n.toLowerCase()))

  const matches = useMemo(
    () => matchParticipants(unlinkedNames, contacts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unlinkedNames.join(','), contacts],
  )

  // selectedContactId per detected name (null = skip)
  const [selections, setSelections] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {}
    for (const m of matches) {
      init[m.detectedName] = m.autoMatch?.id ?? null
    }
    return init
  })

  const [creatingFor, setCreatingFor] = useState<string | null>(null)

  if (unlinkedNames.length === 0) return null

  const handleCreateNew = async (name: string) => {
    setCreatingFor(name)
    try {
      const contact = await createContact.mutateAsync({ name })
      setSelections((prev) => ({ ...prev, [name]: contact.id }))
    } finally {
      setCreatingFor(null)
    }
  }

  const handleSave = async () => {
    const newContactIds = Object.values(selections).filter((id): id is string => id !== null)
    const existingIds = linkedContacts.map((lc) => lc.contact_id)
    await setMeetingContacts.mutateAsync([...existingIds, ...newContactIds])
    onDismiss()
  }

  const linkedCount = Object.values(selections).filter(Boolean).length

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/10">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Review detected participants</h2>
            <p className="text-xs text-muted-foreground">
              AI detected {unlinkedNames.length} name{unlinkedNames.length !== 1 ? 's' : ''}. Link them to your contact directory.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/60">
        {matches.map((match) => (
          <div key={match.detectedName} className="flex items-center gap-4 px-6 py-3">
            {/* Detected name */}
            <div className="w-36 shrink-0">
              <p className="text-sm font-medium text-foreground truncate">{match.detectedName}</p>
              <p className="text-[11px] text-muted-foreground">AI detected</p>
            </div>

            {/* Arrow */}
            <span className="text-muted-foreground/40 shrink-0">→</span>

            {/* Contact picker */}
            <div className="flex-1 min-w-0">
              <ContactPicker
                suggestions={match.suggestions}
                allContacts={contacts}
                selected={selections[match.detectedName] ?? null}
                onChange={(id) => setSelections((prev) => ({ ...prev, [match.detectedName]: id }))}
                detectedName={match.detectedName}
                onCreateNew={() => void handleCreateNew(match.detectedName)}
                isCreating={creatingFor === match.detectedName}
              />
            </div>

            {/* Top match confidence (if any) */}
            {match.suggestions[0] && (
              <div className="shrink-0">
                <ConfidenceBadge score={match.suggestions[0].score} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-primary/10 bg-primary/5">
        <p className="text-xs text-muted-foreground">
          {linkedCount} of {unlinkedNames.length} linked
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
            Skip for now
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={setMeetingContacts.isPending || linkedCount === 0}
          >
            {setMeetingContacts.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
            ) : (
              <><UserCheck className="h-3.5 w-3.5 mr-1.5" />Save {linkedCount > 0 ? `${linkedCount} ` : ''}link{linkedCount !== 1 ? 's' : ''}</>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
