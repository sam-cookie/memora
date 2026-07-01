import { useState, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { X, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParticipantInputProps {
  value: string[]
  onChange: (participants: string[]) => void
  disabled?: boolean
}

export function ParticipantInput({ value, onChange, disabled }: ParticipantInputProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function add(raw: string) {
    const name = raw.trim()
    if (!name || value.some((p) => p.toLowerCase() === name.toLowerCase())) return
    onChange([...value, name])
    setDraft('')
  }

  function remove(name: string) {
    onChange(value.filter((p) => p !== name))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    }
    // Backspace on empty input removes the last chip
    if (e.key === 'Backspace' && !draft && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div
      role="group"
      aria-label="Participants"
      onClick={() => inputRef.current?.focus()}
      className={cn(
        'flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {/* Chips */}
      {value.map((name) => (
        <span
          key={name}
          className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          {name}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(name) }}
            aria-label={`Remove ${name}`}
            className="ml-0.5 rounded-full text-primary/60 hover:text-primary transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {/* Ghost input */}
      <div className="flex flex-1 items-center gap-1.5 min-w-[140px]">
        {value.length === 0 && (
          <UserPlus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? 'Type a name, press Enter to add' : 'Add another…'}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          aria-label="Add participant"
        />
      </div>
    </div>
  )
}
