import { Link } from 'react-router-dom'
import { MoreHorizontal, Mail, Building2, Archive, ArchiveRestore, Trash2, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, generateInitials } from '@/lib/utils'
import { useWorkspace } from '@/providers/WorkspaceProvider'
import { useSetContactArchived, useDeleteContact } from '../hooks/useParticipants'
import { ROUTES } from '@/config/routes'
import type { Contact } from '@/types/database'

interface ParticipantCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
}

export function ParticipantCard({ contact, onEdit }: ParticipantCardProps) {
  const { isAdminOrOwner } = useWorkspace()
  const setArchived = useSetContactArchived()
  const deleteContact = useDeleteContact()

  const initials = generateInitials(contact.name)

  return (
    <Card
      className={cn(
        'group p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:border-primary/20',
        contact.archived && 'opacity-60',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <Link to={ROUTES.participant(contact.id)} className="shrink-0" tabIndex={-1}>
          <Avatar className="h-10 w-10 ring-1 ring-border hover:ring-primary/40 transition-all">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={ROUTES.participant(contact.id)} className="hover:text-primary transition-colors">
              <h3 className="text-sm font-semibold truncate leading-tight">{contact.name}</h3>
            </Link>
            {contact.archived && (
              <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
                Archived
              </span>
            )}
          </div>
          {contact.company && (
            <p className="text-xs text-muted-foreground truncate leading-tight flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3 shrink-0" />
              {contact.company}
            </p>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              aria-label="Participant options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onSelect={() => onEdit(contact)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onSelect={() => void setArchived.mutateAsync({ id: contact.id, archived: !contact.archived })}
            >
              {contact.archived ? (
                <>
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </>
              )}
            </DropdownMenuItem>
            {isAdminOrOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onSelect={() => void deleteContact.mutateAsync(contact.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email */}
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="h-3 w-3 shrink-0" />
          {contact.email}
        </a>
      )}

      {/* Notes preview */}
      {contact.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed border-t border-border pt-2">
          {contact.notes}
        </p>
      )}
    </Card>
  )
}
