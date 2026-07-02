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
import { Label } from '@/components/ui/label'
import { useCreateContact, useUpdateContact } from '../hooks/useParticipants'
import type { Contact } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  company: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

interface ParticipantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pass a contact to switch to edit mode */
  contact?: Contact
}

export function ParticipantFormDialog({ open, onOpenChange, contact }: ParticipantFormDialogProps) {
  const isEdit = !!contact
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const isPending = createContact.isPending || updateContact.isPending

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: contact?.name ?? '',
      email: contact?.email ?? '',
      company: contact?.company ?? '',
      notes: contact?.notes ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: contact?.name ?? '',
        email: contact?.email ?? '',
        company: contact?.company ?? '',
        notes: contact?.notes ?? '',
      })
    }
  }, [open, contact, reset])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      email: values.email || null,
      company: values.company || null,
      notes: values.notes || null,
    }

    if (isEdit && contact) {
      await updateContact.mutateAsync({ id: contact.id, ...payload })
    } else {
      await createContact.mutateAsync(payload)
    }

    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Participant' : 'New Participant'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" placeholder="Jane Smith" autoFocus {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-email">
              Email <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="p-email" type="email" placeholder="jane@company.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-company">
              Company <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input id="p-company" placeholder="Acme Corp" {...register('company')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-notes">
              Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <textarea
              id="p-notes"
              rows={3}
              placeholder="Any context about this participant…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              {...register('notes')}
            />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Participant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
