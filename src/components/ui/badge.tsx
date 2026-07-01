import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-primary/15 text-primary',
        secondary: 'border border-border bg-secondary text-secondary-foreground',
        destructive: 'border border-transparent bg-destructive/15 text-destructive',
        outline: 'border border-border text-foreground',
        success: 'border border-transparent bg-success/15 text-success',
        warning: 'border border-transparent bg-warning/15 text-warning',
        info: 'border border-transparent bg-info/15 text-info',
        glass: 'glass text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-primary': variant === 'default' || !variant,
          'bg-destructive': variant === 'destructive',
          'bg-success': variant === 'success',
          'bg-warning': variant === 'warning',
          'bg-info': variant === 'info',
          'bg-muted-foreground': variant === 'secondary' || variant === 'outline',
        })} />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
