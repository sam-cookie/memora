import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Mail,
  Building2,
  FileText,
  CheckSquare,
  Lightbulb,
  Calendar,
  Check,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { ROUTES } from '@/config/routes'
import { generateInitials } from '@/lib/utils'
import {
  useContact,
  useContactMeetings,
  useContactActionItems,
  useContactDecisions,
  useUpdateContact,
  useSetContactArchived,
  useDeleteContact,
} from '../hooks/useParticipants'
import type { ActionItemPriority } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const PRIORITY_CLASS: Record<ActionItemPriority, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 opacity-70">{sub}</p>}
    </Card>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, count, children }: {
  title: string
  icon: React.ElementType
  count?: number
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 bg-muted/20 border-b border-border/60">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary ml-auto">
            {count}
          </span>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ParticipantProfilePage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)

  const { data: contact, isLoading, isError } = useContact(id)
  const { data: meetings = [] } = useContactMeetings(id)

  const meetingIds = meetings.map((m) => m.id)
  const { data: actionItems = [] } = useContactActionItems(meetingIds, contact?.name ?? '')
  const { data: decisions = [] } = useContactDecisions(meetingIds, contact?.name ?? '')

  const setArchived = useSetContactArchived()
  const deleteContact = useDeleteContact()

  // Stats derived from data
  const completedActions = actionItems.filter((a) => a.completed).length
  const completionRate = actionItems.length > 0
    ? Math.round((completedActions / actionItems.length) * 100)
    : null

  // Most active month
  const monthCounts: Record<string, number> = {}
  for (const m of meetings) {
    const date = m.meeting_date ?? ''
    if (date) {
      const month = new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthCounts[month] = (monthCounts[month] ?? 0) + 1
    }
  }
  const peakMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const handleDelete = async () => {
    if (!contact) return
    await deleteContact.mutateAsync(contact.id)
    navigate(ROUTES.participants)
  }

  if (isLoading) return <ProfileSkeleton />

  if (isError || !contact) {
    return (
      <EmptyState
        icon={Users}
        title="Contact not found"
        description="This contact doesn't exist or you don't have access to it."
        className="flex-1"
      />
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.participants}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Participants
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void setArchived.mutateAsync({ id: contact.id, archived: !contact.archived })}
            disabled={setArchived.isPending}
          >
            {contact.archived
              ? <><ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />Unarchive</>
              : <><Archive className="h-3.5 w-3.5 mr-1.5" />Archive</>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
            onClick={() => void handleDelete()}
            disabled={deleteContact.isPending}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-3xl mx-auto w-full px-6 py-8 space-y-6"
      >
        {/* Contact header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 ring-2 ring-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {generateInitials(contact.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{contact.name}</h1>
              {contact.archived && (
                <Badge variant="secondary" className="text-xs">Archived</Badge>
              )}
            </div>
            {contact.company && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                {contact.company}
              </p>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {contact.email}
              </a>
            )}
            {contact.notes && (
              <p className="text-sm text-muted-foreground leading-relaxed pt-1 border-t border-border mt-2">
                {contact.notes}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Meetings" value={meetings.length} />
          <StatCard label="Action Items" value={actionItems.length} sub={completedActions > 0 ? `${completedActions} done` : undefined} />
          <StatCard
            label="Completion"
            value={completionRate !== null ? `${completionRate}%` : '—'}
            sub="of action items"
          />
          <StatCard label="Decisions" value={decisions.length} sub="mentioned in" />
        </div>

        {/* Activity insight strip */}
        {(peakMonth || meetings.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {peakMonth && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                Most active in <span className="font-semibold text-foreground ml-1">{peakMonth}</span>
              </div>
            )}
            {meetings.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                First seen <span className="font-semibold text-foreground ml-1">{formatDate(meetings[meetings.length - 1]?.meeting_date ?? null)}</span>
              </div>
            )}
            {completionRate !== null && completionRate >= 80 && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5 shrink-0" />
                High action item completion rate
              </div>
            )}
          </div>
        )}

        {/* Recent Meetings */}
        <Section icon={Calendar} title="Meetings attended" count={meetings.length}>
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No linked meetings yet.</p>
          ) : (
            <div className="space-y-2">
              {meetings.slice(0, 10).map((meeting, i) => (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={ROUTES.meeting(meeting.id)}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 hover:bg-accent hover:border-primary/20 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(meeting.meeting_date)}</p>
                    </div>
                    {meeting.duration_seconds && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {Math.round(meeting.duration_seconds / 60)}m
                      </span>
                    )}
                  </Link>
                </motion.div>
              ))}
              {meetings.length > 10 && (
                <p className="text-xs text-center text-muted-foreground pt-1">
                  +{meetings.length - 10} more meetings
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Action Items */}
        <Section icon={CheckSquare} title="Action items assigned" count={actionItems.length}>
          {actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No action items assigned to {contact.name}.</p>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 ${
                    item.completed ? 'bg-muted/30 border-border/40' : 'bg-card border-border'
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    item.completed
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border'
                  }`}>
                    {item.completed && <Check className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className={`text-sm leading-snug ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_CLASS[item.priority]}`}>
                        {capitalize(item.priority)}
                      </span>
                      <Link
                        to={ROUTES.meeting(item.meeting.id)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.meeting.title}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Section>

        {/* Decisions */}
        {decisions.length > 0 && (
          <Section icon={Lightbulb} title="Decisions mentioned in" count={decisions.length}>
            <div className="space-y-3">
              {decisions.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2"
                >
                  <p className="text-sm font-medium text-foreground leading-snug">{d.content}</p>
                  {d.context && (
                    <p className="text-xs text-muted-foreground pl-3 border-l-2 border-border leading-relaxed">{d.context}</p>
                  )}
                  <Link
                    to={ROUTES.meeting(d.meeting.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {d.meeting.title} · {formatDate(d.meeting.meeting_date)}
                  </Link>
                </motion.div>
              ))}
            </div>
          </Section>
        )}
      </motion.div>

      {/* Edit dialog — reuse the same form from ParticipantsPage */}
      {editing && contact && (
        <EditContactInline
          contact={contact}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ─── Inline edit (minimal dialog) ─────────────────────────────────────────────

function EditContactInline({ contact, onClose }: { contact: import('@/types/database').Contact; onClose: () => void }) {
  const update = useUpdateContact()
  const [name, setName] = useState(contact.name)
  const [email, setEmail] = useState(contact.email ?? '')
  const [company, setCompany] = useState(contact.company ?? '')
  const [notes, setNotes] = useState(contact.notes ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await update.mutateAsync({ id: contact.id, name, email: email || null, company: company || null, notes: notes || null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
        <h2 className="text-base font-semibold">Edit contact</h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
