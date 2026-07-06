import { useState } from 'react'
import { Packer } from 'docx'
import { buildMeetingDocx } from '../lib/buildMeetingDocx'
import type { Meeting, ActionItem, KeyDecision, Risk, FollowUpQuestion } from '@/types/database'

interface ExportDocxArgs {
  meeting: Meeting
  actionItems: ActionItem[]
  decisions: KeyDecision[]
  risks: Risk[]
  questions: FollowUpQuestion[]
}

export function useExportDocx() {
  const [isExporting, setIsExporting] = useState(false)

  async function exportDocx(args: ExportDocxArgs) {
    setIsExporting(true)
    try {
      const doc = buildMeetingDocx(args)
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const slug = args.meeting.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
      a.href = url
      a.download = `${slug}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportDocx, isExporting }
}
