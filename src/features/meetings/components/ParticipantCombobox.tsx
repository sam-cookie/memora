import { useState, useRef, useEffect, useCallback, useId } from 'react'
import type { KeyboardEvent } from 'react'
import { X, UserPlus, Plus, Loader2, Building2, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContacts, useCreateContact } from '@/features/participants/hooks/useParticipants'
import type { Contact } from '@/types/database'
import type { ParticipantEntry } from '../types'

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

function scoreContact(query: string, contact: Contact): number {
  const q = query.toLowerCase()
  const fields = [contact.name, contact.email ?? '', contact.company ?? '']
  let best = 0
  for (const f of fields) {
    const t = f.toLowerCase()
    if (t === q) { best = 3; break }
    if (t.startsWith(q)) best = Math.max(best, 2)
    else if (t.includes(q)) best = Math.max(best, 1)
  }
  return best
}

function getSuggestions(query: string, contacts: Contact[], selected: ParticipantEntry[]): Contact[] {
  const selectedNames = new Set(selected.map((p) => p.name.toLowerCase()))
  const available = contacts.filter((c) => !c.archived && !selectedNames.has(c.name.toLowerCase()))
  if (!query.trim()) return available.slice(0, 8)

  return available
    .map((c) => ({ c, score: scoreContact(query, c) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ParticipantComboboxProps {
  value: ParticipantEntry[]
  onChange: (participants: ParticipantEntry[]) => void
  disabled?: boolean
}

export function ParticipantCombobox({ value, onChange, disabled }: ParticipantComboboxProps) {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: contacts = [] } = useContacts({ includeArchived: false })
  const createContact = useCreateContact()

  const suggestions = getSuggestions(query, contacts, value)
  const trimmed = query.trim()

  const exactMatch = contacts.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
  const showCreate = trimmed.length > 0 && !exactMatch

  const optionCount = suggestions.length + (showCreate ? 1 : 0)
  const createIndex = suggestions.length

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Reset activeIndex when suggestions change
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const addEntry = useCallback(
    (entry: ParticipantEntry) => {
      if (value.some((p) => p.name.toLowerCase() === entry.name.toLowerCase())) return
      onChange([...value, entry])
    },
    [value, onChange],
  )

  const remove = useCallback(
    (name: string) => onChange(value.filter((p) => p.name !== name)),
    [value, onChange],
  )

  const selectContact = useCallback(
    (contact: Contact) => {
      addEntry({ type: 'contact', contactId: contact.id, name: contact.name })
      setQuery('')
      setActiveIndex(0)
      inputRef.current?.focus()
    },
    [addEntry],
  )

  const handleCreate = useCallback(async () => {
    if (!trimmed) return
    setQuery('')
    setActiveIndex(0)
    inputRef.current?.focus()
    try {
      const contact = await createContact.mutateAsync({ name: trimmed })
      addEntry({ type: 'contact', contactId: contact.id, name: contact.name })
    } catch {
      // Fallback: add as free text if contact creation fails
      addEntry({ type: 'text', name: trimmed })
    }
  }, [trimmed, addEntry, createContact])

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % optionCount)
        break

      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + optionCount) % optionCount)
        break

      case 'Enter':
      case ',':
        e.preventDefault()
        if (open && optionCount > 0) {
          if (activeIndex === createIndex && showCreate) {
            void handleCreate()
          } else if (suggestions[activeIndex]) {
            selectContact(suggestions[activeIndex])
          }
        } else if (trimmed) {
          addEntry({ type: 'text', name: trimmed })
          setQuery('')
        }
        break

      case 'Escape':
        setOpen(false)
        setQuery('')
        break

      case 'Backspace':
        if (!query && value.length > 0) {
          const last = value[value.length - 1]
          if (last) remove(last.name)
        }
        break
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={containerRef} className="relative">
      {/* Input area */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-owns={listboxId}
        onClick={() => { inputRef.current?.focus(); setOpen(true) }}
        className={cn(
          'flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 transition-colors cursor-text',
          'focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {/* Selected chips */}
        {value.map((entry) => (
          <span
            key={entry.name}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
              entry.type === 'contact'
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-border bg-muted text-muted-foreground',
            )}
          >
            {entry.type === 'contact' && (
              <Link2 className="h-2.5 w-2.5 shrink-0 opacity-60" />
            )}
            {entry.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(entry.name) }}
              aria-label={`Remove ${entry.name}`}
              className={cn(
                'ml-0.5 rounded-full transition-colors',
                entry.type === 'contact'
                  ? 'text-primary/60 hover:text-primary'
                  : 'text-muted-foreground/60 hover:text-foreground',
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <div className="flex flex-1 items-center gap-1.5 min-w-[160px]">
          {value.length === 0 && !query && (
            <UserPlus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          )}
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={
              open && optionCount > 0 ? `${listboxId}-opt-${activeIndex}` : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? 'Search or add participants…' : 'Add more…'}
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            aria-label="Search participants"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Dropdown */}
      {open && optionCount > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Participant suggestions"
          className={cn(
            'absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg',
            'max-h-60 overflow-y-auto py-1',
          )}
        >
          {suggestions.map((contact, i) => (
            <li
              key={contact.id}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onPointerDown={(e) => { e.preventDefault(); selectContact(contact) }}
              onPointerEnter={() => setActiveIndex(i)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 cursor-pointer select-none transition-colors',
                i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              )}
            >
              {/* Avatar initial */}
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold shrink-0">
                {contact.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">{contact.name}</p>
                {(contact.email ?? contact.company) && (
                  <p className="text-[11px] text-muted-foreground truncate leading-tight flex items-center gap-1">
                    {contact.company && (
                      <>
                        <Building2 className="h-2.5 w-2.5 shrink-0" />
                        {contact.company}
                        {contact.email && ' · '}
                      </>
                    )}
                    {contact.email}
                  </p>
                )}
              </div>
            </li>
          ))}

          {/* Create option */}
          {showCreate && (
            <li
              id={`${listboxId}-opt-${createIndex}`}
              role="option"
              aria-selected={activeIndex === createIndex}
              onPointerDown={(e) => { e.preventDefault(); void handleCreate() }}
              onPointerEnter={() => setActiveIndex(createIndex)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 cursor-pointer select-none transition-colors border-t border-border mt-1 pt-2',
                activeIndex === createIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
              )}
            >
              {createContact.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-full border border-dashed border-primary/40 flex items-center justify-center shrink-0">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <span className="text-sm">
                Add{' '}
                <span className="font-semibold">&ldquo;{trimmed}&rdquo;</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                  · save to directory
                </span>
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
