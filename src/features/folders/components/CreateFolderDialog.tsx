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
import { FormField } from '@/components/common/FormField'
import { useCreateFolder } from '../hooks/useFolders'
import { FOLDER_COLORS, type FolderColor } from '@/types/database'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Name must be under 80 characters'),
})

type FormData = z.infer<typeof schema>

interface CreateFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFolderDialog({ open, onOpenChange }: CreateFolderDialogProps) {
  const [color, setColor] = useState<FolderColor>('blue')
  const createFolder = useCreateFolder()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ name }) => {
    await createFolder.mutateAsync({ name: name.trim(), color })
    reset()
    setColor('blue')
    onOpenChange(false)
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset()
      setColor('blue')
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
          <FormField id="folder-name" label="Folder name" error={errors.name?.message} required>
            <Input
              id="folder-name"
              placeholder="e.g. Q3 Planning"
              autoFocus
              error={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Color</p>
            <div className="flex items-center gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.value}
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'h-6 w-6 rounded-full transition-all ring-2 ring-offset-2 ring-offset-background',
                    c.dotClass,
                    color === c.value ? 'ring-foreground scale-110' : 'ring-transparent hover:scale-105',
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createFolder.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createFolder.isPending}>
              {createFolder.isPending ? 'Creating…' : 'Create folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
