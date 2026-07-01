import { Badge } from '@/components/ui/badge'
import type { MeetingStatus } from '@/types/database'
import { Loader2, CheckCircle2, XCircle, Upload, Mic, Sparkles, Clock } from 'lucide-react'

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' | 'secondary'; icon: React.ElementType; animate?: boolean }
> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  uploading: { label: 'Uploading', variant: 'warning', icon: Upload, animate: true },
  transcribing: { label: 'Transcribing', variant: 'warning', icon: Mic, animate: true },
  analyzing: { label: 'Analyzing', variant: 'default', icon: Sparkles, animate: true },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
}

interface StatusBadgeProps {
  status: MeetingStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.animate ? Loader2 : config.icon

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  )
}
