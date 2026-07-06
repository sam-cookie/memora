import { cn } from '@/lib/utils'
import memoraLogo from '@/assets/memora.png'

interface MemoAvatarProps {
  size?: 'sm' | 'md'
  className?: string
}

export function MemoAvatar({ size = 'md', className }: MemoAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm',
        size === 'sm' && 'h-6 w-6',
        size === 'md' && 'h-8 w-8',
        className,
      )}
    >
      <img
        src={memoraLogo}
        alt="Memo"
        className={cn(
          'object-cover',
          size === 'sm' && 'h-4 w-4',
          size === 'md' && 'h-5 w-5',
        )}
      />
    </div>
  )
}
