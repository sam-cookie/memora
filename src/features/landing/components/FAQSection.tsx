import { motion } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SectionHeading } from './SectionHeading'

const FAQ_ITEMS = [
  {
    question: 'What types of audio and video can I upload?',
    answer:
      "Memora accepts most common audio formats (MP3, M4A, WAV, FLAC) and video formats (MP4, MOV, WEBM). You can also paste a raw transcript directly if you already have one. There's no need to export from a specific platform.",
  },
  {
    question: 'How accurate is the AI transcription?',
    answer:
      'Memora uses OpenAI Whisper for transcription, which achieves near human-level accuracy on clear audio. For best results, use recordings with minimal background noise and distinct speakers. Technical vocabulary and acronyms are handled well across most domains.',
  },
  {
    question: 'Is my meeting data private and secure?',
    answer:
      'Your data is encrypted in transit and at rest. Meetings are scoped to your workspace and never shared with other organizations. We do not use your recordings or transcripts to train AI models. Enterprise plans include SAML SSO and dedicated data residency options.',
  },
  {
    question: 'How does the AI summary and extraction work?',
    answer:
      'After transcription, Memora sends the transcript to an AI model that identifies the meeting structure and extracts summaries, key decisions, action items, risks, and follow-up questions. The extraction is structured and deterministic — you get consistent output every time, not freeform prose.',
  },
  {
    question: 'Can I collaborate with my team on meeting notes?',
    answer:
      'Yes. Any workspace member can view, comment, and act on meetings within that workspace. Action items can be assigned to any team member. You can also share individual meetings with external stakeholders via a secure link.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'You retain access to your data for 30 days after cancellation and can export everything in that window. After 30 days, your workspace data is deleted from our servers. We never hold your data hostage.',
  },
  {
    question: 'Do you offer a free plan?',
    answer:
      'Yes. The Free plan includes 5 meetings per month, AI summaries, action item extraction, and 30 days of meeting history. No credit card required. You can upgrade to Pro or Team at any time.',
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Common questions"
          description="Everything you need to know before getting started."
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-[14.5px] font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[14px]">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
