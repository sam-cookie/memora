import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, GripHorizontal, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat } from '../hooks/useChat'
import { useDragResize, type ResizeDir } from '../hooks/useDragResize'
import type { ToolHandlers } from '../hooks/useActionItemTools'
import { MemoAvatar } from './MemoAvatar'
import { ChatMessage } from './ChatMessage'

interface ChatPanelProps {
  contextString: string
  meetingTitle?: string | undefined
  toolHandlers?: ToolHandlers
  onClose: () => void
}

const CURSOR: Record<ResizeDir, string> = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  nw: 'nwse-resize', se: 'nwse-resize',
}

interface ResizeHandleProps {
  dir: ResizeDir
  onMouseDown: (e: React.MouseEvent) => void
}

function ResizeHandle({ dir, onMouseDown }: ResizeHandleProps) {
  const base = 'absolute z-10 select-none'

  const style: Record<ResizeDir, string> = {
    n:  'top-0 left-3 right-3 h-1.5',
    s:  'bottom-0 left-3 right-3 h-1.5',
    e:  'right-0 top-3 bottom-3 w-1.5',
    w:  'left-0 top-3 bottom-3 w-1.5',
    ne: 'top-0 right-0 h-3 w-3',
    nw: 'top-0 left-0 h-3 w-3',
    se: 'bottom-0 right-0 h-4 w-4',
    sw: 'bottom-0 left-0 h-3 w-3',
  }

  return (
    <div
      className={cn(base, style[dir])}
      style={{ cursor: CURSOR[dir] }}
      onMouseDown={onMouseDown}
    >
      {dir === 'se' && (
        <svg
          viewBox="0 0 10 10"
          className="absolute bottom-1 right-1 h-2.5 w-2.5 text-muted-foreground/40"
          aria-hidden
        >
          <line x1="2" y1="10" x2="10" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="10" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

const INITIAL_W = 380
const INITIAL_H = 520

export function ChatPanel({ contextString, meetingTitle, toolHandlers, onClose }: ChatPanelProps) {
  const { pos, size, startDrag, startResize } = useDragResize(INITIAL_W, INITIAL_H)
  const { messages, isStreaming, sendMessage, clearMessages } = useChat(toolHandlers)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    void sendMessage(input, contextString)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isEmpty = messages.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 50,
        transformOrigin: 'bottom right',
      }}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-popover"
    >
      {/* Resize handles */}
      {(['n','s','e','w','ne','nw','se','sw'] as ResizeDir[]).map((dir) => (
        <ResizeHandle key={dir} dir={dir} onMouseDown={startResize(dir)} />
      ))}

      {/* Header — drag zone */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        {/* Drag handle */}
        <div
          onMouseDown={startDrag}
          className="flex min-w-0 flex-1 cursor-grab items-center gap-3 active:cursor-grabbing"
        >
          <MemoAvatar size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-card-foreground">Memo</p>
            <p className="truncate text-xs text-muted-foreground">
              {meetingTitle ? `Scoped to: ${meetingTitle}` : 'All meetings'}
            </p>
          </div>
          <GripHorizontal className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              title="Clear conversation"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 px-6 py-4 text-center">
            <MemoAvatar size="md" className="h-12 w-12" />
            <div>
              <p className="text-sm font-medium text-card-foreground">
                {meetingTitle ? `Ask about "${meetingTitle}"` : 'Ask about your meetings'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                I can summarize meetings, surface action items, list decisions, identify blockers, and more.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {(meetingTitle
                ? ['Summarize this meeting', 'List action items', 'What decisions were made?']
                : ['What did we decide last week?', 'Any overdue action items?', 'Any blockers recently?']
              ).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt, contextString)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages
            .filter((msg) => msg.role !== 'tool')
            .map((msg, i, arr) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === arr.length - 1}
              />
            ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-3 py-3">
        <div className="flex items-end gap-2 rounded-xl bg-muted px-3 py-2.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Memo anything…"
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none disabled:opacity-50"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
              input.trim() && !isStreaming
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-muted-foreground/20 text-muted-foreground',
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
