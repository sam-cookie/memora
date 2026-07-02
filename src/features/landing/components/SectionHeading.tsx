import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  centered?: boolean
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = true,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(centered && 'text-center', 'mb-16', className)}>
      {eyebrow && (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-[2.25rem]">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-[17px]">
          {description}
        </p>
      )}
    </div>
  )
}
