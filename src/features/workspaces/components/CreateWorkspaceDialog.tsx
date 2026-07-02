import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { WORKSPACE_COLORS, type WorkspaceColor } from '@/types/database'
import { useCreateWorkspace } from '../hooks/useWorkspaces'

const WORKSPACE_ICONS = ['🏠', '🚀', '💼', '⭐', '🎯', '💡', '🔥', '🌟', '✨', '🏢', '🎨', '🛠️']

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
  description: z.string().max(200, 'Max 200 characters').optional(),
})

type FormValues = z.infer<typeof schema>

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateWorkspaceDialog({ open, onOpenChange, onCreated }: CreateWorkspaceDialogProps) {
  const [selectedColor, setSelectedColor] = useState<WorkspaceColor>('blue')
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const createWorkspace = useCreateWorkspace()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    await createWorkspace.mutateAsync({
      name: values.name,
      description: values.description ?? null,
      icon: selectedIcon,
      color: selectedColor,
    })
    reset()
    setSelectedColor('blue')
    setSelectedIcon(null)
    onOpenChange(false)
    onCreated?.()
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
      setSelectedColor('blue')
      setSelectedIcon(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Name</Label>
            <Input
              id="ws-name"
              placeholder="e.g. Product Team"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ws-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="ws-desc"
              placeholder="What is this workspace for?"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <Label>Icon <span className="text-muted-foreground">(optional)</span></Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedIcon(null)}
                className={cn(
                  'h-9 w-9 rounded-md border text-xs flex items-center justify-center transition-colors',
                  selectedIcon === null
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50',
                )}
              >
                A
              </button>
              {WORKSPACE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={cn(
                    'h-9 w-9 rounded-md border text-lg flex items-center justify-center transition-colors',
                    selectedIcon === icon
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {WORKSPACE_COLORS.map(({ value, dotClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedColor(value)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-all',
                    dotClass,
                    selectedColor === value
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                      : 'hover:scale-105',
                  )}
                  aria-label={value}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkspace.isPending}>
              {createWorkspace.isPending ? 'Creating…' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
