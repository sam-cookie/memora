import { useState, useEffect } from 'react'
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
import { WORKSPACE_COLORS, type Workspace, type WorkspaceColor } from '@/types/database'
import { useUpdateWorkspace } from '../hooks/useWorkspaces'

const WORKSPACE_ICONS = ['🏠', '🚀', '💼', '⭐', '🎯', '💡', '🔥', '🌟', '✨', '🏢', '🎨', '🛠️']

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
  description: z.string().max(200, 'Max 200 characters').optional(),
})

type FormValues = z.infer<typeof schema>

interface EditWorkspaceDialogProps {
  workspace: Workspace
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditWorkspaceDialog({ workspace, open, onOpenChange }: EditWorkspaceDialogProps) {
  const [selectedColor, setSelectedColor] = useState<WorkspaceColor>(workspace.color)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(workspace.icon)
  const updateWorkspace = useUpdateWorkspace()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({ name: workspace.name, description: workspace.description ?? '' })
      setSelectedColor(workspace.color)
      setSelectedIcon(workspace.icon)
    }
  }, [open, workspace, reset])

  const onSubmit = async (values: FormValues) => {
    await updateWorkspace.mutateAsync({
      id: workspace.id,
      name: values.name,
      description: values.description ?? null,
      icon: selectedIcon,
      color: selectedColor,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="edit-ws-name">Name</Label>
            <Input id="edit-ws-name" autoFocus {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-ws-desc">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="edit-ws-desc" {...register('description')} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateWorkspace.isPending}>
              {updateWorkspace.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
