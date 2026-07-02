import { useEffect } from 'react'
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
import { useRenameFolder } from '../hooks/useFolders'
import type { Folder } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Name must be under 80 characters'),
})

type FormData = z.infer<typeof schema>

interface RenameFolderDialogProps {
  folder: Folder
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameFolderDialog({ folder, open, onOpenChange }: RenameFolderDialogProps) {
  const renameFolder = useRenameFolder()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: folder.name },
  })

  useEffect(() => {
    if (open) reset({ name: folder.name })
  }, [open, folder.name, reset])

  const onSubmit = handleSubmit(async ({ name }) => {
    await renameFolder.mutateAsync({ id: folder.id, name: name.trim() })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-1" noValidate>
          <FormField id="rename-folder" label="Folder name" error={errors.name?.message} required>
            <Input
              id="rename-folder"
              autoFocus
              error={!!errors.name}
              {...register('name')}
            />
          </FormField>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renameFolder.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={renameFolder.isPending}>
              {renameFolder.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
