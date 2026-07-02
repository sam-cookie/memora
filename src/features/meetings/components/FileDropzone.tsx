import { useRef, useState, useCallback } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { Upload, X, FileAudio, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/utils'

// MIME types → accepted extensions
const ACCEPTED: Record<string, string[]> = {
  'audio/mpeg': ['.mp3'],
  'audio/mp3': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/m4a': ['.m4a'],
  'audio/x-m4a': ['.m4a'],
  'text/plain': ['.txt'],
}

const ACCEPT_ATTR = [...new Set(Object.values(ACCEPTED).flat())].join(',')
// Groq Whisper API hard limit
const MAX_BYTES = 25 * 1024 * 1024

function getFileIcon(file: File) {
  if (file.type === 'text/plain') return FileText
  return FileAudio
}

function validate(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
  const accepted = Object.entries(ACCEPTED).some(
    ([mime, exts]) => file.type === mime || exts.includes(ext),
  )
  if (!accepted) return 'Unsupported file type. Use MP3, WAV, M4A, or TXT.'
  if (file.size > MAX_BYTES) return 'File exceeds the 25 MB limit. Compress the audio or trim it before uploading.'
  return null
}

interface FileDropzoneProps {
  value: File | null
  onChange: (file: File | null) => void
  error?: string
  disabled?: boolean
}

export function FileDropzone({ value, onChange, error, disabled }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file)
      if (err) {
        setValidationError(err)
        return
      }
      setValidationError(null)
      onChange(file)
    },
    [onChange],
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragActive(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [disabled, handleFile],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      // reset so the same file can be re-selected after removal
      e.target.value = ''
    },
    [handleFile],
  )

  const displayError = validationError ?? error

  if (value) {
    const Icon = getFileIcon(value)
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-4">
        <Icon className="h-8 w-8 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.name}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(value.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null)
            setValidationError(null)
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Remove file"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload area"
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled) setDragActive(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/30',
          disabled && 'pointer-events-none opacity-50',
          displayError && 'border-destructive',
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Drop your file here or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">MP3, WAV, M4A, TXT — max 25 MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {displayError && (
        <p className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}
