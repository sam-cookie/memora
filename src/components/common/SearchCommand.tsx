import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'

export function SearchCommand() {
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        navigate(ROUTES.search)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [navigate])

  const handleClick = () => {
    navigate(ROUTES.search)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 text-sm text-muted-foreground',
        'hover:border-border/80 hover:bg-surface-2 hover:text-foreground',
        'transition-all duration-150 cursor-pointer',
      )}
      aria-label="Search meetings (Ctrl+K)"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">Search meetings...</span>
      <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-medium sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
