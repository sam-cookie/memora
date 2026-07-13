import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Settings, Camera, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/common/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { generateInitials } from '@/lib/utils'
import { useUpdateProfile } from '../hooks/useUpdateProfile'
import { validateAvatarFile } from '../services/profile.service'

// ─── Avatar uploader ──────────────────────────────────────────────────────────

interface AvatarUploadProps {
  currentUrl?: string
  preview: string | null
  displayName: string
  onFileSelect: (file: File) => void
}

function AvatarUpload({ currentUrl, preview, displayName, onFileSelect }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const src = preview ?? currentUrl
  const initials = displayName ? generateInitials(displayName) : '?'

  return (
    <div className="relative group w-20 h-20 shrink-0">
      <Avatar className="h-20 w-20 ring-2 ring-border">
        <AvatarImage src={src} alt="Profile photo" />
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
        aria-label="Change profile photo"
      >
        <Camera className="h-5 w-5 text-white" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
          // Reset so the same file can be re-selected
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user } = useAuth()
  const currentAvatarUrl = user?.user_metadata?.['avatar_url'] as string | undefined
  const serverFullName = (user?.user_metadata?.['full_name'] as string | undefined) ?? ''

  const [fullName, setFullName] = useState(serverFullName)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { mutate: updateProfile, isPending, error } = useUpdateProfile()

  // Sync name if the user object loads after initial render (e.g. page refresh)
  useEffect(() => {
    setFullName((user?.user_metadata?.['full_name'] as string | undefined) ?? '')
  }, [user?.id])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAvatarSelect(file: File) {
    const validationError = validateAvatarFile(file)
    if (validationError) {
      setFileError(validationError)
      return
    }
    setFileError(null)
    setAvatarFile(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
    setSaved(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateProfile(
      { fullName, ...(avatarFile ? { avatarFile } : {}) },
      {
        onSuccess: () => {
          setSaved(true)
          setAvatarFile(null)
          setTimeout(() => setSaved(false), 3000)
        },
      },
    )
  }

  const isDirty = fullName !== serverFullName || avatarFile !== null

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
        icon={Settings}
      />

      <div className="p-6 max-w-lg space-y-6">
        <Card className="overflow-hidden">
          <div className="px-6 py-5 border-b border-border/50">
            <h2 className="text-sm font-semibold">Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your display name and profile photo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <AvatarUpload
                {...(currentAvatarUrl !== undefined ? { currentUrl: currentAvatarUrl } : {})}
                preview={avatarPreview}
                displayName={fullName || user?.email || ''}
                onFileSelect={handleAvatarSelect}
              />
              <div>
                <p className="text-sm font-medium text-foreground">Profile photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  JPG, PNG or WebP · max 5 MB
                </p>
                {fileError && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {fileError}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setSaved(false)
                }}
                placeholder="Your name"
                maxLength={100}
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                value={user?.email ?? ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here.
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error instanceof Error ? error.message : 'Something went wrong.'}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={isPending || !isDirty}>
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>

              {saved && (
                <span
                  className="flex items-center gap-1.5 text-sm text-emerald-500"
                  role="status"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
