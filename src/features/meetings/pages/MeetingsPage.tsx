import { PageHeader } from '@/components/common/PageHeader'
import { Mic } from 'lucide-react'

export function MeetingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Meetings"
        description="All your recorded and processed meetings"
        icon={Mic}
      />
      <div className="flex-1 p-6">
        <p className="text-sm text-muted-foreground">Meetings list — coming soon</p>
      </div>
    </div>
  )
}
