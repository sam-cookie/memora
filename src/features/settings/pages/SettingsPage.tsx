import { PageHeader } from '@/components/common/PageHeader'
import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Settings" description="Manage your account and preferences" icon={Settings} />
      <div className="flex-1 p-6">
        <p className="text-sm text-muted-foreground">Settings — coming soon</p>
      </div>
    </div>
  )
}
