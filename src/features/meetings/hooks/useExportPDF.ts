import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { MeetingPDFDocument } from '../components/MeetingPDFDocument'
import type { Meeting, ActionItem, KeyDecision, Risk, FollowUpQuestion } from '@/types/database'

interface ExportPDFArgs {
  meeting: Meeting
  actionItems: ActionItem[]
  decisions: KeyDecision[]
  risks: Risk[]
  questions: FollowUpQuestion[]
}

export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false)

  async function exportPDF(args: ExportPDFArgs) {
    setIsExporting(true)
    try {
      const element = createElement(MeetingPDFDocument, args)
      const blob = await pdf(element).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const slug = args.meeting.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
      a.href = url
      a.download = `${slug}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportPDF, isExporting }
}
