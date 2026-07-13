import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage as ChatMessageType } from '../types'
import { MemoAvatar } from './MemoAvatar'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
  className?: string
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  )
}

function renderContent(text: string): ReactNode {
  const blocks = text.split(/\n\n+/)
  return blocks.map((block, blockIdx) => {
    const lines = block.split('\n').filter((l) => l.trim())

    const isBulletList = lines.every((l) => /^[•\-*] /.test(l.trim()))
    if (isBulletList) {
      return (
        <ul key={blockIdx} className={cn('space-y-0.5 pl-1', blockIdx > 0 && 'mt-2')}>
          {lines.map((item, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
              <span>{renderInline(item.replace(/^[•\-*] /, ''))}</span>
            </li>
          ))}
        </ul>
      )
    }

    return (
      <p key={blockIdx} className={cn(blockIdx > 0 && 'mt-2')}>
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {renderInline(line)}
          </span>
        ))}
      </p>
    )
  })
}

export function ChatMessage({ message, isStreaming, className }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className={cn('flex justify-end px-4', className)}>
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-2.5 px-4', className)}>
      <MemoAvatar size="sm" className="mt-0.5 shrink-0" />
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
        {message.loading ? (
          // Tool is executing — spinner + label
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span className="italic">{message.content}</span>
          </span>
        ) : message.content ? (
          renderContent(message.content)
        ) : isStreaming ? (
          // Waiting for first token
          <span className="inline-flex items-center gap-1 py-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40" />
          </span>
        ) : null}
      </div>
    </div>
  )
}
